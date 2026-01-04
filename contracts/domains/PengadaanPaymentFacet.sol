// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";

/**
 * @title PengadaanPaymentFacet
 * @notice Pembayaran and FilePembayaran CRUD
 * @dev Split from PengadaanFacet to reduce contract size below 24KB
 */
contract PengadaanPaymentFacet {
    event PembayaranCreated(
        uint256 indexed id,
        uint256 indexed rencanaPembelianId,
        uint256 createdAt
    );
    event PembayaranDeleted(uint256 indexed id, uint256 deletedAt);
    event PembayaranKonfirmasiAdmin(
        uint256 indexed id,
        address indexed konfirmasiBy,
        uint256 konfirmasiAt
    );
    event PembayaranKonfirmasiDirektur(
        uint256 indexed id,
        address indexed konfirmasiBy,
        uint256 konfirmasiAt
    );
    event FilePembayaranCreated(
        uint256 indexed id,
        uint256 indexed pembayaranId,
        uint256 createdAt
    );
    event FilePembayaranDeleted(uint256 indexed id, uint256 deletedAt);

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

    function createPembayaran(
        uint256 _rencanaPembelianId,
        string calldata _noCekBg,
        string calldata _noRekening,
        string calldata _namaRekening,
        string calldata _namaBank,
        uint256 _totalBayar
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        require(
            s.rencanaPembelianList[_rencanaPembelianId].rencanaPembelianId != 0,
            "RencanaPembelian not found"
        );

        s.pembayaranCounter++;
        uint256 newId = s.pembayaranCounter;
        s.pembayaranList[newId] = AppStorage.Pembayaran({
            pembayaranId: newId,
            rencanaPembelianId: _rencanaPembelianId,
            walletMember: msg.sender,
            noCekBg: _noCekBg,
            noRekening: _noRekening,
            namaRekening: _namaRekening,
            namaBank: _namaBank,
            totalBayar: _totalBayar,
            konfirmasiAdmin: false,
            konfirmasiDirektur: false,
            konfirmasiByAdmin: address(0),
            konfirmasiByDirektur: address(0),
            konfirmasiAtAdmin: 0,
            konfirmasiAtDirektur: 0,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.rencanaPembelianToPembayaranIds[_rencanaPembelianId].push(newId);
        s.walletToPembayaranIds[msg.sender].push(newId);
        emit PembayaranCreated(newId, _rencanaPembelianId, block.timestamp);
        return newId;
    }

    function konfirmasiAdminPembayaran(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        AppStorage.Pembayaran storage data = s.pembayaranList[_id];
        require(
            data.pembayaranId != 0 && !data.deleted && !data.konfirmasiAdmin,
            "Invalid"
        );
        data.konfirmasiAdmin = true;
        data.konfirmasiByAdmin = msg.sender;
        data.konfirmasiAtAdmin = block.timestamp;
        emit PembayaranKonfirmasiAdmin(_id, msg.sender, block.timestamp);
    }

    function konfirmasiDirekturPembayaran(uint256 _id) external {
        _onlyDirektur();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        AppStorage.Pembayaran storage data = s.pembayaranList[_id];
        require(
            data.pembayaranId != 0 &&
                !data.deleted &&
                data.konfirmasiAdmin &&
                !data.konfirmasiDirektur,
            "Invalid"
        );
        data.konfirmasiDirektur = true;
        data.konfirmasiByDirektur = msg.sender;
        data.konfirmasiAtDirektur = block.timestamp;
        emit PembayaranKonfirmasiDirektur(_id, msg.sender, block.timestamp);
    }

    function deletePembayaran(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        AppStorage.Pembayaran storage data = s.pembayaranList[_id];
        require(data.pembayaranId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(
            s.rencanaPembelianToPembayaranIds[data.rencanaPembelianId],
            _id
        );
        emit PembayaranDeleted(_id, block.timestamp);
    }

    function getPembayaranById(
        uint256 _id
    ) external view returns (AppStorage.Pembayaran memory) {
        return AppStorage.pengadaanStorage().pembayaranList[_id];
    }

    function getPembayaranByRencanaPembelian(
        uint256 _rencanaPembelianId
    ) external view returns (AppStorage.Pembayaran[] memory) {
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        uint256[] memory ids = s.rencanaPembelianToPembayaranIds[
            _rencanaPembelianId
        ];
        AppStorage.Pembayaran[] memory result = new AppStorage.Pembayaran[](
            ids.length
        );
        for (uint256 i = 0; i < ids.length; i++)
            result[i] = s.pembayaranList[ids[i]];
        return result;
    }

    function createFilePembayaran(
        uint256 _pembayaranId,
        string calldata _ipfsHash,
        string calldata _namaFile,
        string calldata _namaDokumen,
        string calldata _mimeType,
        uint256 _fileSize
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        require(
            s.pembayaranList[_pembayaranId].pembayaranId != 0,
            "Pembayaran not found"
        );

        s.filePembayaranCounter++;
        uint256 newId = s.filePembayaranCounter;
        s.filePembayaranList[newId] = AppStorage.FilePembayaran({
            filePembayaranId: newId,
            pembayaranId: _pembayaranId,
            ipfsHash: _ipfsHash,
            namaFile: _namaFile,
            namaDokumen: _namaDokumen,
            mimeType: _mimeType,
            fileSize: _fileSize,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.pembayaranToFilePembayaranIds[_pembayaranId].push(newId);
        emit FilePembayaranCreated(newId, _pembayaranId, block.timestamp);
        return newId;
    }

    function deleteFilePembayaran(uint256 _id) external {
        _onlyAdmin();
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        AppStorage.FilePembayaran storage data = s.filePembayaranList[_id];
        require(data.filePembayaranId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(
            s.pembayaranToFilePembayaranIds[data.pembayaranId],
            _id
        );
        emit FilePembayaranDeleted(_id, block.timestamp);
    }

    function getFilePembayaranByPembayaran(
        uint256 _pembayaranId
    ) external view returns (AppStorage.FilePembayaran[] memory) {
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        uint256[] memory ids = s.pembayaranToFilePembayaranIds[_pembayaranId];
        AppStorage.FilePembayaran[]
            memory result = new AppStorage.FilePembayaran[](ids.length);
        for (uint256 i = 0; i < ids.length; i++)
            result[i] = s.filePembayaranList[ids[i]];
        return result;
    }
}
