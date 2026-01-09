// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";

/**
 * @title LogisticFileFacet
 * @notice FileLo, FileLampiranFileLo, Segel, Penerimaan, FilePenerimaan CRUD
 * @dev Split from LogisticFacet to reduce contract size below 24KB
 */
contract LogisticFileFacet {
    // ==================== Events ====================
    event FileLoCreated(
        uint256 indexed fileLoId,
        uint256 indexed pengirimanId,
        uint256 indexed produkId,
        uint256 createdAt
    );
    event FileLoUpdated(uint256 indexed fileLoId, uint256 updatedAt);
    event FileLoDeleted(uint256 indexed fileLoId, uint256 deletedAt);

    event FileLampiranFileLoCreated(
        uint256 indexed id,
        uint256 indexed fileLoId,
        uint256 createdAt
    );
    event FileLampiranFileLoDeleted(uint256 indexed id, uint256 deletedAt);

    event PengirimanUpdated(uint256 indexed id, uint256 createdAt);
    event SegelCreated(
        uint256 indexed segelId,
        uint256 indexed fileLoId,
        string noSegel,
        uint256 createdAt
    );
    event SegelUpdated(uint256 indexed segelId, uint256 updatedAt);
    event SegelDeleted(uint256 indexed segelId, uint256 deletedAt);
    event DetailRencanaPembelianUpdated(
        uint256 indexed pengirimanId,
        uint256 deletedAt
    );

    event PenerimaanCreated(
        uint256 indexed penerimaanId,
        uint256 indexed fileLoId,
        uint256 createdAt
    );
    event PenerimaanDeleted(uint256 indexed penerimaanId, uint256 deletedAt);

    event FilePenerimaanCreated(
        uint256 indexed id,
        uint256 indexed penerimaanId,
        uint256 createdAt
    );
    event FilePenerimaanDeleted(uint256 indexed id, uint256 deletedAt);

    // ==================== Internal ====================
    function _onlyAdmin() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        require(ac.roles[keccak256("ADMIN_ROLE")][msg.sender], "Admin only");
    }

    function _onlyDirekturAndDirekturUtama() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        require(
            ac.roles[keccak256("DIREKTUR_ROLE")][msg.sender] ||
                ac.roles[keccak256("DIREKTUR_UTAMA_ROLE")][msg.sender],
            "Direktur or Direktur Utama only"
        );
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

    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    // ==================== FileLo CRUD ====================
    function updateFileLo(
        uint256 _fileLoId,
        string calldata _ipfsHash,
        string calldata _noFaktur,
        string calldata _noLo
    ) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.FileLo storage data = s.fileLoList[_fileLoId];
        require(data.fileLoId != 0, "Not found");
        data.ipfsHash = _ipfsHash;
        data.noFaktur = _noFaktur;
        data.noLo = _noLo;
        data.updatedAt = block.timestamp;

        emit FileLoUpdated(_fileLoId, block.timestamp);
    }

    function konfirmasiPengirimanByAdmin(
        uint256 _pengirimanId,
        bool konfirmasiAdmin
    ) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.Pengiriman storage data = s.pengirimanList[_pengirimanId];
        require(data.pengirimanId != 0, "Not found");
        data.konfirmasiAdmin = konfirmasiAdmin;
        data.konfirmasiAdminBy = msg.sender;
        data.konfirmasiAdminAt = block.timestamp;
        emit PengirimanUpdated(_pengirimanId, block.timestamp);
    }

    function konfirmasiPengirimanByDirektur(
        uint256 _pengirimanId,
        bool konfirmasiDirektur
    ) external {
        _onlyDirekturAndDirekturUtama();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.Pengiriman storage data = s.pengirimanList[_pengirimanId];
        require(data.pengirimanId != 0, "Not found");
        data.konfirmasiDirektur = konfirmasiDirektur;
        data.konfirmasiDirekturBy = msg.sender;
        data.konfirmasiDirekturAt = block.timestamp;
        emit PengirimanUpdated(_pengirimanId, block.timestamp);
    }

    // ==================== FileLampiranFileLo CRUD ====================
    function createFileLampiranFileLo(
        uint256 _fileLoId,
        string calldata _ipfsHash,
        string calldata _namaFile,
        string calldata _namaDokumen,
        string calldata _mimeType,
        uint256 _fileSize
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        require(s.fileLoList[_fileLoId].fileLoId != 0, "FileLo not found");

        s.fileLampiranFileLoCounter++;
        uint256 newId = s.fileLampiranFileLoCounter;
        s.fileLampiranFileLoList[newId] = AppStorage.FileLampiranFileLo({
            fileLampiranFileLoId: newId,
            fileLoId: _fileLoId,
            ipfsHash: _ipfsHash,
            namaFile: _namaFile,
            namaDokumen: _namaDokumen,
            mimeType: _mimeType,
            fileSize: _fileSize,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.fileLampiranFileLoIds.push(newId);
        s.fileLoIdToFileLampiranFileLoIds[_fileLoId].push(newId);
        emit FileLampiranFileLoCreated(newId, _fileLoId, block.timestamp);
        return newId;
    }

    function deleteFileLampiranFileLo(uint256 _id) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.FileLampiranFileLo storage data = s.fileLampiranFileLoList[
            _id
        ];
        require(data.fileLampiranFileLoId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.fileLampiranFileLoIds, _id);
        emit FileLampiranFileLoDeleted(_id, block.timestamp);
    }

    function getFileLampiranByFileLo(
        uint256 _fileLoId
    ) external view returns (AppStorage.FileLampiranFileLo[] memory) {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        uint256[] memory ids = s.fileLoIdToFileLampiranFileLoIds[_fileLoId];
        AppStorage.FileLampiranFileLo[]
            memory result = new AppStorage.FileLampiranFileLo[](ids.length);
        for (uint256 i = 0; i < ids.length; i++)
            result[i] = s.fileLampiranFileLoList[ids[i]];
        return result;
    }

    function getFileLampiranById(
        uint256 _id
    ) external view returns (AppStorage.FileLampiranFileLo memory) {
        return AppStorage.logistikStorage().fileLampiranFileLoList[_id];
    }

    // ==================== Segel CRUD ====================
    function createSegel(
        uint256 _fileLoId,
        string calldata _noSegel
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        require(s.fileLoList[_fileLoId].fileLoId != 0, "FileLo not found");

        s.segelCounter++;
        uint256 newId = s.segelCounter;
        s.segelList[newId] = AppStorage.Segel({
            segelId: newId,
            fileLoId: _fileLoId,
            noSegel: _noSegel,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.segelIds.push(newId);
        s.fileLoIdToSegelIds[_fileLoId].push(newId);
        emit SegelCreated(newId, _fileLoId, _noSegel, block.timestamp);
        return newId;
    }

    function updateSegel(uint256 _id, string calldata _noSegel) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.Segel storage data = s.segelList[_id];
        require(data.segelId != 0 && !data.deleted, "Not found");
        data.noSegel = _noSegel;
        data.updatedAt = block.timestamp;
        emit SegelUpdated(_id, block.timestamp);
    }

    function deleteSegel(uint256 _id) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.Segel storage data = s.segelList[_id];
        require(data.segelId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.segelIds, _id);
        emit SegelDeleted(_id, block.timestamp);
    }

    function getSegelById(
        uint256 _id
    ) external view returns (AppStorage.Segel memory) {
        return AppStorage.logistikStorage().segelList[_id];
    }

    function getSegelByFileLo(
        uint256 _fileLoId
    ) external view returns (AppStorage.Segel[] memory) {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        uint256[] memory ids = s.fileLoIdToSegelIds[_fileLoId];
        AppStorage.Segel[] memory result = new AppStorage.Segel[](ids.length);
        for (uint256 i = 0; i < ids.length; i++)
            result[i] = s.segelList[ids[i]];
        return result;
    }

    // ==================== Penerimaan CRUD ====================
    function createPenerimaan(
        uint256 _fileLoId,
        uint256 _dokumenStokId,
        uint256 _tanggal
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        require(s.fileLoList[_fileLoId].fileLoId != 0, "FileLo not found");

        s.penerimaanCounter++;
        uint256 newId = s.penerimaanCounter;
        s.penerimaanList[newId] = AppStorage.Penerimaan({
            penerimaanId: newId,
            fileLoId: _fileLoId,
            dokumenStokId: _dokumenStokId,
            tanggal: _tanggal,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.penerimaanIds.push(newId);
        s.fileLoIdToPenerimaanIds[_fileLoId].push(newId);
        emit PenerimaanCreated(newId, _fileLoId, block.timestamp);
        return newId;
    }

    function deletePenerimaan(uint256 _id) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.Penerimaan storage data = s.penerimaanList[_id];
        require(data.penerimaanId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.penerimaanIds, _id);
        emit PenerimaanDeleted(_id, block.timestamp);
    }

    function getPenerimaanById(
        uint256 _id
    ) external view returns (AppStorage.Penerimaan memory) {
        return AppStorage.logistikStorage().penerimaanList[_id];
    }

    // ==================== FilePenerimaan CRUD ====================
    function createFilePenerimaan(
        uint256 _penerimaanId,
        string calldata _ipfsHash,
        string calldata _namaFile,
        string calldata _namaDokumen,
        string calldata _mimeType,
        uint256 _fileSize
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        require(
            s.penerimaanList[_penerimaanId].penerimaanId != 0,
            "Penerimaan not found"
        );

        s.filePenerimaanCounter++;
        uint256 newId = s.filePenerimaanCounter;
        s.filePenerimaanList[newId] = AppStorage.FilePenerimaan({
            filePenerimaanId: newId,
            penerimaanId: _penerimaanId,
            ipfsHash: _ipfsHash,
            namaFile: _namaFile,
            namaDokumen: _namaDokumen,
            mimeType: _mimeType,
            fileSize: _fileSize,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.filePenerimaanIds.push(newId);
        s.penerimaanIdToFilePenerimaanIds[_penerimaanId].push(newId);
        emit FilePenerimaanCreated(newId, _penerimaanId, block.timestamp);
        return newId;
    }

    function deleteFilePenerimaan(uint256 _id) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.FilePenerimaan storage data = s.filePenerimaanList[_id];
        require(data.filePenerimaanId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.filePenerimaanIds, _id);
        emit FilePenerimaanDeleted(_id, block.timestamp);
    }

    function getFilePenerimaanByPenerimaan(
        uint256 _penerimaanId
    ) external view returns (AppStorage.FilePenerimaan[] memory) {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        uint256[] memory ids = s.penerimaanIdToFilePenerimaanIds[_penerimaanId];
        AppStorage.FilePenerimaan[]
            memory result = new AppStorage.FilePenerimaan[](ids.length);
        for (uint256 i = 0; i < ids.length; i++)
            result[i] = s.filePenerimaanList[ids[i]];
        return result;
    }

    // ==================== Utility ====================
    function getTotalFileLo() external view returns (uint256) {
        return AppStorage.logistikStorage().fileLoIds.length;
    }
    function getTotalSegel() external view returns (uint256) {
        return AppStorage.logistikStorage().segelIds.length;
    }
    function getTotalPenerimaan() external view returns (uint256) {
        return AppStorage.logistikStorage().penerimaanIds.length;
    }
}
