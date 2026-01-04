// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";

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

    // ==================== RencanaPembelian CRUD ====================
    function createRencanaPembelian(
        uint256 _spbuId,
        uint256 _statusPurchaseId,
        uint256 _tanggalPembelian,
        string calldata _kodePembelian,
        string calldata _deskripsi,
        uint256 _grandTotal
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        s.rencanaPembelianCounter++;
        uint256 newId = s.rencanaPembelianCounter;
        s.rencanaPembelianList[newId] = AppStorage.RencanaPembelian({
            rencanaPembelianId: newId,
            spbuId: _spbuId,
            statusPurchaseId: _statusPurchaseId,
            walletMember: msg.sender,
            tanggalPembelian: _tanggalPembelian,
            kodePembelian: _kodePembelian,
            deskripsi: _deskripsi,
            grandTotal: _grandTotal,
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
            _kodePembelian,
            block.timestamp
        );
        return newId;
    }

    function konfirmasiRencanaPembelian(
        uint256 _id,
        string calldata _keterangan
    ) external {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        AppStorage.RencanaPembelian storage data = s.rencanaPembelianList[_id];
        require(
            data.rencanaPembelianId != 0 && !data.deleted && !data.konfirmasi,
            "Invalid"
        );
        data.konfirmasi = true;
        data.konfirmasiBy = msg.sender;
        data.konfirmasiAt = block.timestamp;
        data.keteranganKonfirmasi = _keterangan;
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

    // ==================== DetailRencanaPembelian CRUD ====================
    function createDetailRencanaPembelian(
        uint256 _rencanaPembelianId,
        uint256 _produkId,
        uint256 _harga,
        uint256 _jumlah,
        uint256 _subTotal,
        string calldata _satuanJumlah
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        require(
            s.rencanaPembelianList[_rencanaPembelianId].rencanaPembelianId != 0,
            "RencanaPembelian not found"
        );

        s.detailRencanaPembelianCounter++;
        uint256 newId = s.detailRencanaPembelianCounter;
        s.detailRencanaPembelianList[newId] = AppStorage
            .DetailRencanaPembelian({
                detailRencanaPembelianId: newId,
                rencanaPembelianId: _rencanaPembelianId,
                produkId: _produkId,
                harga: _harga,
                jumlah: _jumlah,
                subTotal: _subTotal,
                satuanJumlah: _satuanJumlah,
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
        s.rencanaPembelianToDetailRencanaPembelianIds[_rencanaPembelianId].push(
            newId
        );
        s.produkToDetailRencanaPembelianIds[_produkId].push(newId);
        emit DetailRencanaPembelianCreated(
            newId,
            _rencanaPembelianId,
            _produkId,
            block.timestamp
        );
        return newId;
    }

    function deleteDetailRencanaPembelian(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        AppStorage.DetailRencanaPembelian storage data = s
            .detailRencanaPembelianList[_id];
        require(
            data.detailRencanaPembelianId != 0 && !data.deleted,
            "Not found"
        );
        data.deleted = true;
        _removeFromArray(
            s.rencanaPembelianToDetailRencanaPembelianIds[
                data.rencanaPembelianId
            ],
            _id
        );
        emit DetailRencanaPembelianDeleted(_id, block.timestamp);
    }

    function getDetailRencanaPembelianById(
        uint256 _id
    ) external view returns (AppStorage.DetailRencanaPembelian memory) {
        return AppStorage.pengadaanStorage().detailRencanaPembelianList[_id];
    }

    function getDetailRencanaPembelianByRencana(
        uint256 _rencanaPembelianId
    ) external view returns (AppStorage.DetailRencanaPembelian[] memory) {
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        uint256[] memory ids = s.rencanaPembelianToDetailRencanaPembelianIds[
            _rencanaPembelianId
        ];
        AppStorage.DetailRencanaPembelian[]
            memory result = new AppStorage.DetailRencanaPembelian[](ids.length);
        for (uint256 i = 0; i < ids.length; i++)
            result[i] = s.detailRencanaPembelianList[ids[i]];
        return result;
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

    // ==================== PajakPembelian CRUD ====================
    function createPajakPembelian(
        uint256 _rencanaPembelianId,
        uint256 _pajakPembelianLibId,
        uint256 _netPrice,
        uint256 _ppn,
        uint256 _ppbkb,
        uint256 _pph,
        uint256 _grossPrice
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        require(
            s.rencanaPembelianList[_rencanaPembelianId].rencanaPembelianId != 0,
            "RencanaPembelian not found"
        );
        require(
            s.pajakPembelianLibList[_pajakPembelianLibId].pajakPembelianLibId !=
                0,
            "PajakPembelianLib not found"
        );

        s.pajakPembelianCounter++;
        uint256 newId = s.pajakPembelianCounter;
        s.pajakPembelianList[newId] = AppStorage.PajakPembelian({
            pajakPembelianId: newId,
            rencanaPembelianId: _rencanaPembelianId,
            pajakPembelianLibId: _pajakPembelianLibId,
            netPrice: _netPrice,
            ppn: _ppn,
            ppbkb: _ppbkb,
            pph: _pph,
            grossPrice: _grossPrice,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.rencanaPembelianToPajakPembelianIds[_rencanaPembelianId].push(newId);
        s.pajakPembelianLibToPajakPembelianIds[_pajakPembelianLibId].push(
            newId
        );
        emit PajakPembelianCreated(newId, _rencanaPembelianId, block.timestamp);
        return newId;
    }

    function deletePajakPembelian(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        AppStorage.PajakPembelian storage data = s.pajakPembelianList[_id];
        require(data.pajakPembelianId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(
            s.rencanaPembelianToPajakPembelianIds[data.rencanaPembelianId],
            _id
        );
        _removeFromArray(
            s.pajakPembelianLibToPajakPembelianIds[data.pajakPembelianLibId],
            _id
        );
        emit PajakPembelianDeleted(_id, block.timestamp);
    }

    function getPajakPembelianById(
        uint256 _id
    ) external view returns (AppStorage.PajakPembelian memory) {
        return AppStorage.pengadaanStorage().pajakPembelianList[_id];
    }

    function getPajakPembelianByRencanaPembelian(
        uint256 _rencanaPembelianId
    ) external view returns (AppStorage.PajakPembelian[] memory) {
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        uint256[] memory ids = s.rencanaPembelianToPajakPembelianIds[
            _rencanaPembelianId
        ];
        AppStorage.PajakPembelian[]
            memory result = new AppStorage.PajakPembelian[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.pajakPembelianList[ids[i]];
        }
        return result;
    }
}
