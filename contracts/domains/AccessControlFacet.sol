// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../storage/AppStorage.sol";

/**
 * @title AccessControlFacet
 * @notice Mengelola izin (RBAC) untuk seluruh sistem Diamond SPBU
 */
contract AccessControlFacet {
    // Definisi Konstanta Role (Sama seperti kontrak Anda sebelumnya)
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00; // Standar OpenZeppelin
    bytes32 public constant KOMISARIS_ROLE = keccak256("KOMISARIS_ROLE");
    bytes32 public constant DIREKTUR_ROLE = keccak256("DIREKTUR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

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
     * @notice Memberikan role kepada account
     * @dev Hanya bisa dipanggil oleh DEFAULT_ADMIN_ROLE (Super Admin)
     */
    function grantRole(bytes32 _role, address _account) external {
        // Cek apakah pengirim adalah Super Admin
        _checkRole(DEFAULT_ADMIN_ROLE);

        AppStorage.AccessControlStorage storage s = AppStorage
            .accessControlStorage();

        if (!s.roles[_role][_account]) {
            s.roles[_role][_account] = true;
            emit RoleGranted(_role, _account, msg.sender);
        }
    }

    /**
     * @notice Mencabut role dari account
     */
    function revokeRole(bytes32 _role, address _account) external {
        _checkRole(DEFAULT_ADMIN_ROLE);

        AppStorage.AccessControlStorage storage s = AppStorage
            .accessControlStorage();

        if (s.roles[_role][_account]) {
            s.roles[_role][_account] = false;
            emit RoleRevoked(_role, _account, msg.sender);
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
