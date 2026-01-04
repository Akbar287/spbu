// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../storage/AppStorage.sol";

/**
 * @title AssetFileFacet
 * @notice FileFasilitas and FileAset CRUD
 * @dev Split from AssetFacet to reduce contract size below 24KB
 */
contract AssetFileFacet {
    event FileFasilitasCreated(
        uint256 indexed id,
        uint256 fasilitasId,
        string ipfsHash,
        string mimeType,
        uint256 createdAt
    );
    event FileFasilitasUpdated(
        uint256 indexed id,
        uint256 fasilitasId,
        string ipfsHash,
        uint256 updatedAt
    );
    event FileFasilitasDeleted(uint256 indexed id, uint256 deletedAt);

    event FileAsetCreated(
        uint256 indexed id,
        uint256 asetId,
        string ipfsHash,
        string mimeType,
        uint256 createdAt
    );
    event FileAsetUpdated(
        uint256 indexed id,
        uint256 asetId,
        string ipfsHash,
        uint256 updatedAt
    );
    event FileAsetDeleted(uint256 indexed id, uint256 deletedAt);

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

    function _isValidMime(
        string calldata _mimeType
    ) internal pure returns (bool) {
        bytes32 h = keccak256(bytes(_mimeType));
        return
            h == keccak256("image/png") ||
            h == keccak256("image/jpeg") ||
            h == keccak256("image/jpg") ||
            h == keccak256("application/pdf");
    }

    // ==================== FileFasilitas CRUD ====================
    function createFileFasilitas(
        uint256 _fasilitasId,
        string calldata _ipfsHash,
        string calldata _namaFile,
        string calldata _namaDokumen,
        string calldata _mimeType,
        uint256 _fileSize
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        require(
            s.fasilitasList[_fasilitasId].fasilitasId != 0 &&
                !s.fasilitasList[_fasilitasId].deleted,
            "Fasilitas not found"
        );
        require(bytes(_ipfsHash).length > 0, "IPFS hash empty");
        require(_isValidMime(_mimeType), "Invalid mime type");

        s.fileFasilitasCounter++;
        uint256 newId = s.fileFasilitasCounter;
        s.fileFasilitasList[newId] = AppStorage.FileFasilitas({
            fileFasilitasId: newId,
            fasilitasId: _fasilitasId,
            ipfsHash: _ipfsHash,
            namaFile: _namaFile,
            namaDokumen: _namaDokumen,
            mimeType: _mimeType,
            fileSize: _fileSize,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.fasilitasToFileFasilitasIds[_fasilitasId].push(newId);
        emit FileFasilitasCreated(
            newId,
            _fasilitasId,
            _ipfsHash,
            _mimeType,
            block.timestamp
        );
        return newId;
    }

    function updateFileFasilitas(
        uint256 _id,
        string calldata _ipfsHash,
        string calldata _namaFile,
        string calldata _namaDokumen,
        string calldata _mimeType,
        uint256 _fileSize
    ) external {
        _onlyAdmin();
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        AppStorage.FileFasilitas storage file = s.fileFasilitasList[_id];
        require(file.fileFasilitasId != 0 && !file.deleted, "Not found");
        require(bytes(_ipfsHash).length > 0, "IPFS hash empty");
        require(_isValidMime(_mimeType), "Invalid mime type");

        file.ipfsHash = _ipfsHash;
        file.namaFile = _namaFile;
        file.namaDokumen = _namaDokumen;
        file.mimeType = _mimeType;
        file.fileSize = _fileSize;
        file.updatedAt = block.timestamp;
        emit FileFasilitasUpdated(
            _id,
            file.fasilitasId,
            _ipfsHash,
            block.timestamp
        );
    }

    function deleteFileFasilitas(uint256 _id) external {
        _onlyAdmin();
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        AppStorage.FileFasilitas storage file = s.fileFasilitasList[_id];
        require(file.fileFasilitasId != 0 && !file.deleted, "Not found");

        file.deleted = true;
        file.updatedAt = block.timestamp;
        _removeFromArray(s.fasilitasToFileFasilitasIds[file.fasilitasId], _id);
        emit FileFasilitasDeleted(_id, block.timestamp);
    }

    function getFileFasilitasById(
        uint256 _id
    ) external view returns (AppStorage.FileFasilitas memory) {
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        require(s.fileFasilitasList[_id].fileFasilitasId != 0, "Not found");
        return s.fileFasilitasList[_id];
    }

    function getFilesByFasilitasId(
        uint256 _fasilitasId
    ) external view returns (AppStorage.FileFasilitas[] memory) {
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        uint256[] memory ids = s.fasilitasToFileFasilitasIds[_fasilitasId];
        uint256 activeCount = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (!s.fileFasilitasList[ids[i]].deleted) activeCount++;
        }
        AppStorage.FileFasilitas[]
            memory files = new AppStorage.FileFasilitas[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (!s.fileFasilitasList[ids[i]].deleted) {
                files[index] = s.fileFasilitasList[ids[i]];
                index++;
            }
        }
        return files;
    }

    // ==================== FileAset CRUD ====================
    function createFileAset(
        uint256 _asetId,
        string calldata _ipfsHash,
        string calldata _namaFile,
        string calldata _namaDokumen,
        string calldata _mimeType,
        uint256 _fileSize
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        require(
            s.asetList[_asetId].asetId != 0 && !s.asetList[_asetId].deleted,
            "Aset not found"
        );
        require(bytes(_ipfsHash).length > 0, "IPFS hash empty");
        require(_isValidMime(_mimeType), "Invalid mime type");

        s.fileAsetCounter++;
        uint256 newId = s.fileAsetCounter;
        s.fileAsetList[newId] = AppStorage.FileAset({
            fileAsetId: newId,
            asetId: _asetId,
            ipfsHash: _ipfsHash,
            namaFile: _namaFile,
            namaDokumen: _namaDokumen,
            mimeType: _mimeType,
            fileSize: _fileSize,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.asetToFileAsetIds[_asetId].push(newId);
        emit FileAsetCreated(
            newId,
            _asetId,
            _ipfsHash,
            _mimeType,
            block.timestamp
        );
        return newId;
    }

    function updateFileAset(
        uint256 _id,
        string calldata _ipfsHash,
        string calldata _namaFile,
        string calldata _namaDokumen,
        string calldata _mimeType,
        uint256 _fileSize
    ) external {
        _onlyAdmin();
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        AppStorage.FileAset storage file = s.fileAsetList[_id];
        require(file.fileAsetId != 0 && !file.deleted, "Not found");

        file.ipfsHash = _ipfsHash;
        file.namaFile = _namaFile;
        file.namaDokumen = _namaDokumen;
        file.mimeType = _mimeType;
        file.fileSize = _fileSize;
        file.updatedAt = block.timestamp;
        emit FileAsetUpdated(_id, file.asetId, _ipfsHash, block.timestamp);
    }

    function deleteFileAset(uint256 _id) external {
        _onlyAdmin();
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        AppStorage.FileAset storage file = s.fileAsetList[_id];
        require(file.fileAsetId != 0 && !file.deleted, "Not found");

        file.deleted = true;
        file.updatedAt = block.timestamp;
        _removeFromArray(s.asetToFileAsetIds[file.asetId], _id);
        emit FileAsetDeleted(_id, block.timestamp);
    }

    function getFileAsetById(
        uint256 _id
    ) external view returns (AppStorage.FileAset memory) {
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        require(s.fileAsetList[_id].fileAsetId != 0, "Not found");
        return s.fileAsetList[_id];
    }

    function getFilesByAsetId(
        uint256 _asetId
    ) external view returns (AppStorage.FileAset[] memory) {
        AppStorage.AsetStorage storage s = AppStorage.asetStorage();
        uint256[] memory ids = s.asetToFileAsetIds[_asetId];
        uint256 activeCount = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (!s.fileAsetList[ids[i]].deleted) activeCount++;
        }
        AppStorage.FileAset[] memory files = new AppStorage.FileAset[](
            activeCount
        );
        uint256 index = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (!s.fileAsetList[ids[i]].deleted) {
                files[index] = s.fileAsetList[ids[i]];
                index++;
            }
        }
        return files;
    }
}
