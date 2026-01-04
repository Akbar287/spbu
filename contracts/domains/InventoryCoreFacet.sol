// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";

/**
 * @title InventoryCoreFacet
 * @notice Core inventory entities: Produk, Dombak, StokInventory, StokInventoryDombak, TypeDokumenStok
 * @dev Split from InventoryFacet to reduce contract size below 24KB limit
 */
contract InventoryCoreFacet {
    // ==================== Events ====================

    event ProdukCreated(
        uint256 indexed produkId,
        uint256 indexed spbuId,
        string namaProduk,
        uint256 createdAt
    );
    event ProdukUpdated(
        uint256 indexed produkId,
        string namaProduk,
        uint256 updatedAt
    );
    event ProdukDeleted(uint256 indexed produkId, uint256 deletedAt);

    event DombakCreated(
        uint256 indexed dombakId,
        uint256 indexed spbuId,
        string namaDombak,
        uint256 createdAt
    );
    event DombakUpdated(
        uint256 indexed dombakId,
        string namaDombak,
        uint256 updatedAt
    );
    event DombakDeleted(uint256 indexed dombakId, uint256 deletedAt);

    event StokInventoryCreated(
        uint256 indexed stokInventoryId,
        uint256 indexed produkId,
        uint256 createdAt
    );
    event StokInventoryUpdated(
        uint256 indexed stokInventoryId,
        uint256 stok,
        uint256 updatedAt
    );
    event StokInventoryDeleted(
        uint256 indexed stokInventoryId,
        uint256 deletedAt
    );

    event StokInventoryDombakCreated(
        uint256 indexed id,
        uint256 indexed dombakId,
        uint256 createdAt
    );
    event StokInventoryDombakUpdated(uint256 indexed id, uint256 updatedAt);
    event StokInventoryDombakDeleted(uint256 indexed id, uint256 deletedAt);

    event TypeDokumenStokCreated(
        uint256 indexed typeId,
        string typeMovement,
        uint256 createdAt
    );
    event TypeDokumenStokUpdated(
        uint256 indexed typeId,
        string typeMovement,
        uint256 updatedAt
    );
    event TypeDokumenStokDeleted(uint256 indexed typeId, uint256 deletedAt);

    // ==================== Internal Access Control ====================

    function _onlyAdmin() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        require(
            ac.roles[keccak256("ADMIN_ROLE")][msg.sender],
            "InventoryCoreFacet: Admin only"
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

    // ==================== Produk CRUD ====================

    function createProduk(
        uint256 _spbuId,
        string calldata _namaProduk,
        bool _aktif,
        uint256 _oktan
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        require(
            AppStorage.orgStorage().spbuList[_spbuId].spbuId != 0,
            "SPBU not found"
        );

        s.produkCounter++;
        uint256 newId = s.produkCounter;

        s.produkList[newId] = AppStorage.Produk({
            produkId: newId,
            spbuId: _spbuId,
            namaProduk: _namaProduk,
            aktif: _aktif,
            oktan: _oktan,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.produkIds.push(newId);
        s.SpbuToProdukIds[_spbuId].push(newId);

        emit ProdukCreated(newId, _spbuId, _namaProduk, block.timestamp);
        return newId;
    }

    function updateProduk(
        uint256 _produkId,
        uint256 _spbuId,
        string calldata _namaProduk,
        bool _aktif,
        uint256 _oktan
    ) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.Produk storage data = s.produkList[_produkId];
        require(data.produkId != 0, "Not found");
        require(!data.deleted, "Deleted");

        data.spbuId = _spbuId;
        data.namaProduk = _namaProduk;
        data.aktif = _aktif;
        data.oktan = _oktan;
        data.updatedAt = block.timestamp;

        emit ProdukUpdated(_produkId, _namaProduk, block.timestamp);
    }

    function deleteProduk(uint256 _produkId) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.Produk storage data = s.produkList[_produkId];
        require(data.produkId != 0, "Not found");
        require(!data.deleted, "Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;
        _removeFromArray(s.produkIds, _produkId);
        _removeFromArray(s.SpbuToProdukIds[data.spbuId], _produkId);

        emit ProdukDeleted(_produkId, block.timestamp);
    }

    function getProdukById(
        uint256 _produkId
    ) external view returns (AppStorage.Produk memory) {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        require(s.produkList[_produkId].produkId != 0, "Not found");
        return s.produkList[_produkId];
    }

    function getProdukBySpbu(
        uint256 _spbuId
    ) external view returns (AppStorage.Produk[] memory) {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        uint256[] memory ids = s.SpbuToProdukIds[_spbuId];
        AppStorage.Produk[] memory result = new AppStorage.Produk[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.produkList[ids[i]];
        }
        return result;
    }

    // ==================== Dombak CRUD ====================

    function createDombak(
        uint256 _spbuId,
        string calldata _namaDombak,
        bool _aktif
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        require(
            AppStorage.orgStorage().spbuList[_spbuId].spbuId != 0,
            "SPBU not found"
        );

        s.dombakCounter++;
        uint256 newId = s.dombakCounter;

        s.dombakList[newId] = AppStorage.Dombak({
            dombakId: newId,
            spbuId: _spbuId,
            namaDombak: _namaDombak,
            aktif: _aktif,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.dombakIds.push(newId);
        s.SpbuToDombakIds[_spbuId].push(newId);

        emit DombakCreated(newId, _spbuId, _namaDombak, block.timestamp);
        return newId;
    }

    function updateDombak(
        uint256 _dombakId,
        uint256 _spbuId,
        string calldata _namaDombak,
        bool _aktif
    ) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.Dombak storage data = s.dombakList[_dombakId];
        require(data.dombakId != 0, "Not found");
        require(!data.deleted, "Deleted");

        data.spbuId = _spbuId;
        data.namaDombak = _namaDombak;
        data.aktif = _aktif;
        data.updatedAt = block.timestamp;

        emit DombakUpdated(_dombakId, _namaDombak, block.timestamp);
    }

    function deleteDombak(uint256 _dombakId) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.Dombak storage data = s.dombakList[_dombakId];
        require(data.dombakId != 0, "Not found");
        require(!data.deleted, "Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;
        _removeFromArray(s.dombakIds, _dombakId);
        _removeFromArray(s.SpbuToDombakIds[data.spbuId], _dombakId);

        emit DombakDeleted(_dombakId, block.timestamp);
    }

    function getDombakById(
        uint256 _dombakId
    ) external view returns (AppStorage.Dombak memory) {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        require(s.dombakList[_dombakId].dombakId != 0, "Not found");
        return s.dombakList[_dombakId];
    }

    function getDombakBySpbu(
        uint256 _spbuId
    ) external view returns (AppStorage.Dombak[] memory) {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        uint256[] memory ids = s.SpbuToDombakIds[_spbuId];
        AppStorage.Dombak[] memory result = new AppStorage.Dombak[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.dombakList[ids[i]];
        }
        return result;
    }

    // ==================== StokInventory CRUD ====================

    function createStokInventory(
        uint256 _produkId,
        uint256 _stok
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        require(s.produkList[_produkId].produkId != 0, "Produk not found");
        require(
            s.produkToStokInventoryId[_produkId] == 0,
            "StokInventory already exists"
        );

        s.stokInventoryCounter++;
        uint256 newId = s.stokInventoryCounter;

        s.stokInventoryList[newId] = AppStorage.StokInventory({
            stokInventoryId: newId,
            produkId: _produkId,
            stok: _stok,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.stokInventoryIds.push(newId);
        s.produkToStokInventoryId[_produkId] = newId;

        emit StokInventoryCreated(newId, _produkId, block.timestamp);
        return newId;
    }

    function updateStokInventory(
        uint256 _stokInventoryId,
        uint256 _stok
    ) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.StokInventory storage data = s.stokInventoryList[
            _stokInventoryId
        ];
        require(data.stokInventoryId != 0, "Not found");
        require(!data.deleted, "Deleted");

        data.stok = _stok;
        data.updatedAt = block.timestamp;

        emit StokInventoryUpdated(_stokInventoryId, _stok, block.timestamp);
    }

    function deleteStokInventory(uint256 _id) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.StokInventory storage data = s.stokInventoryList[_id];
        require(data.stokInventoryId != 0, "Not found");
        require(!data.deleted, "Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;
        _removeFromArray(s.stokInventoryIds, _id);
        s.produkToStokInventoryId[data.produkId] = 0;

        emit StokInventoryDeleted(_id, block.timestamp);
    }

    function getStokInventoryById(
        uint256 _id
    ) external view returns (AppStorage.StokInventory memory) {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        require(s.stokInventoryList[_id].stokInventoryId != 0, "Not found");
        return s.stokInventoryList[_id];
    }

    function getStokInventoryByProduk(
        uint256 _produkId
    ) external view returns (AppStorage.StokInventory memory) {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        uint256 id = s.produkToStokInventoryId[_produkId];
        require(id != 0, "Not found");
        return s.stokInventoryList[id];
    }

    // ==================== StokInventoryDombak CRUD ====================

    function createStokInventoryDombak(
        uint256 _stokInventoryId,
        uint256 _dombakId,
        uint256 _stok
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        require(
            s.stokInventoryList[_stokInventoryId].stokInventoryId != 0,
            "StokInventory not found"
        );
        require(s.dombakList[_dombakId].dombakId != 0, "Dombak not found");

        s.stokInventoryDombakCounter++;
        uint256 newId = s.stokInventoryDombakCounter;

        s.stokInventoryDombakList[newId] = AppStorage.StokInventoryDombak({
            stokInventoryDombakId: newId,
            stokInventoryId: _stokInventoryId,
            dombakId: _dombakId,
            stok: _stok,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.stokInventoryDombakIds.push(newId);
        s.stokInventoryToStokInventoryDombakIds[_stokInventoryId].push(newId);
        s.dombakToStokInventoryIds[_dombakId].push(_stokInventoryId);

        emit StokInventoryDombakCreated(newId, _dombakId, block.timestamp);
        return newId;
    }

    function updateStokInventoryDombak(uint256 _id, uint256 _stok) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.StokInventoryDombak storage data = s.stokInventoryDombakList[
            _id
        ];
        require(data.stokInventoryDombakId != 0, "Not found");
        require(!data.deleted, "Deleted");

        data.stok = _stok;
        data.updatedAt = block.timestamp;

        emit StokInventoryDombakUpdated(_id, block.timestamp);
    }

    function deleteStokInventoryDombak(uint256 _id) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.StokInventoryDombak storage data = s.stokInventoryDombakList[
            _id
        ];
        require(data.stokInventoryDombakId != 0, "Not found");
        require(!data.deleted, "Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;
        _removeFromArray(s.stokInventoryDombakIds, _id);
        _removeFromArray(
            s.stokInventoryToStokInventoryDombakIds[data.stokInventoryId],
            _id
        );

        emit StokInventoryDombakDeleted(_id, block.timestamp);
    }

    function getStokInventoryDombakById(
        uint256 _id
    ) external view returns (AppStorage.StokInventoryDombak memory) {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        require(
            s.stokInventoryDombakList[_id].stokInventoryDombakId != 0,
            "Not found"
        );
        return s.stokInventoryDombakList[_id];
    }

    // ==================== TypeDokumenStok CRUD ====================

    function createTypeDokumenStok(
        string calldata _typeMovement,
        string calldata _deskripsi
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();

        s.typeDokumenStokCounter++;
        uint256 newId = s.typeDokumenStokCounter;

        s.typeDokumenStokList[newId] = AppStorage.TypeDokumenStok({
            typeDokumenStokId: newId,
            typeMovement: _typeMovement,
            deskripsi: _deskripsi,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.typeDokumenStokIds.push(newId);

        emit TypeDokumenStokCreated(newId, _typeMovement, block.timestamp);
        return newId;
    }

    function updateTypeDokumenStok(
        uint256 _id,
        string calldata _typeMovement,
        string calldata _deskripsi
    ) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.TypeDokumenStok storage data = s.typeDokumenStokList[_id];
        require(data.typeDokumenStokId != 0, "Not found");
        require(!data.deleted, "Deleted");

        data.typeMovement = _typeMovement;
        data.deskripsi = _deskripsi;
        data.updatedAt = block.timestamp;

        emit TypeDokumenStokUpdated(_id, _typeMovement, block.timestamp);
    }

    function deleteTypeDokumenStok(uint256 _id) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        AppStorage.TypeDokumenStok storage data = s.typeDokumenStokList[_id];
        require(data.typeDokumenStokId != 0, "Not found");
        require(!data.deleted, "Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;
        _removeFromArray(s.typeDokumenStokIds, _id);

        emit TypeDokumenStokDeleted(_id, block.timestamp);
    }

    function getTypeDokumenStokById(
        uint256 _id
    ) external view returns (AppStorage.TypeDokumenStok memory) {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        require(s.typeDokumenStokList[_id].typeDokumenStokId != 0, "Not found");
        return s.typeDokumenStokList[_id];
    }

    // ==================== Pagination Functions ====================

    function getAllProduk(
        uint256 _offset,
        uint256 _limit
    ) external view returns (AppStorage.Produk[] memory result, uint256 total) {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        uint256[] memory allIds = s.produkIds;
        total = allIds.length;
        if (_offset >= total) return (new AppStorage.Produk[](0), total);

        uint256 resultLength = (total - _offset) < _limit
            ? (total - _offset)
            : _limit;
        result = new AppStorage.Produk[](resultLength);
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = s.produkList[allIds[_offset + i]];
        }
    }

    function getAllDombak(
        uint256 _offset,
        uint256 _limit
    ) external view returns (AppStorage.Dombak[] memory result, uint256 total) {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        uint256[] memory allIds = s.dombakIds;
        total = allIds.length;
        if (_offset >= total) return (new AppStorage.Dombak[](0), total);

        uint256 resultLength = (total - _offset) < _limit
            ? (total - _offset)
            : _limit;
        result = new AppStorage.Dombak[](resultLength);
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = s.dombakList[allIds[_offset + i]];
        }
    }

    // ==================== Dombak-Payung Many-to-Many ====================

    function assignDombakToPayung(
        uint256 _dombakId,
        uint256 _payungId
    ) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        require(s.dombakList[_dombakId].dombakId != 0, "Dombak not found");

        s.dombakToPayungIds[_dombakId].push(_payungId);
        s.payungToDombakIds[_payungId].push(_dombakId);
    }

    function removeDombakFromPayung(
        uint256 _dombakId,
        uint256 _payungId
    ) external {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();

        _removeFromArray(s.dombakToPayungIds[_dombakId], _payungId);
        _removeFromArray(s.payungToDombakIds[_payungId], _dombakId);
    }

    function getPayungsByDombak(
        uint256 _dombakId
    ) external view returns (uint256[] memory) {
        return AppStorage.inventoryStorage().dombakToPayungIds[_dombakId];
    }

    function getDombaksByPayung(
        uint256 _payungId
    ) external view returns (uint256[] memory) {
        return AppStorage.inventoryStorage().payungToDombakIds[_payungId];
    }

    // ==================== Utility Functions ====================

    function getTotalProduk() external view returns (uint256) {
        return AppStorage.inventoryStorage().produkIds.length;
    }

    function getTotalDombak() external view returns (uint256) {
        return AppStorage.inventoryStorage().dombakIds.length;
    }
}
