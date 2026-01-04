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
    event PayungDeleted(uint256 indexed id, uint256 deletedAt);
    event DispenserCreated(
        uint256 indexed id,
        uint256 indexed payungId,
        string namaDispenser,
        uint256 createdAt
    );
    event DispenserDeleted(uint256 indexed id, uint256 deletedAt);
    event NozzleCreated(
        uint256 indexed id,
        uint256 indexed dispenserId,
        string namaNozzle,
        uint256 createdAt
    );
    event NozzleDeleted(uint256 indexed id, uint256 deletedAt);
    event StandMeterCreated(
        uint256 indexed id,
        uint256 indexed nozzleId,
        uint256 createdAt
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

    // Harga CRUD
    function createHarga(
        uint256 _produkId,
        uint256 _jamKerjaId,
        uint256 _hargaJual,
        uint256 _hargaBeli,
        bool _isDefault
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        s.hargaCounter++;
        uint256 newId = s.hargaCounter;
        s.hargaList[newId] = AppStorage.Harga({
            hargaId: newId,
            produkId: _produkId,
            jamKerjaId: _jamKerjaId,
            hargaJual: _hargaJual,
            hargaBeli: _hargaBeli,
            isDefault: _isDefault,
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

    // Payung CRUD (no spbuId in AppStorage)
    function createPayung(
        string calldata _namaPayung,
        bool _aktif
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
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
        emit PayungCreated(newId, _namaPayung, block.timestamp);
        return newId;
    }

    function deletePayung(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        AppStorage.Payung storage data = s.payungList[_id];
        require(data.payungId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.payungIds, _id);
        emit PayungDeleted(_id, block.timestamp);
    }

    function getPayungById(
        uint256 _id
    ) external view returns (AppStorage.Payung memory) {
        return AppStorage.posStorage().payungList[_id];
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

    function deleteDispenser(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        AppStorage.Dispenser storage data = s.dispenserList[_id];
        require(data.dispenserId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.dispenserIds, _id);
        emit DispenserDeleted(_id, block.timestamp);
    }

    function getDispenserById(
        uint256 _id
    ) external view returns (AppStorage.Dispenser memory) {
        return AppStorage.posStorage().dispenserList[_id];
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
        emit NozzleCreated(newId, _dispenserId, _namaNozzle, block.timestamp);
        return newId;
    }

    function deleteNozzle(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        AppStorage.Nozzle storage data = s.nozzleList[_id];
        require(data.nozzleId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.nozzleIds, _id);
        emit NozzleDeleted(_id, block.timestamp);
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
        emit StandMeterCreated(newId, _nozzleId, block.timestamp);
        return newId;
    }

    function deleteStandMeter(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        AppStorage.StandMeter storage data = s.standMeterList[_id];
        require(data.standMeterId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.standMeterIds, _id);
        emit StandMeterDeleted(_id, block.timestamp);
    }

    function getStandMeterById(
        uint256 _id
    ) external view returns (AppStorage.StandMeter memory) {
        return AppStorage.posStorage().standMeterList[_id];
    }
}
