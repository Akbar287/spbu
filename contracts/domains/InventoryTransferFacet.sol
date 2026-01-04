// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";

/**
 * @title InventoryTransferFacet
 * @notice DombakTransfer, Losses, JenisLosses, PenerimaanStokTaking CRUD
 * @dev Split from InventoryFacet - matches AppStorage.sol structs exactly
 */
contract InventoryTransferFacet {
    // ==================== Events ====================
    event DombakTransferCreated(
        uint256 indexed dombakTransferId,
        address indexed createdBy,
        uint256 createdAt
    );
    event DombakTransferConfirmed(
        uint256 indexed dombakTransferId,
        address indexed confirmedBy,
        uint256 confirmedAt
    );
    event DombakTransferDeleted(uint256 indexed id, uint256 deletedAt);

    event JenisLossesCreated(
        uint256 indexed jenisLossesId,
        string jenisLosses,
        uint256 createdAt
    );
    event JenisLossesDeleted(uint256 indexed jenisLossesId, uint256 deletedAt);

    event LossesCreated(
        uint256 indexed lossesId,
        uint256 indexed jenisLossesId,
        uint256 createdAt
    );
    event LossesDeleted(uint256 indexed lossesId, uint256 deletedAt);

    event PenerimaanStokTakingCreated(
        uint256 indexed id,
        uint256 indexed penerimaanId,
        uint256 indexed dokumenStokId,
        uint256 createdAt
    );
    event PenerimaanStokTakingDeleted(uint256 indexed id, uint256 deletedAt);

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

    // ==================== DombakTransfer CRUD ====================
    // Matches AppStorage.DombakTransfer exactly (16 fields)
    function createDombakTransfer(
        uint256 _produkId,
        uint256 _dombakDariId,
        uint256 _dombakKeId,
        uint256 _konversiId,
        uint256 _jamKerjaId,
        uint256 _tanggal,
        uint256 _waktu,
        int256 _jumlahTransfer
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        require(
            s.dombakList[_dombakDariId].dombakId != 0,
            "Dombak Dari not found"
        );
        require(s.dombakList[_dombakKeId].dombakId != 0, "Dombak Ke not found");
        require(s.produkList[_produkId].produkId != 0, "Produk not found");

        s.dombakTransferCounter++;
        uint256 newId = s.dombakTransferCounter;

        s.dombakTransferList[newId] = AppStorage.DombakTransfer({
            dombakTransferId: newId,
            produkId: _produkId,
            dombakDariId: _dombakDariId,
            dombakKeId: _dombakKeId,
            konversiId: _konversiId,
            jamKerjaId: _jamKerjaId,
            tanggal: _tanggal,
            waktu: _waktu,
            jumlahTransfer: _jumlahTransfer,
            konfirmasi: false,
            createdBy: msg.sender,
            confirmedBy: address(0),
            confirmedAt: 0,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.dombakTransferIds.push(newId);
        s.produkToDombakTransferIds[_produkId].push(newId);
        s.jamKerjaToDombakTransferIds[_jamKerjaId].push(newId);

        emit DombakTransferCreated(newId, msg.sender, block.timestamp);
        return newId;
    }

    function confirmDombakTransfer(uint256 _id) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.DombakTransfer storage data = s.dombakTransferList[_id];
        require(data.dombakTransferId != 0, "Not found");
        require(!data.deleted, "Deleted");
        require(!data.konfirmasi, "Already confirmed");

        data.konfirmasi = true;
        data.confirmedBy = msg.sender;
        data.confirmedAt = block.timestamp;
        data.updatedAt = block.timestamp;

        emit DombakTransferConfirmed(_id, msg.sender, block.timestamp);
    }

    function deleteDombakTransfer(uint256 _id) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.DombakTransfer storage data = s.dombakTransferList[_id];
        require(data.dombakTransferId != 0, "Not found");
        require(!data.deleted, "Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;
        _removeFromArray(s.dombakTransferIds, _id);

        emit DombakTransferDeleted(_id, block.timestamp);
    }

    function getDombakTransferById(
        uint256 _id
    ) external view returns (AppStorage.DombakTransfer memory) {
        return AppStorage.inventoryStorage().dombakTransferList[_id];
    }

    // ==================== JenisLosses CRUD ====================
    // Matches AppStorage.JenisLosses exactly (6 fields)
    function createJenisLosses(
        string calldata _jenisLosses,
        string calldata _deskripsi
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        s.jenisLossesCounter++;
        uint256 newId = s.jenisLossesCounter;

        s.jenisLossesList[newId] = AppStorage.JenisLosses({
            jenisLossesId: newId,
            jenisLosses: _jenisLosses,
            deskripsi: _deskripsi,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.jenisLossesIds.push(newId);
        emit JenisLossesCreated(newId, _jenisLosses, block.timestamp);
        return newId;
    }

    function deleteJenisLosses(uint256 _id) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.JenisLosses storage data = s.jenisLossesList[_id];
        require(data.jenisLossesId != 0, "Not found");

        data.deleted = true;
        data.updatedAt = block.timestamp;
        _removeFromArray(s.jenisLossesIds, _id);
        emit JenisLossesDeleted(_id, block.timestamp);
    }

    function getJenisLossesById(
        uint256 _id
    ) external view returns (AppStorage.JenisLosses memory) {
        return AppStorage.inventoryStorage().jenisLossesList[_id];
    }

    // ==================== Losses CRUD ====================
    // Matches AppStorage.Losses exactly (9 fields including SimbolLosses enum)
    function createLosses(
        uint256 _jenisLossesId,
        uint256 _dokumenStokId,
        uint256 _tanggal,
        AppStorage.SimbolLosses _simbol,
        int256 _stok
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        require(
            s.jenisLossesList[_jenisLossesId].jenisLossesId != 0,
            "JenisLosses not found"
        );
        require(
            s.dokumenStokList[_dokumenStokId].dokumenStokId != 0,
            "DokumenStok not found"
        );

        s.lossesCounter++;
        uint256 newId = s.lossesCounter;

        s.lossesList[newId] = AppStorage.Losses({
            lossesId: newId,
            jenisLossesId: _jenisLossesId,
            dokumenStokId: _dokumenStokId,
            tanggal: _tanggal,
            simbol: _simbol,
            stok: _stok,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.lossesIds.push(newId);
        s.jenisLossesToLossesIds[_jenisLossesId].push(newId);
        s.dokumenStokToLossesIds[_dokumenStokId].push(newId);

        emit LossesCreated(newId, _jenisLossesId, block.timestamp);
        return newId;
    }

    function deleteLosses(uint256 _id) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.Losses storage data = s.lossesList[_id];
        require(data.lossesId != 0, "Not found");

        data.deleted = true;
        data.updatedAt = block.timestamp;
        _removeFromArray(s.lossesIds, _id);
        _removeFromArray(s.jenisLossesToLossesIds[data.jenisLossesId], _id);

        emit LossesDeleted(_id, block.timestamp);
    }

    function getLossesById(
        uint256 _id
    ) external view returns (AppStorage.Losses memory) {
        return AppStorage.inventoryStorage().lossesList[_id];
    }

    // ==================== PenerimaanStokTaking CRUD ====================
    // Matches AppStorage.PenerimaanStokTaking exactly (6 fields)
    function createPenerimaanStokTaking(
        uint256 _penerimaanId,
        uint256 _dokumenStokId
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        require(
            s.dokumenStokList[_dokumenStokId].dokumenStokId != 0,
            "DokumenStok not found"
        );

        s.penerimaanStokTakingCounter++;
        uint256 newId = s.penerimaanStokTakingCounter;

        s.penerimaanStokTakingList[newId] = AppStorage.PenerimaanStokTaking({
            penerimaanStokTakingId: newId,
            penerimaanId: _penerimaanId,
            dokumenStokId: _dokumenStokId,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.penerimaanStokTakingIds.push(newId);
        emit PenerimaanStokTakingCreated(
            newId,
            _penerimaanId,
            _dokumenStokId,
            block.timestamp
        );
        return newId;
    }

    function deletePenerimaanStokTaking(uint256 _id) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.PenerimaanStokTaking storage data = s
            .penerimaanStokTakingList[_id];
        require(data.penerimaanStokTakingId != 0, "Not found");

        data.deleted = true;
        data.updatedAt = block.timestamp;
        _removeFromArray(s.penerimaanStokTakingIds, _id);
        emit PenerimaanStokTakingDeleted(_id, block.timestamp);
    }

    function getPenerimaanStokTakingById(
        uint256 _id
    ) external view returns (AppStorage.PenerimaanStokTaking memory) {
        return AppStorage.inventoryStorage().penerimaanStokTakingList[_id];
    }

    // ==================== Pagination ====================
    function getAllDombakTransfer(
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (AppStorage.DombakTransfer[] memory result, uint256 total)
    {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        uint256[] memory allIds = s.dombakTransferIds;
        total = allIds.length;
        if (_offset >= total)
            return (new AppStorage.DombakTransfer[](0), total);
        uint256 len = (total - _offset) < _limit ? (total - _offset) : _limit;
        result = new AppStorage.DombakTransfer[](len);
        for (uint256 i = 0; i < len; i++)
            result[i] = s.dombakTransferList[allIds[_offset + i]];
    }

    function getAllLosses(
        uint256 _offset,
        uint256 _limit
    ) external view returns (AppStorage.Losses[] memory result, uint256 total) {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        uint256[] memory allIds = s.lossesIds;
        total = allIds.length;
        if (_offset >= total) return (new AppStorage.Losses[](0), total);
        uint256 len = (total - _offset) < _limit ? (total - _offset) : _limit;
        result = new AppStorage.Losses[](len);
        for (uint256 i = 0; i < len; i++)
            result[i] = s.lossesList[allIds[_offset + i]];
    }
}
