// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";
import "../structs/ViewStructs.sol";

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

    function updateKonversi(
        uint256 _id,
        uint256 _dombakId,
        uint256 _satuanUkurTinggiId,
        uint256 _satuanUkurVolumeId,
        uint256 _tinggi,
        uint256 _volume
    ) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.Konversi storage data = s.konversiList[_id];
        require(data.konversiId != 0, "Not found");

        if (_dombakId != data.dombakId) {
            require(s.dombakList[_dombakId].dombakId != 0, "Dombak not found");
            _removeFromArray(s.dombakToKonversiIds[data.dombakId], _id);
            s.dombakToKonversiIds[_dombakId].push(_id);
        }

        if (_satuanUkurTinggiId != data.satuanUkurTinggiId) {
            require(
                s
                    .satuanUkurTinggiList[_satuanUkurTinggiId]
                    .satuanUkurTinggiId != 0,
                "S. Tinggi not found"
            );
            _removeFromArray(
                s.satuanUkurTinggiToKonversiIds[data.satuanUkurTinggiId],
                _id
            );
            s.satuanUkurTinggiToKonversiIds[_satuanUkurTinggiId].push(_id);
        }

        if (_satuanUkurVolumeId != data.satuanUkurVolumeId) {
            require(
                s
                    .satuanUkurVolumeList[_satuanUkurVolumeId]
                    .satuanUkurVolumeId != 0,
                "S. Volume not found"
            );
            _removeFromArray(
                s.satuanUkurVolumeToKonversiIds[data.satuanUkurVolumeId],
                _id
            );
            s.satuanUkurVolumeToKonversiIds[_satuanUkurVolumeId].push(_id);
        }

        data.dombakId = _dombakId;
        data.satuanUkurTinggiId = _satuanUkurTinggiId;
        data.satuanUkurVolumeId = _satuanUkurVolumeId;
        data.tinggi = _tinggi;
        data.volume = _volume;
        data.updatedAt = block.timestamp;

        emit KonversiUpdated(_id, block.timestamp);
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
        _removeFromArray(
            s.satuanUkurTinggiToKonversiIds[data.satuanUkurTinggiId],
            _id
        );
        _removeFromArray(
            s.satuanUkurVolumeToKonversiIds[data.satuanUkurVolumeId],
            _id
        );

        emit KonversiDeleted(_id, block.timestamp);
    }

    function getKonversiById(
        uint256 _id
    ) external view returns (AppStorage.Konversi memory) {
        return AppStorage.inventoryStorage().konversiList[_id];
    }

    function getAllKonversi(
        uint256 offset,
        uint256 limit,
        uint256 dombakId,
        uint256 tinggi,
        uint256 volume
    ) external view returns (AppStorage.Konversi[] memory) {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        uint256[] storage sourceIds;

        // 1. Determine base list (Optimization)
        // Only dombakId has an index mapping we can utilize
        if (dombakId != 0) {
            sourceIds = s.dombakToKonversiIds[dombakId];
        } else {
            sourceIds = s.konversiIds;
        }

        uint256 totalSource = sourceIds.length;
        AppStorage.Konversi[] memory tempResult = new AppStorage.Konversi[](
            limit
        );
        uint256 count = 0;
        uint256 skipped = 0;

        for (uint256 i = 0; i < totalSource; i++) {
            // Optimization: if we already have enough items, break
            if (count == limit) break;

            uint256 id = sourceIds[i];
            AppStorage.Konversi storage data = s.konversiList[id];

            if (data.deleted) continue;

            // Filter by Tinggi
            if (tinggi != 0 && data.tinggi != tinggi) continue;

            // Filter by Volume
            if (volume != 0 && data.volume != volume) continue;

            // Pagination: Skip
            if (skipped < offset) {
                skipped++;
                continue;
            }

            // Pagination: Take
            tempResult[count] = data;
            count++;
        }

        // Resize array if result < limit
        if (count < limit) {
            assembly {
                mstore(tempResult, count)
            }
            return tempResult;
        }
        return tempResult;
    }

    function getKonversiByTinggi(
        uint256 dombakId,
        uint256 tinggi
    ) external view returns (uint256) {
        AppStorage.InventoryStorage storage inventory = AppStorage
            .inventoryStorage();

        uint256 length = inventory.konversiIds.length;

        for (uint256 i = 0; i < length; i++) {
            AppStorage.Konversi storage data = inventory.konversiList[
                inventory.konversiIds[i]
            ];

            if (data.dombakId == dombakId && data.tinggi == tinggi) {
                return data.volume;
            }
        }
        return 0;
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

        s.satuanUkurTinggiIds.push(newId);

        emit SatuanUkurTinggiCreated(newId, _namaSatuan, block.timestamp);
        return newId;
    }

    function updateSatuanUkurTinggi(
        uint256 _id,
        string calldata _namaSatuan,
        string calldata _singkatan
    ) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.SatuanUkurTinggi storage data = s.satuanUkurTinggiList[_id];
        require(data.satuanUkurTinggiId != 0, "Not found");

        data.namaSatuan = _namaSatuan;
        data.singkatan = _singkatan;
        data.updatedAt = block.timestamp;

        emit SatuanUkurTinggiUpdated(_id, _namaSatuan, block.timestamp);
    }

    function deleteSatuanUkurTinggi(uint256 _id) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        s.satuanUkurTinggiList[_id].deleted = true;
        _removeFromArray(s.satuanUkurTinggiIds, _id);
        emit SatuanUkurTinggiDeleted(_id, block.timestamp);
    }

    function getSatuanUkurTinggiById(
        uint256 _id
    ) external view returns (AppStorage.SatuanUkurTinggi memory) {
        return AppStorage.inventoryStorage().satuanUkurTinggiList[_id];
    }

    function getCountSatuanUkurTinggi() external view returns (uint256) {
        return AppStorage.inventoryStorage().satuanUkurTinggiIds.length;
    }

    function getCountSatuanUkurVolume() external view returns (uint256) {
        return AppStorage.inventoryStorage().satuanUkurVolumeIds.length;
    }

    function getAllSatuanUkurTinggi(
        uint256 offset,
        uint256 limit
    ) external view returns (AppStorage.SatuanUkurTinggi[] memory) {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        uint256[] memory allIds = s.satuanUkurTinggiIds;
        uint256 total = allIds.length;
        if (offset >= total) return new AppStorage.SatuanUkurTinggi[](0);
        uint256 len = (total - offset) < limit ? (total - offset) : limit;
        AppStorage.SatuanUkurTinggi[]
            memory result = new AppStorage.SatuanUkurTinggi[](len);
        for (uint256 i = 0; i < len; i++) {
            result[i] = s.satuanUkurTinggiList[allIds[offset + i]];
        }
        return result;
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

        s.satuanUkurVolumeIds.push(newId);

        emit SatuanUkurVolumeCreated(newId, _namaSatuan, block.timestamp);
        return newId;
    }

    function updateSatuanUkurVolume(
        uint256 _id,
        string calldata _namaSatuan,
        string calldata _singkatan
    ) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.SatuanUkurVolume storage data = s.satuanUkurVolumeList[_id];
        require(data.satuanUkurVolumeId != 0, "Not found");

        data.namaSatuan = _namaSatuan;
        data.singkatan = _singkatan;
        data.updatedAt = block.timestamp;

        emit SatuanUkurVolumeUpdated(_id, _namaSatuan, block.timestamp);
    }

    function deleteSatuanUkurVolume(uint256 _id) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        _removeFromArray(s.satuanUkurVolumeIds, _id);
        s.satuanUkurVolumeList[_id].deleted = true;
        emit SatuanUkurVolumeDeleted(_id, block.timestamp);
    }

    function getSatuanUkurVolumeById(
        uint256 _id
    ) external view returns (AppStorage.SatuanUkurVolume memory) {
        return AppStorage.inventoryStorage().satuanUkurVolumeList[_id];
    }

    function getAllSatuanUkurVolume(
        uint256 offset,
        uint256 limit
    ) external view returns (AppStorage.SatuanUkurVolume[] memory) {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        uint256[] memory allIds = s.satuanUkurVolumeIds;
        uint256 total = allIds.length;
        if (offset >= total) return new AppStorage.SatuanUkurVolume[](0);
        uint256 len = (total - offset) < limit ? (total - offset) : limit;
        AppStorage.SatuanUkurVolume[]
            memory result = new AppStorage.SatuanUkurVolume[](len);
        for (uint256 i = 0; i < len; i++) {
            result[i] = s.satuanUkurVolumeList[allIds[offset + i]];
        }
        return result;
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

    function getRiwayatStokByRange(
        uint256 _stokInventoryId,
        uint256 _startDate, // Unix Timestamp (contoh: 1704067200)
        uint256 _finishDate, // Unix Timestamp (contoh: 1706745600)
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (MonitoringStokRiwayatIndexInfo[] memory result, uint256 total)
    {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        uint256[] storage allIds = s.stokInventoryToDokumenStokIds[
            _stokInventoryId
        ];

        // 1. Filter ID yang masuk dalam rentang waktu & belum dihapus
        uint256[] memory filteredIds = new uint256[](allIds.length);
        uint256 filteredCount = 0;

        for (uint256 i = 0; i < allIds.length; i++) {
            uint256 dsId = allIds[i];
            AppStorage.DokumenStok storage ds = s.dokumenStokList[dsId];

            if (
                ds.tanggal >= _startDate &&
                ds.tanggal <= _finishDate &&
                !ds.deleted
            ) {
                filteredIds[filteredCount] = dsId;
                filteredCount++;
            }
        }

        total = filteredCount;

        // 2. Handle Pagination & Result Allocation
        if (_offset >= total)
            return (new MonitoringStokRiwayatIndexInfo[](0), total);
        uint256 count = total - _offset;
        if (count > _limit) count = _limit;

        result = new MonitoringStokRiwayatIndexInfo[](count);

        // 3. Isi data (Diurutkan dari yang terbaru/paling akhir di filteredIds)
        for (uint256 i = 0; i < count; i++) {
            uint256 currentId = filteredIds[total - 1 - _offset - i];
            result[i] = _formatRiwayatInfo(s, _stokInventoryId, currentId);
        }
    }

    // Helper Internal: Mengisi memori satu per satu untuk menghindari Stack Too Deep
    function _formatRiwayatInfo(
        AppStorage.InventoryStorage storage s,
        uint256 _stokInventoryId,
        uint256 _dokumenStokId
    ) internal view returns (MonitoringStokRiwayatIndexInfo memory info) {
        AppStorage.DokumenStok storage ds = s.dokumenStokList[_dokumenStokId];

        // Penulisan ke memori (Bukan Stack)
        info.stokInventoryId = _stokInventoryId;
        info.dokumenStokId = _dokumenStokId;
        info.tanggal = ds.tanggal;
        info.typeMovement = s
            .typeDokumenStokList[ds.typeDokumenStokId]
            .typeMovement;

        // Direct access ke Facet lain
        info.namaPegawai = AppStorage
            .identityStorage()
            .ktpMember[ds.wallet]
            .nama;
        info.namaProduk = s
            .produkList[s.stokInventoryList[_stokInventoryId].produkId]
            .namaProduk;
        info.jamKerja = AppStorage
            .attendanceStorage()
            .jamKerjaList[ds.jamKerjaId]
            .namaJamKerja;
        info.namaDombak = s.dombakList[ds.dombakId].namaDombak;

        info.stokAwal = ds.stokAwal;
        info.stokAkhir = ds.stokAkhir;

        // Logika perhitungan teoritis dan tanda loss
        uint256[] storage lIds = s.dokumenStokToLossesIds[_dokumenStokId];
        if (lIds.length > 0) {
            AppStorage.Losses storage loss = s.lossesList[lIds[0]];
            info.totalLoss = loss.stok;
            info.tandaLoss = (loss.simbol == AppStorage.SimbolLosses.Lebih)
                ? "+"
                : "-";
            info.stokAkhirTeoritis = (loss.simbol ==
                AppStorage.SimbolLosses.Lebih)
                ? ds.stokAwal + loss.stok
                : ds.stokAwal - loss.stok;
        } else {
            info.stokAkhirTeoritis = ds.stokAkhir;
            info.totalLoss = 0;
            info.tandaLoss = "";
        }

        info.createdAt = ds.createdAt;
        info.updatedAt = ds.updatedAt;
        info.deleted = ds.deleted;
    }

    // Stand Meter
    function getStandMeter(
        uint256 offset,
        uint256 limit,
        uint256 startDate,
        uint256 finishDate,
        uint256 produkId,
        uint256 jamKerjaId
    ) external view returns (StandMeterView[] memory) {
        AppStorage.PointOfSalesStorage storage pos = AppStorage.posStorage();
        AppStorage.InventoryStorage storage inv = AppStorage.inventoryStorage();
        AppStorage.AttendaceStorage storage att = AppStorage
            .attendanceStorage();

        uint256[] storage sourceIds = pos.standMeterIds;
        uint256 totalSource = sourceIds.length;

        StandMeterView[] memory tempResult = new StandMeterView[](limit);
        uint256 count = 0;
        uint256 skipped = 0;

        // Iterate backward to show new items first? Or forward?
        // Standard is forward 0..N, but for logs usually reverse.
        // Let's assume forward for consistency unless specified.
        // Actually for "history" usually reverse (newest first).
        // But simple getAll usually forward. I'll stick to forward as seen in other functions.
        for (uint256 i = 0; i < totalSource; i++) {
            if (count == limit) break;

            // In POS, usually IDs are sequential?
            // If using array: sourceIds[i].
            uint256 id = sourceIds[i];
            AppStorage.StandMeter storage sm = pos.standMeterList[id];

            if (sm.deleted) continue;

            // 1. Filter JamKerja
            if (jamKerjaId != 0 && sm.jamKerjaId != jamKerjaId) continue;

            // 2. Filter Date Range
            if (startDate != 0) {
                // If startDate is set, finishDate is required (assumed handled or enforced)
                // Logic: startDate <= sm.tanggal <= finishDate
                if (sm.tanggal < startDate) continue;
                if (finishDate != 0 && sm.tanggal > finishDate) continue;
            }

            // 3. Filter Produk
            // StandMeter -> Nozzle -> Produk
            AppStorage.Nozzle storage nozzle = pos.nozzleList[sm.nozzleId];
            if (produkId != 0 && nozzle.produkId != produkId) continue;

            // Pagination: Skip
            if (skipped < offset) {
                skipped++;
                continue;
            }

            // Map Data
            StandMeterView memory smView;
            // Try to find linked DokumenStok (for losses info)
            uint256[] storage dsIds = pos.standMeterToDokumenStokList[id];
            uint256 dsId = 0;
            if (dsIds.length > 0) {
                dsId = dsIds[0]; // Take the first linked document
            }

            smView.dokumenStokId = dsId; // Or should we send sm.standMeterId?
            // View struct asks for 'dokumenStokId'. I'll send the linked one.
            // If 0, it means no document created yet or not linked.

            smView.tanggal = sm.tanggal;
            // typeMovement - usually "Stand Meter"
            // If linked to DokumenStok, we can get type from there `inv.typeDokumenStokList[ds.typeDokumenStokId].typeMovement`
            // If no DS, maybe empty or default?
            if (dsId != 0) {
                smView.typeMovement = inv
                    .typeDokumenStokList[
                        inv.dokumenStokList[dsId].typeDokumenStokId
                    ]
                    .typeMovement;
            } else {
                smView.typeMovement = "Stand Meter";
            }

            smView.namaProduk = inv.produkList[nozzle.produkId].namaProduk;
            smView.namaNozzle = nozzle.namaNozzle;
            smView.namaDombak = inv.dombakList[sm.dombakId].namaDombak;
            smView.namaJamKerja = att.jamKerjaList[sm.jamKerjaId].namaJamKerja;
            smView.stokAwal = int256(sm.standMeterAwal);
            smView.stokAkhir = int256(sm.standMeterAkhir);

            // Losses Logic
            if (dsId != 0) {
                uint256[] storage lossesIds = inv.dokumenStokToLossesIds[dsId];
                if (lossesIds.length > 0) {
                    AppStorage.Losses storage loss = inv.lossesList[
                        lossesIds[0]
                    ];
                    smView.simbol = loss.simbol;
                    smView.stokLosses = loss.stok;
                }
            }

            smView.createdAt = sm.createdAt;
            smView.updatedAt = sm.updatedAt;
            smView.deleted = sm.deleted;

            tempResult[count] = smView;
            count++;
        }

        // Resize
        if (count < limit) {
            assembly {
                mstore(tempResult, count)
            }
        }

        return tempResult;
    }
}
