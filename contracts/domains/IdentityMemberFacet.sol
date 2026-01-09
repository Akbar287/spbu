// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";
import "../structs/ViewStructs.sol";

/**
 * @title IdentityMemberFacet
 * @notice StatusMember and Ktp CRUD operations
 * @dev Split from IdentityFacet to reduce contract size below 24KB
 */
contract IdentityMemberFacet {
    // ==================== Events ====================
    event StatusMemberCreated(
        uint256 indexed statusMemberId,
        string namaStatus,
        uint256 createdAt
    );
    event StatusMemberUpdated(
        uint256 indexed statusMemberId,
        string namaStatus,
        uint256 updatedAt
    );
    event StatusMemberDeleted(
        uint256 indexed statusMemberId,
        uint256 deletedAt
    );

    event KtpCreated(
        uint256 indexed ktpId,
        uint256 statusMemberId,
        string nik,
        string nama,
        address walletAddress,
        uint256 createdAt
    );
    event KtpUpdated(
        uint256 indexed ktpId,
        uint256 statusMemberId,
        string nik,
        string nama,
        uint256 updatedAt
    );
    event KtpDeleted(uint256 indexed ktpId, uint256 deletedAt);
    event KtpVerified(
        uint256 indexed ktpId,
        address walletAddress,
        bool verified,
        uint256 updatedAt
    );

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

    // ==================== Data Fix ====================
    /**
     * @notice Fix KTP mapping for orphaned data
     * @dev Admin only - adds ktpId to allKtpIds and statusMemberToKtpIds
     */
    function fixKtpMapping(uint256 _ktpId) external {
        _onlyAdmin();
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        AppStorage.Ktp memory ktp = s.ktp[_ktpId];
        require(ktp.ktpId != 0, "KTP not found");

        // Add to allKtpIds if not exists
        bool existsInAll = false;
        for (uint256 i = 0; i < s.allKtpIds.length; i++) {
            if (s.allKtpIds[i] == _ktpId) {
                existsInAll = true;
                break;
            }
        }
        if (!existsInAll) {
            s.allKtpIds.push(_ktpId);
        }

        // Add to statusMemberToKtpIds if not exists
        bool existsInStatus = false;
        uint256[] storage statusKtps = s.statusMemberToKtpIds[
            ktp.statusMemberId
        ];
        for (uint256 i = 0; i < statusKtps.length; i++) {
            if (statusKtps[i] == _ktpId) {
                existsInStatus = true;
                break;
            }
        }
        if (!existsInStatus) {
            statusKtps.push(_ktpId);
        }
    }

    // ==================== StatusMember CRUD ====================
    function createStatusMember(
        string calldata _namaStatus,
        string calldata _keterangan
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        s.statusMemberCounter++;
        uint256 newId = s.statusMemberCounter;

        s.statusMembers[newId] = AppStorage.StatusMember({
            statusMemberId: newId,
            namaStatus: _namaStatus,
            keterangan: _keterangan,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.allStatusMemberIds.push(newId);
        emit StatusMemberCreated(newId, _namaStatus, block.timestamp);
        return newId;
    }

    function updateStatusMember(
        uint256 _id,
        string calldata _namaStatus,
        string calldata _keterangan
    ) external {
        _onlyAdmin();
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        AppStorage.StatusMember storage data = s.statusMembers[_id];
        require(data.statusMemberId != 0 && !data.deleted, "Not found");

        data.namaStatus = _namaStatus;
        data.keterangan = _keterangan;
        data.updatedAt = block.timestamp;
        emit StatusMemberUpdated(_id, _namaStatus, block.timestamp);
    }

    function deleteStatusMember(uint256 _id) external {
        _onlyAdmin();
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        AppStorage.StatusMember storage data = s.statusMembers[_id];
        require(data.statusMemberId != 0 && !data.deleted, "Not found");

        data.deleted = true;
        data.updatedAt = block.timestamp;
        _removeFromArray(s.allStatusMemberIds, _id);
        emit StatusMemberDeleted(_id, block.timestamp);
    }

    function getStatusMemberById(
        uint256 _id
    ) external view returns (AppStorage.StatusMember memory) {
        return AppStorage.identityStorage().statusMembers[_id];
    }

    function getAllStatusMember(
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (AppStorage.StatusMember[] memory result, uint256 total)
    {
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        uint256[] memory allIds = s.allStatusMemberIds;
        total = allIds.length;
        if (_offset >= total) return (new AppStorage.StatusMember[](0), total);
        uint256 len = (total - _offset) < _limit ? (total - _offset) : _limit;
        result = new AppStorage.StatusMember[](len);
        for (uint256 i = 0; i < len; i++)
            result[i] = s.statusMembers[allIds[_offset + i]];
    }

    // ==================== KTP CRUD ====================
    function createKtp(
        address _targetAddress,
        uint256 _statusMemberId,
        string calldata _nik,
        string calldata _nama,
        AppStorage.Gender _gender,
        string calldata _tempatLahir,
        uint256 _tanggalLahir,
        string calldata _email,
        string calldata _noHp,
        string calldata _noWa
    ) external returns (uint256) {
        _onlyAdminOrOwner(_targetAddress);
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        require(s.ktpMember[_targetAddress].ktpId == 0, "KTP exists");
        require(
            s.statusMembers[_statusMemberId].statusMemberId != 0 &&
                !s.statusMembers[_statusMemberId].deleted,
            "StatusMember not found"
        );

        s.ktpCounter++;
        uint256 newId = s.ktpCounter;

        AppStorage.Ktp memory newKtp = AppStorage.Ktp({
            ktpId: newId,
            statusMemberId: _statusMemberId,
            nik: _nik,
            nama: _nama,
            gender: _gender,
            tempatLahir: _tempatLahir,
            tanggalLahir: _tanggalLahir,
            verified: false,
            walletAddress: _targetAddress,
            email: _email,
            noHp: _noHp,
            noWa: _noWa,
            bergabungSejak: block.timestamp,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.ktp[newId] = newKtp;
        s.ktpMember[_targetAddress] = newKtp;
        s.allKtpIds.push(newId);
        s.statusMemberToKtpIds[_statusMemberId].push(newId);

        emit KtpCreated(
            newId,
            _statusMemberId,
            _nik,
            _nama,
            _targetAddress,
            block.timestamp
        );
        return newId;
    }

    function updateKtp(
        address _targetAddress,
        uint256 _statusMemberId,
        string calldata _nik,
        string calldata _nama,
        AppStorage.Gender _gender,
        string calldata _tempatLahir,
        uint256 _tanggalLahir,
        string calldata _email,
        string calldata _noHp,
        string calldata _noWa
    ) external {
        _onlyAdminOrOwner(_targetAddress);
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        AppStorage.Ktp storage ktp = s.ktpMember[_targetAddress];
        require(ktp.ktpId != 0 && !ktp.deleted, "KTP not found");

        uint256 oldStatusId = ktp.statusMemberId;
        if (oldStatusId != _statusMemberId) {
            _removeFromArray(s.statusMemberToKtpIds[oldStatusId], ktp.ktpId);
            s.statusMemberToKtpIds[_statusMemberId].push(ktp.ktpId);
        }

        ktp.statusMemberId = _statusMemberId;
        ktp.nik = _nik;
        ktp.nama = _nama;
        ktp.gender = _gender;
        ktp.tempatLahir = _tempatLahir;
        ktp.tanggalLahir = _tanggalLahir;
        ktp.walletAddress = _targetAddress;
        ktp.email = _email;
        ktp.noHp = _noHp;
        ktp.noWa = _noWa;
        ktp.updatedAt = block.timestamp;
        s.ktp[ktp.ktpId] = ktp;
        s.ktpMember[_targetAddress] = ktp;

        emit KtpUpdated(
            ktp.ktpId,
            _statusMemberId,
            _nik,
            _nama,
            block.timestamp
        );
    }

    function deleteKtp(address _targetAddress) external {
        _onlyAdminOrOwner(_targetAddress);
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        AppStorage.Ktp storage ktp = s.ktpMember[_targetAddress];
        require(ktp.ktpId != 0 && !ktp.deleted, "KTP not found");

        ktp.deleted = true;
        ktp.updatedAt = block.timestamp;
        s.ktp[ktp.ktpId].deleted = true;
        s.ktp[ktp.ktpId].updatedAt = block.timestamp;

        _removeFromArray(s.allKtpIds, ktp.ktpId);
        _removeFromArray(s.statusMemberToKtpIds[ktp.statusMemberId], ktp.ktpId);

        emit KtpDeleted(ktp.ktpId, block.timestamp);
    }

    function verifyKtp(address _walletAddress, bool _verified) external {
        _onlyAdmin();
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        AppStorage.Ktp storage ktp = s.ktpMember[_walletAddress];
        require(ktp.ktpId != 0 && !ktp.deleted, "KTP not found");

        ktp.verified = _verified;
        ktp.updatedAt = block.timestamp;
        s.ktp[ktp.ktpId].verified = _verified;
        s.ktp[ktp.ktpId].updatedAt = block.timestamp;

        emit KtpVerified(ktp.ktpId, _walletAddress, _verified, block.timestamp);
    }

    function getKtpByWallet(
        address _wallet
    ) external view returns (AppStorage.Ktp memory) {
        // No access control - view function is public
        return AppStorage.identityStorage().ktpMember[_wallet];
    }

    function getKtpById(
        uint256 _id
    ) external view returns (AppStorage.Ktp memory) {
        return AppStorage.identityStorage().ktp[_id];
    }

    function getAllKtp(
        uint256 _offset,
        uint256 _limit
    ) external view returns (AppStorage.Ktp[] memory result, uint256 total) {
        _onlyAdmin();
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        uint256[] memory allIds = s.allKtpIds;
        total = allIds.length;
        if (_offset >= total) return (new AppStorage.Ktp[](0), total);
        uint256 len = (total - _offset) < _limit ? (total - _offset) : _limit;
        result = new AppStorage.Ktp[](len);
        for (uint256 i = 0; i < len; i++)
            result[i] = s.ktp[allIds[_offset + i]];
    }

    function getKtpByStatusMember(
        uint256 _statusMemberId
    ) external view returns (AppStorage.Ktp[] memory) {
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        uint256[] memory ids = s.statusMemberToKtpIds[_statusMemberId];
        AppStorage.Ktp[] memory result = new AppStorage.Ktp[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) result[i] = s.ktp[ids[i]];
        return result;
    }

    function getJabatanFromKtp(
        uint256 _offset,
        uint256 _limit,
        uint256 _ktpId
    )
        external
        view
        returns (AppStorage.Jabatan[] memory result, uint256 total)
    {
        AppStorage.IdentityStorage storage is_ = AppStorage.identityStorage();
        AppStorage.OrganisasiStorage storage os = AppStorage.orgStorage();
        AppStorage.Ktp memory ktp = is_.ktp[_ktpId];
        require(ktp.ktpId != 0 && !ktp.deleted, "KTP not found");

        uint256[] memory ids = os.walletToJabatanIds[ktp.walletAddress];
        total = ids.length;
        if (_offset >= total) return (new AppStorage.Jabatan[](0), total);
        uint256 len = (total - _offset) < _limit ? (total - _offset) : _limit;
        result = new AppStorage.Jabatan[](len);
        for (uint256 i = 0; i < len; i++)
            result[i] = os.jabatanList[ids[_offset + i]];
    }

    function getAllKtpIdAndNama() external view returns (KtpIdNama[] memory) {
        AppStorage.IdentityStorage storage s = AppStorage.identityStorage();
        uint256[] memory allIds = s.allKtpIds;

        // Count non-deleted and verified
        uint256 count = 0;
        for (uint256 i = 0; i < allIds.length; i++) {
            AppStorage.Ktp storage ktp = s.ktp[allIds[i]];
            if (!ktp.deleted && ktp.verified) {
                count++;
            }
        }

        KtpIdNama[] memory result = new KtpIdNama[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allIds.length; i++) {
            AppStorage.Ktp storage ktp = s.ktp[allIds[i]];
            if (!ktp.deleted && ktp.verified) {
                result[idx] = KtpIdNama({
                    ktpId: ktp.ktpId,
                    nama: ktp.nama,
                    nik: ktp.nik,
                    walletAddress: ktp.walletAddress
                });
                idx++;
            }
        }
        return result;
    }
}
