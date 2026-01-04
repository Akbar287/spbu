// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";

/**
 * @title PointOfSalesSalesFacet
 * @notice Penjualan and DetailPenjualan CRUD
 * @dev Split from PointOfSalesFacet to reduce contract size below 24KB
 */
contract PointOfSalesSalesFacet {
    event PenjualanCreated(
        uint256 indexed id,
        address indexed walletMember,
        uint256 createdAt
    );
    event PenjualanDeleted(uint256 indexed id, uint256 deletedAt);
    event PenjualanVerifiedAdmin(
        uint256 indexed id,
        address indexed verifiedBy,
        uint256 verifiedAt
    );
    event PenjualanVerifiedDirektur(
        uint256 indexed id,
        address indexed verifiedBy,
        uint256 verifiedAt
    );
    event DetailPenjualanCreated(
        uint256 indexed id,
        uint256 indexed penjualanId,
        uint256 indexed standMeterId,
        uint256 createdAt
    );
    event DetailPenjualanDeleted(uint256 indexed id, uint256 deletedAt);

    function _onlyAdmin() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        require(ac.roles[keccak256("ADMIN_ROLE")][msg.sender], "Admin only");
    }

    function _onlyDirektur() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        require(
            ac.roles[keccak256("DIREKTUR_ROLE")][msg.sender],
            "Direktur only"
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

    // Penjualan CRUD (matches AppStorage.Penjualan exactly - 19 fields)
    function createPenjualan(
        uint256 _statusSetoranId,
        uint256 _produkId,
        uint256 _spbuId,
        uint256 _nozzleId,
        uint256 _jamKerjaId,
        uint256 _tanggal,
        uint256 _totalUangKotak,
        uint256 _totalPenjualan
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();

        s.penjualanCounter++;
        uint256 newId = s.penjualanCounter;
        s.penjualanList[newId] = AppStorage.Penjualan({
            penjualanId: newId,
            statusSetoranId: _statusSetoranId,
            produkId: _produkId,
            spbuId: _spbuId,
            nozzleId: _nozzleId,
            jamKerjaId: _jamKerjaId,
            tanggal: _tanggal,
            totalUangKotak: _totalUangKotak,
            totalPenjualan: _totalPenjualan,
            verifiedAdmin: false,
            verifiedDirektur: false,
            verifiedByAdmin: address(0),
            verifiedByDirektur: address(0),
            verifiedAtAdmin: 0,
            verifiedAtDirektur: 0,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.penjualanIds.push(newId);
        s.nozzleToPenjualanList[_nozzleId].push(newId);
        s.jamKerjaToPenjualanList[_jamKerjaId].push(newId);
        emit PenjualanCreated(newId, msg.sender, block.timestamp);
        return newId;
    }

    function verifyPenjualanAdmin(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        AppStorage.Penjualan storage data = s.penjualanList[_id];
        require(
            data.penjualanId != 0 && !data.deleted && !data.verifiedAdmin,
            "Invalid"
        );
        data.verifiedAdmin = true;
        data.verifiedByAdmin = msg.sender;
        data.verifiedAtAdmin = block.timestamp;
        emit PenjualanVerifiedAdmin(_id, msg.sender, block.timestamp);
    }

    function verifyPenjualanDirektur(uint256 _id) external {
        _onlyDirektur();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        AppStorage.Penjualan storage data = s.penjualanList[_id];
        require(
            data.penjualanId != 0 &&
                !data.deleted &&
                data.verifiedAdmin &&
                !data.verifiedDirektur,
            "Invalid"
        );
        data.verifiedDirektur = true;
        data.verifiedByDirektur = msg.sender;
        data.verifiedAtDirektur = block.timestamp;
        emit PenjualanVerifiedDirektur(_id, msg.sender, block.timestamp);
    }

    function deletePenjualan(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        AppStorage.Penjualan storage data = s.penjualanList[_id];
        require(data.penjualanId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.penjualanIds, _id);
        emit PenjualanDeleted(_id, block.timestamp);
    }

    function getPenjualanById(
        uint256 _id
    ) external view returns (AppStorage.Penjualan memory) {
        return AppStorage.posStorage().penjualanList[_id];
    }

    function getAllPenjualan(
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (AppStorage.Penjualan[] memory result, uint256 total)
    {
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        uint256[] memory allIds = s.penjualanIds;
        total = allIds.length;
        if (_offset >= total) return (new AppStorage.Penjualan[](0), total);
        uint256 len = (total - _offset) < _limit ? (total - _offset) : _limit;
        result = new AppStorage.Penjualan[](len);
        for (uint256 i = 0; i < len; i++)
            result[i] = s.penjualanList[allIds[_offset + i]];
    }

    // DetailPenjualan CRUD (matches AppStorage exactly - 9 fields with totalDetailJual)
    function createDetailPenjualan(
        uint256 _penjualanId,
        uint256 _standMeterId,
        uint256 _hargaId,
        uint256 _liter,
        uint256 _totalDetailJual
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        require(
            s.penjualanList[_penjualanId].penjualanId != 0,
            "Penjualan not found"
        );

        s.detailPenjualanCounter++;
        uint256 newId = s.detailPenjualanCounter;
        s.detailPenjualanList[newId] = AppStorage.DetailPenjualan({
            detailPenjualanId: newId,
            penjualanId: _penjualanId,
            standMeterId: _standMeterId,
            hargaId: _hargaId,
            liter: _liter,
            totalDetailJual: _totalDetailJual,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.detailPenjualanIds.push(newId);
        s.penjualanToDetailPenjualanList[_penjualanId].push(newId);
        s.standMeterToDetailPenjualanList[_standMeterId].push(newId);
        emit DetailPenjualanCreated(
            newId,
            _penjualanId,
            _standMeterId,
            block.timestamp
        );
        return newId;
    }

    function deleteDetailPenjualan(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        AppStorage.DetailPenjualan storage data = s.detailPenjualanList[_id];
        require(data.detailPenjualanId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.detailPenjualanIds, _id);
        _removeFromArray(
            s.penjualanToDetailPenjualanList[data.penjualanId],
            _id
        );
        emit DetailPenjualanDeleted(_id, block.timestamp);
    }

    function getDetailPenjualanById(
        uint256 _id
    ) external view returns (AppStorage.DetailPenjualan memory) {
        return AppStorage.posStorage().detailPenjualanList[_id];
    }

    function getDetailPenjualanByPenjualan(
        uint256 _penjualanId
    ) external view returns (AppStorage.DetailPenjualan[] memory) {
        AppStorage.PointOfSalesStorage storage s = AppStorage.posStorage();
        uint256[] memory ids = s.penjualanToDetailPenjualanList[_penjualanId];
        AppStorage.DetailPenjualan[]
            memory result = new AppStorage.DetailPenjualan[](ids.length);
        for (uint256 i = 0; i < ids.length; i++)
            result[i] = s.detailPenjualanList[ids[i]];
        return result;
    }
}
