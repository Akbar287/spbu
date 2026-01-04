// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";

/**
 * @title LogisticCoreFacet
 * @notice Ms2, Pengiriman, Supir, DetailRencanaPembelianMs2 CRUD
 * @dev Split from LogisticFacet to reduce contract size below 24KB
 */
contract LogisticCoreFacet {
    // ==================== Events ====================
    event Ms2Created(
        uint256 indexed ms2Id,
        address indexed walletMember,
        string kodeSms,
        uint256 createdAt
    );
    event Ms2Updated(uint256 indexed ms2Id, uint256 updatedAt);
    event Ms2Deleted(uint256 indexed ms2Id, uint256 deletedAt);
    event Ms2KonfirmasiSelesai(
        uint256 indexed ms2Id,
        address indexed konfirmasiBy,
        uint256 konfirmasiAt
    );

    event PengirimanCreated(
        uint256 indexed pengirimanId,
        address indexed walletMember,
        string noDo,
        uint256 createdAt
    );
    event PengirimanUpdated(uint256 indexed pengirimanId, uint256 updatedAt);
    event PengirimanDeleted(uint256 indexed pengirimanId, uint256 deletedAt);
    event PengirimanKonfirmasiPengiriman(
        uint256 indexed pengirimanId,
        address indexed konfirmasiBy,
        uint256 konfirmasiAt
    );
    event PengirimanKonfirmasiSelesai(
        uint256 indexed pengirimanId,
        address indexed konfirmasiBy,
        uint256 konfirmasiAt
    );
    event PengirimanMs2Linked(
        uint256 indexed pengirimanId,
        address indexed ms2By,
        uint256 ms2At
    );

    event SupirCreated(
        uint256 indexed supirId,
        uint256 indexed pengirimanId,
        string namaSupir,
        uint256 createdAt
    );
    event SupirUpdated(uint256 indexed supirId, uint256 updatedAt);
    event SupirDeleted(uint256 indexed supirId, uint256 deletedAt);

    event DetailRencanaPembelianMs2Created(
        uint256 indexed id,
        uint256 indexed ms2Id,
        uint256 indexed detailRencanaPembelianId,
        uint256 createdAt
    );
    event DetailRencanaPembelianMs2KonfirmasiPengiriman(
        uint256 indexed id,
        address indexed konfirmasiBy,
        uint256 konfirmasiAt
    );
    event DetailRencanaPembelianMs2Deleted(
        uint256 indexed id,
        uint256 deletedAt
    );

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

    // ==================== Ms2 CRUD ====================
    function createMs2(
        uint256 _tanggal,
        string calldata _kodeSms
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        s.ms2Counter++;
        uint256 newId = s.ms2Counter;

        s.ms2List[newId] = AppStorage.Ms2({
            ms2Id: newId,
            walletMember: msg.sender,
            tanggal: _tanggal,
            kodeSms: _kodeSms,
            konfirmasiSelesai: false,
            konfirmasiBy: address(0),
            konfirmasiAt: 0,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.ms2Ids.push(newId);
        emit Ms2Created(newId, msg.sender, _kodeSms, block.timestamp);
        return newId;
    }

    function updateMs2(
        uint256 _id,
        uint256 _tanggal,
        string calldata _kodeSms
    ) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.Ms2 storage data = s.ms2List[_id];
        require(data.ms2Id != 0 && !data.deleted, "Not found");
        data.tanggal = _tanggal;
        data.kodeSms = _kodeSms;
        data.updatedAt = block.timestamp;
        emit Ms2Updated(_id, block.timestamp);
    }

    function deleteMs2(uint256 _id) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.Ms2 storage data = s.ms2List[_id];
        require(data.ms2Id != 0 && !data.deleted, "Not found");
        data.deleted = true;
        data.updatedAt = block.timestamp;
        _removeFromArray(s.ms2Ids, _id);
        emit Ms2Deleted(_id, block.timestamp);
    }

    function konfirmasiSelesaiMs2(uint256 _id) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.Ms2 storage data = s.ms2List[_id];
        require(
            data.ms2Id != 0 && !data.deleted && !data.konfirmasiSelesai,
            "Invalid"
        );
        data.konfirmasiSelesai = true;
        data.konfirmasiBy = msg.sender;
        data.konfirmasiAt = block.timestamp;
        data.updatedAt = block.timestamp;
        s.walletToKonfirmasiSelesaiOnMs2[msg.sender].push(_id);
        emit Ms2KonfirmasiSelesai(_id, msg.sender, block.timestamp);
    }

    function getMs2ById(
        uint256 _id
    ) external view returns (AppStorage.Ms2 memory) {
        return AppStorage.logistikStorage().ms2List[_id];
    }

    function getAllMs2(
        uint256 _offset,
        uint256 _limit
    ) external view returns (AppStorage.Ms2[] memory result, uint256 total) {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        uint256[] memory allIds = s.ms2Ids;
        total = allIds.length;
        if (_offset >= total) return (new AppStorage.Ms2[](0), total);
        uint256 len = (total - _offset) < _limit ? (total - _offset) : _limit;
        result = new AppStorage.Ms2[](len);
        for (uint256 i = 0; i < len; i++)
            result[i] = s.ms2List[allIds[_offset + i]];
    }

    // ==================== Pengiriman CRUD ====================
    function createPengiriman(
        uint256 _tanggal,
        string calldata _noDo,
        string calldata _noPolisi,
        string calldata _catatan
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        s.pengirimanCounter++;
        uint256 newId = s.pengirimanCounter;

        s.pengirimanList[newId] = AppStorage.Pengiriman({
            pengirimanId: newId,
            walletMember: msg.sender,
            tanggal: _tanggal,
            noDo: _noDo,
            noPolisi: _noPolisi,
            catatan: _catatan,
            ms2: false,
            ms2By: address(0),
            ms2At: 0,
            konfirmasiPengiriman: false,
            konfirmasiSelesai: false,
            konfirmasiPengirimanBy: address(0),
            konfirmasiPengirimanAt: 0,
            konfirmasiSelesaiBy: address(0),
            konfirmasiSelesaiAt: 0,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.pengirimanIds.push(newId);
        emit PengirimanCreated(newId, msg.sender, _noDo, block.timestamp);
        return newId;
    }

    function updatePengiriman(
        uint256 _id,
        uint256 _tanggal,
        string calldata _noDo,
        string calldata _noPolisi,
        string calldata _catatan
    ) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.Pengiriman storage data = s.pengirimanList[_id];
        require(data.pengirimanId != 0 && !data.deleted, "Not found");
        data.tanggal = _tanggal;
        data.noDo = _noDo;
        data.noPolisi = _noPolisi;
        data.catatan = _catatan;
        data.updatedAt = block.timestamp;
        emit PengirimanUpdated(_id, block.timestamp);
    }

    function deletePengiriman(uint256 _id) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.Pengiriman storage data = s.pengirimanList[_id];
        require(data.pengirimanId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        data.updatedAt = block.timestamp;
        _removeFromArray(s.pengirimanIds, _id);
        emit PengirimanDeleted(_id, block.timestamp);
    }

    function linkPengirimanToMs2(
        uint256 _pengirimanId,
        uint256 _ms2Id
    ) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.Pengiriman storage pengiriman = s.pengirimanList[
            _pengirimanId
        ];
        require(
            pengiriman.pengirimanId != 0 && !pengiriman.deleted,
            "Pengiriman not found"
        );
        require(
            s.ms2List[_ms2Id].ms2Id != 0 && !s.ms2List[_ms2Id].deleted,
            "Ms2 not found"
        );

        pengiriman.ms2 = true;
        pengiriman.ms2By = msg.sender;
        pengiriman.ms2At = block.timestamp;
        pengiriman.updatedAt = block.timestamp;
        s.pengirimanIdToMs2Ids[_pengirimanId].push(_ms2Id);
        s.ms2IdToPengirimanIds[_ms2Id].push(_pengirimanId);
        emit PengirimanMs2Linked(_pengirimanId, msg.sender, block.timestamp);
    }

    function konfirmasiPengirimanOnPengiriman(uint256 _id) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.Pengiriman storage data = s.pengirimanList[_id];
        require(
            data.pengirimanId != 0 &&
                !data.deleted &&
                !data.konfirmasiPengiriman,
            "Invalid"
        );
        data.konfirmasiPengiriman = true;
        data.konfirmasiPengirimanBy = msg.sender;
        data.konfirmasiPengirimanAt = block.timestamp;
        data.updatedAt = block.timestamp;
        emit PengirimanKonfirmasiPengiriman(_id, msg.sender, block.timestamp);
    }

    function konfirmasiSelesaiOnPengiriman(uint256 _id) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.Pengiriman storage data = s.pengirimanList[_id];
        require(
            data.pengirimanId != 0 && !data.deleted && !data.konfirmasiSelesai,
            "Invalid"
        );
        data.konfirmasiSelesai = true;
        data.konfirmasiSelesaiBy = msg.sender;
        data.konfirmasiSelesaiAt = block.timestamp;
        data.updatedAt = block.timestamp;
        emit PengirimanKonfirmasiSelesai(_id, msg.sender, block.timestamp);
    }

    function getPengirimanById(
        uint256 _id
    ) external view returns (AppStorage.Pengiriman memory) {
        return AppStorage.logistikStorage().pengirimanList[_id];
    }

    function getAllPengiriman(
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (AppStorage.Pengiriman[] memory result, uint256 total)
    {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        uint256[] memory allIds = s.pengirimanIds;
        total = allIds.length;
        if (_offset >= total) return (new AppStorage.Pengiriman[](0), total);
        uint256 len = (total - _offset) < _limit ? (total - _offset) : _limit;
        result = new AppStorage.Pengiriman[](len);
        for (uint256 i = 0; i < len; i++)
            result[i] = s.pengirimanList[allIds[_offset + i]];
    }

    // ==================== Supir CRUD ====================
    function createSupir(
        uint256 _pengirimanId,
        string calldata _namaSupir,
        string calldata _noTelp,
        string calldata _noSim
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        require(
            s.pengirimanList[_pengirimanId].pengirimanId != 0,
            "Pengiriman not found"
        );

        s.supirCounter++;
        uint256 newId = s.supirCounter;
        s.supirList[newId] = AppStorage.Supir({
            supirId: newId,
            pengirimanId: _pengirimanId,
            namaSupir: _namaSupir,
            noTelp: _noTelp,
            noSim: _noSim,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.supirIds.push(newId);
        s.pengirimanIdToSupirIds[_pengirimanId].push(newId);
        emit SupirCreated(newId, _pengirimanId, _namaSupir, block.timestamp);
        return newId;
    }

    function deleteSupir(uint256 _id) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.Supir storage data = s.supirList[_id];
        require(data.supirId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.supirIds, _id);
        emit SupirDeleted(_id, block.timestamp);
    }

    function getSupirById(
        uint256 _id
    ) external view returns (AppStorage.Supir memory) {
        return AppStorage.logistikStorage().supirList[_id];
    }

    // ==================== DetailRencanaPembelianMs2 CRUD ====================
    function createDetailRencanaPembelianMs2(
        uint256 _ms2Id,
        uint256 _detailRencanaPembelianId,
        uint256 _jamKerjaId
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        require(s.ms2List[_ms2Id].ms2Id != 0, "Ms2 not found");

        s.detailRencanaPembelianMs2Counter++;
        uint256 newId = s.detailRencanaPembelianMs2Counter;
        s.detailRencanaPembelianMs2List[newId] = AppStorage
            .DetailRencanaPembelianMs2({
                detailRencanaPembelianMs2Id: newId,
                ms2Id: _ms2Id,
                detailRencanaPembelianId: _detailRencanaPembelianId,
                jamKerjaId: _jamKerjaId,
                konfirmasiPengiriman: false,
                konfirmasiPengirimanBy: address(0),
                konfirmasiPengirimanAt: 0,
                createdAt: block.timestamp,
                updatedAt: block.timestamp,
                deleted: false
            });
        s.detailRencanaPembelianMs2Ids.push(newId);
        s
            .detailRencanaPembelianToDetailRencanaPembelianMs2Ids[
                _detailRencanaPembelianId
            ]
            .push(newId);
        emit DetailRencanaPembelianMs2Created(
            newId,
            _ms2Id,
            _detailRencanaPembelianId,
            block.timestamp
        );
        return newId;
    }

    function konfirmasiPengirimanOnDetailRencanaPembelianMs2(
        uint256 _id
    ) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.DetailRencanaPembelianMs2 storage data = s
            .detailRencanaPembelianMs2List[_id];
        require(
            data.detailRencanaPembelianMs2Id != 0 &&
                !data.deleted &&
                !data.konfirmasiPengiriman,
            "Invalid"
        );
        data.konfirmasiPengiriman = true;
        data.konfirmasiPengirimanBy = msg.sender;
        data.konfirmasiPengirimanAt = block.timestamp;
        emit DetailRencanaPembelianMs2KonfirmasiPengiriman(
            _id,
            msg.sender,
            block.timestamp
        );
    }

    function deleteDetailRencanaPembelianMs2(uint256 _id) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.DetailRencanaPembelianMs2 storage data = s
            .detailRencanaPembelianMs2List[_id];
        require(
            data.detailRencanaPembelianMs2Id != 0 && !data.deleted,
            "Not found"
        );
        data.deleted = true;
        _removeFromArray(s.detailRencanaPembelianMs2Ids, _id);
        emit DetailRencanaPembelianMs2Deleted(_id, block.timestamp);
    }

    function getDetailRencanaPembelianMs2ById(
        uint256 _id
    ) external view returns (AppStorage.DetailRencanaPembelianMs2 memory) {
        return AppStorage.logistikStorage().detailRencanaPembelianMs2List[_id];
    }
}
