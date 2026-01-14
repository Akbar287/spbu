// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";
import "../structs/ViewStructs.sol";

/**
 * @title PengadaanCoreFacet
 * @notice StatusPurchase, RencanaPembelian, DetailRencanaPembelian CRUD
 * @dev Split from PengadaanFacet to reduce contract size below 24KB
 */
contract PengadaanCoreFacet {
    // ==================== Events ====================
    event StatusPurchaseCreated(
        uint256 indexed id,
        uint256 indexed spbuId,
        string namaStatus,
        uint256 createdAt
    );
    event StatusPurchaseUpdated(
        uint256 indexed id,
        string namaStatus,
        uint256 updatedAt
    );
    event StatusPurchaseDeleted(uint256 indexed id, uint256 deletedAt);
    event RencanaPembelianCreated(
        uint256 indexed id,
        uint256 indexed spbuId,
        string kodePembelian,
        uint256 createdAt
    );
    event RencanaPembelianUpdated(uint256 indexed id, uint256 updatedAt);
    event RencanaPembelianDeleted(uint256 indexed id, uint256 deletedAt);
    event RencanaPembelianKonfirmasi(
        uint256 indexed id,
        address indexed konfirmasiBy,
        uint256 konfirmasiAt
    );
    event PajakPembelianLibCreated(
        uint256 indexed id,
        uint256 ppn,
        uint256 ppbkb,
        uint256 pph,
        uint256 createdAt
    );
    event PajakPembelianLibUpdated(uint256 indexed id, uint256 updatedAt);
    event PajakPembelianLibDeleted(uint256 indexed id, uint256 deletedAt);

    event PajakPembelianCreated(
        uint256 indexed id,
        uint256 indexed rencanaPembelianId,
        uint256 createdAt
    );
    event PajakPembelianDeleted(uint256 indexed id, uint256 deletedAt);
    event DetailRencanaPembelianCreated(
        uint256 indexed id,
        uint256 indexed rencanaPembelianId,
        uint256 indexed produkId,
        uint256 createdAt
    );
    event DetailRencanaPembelianUpdated(uint256 indexed id, uint256 updatedAt);
    event DetailRencanaPembelianDeleted(uint256 indexed id, uint256 deletedAt);

    // ==================== Internal ====================
    function _onlyAdmin() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        require(ac.roles[keccak256("ADMIN_ROLE")][msg.sender], "Admin only");
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

    // ==================== StatusPurchase CRUD ====================
    function createStatusPurchase(
        uint256 _spbuId,
        string calldata _namaStatus,
        string calldata _deskripsi,
        bool _aktif
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        s.statusPurchaseCounter++;
        uint256 newId = s.statusPurchaseCounter;
        s.statusPurchaseList[newId] = AppStorage.StatusPurchase({
            statusPurchaseId: newId,
            spbuId: _spbuId,
            namaStatus: _namaStatus,
            deskripsi: _deskripsi,
            aktif: _aktif,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.spbuToStatusPurchaseIds[_spbuId].push(newId);
        emit StatusPurchaseCreated(
            newId,
            _spbuId,
            _namaStatus,
            block.timestamp
        );
        return newId;
    }

    function updatedStatusPurchase(
        uint256 _id,
        string calldata _namaStatus,
        string calldata _deskripsi,
        bool _aktif
    ) external {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        AppStorage.StatusPurchase storage data = s.statusPurchaseList[_id];
        require(data.statusPurchaseId != 0 && !data.deleted, "Not found");
        data.namaStatus = _namaStatus;
        data.deskripsi = _deskripsi;
        data.aktif = _aktif;
        data.updatedAt = block.timestamp;
        emit StatusPurchaseUpdated(_id, _namaStatus, block.timestamp);
    }

    function deleteStatusPurchase(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        AppStorage.StatusPurchase storage data = s.statusPurchaseList[_id];
        require(data.statusPurchaseId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.spbuToStatusPurchaseIds[data.spbuId], _id);
        emit StatusPurchaseDeleted(_id, block.timestamp);
    }

    function getStatusPurchaseById(
        uint256 _id
    ) external view returns (AppStorage.StatusPurchase memory) {
        return AppStorage.pengadaanStorage().statusPurchaseList[_id];
    }

    function getCountStatusPurchase() external view returns (uint256) {
        return AppStorage.pengadaanStorage().statusPurchaseCounter;
    }

    // Helper function to get default harga (hargaBeli) for a product
    function _getDefaultHargaBeli(
        uint256 _produkId
    ) internal view returns (uint256) {
        AppStorage.PointOfSalesStorage storage pos = AppStorage.posStorage();
        uint256[] memory hargaIds = pos.produkToHargaList[_produkId];

        for (uint256 i = 0; i < hargaIds.length; i++) {
            AppStorage.Harga storage harga = pos.hargaList[hargaIds[i]];
            if (
                harga.isDefault && !harga.deleted && harga.produkId == _produkId
            ) {
                return harga.hargaBeli;
            }
        }
        return 0; // Return 0 if no default harga found
    }

    // Helper function to convert uint to string
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
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

    // ==================== PajakPembelianLib CRUD ====================
    function createPajakPembelianLib(
        uint256 _ppn,
        uint256 _ppbkb,
        uint256 _pph,
        bool _aktif
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        s.pajakPembelianLibCounter++;
        uint256 newId = s.pajakPembelianLibCounter;
        s.pajakPembelianLibList[newId] = AppStorage.PajakPembelianLib({
            pajakPembelianLibId: newId,
            ppn: _ppn,
            ppbkb: _ppbkb,
            pph: _pph,
            aktif: _aktif,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        emit PajakPembelianLibCreated(
            newId,
            _ppn,
            _ppbkb,
            _pph,
            block.timestamp
        );
        return newId;
    }

    function updatePajakPembelianLib(
        uint256 _id,
        uint256 _ppn,
        uint256 _ppbkb,
        uint256 _pph,
        bool _aktif
    ) external {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        AppStorage.PajakPembelianLib storage data = s.pajakPembelianLibList[
            _id
        ];
        require(data.pajakPembelianLibId != 0 && !data.deleted, "Not found");
        data.ppn = _ppn;
        data.ppbkb = _ppbkb;
        data.pph = _pph;
        data.aktif = _aktif;
        data.updatedAt = block.timestamp;
        emit PajakPembelianLibUpdated(_id, block.timestamp);
    }

    function deletePajakPembelianLib(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        AppStorage.PajakPembelianLib storage data = s.pajakPembelianLibList[
            _id
        ];
        require(data.pajakPembelianLibId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        emit PajakPembelianLibDeleted(_id, block.timestamp);
    }

    function getPajakPembelianLibById(
        uint256 _id
    ) external view returns (AppStorage.PajakPembelianLib memory) {
        return AppStorage.pengadaanStorage().pajakPembelianLibList[_id];
    }

    function getAllPajakPembelianLib(
        uint256 _offset,
        uint256 _limit
    ) external view returns (AppStorage.PajakPembelianLib[] memory, uint256) {
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        uint256 total = s.pajakPembelianLibCounter;
        if (_offset >= total) {
            return (new AppStorage.PajakPembelianLib[](0), total);
        }
        uint256 end = _offset + _limit;
        if (end > total) end = total;
        uint256 count = 0;
        // First pass: count non-deleted items
        for (uint256 i = _offset + 1; i <= end; i++) {
            if (!s.pajakPembelianLibList[i].deleted) count++;
        }
        AppStorage.PajakPembelianLib[]
            memory result = new AppStorage.PajakPembelianLib[](count);
        uint256 idx = 0;
        for (uint256 i = _offset + 1; i <= end; i++) {
            if (!s.pajakPembelianLibList[i].deleted) {
                result[idx] = s.pajakPembelianLibList[i];
                idx++;
            }
        }
        return (result, total);
    }

    // ==================== RencanaPembelian CRUD ====================
    function createRencanaPembelian(
        uint256 _spbuId,
        uint256 _statusPurchaseId,
        uint256 _tanggalPembelian,
        string calldata _deskripsi,
        uint256[] calldata _produkId,
        uint256[] calldata _jumlah,
        string[] calldata _satuanJumlah
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        require(
            _produkId.length == _jumlah.length &&
                _jumlah.length == _satuanJumlah.length,
            "Array length mismatch"
        );

        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        s.rencanaPembelianCounter++;
        uint256 newId = s.rencanaPembelianCounter;

        // Generate kodePembelian
        string memory kodePembelian = string(
            abi.encodePacked("RP-", _uint2str(newId))
        );

        // Create RencanaPembelian struct
        s.rencanaPembelianList[newId] = AppStorage.RencanaPembelian({
            rencanaPembelianId: newId,
            spbuId: _spbuId,
            statusPurchaseId: _statusPurchaseId,
            walletMember: msg.sender,
            tanggalPembelian: _tanggalPembelian,
            kodePembelian: kodePembelian,
            deskripsi: _deskripsi,
            grandTotal: 0, // Will be updated after calculating details
            konfirmasi: false,
            konfirmasiBy: address(0),
            konfirmasiAt: 0,
            keteranganKonfirmasi: "",
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.spbuToRencanaPembelianIds[_spbuId].push(newId);
        s.walletToRencanaPembelianIds[msg.sender].push(newId);

        emit RencanaPembelianCreated(
            newId,
            _spbuId,
            kodePembelian,
            block.timestamp
        );

        // Loop through products and create DetailRencanaPembelian
        uint256 grandTotal = 0;
        for (uint256 i = 0; i < _produkId.length; i++) {
            // Get hargaBeli from Harga struct with isDefault = true
            uint256 hargaBeli = _getDefaultHargaBeli(_produkId[i]);
            uint256 subTotal = _jumlah[i] * hargaBeli;
            grandTotal += subTotal;

            s.detailRencanaPembelianCounter++;
            uint256 newDetailId = s.detailRencanaPembelianCounter;
            s.detailRencanaPembelianList[newDetailId] = AppStorage
                .DetailRencanaPembelian({
                    detailRencanaPembelianId: newDetailId,
                    rencanaPembelianId: newId,
                    produkId: _produkId[i],
                    harga: hargaBeli,
                    jumlah: _jumlah[i],
                    subTotal: subTotal,
                    satuanJumlah: _satuanJumlah[i],
                    konfirmasi: false,
                    konfirmasiBy: address(0),
                    konfirmasiAt: 0,
                    ms2: false,
                    ms2By: address(0),
                    ms2At: 0,
                    delivery: false,
                    deliveryBy: address(0),
                    deliveryAt: 0,
                    createdAt: block.timestamp,
                    updatedAt: block.timestamp,
                    deleted: false
                });
            s.rencanaPembelianToDetailRencanaPembelianIds[newId].push(
                newDetailId
            );
            s.produkToDetailRencanaPembelianIds[_produkId[i]].push(newDetailId);
        }

        // Update grandTotal in RencanaPembelian
        s.rencanaPembelianList[newId].grandTotal = grandTotal;

        return newId;
    }

    function konfirmasiRencanaPembelian(
        uint256 _id,
        bool konfirmasi,
        string calldata _keterangan
    ) external {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        AppStorage.RencanaPembelian storage data = s.rencanaPembelianList[_id];

        require(
            data.rencanaPembelianId != 0 &&
                !data.deleted &&
                data.konfirmasiBy == address(0),
            "Invalid or already confirmed"
        );
        data.konfirmasi = konfirmasi;
        data.konfirmasiBy = msg.sender;
        data.konfirmasiAt = block.timestamp;
        data.keteranganKonfirmasi = _keterangan;

        if (konfirmasi) {
            // Find StatusPurchase with name "Pembelian"
            for (uint256 i = 1; i <= s.statusPurchaseCounter; i++) {
                if (
                    keccak256(bytes(s.statusPurchaseList[i].namaStatus)) ==
                    keccak256(bytes("Pembelian")) &&
                    !s.statusPurchaseList[i].deleted
                ) {
                    data.statusPurchaseId = s
                        .statusPurchaseList[i]
                        .statusPurchaseId;
                    break;
                }
            }

            // Find active PajakPembelianLib
            AppStorage.PajakPembelianLib memory pajakLib;
            for (uint256 i = 1; i <= s.pajakPembelianLibCounter; i++) {
                if (
                    s.pajakPembelianLibList[i].aktif &&
                    !s.pajakPembelianLibList[i].deleted
                ) {
                    pajakLib = s.pajakPembelianLibList[i];
                    break;
                }
            }

            s.pajakPembelianCounter++;
            uint256 newId = s.pajakPembelianCounter;
            // Note: pajakLib values are scaled x100 (1100 = 11.00%)
            // So we divide by 10000 to get correct percentage
            uint256 ppnAmount = (pajakLib.ppn * data.grandTotal) / 10000;
            uint256 ppbkbAmount = (pajakLib.ppbkb * data.grandTotal) / 10000;
            uint256 pphAmount = (pajakLib.pph * data.grandTotal) / 10000;
            s.pajakPembelianList[newId] = AppStorage.PajakPembelian({
                pajakPembelianId: newId,
                rencanaPembelianId: _id,
                pajakPembelianLibId: pajakLib.pajakPembelianLibId,
                netPrice: data.grandTotal,
                ppn: ppnAmount,
                ppbkb: ppbkbAmount,
                pph: pphAmount,
                grossPrice: data.grandTotal +
                    ppnAmount +
                    ppbkbAmount +
                    pphAmount,
                createdAt: block.timestamp,
                updatedAt: block.timestamp,
                deleted: false
            });

            s.rencanaPembelianToPajakPembelianIds[_id].push(newId);
            s
                .pajakPembelianLibToPajakPembelianIds[
                    pajakLib.pajakPembelianLibId
                ]
                .push(newId);
        }

        emit RencanaPembelianKonfirmasi(_id, msg.sender, block.timestamp);
    }

    function deleteRencanaPembelian(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        AppStorage.RencanaPembelian storage data = s.rencanaPembelianList[_id];
        require(data.rencanaPembelianId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.spbuToRencanaPembelianIds[data.spbuId], _id);
        emit RencanaPembelianDeleted(_id, block.timestamp);
    }

    function getRencanaPembelianById(
        uint256 _id
    ) external view returns (AppStorage.RencanaPembelian memory) {
        return AppStorage.pengadaanStorage().rencanaPembelianList[_id];
    }

    function getRencanaPembelianBySpbu(
        uint256 _spbuId
    ) external view returns (AppStorage.RencanaPembelian[] memory) {
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        uint256[] memory ids = s.spbuToRencanaPembelianIds[_spbuId];
        AppStorage.RencanaPembelian[]
            memory result = new AppStorage.RencanaPembelian[](ids.length);
        for (uint256 i = 0; i < ids.length; i++)
            result[i] = s.rencanaPembelianList[ids[i]];
        return result;
    }

    function getCountAllRencanaPembelianKonfirmasi(
        uint8 filterStatus,
        uint256 statusPurchaseId
    ) external view returns (uint256) {
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();

        uint256 total = s.rencanaPembelianCounter;
        uint256 count = 0;

        for (uint256 i = 1; i <= total; i++) {
            AppStorage.RencanaPembelian storage rp = s.rencanaPembelianList[i];
            if (rp.deleted || rp.rencanaPembelianId == 0) continue;

            // Main filter: only count RencanaPembelian with matching statusPurchaseId
            if (rp.statusPurchaseId != statusPurchaseId) continue;

            bool belumKonfirmasi = rp.konfirmasiBy == address(0);

            if (filterStatus == 0) {
                // All items with this statusPurchaseId
                count++;
            } else if (filterStatus == 1) {
                // Pending (belum dikonfirmasi)
                if (belumKonfirmasi) count++;
            } else if (filterStatus == 2) {
                // Diterima (sudah dikonfirmasi dan konfirmasi = true)
                if (!belumKonfirmasi && rp.konfirmasi) count++;
            } else if (filterStatus == 3) {
                // Ditolak (sudah dikonfirmasi dan konfirmasi = false)
                if (!belumKonfirmasi && !rp.konfirmasi) count++;
            }
        }

        return count;
    }

    function getAllRencanaPembelianKonfirmasi(
        uint256 offset,
        uint256 limit,
        uint256 statusPurchaseId,
        uint8 filterStatus
    ) external view returns (RencanaPembelianView[] memory) {
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        AppStorage.IdentityStorage storage identity = AppStorage
            .identityStorage();
        AppStorage.InventoryStorage storage inv = AppStorage.inventoryStorage();

        uint256 total = s.rencanaPembelianCounter;

        // First pass: collect all matching IDs
        uint256[] memory matchingIds = new uint256[](total);
        uint256 matchCount = 0;

        for (uint256 i = 1; i <= total; i++) {
            AppStorage.RencanaPembelian storage rp = s.rencanaPembelianList[i];
            if (rp.deleted || rp.rencanaPembelianId == 0) continue;

            // Main filter: only include RencanaPembelian with matching statusPurchaseId
            if (rp.statusPurchaseId != statusPurchaseId) continue;

            bool belumKonfirmasi = rp.konfirmasiBy == address(0);

            if (filterStatus == 0) {
                // All items with status "Rencana"
                matchingIds[matchCount] = i;
                matchCount++;
            } else if (filterStatus == 1) {
                // Pending (belum dikonfirmasi)
                if (belumKonfirmasi) {
                    matchingIds[matchCount] = i;
                    matchCount++;
                }
            } else if (filterStatus == 2) {
                // Diterima (sudah dikonfirmasi dan konfirmasi = true)
                if (!belumKonfirmasi && rp.konfirmasi) {
                    matchingIds[matchCount] = i;
                    matchCount++;
                }
            } else if (filterStatus == 3) {
                // Ditolak (sudah dikonfirmasi dan konfirmasi = false)
                if (!belumKonfirmasi && !rp.konfirmasi) {
                    matchingIds[matchCount] = i;
                    matchCount++;
                }
            }
        }

        // Calculate pagination bounds
        if (offset >= matchCount) {
            return new RencanaPembelianView[](0);
        }
        uint256 end = offset + limit;
        if (end > matchCount) end = matchCount;
        uint256 resultSize = end - offset;

        RencanaPembelianView[] memory result = new RencanaPembelianView[](
            resultSize
        );

        for (uint256 idx = 0; idx < resultSize; idx++) {
            uint256 i = matchingIds[offset + idx];
            AppStorage.RencanaPembelian storage rp = s.rencanaPembelianList[i];

            // Get nama from walletMember -> Ktp
            string memory nama = "";
            AppStorage.Ktp storage ktp = identity.ktpMember[rp.walletMember];
            if (ktp.ktpId != 0 && !ktp.deleted) {
                nama = ktp.nama;
            }

            // Get detail rencana pembelian for this RencanaPembelian
            uint256[] memory detailIds = s
                .rencanaPembelianToDetailRencanaPembelianIds[i];

            // Count active details
            uint256 activeDetails = 0;
            for (uint256 j = 0; j < detailIds.length; j++) {
                if (!s.detailRencanaPembelianList[detailIds[j]].deleted) {
                    activeDetails++;
                }
            }

            ProdukDetail[] memory produkList = new ProdukDetail[](
                activeDetails
            );
            uint256 produkIndex = 0;

            for (uint256 j = 0; j < detailIds.length; j++) {
                AppStorage.DetailRencanaPembelian storage detail = s
                    .detailRencanaPembelianList[detailIds[j]];
                if (detail.deleted) continue;

                // Get namaProduk from Inventory storage
                string memory namaProduk = inv
                    .produkList[detail.produkId]
                    .namaProduk;

                produkList[produkIndex] = ProdukDetail({
                    namaProduk: namaProduk,
                    quantity: detail.jumlah,
                    satuan: detail.satuanJumlah
                });
                produkIndex++;
            }

            result[idx] = RencanaPembelianView({
                rencanaPembelianId: rp.rencanaPembelianId,
                nama: nama,
                tanggalPembelian: rp.tanggalPembelian,
                status: rp.konfirmasi,
                produk: produkList
            });
        }

        return result;
    }

    function updateRencanaPembelian(
        uint256 _rencanaPembelianId,
        string calldata _deskripsi,
        uint256[] calldata _deleteDetailIds,
        uint256[] calldata _produkId,
        uint256[] calldata _jumlah,
        string[] calldata _satuanJumlah
    ) external {
        _onlyAdmin();
        require(
            _produkId.length == _jumlah.length &&
                _jumlah.length == _satuanJumlah.length,
            "Mismatch"
        );

        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        AppStorage.RencanaPembelian storage rencana = s.rencanaPembelianList[
            _rencanaPembelianId
        ];
        require(
            rencana.rencanaPembelianId != 0 && !rencana.deleted,
            "Not found"
        );
        require(!rencana.konfirmasi, "Confirmed");

        // Update deskripsi
        rencana.deskripsi = _deskripsi;
        rencana.updatedAt = block.timestamp;

        // 1. Delete marked details
        for (uint256 i = 0; i < _deleteDetailIds.length; i++) {
            AppStorage.DetailRencanaPembelian storage detail = s
                .detailRencanaPembelianList[_deleteDetailIds[i]];
            if (
                detail.detailRencanaPembelianId != 0 &&
                !detail.deleted &&
                detail.rencanaPembelianId == _rencanaPembelianId
            ) {
                detail.deleted = true;
                detail.updatedAt = block.timestamp;
                _removeFromArray(
                    s.rencanaPembelianToDetailRencanaPembelianIds[
                        _rencanaPembelianId
                    ],
                    _deleteDetailIds[i]
                );
                emit DetailRencanaPembelianDeleted(
                    _deleteDetailIds[i],
                    block.timestamp
                );
            }
        }

        // 2. Add new products
        for (uint256 i = 0; i < _produkId.length; i++) {
            s.detailRencanaPembelianCounter++;
            uint256 newDetailId = s.detailRencanaPembelianCounter;
            uint256 hargaBeli = _getDefaultHargaBeli(_produkId[i]);
            uint256 subTotal = _jumlah[i] * hargaBeli;

            s.detailRencanaPembelianList[newDetailId] = AppStorage
                .DetailRencanaPembelian({
                    detailRencanaPembelianId: newDetailId,
                    rencanaPembelianId: _rencanaPembelianId,
                    produkId: _produkId[i],
                    harga: hargaBeli,
                    jumlah: _jumlah[i],
                    subTotal: subTotal,
                    satuanJumlah: _satuanJumlah[i],
                    konfirmasi: false,
                    konfirmasiBy: address(0),
                    konfirmasiAt: 0,
                    ms2: false,
                    ms2By: address(0),
                    ms2At: 0,
                    delivery: false,
                    deliveryBy: address(0),
                    deliveryAt: 0,
                    createdAt: block.timestamp,
                    updatedAt: block.timestamp,
                    deleted: false
                });

            s
                .rencanaPembelianToDetailRencanaPembelianIds[
                    _rencanaPembelianId
                ]
                .push(newDetailId);
            s.produkToDetailRencanaPembelianIds[_produkId[i]].push(newDetailId);

            emit DetailRencanaPembelianCreated(
                newDetailId,
                _rencanaPembelianId,
                _produkId[i],
                block.timestamp
            );
        }

        // Recalculate grandTotal from all remaining details
        uint256 newGrandTotal = 0;
        uint256[] memory allDetailIds = s
            .rencanaPembelianToDetailRencanaPembelianIds[_rencanaPembelianId];
        for (uint256 i = 0; i < allDetailIds.length; i++) {
            AppStorage.DetailRencanaPembelian storage detail = s
                .detailRencanaPembelianList[allDetailIds[i]];
            if (!detail.deleted) {
                newGrandTotal += detail.subTotal;
            }
        }
        rencana.grandTotal = newGrandTotal;

        emit RencanaPembelianUpdated(_rencanaPembelianId, block.timestamp);
    }

    // Pembelian
    function getRincianPembelianDetails(
        uint256 _rencanaPembelianId
    ) external view returns (DetailRencanaPembelianView[] memory) {
        AppStorage.PengadaanStorage storage ps = AppStorage.pengadaanStorage();
        AppStorage.InventoryStorage storage invs = AppStorage
            .inventoryStorage();

        // Get RencanaPembelian
        AppStorage.RencanaPembelian storage rencana = ps.rencanaPembelianList[
            _rencanaPembelianId
        ];
        require(
            rencana.rencanaPembelianId != 0 && !rencana.deleted,
            "RencanaPembelian not found"
        );

        // Get all detail IDs for this rencana
        uint256[] memory allDetailIds = ps
            .rencanaPembelianToDetailRencanaPembelianIds[_rencanaPembelianId];

        // Count valid (non-deleted) details
        uint256 validCount = 0;
        for (uint256 i = 0; i < allDetailIds.length; i++) {
            if (!ps.detailRencanaPembelianList[allDetailIds[i]].deleted) {
                validCount++;
            }
        }

        // Build result array
        DetailRencanaPembelianView[]
            memory result = new DetailRencanaPembelianView[](validCount);

        // Collect valid detail IDs
        uint256[] memory validDetailIds = new uint256[](validCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < allDetailIds.length; i++) {
            if (!ps.detailRencanaPembelianList[allDetailIds[i]].deleted) {
                validDetailIds[idx] = allDetailIds[i];
                idx++;
            }
        }

        // Get pajak info (first non-deleted pajak for this rencana)
        uint256 pajakId = 0;
        uint256 ppnVal = 0;
        uint256 ppbkbVal = 0;
        uint256 pphVal = 0;
        uint256 grossVal = 0;
        uint256 netVal = 0;

        uint256[] memory pajakIds = ps.rencanaPembelianToPajakPembelianIds[
            _rencanaPembelianId
        ];
        for (uint256 i = 0; i < pajakIds.length; i++) {
            AppStorage.PajakPembelian storage pajak = ps.pajakPembelianList[
                pajakIds[i]
            ];
            if (!pajak.deleted) {
                pajakId = pajak.pajakPembelianId;
                ppnVal = pajak.ppn;
                ppbkbVal = pajak.ppbkb;
                pphVal = pajak.pph;
                grossVal = pajak.grossPrice;
                netVal = pajak.netPrice;
                break;
            }
        }

        // Build each result item
        for (uint256 r = 0; r < validCount; r++) {
            uint256 detailId = validDetailIds[r];
            AppStorage.DetailRencanaPembelian storage detail = ps
                .detailRencanaPembelianList[detailId];

            // Build produk array (single product per detail)
            ProdukDetailWithHarga[]
                memory produkArr = new ProdukDetailWithHarga[](1);
            AppStorage.Produk storage produk = invs.produkList[detail.produkId];

            produkArr[0] = ProdukDetailWithHarga({
                detailRencanaPembelianId: detail.detailRencanaPembelianId,
                namaProduk: produk.namaProduk,
                quantity: detail.jumlah,
                satuan: detail.satuanJumlah,
                harga: detail.harga,
                total: detail.subTotal
            });

            result[r] = DetailRencanaPembelianView({
                rencanaPembelianId: rencana.rencanaPembelianId,
                kodePembelian: rencana.kodePembelian,
                tanggalPembelian: rencana.tanggalPembelian,
                jumlahTotal: rencana.grandTotal,
                produk: produkArr,
                pajakPembelianId: pajakId,
                ppn: ppnVal,
                ppbkb: ppbkbVal,
                pph: pphVal,
                gross: grossVal,
                net: netVal
            });
        }

        return result;
    }

    function updateRincianPembelianDetails(
        uint256 _rencanaPembelianId,
        uint256[] calldata detailRencanaPembelianId,
        uint256[] calldata harga,
        uint256 pajakPembelianId,
        uint256 ppn,
        uint256 ppbkb,
        uint256 pph
    ) external {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage ps = AppStorage.pengadaanStorage();

        AppStorage.RencanaPembelian storage rencana = ps.rencanaPembelianList[
            _rencanaPembelianId
        ];

        require(
            rencana.rencanaPembelianId != 0 && !rencana.deleted,
            "RencanaPembelian not found"
        );
        require(
            detailRencanaPembelianId.length == harga.length,
            "Array length mismatch"
        );

        uint256 grandTotal = 0;

        for (uint256 i = 0; i < detailRencanaPembelianId.length; i++) {
            AppStorage.DetailRencanaPembelian storage detail = ps
                .detailRencanaPembelianList[detailRencanaPembelianId[i]];
            require(!detail.deleted, "Detail deleted");
            require(
                detail.rencanaPembelianId == _rencanaPembelianId,
                "Detail not belong to this rencana"
            );
            detail.harga = harga[i];
            detail.subTotal = detail.jumlah * harga[i];
            detail.updatedAt = block.timestamp;

            grandTotal += detail.jumlah * harga[i];
        }

        AppStorage.PajakPembelian storage pajak = ps.pajakPembelianList[
            pajakPembelianId
        ];
        require(!pajak.deleted, "deleted");

        // ppn, ppbkb, pph are percentage rates scaled x100 (e.g., 1100 = 11%)
        // Calculate actual tax amounts from rates
        uint256 ppnAmount = (grandTotal * ppn) / 10000;
        uint256 ppbkbAmount = (grandTotal * ppbkb) / 10000;
        uint256 pphAmount = (grandTotal * pph) / 10000;

        // Store calculated amounts (consistent with konfirmasiRencanaPembelian)
        pajak.ppn = ppnAmount;
        pajak.ppbkb = ppbkbAmount;
        pajak.pph = pphAmount;
        pajak.netPrice = grandTotal;
        pajak.grossPrice = grandTotal + ppnAmount + ppbkbAmount + pphAmount;
        pajak.updatedAt = block.timestamp;

        rencana.grandTotal = grandTotal;
        rencana.updatedAt = block.timestamp;

        emit DetailRencanaPembelianUpdated(
            _rencanaPembelianId,
            block.timestamp
        );
    }

    function konfirmasiPembelianToPembayaran(
        uint256 _rencanaPembelianId
    ) external {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage ps = AppStorage.pengadaanStorage();
        AppStorage.RencanaPembelian storage rencana = ps.rencanaPembelianList[
            _rencanaPembelianId
        ];
        require(
            rencana.rencanaPembelianId != 0 && !rencana.deleted,
            "RencanaPembelian not found"
        );
        require(rencana.konfirmasi, "Not confirmed");

        // Check if already in Pembayaran status
        if (rencana.statusPurchaseId != 0) {
            require(
                keccak256(
                    bytes(
                        ps
                            .statusPurchaseList[rencana.statusPurchaseId]
                            .namaStatus
                    )
                ) != keccak256(bytes("Pembayaran")),
                "Already"
            );
        }

        for (uint256 i = 1; i <= ps.statusPurchaseCounter; i++) {
            if (
                keccak256(bytes(ps.statusPurchaseList[i].namaStatus)) ==
                keccak256(bytes("Pembayaran")) &&
                !ps.statusPurchaseList[i].deleted
            ) {
                rencana.statusPurchaseId = ps
                    .statusPurchaseList[i]
                    .statusPurchaseId;
                break;
            }
        }

        uint256[] memory allDetailIds = ps
            .rencanaPembelianToDetailRencanaPembelianIds[_rencanaPembelianId];

        for (uint256 i = 0; i < allDetailIds.length; i++) {
            AppStorage.DetailRencanaPembelian storage detail = ps
                .detailRencanaPembelianList[allDetailIds[i]];
            if (!detail.deleted) {
                detail.konfirmasi = true;
                detail.konfirmasiBy = msg.sender;
                detail.konfirmasiAt = block.timestamp;
            }
        }

        emit RencanaPembelianUpdated(_rencanaPembelianId, block.timestamp);
    }
}
