// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;
import "../storage/AppStorage.sol";

struct FasilitasWithFiles {
    AppStorage.Fasilitas fasilitas;
    AppStorage.FileFasilitas[] files;
}

struct AsetWithFiles {
    AppStorage.Aset aset;
    AppStorage.FileAset[] files;
}

// Pengadaan CoreFacet
// Struct for product detail in RencanaPembelian view
struct ProdukDetail {
    string namaProduk;
    uint256 quantity;
    string satuan;
}

// Struct for RencanaPembelian view response
struct RencanaPembelianView {
    uint256 rencanaPembelianId;
    string nama; // from walletMember -> Ktp.nama
    uint256 tanggalPembelian;
    bool status; // konfirmasi status
    ProdukDetail[] produk;
}

// Pembelian
struct ProdukDetailWithHarga {
    uint256 detailRencanaPembelianId;
    string namaProduk;
    uint256 quantity;
    string satuan;
    uint256 harga;
    uint256 total;
}

struct DetailRencanaPembelianView {
    uint256 rencanaPembelianId;
    string kodePembelian;
    uint256 tanggalPembelian;
    uint256 jumlahTotal;
    ProdukDetailWithHarga[] produk;
    uint256 pajakPembelianId;
    uint256 ppn;
    uint256 ppbkb;
    uint256 pph;
    uint256 gross;
    uint256 net;
}

// Ms2 - One entry per product with aggregated values
struct ProdukMenuMs2View {
    uint256 produkId;
    string namaProduk;
    uint256 totalJumlah; // Sum of jumlah from DetailRencanaPembelian where ms2By == address(0)
    uint256 totalPembelian; // Count of DetailRencanaPembelian where ms2By == address(0)
}
