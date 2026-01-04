// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";

/**
 * @title InventoryDocsFacet
 * @notice DokumenStok, FileDokumenStok, Konversi, SatuanUkur CRUD
 * @dev Split from InventoryFacet - matches AppStorage.sol structs exactly
 */
contract InventoryDocsFacet {
    // ==================== Events ====================
    event DokumenStokCreated(
        uint256 indexed dokumenStokId,
        address indexed wallet,
        uint256 createdAt
    );
    event DokumenStokConfirmed(
        uint256 indexed dokumenStokId,
        address indexed confirmedBy,
        uint256 confirmedAt
    );
    event DokumenStokDeleted(uint256 indexed dokumenStokId, uint256 deletedAt);

    event FileDokumenStokCreated(
        uint256 indexed id,
        uint256 indexed dokumenStokId,
        uint256 createdAt
    );
    event FileDokumenStokDeleted(uint256 indexed id, uint256 deletedAt);

    event KonversiCreated(
        uint256 indexed konversiId,
        uint256 indexed dombakId,
        uint256 createdAt
    );
    event KonversiUpdated(uint256 indexed konversiId, uint256 updatedAt);
    event KonversiDeleted(uint256 indexed konversiId, uint256 deletedAt);

    event SatuanUkurTinggiCreated(
        uint256 indexed id,
        string namaSatuan,
        uint256 createdAt
    );
    event SatuanUkurTinggiUpdated(
        uint256 indexed id,
        string namaSatuan,
        uint256 updatedAt
    );
    event SatuanUkurTinggiDeleted(uint256 indexed id, uint256 deletedAt);

    event SatuanUkurVolumeCreated(
        uint256 indexed id,
        string namaSatuan,
        uint256 createdAt
    );
    event SatuanUkurVolumeUpdated(
        uint256 indexed id,
        string namaSatuan,
        uint256 updatedAt
    );
    event SatuanUkurVolumeDeleted(uint256 indexed id, uint256 deletedAt);

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

    // ==================== DokumenStok CRUD ====================
    // Matches AppStorage.DokumenStok exactly (15 fields)
    function createDokumenStok(
        uint256 _stokInventoryId,
        uint256 _typeDokumenStokId,
        uint256 _jamKerjaId,
        uint256 _dombakId,
        uint256 _tanggal,
        int256 _stokAwal,
        int256 _stokAkhir
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        require(
            s.typeDokumenStokList[_typeDokumenStokId].typeDokumenStokId != 0,
            "TypeDokumenStok not found"
        );
        require(s.dombakList[_dombakId].dombakId != 0, "Dombak not found");

        s.dokumenStokCounter++;
        uint256 newId = s.dokumenStokCounter;

        s.dokumenStokList[newId] = AppStorage.DokumenStok({
            dokumenStokId: newId,
            stokInventoryId: _stokInventoryId,
            typeDokumenStokId: _typeDokumenStokId,
            jamKerjaId: _jamKerjaId,
            dombakId: _dombakId,
            wallet: msg.sender,
            tanggal: _tanggal,
            stokAwal: _stokAwal,
            stokAkhir: _stokAkhir,
            confirmation: false,
            confirmedBy: address(0),
            confirmedAt: 0,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.dokumenStokIds.push(newId);
        s.typeDokumenStokToDokumenStokIds[_typeDokumenStokId].push(newId);
        s.walletToDokumenStokIds[msg.sender].push(newId);
        s.jamKerjaToDokumenStokIds[_jamKerjaId].push(newId);
        s.dombakToDokumenStokIds[_dombakId].push(newId);
        s.stokInventoryToDokumenStokIds[_stokInventoryId].push(newId);

        emit DokumenStokCreated(newId, msg.sender, block.timestamp);
        return newId;
    }

    function confirmDokumenStok(uint256 _dokumenStokId) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.DokumenStok storage data = s.dokumenStokList[_dokumenStokId];
        require(data.dokumenStokId != 0, "Not found");
        require(!data.deleted, "Deleted");
        require(!data.confirmation, "Already confirmed");

        data.confirmation = true;
        data.confirmedBy = msg.sender;
        data.confirmedAt = block.timestamp;
        data.updatedAt = block.timestamp;

        emit DokumenStokConfirmed(_dokumenStokId, msg.sender, block.timestamp);
    }

    function deleteDokumenStok(uint256 _id) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.DokumenStok storage data = s.dokumenStokList[_id];
        require(data.dokumenStokId != 0, "Not found");
        require(!data.deleted, "Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;
        _removeFromArray(s.dokumenStokIds, _id);

        emit DokumenStokDeleted(_id, block.timestamp);
    }

    function getDokumenStokById(
        uint256 _id
    ) external view returns (AppStorage.DokumenStok memory) {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        require(s.dokumenStokList[_id].dokumenStokId != 0, "Not found");
        return s.dokumenStokList[_id];
    }

    // ==================== FileDokumenStok CRUD ====================
    // Matches AppStorage.FileDokumenStok exactly (10 fields)
    function createFileDokumenStok(
        uint256 _dokumenStokId,
        string calldata _ipfsHash,
        string calldata _namaFile,
        string calldata _namaDokumen,
        string calldata _mimeType,
        uint256 _fileSize
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        require(
            s.dokumenStokList[_dokumenStokId].dokumenStokId != 0,
            "DokumenStok not found"
        );

        s.fileDokumenStokCounter++;
        uint256 newId = s.fileDokumenStokCounter;

        s.fileDokumenStokList[newId] = AppStorage.FileDokumenStok({
            fileDokumenStokId: newId,
            dokumenStokId: _dokumenStokId,
            ipfsHash: _ipfsHash,
            namaFile: _namaFile,
            namaDokumen: _namaDokumen,
            mimeType: _mimeType,
            fileSize: _fileSize,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.fileDokumenStokIds.push(newId);
        s.dokumenStokToFileDokumenStokIds[_dokumenStokId].push(newId);

        emit FileDokumenStokCreated(newId, _dokumenStokId, block.timestamp);
        return newId;
    }

    function deleteFileDokumenStok(uint256 _id) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.FileDokumenStok storage data = s.fileDokumenStokList[_id];
        require(data.fileDokumenStokId != 0, "Not found");
        require(!data.deleted, "Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;
        _removeFromArray(s.fileDokumenStokIds, _id);
        _removeFromArray(
            s.dokumenStokToFileDokumenStokIds[data.dokumenStokId],
            _id
        );

        emit FileDokumenStokDeleted(_id, block.timestamp);
    }

    function getFileDokumenStokByDokumenStok(
        uint256 _dokumenStokId
    ) external view returns (AppStorage.FileDokumenStok[] memory) {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        uint256[] memory ids = s.dokumenStokToFileDokumenStokIds[
            _dokumenStokId
        ];
        AppStorage.FileDokumenStok[]
            memory result = new AppStorage.FileDokumenStok[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.fileDokumenStokList[ids[i]];
        }
        return result;
    }

    // ==================== Konversi CRUD ====================
    function createKonversi(
        uint256 _dombakId,
        uint256 _satuanUkurTinggiId,
        uint256 _satuanUkurVolumeId,
        uint256 _tinggi,
        uint256 _volume
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        require(s.dombakList[_dombakId].dombakId != 0, "Dombak not found");

        s.konversiCounter++;
        uint256 newId = s.konversiCounter;

        s.konversiList[newId] = AppStorage.Konversi({
            konversiId: newId,
            dombakId: _dombakId,
            satuanUkurTinggiId: _satuanUkurTinggiId,
            satuanUkurVolumeId: _satuanUkurVolumeId,
            tinggi: _tinggi,
            volume: _volume,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.konversiIds.push(newId);
        s.dombakToKonversiIds[_dombakId].push(newId);
        s.satuanUkurTinggiToKonversiIds[_satuanUkurTinggiId].push(newId);
        s.satuanUkurVolumeToKonversiIds[_satuanUkurVolumeId].push(newId);

        emit KonversiCreated(newId, _dombakId, block.timestamp);
        return newId;
    }

    function deleteKonversi(uint256 _id) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.Konversi storage data = s.konversiList[_id];
        require(data.konversiId != 0, "Not found");

        data.deleted = true;
        data.updatedAt = block.timestamp;
        _removeFromArray(s.konversiIds, _id);
        _removeFromArray(s.dombakToKonversiIds[data.dombakId], _id);

        emit KonversiDeleted(_id, block.timestamp);
    }

    function getKonversiById(
        uint256 _id
    ) external view returns (AppStorage.Konversi memory) {
        return AppStorage.inventoryStorage().konversiList[_id];
    }

    // ==================== SatuanUkurTinggi CRUD ====================
    function createSatuanUkurTinggi(
        string calldata _namaSatuan,
        string calldata _singkatan
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        s.satuanUkurTinggiCounter++;
        uint256 newId = s.satuanUkurTinggiCounter;

        s.satuanUkurTinggiList[newId] = AppStorage.SatuanUkurTinggi({
            satuanUkurTinggiId: newId,
            namaSatuan: _namaSatuan,
            singkatan: _singkatan,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        emit SatuanUkurTinggiCreated(newId, _namaSatuan, block.timestamp);
        return newId;
    }

    function deleteSatuanUkurTinggi(uint256 _id) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        s.satuanUkurTinggiList[_id].deleted = true;
        emit SatuanUkurTinggiDeleted(_id, block.timestamp);
    }

    function getSatuanUkurTinggiById(
        uint256 _id
    ) external view returns (AppStorage.SatuanUkurTinggi memory) {
        return AppStorage.inventoryStorage().satuanUkurTinggiList[_id];
    }

    // ==================== SatuanUkurVolume CRUD ====================
    function createSatuanUkurVolume(
        string calldata _namaSatuan,
        string calldata _singkatan
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        s.satuanUkurVolumeCounter++;
        uint256 newId = s.satuanUkurVolumeCounter;

        s.satuanUkurVolumeList[newId] = AppStorage.SatuanUkurVolume({
            satuanUkurVolumeId: newId,
            namaSatuan: _namaSatuan,
            singkatan: _singkatan,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        emit SatuanUkurVolumeCreated(newId, _namaSatuan, block.timestamp);
        return newId;
    }

    function deleteSatuanUkurVolume(uint256 _id) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        s.satuanUkurVolumeList[_id].deleted = true;
        emit SatuanUkurVolumeDeleted(_id, block.timestamp);
    }

    function getSatuanUkurVolumeById(
        uint256 _id
    ) external view returns (AppStorage.SatuanUkurVolume memory) {
        return AppStorage.inventoryStorage().satuanUkurVolumeList[_id];
    }

    // ==================== Pagination ====================
    function getAllDokumenStok(
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (AppStorage.DokumenStok[] memory result, uint256 total)
    {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        uint256[] memory allIds = s.dokumenStokIds;
        total = allIds.length;
        if (_offset >= total) return (new AppStorage.DokumenStok[](0), total);
        uint256 len = (total - _offset) < _limit ? (total - _offset) : _limit;
        result = new AppStorage.DokumenStok[](len);
        for (uint256 i = 0; i < len; i++)
            result[i] = s.dokumenStokList[allIds[_offset + i]];
    }
}
