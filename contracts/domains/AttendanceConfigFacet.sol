// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";

/**
 * @title AttendanceConfigFacet
 * @notice StatusPresensi, StatusKehadiran, Hari, JamKerja CRUD
 * @dev Split from AttendanceFacet to reduce contract size below 24KB
 */
contract AttendanceConfigFacet {
    // ==================== Events ====================
    event StatusPresensiCreated(
        uint256 indexed id,
        string namaStatus,
        uint256 createdAt
    );
    event StatusPresensiUpdated(
        uint256 indexed id,
        string namaStatus,
        uint256 updatedAt
    );
    event StatusPresensiDeleted(uint256 indexed id, uint256 deletedAt);

    event StatusKehadiranCreated(
        uint256 indexed id,
        string namaStatus,
        uint256 createdAt
    );
    event StatusKehadiranUpdated(
        uint256 indexed id,
        string namaStatus,
        uint256 updatedAt
    );
    event StatusKehadiranDeleted(uint256 indexed id, uint256 deletedAt);

    event HariCreated(uint256 indexed id, string namaHari, uint256 createdAt);
    event HariUpdated(uint256 indexed id, string namaHari, uint256 updatedAt);
    event HariDeleted(uint256 indexed id, uint256 deletedAt);

    event JamKerjaCreated(
        uint256 indexed id,
        uint256 indexed spbuId,
        string namaJamKerja,
        uint256 createdAt
    );
    event JamKerjaUpdated(
        uint256 indexed id,
        uint256 indexed spbuId,
        string namaJamKerja,
        uint256 updatedAt
    );
    event JamKerjaDeleted(uint256 indexed id, uint256 deletedAt);

    // ==================== Internal ====================
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

    // ==================== StatusPresensi CRUD ====================
    function createStatusPresensi(
        string calldata _namaStatus,
        string calldata _deskripsi
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        s.statusPresensiCounter++;
        uint256 newId = s.statusPresensiCounter;
        s.statusPresensiList[newId] = AppStorage.StatusPresensi({
            statusPresensiId: newId,
            namaStatus: _namaStatus,
            deskripsi: _deskripsi,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.statusPresensiIds.push(newId);
        emit StatusPresensiCreated(newId, _namaStatus, block.timestamp);
        return newId;
    }

    function updateStatusPresensi(
        uint256 _id,
        string calldata _namaStatus,
        string calldata _deskripsi
    ) external {
        _onlyAdmin();
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        AppStorage.StatusPresensi storage data = s.statusPresensiList[_id];
        require(data.statusPresensiId != 0 && !data.deleted, "Not found");
        data.namaStatus = _namaStatus;
        data.deskripsi = _deskripsi;
        data.updatedAt = block.timestamp;
        emit StatusPresensiUpdated(_id, _namaStatus, block.timestamp);
    }

    function deleteStatusPresensi(uint256 _id) external {
        _onlyAdmin();
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        AppStorage.StatusPresensi storage data = s.statusPresensiList[_id];
        require(data.statusPresensiId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.statusPresensiIds, _id);
        emit StatusPresensiDeleted(_id, block.timestamp);
    }

    function getStatusPresensiById(
        uint256 _id
    ) external view returns (AppStorage.StatusPresensi memory) {
        return AppStorage.attendanceStorage().statusPresensiList[_id];
    }

    function getAllStatusPresensi(
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (AppStorage.StatusPresensi[] memory result, uint256 total)
    {
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        uint256[] memory allIds = s.statusPresensiIds;
        total = allIds.length;
        if (_offset >= total)
            return (new AppStorage.StatusPresensi[](0), total);
        uint256 len = (total - _offset) < _limit ? (total - _offset) : _limit;
        result = new AppStorage.StatusPresensi[](len);
        for (uint256 i = 0; i < len; i++)
            result[i] = s.statusPresensiList[allIds[_offset + i]];
    }

    // ==================== StatusKehadiran CRUD ====================
    function createStatusKehadiran(
        string calldata _namaStatus,
        string calldata _deskripsi
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        s.statusKehadiranCounter++;
        uint256 newId = s.statusKehadiranCounter;
        s.statusKehadiranList[newId] = AppStorage.StatusKehadiran({
            statusKehadiranId: newId,
            namaStatus: _namaStatus,
            deskripsi: _deskripsi,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.statusKehadiranIds.push(newId);
        emit StatusKehadiranCreated(newId, _namaStatus, block.timestamp);
        return newId;
    }

    function updateStatusKehadiran(
        uint256 _id,
        string calldata _namaStatus,
        string calldata _deskripsi
    ) external {
        _onlyAdmin();
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        AppStorage.StatusKehadiran storage data = s.statusKehadiranList[_id];
        require(data.statusKehadiranId != 0 && !data.deleted, "Not found");
        data.namaStatus = _namaStatus;
        data.deskripsi = _deskripsi;
        data.updatedAt = block.timestamp;
        emit StatusKehadiranUpdated(_id, _namaStatus, block.timestamp);
    }

    function deleteStatusKehadiran(uint256 _id) external {
        _onlyAdmin();
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        AppStorage.StatusKehadiran storage data = s.statusKehadiranList[_id];
        require(data.statusKehadiranId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.statusKehadiranIds, _id);
        emit StatusKehadiranDeleted(_id, block.timestamp);
    }

    function getStatusKehadiranById(
        uint256 _id
    ) external view returns (AppStorage.StatusKehadiran memory) {
        return AppStorage.attendanceStorage().statusKehadiranList[_id];
    }

    function getAllStatusKehadiran(
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (AppStorage.StatusKehadiran[] memory result, uint256 total)
    {
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        uint256[] memory allIds = s.statusKehadiranIds;
        total = allIds.length;
        if (_offset >= total)
            return (new AppStorage.StatusKehadiran[](0), total);
        uint256 len = (total - _offset) < _limit ? (total - _offset) : _limit;
        result = new AppStorage.StatusKehadiran[](len);
        for (uint256 i = 0; i < len; i++)
            result[i] = s.statusKehadiranList[allIds[_offset + i]];
    }

    // ==================== Hari CRUD ====================
    function createHari(
        string calldata _namaHari,
        bool _hariKerja,
        string calldata _deskripsi
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        s.hariCounter++;
        uint256 newId = s.hariCounter;
        s.hariList[newId] = AppStorage.Hari({
            hariId: newId,
            namaHari: _namaHari,
            hariKerja: _hariKerja,
            deskripsi: _deskripsi,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.hariIds.push(newId);
        emit HariCreated(newId, _namaHari, block.timestamp);
        return newId;
    }

    function updateHari(
        uint256 _id,
        string calldata _namaHari,
        bool _hariKerja,
        string calldata _deskripsi
    ) external {
        _onlyAdmin();
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        AppStorage.Hari storage data = s.hariList[_id];
        require(data.hariId != 0 && !data.deleted, "Not found");
        data.namaHari = _namaHari;
        data.hariKerja = _hariKerja;
        data.deskripsi = _deskripsi;
        data.updatedAt = block.timestamp;
        emit HariUpdated(_id, _namaHari, block.timestamp);
    }

    function deleteHari(uint256 _id) external {
        _onlyAdmin();
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        AppStorage.Hari storage data = s.hariList[_id];
        require(data.hariId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.hariIds, _id);
        emit HariDeleted(_id, block.timestamp);
    }

    function getHariById(
        uint256 _id
    ) external view returns (AppStorage.Hari memory) {
        return AppStorage.attendanceStorage().hariList[_id];
    }

    function getAllHari(
        uint256 _offset,
        uint256 _limit
    ) external view returns (AppStorage.Hari[] memory result, uint256 total) {
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        uint256[] memory allIds = s.hariIds;
        total = allIds.length;
        if (_offset >= total) return (new AppStorage.Hari[](0), total);
        uint256 len = (total - _offset) < _limit ? (total - _offset) : _limit;
        result = new AppStorage.Hari[](len);
        for (uint256 i = 0; i < len; i++)
            result[i] = s.hariList[allIds[_offset + i]];
    }

    // ==================== JamKerja CRUD ====================
    function createJamKerja(
        uint256 _spbuId,
        string calldata _namaJamKerja,
        uint256 _jamDatang,
        uint256 _jamPulang,
        uint256 _jamMulaiIstirahat,
        uint256 _jamSelesaiIstirahat,
        int256 _urutan,
        uint256[] calldata _hariIds
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        require(
            AppStorage.orgStorage().spbuList[_spbuId].spbuId != 0,
            "SPBU not found"
        );

        s.jamKerjaCounter++;
        uint256 newId = s.jamKerjaCounter;
        s.jamKerjaList[newId] = AppStorage.JamKerja({
            jamKerjaId: newId,
            spbuId: _spbuId,
            namaJamKerja: _namaJamKerja,
            jamDatang: _jamDatang,
            jamPulang: _jamPulang,
            jamMulaiIstirahat: _jamMulaiIstirahat,
            jamSelesaiIstirahat: _jamSelesaiIstirahat,
            urutan: _urutan,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.jamKerjaIds.push(newId);
        s.spbuToJamKerjaList[_spbuId].push(newId);

        for (uint256 i = 0; i < _hariIds.length; i++) {
            uint256 hariId = _hariIds[i];
            if (s.hariList[hariId].hariId != 0 && !s.hariList[hariId].deleted) {
                s.hariToJamKerjaList[hariId].push(newId);
                s.jamKerjaToHariList[newId].push(hariId);
            }
        }

        emit JamKerjaCreated(newId, _spbuId, _namaJamKerja, block.timestamp);
        return newId;
    }

    function updateJamKerja(
        uint256 _id,
        uint256 _spbuId,
        string calldata _namaJamKerja,
        uint256 _jamDatang,
        uint256 _jamPulang,
        uint256 _jamMulaiIstirahat,
        uint256 _jamSelesaiIstirahat,
        int256 _urutan,
        uint256[] calldata _hariIds
    ) external {
        _onlyAdmin();
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        AppStorage.JamKerja storage data = s.jamKerjaList[_id];
        require(data.jamKerjaId != 0 && !data.deleted, "JamKerja not found");

        // Check if new SPBU exists
        require(
            AppStorage.orgStorage().spbuList[_spbuId].spbuId != 0,
            "SPBU not found"
        );

        // If SPBU changed, update spbuToJamKerjaList mapping
        if (data.spbuId != _spbuId) {
            _removeFromArray(s.spbuToJamKerjaList[data.spbuId], _id);
            s.spbuToJamKerjaList[_spbuId].push(_id);
        }

        // Clear old hari mappings
        uint256[] storage oldHariIds = s.jamKerjaToHariList[_id];
        for (uint256 i = 0; i < oldHariIds.length; i++) {
            _removeFromArray(s.hariToJamKerjaList[oldHariIds[i]], _id);
        }
        delete s.jamKerjaToHariList[_id];

        // Add new hari mappings
        for (uint256 i = 0; i < _hariIds.length; i++) {
            uint256 hariId = _hariIds[i];
            if (s.hariList[hariId].hariId != 0 && !s.hariList[hariId].deleted) {
                s.hariToJamKerjaList[hariId].push(_id);
                s.jamKerjaToHariList[_id].push(hariId);
            }
        }

        // Update data
        data.spbuId = _spbuId;
        data.namaJamKerja = _namaJamKerja;
        data.jamDatang = _jamDatang;
        data.jamPulang = _jamPulang;
        data.jamMulaiIstirahat = _jamMulaiIstirahat;
        data.jamSelesaiIstirahat = _jamSelesaiIstirahat;
        data.urutan = _urutan;
        data.updatedAt = block.timestamp;

        emit JamKerjaUpdated(_id, _spbuId, _namaJamKerja, block.timestamp);
    }

    function deleteJamKerja(uint256 _id) external {
        _onlyAdmin();
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        AppStorage.JamKerja storage data = s.jamKerjaList[_id];
        require(data.jamKerjaId != 0 && !data.deleted, "Not found");

        data.deleted = true;
        _removeFromArray(s.jamKerjaIds, _id);
        _removeFromArray(s.spbuToJamKerjaList[data.spbuId], _id);

        uint256[] storage hariIds = s.jamKerjaToHariList[_id];
        for (uint256 i = 0; i < hariIds.length; i++) {
            _removeFromArray(s.hariToJamKerjaList[hariIds[i]], _id);
        }
        delete s.jamKerjaToHariList[_id];

        emit JamKerjaDeleted(_id, block.timestamp);
    }

    function getJamKerjaById(
        uint256 _id
    ) external view returns (AppStorage.JamKerja memory) {
        return AppStorage.attendanceStorage().jamKerjaList[_id];
    }

    function getAllJamKerja(
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (AppStorage.JamKerja[] memory result, uint256 total)
    {
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        uint256[] memory allIds = s.jamKerjaIds;
        total = allIds.length;
        if (_offset >= total) return (new AppStorage.JamKerja[](0), total);
        uint256 len = (total - _offset) < _limit ? (total - _offset) : _limit;
        result = new AppStorage.JamKerja[](len);
        for (uint256 i = 0; i < len; i++)
            result[i] = s.jamKerjaList[allIds[_offset + i]];
    }

    function getJamKerjaBySpbu(
        uint256 _spbuId
    ) external view returns (AppStorage.JamKerja[] memory) {
        AppStorage.AttendaceStorage storage s = AppStorage.attendanceStorage();
        uint256[] memory ids = s.spbuToJamKerjaList[_spbuId];
        AppStorage.JamKerja[] memory result = new AppStorage.JamKerja[](
            ids.length
        );
        for (uint256 i = 0; i < ids.length; i++)
            result[i] = s.jamKerjaList[ids[i]];
        return result;
    }
}
