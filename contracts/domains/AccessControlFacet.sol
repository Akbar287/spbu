// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";

/**
 * @title AccessControlFacet
 * @notice Mengelola izin (RBAC) untuk seluruh sistem Diamond SPBU
 */
contract AccessControlFacet {
    // Definisi Konstanta Role
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant DIREKTUR_ROLE = keccak256("DIREKTUR_ROLE");
    bytes32 public constant DIREKTUR_UTAMA_ROLE =
        keccak256("DIREKTUR_UTAMA_ROLE");
    bytes32 public constant PARTNER_ROLE = keccak256("PARTNER_ROLE");
    bytes32 public constant SECURITY_ROLE = keccak256("SECURITY_ROLE");
    bytes32 public constant OFFICEBOY_ROLE = keccak256("OFFICEBOY_ROLE");
    bytes32 public constant KOMISARIS_ROLE = keccak256("KOMISARIS_ROLE");

    // Events (Penting untuk tracking di Frontend)
    event RoleGranted(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );
    event RoleRevoked(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );

    /**
     * @notice Modifier internal (Karena Facet tidak bisa pakai modifier dari kontrak luar dengan mudah)
     * Kita buat pengecekan manual untuk menghemat gas dan kerumitan.
     */
    function _checkRole(bytes32 _role) internal view {
        AppStorage.AccessControlStorage storage s = AppStorage
            .accessControlStorage();
        require(
            s.roles[_role][msg.sender],
            "AccessControl: User does not have required role"
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

    // ==================== View Functions ====================

    function hasRole(
        bytes32 _role,
        address _account
    ) public view returns (bool) {
        return AppStorage.accessControlStorage().roles[_role][_account];
    }

    /**
     * @notice Helper untuk admin mengecek role user dengan cepat
     */
    function isAdmin(address _account) external view returns (bool) {
        return hasRole(ADMIN_ROLE, _account);
    }

    // ==================== Write Functions ====================

    /**
     * @notice Memberikan role kepada account DAN track ke jabatan mapping
     * @dev Hanya bisa dipanggil oleh ADMIN_ROLE
     * @param _role Role hash (bytes32) to grant
     * @param _account Address to receive the role
     * @param _jabatanId ID jabatan untuk tracking di OrganisasiStorage
     */
    function grantRoleWithJabatan(
        bytes32 _role,
        address _account,
        uint256 _jabatanId
    ) external {
        _checkRole(ADMIN_ROLE);

        AppStorage.AccessControlStorage storage s = AppStorage
            .accessControlStorage();

        if (!s.roles[_role][_account]) {
            s.roles[_role][_account] = true;
            emit RoleGranted(_role, _account, msg.sender);
        }

        // Track jabatan-wallet relationship
        AppStorage.OrganisasiStorage storage org = AppStorage.orgStorage();
        org.jabatanToWalletIds[_jabatanId].push(_account);
        org.walletToJabatanIds[_account].push(_jabatanId);
    }

    /**
     * @notice Mencabut role dari account DAN hapus dari jabatan mapping
     * @dev Hanya bisa dipanggil oleh ADMIN_ROLE
     * @param _role Role hash (bytes32) to revoke
     * @param _account Address to remove the role from
     * @param _jabatanId ID jabatan untuk tracking di OrganisasiStorage
     */
    function revokeRoleWithJabatan(
        bytes32 _role,
        address _account,
        uint256 _jabatanId
    ) external {
        _checkRole(ADMIN_ROLE);

        AppStorage.AccessControlStorage storage s = AppStorage
            .accessControlStorage();

        if (s.roles[_role][_account]) {
            s.roles[_role][_account] = false;
            emit RoleRevoked(_role, _account, msg.sender);
        }

        // Remove from jabatan-wallet relationship
        AppStorage.OrganisasiStorage storage org = AppStorage.orgStorage();
        _removeFromArray(org.walletToJabatanIds[_account], _jabatanId);
        _removeFromAddressArray(org.jabatanToWalletIds[_jabatanId], _account);
    }

    function _removeFromAddressArray(
        address[] storage arr,
        address _addr
    ) internal {
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == _addr) {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                break;
            }
        }
    }

    /**
     * @notice Inisialisasi Admin Pertama (Hanya bisa dipanggil sekali saat deploy)
     * Gunakan ini di InitFacet Anda
     */
    function setupDefaultAdmin(address _admin) external {
        AppStorage.AccessControlStorage storage s = AppStorage
            .accessControlStorage();
        // Pastikan belum ada admin (keamanan)
        require(!s.roles[DEFAULT_ADMIN_ROLE][_admin], "Admin already setup");

        s.roles[DEFAULT_ADMIN_ROLE][_admin] = true;
        s.roles[ADMIN_ROLE][_admin] = true;

        emit RoleGranted(DEFAULT_ADMIN_ROLE, _admin, msg.sender);
    }
}
