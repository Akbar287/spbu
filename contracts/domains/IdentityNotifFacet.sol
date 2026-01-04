// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";

/**
 * @title IdentityNotifFacet
 * @notice AreaMember and Notifikasi CRUD operations
 * @dev Split from IdentityFacet to reduce contract size below 24KB
 */
contract IdentityNotifFacet {
    // ==================== Events ====================
    event AreaMemberCreated(
        uint256 indexed areaMemberId,
        uint256 ktpId,
        string provinsi,
        string kabupaten,
        uint256 createdAt
    );
    event AreaMemberUpdated(
        uint256 indexed areaMemberId,
        uint256 ktpId,
        string provinsi,
        string kabupaten,
        uint256 updatedAt
    );
    event AreaMemberDeleted(uint256 indexed areaMemberId, uint256 deletedAt);

    event NotifikasiCreated(
        uint256 indexed notifikasiId,
        uint256 ktpId,
        string judul,
        uint256 createdAt
    );
    event NotifikasiUpdated(
        uint256 indexed notifikasiId,
        string judul,
        bool read,
        uint256 updatedAt
    );
    event NotifikasiDeleted(uint256 indexed notifikasiId, uint256 deletedAt);

    // ==================== Internal ====================
    function _onlyAdmin() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        require(ac.roles[keccak256("ADMIN_ROLE")][msg.sender], "Admin only");
    }

    function _onlyAdminOrOwner(address _target) internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        require(
            ac.roles[keccak256("ADMIN_ROLE")][msg.sender] ||
                msg.sender == _target,
            "Admin or owner only"
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

    // ==================== AreaMember CRUD ====================
    function createAreaMember(
        address _targetAddress,
        string calldata _provinsi,
        string calldata _kabupaten,
        string calldata _kecamatan,
        string calldata _kelurahan,
        string calldata _alamat,
        string calldata _rw,
        string calldata _rt,
        string calldata _no,
        string calldata _kodePos
    ) external returns (uint256) {
        _onlyAdminOrOwner(_targetAddress);
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        require(
            s.ktpMember[_targetAddress].ktpId != 0 &&
                !s.ktpMember[_targetAddress].deleted,
            "KTP not found"
        );

        uint256 ktpId = s.ktpMember[_targetAddress].ktpId;
        s.areaMemberCounter[_targetAddress]++;
        uint256 newId = s.areaMemberCounter[_targetAddress];

        s.areaMember[newId] = AppStorage.AreaMember({
            areaMemberId: newId,
            ktpId: ktpId,
            provinsi: _provinsi,
            kabupaten: _kabupaten,
            kecamatan: _kecamatan,
            kelurahan: _kelurahan,
            alamat: _alamat,
            rw: _rw,
            rt: _rt,
            no: _no,
            kodePos: _kodePos,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.ktpToAreaMemberIds[ktpId].push(newId);
        emit AreaMemberCreated(
            newId,
            ktpId,
            _provinsi,
            _kabupaten,
            block.timestamp
        );
        return newId;
    }

    function updateAreaMember(
        address _targetAddress,
        uint256 _areaMemberId,
        string calldata _provinsi,
        string calldata _kabupaten,
        string calldata _kecamatan,
        string calldata _kelurahan,
        string calldata _alamat,
        string calldata _rw,
        string calldata _rt,
        string calldata _no,
        string calldata _kodePos
    ) external {
        _onlyAdminOrOwner(_targetAddress);
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        AppStorage.AreaMember storage area = s.areaMember[_areaMemberId];
        require(area.areaMemberId != 0 && !area.deleted, "Not found");
        require(s.ktpMember[_targetAddress].ktpId == area.ktpId, "Not owner");

        area.provinsi = _provinsi;
        area.kabupaten = _kabupaten;
        area.kecamatan = _kecamatan;
        area.kelurahan = _kelurahan;
        area.alamat = _alamat;
        area.rw = _rw;
        area.rt = _rt;
        area.no = _no;
        area.kodePos = _kodePos;
        area.updatedAt = block.timestamp;

        emit AreaMemberUpdated(
            _areaMemberId,
            area.ktpId,
            _provinsi,
            _kabupaten,
            block.timestamp
        );
    }

    function deleteAreaMember(
        address _targetAddress,
        uint256 _areaMemberId
    ) external {
        _onlyAdminOrOwner(_targetAddress);
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        AppStorage.AreaMember storage area = s.areaMember[_areaMemberId];
        require(area.areaMemberId != 0 && !area.deleted, "Not found");
        require(s.ktpMember[_targetAddress].ktpId == area.ktpId, "Not owner");

        area.deleted = true;
        area.updatedAt = block.timestamp;
        _removeFromArray(s.ktpToAreaMemberIds[area.ktpId], _areaMemberId);
        emit AreaMemberDeleted(_areaMemberId, block.timestamp);
    }

    function getAreaMemberById(
        uint256 _id
    ) external view returns (AppStorage.AreaMember memory) {
        return AppStorage.identityStorage().areaMember[_id];
    }

    function getAreaMembersByKtp(
        address _wallet,
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (AppStorage.AreaMember[] memory result, uint256 total)
    {
        _onlyAdminOrOwner(_wallet);
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        uint256 ktpId = s.ktpMember[_wallet].ktpId;
        require(ktpId != 0, "KTP not found");

        uint256[] memory ids = s.ktpToAreaMemberIds[ktpId];
        total = ids.length;
        if (_offset >= total) return (new AppStorage.AreaMember[](0), total);
        uint256 len = (total - _offset) < _limit ? (total - _offset) : _limit;
        result = new AppStorage.AreaMember[](len);
        for (uint256 i = 0; i < len; i++)
            result[i] = s.areaMember[ids[_offset + i]];
    }

    // ==================== Notifikasi CRUD ====================
    function createNotifikasi(
        address _targetAddress,
        string calldata _judul,
        string calldata _konten
    ) external returns (uint256) {
        _onlyAdminOrOwner(_targetAddress);
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        require(s.ktpMember[_targetAddress].ktpId != 0, "KTP not found");

        uint256 ktpId = s.ktpMember[_targetAddress].ktpId;
        s.notifikasiCounter[_targetAddress]++;
        uint256 newId = s.notifikasiCounter[_targetAddress];

        s.notifikasi[newId] = AppStorage.Notifikasi({
            notifikasiId: newId,
            judul: _judul,
            konten: _konten,
            read: false,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.ktpToNotifikasiIds[ktpId].push(newId);
        emit NotifikasiCreated(newId, ktpId, _judul, block.timestamp);
        return newId;
    }

    function updateNotifikasi(
        address _targetAddress,
        uint256 _notifikasiId,
        string calldata _judul,
        string calldata _konten,
        bool _read
    ) external {
        _onlyAdminOrOwner(_targetAddress);
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        AppStorage.Notifikasi storage notif = s.notifikasi[_notifikasiId];
        require(notif.notifikasiId != 0 && !notif.deleted, "Not found");

        notif.judul = _judul;
        notif.konten = _konten;
        notif.read = _read;
        notif.updatedAt = block.timestamp;
        emit NotifikasiUpdated(_notifikasiId, _judul, _read, block.timestamp);
    }

    function deleteNotifikasi(
        address _targetAddress,
        uint256 _notifikasiId
    ) external {
        _onlyAdminOrOwner(_targetAddress);
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        AppStorage.Notifikasi storage notif = s.notifikasi[_notifikasiId];
        require(notif.notifikasiId != 0 && !notif.deleted, "Not found");

        notif.deleted = true;
        notif.updatedAt = block.timestamp;
        uint256 ktpId = s.ktpMember[_targetAddress].ktpId;
        _removeFromArray(s.ktpToNotifikasiIds[ktpId], _notifikasiId);
        emit NotifikasiDeleted(_notifikasiId, block.timestamp);
    }

    function markNotifikasiAsRead(
        address _targetAddress,
        uint256 _notifikasiId
    ) external {
        _onlyAdminOrOwner(_targetAddress);
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        AppStorage.Notifikasi storage notif = s.notifikasi[_notifikasiId];
        require(notif.notifikasiId != 0 && !notif.deleted, "Not found");

        notif.read = true;
        notif.updatedAt = block.timestamp;
        emit NotifikasiUpdated(
            _notifikasiId,
            notif.judul,
            true,
            block.timestamp
        );
    }

    function getNotifikasiById(
        uint256 _id
    ) external view returns (AppStorage.Notifikasi memory) {
        return AppStorage.identityStorage().notifikasi[_id];
    }

    function getNotifikasiByKtp(
        address _wallet,
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (AppStorage.Notifikasi[] memory result, uint256 total)
    {
        _onlyAdminOrOwner(_wallet);
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        uint256 ktpId = s.ktpMember[_wallet].ktpId;
        require(ktpId != 0, "KTP not found");

        uint256[] memory ids = s.ktpToNotifikasiIds[ktpId];
        total = ids.length;
        if (_offset >= total) return (new AppStorage.Notifikasi[](0), total);
        uint256 len = (total - _offset) < _limit ? (total - _offset) : _limit;
        result = new AppStorage.Notifikasi[](len);
        for (uint256 i = 0; i < len; i++)
            result[i] = s.notifikasi[ids[_offset + i]];
    }

    function getUnreadNotifikasi(
        address _wallet
    ) external view returns (AppStorage.Notifikasi[] memory) {
        _onlyAdminOrOwner(_wallet);
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        uint256 ktpId = s.ktpMember[_wallet].ktpId;
        require(ktpId != 0, "KTP not found");

        uint256[] memory ids = s.ktpToNotifikasiIds[ktpId];
        uint256 count = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (!s.notifikasi[ids[i]].read && !s.notifikasi[ids[i]].deleted)
                count++;
        }

        AppStorage.Notifikasi[] memory result = new AppStorage.Notifikasi[](
            count
        );
        uint256 idx = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (!s.notifikasi[ids[i]].read && !s.notifikasi[ids[i]].deleted) {
                result[idx++] = s.notifikasi[ids[i]];
            }
        }
        return result;
    }
}
