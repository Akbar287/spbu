// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";

/**
 * @title ViewFacet
 * @notice Provides view functions to retrieve all data from storage for debugging/admin purposes
 * @dev Used by scripts/view-data.cjs to display blockchain data in tables
 */
contract ViewFacet {
    // ==================== StatusPurchase ====================
    function getAllStatusPurchase()
        external
        view
        returns (AppStorage.StatusPurchase[] memory)
    {
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        uint256 count = s.statusPurchaseCounter;
        AppStorage.StatusPurchase[]
            memory result = new AppStorage.StatusPurchase[](count);
        for (uint256 i = 1; i <= count; i++) {
            result[i - 1] = s.statusPurchaseList[i];
        }
        return result;
    }

    // ==================== RencanaPembelian ====================
    function getAllRencanaPembelian()
        external
        view
        returns (AppStorage.RencanaPembelian[] memory)
    {
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        uint256 count = s.rencanaPembelianCounter;
        AppStorage.RencanaPembelian[]
            memory result = new AppStorage.RencanaPembelian[](count);
        for (uint256 i = 1; i <= count; i++) {
            result[i - 1] = s.rencanaPembelianList[i];
        }
        return result;
    }

    // ==================== DetailRencanaPembelian ====================
    function getAllDetailRencanaPembelian()
        external
        view
        returns (AppStorage.DetailRencanaPembelian[] memory)
    {
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        uint256 count = s.detailRencanaPembelianCounter;
        AppStorage.DetailRencanaPembelian[]
            memory result = new AppStorage.DetailRencanaPembelian[](count);
        for (uint256 i = 1; i <= count; i++) {
            result[i - 1] = s.detailRencanaPembelianList[i];
        }
        return result;
    }

    // ==================== PajakPembelianLib ====================
    function getAllPajakPembelianLib()
        external
        view
        returns (AppStorage.PajakPembelianLib[] memory)
    {
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        uint256 count = s.pajakPembelianLibCounter;
        AppStorage.PajakPembelianLib[]
            memory result = new AppStorage.PajakPembelianLib[](count);
        for (uint256 i = 1; i <= count; i++) {
            result[i - 1] = s.pajakPembelianLibList[i];
        }
        return result;
    }

    // ==================== PajakPembelian ====================
    function getAllPajakPembelian()
        external
        view
        returns (AppStorage.PajakPembelian[] memory)
    {
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        uint256 count = s.pajakPembelianCounter;
        AppStorage.PajakPembelian[]
            memory result = new AppStorage.PajakPembelian[](count);
        for (uint256 i = 1; i <= count; i++) {
            result[i - 1] = s.pajakPembelianList[i];
        }
        return result;
    }

    // ==================== Pembayaran ====================
    function viewAllPembayaran()
        external
        view
        returns (AppStorage.Pembayaran[] memory)
    {
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        uint256 count = s.pembayaranCounter;
        AppStorage.Pembayaran[] memory result = new AppStorage.Pembayaran[](
            count
        );
        for (uint256 i = 1; i <= count; i++) {
            result[i - 1] = s.pembayaranList[i];
        }
        return result;
    }

    // ==================== FilePembayaran ====================
    function getAllFilePembayaran()
        external
        view
        returns (AppStorage.FilePembayaran[] memory)
    {
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        uint256 count = s.filePembayaranCounter;
        AppStorage.FilePembayaran[]
            memory result = new AppStorage.FilePembayaran[](count);
        for (uint256 i = 1; i <= count; i++) {
            result[i - 1] = s.filePembayaranList[i];
        }
        return result;
    }

    // ==================== DetailRencanaPembelianFiloLo ====================
    function getAllDetailRencanaPembelianFiloLo()
        external
        view
        returns (AppStorage.DetailRencanaPembelianFiloLo[] memory)
    {
        AppStorage.PengadaanStorage storage s = AppStorage.pengadaanStorage();
        uint256 count = s.detailRencanaPembelianFiloLoCounter;
        AppStorage.DetailRencanaPembelianFiloLo[]
            memory result = new AppStorage.DetailRencanaPembelianFiloLo[](
                count
            );
        for (uint256 i = 1; i <= count; i++) {
            result[i - 1] = s.detailRencanaPembelianFiloLoList[i];
        }
        return result;
    }

    // ==================== LOGISTIC VIEW FUNCTIONS ====================

    // ==================== Ms2 ====================
    function viewAllMs2() external view returns (AppStorage.Ms2[] memory) {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        uint256 count = s.ms2Counter;
        AppStorage.Ms2[] memory result = new AppStorage.Ms2[](count);
        for (uint256 i = 1; i <= count; i++) {
            result[i - 1] = s.ms2List[i];
        }
        return result;
    }

    // ==================== Pengiriman ====================
    function viewAllPengiriman()
        external
        view
        returns (AppStorage.Pengiriman[] memory)
    {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        uint256 count = s.pengirimanCounter;
        AppStorage.Pengiriman[] memory result = new AppStorage.Pengiriman[](
            count
        );
        for (uint256 i = 1; i <= count; i++) {
            result[i - 1] = s.pengirimanList[i];
        }
        return result;
    }

    // ==================== Supir ====================
    function viewAllSupir() external view returns (AppStorage.Supir[] memory) {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        uint256 count = s.supirCounter;
        AppStorage.Supir[] memory result = new AppStorage.Supir[](count);
        for (uint256 i = 1; i <= count; i++) {
            result[i - 1] = s.supirList[i];
        }
        return result;
    }

    // ==================== DetailRencanaPembelianMs2 ====================
    function viewAllDetailRencanaPembelianMs2()
        external
        view
        returns (AppStorage.DetailRencanaPembelianMs2[] memory)
    {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        uint256 count = s.detailRencanaPembelianMs2Counter;
        AppStorage.DetailRencanaPembelianMs2[]
            memory result = new AppStorage.DetailRencanaPembelianMs2[](count);
        for (uint256 i = 1; i <= count; i++) {
            result[i - 1] = s.detailRencanaPembelianMs2List[i];
        }
        return result;
    }

    // ==================== FileLo ====================
    function viewAllFileLo()
        external
        view
        returns (AppStorage.FileLo[] memory)
    {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        uint256 count = s.fileLoCounter;
        AppStorage.FileLo[] memory result = new AppStorage.FileLo[](count);
        for (uint256 i = 1; i <= count; i++) {
            result[i - 1] = s.fileLoList[i];
        }
        return result;
    }

    // ==================== FileLampiranFileLo ====================
    function viewAllFileLampiranFileLo()
        external
        view
        returns (AppStorage.FileLampiranFileLo[] memory)
    {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        uint256 count = s.fileLampiranFileLoCounter;
        AppStorage.FileLampiranFileLo[]
            memory result = new AppStorage.FileLampiranFileLo[](count);
        for (uint256 i = 1; i <= count; i++) {
            result[i - 1] = s.fileLampiranFileLoList[i];
        }
        return result;
    }

    // ==================== Segel ====================
    function viewAllSegel() external view returns (AppStorage.Segel[] memory) {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        uint256 count = s.segelCounter;
        AppStorage.Segel[] memory result = new AppStorage.Segel[](count);
        for (uint256 i = 1; i <= count; i++) {
            result[i - 1] = s.segelList[i];
        }
        return result;
    }

    // ==================== Penerimaan ====================
    function viewAllPenerimaan()
        external
        view
        returns (AppStorage.Penerimaan[] memory)
    {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        uint256 count = s.penerimaanCounter;
        AppStorage.Penerimaan[] memory result = new AppStorage.Penerimaan[](
            count
        );
        for (uint256 i = 1; i <= count; i++) {
            result[i - 1] = s.penerimaanList[i];
        }
        return result;
    }

    // ==================== FilePenerimaan ====================
    function viewAllFilePenerimaan()
        external
        view
        returns (AppStorage.FilePenerimaan[] memory)
    {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        uint256 count = s.filePenerimaanCounter;
        AppStorage.FilePenerimaan[]
            memory result = new AppStorage.FilePenerimaan[](count);
        for (uint256 i = 1; i <= count; i++) {
            result[i - 1] = s.filePenerimaanList[i];
        }
        return result;
    }
}
