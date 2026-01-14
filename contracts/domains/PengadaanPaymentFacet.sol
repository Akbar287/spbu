// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";
import "../structs/ViewStructs.sol";

/**
 * @title PengadaanPaymentFacet
 * @notice Pembayaran and FilePembayaran CRUD
 * @dev Split from PengadaanFacet to reduce contract size below 24KB
 */
contract PengadaanPaymentFacet {
    event PembayaranCreated(
        uint256 indexed id,
        uint256 indexed rencanaPembelianId,
        uint256 createdAt
    );
    event PembayaranUpdated(uint256 indexed pembayaranId, uint256 timestamp);
    event PembayaranDeleted(uint256 indexed id, uint256 deletedAt);
    event PembayaranKonfirmasiAdmin(
        uint256 indexed id,
        address indexed konfirmasiBy,
        uint256 konfirmasiAt
    );
    event PembayaranKonfirmasiDirektur(
        uint256 indexed id,
        address indexed konfirmasiBy,
        uint256 konfirmasiAt
    );
    event FilePembayaranCreated(
        uint256 indexed id,
        uint256 indexed pembayaranId,
        uint256 createdAt
    );
    event FilePembayaranDeleted(uint256 indexed id, uint256 deletedAt);
    // Helper to convert uint256 to string
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
    function _onlyAdmin() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        require(ac.roles[keccak256("ADMIN_ROLE")][msg.sender], "Admin only");
    }

    function _onlyDirektur() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        require(
            ac.roles[keccak256("DIREKTUR_ROLE")][msg.sender],
            "Direktur only"
        );
    }

    function _onlyAdminOrOperator() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        require(
            ac.roles[keccak256("ADMIN_ROLE")][msg.sender] ||
                ac.roles[keccak256("OPERATOR_ROLE")][msg.sender],
            "Admin or Operator only"
        );
    }

    function _removeFromArray(uint256[] storage arr, uint256 _id) internal {
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == _id) {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                break;
            }
        }
    }

    function createFilePembayaran(
        uint256 _pembayaranId,
        string calldata _ipfsHash,
        string calldata _namaFile,
        string calldata _namaDokumen,
        string calldata _mimeType,
        uint256 _fileSize
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        require(
            s.pembayaranList[_pembayaranId].pembayaranId != 0,
            "Pembayaran not found"
        );

        s.filePembayaranCounter++;
        uint256 newId = s.filePembayaranCounter;
        s.filePembayaranList[newId] = AppStorage.FilePembayaran({
            filePembayaranId: newId,
            pembayaranId: _pembayaranId,
            ipfsHash: _ipfsHash,
            namaFile: _namaFile,
            namaDokumen: _namaDokumen,
            mimeType: _mimeType,
            fileSize: _fileSize,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.pembayaranToFilePembayaranIds[_pembayaranId].push(newId);
        emit FilePembayaranCreated(newId, _pembayaranId, block.timestamp);
        return newId;
    }

    function deleteFilePembayaran(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        AppStorage.FilePembayaran storage data = s.filePembayaranList[_id];
        require(data.filePembayaranId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(
            s.pembayaranToFilePembayaranIds[data.pembayaranId],
            _id
        );
        emit FilePembayaranDeleted(_id, block.timestamp);
    }

    function getFilePembayaranByPembayaran(
        uint256 _pembayaranId
    ) external view returns (AppStorage.FilePembayaran[] memory) {
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        uint256[] memory ids = s.pembayaranToFilePembayaranIds[_pembayaranId];
        AppStorage.FilePembayaran[]
            memory result = new AppStorage.FilePembayaran[](ids.length);
        for (uint256 i = 0; i < ids.length; i++)
            result[i] = s.filePembayaranList[ids[i]];
        return result;
    }

    function getAllMs2ByProduk()
        external
        view
        returns (ProdukMenuMs2View[] memory)
    {
        AppStorage.InventoryStorage storage inv = AppStorage.inventoryStorage();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        AppStorage.LogistikStorage storage log = AppStorage.logistikStorage();

        // First, find the statusPurchaseId for 'MS2'
        uint256 ms2StatusId = 0;
        for (uint256 i = 1; i <= s.statusPurchaseCounter; i++) {
            if (
                !s.statusPurchaseList[i].deleted &&
                keccak256(bytes(s.statusPurchaseList[i].namaStatus)) ==
                keccak256(bytes("MS2"))
            ) {
                ms2StatusId = s.statusPurchaseList[i].statusPurchaseId;
                break;
            }
        }

        // If no MS2 status found, return empty
        if (ms2StatusId == 0) {
            return new ProdukMenuMs2View[](0);
        }

        // Count products with pending MS2 first
        uint256 count = 0;
        for (uint256 i = 1; i <= inv.produkCounter; i++) {
            if (inv.produkList[i].deleted) continue;
            uint256[] memory detailIds = s.produkToDetailRencanaPembelianIds[i];
            for (uint256 j = 0; j < detailIds.length; j++) {
                AppStorage.DetailRencanaPembelian storage detail = s
                    .detailRencanaPembelianList[detailIds[j]];
                // Check: not deleted, ms2By not set, and related RencanaPembelian has MS2 status
                // Also check: detailRencanaPembelianId is NOT already in detailRencanaPembelianToDetailRencanaPembelianMs2Ids
                if (
                    !detail.deleted &&
                    detail.ms2By == address(0) &&
                    log
                        .detailRencanaPembelianToDetailRencanaPembelianMs2Ids[
                            detailIds[j]
                        ]
                        .length ==
                    0
                ) {
                    AppStorage.RencanaPembelian storage rp = s
                        .rencanaPembelianList[detail.rencanaPembelianId];
                    if (!rp.deleted && rp.statusPurchaseId == ms2StatusId) {
                        count++;
                        break; // Only count product once
                    }
                }
            }
        }

        ProdukMenuMs2View[] memory result = new ProdukMenuMs2View[](count);
        uint256 idx = 0;

        for (uint256 i = 1; i <= inv.produkCounter; i++) {
            if (inv.produkList[i].deleted) continue;

            uint256 totalJumlah = 0;
            uint256 totalPembelian = 0;
            uint256[] memory detailIds = s.produkToDetailRencanaPembelianIds[i];

            for (uint256 j = 0; j < detailIds.length; j++) {
                AppStorage.DetailRencanaPembelian storage detail = s
                    .detailRencanaPembelianList[detailIds[j]];
                // Check: not deleted, ms2By not set, and related RencanaPembelian has MS2 status
                // Also check: detailRencanaPembelianId is NOT already in detailRencanaPembelianToDetailRencanaPembelianMs2Ids
                if (
                    !detail.deleted &&
                    detail.ms2By == address(0) &&
                    log
                        .detailRencanaPembelianToDetailRencanaPembelianMs2Ids[
                            detailIds[j]
                        ]
                        .length ==
                    0
                ) {
                    AppStorage.RencanaPembelian storage rp = s
                        .rencanaPembelianList[detail.rencanaPembelianId];
                    if (!rp.deleted && rp.statusPurchaseId == ms2StatusId) {
                        totalJumlah++; // Count of DetailRencanaPembelian records
                        totalPembelian += detail.jumlah; // Sum of stok (accumulated jumlah)
                    }
                }
            }

            if (totalPembelian > 0) {
                result[idx] = ProdukMenuMs2View({
                    produkId: i,
                    namaProduk: inv.produkList[i].namaProduk,
                    totalJumlah: totalJumlah,
                    totalPembelian: totalPembelian
                });
                idx++;
            }
        }

        return result;
    }

    function getAllMs2ByProdukId(
        uint256 offset,
        uint256 limit,
        uint256 _produkId
    ) external view returns (ProdukMenuMs2ViewByProdukId memory) {
        AppStorage.InventoryStorage storage inv = AppStorage.inventoryStorage();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        AppStorage.LogistikStorage storage log = AppStorage.logistikStorage();

        // Find MS2 status ID
        uint256 ms2StatusId = 0;
        for (uint256 i = 1; i <= s.statusPurchaseCounter; i++) {
            if (
                !s.statusPurchaseList[i].deleted &&
                keccak256(bytes(s.statusPurchaseList[i].namaStatus)) ==
                keccak256(bytes("MS2"))
            ) {
                ms2StatusId = s.statusPurchaseList[i].statusPurchaseId;
                break;
            }
        }

        // Return empty struct if no MS2 status found
        if (ms2StatusId == 0) {
            ProdukMenuMs2ViewByProdukIdPembelian[]
                memory emptyArr = new ProdukMenuMs2ViewByProdukIdPembelian[](0);
            return
                ProdukMenuMs2ViewByProdukId({
                    produkId: _produkId,
                    namaProduk: "",
                    totalJumlah: "0",
                    produk: emptyArr
                });
        }

        uint256[] memory detailIds = s.produkToDetailRencanaPembelianIds[
            _produkId
        ];

        // First pass: count ALL valid items (no break!)
        uint256 totalCount = 0;
        for (uint256 j = 0; j < detailIds.length; j++) {
            AppStorage.DetailRencanaPembelian storage detail = s
                .detailRencanaPembelianList[detailIds[j]];
            // Check: not deleted, ms2By not set, RencanaPembelian has MS2 status
            // Also check: detailRencanaPembelianId is NOT already in detailRencanaPembelianToDetailRencanaPembelianMs2Ids
            if (
                !detail.deleted &&
                detail.ms2By == address(0) &&
                log
                    .detailRencanaPembelianToDetailRencanaPembelianMs2Ids[
                        detailIds[j]
                    ]
                    .length ==
                0
            ) {
                AppStorage.RencanaPembelian storage rp = s.rencanaPembelianList[
                    detail.rencanaPembelianId
                ];
                if (!rp.deleted && rp.statusPurchaseId == ms2StatusId) {
                    totalCount++;
                }
            }
        }

        // Calculate paginated result size
        uint256 start = offset < totalCount ? offset : totalCount;
        uint256 end = (offset + limit) < totalCount
            ? (offset + limit)
            : totalCount;
        uint256 resultSize = end > start ? end - start : 0;

        ProdukMenuMs2ViewByProdukIdPembelian[]
            memory result = new ProdukMenuMs2ViewByProdukIdPembelian[](
                resultSize
            );

        if (resultSize == 0) {
            return
                ProdukMenuMs2ViewByProdukId({
                    produkId: _produkId,
                    namaProduk: inv.produkList[_produkId].namaProduk,
                    totalJumlah: _uint2str(totalCount),
                    produk: result
                });
        }

        // Second pass: populate with pagination
        uint256 validIndex = 0;
        uint256 resultIndex = 0;

        for (
            uint256 j = 0;
            j < detailIds.length && resultIndex < resultSize;
            j++
        ) {
            AppStorage.DetailRencanaPembelian storage detail = s
                .detailRencanaPembelianList[detailIds[j]];
            // Check: not deleted, ms2By not set, RencanaPembelian has MS2 status
            // Also check: detailRencanaPembelianId is NOT already in detailRencanaPembelianToDetailRencanaPembelianMs2Ids
            if (
                !detail.deleted &&
                detail.ms2By == address(0) &&
                log
                    .detailRencanaPembelianToDetailRencanaPembelianMs2Ids[
                        detailIds[j]
                    ]
                    .length ==
                0
            ) {
                AppStorage.RencanaPembelian storage rp = s.rencanaPembelianList[
                    detail.rencanaPembelianId
                ];
                if (!rp.deleted && rp.statusPurchaseId == ms2StatusId) {
                    if (validIndex >= offset) {
                        result[
                            resultIndex
                        ] = ProdukMenuMs2ViewByProdukIdPembelian({
                            rencanaPembelianId: detail.rencanaPembelianId,
                            detailRencanaPembelianId: detail
                                .detailRencanaPembelianId,
                            tanggalPembelian: rp.tanggalPembelian,
                            kodePembelian: rp.kodePembelian,
                            totalStok: detail.jumlah
                        });
                        resultIndex++;
                    }
                    validIndex++;
                }
            }
        }

        return
            ProdukMenuMs2ViewByProdukId({
                produkId: _produkId,
                namaProduk: inv.produkList[_produkId].namaProduk,
                totalJumlah: _uint2str(totalCount),
                produk: result
            });
    }

    function getCounterMs2() external view returns (uint256) {
        AppStorage.LogistikStorage storage log = AppStorage.logistikStorage();
        uint256 count = 0;
        for (uint256 i = 1; i <= log.ms2Counter; i++) {
            if (!log.ms2List[i].deleted && !log.ms2List[i].konfirmasiSelesai)
                count++;
        }
        return count;
    }

    function getAllMs2(
        uint256 offset,
        uint256 limit
    ) external view returns (Ms2View[] memory) {
        AppStorage.LogistikStorage storage log = AppStorage.logistikStorage();
        AppStorage.InventoryStorage storage inv = AppStorage.inventoryStorage();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();

        // Count non-deleted and non-confirmed items first
        uint256 count = 0;
        for (uint256 i = 1; i <= log.ms2Counter; i++) {
            if (!log.ms2List[i].deleted && !log.ms2List[i].konfirmasiSelesai)
                count++;
        }

        // Apply pagination
        uint256 start = offset > count ? count : offset;
        uint256 end = (start + limit) > count ? count : (start + limit);
        uint256 resultSize = end - start;

        Ms2View[] memory result = new Ms2View[](resultSize);
        uint256 idx = 0;
        uint256 skipped = 0;

        for (uint256 i = 1; i <= log.ms2Counter && idx < resultSize; i++) {
            if (!log.ms2List[i].deleted && !log.ms2List[i].konfirmasiSelesai) {
                if (skipped < offset) {
                    skipped++;
                    continue;
                }

                // Build produk array
                uint256 detailCount = log
                    .ms2IdToDetailRencanaPembelianMs2Ids[i]
                    .length;
                ProdukMenuMs2View[] memory produk = new ProdukMenuMs2View[](
                    detailCount
                );

                for (uint256 j = 0; j < detailCount; j++) {
                    uint256 detailMs2Id = log
                        .ms2IdToDetailRencanaPembelianMs2Ids[i][j];
                    AppStorage.DetailRencanaPembelianMs2 storage detailMs2 = log
                        .detailRencanaPembelianMs2List[detailMs2Id];
                    AppStorage.DetailRencanaPembelian storage detailRP = s
                        .detailRencanaPembelianList[
                            detailMs2.detailRencanaPembelianId
                        ];

                    produk[j] = ProdukMenuMs2View({
                        produkId: detailRP.produkId,
                        namaProduk: inv
                            .produkList[detailRP.produkId]
                            .namaProduk,
                        totalJumlah: detailRP.jumlah,
                        totalPembelian: 1
                    });
                }

                result[idx] = Ms2View({
                    ms2Id: log.ms2List[i].ms2Id,
                    tanggal: log.ms2List[i].tanggal,
                    konfirmasiBy: log.ms2List[i].konfirmasiBy,
                    produk: produk,
                    totalProduk: detailCount,
                    createdAt: log.ms2List[i].createdAt,
                    updatedAt: log.ms2List[i].updatedAt,
                    deleted: log.ms2List[i].deleted
                });
                idx++;
            }
        }
        return result;
    }

    function getAllProdukWithDetailRencanaPembelian()
        external
        view
        returns (ProdukMenuMs2WithDetailRencanaPembelian[] memory)
    {
        AppStorage.InventoryStorage storage inv = AppStorage.inventoryStorage();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        AppStorage.LogistikStorage storage log = AppStorage.logistikStorage();

        // First, find the statusPurchaseId for 'MS2'
        uint256 ms2StatusId = 0;
        for (uint256 i = 1; i <= s.statusPurchaseCounter; i++) {
            if (
                !s.statusPurchaseList[i].deleted &&
                keccak256(bytes(s.statusPurchaseList[i].namaStatus)) ==
                keccak256(bytes("MS2"))
            ) {
                ms2StatusId = s.statusPurchaseList[i].statusPurchaseId;
                break;
            }
        }

        // If no MS2 status found, return empty
        if (ms2StatusId == 0) {
            return new ProdukMenuMs2WithDetailRencanaPembelian[](0);
        }

        // Count ALL DetailRencanaPembelian with pending MS2
        uint256 count = 0;
        for (uint256 i = 1; i <= inv.produkCounter; i++) {
            if (inv.produkList[i].deleted) continue;
            uint256[] memory detailIds = s.produkToDetailRencanaPembelianIds[i];
            for (uint256 j = 0; j < detailIds.length; j++) {
                AppStorage.DetailRencanaPembelian storage detail = s
                    .detailRencanaPembelianList[detailIds[j]];
                // Check: not deleted, ms2By not set, and related RencanaPembelian has MS2 status
                // Also check: detailRencanaPembelianId is NOT already in detailRencanaPembelianToDetailRencanaPembelianMs2Ids
                if (
                    !detail.deleted &&
                    detail.ms2By == address(0) &&
                    log
                        .detailRencanaPembelianToDetailRencanaPembelianMs2Ids[
                            detailIds[j]
                        ]
                        .length ==
                    0
                ) {
                    AppStorage.RencanaPembelian storage rp = s
                        .rencanaPembelianList[detail.rencanaPembelianId];
                    if (!rp.deleted && rp.statusPurchaseId == ms2StatusId) {
                        count++;
                        // No break - count ALL items
                    }
                }
            }
        }

        ProdukMenuMs2WithDetailRencanaPembelian[]
            memory result = new ProdukMenuMs2WithDetailRencanaPembelian[](
                count
            );
        uint256 idx = 0;

        for (uint256 i = 1; i <= inv.produkCounter; i++) {
            if (inv.produkList[i].deleted) continue;
            uint256[] memory detailIds = s.produkToDetailRencanaPembelianIds[i];
            for (uint256 j = 0; j < detailIds.length; j++) {
                AppStorage.DetailRencanaPembelian storage detail = s
                    .detailRencanaPembelianList[detailIds[j]];
                // Check: not deleted, ms2By not set, and related RencanaPembelian has MS2 status
                // Also check: detailRencanaPembelianId is NOT already in detailRencanaPembelianToDetailRencanaPembelianMs2Ids
                if (
                    !detail.deleted &&
                    detail.ms2By == address(0) &&
                    log
                        .detailRencanaPembelianToDetailRencanaPembelianMs2Ids[
                            detailIds[j]
                        ]
                        .length ==
                    0
                ) {
                    AppStorage.RencanaPembelian storage rp = s
                        .rencanaPembelianList[detail.rencanaPembelianId];
                    if (!rp.deleted && rp.statusPurchaseId == ms2StatusId) {
                        result[idx] = ProdukMenuMs2WithDetailRencanaPembelian({
                            produkId: i,
                            detailRencanaPembelianId: detailIds[j],
                            namaProduk: inv.produkList[i].namaProduk,
                            jumlah: detail.jumlah,
                            tanggalPembelian: rp.tanggalPembelian,
                            kodePembelian: rp.kodePembelian
                        });
                        idx++;
                        // No break - add ALL items
                    }
                }
            }
        }

        return result;
    }

    // ==================== Pembayaran ====================

    function getCountAllPembayaran(
        uint256 rencanaPembelianId
    ) external view returns (uint256) {
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();

        if (rencanaPembelianId == 0) {
            // Count all pembayaran
            uint256 count = 0;
            for (uint256 i = 1; i <= s.pembayaranCounter; i++) {
                if (
                    !s.pembayaranList[i].deleted &&
                    s.pembayaranList[i].pembayaranId != 0
                ) {
                    count++;
                }
            }
            return count;
        } else {
            // Count pembayaran for specific rencanaPembelianId
            uint256[] memory ids = s.rencanaPembelianToPembayaranIds[
                rencanaPembelianId
            ];
            uint256 count = 0;
            for (uint256 i = 0; i < ids.length; i++) {
                AppStorage.Pembayaran storage p = s.pembayaranList[ids[i]];
                if (!p.deleted && p.pembayaranId != 0) {
                    count++;
                }
            }
            return count;
        }
    }

    function getAllPembayaran(
        uint256 offset,
        uint256 limit,
        uint256 rencanaPembelianId
    ) external view returns (AppStorage.Pembayaran[] memory) {
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();

        // Collect valid IDs
        uint256[] memory validIds;
        uint256 validCount = 0;

        if (rencanaPembelianId == 0) {
            // Get all pembayaran
            validIds = new uint256[](s.pembayaranCounter);
            for (uint256 i = 1; i <= s.pembayaranCounter; i++) {
                if (
                    !s.pembayaranList[i].deleted &&
                    s.pembayaranList[i].pembayaranId != 0
                ) {
                    validIds[validCount] = i;
                    validCount++;
                }
            }
        } else {
            // Get pembayaran for specific rencanaPembelianId
            uint256[] memory ids = s.rencanaPembelianToPembayaranIds[
                rencanaPembelianId
            ];
            validIds = new uint256[](ids.length);
            for (uint256 i = 0; i < ids.length; i++) {
                AppStorage.Pembayaran storage p = s.pembayaranList[ids[i]];
                if (!p.deleted && p.pembayaranId != 0) {
                    validIds[validCount] = ids[i];
                    validCount++;
                }
            }
        }

        // Pagination
        if (offset >= validCount) {
            return new AppStorage.Pembayaran[](0);
        }
        uint256 end = offset + limit;
        if (end > validCount) end = validCount;
        uint256 resultSize = end - offset;

        AppStorage.Pembayaran[] memory result = new AppStorage.Pembayaran[](
            resultSize
        );
        for (uint256 i = 0; i < resultSize; i++) {
            result[i] = s.pembayaranList[validIds[offset + i]];
        }

        return result;
    }

    function getPembayaranById(
        uint256 pembayaranId
    ) external view returns (AppStorage.Pembayaran memory) {
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        return s.pembayaranList[pembayaranId];
    }

    function createPembayaran(
        uint256 _rencanaPembelianId,
        string memory _noCekBg,
        string memory _noRekening,
        string memory _namaRekening,
        string memory _namaBank,
        uint256 _totalBayar
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();

        // Validate rencanaPembelian exists
        require(
            s.rencanaPembelianList[_rencanaPembelianId].rencanaPembelianId !=
                0 &&
                !s.rencanaPembelianList[_rencanaPembelianId].deleted,
            "Not found"
        );

        s.pembayaranCounter++;
        uint256 newId = s.pembayaranCounter;

        AppStorage.Pembayaran storage p = s.pembayaranList[newId];
        p.pembayaranId = newId;
        p.rencanaPembelianId = _rencanaPembelianId;
        p.walletMember = msg.sender;
        p.noCekBg = _noCekBg;
        p.noRekening = _noRekening;
        p.namaRekening = _namaRekening;
        p.namaBank = _namaBank;
        p.totalBayar = _totalBayar;
        p.konfirmasiAdmin = false;
        p.konfirmasiDirektur = false;
        p.createdAt = block.timestamp;
        p.updatedAt = block.timestamp;
        p.deleted = false;

        // Add to relations
        s.rencanaPembelianToPembayaranIds[_rencanaPembelianId].push(newId);
        s.walletToPembayaranIds[msg.sender].push(newId);

        emit PembayaranCreated(newId, _rencanaPembelianId, block.timestamp);

        return newId;
    }

    function updatePembayaran(
        uint256 _pembayaranId,
        string memory _noCekBg,
        string memory _noRekening,
        string memory _namaRekening,
        string memory _namaBank,
        uint256 _totalBayar
    ) external {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();

        AppStorage.Pembayaran storage p = s.pembayaranList[_pembayaranId];
        require(p.pembayaranId != 0 && !p.deleted, "Not found");

        p.noCekBg = _noCekBg;
        p.noRekening = _noRekening;
        p.namaRekening = _namaRekening;
        p.namaBank = _namaBank;
        p.totalBayar = _totalBayar;
        p.updatedAt = block.timestamp;

        emit PembayaranUpdated(_pembayaranId, block.timestamp);
    }

    function deletePembayaran(uint256 _pembayaranId) external {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();

        AppStorage.Pembayaran storage p = s.pembayaranList[_pembayaranId];
        require(p.pembayaranId != 0 && !p.deleted, "Not found");

        p.deleted = true;
        p.updatedAt = block.timestamp;

        emit PembayaranDeleted(_pembayaranId, block.timestamp);
    }
}
