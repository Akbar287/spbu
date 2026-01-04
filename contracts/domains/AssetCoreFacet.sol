// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../storage/AppStorage.sol";
import "../structs/ViewStructs.sol";

/**
 * @title AssetCoreFacet
 * @notice Fasilitas and Aset CRUD
 * @dev Split from AssetFacet to reduce contract size below 24KB
 */
contract AssetCoreFacet {
    event FasilitasCreated(
        uint256 indexed fasilitasId,
        uint256 indexed spbuId,
        string nama,
        uint256 createdAt
    );
    event FasilitasUpdated(
        uint256 indexed fasilitasId,
        uint256 indexed spbuId,
        string nama,
        uint256 updatedAt
    );
    event FasilitasDeleted(
        uint256 indexed fasilitasId,
        uint256 indexed spbuId,
        uint256 deletedAt
    );

    event AsetCreated(
        uint256 indexed asetId,
        uint256 indexed spbuId,
        string nama,
        uint256 createdAt
    );
    event AsetUpdated(
        uint256 indexed asetId,
        uint256 indexed spbuId,
        string nama,
        uint256 updatedAt
    );
    event AsetDeleted(
        uint256 indexed asetId,
        uint256 indexed spbuId,
        uint256 deletedAt
    );

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

    // ==================== Fasilitas CRUD ====================
    function createFasilitas(
        uint256 _spbuId,
        string calldata _nama,
        string calldata _keterangan,
        int256 _jumlah
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        require(
            AppStorage.orgStorage().spbuList[_spbuId].spbuId != 0,
            "SPBU not found"
        );

        s.fasilitasCounter++;
        uint256 newId = s.fasilitasCounter;
        s.fasilitasList[newId] = AppStorage.Fasilitas({
            fasilitasId: newId,
            spbuId: _spbuId,
            nama: _nama,
            keterangan: _keterangan,
            jumlah: _jumlah,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.allFasilitasIds.push(newId);
        s.spbuToFasilitasIds[_spbuId].push(newId);
        emit FasilitasCreated(newId, _spbuId, _nama, block.timestamp);
        return newId;
    }

    function updateFasilitas(
        uint256 _fasilitasId,
        uint256 _spbuId,
        string calldata _nama,
        string calldata _keterangan,
        int256 _jumlah
    ) external {
        _onlyAdmin();
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        AppStorage.Fasilitas storage fas = s.fasilitasList[_fasilitasId];
        require(fas.fasilitasId != 0 && !fas.deleted, "Not found");
        require(
            AppStorage.orgStorage().spbuList[_spbuId].spbuId != 0,
            "SPBU not found"
        );

        uint256 oldSpbuId = fas.spbuId;
        if (oldSpbuId != _spbuId) {
            _removeFromArray(s.spbuToFasilitasIds[oldSpbuId], _fasilitasId);
            s.spbuToFasilitasIds[_spbuId].push(_fasilitasId);
        }

        fas.spbuId = _spbuId;
        fas.nama = _nama;
        fas.keterangan = _keterangan;
        fas.jumlah = _jumlah;
        fas.updatedAt = block.timestamp;
        emit FasilitasUpdated(_fasilitasId, _spbuId, _nama, block.timestamp);
    }

    function deleteFasilitas(uint256 _fasilitasId) external {
        _onlyAdmin();
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        AppStorage.Fasilitas storage fas = s.fasilitasList[_fasilitasId];
        require(fas.fasilitasId != 0 && !fas.deleted, "Not found");

        fas.deleted = true;
        fas.updatedAt = block.timestamp;
        _removeFromArray(s.spbuToFasilitasIds[fas.spbuId], _fasilitasId);
        emit FasilitasDeleted(_fasilitasId, fas.spbuId, block.timestamp);
    }

    function getFasilitasById(
        uint256 _fasilitasId
    ) external view returns (AppStorage.Fasilitas memory) {
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        require(s.fasilitasList[_fasilitasId].fasilitasId != 0, "Not found");
        return s.fasilitasList[_fasilitasId];
    }

    function getFasilitasWithFiles(
        uint256 _fasilitasId
    ) external view returns (FasilitasWithFiles memory) {
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        require(s.fasilitasList[_fasilitasId].fasilitasId != 0, "Not found");

        uint256[] memory fileIds = s.fasilitasToFileFasilitasIds[_fasilitasId];
        uint256 activeCount = 0;
        for (uint256 i = 0; i < fileIds.length; i++) {
            if (!s.fileFasilitasList[fileIds[i]].deleted) activeCount++;
        }

        AppStorage.FileFasilitas[]
            memory files = new AppStorage.FileFasilitas[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < fileIds.length; i++) {
            if (!s.fileFasilitasList[fileIds[i]].deleted) {
                files[index] = s.fileFasilitasList[fileIds[i]];
                index++;
            }
        }
        return
            FasilitasWithFiles({
                fasilitas: s.fasilitasList[_fasilitasId],
                files: files
            });
    }

    function getAllFasilitas(
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (AppStorage.Fasilitas[] memory result, uint256 total)
    {
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        uint256[] memory allIds = s.allFasilitasIds;
        total = allIds.length;
        if (_offset >= total) return (new AppStorage.Fasilitas[](0), total);
        uint256 len = (total - _offset) < _limit ? (total - _offset) : _limit;
        result = new AppStorage.Fasilitas[](len);
        for (uint256 i = 0; i < len; i++)
            result[i] = s.fasilitasList[allIds[_offset + i]];
    }

    // ==================== Aset CRUD ====================
    function createAset(
        uint256 _spbuId,
        string calldata _nama,
        string calldata _keterangan,
        int256 _jumlah,
        int256 _harga,
        int256 _penyusutan,
        bool _digunakan
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        s.asetCounter++;
        uint256 newId = s.asetCounter;
        s.asetList[newId] = AppStorage.Aset({
            asetId: newId,
            spbuId: _spbuId,
            nama: _nama,
            keterangan: _keterangan,
            jumlah: _jumlah,
            harga: _harga,
            penyusutanPerHari: _penyusutan,
            digunakan: _digunakan,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.allAsetIds.push(newId);
        s.spbuToAsetIds[_spbuId].push(newId);
        emit AsetCreated(newId, _spbuId, _nama, block.timestamp);
        return newId;
    }

    function updateAset(
        uint256 _asetId,
        uint256 _spbuId,
        string memory _nama,
        string memory _keterangan,
        int256 _jumlah,
        int256 _harga,
        int256 _penyusutanPerHari,
        bool _digunakan
    ) external {
        _onlyAdmin();
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        AppStorage.Aset storage aset = s.asetList[_asetId];
        require(aset.asetId != 0 && !aset.deleted, "Not found");

        uint256 oldSpbuId = aset.spbuId;
        if (oldSpbuId != _spbuId) {
            _removeFromArray(s.spbuToAsetIds[oldSpbuId], _asetId);
            s.spbuToAsetIds[_spbuId].push(_asetId);
        }

        aset.spbuId = _spbuId;
        aset.nama = _nama;
        aset.keterangan = _keterangan;
        aset.jumlah = _jumlah;
        aset.harga = _harga;
        aset.penyusutanPerHari = _penyusutanPerHari;
        aset.digunakan = _digunakan;
        aset.updatedAt = block.timestamp;
        emit AsetUpdated(_asetId, _spbuId, _nama, block.timestamp);
    }

    function deleteAset(uint256 _asetId) external {
        _onlyAdmin();
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        AppStorage.Aset storage aset = s.asetList[_asetId];
        require(aset.asetId != 0 && !aset.deleted, "Not found");

        aset.deleted = true;
        aset.updatedAt = block.timestamp;
        _removeFromArray(s.spbuToAsetIds[aset.spbuId], _asetId);
        emit AsetDeleted(_asetId, aset.spbuId, block.timestamp);
    }

    function getAsetById(
        uint256 _asetId
    ) external view returns (AppStorage.Aset memory) {
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        require(s.asetList[_asetId].asetId != 0, "Not found");
        return s.asetList[_asetId];
    }

    function getAsetWithFiles(
        uint256 _asetId
    ) external view returns (AsetWithFiles memory) {
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        require(s.asetList[_asetId].asetId != 0, "Not found");

        uint256[] memory fileIds = s.asetToFileAsetIds[_asetId];
        uint256 activeCount = 0;
        for (uint256 i = 0; i < fileIds.length; i++) {
            if (!s.fileAsetList[fileIds[i]].deleted) activeCount++;
        }

        AppStorage.FileAset[] memory files = new AppStorage.FileAset[](
            activeCount
        );
        uint256 index = 0;
        for (uint256 i = 0; i < fileIds.length; i++) {
            if (!s.fileAsetList[fileIds[i]].deleted) {
                files[index] = s.fileAsetList[fileIds[i]];
                index++;
            }
        }
        return AsetWithFiles({aset: s.asetList[_asetId], files: files});
    }

    function getAllAset(
        uint256 _offset,
        uint256 _limit
    ) external view returns (AppStorage.Aset[] memory result, uint256 total) {
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        uint256[] memory allIds = s.allAsetIds;
        total = allIds.length;
        if (_offset >= total) return (new AppStorage.Aset[](0), total);
        uint256 len = (total - _offset) < _limit ? (total - _offset) : _limit;
        result = new AppStorage.Aset[](len);
        for (uint256 i = 0; i < len; i++)
            result[i] = s.asetList[allIds[_offset + i]];
    }
}
