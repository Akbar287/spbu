// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";

/**
 * @title QualityControlFacet
 * @notice Mengelola proses Tera (peminjaman dan pengembalian alat ukur/dombak) dalam Diamond Pattern
 * @dev Entities: Tera, DetailTera, TeraReturn
 *
 * Mapping Relations yang digunakan:
 * - teraToDetailTeraList: tera -> detailTera[]
 * - teraToPettyCashList: tera -> pettyCash[]
 * - pettyCashToTeraList: pettyCash -> tera[]
 * - dokumenStokToDetailTeraList: dokumenStok -> detailTera[]
 * - teraToTeraReturnDariList: tera -> teraReturn[] (as source)
 * - teraToTeraReturnKeList: tera -> teraReturn[] (as destination)
 *
 * Global ID Arrays:
 * - teraIds, detailTeraIds, teraReturnIds
 */
contract QualityControlFacet {
    // ==================== Events ====================

    // Tera Events
    event TeraCreated(
        uint256 indexed teraId,
        uint256 indexed spbuId,
        string noKode,
        uint256 createdAt
    );
    event TeraUpdated(uint256 indexed teraId, uint256 updatedAt);
    event TeraDeleted(uint256 indexed teraId, uint256 deletedAt);

    // DetailTera Events
    event DetailTeraCreated(
        uint256 indexed detailTeraId,
        uint256 indexed teraId,
        uint256 indexed dombakId,
        uint256 createdAt
    );
    event DetailTeraUpdated(uint256 indexed detailTeraId, uint256 updatedAt);
    event DetailTeraDeleted(uint256 indexed detailTeraId, uint256 deletedAt);

    // TeraReturn Events
    event TeraReturnCreated(
        uint256 indexed teraReturnId,
        uint256 indexed dariTeraId,
        uint256 indexed keTeraId,
        uint256 createdAt
    );
    event TeraReturnDeleted(uint256 indexed teraReturnId, uint256 deletedAt);

    // TeraPettyCash Events (for linking)
    event TeraPettyCashLinked(
        uint256 indexed teraId,
        uint256 indexed pettyCashId,
        uint256 createdAt
    );

    // ==================== Internal Access Control ====================

    function _onlyAdmin() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        bytes32 ADMIN_ROLE = keccak256("ADMIN_ROLE");
        require(ac.roles[ADMIN_ROLE][msg.sender], "QCFacet: Admin only");
    }

    function _onlyAdminOrOperator() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        bytes32 ADMIN_ROLE = keccak256("ADMIN_ROLE");
        bytes32 OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
        require(
            ac.roles[ADMIN_ROLE][msg.sender] ||
                ac.roles[OPERATOR_ROLE][msg.sender],
            "QCFacet: Admin or Operator only"
        );
    }

    // ==================== Internal Helper: Swap and Pop ====================

    function _removeFromArray(uint256[] storage arr, uint256 _id) internal {
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == _id) {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                break;
            }
        }
    }

    // ==================== Internal Helper: Check if Tera has Return ====================

    function _hasReturn(uint256 _teraId) internal view returns (bool) {
        AppStorage.QualityControlStorage storage s = AppStorage.qcStorage();
        uint256[] memory returnsDari = s.teraToTeraReturnDariList[_teraId];
        return returnsDari.length > 0;
    }

    // ==================== Tera CRUD ====================

    function createTera(
        uint256 _spbuId,
        string calldata _noKode,
        string calldata _noBukti,
        uint256 _tanggal,
        uint256 _grandTotal,
        string calldata _keterangan
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.QualityControlStorage storage s = AppStorage.qcStorage();

        s.teraCounter++;
        uint256 newId = s.teraCounter;

        s.teraList[newId] = AppStorage.Tera({
            teraId: newId,
            spbuId: _spbuId,
            noKode: _noKode,
            noBukti: _noBukti,
            tanggal: _tanggal,
            grandTotal: _grandTotal,
            keterangan: _keterangan,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        // Add to global ID array
        s.teraIds.push(newId);

        emit TeraCreated(newId, _spbuId, _noKode, block.timestamp);
        return newId;
    }

    function updateTera(
        uint256 _teraId,
        string calldata _noKode,
        string calldata _noBukti,
        uint256 _tanggal,
        uint256 _grandTotal,
        string calldata _keterangan
    ) external {
        _onlyAdmin();
        AppStorage.QualityControlStorage storage s = AppStorage.qcStorage();

        AppStorage.Tera storage data = s.teraList[_teraId];
        require(data.teraId != 0, "QCFacet: Tera not found");
        require(!data.deleted, "QCFacet: Tera deleted");

        data.noKode = _noKode;
        data.noBukti = _noBukti;
        data.tanggal = _tanggal;
        data.grandTotal = _grandTotal;
        data.keterangan = _keterangan;
        data.updatedAt = block.timestamp;

        emit TeraUpdated(_teraId, block.timestamp);
    }

    function deleteTera(uint256 _teraId) external {
        _onlyAdmin();
        AppStorage.QualityControlStorage storage s = AppStorage.qcStorage();

        AppStorage.Tera storage data = s.teraList[_teraId];
        require(data.teraId != 0, "QCFacet: Tera not found");
        require(!data.deleted, "QCFacet: Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;

        _removeFromArray(s.teraIds, _teraId);

        emit TeraDeleted(_teraId, block.timestamp);
    }

    function getTeraById(
        uint256 _teraId
    ) external view returns (AppStorage.Tera memory) {
        AppStorage.QualityControlStorage storage s = AppStorage.qcStorage();
        require(s.teraList[_teraId].teraId != 0, "QCFacet: Tera not found");
        return s.teraList[_teraId];
    }

    function getAllTera(
        uint256 _offset,
        uint256 _limit
    ) external view returns (AppStorage.Tera[] memory result, uint256 total) {
        AppStorage.QualityControlStorage storage s = AppStorage.qcStorage();
        uint256[] memory allIds = s.teraIds;
        uint256 totalLength = allIds.length;

        if (_offset >= totalLength || totalLength == 0) {
            return (new AppStorage.Tera[](0), totalLength);
        }

        uint256 remaining = totalLength - _offset;
        uint256 resultLength = remaining < _limit ? remaining : _limit;
        result = new AppStorage.Tera[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = s.teraList[allIds[_offset + i]];
        }

        return (result, totalLength);
    }

    function getTeraPeminjaman(
        uint256 _offset,
        uint256 _limit
    ) external view returns (AppStorage.Tera[] memory result, uint256 total) {
        AppStorage.QualityControlStorage storage s = AppStorage.qcStorage();
        uint256[] memory allIds = s.teraIds;

        // Count tera without return
        uint256 count = 0;
        for (uint256 i = 0; i < allIds.length; i++) {
            if (!_hasReturn(allIds[i])) {
                count++;
            }
        }

        if (_offset >= count || count == 0) {
            return (new AppStorage.Tera[](0), count);
        }

        uint256 remaining = count - _offset;
        uint256 resultLength = remaining < _limit ? remaining : _limit;
        result = new AppStorage.Tera[](resultLength);

        uint256 resultIndex = 0;
        uint256 skipped = 0;

        for (
            uint256 i = 0;
            i < allIds.length && resultIndex < resultLength;
            i++
        ) {
            if (!_hasReturn(allIds[i])) {
                if (skipped >= _offset) {
                    result[resultIndex] = s.teraList[allIds[i]];
                    resultIndex++;
                } else {
                    skipped++;
                }
            }
        }

        return (result, count);
    }

    function getTeraPengembalian(
        uint256 _offset,
        uint256 _limit
    ) external view returns (AppStorage.Tera[] memory result, uint256 total) {
        AppStorage.QualityControlStorage storage s = AppStorage.qcStorage();
        uint256[] memory allIds = s.teraIds;

        // Count tera with return
        uint256 count = 0;
        for (uint256 i = 0; i < allIds.length; i++) {
            if (_hasReturn(allIds[i])) {
                count++;
            }
        }

        if (_offset >= count || count == 0) {
            return (new AppStorage.Tera[](0), count);
        }

        uint256 remaining = count - _offset;
        uint256 resultLength = remaining < _limit ? remaining : _limit;
        result = new AppStorage.Tera[](resultLength);

        uint256 resultIndex = 0;
        uint256 skipped = 0;

        for (
            uint256 i = 0;
            i < allIds.length && resultIndex < resultLength;
            i++
        ) {
            if (_hasReturn(allIds[i])) {
                if (skipped >= _offset) {
                    result[resultIndex] = s.teraList[allIds[i]];
                    resultIndex++;
                } else {
                    skipped++;
                }
            }
        }

        return (result, count);
    }

    // ==================== DetailTera CRUD ====================

    function createDetailTera(
        uint256 _teraId,
        uint256 _dokumenStokId,
        uint256 _dombakId,
        uint256 _quantity,
        uint256 _harga,
        string calldata _keterangan
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.QualityControlStorage storage s = AppStorage.qcStorage();

        require(s.teraList[_teraId].teraId != 0, "QCFacet: Tera not found");

        s.detailTeraCounter++;
        uint256 newId = s.detailTeraCounter;

        s.detailTeraList[newId] = AppStorage.DetailTera({
            detailTeraId: newId,
            teraId: _teraId,
            dokumenStokId: _dokumenStokId,
            dombakId: _dombakId,
            quantity: _quantity,
            harga: _harga,
            keterangan: _keterangan,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        // Add to global ID array and relations
        s.detailTeraIds.push(newId);
        s.teraToDetailTeraList[_teraId].push(newId);
        s.dokumenStokToDetailTeraList[_dokumenStokId].push(newId);

        emit DetailTeraCreated(newId, _teraId, _dombakId, block.timestamp);
        return newId;
    }

    function updateDetailTera(
        uint256 _detailTeraId,
        uint256 _quantity,
        uint256 _harga,
        string calldata _keterangan
    ) external {
        _onlyAdmin();
        AppStorage.QualityControlStorage storage s = AppStorage.qcStorage();

        AppStorage.DetailTera storage data = s.detailTeraList[_detailTeraId];
        require(data.detailTeraId != 0, "QCFacet: DetailTera not found");
        require(!data.deleted, "QCFacet: DetailTera deleted");

        data.quantity = _quantity;
        data.harga = _harga;
        data.keterangan = _keterangan;
        data.updatedAt = block.timestamp;

        emit DetailTeraUpdated(_detailTeraId, block.timestamp);
    }

    function deleteDetailTera(uint256 _detailTeraId) external {
        _onlyAdmin();
        AppStorage.QualityControlStorage storage s = AppStorage.qcStorage();

        AppStorage.DetailTera storage data = s.detailTeraList[_detailTeraId];
        require(data.detailTeraId != 0, "QCFacet: DetailTera not found");
        require(!data.deleted, "QCFacet: Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;

        _removeFromArray(s.detailTeraIds, _detailTeraId);
        _removeFromArray(s.teraToDetailTeraList[data.teraId], _detailTeraId);
        _removeFromArray(
            s.dokumenStokToDetailTeraList[data.dokumenStokId],
            _detailTeraId
        );

        emit DetailTeraDeleted(_detailTeraId, block.timestamp);
    }

    function getDetailTeraById(
        uint256 _detailTeraId
    ) external view returns (AppStorage.DetailTera memory) {
        AppStorage.QualityControlStorage storage s = AppStorage.qcStorage();
        require(
            s.detailTeraList[_detailTeraId].detailTeraId != 0,
            "QCFacet: Not found"
        );
        return s.detailTeraList[_detailTeraId];
    }

    function getDetailTeraByTera(
        uint256 _teraId
    ) external view returns (AppStorage.DetailTera[] memory) {
        AppStorage.QualityControlStorage storage s = AppStorage.qcStorage();
        uint256[] memory ids = s.teraToDetailTeraList[_teraId];

        AppStorage.DetailTera[] memory result = new AppStorage.DetailTera[](
            ids.length
        );
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.detailTeraList[ids[i]];
        }
        return result;
    }

    // ==================== TeraReturn CRUD ====================

    function createTeraReturn(
        uint256 _dariTeraId,
        uint256 _keTeraId
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.QualityControlStorage storage s = AppStorage.qcStorage();

        require(
            s.teraList[_dariTeraId].teraId != 0,
            "QCFacet: Source Tera not found"
        );
        require(
            s.teraList[_keTeraId].teraId != 0,
            "QCFacet: Destination Tera not found"
        );

        s.teraReturnCounter++;
        uint256 newId = s.teraReturnCounter;

        s.teraReturnList[newId] = AppStorage.TeraReturn({
            teraReturnId: newId,
            dariTeraId: _dariTeraId,
            keTeraId: _keTeraId,
            createdAt: block.timestamp,
            deleted: false
        });

        // Add to global ID array and relations
        s.teraReturnIds.push(newId);
        s.teraToTeraReturnDariList[_dariTeraId].push(newId);
        s.teraToTeraReturnKeList[_keTeraId].push(newId);

        emit TeraReturnCreated(newId, _dariTeraId, _keTeraId, block.timestamp);
        return newId;
    }

    function deleteTeraReturn(uint256 _teraReturnId) external {
        _onlyAdmin();
        AppStorage.QualityControlStorage storage s = AppStorage.qcStorage();

        AppStorage.TeraReturn storage data = s.teraReturnList[_teraReturnId];
        require(data.teraReturnId != 0, "QCFacet: TeraReturn not found");
        require(!data.deleted, "QCFacet: Already deleted");

        data.deleted = true;

        _removeFromArray(s.teraReturnIds, _teraReturnId);
        _removeFromArray(
            s.teraToTeraReturnDariList[data.dariTeraId],
            _teraReturnId
        );
        _removeFromArray(
            s.teraToTeraReturnKeList[data.keTeraId],
            _teraReturnId
        );

        emit TeraReturnDeleted(_teraReturnId, block.timestamp);
    }

    function getTeraReturnById(
        uint256 _teraReturnId
    ) external view returns (AppStorage.TeraReturn memory) {
        AppStorage.QualityControlStorage storage s = AppStorage.qcStorage();
        require(
            s.teraReturnList[_teraReturnId].teraReturnId != 0,
            "QCFacet: Not found"
        );
        return s.teraReturnList[_teraReturnId];
    }

    function getTeraReturnByTera(
        uint256 _teraId
    ) external view returns (AppStorage.TeraReturn[] memory) {
        AppStorage.QualityControlStorage storage s = AppStorage.qcStorage();

        // Get returns where this tera is either source or destination
        uint256[] memory dariIds = s.teraToTeraReturnDariList[_teraId];
        uint256[] memory keIds = s.teraToTeraReturnKeList[_teraId];

        uint256 totalLength = dariIds.length + keIds.length;
        AppStorage.TeraReturn[] memory result = new AppStorage.TeraReturn[](
            totalLength
        );

        uint256 idx = 0;
        for (uint256 i = 0; i < dariIds.length; i++) {
            result[idx] = s.teraReturnList[dariIds[i]];
            idx++;
        }
        for (uint256 i = 0; i < keIds.length; i++) {
            result[idx] = s.teraReturnList[keIds[i]];
            idx++;
        }

        return result;
    }

    // ==================== TeraPettyCash Linking ====================

    function linkTeraToPettyCash(
        uint256 _teraId,
        uint256 _pettyCashId
    ) external {
        _onlyAdmin();
        AppStorage.QualityControlStorage storage s = AppStorage.qcStorage();

        require(s.teraList[_teraId].teraId != 0, "QCFacet: Tera not found");

        s.teraToPettyCashList[_teraId].push(_pettyCashId);
        s.pettyCashToTeraList[_pettyCashId].push(_teraId);

        emit TeraPettyCashLinked(_teraId, _pettyCashId, block.timestamp);
    }

    function getPettyCashByTera(
        uint256 _teraId
    ) external view returns (uint256[] memory) {
        return AppStorage.qcStorage().teraToPettyCashList[_teraId];
    }

    function getTeraByPettyCash(
        uint256 _pettyCashId
    ) external view returns (uint256[] memory) {
        return AppStorage.qcStorage().pettyCashToTeraList[_pettyCashId];
    }

    // ==================== Utility Functions ====================

    function getTotalTera() external view returns (uint256) {
        return AppStorage.qcStorage().teraIds.length;
    }

    function getTotalDetailTera() external view returns (uint256) {
        return AppStorage.qcStorage().detailTeraIds.length;
    }

    function getTotalTeraReturn() external view returns (uint256) {
        return AppStorage.qcStorage().teraReturnIds.length;
    }

    function hasTeraReturn(uint256 _teraId) external view returns (bool) {
        return _hasReturn(_teraId);
    }
}
