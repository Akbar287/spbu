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

    /**
     * @notice Get all products with pending MS2 (ms2By == address(0))
     * @dev Returns list of products with aggregated jumlah and count from DetailRencanaPembelian
     *      Only includes items from RencanaPembelian with statusPurchase.namaStatus = 'MS2'
     */
    function getAllMs2ByProduk()
        external
        view
        returns (ProdukMenuMs2View[] memory)
    {
        AppStorage.InventoryStorage storage inv = AppStorage.inventoryStorage();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();

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
                if (!detail.deleted && detail.ms2By == address(0)) {
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
                if (!detail.deleted && detail.ms2By == address(0)) {
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
}
