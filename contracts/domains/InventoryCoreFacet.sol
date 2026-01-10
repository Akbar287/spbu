// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";
import "../structs/ViewStructs.sol";

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
    function getDataToCreateStokInventory()
        external
        view
        returns (MonitoringStokCreateInfo memory)
    {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();

        // 1. Hitung Produk yang belum punya Stok
        uint256 availableProdukCount = 0;
        for (uint256 i = 0; i < s.produkIds.length; i++) {
            if (s.produkToStokInventoryId[s.produkIds[i]] == 0) {
                availableProdukCount++;
            }
        }

        // 2. Hitung Dombak yang belum terpakai
        uint256 availableDombakCount = 0;
        for (uint256 i = 0; i < s.dombakIds.length; i++) {
            if (s.dombakToStokInventoryIds[s.dombakIds[i]].length == 0) {
                availableDombakCount++;
            }
        }

        // 3. Alokasi Memory Array dengan ukuran yang presisi
        AppStorage.Produk[] memory produkList = new AppStorage.Produk[](
            availableProdukCount
        );
        AppStorage.Dombak[] memory dombakList = new AppStorage.Dombak[](
            availableDombakCount
        );

        // 4. Isi ProdukList
        uint256 pIdx = 0;
        for (uint256 i = 0; i < s.produkIds.length; i++) {
            uint256 pId = s.produkIds[i];
            if (s.produkToStokInventoryId[pId] == 0) {
                produkList[pIdx] = s.produkList[pId];
                pIdx++;
            }
        }

        // 5. Isi DombakList
        uint256 dIdx = 0;
        for (uint256 i = 0; i < s.dombakIds.length; i++) {
            uint256 dId = s.dombakIds[i];
            if (s.dombakToStokInventoryIds[dId].length == 0) {
                dombakList[dIdx] = s.dombakList[dId];
                dIdx++;
            }
        }

        return
            MonitoringStokCreateInfo({
                produkList: produkList,
                dombakList: dombakList
            });
    }

    function createStokInventory(
        uint256 _produkId,
        uint256[] calldata _dombakIds,
        uint256[] calldata _stoks
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();

        // Validasi Dasar
        require(_dombakIds.length == _stoks.length, "Length not match");
        require(s.produkList[_produkId].produkId != 0, "Produk not found");
        // MENCEGAH OVERWRITE: Pastikan produk belum punya stok
        require(
            s.produkToStokInventoryId[_produkId] == 0,
            "Stok for this product already exists"
        );

        uint256 totalStok = 0;

        // Loop 1: Validasi Dombak & Hitung Total Stok
        for (uint256 i = 0; i < _dombakIds.length; i++) {
            require(
                s.dombakList[_dombakIds[i]].dombakId != 0,
                "Dombak not found"
            );
            totalStok += _stoks[i];
        }

        s.stokInventoryCounter++;
        uint256 newId = s.stokInventoryCounter;

        // Simpan Header Stok Inventory
        s.stokInventoryList[newId] = AppStorage.StokInventory({
            stokInventoryId: newId,
            produkId: _produkId,
            stok: totalStok,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.produkToStokInventoryId[_produkId] = newId;
        s.stokInventoryIds.push(newId);

        // Loop 2: Simpan Rincian Stok per Dombak
        for (uint256 i = 0; i < _dombakIds.length; i++) {
            s.stokInventoryDombakCounter++;
            uint256 newSIDId = s.stokInventoryDombakCounter;

            s.stokInventoryDombakList[newSIDId] = AppStorage
                .StokInventoryDombak({
                    stokInventoryDombakId: newSIDId,
                    stokInventoryId: newId,
                    dombakId: _dombakIds[i],
                    stok: _stoks[i],
                    createdAt: block.timestamp,
                    updatedAt: block.timestamp,
                    deleted: false
                });

            s.stokInventoryDombakIds.push(newSIDId);
            s.stokInventoryToStokInventoryDombakIds[newId].push(newSIDId);
            s.dombakToStokInventoryIds[_dombakIds[i]].push(newId);
        }

        emit StokInventoryCreated(newId, _produkId, block.timestamp);
        return newId;
    }

    function updateStokInventory(
        uint256 _stokInventoryId,
        uint256[] calldata _newDombakIds,
        uint256[] calldata _newStoks
    ) external returns (bool) {
        _onlyAdmin();
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();

        // 1. Validasi Dasar
        require(_newDombakIds.length == _newStoks.length, "Length not match");
        AppStorage.StokInventory storage si = s.stokInventoryList[
            _stokInventoryId
        ];
        require(
            si.stokInventoryId != 0 && !si.deleted,
            "Stok Inventory not found"
        );

        bool isChanged = false; // Flag untuk melacak segala bentuk perubahan data
        uint256 totalStokBaru = 0;

        // 2. Deteksi Duplikasi Input & Hitung Total Stok Baru
        for (uint256 i = 0; i < _newDombakIds.length; i++) {
            for (uint256 j = 0; j < i; j++) {
                require(
                    _newDombakIds[i] != _newDombakIds[j],
                    "Duplicate dombakId in input"
                );
            }
            totalStokBaru += _newStoks[i];
        }

        // 3. Sync Rincian Lama (Handle Deletion)
        uint256[] storage currentSIDIds = s
            .stokInventoryToStokInventoryDombakIds[_stokInventoryId];
        for (uint256 i = 0; i < currentSIDIds.length; i++) {
            AppStorage.StokInventoryDombak storage sid = s
                .stokInventoryDombakList[currentSIDIds[i]];

            bool isStillExists = false;
            for (uint256 j = 0; j < _newDombakIds.length; j++) {
                if (sid.dombakId == _newDombakIds[j]) {
                    isStillExists = true;
                    break;
                }
            }

            // Jika dombak dihapus dari daftar input oleh user
            if (!isStillExists && !sid.deleted) {
                sid.deleted = true;
                sid.stok = 0;
                sid.updatedAt = block.timestamp;
                isChanged = true; // Komposisi berubah (penghapusan)
            }
        }

        // 4. Sync Input Baru (Handle Update & Creation)
        for (uint256 i = 0; i < _newDombakIds.length; i++) {
            uint256 targetDombakId = _newDombakIds[i];
            uint256 targetStok = _newStoks[i];
            bool foundInStorage = false;

            for (uint256 k = 0; k < currentSIDIds.length; k++) {
                AppStorage.StokInventoryDombak storage sid = s
                    .stokInventoryDombakList[currentSIDIds[k]];
                if (sid.dombakId == targetDombakId) {
                    foundInStorage = true;
                    // Hanya update jika nilai berubah atau status deleted berubah (re-aktivasi)
                    if (sid.stok != targetStok || sid.deleted) {
                        sid.stok = targetStok;
                        sid.deleted = false;
                        sid.updatedAt = block.timestamp;
                        isChanged = true; // Komposisi berubah (update nilai/status)
                    }
                    break;
                }
            }

            if (!foundInStorage) {
                // CREATE: Inisialisasi Dombak baru untuk produk ini
                require(
                    s.dombakList[targetDombakId].dombakId != 0,
                    "Dombak not found"
                );

                s.stokInventoryDombakCounter++;
                uint256 newSIDId = s.stokInventoryDombakCounter;

                s.stokInventoryDombakList[newSIDId] = AppStorage
                    .StokInventoryDombak({
                        stokInventoryDombakId: newSIDId,
                        dombakId: targetDombakId,
                        stokInventoryId: _stokInventoryId,
                        stok: targetStok,
                        createdAt: block.timestamp,
                        updatedAt: block.timestamp,
                        deleted: false
                    });

                s.stokInventoryDombakIds.push(newSIDId);
                s.stokInventoryToStokInventoryDombakIds[_stokInventoryId].push(
                    newSIDId
                );
                s.dombakToStokInventoryIds[targetDombakId].push(
                    _stokInventoryId
                );

                isChanged = true; // Komposisi berubah (penambahan baru)
            }
        }

        // 5. Finalize Header: Update jika ada rincian yang berubah
        // Meskipun totalStokBaru == si.stok, updatedAt akan tetap menyala jika ada re-alokasi dombak
        if (isChanged) {
            si.stok = totalStokBaru;
            si.updatedAt = block.timestamp;
        }

        emit StokInventoryUpdated(_stokInventoryId, si.produkId, totalStokBaru);
        return true;
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

    function getMonitoringStokEditInfo(
        uint256 _stokInventoryId
    ) external view returns (MonitoringStokEditInfo memory) {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();

        // 1. Ambil Header Stok
        AppStorage.StokInventory storage si = s.stokInventoryList[
            _stokInventoryId
        ];
        require(si.stokInventoryId != 0, "Stok Inventory not found");

        // 2. Ambil List Dombak yang Tersedia (Kosong ATAU milik stok ini)
        uint256 availableDombakCount = 0;
        for (uint256 i = 0; i < s.dombakIds.length; i++) {
            uint256 dId = s.dombakIds[i];
            // Dombak dianggap tersedia jika belum punya stok, atau sudah terikat ke stok ini
            if (
                s.dombakToStokInventoryIds[dId].length == 0 ||
                _isDombakInStok(s, dId, _stokInventoryId)
            ) {
                availableDombakCount++;
            }
        }

        AppStorage.Dombak[] memory dombakList = new AppStorage.Dombak[](
            availableDombakCount
        );
        uint256 dIdx = 0;
        for (uint256 i = 0; i < s.dombakIds.length; i++) {
            uint256 dId = s.dombakIds[i];
            if (
                s.dombakToStokInventoryIds[dId].length == 0 ||
                _isDombakInStok(s, dId, _stokInventoryId)
            ) {
                dombakList[dIdx] = s.dombakList[dId];
                dIdx++;
            }
        }

        // 3. Ambil Rincian Dombak yang saat ini terpasang (Current Details)
        uint256[] storage sidIds = s.stokInventoryToStokInventoryDombakIds[
            _stokInventoryId
        ];
        MonitoringStokDetailInfoOnStokInventoryDombak[]
            memory currentDetails = new MonitoringStokDetailInfoOnStokInventoryDombak[](
                sidIds.length
            );

        for (uint256 i = 0; i < sidIds.length; i++) {
            AppStorage.StokInventoryDombak storage sid = s
                .stokInventoryDombakList[sidIds[i]];
            currentDetails[i] = MonitoringStokDetailInfoOnStokInventoryDombak({
                stokInventoryDombakId: sid.stokInventoryDombakId,
                dombakId: sid.dombakId,
                namaDombak: s.dombakList[sid.dombakId].namaDombak,
                stok: sid.stok,
                createdAt: sid.createdAt,
                updatedAt: sid.updatedAt,
                deleted: sid.deleted
            });
        }

        return
            MonitoringStokEditInfo({
                stokInventoryId: si.stokInventoryId,
                produkId: si.produkId,
                namaProduk: s.produkList[si.produkId].namaProduk,
                totalStok: si.stok,
                stokInventoryDombakList: currentDetails,
                dombakList: dombakList,
                createdAt: si.createdAt,
                updatedAt: si.updatedAt,
                deleted: si.deleted
            });
    }

    // Helper internal untuk mengecek apakah dombak bagian dari stok ini
    function _isDombakInStok(
        AppStorage.InventoryStorage storage s,
        uint256 _dombakId,
        uint256 _targetStokId
    ) private view returns (bool) {
        uint256[] storage ids = s.dombakToStokInventoryIds[_dombakId];
        for (uint256 i = 0; i < ids.length; i++) {
            if (ids[i] == _targetStokId) return true;
        }
        return false;
    }

    function getStokInventoryDetail(
        uint256 _stokInventoryId
    ) external view returns (MonitoringStokDetailInfo memory) {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();

        // 1. Ambil referensi header Stok Inventory
        AppStorage.StokInventory storage si = s.stokInventoryList[
            _stokInventoryId
        ];
        require(si.stokInventoryId != 0, "Not found");

        // 2. Ambil ID rincian dombak terkait
        uint256[] storage sidIds = s.stokInventoryToStokInventoryDombakIds[
            _stokInventoryId
        ];

        // 3. INISIALISASI ARRAY MEMORY (Wajib dilakukan)
        MonitoringStokDetailInfoOnStokInventoryDombak[]
            memory result = new MonitoringStokDetailInfoOnStokInventoryDombak[](
                sidIds.length
            );

        // 4. Loop untuk mengisi rincian
        for (uint256 i = 0; i < sidIds.length; i++) {
            uint256 sidId = sidIds[i]; // Cache ID untuk hemat gas
            AppStorage.StokInventoryDombak storage sid = s
                .stokInventoryDombakList[sidId];
            AppStorage.Dombak storage dombak = s.dombakList[sid.dombakId];

            result[i] = MonitoringStokDetailInfoOnStokInventoryDombak({
                stokInventoryDombakId: sidId,
                dombakId: dombak.dombakId,
                namaDombak: dombak.namaDombak,
                stok: sid.stok,
                createdAt: sid.createdAt,
                updatedAt: sid.updatedAt,
                deleted: sid.deleted
            });
        }

        // 5. Kembalikan struct utama
        return
            MonitoringStokDetailInfo({
                stokInventoryId: si.stokInventoryId,
                produkId: si.produkId,
                namaProduk: s.produkList[si.produkId].namaProduk,
                totalStok: si.stok,
                stokInventoryDombakList: result,
                createdAt: si.createdAt,
                updatedAt: si.updatedAt,
                deleted: si.deleted
            });
    }

    function getStokInventoryPagination(
        uint256 offset,
        uint256 limit
    ) external view returns (AppStorage.StokInventory[] memory) {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        uint256 total = s.stokInventoryIds.length;
        uint256 start = offset * limit;
        uint256 end = start + limit;
        if (end > total) {
            end = total;
        }
        AppStorage.StokInventory[]
            memory result = new AppStorage.StokInventory[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = s.stokInventoryList[s.stokInventoryIds[i]];
        }
        return result;
    }

    function getStokInventoryPaginationCount() external view returns (uint256) {
        AppStorage.InventoryStorage storage s = AppStorage.inventoryStorage();
        return s.stokInventoryIds.length;
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
