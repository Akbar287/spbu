// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";

/**
 * @title PointOfSalesCoreFacet
 * @notice StatusSetoran, Harga, Payung, Dispenser, Nozzle, StandMeter CRUD
 * @dev Split from PointOfSalesFacet to reduce contract size below 24KB
 */
contract PointOfSalesCoreFacet {
    event StatusSetoranCreated(
        uint256 indexed id,
        string namaStatus,
        uint256 createdAt
    );
    event StatusSetoranUpdated(
        uint256 indexed id,
        string namaStatus,
        uint256 updatedAt
    );
    event StatusSetoranDeleted(uint256 indexed id, uint256 deletedAt);
    event HargaCreated(
        uint256 indexed id,
        uint256 indexed produkId,
        uint256 hargaJual,
        uint256 createdAt
    );
    event HargaDeleted(uint256 indexed id, uint256 deletedAt);
    event PayungCreated(
        uint256 indexed id,
        string namaPayung,
        uint256 createdAt
    );
    event PayungUpdated(
        uint256 indexed id,
        string namaPayung,
        uint256 updatedAt
    );
    event PayungDeleted(uint256 indexed id, uint256 deletedAt);
    event DispenserCreated(
        uint256 indexed id,
        uint256 indexed payungId,
        string namaDispenser,
        uint256 createdAt
    );
    event DispenserUpdated(
        uint256 indexed id,
        string namaDispenser,
        uint256 updatedAt
    );
    event DispenserDeleted(uint256 indexed id, uint256 deletedAt);
    event NozzleCreated(
        uint256 indexed id,
        uint256 indexed dispenserId,
        string namaNozzle,
        uint256 createdAt
    );
    event NozzleUpdated(
        uint256 indexed id,
        string namaNozzle,
        uint256 updatedAt
    );
    event NozzleDeleted(uint256 indexed id, uint256 deletedAt);
    event StandMeterCreated(
        uint256 indexed id,
        uint256 indexed nozzleId,
        uint256 createdAt
    );
    event StandMeterUpdated(
        uint256 indexed id,
        uint256 indexed nozzleId,
        uint256 updatedAt
    );
    event StandMeterDeleted(uint256 indexed id, uint256 deletedAt);

    function _onlyAdmin() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        require(ac.roles[keccak256("ADMIN_ROLE")][msg.sender], "Admin only");
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

    // StatusSetoran CRUD
    function createStatusSetoran(
        string calldata _namaStatus
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        s.statusSetoranCounter++;
        uint256 newId = s.statusSetoranCounter;
        s.statusSetoranList[newId] = AppStorage.StatusSetoran({
            statusSetoranId: newId,
            namaStatus: _namaStatus,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.statusSetoranIds.push(newId);
        emit StatusSetoranCreated(newId, _namaStatus, block.timestamp);
        return newId;
    }

    function updateStatusSetoran(
        uint256 _id,
        string calldata _namaStatus
    ) external {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        AppStorage.StatusSetoran storage data = s.statusSetoranList[_id];
        require(data.statusSetoranId != 0 && !data.deleted, "Not found");
        data.namaStatus = _namaStatus;
        data.updatedAt = block.timestamp;
        emit StatusSetoranUpdated(_id, _namaStatus, block.timestamp);
    }

    function deleteStatusSetoran(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        AppStorage.StatusSetoran storage data = s.statusSetoranList[_id];
        require(data.statusSetoranId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.statusSetoranIds, _id);
        emit StatusSetoranDeleted(_id, block.timestamp);
    }

    function getStatusSetoranById(
        uint256 _id
    ) external view returns (AppStorage.StatusSetoran memory) {
        return AppStorage.posStorage().statusSetoranList[_id];
    }

    function getAllStatusSetoran(
        uint256 offset,
        uint256 limit
    ) external view returns (AppStorage.StatusSetoran[] memory) {
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        uint256 total = s.statusSetoranIds.length;
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        AppStorage.StatusSetoran[] memory data = new AppStorage.StatusSetoran[](
            end - offset
        );
        for (uint256 i = offset; i < end; i++) {
            data[i - offset] = s.statusSetoranList[s.statusSetoranIds[i]];
        }
        return data;
    }

    // Harga CRUD
    function createHarga(
        uint256 _produkId,
        uint256 _jamKerjaId,
        uint256 _hargaJual,
        uint256 _hargaBeli
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();

        uint256[] storage existingHargaIds = s.produkToHargaList[_produkId];
        for (uint256 i = 0; i < existingHargaIds.length; i++) {
            AppStorage.Harga storage existingHarga = s.hargaList[
                existingHargaIds[i]
            ];
            if (!existingHarga.deleted && existingHarga.isDefault) {
                existingHarga.isDefault = false;
                existingHarga.updatedAt = block.timestamp;
            }
        }

        s.hargaCounter++;
        uint256 newId = s.hargaCounter;
        s.hargaList[newId] = AppStorage.Harga({
            hargaId: newId,
            produkId: _produkId,
            jamKerjaId: _jamKerjaId,
            hargaJual: _hargaJual,
            hargaBeli: _hargaBeli,
            isDefault: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.hargaIds.push(newId);
        s.produkToHargaList[_produkId].push(newId);
        emit HargaCreated(newId, _produkId, _hargaJual, block.timestamp);
        return newId;
    }

    function deleteHarga(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        AppStorage.Harga storage data = s.hargaList[_id];
        require(data.hargaId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.hargaIds, _id);
        emit HargaDeleted(_id, block.timestamp);
    }

    function getHargaById(
        uint256 _id
    ) external view returns (AppStorage.Harga memory) {
        return AppStorage.posStorage().hargaList[_id];
    }

    // Pagination: Get all Harga with offset and limit
    function getAllHarga(
        uint256 _offset,
        uint256 _limit
    ) external view returns (AppStorage.Harga[] memory result, uint256 total) {
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        uint256[] memory allIds = s.hargaIds;
        total = allIds.length;
        if (_offset >= total) return (new AppStorage.Harga[](0), total);

        uint256 resultLength = (total - _offset) < _limit
            ? (total - _offset)
            : _limit;
        result = new AppStorage.Harga[](resultLength);
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = s.hargaList[allIds[_offset + i]];
        }
    }

    // Pagination: Get Harga where isDefault = true
    function getAllHargaDefaultOn(
        uint256 _offset,
        uint256 _limit
    ) external view returns (AppStorage.Harga[] memory result, uint256 total) {
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        uint256[] memory allIds = s.hargaIds;

        // First pass: count default items
        uint256 defaultCount = 0;
        for (uint256 i = 0; i < allIds.length; i++) {
            if (
                s.hargaList[allIds[i]].isDefault &&
                !s.hargaList[allIds[i]].deleted
            ) {
                defaultCount++;
            }
        }
        total = defaultCount;
        if (_offset >= total) return (new AppStorage.Harga[](0), total);

        // Second pass: collect items with pagination
        uint256 resultLength = (total - _offset) < _limit
            ? (total - _offset)
            : _limit;
        result = new AppStorage.Harga[](resultLength);
        uint256 currentIndex = 0;
        uint256 collected = 0;

        for (
            uint256 i = 0;
            i < allIds.length && collected < resultLength;
            i++
        ) {
            AppStorage.Harga storage harga = s.hargaList[allIds[i]];
            if (harga.isDefault && !harga.deleted) {
                if (currentIndex >= _offset) {
                    result[collected] = harga;
                    collected++;
                }
                currentIndex++;
            }
        }
    }

    // Pagination: Get Harga where isDefault = false
    function getAllHargaDefaultOff(
        uint256 _offset,
        uint256 _limit
    ) external view returns (AppStorage.Harga[] memory result, uint256 total) {
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        uint256[] memory allIds = s.hargaIds;

        // First pass: count non-default items
        uint256 nonDefaultCount = 0;
        for (uint256 i = 0; i < allIds.length; i++) {
            if (
                !s.hargaList[allIds[i]].isDefault &&
                !s.hargaList[allIds[i]].deleted
            ) {
                nonDefaultCount++;
            }
        }
        total = nonDefaultCount;
        if (_offset >= total) return (new AppStorage.Harga[](0), total);

        // Second pass: collect items with pagination
        uint256 resultLength = (total - _offset) < _limit
            ? (total - _offset)
            : _limit;
        result = new AppStorage.Harga[](resultLength);
        uint256 currentIndex = 0;
        uint256 collected = 0;

        for (
            uint256 i = 0;
            i < allIds.length && collected < resultLength;
            i++
        ) {
            AppStorage.Harga storage harga = s.hargaList[allIds[i]];
            if (!harga.isDefault && !harga.deleted) {
                if (currentIndex >= _offset) {
                    result[collected] = harga;
                    collected++;
                }
                currentIndex++;
            }
        }
    }

    // Payung CRUD (no spbuId in AppStorage)

    function createPayung(
        string calldata _namaPayung,
        uint256[] calldata _dombakIds,
        bool _aktif
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        AppStorage.InventoryStorage storage inv = AppStorage.inventoryStorage();
        s.payungCounter++;
        uint256 newId = s.payungCounter;
        s.payungList[newId] = AppStorage.Payung({
            payungId: newId,
            namaPayung: _namaPayung,
            aktif: _aktif,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.payungIds.push(newId);
        for (uint256 i = 0; i < _dombakIds.length; i++) {
            inv.dombakToPayungIds[_dombakIds[i]].push(newId);
        }
        inv.payungToDombakIds[newId] = _dombakIds;
        emit PayungCreated(newId, _namaPayung, block.timestamp);
        return newId;
    }

    function updatePayung(
        uint256 _id,
        string calldata _namaPayung,
        uint256[] calldata _dombakIds,
        bool _aktif
    ) external {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        AppStorage.Payung storage data = s.payungList[_id];
        require(data.payungId != 0 && !data.deleted, "Not found");
        data.namaPayung = _namaPayung;
        data.aktif = _aktif;
        data.updatedAt = block.timestamp;

        AppStorage.InventoryStorage storage inv = AppStorage.inventoryStorage();

        uint256[] memory oldDombakIds = inv.payungToDombakIds[_id];
        for (uint256 i = 0; i < oldDombakIds.length; i++) {
            _removeFromArray(inv.dombakToPayungIds[oldDombakIds[i]], _id);
            _removeFromArray(inv.payungToDombakIds[_id], oldDombakIds[i]);
        }

        inv.payungToDombakIds[_id] = _dombakIds;
        for (uint256 i = 0; i < _dombakIds.length; i++) {
            inv.dombakToPayungIds[_dombakIds[i]].push(_id);
        }

        emit PayungUpdated(_id, _namaPayung, block.timestamp);
    }

    function getAllPayung(
        uint256 offset,
        uint256 limit
    ) external view returns (AppStorage.Payung[] memory) {
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        uint256 total = s.payungIds.length;
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        AppStorage.Payung[] memory data = new AppStorage.Payung[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            data[i - offset] = s.payungList[s.payungIds[i]];
        }
        return data;
    }

    function deletePayung(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        AppStorage.InventoryStorage storage inv = AppStorage.inventoryStorage();
        AppStorage.Payung storage data = s.payungList[_id];

        require(data.payungId != 0 && !data.deleted, "Not found");
        data.deleted = true;

        _removeFromArray(s.payungIds, _id);
        _removeFromArray(inv.payungToDombakIds[_id], _id);
        for (uint256 i = 0; i < inv.dombakToPayungIds[_id].length; i++) {
            _removeFromArray(
                inv.dombakToPayungIds[inv.dombakToPayungIds[_id][i]],
                _id
            );
        }
        emit PayungDeleted(_id, block.timestamp);
    }

    function getPayungById(
        uint256 _id
    ) external view returns (AppStorage.Payung memory) {
        return AppStorage.posStorage().payungList[_id];
    }

    function getDombakByPayungId(
        uint256 _payungId
    ) external view returns (uint256[] memory) {
        return AppStorage.inventoryStorage().payungToDombakIds[_payungId];
    }

    // Dispenser CRUD
    function createDispenser(
        uint256 _payungId,
        string calldata _namaDispenser,
        bool _aktif
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        require(s.payungList[_payungId].payungId != 0, "Payung not found");

        s.dispenserCounter++;
        uint256 newId = s.dispenserCounter;
        s.dispenserList[newId] = AppStorage.Dispenser({
            dispenserId: newId,
            payungId: _payungId,
            namaDispenser: _namaDispenser,
            aktif: _aktif,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.dispenserIds.push(newId);
        s.payungToDispenserList[_payungId].push(newId);
        emit DispenserCreated(
            newId,
            _payungId,
            _namaDispenser,
            block.timestamp
        );
        return newId;
    }

    function updateDispenser(
        uint256 _id,
        string calldata _namaDispenser,
        uint256 _payungId,
        bool _aktif
    ) external {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        AppStorage.Dispenser storage data = s.dispenserList[_id];
        require(data.dispenserId != 0 && !data.deleted, "Not found");

        data.namaDispenser = _namaDispenser;
        data.aktif = _aktif;
        data.updatedAt = block.timestamp;

        if (_payungId != data.payungId) {
            _removeFromArray(s.payungToDispenserList[data.payungId], _id);
            s.payungToDispenserList[_payungId].push(_id);
        }
        emit DispenserUpdated(_id, _namaDispenser, block.timestamp);
    }

    function deleteDispenser(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        AppStorage.Dispenser storage data = s.dispenserList[_id];
        require(data.dispenserId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.dispenserIds, _id);
        _removeFromArray(s.payungToDispenserList[data.payungId], _id);
        emit DispenserDeleted(_id, block.timestamp);
    }

    function getDispenserById(
        uint256 _id
    ) external view returns (AppStorage.Dispenser memory) {
        return AppStorage.posStorage().dispenserList[_id];
    }

    function getAllDispenser(
        uint256 offset,
        uint256 limit
    ) external view returns (AppStorage.Dispenser[] memory) {
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        uint256 total = s.dispenserIds.length;
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        AppStorage.Dispenser[] memory data = new AppStorage.Dispenser[](
            end - offset
        );
        for (uint256 i = offset; i < end; i++) {
            data[i - offset] = s.dispenserList[s.dispenserIds[i]];
        }
        return data;
    }

    // Nozzle CRUD
    function createNozzle(
        uint256 _dispenserId,
        uint256 _produkId,
        string calldata _namaNozzle,
        bool _aktif
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        require(
            s.dispenserList[_dispenserId].dispenserId != 0,
            "Dispenser not found"
        );

        s.nozzleCounter++;
        uint256 newId = s.nozzleCounter;
        s.nozzleList[newId] = AppStorage.Nozzle({
            nozzleId: newId,
            dispenserId: _dispenserId,
            produkId: _produkId,
            namaNozzle: _namaNozzle,
            aktif: _aktif,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.nozzleIds.push(newId);
        s.dispenserToNozzleList[_dispenserId].push(newId);
        s.produkToNozzleList[_produkId].push(newId);
        emit NozzleCreated(newId, _dispenserId, _namaNozzle, block.timestamp);
        return newId;
    }

    function updateNozzle(
        uint256 _id,
        uint256 _dispenserId,
        uint256 _produkId,
        string calldata _namaNozzle,
        bool _aktif
    ) external {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        AppStorage.Nozzle storage data = s.nozzleList[_id];
        require(data.nozzleId != 0 && !data.deleted, "Not found");

        data.namaNozzle = _namaNozzle;
        data.aktif = _aktif;
        data.updatedAt = block.timestamp;

        if (_dispenserId != data.dispenserId) {
            _removeFromArray(s.dispenserToNozzleList[data.dispenserId], _id);
            s.dispenserToNozzleList[_dispenserId].push(_id);
        }
        if (_produkId != data.produkId) {
            _removeFromArray(s.produkToNozzleList[data.produkId], _id);
            s.produkToNozzleList[_produkId].push(_id);
        }
        emit NozzleUpdated(_id, _namaNozzle, block.timestamp);
    }

    function deleteNozzle(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        AppStorage.Nozzle storage data = s.nozzleList[_id];
        require(data.nozzleId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.nozzleIds, _id);
        _removeFromArray(s.dispenserToNozzleList[data.dispenserId], _id);
        _removeFromArray(s.produkToNozzleList[data.produkId], _id);
        emit NozzleDeleted(_id, block.timestamp);
    }

    function getAllNozzle(
        uint256 offset,
        uint256 limit
    ) external view returns (AppStorage.Nozzle[] memory) {
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        uint256 total = s.nozzleIds.length;
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        AppStorage.Nozzle[] memory data = new AppStorage.Nozzle[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            data[i - offset] = s.nozzleList[s.nozzleIds[i]];
        }
        return data;
    }

    function getNozzleById(
        uint256 _id
    ) external view returns (AppStorage.Nozzle memory) {
        return AppStorage.posStorage().nozzleList[_id];
    }

    // StandMeter CRUD (matches AppStorage exactly)
    function createStandMeter(
        uint256 _nozzleId,
        uint256 _jamKerjaId,
        uint256 _dombakId,
        uint256 _tanggal,
        uint256 _standMeterAwal,
        uint256 _standMeterAkhir
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        require(s.nozzleList[_nozzleId].nozzleId != 0, "Nozzle not found");

        s.standMeterCounter++;
        uint256 newId = s.standMeterCounter;
        s.standMeterList[newId] = AppStorage.StandMeter({
            standMeterId: newId,
            nozzleId: _nozzleId,
            jamKerjaId: _jamKerjaId,
            dombakId: _dombakId,
            tanggal: _tanggal,
            standMeterAwal: _standMeterAwal,
            standMeterAkhir: _standMeterAkhir,
            konfirmasi: false,
            konfirmasiBy: address(0),
            konfirmasiAt: 0,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.standMeterIds.push(newId);
        s.nozzleToStandMeterList[_nozzleId].push(newId);
        s.jamKerjaToStandMeterList[_jamKerjaId].push(newId);
        s.dombakToStandMeterList[_dombakId].push(newId);
        emit StandMeterCreated(newId, _nozzleId, block.timestamp);
        return newId;
    }

    function updateStandMeter(
        uint256 _id,
        uint256 _nozzleId,
        uint256 _jamKerjaId,
        uint256 _dombakId,
        uint256 _tanggal,
        uint256 _standMeterAwal,
        uint256 _standMeterAkhir
    ) external {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        AppStorage.StandMeter storage data = s.standMeterList[_id];
        require(data.standMeterId != 0 && !data.deleted, "Not found");

        data.nozzleId = _nozzleId;
        data.jamKerjaId = _jamKerjaId;
        data.dombakId = _dombakId;
        data.tanggal = _tanggal;
        data.standMeterAwal = _standMeterAwal;
        data.standMeterAkhir = _standMeterAkhir;
        data.updatedAt = block.timestamp;

        if (_nozzleId != data.nozzleId) {
            _removeFromArray(s.nozzleToStandMeterList[data.nozzleId], _id);
            s.nozzleToStandMeterList[_nozzleId].push(_id);
        }
        if (_jamKerjaId != data.jamKerjaId) {
            _removeFromArray(s.jamKerjaToStandMeterList[data.jamKerjaId], _id);
            s.jamKerjaToStandMeterList[_jamKerjaId].push(_id);
        }
        if (_dombakId != data.dombakId) {
            _removeFromArray(s.dombakToStandMeterList[data.dombakId], _id);
            s.dombakToStandMeterList[_dombakId].push(_id);
        }
        emit StandMeterUpdated(_id, _nozzleId, block.timestamp);
    }

    function deleteStandMeter(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        AppStorage.StandMeter storage data = s.standMeterList[_id];
        require(data.standMeterId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.standMeterIds, _id);
        _removeFromArray(s.nozzleToStandMeterList[data.nozzleId], _id);
        _removeFromArray(s.jamKerjaToStandMeterList[data.jamKerjaId], _id);
        _removeFromArray(s.dombakToStandMeterList[data.dombakId], _id);
        emit StandMeterDeleted(_id, block.timestamp);
    }

    function getStandMeterById(
        uint256 _id
    ) external view returns (AppStorage.StandMeter memory) {
        return AppStorage.posStorage().standMeterList[_id];
    }

    function getAllStandMeter(
        uint256 offset,
        uint256 limit
    ) external view returns (AppStorage.StandMeter[] memory) {
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        uint256 total = s.standMeterIds.length;
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        AppStorage.StandMeter[] memory data = new AppStorage.StandMeter[](
            end - offset
        );
        for (uint256 i = offset; i < end; i++) {
            data[i - offset] = s.standMeterList[s.standMeterIds[i]];
        }
        return data;
    }
}
