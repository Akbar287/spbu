pragma solidity ^0.8.33;

import {AppStorage} from "../storage/AppStorage.sol";

contract PengadaanConfirmationFacet {
    event PembayaranUpdated(uint256 indexed id, uint256 updatedAt);
    event RencanaPembelianUpdated(uint256 indexed id, uint256 updatedAt);

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

    function konfirmasiPembayaranByAdmin(uint256 _pembayaranId) external {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();

        AppStorage.Pembayaran storage p = s.pembayaranList[_pembayaranId];
        require(p.pembayaranId != 0 && !p.deleted, "Not found");
        require(!p.konfirmasiAdmin, "Confirmed");

        p.konfirmasiAdmin = true;
        p.konfirmasiByAdmin = msg.sender;
        p.konfirmasiAtAdmin = block.timestamp;
        p.updatedAt = block.timestamp;

        s.walletToKonfirmasiAdminPembayaran[msg.sender].push(_pembayaranId);

        emit PembayaranUpdated(_pembayaranId, block.timestamp);
    }

    function konfirmasiPembayaranByDirektur(uint256 _pembayaranId) external {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();

        AppStorage.Pembayaran storage p = s.pembayaranList[_pembayaranId];
        require(p.pembayaranId != 0 && !p.deleted, "Not found");
        require(!p.konfirmasiDirektur, "Confirmed");

        p.konfirmasiDirektur = true;
        p.konfirmasiByDirektur = msg.sender;
        p.konfirmasiAtDirektur = block.timestamp;
        p.updatedAt = block.timestamp;

        s.walletToKonfirmasiDirekturPembayaran[msg.sender].push(_pembayaranId);

        emit PembayaranUpdated(_pembayaranId, block.timestamp);
    }
    function konfirmasiStatusPurchasePembayaranToMs2(
        uint256 _rencanaPembelianId
    ) external {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        AppStorage.RencanaPembelian storage r = s.rencanaPembelianList[
            _rencanaPembelianId
        ];

        require(r.rencanaPembelianId != 0 && !r.deleted, "Not found");

        for (uint256 i = 1; i <= s.statusPurchaseCounter; i++) {
            if (
                keccak256(bytes(s.statusPurchaseList[i].namaStatus)) ==
                keccak256(bytes("MS2"))
            ) {
                r.statusPurchaseId = s.statusPurchaseList[i].statusPurchaseId;
                r.updatedAt = block.timestamp;
                break;
            }
        }

        emit RencanaPembelianUpdated(_rencanaPembelianId, block.timestamp);
    }
}
