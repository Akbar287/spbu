// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";

/**
 * @title HumanCapitalFacet
 * @notice Mengelola gaji dan kompensasi karyawan SPBU dalam Diamond Pattern
 * @dev Entities: Gaji, GajiWallet, DetailGaji, Bonus
 *
 * Relasi:
 * - Gaji -> GajiWallet: One-to-Many (satu jenis gaji bisa diberikan ke banyak wallet/karyawan)
 * - GajiWallet -> DetailGaji: One-to-Many (satu gaji member bisa punya banyak detail komponen gaji)
 * - DetailGaji -> Bonus: One-to-One (satu detail gaji bisa punya satu bonus)
 *
 * Mapping Relations:
 * - jabatanToGajiIds, gajiToGajiWalletIds, gajiWalletToDetailIds
 * - detailGajiToBonusId (one-to-one), walletToGajiWalletIds
 *
 * Access Control: DIREKTUR untuk CRUD, semua role untuk view gaji sendiri
 */
contract HumanCapitalFacet {
    // ==================== Events ====================

    // Gaji Events
    event GajiCreated(
        uint256 indexed gajiId,
        uint256 indexed jabatanId,
        int256 jumlah,
        uint256 createdAt
    );
    event GajiUpdated(uint256 indexed gajiId, uint256 updatedAt);
    event GajiDeleted(uint256 indexed gajiId, uint256 deletedAt);

    // GajiWallet Events
    event GajiWalletCreated(
        uint256 indexed gajiWalletId,
        uint256 indexed gajiId,
        address indexed wallet,
        uint256 createdAt
    );
    event GajiWalletUpdated(uint256 indexed gajiWalletId, uint256 updatedAt);
    event GajiWalletDeleted(uint256 indexed gajiWalletId, uint256 deletedAt);

    // DetailGaji Events
    event DetailGajiCreated(
        uint256 indexed detailGajiId,
        uint256 indexed gajiWalletId,
        AppStorage.JenisGaji jenis,
        uint256 createdAt
    );
    event DetailGajiUpdated(uint256 indexed detailGajiId, uint256 updatedAt);
    event DetailGajiDeleted(uint256 indexed detailGajiId, uint256 deletedAt);

    // Bonus Events
    event BonusCreated(
        uint256 indexed bonusId,
        uint256 indexed detailGajiId,
        int256 persentase,
        uint256 createdAt
    );
    event BonusUpdated(uint256 indexed bonusId, uint256 updatedAt);
    event BonusDeleted(uint256 indexed bonusId, uint256 deletedAt);

    // ==================== Internal Access Control ====================

    function _onlyDirektur() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        bytes32 DIREKTUR_ROLE = keccak256("DIREKTUR_ROLE");
        require(ac.roles[DIREKTUR_ROLE][msg.sender], "HCFacet: Direktur only");
    }

    function _onlyAdmin() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        bytes32 ADMIN_ROLE = keccak256("ADMIN_ROLE");
        require(ac.roles[ADMIN_ROLE][msg.sender], "HCFacet: Admin only");
    }

    // ==================== Internal Helper: Swap and Pop ====================

    function _removeFromArray(uint256[] storage arr, uint256 _id) internal {
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == _id) {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                break;
            }
        }
    }

    // ==================== Gaji CRUD (Direktur Only) ====================

    function createGaji(
        uint256 _jabatanId,
        string calldata _keterangan,
        int256 _jumlah
    ) external returns (uint256) {
        _onlyDirektur();
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();

        s.gajiCounter++;
        uint256 newId = s.gajiCounter;

        s.gajiList[newId] = AppStorage.Gaji({
            gajiId: newId,
            jabatanId: _jabatanId,
            keterangan: _keterangan,
            jumlah: _jumlah,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        // Add to global ID array and relation
        s.gajiIds.push(newId);
        s.jabatanToGajiIds[_jabatanId].push(newId);

        emit GajiCreated(newId, _jabatanId, _jumlah, block.timestamp);
        return newId;
    }

    function updateGaji(
        uint256 _gajiId,
        uint256 _jabatanId,
        string calldata _keterangan,
        int256 _jumlah
    ) external {
        _onlyDirektur();
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();

        AppStorage.Gaji storage data = s.gajiList[_gajiId];
        require(data.gajiId != 0, "HCFacet: Gaji not found");
        require(!data.deleted, "HCFacet: Gaji deleted");

        // Update relation if jabatanId changed
        if (data.jabatanId != _jabatanId) {
            _removeFromArray(s.jabatanToGajiIds[data.jabatanId], _gajiId);
            s.jabatanToGajiIds[_jabatanId].push(_gajiId);
        }

        data.jabatanId = _jabatanId;
        data.keterangan = _keterangan;
        data.jumlah = _jumlah;
        data.updatedAt = block.timestamp;

        emit GajiUpdated(_gajiId, block.timestamp);
    }

    function deleteGaji(uint256 _gajiId) external {
        _onlyDirektur();
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();

        AppStorage.Gaji storage data = s.gajiList[_gajiId];
        require(data.gajiId != 0, "HCFacet: Gaji not found");
        require(!data.deleted, "HCFacet: Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;

        _removeFromArray(s.gajiIds, _gajiId);
        _removeFromArray(s.jabatanToGajiIds[data.jabatanId], _gajiId);

        emit GajiDeleted(_gajiId, block.timestamp);
    }

    function getGajiById(
        uint256 _gajiId
    ) external view returns (AppStorage.Gaji memory) {
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();
        require(s.gajiList[_gajiId].gajiId != 0, "HCFacet: Not found");
        return s.gajiList[_gajiId];
    }

    function getAllGaji(
        uint256 _offset,
        uint256 _limit
    ) external view returns (AppStorage.Gaji[] memory result, uint256 total) {
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();
        uint256[] memory allIds = s.gajiIds;
        uint256 totalLength = allIds.length;

        if (_offset >= totalLength || totalLength == 0) {
            return (new AppStorage.Gaji[](0), totalLength);
        }

        uint256 remaining = totalLength - _offset;
        uint256 resultLength = remaining < _limit ? remaining : _limit;
        result = new AppStorage.Gaji[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = s.gajiList[allIds[_offset + i]];
        }

        return (result, totalLength);
    }

    function getGajiByJabatan(
        uint256 _jabatanId
    ) external view returns (AppStorage.Gaji[] memory) {
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();
        uint256[] memory ids = s.jabatanToGajiIds[_jabatanId];

        AppStorage.Gaji[] memory result = new AppStorage.Gaji[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.gajiList[ids[i]];
        }
        return result;
    }

    // ==================== GajiWallet CRUD (Direktur Only) ====================

    function createGajiWallet(
        uint256 _gajiId,
        address _wallet,
        uint256 _tanggalGaji,
        int256 _totalGajiBersih
    ) external returns (uint256) {
        _onlyDirektur();
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();

        require(
            s.gajiList[_gajiId].gajiId != 0 && !s.gajiList[_gajiId].deleted,
            "HCFacet: Gaji not found or deleted"
        );

        s.gajiWalletCounter++;
        uint256 newId = s.gajiWalletCounter;

        s.gajiWalletList[newId] = AppStorage.GajiWallet({
            gajiWalletId: newId,
            gajiId: _gajiId,
            wallet: _wallet,
            tanggalGaji: _tanggalGaji,
            totalGajiBersih: _totalGajiBersih,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        // Add to global ID array and relations
        s.gajiWalletIds.push(newId);
        s.gajiToGajiWalletIds[_gajiId].push(newId);
        s.walletToGajiWalletIds[_wallet].push(newId);

        emit GajiWalletCreated(newId, _gajiId, _wallet, block.timestamp);
        return newId;
    }

    function updateGajiWallet(
        uint256 _gajiWalletId,
        uint256 _gajiId,
        address _wallet,
        uint256 _tanggalGaji,
        int256 _totalGajiBersih
    ) external {
        _onlyDirektur();
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();

        AppStorage.GajiWallet storage data = s.gajiWalletList[_gajiWalletId];
        require(data.gajiWalletId != 0, "HCFacet: Not found");
        require(!data.deleted, "HCFacet: Deleted");

        // Update relations if changed
        if (data.gajiId != _gajiId) {
            _removeFromArray(s.gajiToGajiWalletIds[data.gajiId], _gajiWalletId);
            s.gajiToGajiWalletIds[_gajiId].push(_gajiWalletId);
        }
        if (data.wallet != _wallet) {
            _removeFromArray(
                s.walletToGajiWalletIds[data.wallet],
                _gajiWalletId
            );
            s.walletToGajiWalletIds[_wallet].push(_gajiWalletId);
        }

        data.gajiId = _gajiId;
        data.wallet = _wallet;
        data.tanggalGaji = _tanggalGaji;
        data.totalGajiBersih = _totalGajiBersih;
        data.updatedAt = block.timestamp;

        emit GajiWalletUpdated(_gajiWalletId, block.timestamp);
    }

    function deleteGajiWallet(uint256 _gajiWalletId) external {
        _onlyDirektur();
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();

        AppStorage.GajiWallet storage data = s.gajiWalletList[_gajiWalletId];
        require(data.gajiWalletId != 0, "HCFacet: Not found");
        require(!data.deleted, "HCFacet: Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;

        _removeFromArray(s.gajiWalletIds, _gajiWalletId);
        _removeFromArray(s.gajiToGajiWalletIds[data.gajiId], _gajiWalletId);
        _removeFromArray(s.walletToGajiWalletIds[data.wallet], _gajiWalletId);

        emit GajiWalletDeleted(_gajiWalletId, block.timestamp);
    }

    function getGajiWalletById(
        uint256 _gajiWalletId
    ) external view returns (AppStorage.GajiWallet memory) {
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();
        require(
            s.gajiWalletList[_gajiWalletId].gajiWalletId != 0,
            "HCFacet: Not found"
        );
        return s.gajiWalletList[_gajiWalletId];
    }

    function getGajiWalletByGaji(
        uint256 _gajiId
    ) external view returns (AppStorage.GajiWallet[] memory) {
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();
        uint256[] memory ids = s.gajiToGajiWalletIds[_gajiId];

        AppStorage.GajiWallet[] memory result = new AppStorage.GajiWallet[](
            ids.length
        );
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.gajiWalletList[ids[i]];
        }
        return result;
    }

    function getGajiWalletByWallet(
        address _wallet
    ) external view returns (AppStorage.GajiWallet[] memory) {
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();
        uint256[] memory ids = s.walletToGajiWalletIds[_wallet];

        AppStorage.GajiWallet[] memory result = new AppStorage.GajiWallet[](
            ids.length
        );
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.gajiWalletList[ids[i]];
        }
        return result;
    }

    function getAllGajiWallet(
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (AppStorage.GajiWallet[] memory result, uint256 total)
    {
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();
        uint256[] memory allIds = s.gajiWalletIds;
        uint256 totalLength = allIds.length;

        if (_offset >= totalLength || totalLength == 0) {
            return (new AppStorage.GajiWallet[](0), totalLength);
        }

        uint256 remaining = totalLength - _offset;
        uint256 resultLength = remaining < _limit ? remaining : _limit;
        result = new AppStorage.GajiWallet[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = s.gajiWalletList[allIds[_offset + i]];
        }

        return (result, totalLength);
    }

    // ==================== DetailGaji CRUD (Direktur Only) ====================

    function createDetailGaji(
        uint256 _gajiWalletId,
        string calldata _namaGaji,
        AppStorage.JenisGaji _jenis,
        int256 _jumlahUang
    ) external returns (uint256) {
        _onlyDirektur();
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();

        require(
            s.gajiWalletList[_gajiWalletId].gajiWalletId != 0 &&
                !s.gajiWalletList[_gajiWalletId].deleted,
            "HCFacet: GajiWallet not found or deleted"
        );

        s.detailGajiCounter++;
        uint256 newId = s.detailGajiCounter;

        s.detailGajiList[newId] = AppStorage.DetailGaji({
            detailGajiId: newId,
            gajiWalletId: _gajiWalletId,
            namaGaji: _namaGaji,
            jenis: _jenis,
            jumlahUang: _jumlahUang,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        // Add to relation
        s.gajiWalletToDetailIds[_gajiWalletId].push(newId);

        emit DetailGajiCreated(newId, _gajiWalletId, _jenis, block.timestamp);
        return newId;
    }

    function updateDetailGaji(
        uint256 _detailGajiId,
        string calldata _namaGaji,
        AppStorage.JenisGaji _jenis,
        int256 _jumlahUang
    ) external {
        _onlyDirektur();
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();

        AppStorage.DetailGaji storage data = s.detailGajiList[_detailGajiId];
        require(data.detailGajiId != 0, "HCFacet: Not found");
        require(!data.deleted, "HCFacet: Deleted");

        data.namaGaji = _namaGaji;
        data.jenis = _jenis;
        data.jumlahUang = _jumlahUang;
        data.updatedAt = block.timestamp;

        emit DetailGajiUpdated(_detailGajiId, block.timestamp);
    }

    function deleteDetailGaji(uint256 _detailGajiId) external {
        _onlyDirektur();
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();

        AppStorage.DetailGaji storage data = s.detailGajiList[_detailGajiId];
        require(data.detailGajiId != 0, "HCFacet: Not found");
        require(!data.deleted, "HCFacet: Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;

        _removeFromArray(
            s.gajiWalletToDetailIds[data.gajiWalletId],
            _detailGajiId
        );

        emit DetailGajiDeleted(_detailGajiId, block.timestamp);
    }

    function getDetailGajiById(
        uint256 _detailGajiId
    ) external view returns (AppStorage.DetailGaji memory) {
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();
        require(
            s.detailGajiList[_detailGajiId].detailGajiId != 0,
            "HCFacet: Not found"
        );
        return s.detailGajiList[_detailGajiId];
    }

    function getDetailGajiByGajiWallet(
        uint256 _gajiWalletId
    ) external view returns (AppStorage.DetailGaji[] memory) {
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();
        uint256[] memory ids = s.gajiWalletToDetailIds[_gajiWalletId];

        AppStorage.DetailGaji[] memory result = new AppStorage.DetailGaji[](
            ids.length
        );
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.detailGajiList[ids[i]];
        }
        return result;
    }

    // ==================== Bonus CRUD (Direktur Only) ====================

    function createBonus(
        uint256 _detailGajiId,
        int256 _persentase,
        int256 _totalBonus,
        string calldata _deskripsi
    ) external returns (uint256) {
        _onlyDirektur();
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();

        require(
            s.detailGajiList[_detailGajiId].detailGajiId != 0 &&
                !s.detailGajiList[_detailGajiId].deleted,
            "HCFacet: DetailGaji not found or deleted"
        );
        require(
            s.detailGajiToBonusId[_detailGajiId] == 0,
            "HCFacet: Bonus already exists for this DetailGaji"
        );

        s.bonusCounter++;
        uint256 newId = s.bonusCounter;

        s.bonusList[newId] = AppStorage.Bonus({
            bonusId: newId,
            detailGajiId: _detailGajiId,
            persentase: _persentase,
            totalBonus: _totalBonus,
            deskripsi: _deskripsi,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        // One-to-one relationship
        s.detailGajiToBonusId[_detailGajiId] = newId;

        emit BonusCreated(newId, _detailGajiId, _persentase, block.timestamp);
        return newId;
    }

    function updateBonus(
        uint256 _bonusId,
        int256 _persentase,
        int256 _totalBonus,
        string calldata _deskripsi
    ) external {
        _onlyDirektur();
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();

        AppStorage.Bonus storage data = s.bonusList[_bonusId];
        require(data.bonusId != 0, "HCFacet: Not found");
        require(!data.deleted, "HCFacet: Deleted");

        data.persentase = _persentase;
        data.totalBonus = _totalBonus;
        data.deskripsi = _deskripsi;
        data.updatedAt = block.timestamp;

        emit BonusUpdated(_bonusId, block.timestamp);
    }

    function deleteBonus(uint256 _bonusId) external {
        _onlyDirektur();
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();

        AppStorage.Bonus storage data = s.bonusList[_bonusId];
        require(data.bonusId != 0, "HCFacet: Not found");
        require(!data.deleted, "HCFacet: Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;

        // Remove one-to-one relationship
        s.detailGajiToBonusId[data.detailGajiId] = 0;

        emit BonusDeleted(_bonusId, block.timestamp);
    }

    function getBonusById(
        uint256 _bonusId
    ) external view returns (AppStorage.Bonus memory) {
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();
        require(s.bonusList[_bonusId].bonusId != 0, "HCFacet: Not found");
        return s.bonusList[_bonusId];
    }

    function getBonusByDetailGaji(
        uint256 _detailGajiId
    ) external view returns (AppStorage.Bonus memory) {
        AppStorage.HumanCapitalStorage storage s = AppStorage.hcStorage();
        uint256 bonusId = s.detailGajiToBonusId[_detailGajiId];
        if (bonusId == 0) {
            // Return empty bonus
            return
                AppStorage.Bonus({
                    bonusId: 0,
                    detailGajiId: 0,
                    persentase: 0,
                    totalBonus: 0,
                    deskripsi: "",
                    createdAt: 0,
                    updatedAt: 0,
                    deleted: false
                });
        }
        return s.bonusList[bonusId];
    }

    // ==================== Utility Functions ====================

    function getTotalGaji() external view returns (uint256) {
        return AppStorage.hcStorage().gajiIds.length;
    }

    function getTotalGajiWallet() external view returns (uint256) {
        return AppStorage.hcStorage().gajiWalletIds.length;
    }

    function getTotalDetailGaji() external view returns (uint256) {
        return AppStorage.hcStorage().detailGajiCounter;
    }

    function getTotalBonus() external view returns (uint256) {
        return AppStorage.hcStorage().bonusCounter;
    }
}
