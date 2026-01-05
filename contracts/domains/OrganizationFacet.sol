// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";

/**
 * @title OrganizationFacet
 * @notice Mengelola struktur organisasi SPBU dalam Diamond Pattern
 * @dev Hierarki: SPBU -> Divisi -> Level -> Jabatan -> Wallet
 *
 * Mapping Relations yang digunakan:
 * - spbuToDivisiIds: SPBU -> Divisi[]
 * - divisiToLevelIds: Divisi -> Level[]
 * - levelToJabatanIds: Level -> Jabatan[]
 * - jabatanToWalletIds: Jabatan -> Wallet[]
 * - walletToJabatanIds: Wallet -> Jabatan[]
 *
 * Global ID Arrays untuk pagination:
 * - allSpbuIds, allDivisiIds, allLevelIds, allJabatanIds
 */
contract OrganizationFacet {
    // ==================== Events ====================

    // SPBU Events
    event SpbuCreated(
        uint256 indexed spbuId,
        string namaSpbu,
        string nomorSpbu,
        uint256 createdAt
    );
    event SpbuUpdated(
        uint256 indexed spbuId,
        string namaSpbu,
        string nomorSpbu,
        uint256 updatedAt
    );
    event SpbuDeleted(uint256 indexed spbuId, uint256 deletedAt);

    // Divisi Events
    event DivisiCreated(
        uint256 indexed divisiId,
        uint256 indexed spbuId,
        string namaDivisi,
        uint256 createdAt
    );
    event DivisiUpdated(
        uint256 indexed divisiId,
        uint256 indexed spbuId,
        string namaDivisi,
        uint256 updatedAt
    );
    event DivisiDeleted(uint256 indexed divisiId, uint256 deletedAt);

    // Level Events
    event LevelCreated(
        uint256 indexed levelId,
        uint256 indexed divisiId,
        string namaLevel,
        uint256 createdAt
    );
    event LevelUpdated(
        uint256 indexed levelId,
        uint256 indexed divisiId,
        string namaLevel,
        uint256 updatedAt
    );
    event LevelDeleted(uint256 indexed levelId, uint256 deletedAt);

    // Jabatan Events
    event JabatanCreated(
        uint256 indexed jabatanId,
        uint256 indexed levelId,
        string namaJabatan,
        uint256 createdAt
    );
    event JabatanUpdated(
        uint256 indexed jabatanId,
        uint256 indexed levelId,
        string namaJabatan,
        uint256 updatedAt
    );
    event JabatanDeleted(uint256 indexed jabatanId, uint256 deletedAt);

    // JabatanWallet Events
    event JabatanWalletAssigned(
        uint256 indexed jabatanId,
        address indexed walletAddress,
        uint256 assignedAt
    );
    event JabatanWalletRemoved(
        uint256 indexed jabatanId,
        address indexed walletAddress,
        uint256 removedAt
    );

    // ==================== Internal Access Control ====================

    function _onlyAdmin() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        bytes32 ADMIN_ROLE = keccak256("ADMIN_ROLE");
        require(
            ac.roles[ADMIN_ROLE][msg.sender],
            "OrganizationFacet: Admin only"
        );
    }

    // ==================== Internal Helper: Swap and Pop ====================

    function _removeFromUintArray(uint256[] storage arr, uint256 _id) internal {
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == _id) {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                break;
            }
        }
    }

    function _removeFromAddressArray(
        address[] storage arr,
        address _addr
    ) internal {
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == _addr) {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                break;
            }
        }
    }

    /**
     * @notice Generate role hash from jabatan name
     * @dev Converts name to uppercase, replaces spaces with underscore, appends _ROLE suffix
     * @param _namaJabatan The jabatan name to convert
     * @return bytes32 The keccak256 hash of the role name
     */
    function _generateRoleHash(
        string memory _namaJabatan
    ) internal pure returns (bytes32) {
        bytes memory nameBytes = bytes(_namaJabatan);
        bytes memory result = new bytes(nameBytes.length);

        for (uint256 i = 0; i < nameBytes.length; i++) {
            bytes1 char = nameBytes[i];
            // Convert lowercase to uppercase (a-z: 97-122 -> A-Z: 65-90)
            if (char >= 0x61 && char <= 0x7A) {
                result[i] = bytes1(uint8(char) - 32);
            }
            // Replace space with underscore
            else if (char == 0x20) {
                result[i] = bytes1(0x5F); // underscore
            } else {
                result[i] = char;
            }
        }

        // Append "_ROLE" suffix and hash
        return keccak256(abi.encodePacked(string(result), "_ROLE"));
    }

    // ==================== SPBU CRUD (Admin Only) ====================

    function createSpbu(
        string calldata _namaSpbu,
        string calldata _nomorSpbu,
        uint256 _tanggalPendirian,
        string calldata _alamat,
        uint256 _luasLahan,
        string calldata _satuanLuas
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();

        s.spbuCounter++;
        uint256 newId = s.spbuCounter;

        s.spbuList[newId] = AppStorage.Spbu({
            spbuId: newId,
            namaSpbu: _namaSpbu,
            nomorSpbu: _nomorSpbu,
            tanggalPendirian: _tanggalPendirian,
            alamat: _alamat,
            luasLahan: _luasLahan,
            satuanLuas: _satuanLuas,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        // Add to global ID array
        s.allSpbuIds.push(newId);

        emit SpbuCreated(newId, _namaSpbu, _nomorSpbu, block.timestamp);
        return newId;
    }

    function updateSpbu(
        uint256 _spbuId,
        string calldata _namaSpbu,
        string calldata _nomorSpbu,
        uint256 _tanggalPendirian,
        string calldata _alamat,
        uint256 _luasLahan,
        string calldata _satuanLuas
    ) external {
        _onlyAdmin();
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();

        AppStorage.Spbu storage data = s.spbuList[_spbuId];
        require(data.spbuId != 0, "OrganizationFacet: SPBU not found");
        require(!data.deleted, "OrganizationFacet: SPBU deleted");

        data.namaSpbu = _namaSpbu;
        data.nomorSpbu = _nomorSpbu;
        data.tanggalPendirian = _tanggalPendirian;
        data.alamat = _alamat;
        data.luasLahan = _luasLahan;
        data.satuanLuas = _satuanLuas;
        data.updatedAt = block.timestamp;

        emit SpbuUpdated(_spbuId, _namaSpbu, _nomorSpbu, block.timestamp);
    }

    function deleteSpbu(uint256 _spbuId) external {
        _onlyAdmin();
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();

        AppStorage.Spbu storage data = s.spbuList[_spbuId];
        require(data.spbuId != 0, "OrganizationFacet: SPBU not found");
        require(!data.deleted, "OrganizationFacet: Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;

        // Remove from global ID array
        _removeFromUintArray(s.allSpbuIds, _spbuId);

        emit SpbuDeleted(_spbuId, block.timestamp);
    }

    function getSpbuById(
        uint256 _spbuId
    ) external view returns (AppStorage.Spbu memory) {
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();
        require(
            s.spbuList[_spbuId].spbuId != 0,
            "OrganizationFacet: Not found"
        );
        return s.spbuList[_spbuId];
    }

    function getAllSpbu(
        uint256 _offset,
        uint256 _limit
    ) external view returns (AppStorage.Spbu[] memory result, uint256 total) {
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();
        uint256[] memory allIds = s.allSpbuIds;
        uint256 totalLength = allIds.length;

        if (_offset >= totalLength || totalLength == 0) {
            return (new AppStorage.Spbu[](0), totalLength);
        }

        uint256 remaining = totalLength - _offset;
        uint256 resultLength = remaining < _limit ? remaining : _limit;
        result = new AppStorage.Spbu[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = s.spbuList[allIds[_offset + i]];
        }

        return (result, totalLength);
    }

    // ==================== Divisi CRUD (Admin Only) ====================

    function createDivisi(
        uint256 _spbuId,
        string calldata _namaDivisi,
        string calldata _keterangan
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();

        // Validate SPBU exists
        require(
            s.spbuList[_spbuId].spbuId != 0 && !s.spbuList[_spbuId].deleted,
            "OrganizationFacet: SPBU not found"
        );

        s.divisiCounter++;
        uint256 newId = s.divisiCounter;

        s.divisiList[newId] = AppStorage.Divisi({
            divisiId: newId,
            spbuId: _spbuId,
            namaDivisi: _namaDivisi,
            keterangan: _keterangan,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        // Add to global ID array
        s.allDivisiIds.push(newId);

        // Add to relation mapping: SPBU -> Divisi
        s.spbuToDivisiIds[_spbuId].push(newId);

        emit DivisiCreated(newId, _spbuId, _namaDivisi, block.timestamp);
        return newId;
    }

    function updateDivisi(
        uint256 _divisiId,
        uint256 _spbuId,
        string calldata _namaDivisi,
        string calldata _keterangan
    ) external {
        _onlyAdmin();
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();

        AppStorage.Divisi storage data = s.divisiList[_divisiId];
        require(data.divisiId != 0, "OrganizationFacet: Divisi not found");
        require(!data.deleted, "OrganizationFacet: Divisi deleted");
        require(
            s.spbuList[_spbuId].spbuId != 0 && !s.spbuList[_spbuId].deleted,
            "OrganizationFacet: SPBU not found"
        );

        // Update spbuToDivisiIds if spbuId changed
        uint256 oldSpbuId = data.spbuId;
        if (oldSpbuId != _spbuId) {
            _removeFromUintArray(s.spbuToDivisiIds[oldSpbuId], _divisiId);
            s.spbuToDivisiIds[_spbuId].push(_divisiId);
        }

        data.spbuId = _spbuId;
        data.namaDivisi = _namaDivisi;
        data.keterangan = _keterangan;
        data.updatedAt = block.timestamp;

        emit DivisiUpdated(_divisiId, _spbuId, _namaDivisi, block.timestamp);
    }

    function deleteDivisi(uint256 _divisiId) external {
        _onlyAdmin();
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();

        AppStorage.Divisi storage data = s.divisiList[_divisiId];
        require(data.divisiId != 0, "OrganizationFacet: Divisi not found");
        require(!data.deleted, "OrganizationFacet: Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;

        // Remove from global ID array
        _removeFromUintArray(s.allDivisiIds, _divisiId);

        // Remove from spbuToDivisiIds
        _removeFromUintArray(s.spbuToDivisiIds[data.spbuId], _divisiId);

        emit DivisiDeleted(_divisiId, block.timestamp);
    }

    function getDivisiById(
        uint256 _divisiId
    ) external view returns (AppStorage.Divisi memory) {
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();
        require(
            s.divisiList[_divisiId].divisiId != 0,
            "OrganizationFacet: Not found"
        );
        return s.divisiList[_divisiId];
    }

    function getAllDivisi(
        uint256 _offset,
        uint256 _limit
    ) external view returns (AppStorage.Divisi[] memory result, uint256 total) {
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();
        uint256[] memory allIds = s.allDivisiIds;
        uint256 totalLength = allIds.length;

        if (_offset >= totalLength || totalLength == 0) {
            return (new AppStorage.Divisi[](0), totalLength);
        }

        uint256 remaining = totalLength - _offset;
        uint256 resultLength = remaining < _limit ? remaining : _limit;
        result = new AppStorage.Divisi[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = s.divisiList[allIds[_offset + i]];
        }

        return (result, totalLength);
    }

    function getDivisiBySpbu(
        uint256 _spbuId
    ) external view returns (AppStorage.Divisi[] memory) {
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();
        uint256[] memory ids = s.spbuToDivisiIds[_spbuId];

        AppStorage.Divisi[] memory result = new AppStorage.Divisi[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.divisiList[ids[i]];
        }
        return result;
    }

    // ==================== Level CRUD (Admin Only) ====================

    function createLevel(
        uint256 _divisiId,
        string calldata _namaLevel,
        string calldata _keterangan
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();

        // Validate Divisi exists
        require(
            s.divisiList[_divisiId].divisiId != 0 &&
                !s.divisiList[_divisiId].deleted,
            "OrganizationFacet: Divisi not found"
        );

        s.levelCounter++;
        uint256 newId = s.levelCounter;

        s.levelList[newId] = AppStorage.Level({
            levelId: newId,
            divisiId: _divisiId,
            namaLevel: _namaLevel,
            keterangan: _keterangan,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        // Add to global ID array
        s.allLevelIds.push(newId);

        // Add to relation mapping: Divisi -> Level
        s.divisiToLevelIds[_divisiId].push(newId);

        emit LevelCreated(newId, _divisiId, _namaLevel, block.timestamp);
        return newId;
    }

    function updateLevel(
        uint256 _levelId,
        uint256 _divisiId,
        string calldata _namaLevel,
        string calldata _keterangan
    ) external {
        _onlyAdmin();
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();

        AppStorage.Level storage data = s.levelList[_levelId];
        require(data.levelId != 0, "OrganizationFacet: Level not found");
        require(!data.deleted, "OrganizationFacet: Level deleted");
        require(
            s.divisiList[_divisiId].divisiId != 0 &&
                !s.divisiList[_divisiId].deleted,
            "OrganizationFacet: Divisi not found"
        );

        // Update divisiToLevelIds if divisiId changed
        uint256 oldDivisiId = data.divisiId;
        if (oldDivisiId != _divisiId) {
            _removeFromUintArray(s.divisiToLevelIds[oldDivisiId], _levelId);
            s.divisiToLevelIds[_divisiId].push(_levelId);
        }

        data.divisiId = _divisiId;
        data.namaLevel = _namaLevel;
        data.keterangan = _keterangan;
        data.updatedAt = block.timestamp;

        emit LevelUpdated(_levelId, _divisiId, _namaLevel, block.timestamp);
    }

    function deleteLevel(uint256 _levelId) external {
        _onlyAdmin();
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();

        AppStorage.Level storage data = s.levelList[_levelId];
        require(data.levelId != 0, "OrganizationFacet: Level not found");
        require(!data.deleted, "OrganizationFacet: Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;

        // Remove from global ID array
        _removeFromUintArray(s.allLevelIds, _levelId);

        // Remove from divisiToLevelIds
        _removeFromUintArray(s.divisiToLevelIds[data.divisiId], _levelId);

        emit LevelDeleted(_levelId, block.timestamp);
    }

    function getLevelById(
        uint256 _levelId
    ) external view returns (AppStorage.Level memory) {
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();
        require(
            s.levelList[_levelId].levelId != 0,
            "OrganizationFacet: Not found"
        );
        return s.levelList[_levelId];
    }

    function getAllLevel(
        uint256 _offset,
        uint256 _limit
    ) external view returns (AppStorage.Level[] memory result, uint256 total) {
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();
        uint256[] memory allIds = s.allLevelIds;
        uint256 totalLength = allIds.length;

        if (_offset >= totalLength || totalLength == 0) {
            return (new AppStorage.Level[](0), totalLength);
        }

        uint256 remaining = totalLength - _offset;
        uint256 resultLength = remaining < _limit ? remaining : _limit;
        result = new AppStorage.Level[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = s.levelList[allIds[_offset + i]];
        }

        return (result, totalLength);
    }

    function getLevelByDivisi(
        uint256 _divisiId
    ) external view returns (AppStorage.Level[] memory) {
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();
        uint256[] memory ids = s.divisiToLevelIds[_divisiId];

        AppStorage.Level[] memory result = new AppStorage.Level[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.levelList[ids[i]];
        }
        return result;
    }

    // ==================== Jabatan CRUD (Admin Only) ====================

    function createJabatan(
        uint256 _levelId,
        string calldata _namaJabatan,
        string calldata _keterangan
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();

        // Validate Level exists
        require(
            s.levelList[_levelId].levelId != 0 &&
                !s.levelList[_levelId].deleted,
            "OrganizationFacet: Level not found"
        );

        s.jabatanCounter++;
        uint256 newId = s.jabatanCounter;

        // Generate role hash from jabatan name
        bytes32 roleHash = _generateRoleHash(_namaJabatan);

        s.jabatanList[newId] = AppStorage.Jabatan({
            jabatanId: newId,
            levelId: _levelId,
            namaJabatan: _namaJabatan,
            keterangan: _keterangan,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false,
            roleHash: roleHash
        });

        // Add to global ID array
        s.allJabatanIds.push(newId);

        // Add to relation mapping: Level -> Jabatan
        s.levelToJabatanIds[_levelId].push(newId);

        emit JabatanCreated(newId, _levelId, _namaJabatan, block.timestamp);
        return newId;
    }

    function updateJabatan(
        uint256 _jabatanId,
        uint256 _levelId,
        string calldata _namaJabatan,
        string calldata _keterangan
    ) external {
        _onlyAdmin();
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();

        AppStorage.Jabatan storage data = s.jabatanList[_jabatanId];
        require(data.jabatanId != 0, "OrganizationFacet: Jabatan not found");
        require(!data.deleted, "OrganizationFacet: Jabatan deleted");
        require(
            s.levelList[_levelId].levelId != 0 &&
                !s.levelList[_levelId].deleted,
            "OrganizationFacet: Level not found"
        );

        // Update levelToJabatanIds if levelId changed
        uint256 oldLevelId = data.levelId;
        if (oldLevelId != _levelId) {
            _removeFromUintArray(s.levelToJabatanIds[oldLevelId], _jabatanId);
            s.levelToJabatanIds[_levelId].push(_jabatanId);
        }

        data.levelId = _levelId;
        data.namaJabatan = _namaJabatan;
        data.keterangan = _keterangan;
        data.updatedAt = block.timestamp;

        // Regenerate roleHash if name changed
        data.roleHash = _generateRoleHash(_namaJabatan);

        emit JabatanUpdated(
            _jabatanId,
            _levelId,
            _namaJabatan,
            block.timestamp
        );
    }

    function deleteJabatan(uint256 _jabatanId) external {
        _onlyAdmin();
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();

        AppStorage.Jabatan storage data = s.jabatanList[_jabatanId];
        require(data.jabatanId != 0, "OrganizationFacet: Jabatan not found");
        require(!data.deleted, "OrganizationFacet: Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;

        // Remove from global ID array
        _removeFromUintArray(s.allJabatanIds, _jabatanId);

        // Remove from levelToJabatanIds
        _removeFromUintArray(s.levelToJabatanIds[data.levelId], _jabatanId);

        emit JabatanDeleted(_jabatanId, block.timestamp);
    }

    function getJabatanById(
        uint256 _jabatanId
    ) external view returns (AppStorage.Jabatan memory) {
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();
        require(
            s.jabatanList[_jabatanId].jabatanId != 0,
            "OrganizationFacet: Not found"
        );
        return s.jabatanList[_jabatanId];
    }

    function getAllJabatan(
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (AppStorage.Jabatan[] memory result, uint256 total)
    {
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();
        uint256[] memory allIds = s.allJabatanIds;
        uint256 totalLength = allIds.length;

        if (_offset >= totalLength || totalLength == 0) {
            return (new AppStorage.Jabatan[](0), totalLength);
        }

        uint256 remaining = totalLength - _offset;
        uint256 resultLength = remaining < _limit ? remaining : _limit;
        result = new AppStorage.Jabatan[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = s.jabatanList[allIds[_offset + i]];
        }

        return (result, totalLength);
    }

    function getJabatanByLevel(
        uint256 _levelId
    ) external view returns (AppStorage.Jabatan[] memory) {
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();
        uint256[] memory ids = s.levelToJabatanIds[_levelId];

        AppStorage.Jabatan[] memory result = new AppStorage.Jabatan[](
            ids.length
        );
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.jabatanList[ids[i]];
        }
        return result;
    }

    // ==================== JabatanWallet Functions (Admin Only) ====================

    /**
     * @notice Assign jabatan to wallet (many-to-many relation)
     */
    function assignJabatanToWallet(
        uint256 _jabatanId,
        address _walletAddress
    ) external {
        _onlyAdmin();
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();

        // Validate Jabatan exists
        require(
            s.jabatanList[_jabatanId].jabatanId != 0 &&
                !s.jabatanList[_jabatanId].deleted,
            "OrganizationFacet: Jabatan not found"
        );
        require(
            _walletAddress != address(0),
            "OrganizationFacet: Invalid wallet"
        );

        // Check if already assigned
        address[] memory existingWallets = s.jabatanToWalletIds[_jabatanId];
        for (uint256 i = 0; i < existingWallets.length; i++) {
            require(
                existingWallets[i] != _walletAddress,
                "OrganizationFacet: Already assigned"
            );
        }

        // Add relations
        s.jabatanToWalletIds[_jabatanId].push(_walletAddress);
        s.walletToJabatanIds[_walletAddress].push(_jabatanId);

        emit JabatanWalletAssigned(_jabatanId, _walletAddress, block.timestamp);
    }

    /**
     * @notice Remove jabatan from wallet
     */
    function removeJabatanFromWallet(
        uint256 _jabatanId,
        address _walletAddress
    ) external {
        _onlyAdmin();
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();

        // Remove from jabatanToWalletIds
        _removeFromAddressArray(
            s.jabatanToWalletIds[_jabatanId],
            _walletAddress
        );

        // Remove from walletToJabatanIds
        _removeFromUintArray(s.walletToJabatanIds[_walletAddress], _jabatanId);

        emit JabatanWalletRemoved(_jabatanId, _walletAddress, block.timestamp);
    }

    function getWalletsByJabatan(
        uint256 _jabatanId
    ) external view returns (address[] memory) {
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();
        return s.jabatanToWalletIds[_jabatanId];
    }

    function getJabatansByWallet(
        address _walletAddress
    ) external view returns (AppStorage.Jabatan[] memory) {
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();
        uint256[] memory ids = s.walletToJabatanIds[_walletAddress];

        AppStorage.Jabatan[] memory result = new AppStorage.Jabatan[](
            ids.length
        );
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.jabatanList[ids[i]];
        }
        return result;
    }

    // ==================== Special Query Functions ====================

    /**
     * @notice Get full organization info for a wallet
     * @dev Returns Jabatan -> Level -> Divisi -> SPBU hierarchy
     */
    struct OrganizationInfo {
        AppStorage.Jabatan jabatan;
        AppStorage.Level level;
        AppStorage.Divisi divisi;
        AppStorage.Spbu spbu;
    }

    function getOrganizationInfoByWallet(
        address _walletAddress
    ) external view returns (OrganizationInfo[] memory) {
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();
        uint256[] memory jabatanIds = s.walletToJabatanIds[_walletAddress];

        OrganizationInfo[] memory result = new OrganizationInfo[](
            jabatanIds.length
        );

        for (uint256 i = 0; i < jabatanIds.length; i++) {
            AppStorage.Jabatan storage jabatan = s.jabatanList[jabatanIds[i]];
            if (!jabatan.deleted) {
                AppStorage.Level storage level = s.levelList[jabatan.levelId];
                AppStorage.Divisi storage divisi = s.divisiList[level.divisiId];
                AppStorage.Spbu storage spbu = s.spbuList[divisi.spbuId];

                result[i] = OrganizationInfo({
                    jabatan: jabatan,
                    level: level,
                    divisi: divisi,
                    spbu: spbu
                });
            }
        }

        return result;
    }

    /**
     * @notice Get full organization tree by SpbuId
     */
    struct DivisiWithLevels {
        AppStorage.Divisi divisi;
        AppStorage.Level[] levels;
    }

    function getOrganizationTreeBySpbu(
        uint256 _spbuId
    )
        external
        view
        returns (
            AppStorage.Spbu memory spbu,
            DivisiWithLevels[] memory divisiTree
        )
    {
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();

        spbu = s.spbuList[_spbuId];
        require(spbu.spbuId != 0, "OrganizationFacet: SPBU not found");

        uint256[] memory divisiIds = s.spbuToDivisiIds[_spbuId];
        divisiTree = new DivisiWithLevels[](divisiIds.length);

        for (uint256 i = 0; i < divisiIds.length; i++) {
            AppStorage.Divisi storage divisi = s.divisiList[divisiIds[i]];
            uint256[] memory levelIds = s.divisiToLevelIds[divisiIds[i]];

            AppStorage.Level[] memory levels = new AppStorage.Level[](
                levelIds.length
            );
            for (uint256 j = 0; j < levelIds.length; j++) {
                levels[j] = s.levelList[levelIds[j]];
            }

            divisiTree[i] = DivisiWithLevels({divisi: divisi, levels: levels});
        }

        return (spbu, divisiTree);
    }

    // ==================== Validation Functions ====================

    function isSpbuExists(uint256 _spbuId) external view returns (bool) {
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();
        return s.spbuList[_spbuId].spbuId != 0 && !s.spbuList[_spbuId].deleted;
    }

    function isDivisiExists(uint256 _divisiId) external view returns (bool) {
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();
        return
            s.divisiList[_divisiId].divisiId != 0 &&
            !s.divisiList[_divisiId].deleted;
    }

    function isLevelExists(uint256 _levelId) external view returns (bool) {
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();
        return
            s.levelList[_levelId].levelId != 0 &&
            !s.levelList[_levelId].deleted;
    }

    function isJabatanExists(uint256 _jabatanId) external view returns (bool) {
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();
        return
            s.jabatanList[_jabatanId].jabatanId != 0 &&
            !s.jabatanList[_jabatanId].deleted;
    }

    function hasJabatan(
        address _walletAddress,
        uint256 _jabatanId
    ) external view returns (bool) {
        AppStorage.OrganisasiStorage storage s = AppStorage.orgStorage();
        uint256[] memory jabatanIds = s.walletToJabatanIds[_walletAddress];
        for (uint256 i = 0; i < jabatanIds.length; i++) {
            if (jabatanIds[i] == _jabatanId) return true;
        }
        return false;
    }

    // ==================== Utility Functions ====================

    function getTotalSpbu() external view returns (uint256) {
        return AppStorage.orgStorage().allSpbuIds.length;
    }

    function getTotalDivisi() external view returns (uint256) {
        return AppStorage.orgStorage().allDivisiIds.length;
    }

    function getTotalLevel() external view returns (uint256) {
        return AppStorage.orgStorage().allLevelIds.length;
    }

    function getTotalJabatan() external view returns (uint256) {
        return AppStorage.orgStorage().allJabatanIds.length;
    }
}
