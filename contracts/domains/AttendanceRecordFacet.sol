// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";

/**
 * @title AttendanceRecordFacet
 * @notice Presensi and Penjadwalan CRUD
 * @dev Split from AttendanceFacet to reduce contract size below 24KB
 */
contract AttendanceRecordFacet {
    // ==================== Events ====================
    event PenjadwalanCreated(
        uint256 indexed id,
        address indexed walletMember,
        string kodePenjadwalan,
        uint256 createdAt
    );
    event PenjadwalanUpdated(
        uint256 indexed id,
        address indexed walletMember,
        uint256 updatedAt
    );
    event PenjadwalanDeleted(uint256 indexed id, uint256 deletedAt);

    event PresensiMasukCreated(
        uint256 indexed presensiId,
        address indexed walletMember,
        uint256 jamDatang,
        uint256 terlambat,
        uint256 createdAt
    );
    event PresensiPulangUpdated(
        uint256 indexed presensiId,
        address indexed walletMember,
        uint256 jamPulang,
        uint256 updatedAt
    );
    event PresensiVerified(
        uint256 indexed presensiId,
        address indexed verifiedBy,
        bool approved,
        uint256 verifiedAt
    );
    event PresensiDeleted(uint256 indexed presensiId, uint256 deletedAt);

    // ==================== Internal ====================
    function _onlyAdmin() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        require(ac.roles[keccak256("ADMIN_ROLE")][msg.sender], "Admin only");
    }

    function _hasAnyRole() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        require(
            ac.roles[keccak256("ADMIN_ROLE")][msg.sender] ||
                ac.roles[keccak256("OPERATOR_ROLE")][msg.sender] ||
                ac.roles[keccak256("SECURITY_ROLE")][msg.sender] ||
                ac.roles[keccak256("OFFICEBOY_ROLE")][msg.sender] ||
                ac.roles[keccak256("DIREKTUR_ROLE")][msg.sender] ||
                ac.roles[keccak256("KOMISARIS_ROLE")][msg.sender],
            "No role"
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

    // ==================== Penjadwalan CRUD ====================
    function createPenjadwalan(
        uint256 _statusKehadiranId,
        uint256 _jamKerjaId,
        address _walletMember,
        uint256 _tanggal,
        string calldata _kodePenjadwalan,
        string calldata _deskripsi,
        uint256[] calldata _nozzleIds
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        require(
            s.statusKehadiranList[_statusKehadiranId].statusKehadiranId != 0,
            "StatusKehadiran not found"
        );
        require(
            s.jamKerjaList[_jamKerjaId].jamKerjaId != 0,
            "JamKerja not found"
        );

        s.penjadwalanCounter++;
        uint256 newId = s.penjadwalanCounter;
        s.penjadwalanList[newId] = AppStorage.Penjadwalan({
            penjadwalanId: newId,
            jamKerjaId: _jamKerjaId,
            statusKehadiranId: _statusKehadiranId,
            walletMember: _walletMember,
            tanggal: _tanggal,
            kodePenjadwalan: _kodePenjadwalan,
            deskripsi: _deskripsi,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.penjadwalanIds.push(newId);
        s.statusKehadiranToPenjadwalanList[_statusKehadiranId].push(newId);
        s.walletToPenjadwalanList[_walletMember].push(newId);
        s.jamKerjaToPenjadwalanList[_jamKerjaId].push(newId);

        for (uint256 i = 0; i < _nozzleIds.length; i++) {
            s.penjadwalanToNozzleList[newId].push(_nozzleIds[i]);
            s.nozzleToPenjadwalanList[_nozzleIds[i]].push(newId);
        }

        emit PenjadwalanCreated(
            newId,
            _walletMember,
            _kodePenjadwalan,
            block.timestamp
        );
        return newId;
    }

    function deletePenjadwalan(uint256 _id) external {
        _onlyAdmin();
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        AppStorage.Penjadwalan storage data = s.penjadwalanList[_id];
        require(data.penjadwalanId != 0 && !data.deleted, "Not found");

        data.deleted = true;
        _removeFromArray(s.penjadwalanIds, _id);
        _removeFromArray(
            s.statusKehadiranToPenjadwalanList[data.statusKehadiranId],
            _id
        );
        _removeFromArray(s.jamKerjaToPenjadwalanList[data.jamKerjaId], _id);
        _removeFromArray(s.walletToPenjadwalanList[data.walletMember], _id);

        uint256[] storage nozzleIds = s.penjadwalanToNozzleList[_id];
        for (uint256 i = 0; i < nozzleIds.length; i++) {
            _removeFromArray(s.nozzleToPenjadwalanList[nozzleIds[i]], _id);
        }
        delete s.penjadwalanToNozzleList[_id];

        emit PenjadwalanDeleted(_id, block.timestamp);
    }

    function getPenjadwalanById(
        uint256 _id
    ) external view returns (AppStorage.Penjadwalan memory) {
        return AppStorage.attendanceStorage().penjadwalanList[_id];
    }

    function getAllPenjadwalan(
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (AppStorage.Penjadwalan[] memory result, uint256 total)
    {
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        uint256[] memory allIds = s.penjadwalanIds;
        total = allIds.length;
        if (_offset >= total) return (new AppStorage.Penjadwalan[](0), total);
        uint256 len = (total - _offset) < _limit ? (total - _offset) : _limit;
        result = new AppStorage.Penjadwalan[](len);
        for (uint256 i = 0; i < len; i++)
            result[i] = s.penjadwalanList[allIds[_offset + i]];
    }

    function getPenjadwalanByWallet(
        address _wallet,
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (AppStorage.Penjadwalan[] memory result, uint256 total)
    {
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        uint256[] memory ids = s.walletToPenjadwalanList[_wallet];
        total = ids.length;
        if (_offset >= total) return (new AppStorage.Penjadwalan[](0), total);
        uint256 len = (total - _offset) < _limit ? (total - _offset) : _limit;
        result = new AppStorage.Penjadwalan[](len);
        for (uint256 i = 0; i < len; i++)
            result[i] = s.penjadwalanList[ids[_offset + i]];
    }

    // ==================== Presensi CRUD ====================
    function createPresensiMasuk(
        uint256 _penjadwalanId,
        uint256 _waktu,
        uint256 _statusPresensiId,
        string calldata _keterangan
    ) external returns (uint256) {
        _hasAnyRole();
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        AppStorage.Penjadwalan storage jadwal = s.penjadwalanList[
            _penjadwalanId
        ];
        require(
            jadwal.penjadwalanId != 0 && !jadwal.deleted,
            "Penjadwalan not found"
        );
        require(jadwal.walletMember == msg.sender, "Not your schedule");

        AppStorage.JamKerja storage jamKerja = s.jamKerjaList[
            jadwal.jamKerjaId
        ];
        uint256 terlambat = 0;
        uint256 waktuHariIni = _waktu % 86400;
        if (waktuHariIni > jamKerja.jamDatang) {
            terlambat = waktuHariIni - jamKerja.jamDatang;
        }

        s.presensiCounter++;
        uint256 newId = s.presensiCounter;
        s.presensiList[newId] = AppStorage.Presensi({
            presensiId: newId,
            penjadwalanId: _penjadwalanId,
            statusPresensiId: _statusPresensiId,
            walletMember: msg.sender,
            tanggal: jadwal.tanggal,
            jamDatang: _waktu,
            jamPulang: 0,
            verified: false,
            terlambat: terlambat,
            verifiedBy: address(0),
            verifiedAt: 0,
            keterangan: _keterangan,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.presensiIds.push(newId);
        s.walletToPresensiList[msg.sender].push(newId);
        s.statusPresensiToPresensiList[_statusPresensiId].push(newId);
        s.jamKerjaToPresensiList[jadwal.jamKerjaId].push(newId);

        emit PresensiMasukCreated(
            newId,
            msg.sender,
            _waktu,
            terlambat,
            block.timestamp
        );
        return newId;
    }

    function updatePresensiPulang(
        uint256 _presensiId,
        uint256 _jamPulang
    ) external {
        _hasAnyRole();
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        AppStorage.Presensi storage data = s.presensiList[_presensiId];
        require(data.presensiId != 0 && !data.deleted, "Not found");
        require(data.walletMember == msg.sender, "Not your record");
        require(data.jamPulang == 0, "Already checked out");

        data.jamPulang = _jamPulang;
        data.updatedAt = block.timestamp;

        emit PresensiPulangUpdated(
            _presensiId,
            msg.sender,
            _jamPulang,
            block.timestamp
        );
    }

    function verifyPresensi(uint256 _presensiId, bool _approved) external {
        _onlyAdmin();
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        AppStorage.Presensi storage data = s.presensiList[_presensiId];
        require(data.presensiId != 0 && !data.deleted, "Not found");
        require(!data.verified, "Already verified");

        data.verified = _approved;
        data.verifiedBy = msg.sender;
        data.verifiedAt = block.timestamp;
        data.updatedAt = block.timestamp;

        emit PresensiVerified(
            _presensiId,
            msg.sender,
            _approved,
            block.timestamp
        );
    }

    function deletePresensi(uint256 _id) external {
        _onlyAdmin();
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        AppStorage.Presensi storage data = s.presensiList[_id];
        require(data.presensiId != 0 && !data.deleted, "Not found");

        data.deleted = true;
        _removeFromArray(s.presensiIds, _id);
        _removeFromArray(s.walletToPresensiList[data.walletMember], _id);
        _removeFromArray(
            s.statusPresensiToPresensiList[data.statusPresensiId],
            _id
        );

        emit PresensiDeleted(_id, block.timestamp);
    }

    function getPresensiById(
        uint256 _id
    ) external view returns (AppStorage.Presensi memory) {
        return AppStorage.attendanceStorage().presensiList[_id];
    }

    function getAllPresensi(
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (AppStorage.Presensi[] memory result, uint256 total)
    {
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        uint256[] memory allIds = s.presensiIds;
        total = allIds.length;
        if (_offset >= total) return (new AppStorage.Presensi[](0), total);
        uint256 len = (total - _offset) < _limit ? (total - _offset) : _limit;
        result = new AppStorage.Presensi[](len);
        for (uint256 i = 0; i < len; i++)
            result[i] = s.presensiList[allIds[_offset + i]];
    }

    function getPresensiByWallet(
        address _wallet,
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (AppStorage.Presensi[] memory result, uint256 total)
    {
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        uint256[] memory ids = s.walletToPresensiList[_wallet];
        total = ids.length;
        if (_offset >= total) return (new AppStorage.Presensi[](0), total);
        uint256 len = (total - _offset) < _limit ? (total - _offset) : _limit;
        result = new AppStorage.Presensi[](len);
        for (uint256 i = 0; i < len; i++)
            result[i] = s.presensiList[ids[_offset + i]];
    }
}
