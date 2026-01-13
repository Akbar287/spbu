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

// Ms2 view all
struct Ms2View {
    uint256 ms2Id;
    uint256 tanggal;
    address konfirmasiBy;
    ProdukMenuMs2View[] produk;
    uint256 totalProduk;
    uint256 createdAt;
    uint256 updatedAt;
    bool deleted;
}

// Ms2 create
struct ProdukMenuMs2WithDetailRencanaPembelian {
    uint256 produkId;
    uint256 detailRencanaPembelianId;
    string namaProduk;
    uint256 jumlah;
    uint256 tanggalPembelian;
    string kodePembelian;
}

struct JamKerjaMs2ProdukMenu {
    uint256 jamKerjaId;
    string namaJamKerja;
    int256 urutan;
}

struct ProdukMenuMs2ViewByProdukId {
    uint256 produkId;
    string namaProduk;
    string totalJumlah;
    ProdukMenuMs2ViewByProdukIdPembelian[] produk;
}

struct ProdukMenuMs2ViewByProdukIdPembelian {
    uint256 rencanaPembelianId;
    uint256 detailRencanaPembelianId;
    uint256 tanggalPembelian;
    string kodePembelian;
    uint256 totalStok;
}

// Pengiriman
struct PengirimanView {
    uint256 pengirimanId;
    uint256 tanggal;
    string noDo;
    string noPol;
    ProdukMenuMs2View[] produk;
    uint256 createdAt;
    uint256 updatedAt;
    bool deleted;
}

struct PengirimanById {
    uint256 pengirimanId;
    address walletMember;
    uint256 tanggal;
    string noDo;
    string noPolisi;
    string catatan;
    bool ms2;
    address ms2By;
    uint256 ms2At;
    bool konfirmasiAdmin;
    bool konfirmasiDirektur;
    address konfirmasiAdminBy;
    uint256 konfirmasiAdminAt;
    address konfirmasiDirekturBy;
    uint256 konfirmasiDirekturAt;
    uint256 createdAt;
    uint256 updatedAt;
    bool deleted;
    PengirimanByIdForListFileLo[] fileLoList;
}
struct PengirimanByIdForListFileLo {
    uint256 detailRencanaPembelianId;
    uint256 produkId;
    string namaProduk;
    uint256 jumlah;
    string satuanJumlah;
    uint256 fileLoId;
    string noFaktur;
    string noLo;
}

// Semua Rencana Pembelian Sampai File Lo
struct FileLoDetailId {
    uint256 fileLoId;
    uint256 detailRencanaPembelianId;
    uint256 pengirimanId;
    uint256 rencanaPembelianId;
    string namaSpbu;
    address walletMember;
    uint256 tanggalPembelian;
    string kodePembelian;
    string deskripsi;
    uint256 grandTotal; // scaled x100
    uint256 ppn;
    uint256 ppbkb;
    uint256 pph;
    uint256 jumlah; // scaled x100
    string satuanJumlah;
    string noFaktur;
    string noLo;
    uint256 createdAt;
    uint256 updatedAt;
    bool deleted;
    string ipfsHash;
    FileLoDetailProduk[] produkList;
    FileLoDetailPembayaranId[] pembayaranList;
}
struct FileLoDetailProduk {
    uint256 detailRencanaPembelianId;
    uint256 produkId;
    string namaProduk;
    uint256 harga; // scaled x100
    uint256 jumlah; // scaled x100
    uint256 subTotal; // scaled x100
    string satuanJumlah;
}
struct FileLoDetailPembayaranId {
    uint256 pembayaranId;
    uint256 rencanaPembelianId;
    address walletMember;
    string noCekBg;
    string noRekening;
    string namaRekening;
    string namaBank;
    uint256 totalBayar;
}

struct KtpIdNama {
    uint256 ktpId;
    string nama;
    string nik;
    address walletAddress;
}

struct PenerimaanView {
    uint256 fileLoId;
    uint256 penerimaanId;
    string noFaktur;
    string noLo;
    uint256 tanggalPembelian;
    string namaProduk;
    uint256 jumlah;
    string satuanJumlah;
    uint256 createdAt;
    uint256 updatedAt;
    bool deleted;
}

struct PenerimaanDetailInfo {
    uint256 fileLoId;
    uint256 detailRencanaPembelianId;
    uint256 pengirimanId;
    uint256 tanggalPengiriman;
    uint256 rencanaPembelianId;
    string deskripsi;
    string namaSpbu;
    string pegawaiPengusul;
    uint256 tanggalPembelian;
    string kodePembelian;
    uint256 grandTotal; // scaled x100
    uint256 ppn;
    uint256 ppbkb;
    uint256 pph;
    uint256 harga; // scaled x100
    uint256 totalHarga; // scaled x100
    uint256 jumlah;
    string satuanJumlah;
    string noFaktur;
    string noLo;
    string noDo;
    string noPol;
    uint256 createdAt;
    uint256 updatedAt;
    bool deleted;
    string ipfsHash;
    FileLoDetailPembayaranId[] pembayaranList;
    AppStorage.Penerimaan[] penerimaanList;
}

struct PenerimaanCreateDetail {
    uint256 fileLoId;
    uint256 detailRencanaPembelianId;
    uint256 pengirimanId;
    uint256 tanggalPengiriman;
    uint256 rencanaPembelianId;
    string deskripsi;
    string namaSpbu;
    string pegawaiPengusul;
    uint256 tanggalPembelian;
    string kodePembelian;
    uint256 harga; // scaled x100
    uint256 totalHarga; // scaled x100
    uint256 jumlah;
    string satuanJumlah;
    string noFaktur;
    string noLo;
    string noDo;
    string noPol;
    uint256 createdAt;
    uint256 updatedAt;
    bool deleted;
    string ipfsHash;
    DombakPenerimaanCreateDetail[] dombakList;
    AppStorage.JamKerja[] jamKerjaList;
}

struct DombakPenerimaanCreateDetail {
    uint256 dombakId;
    string namaDombak;
    uint256 stok;
}

// Monitoring Stok
struct MonitoringStokCreateInfo {
    AppStorage.Produk[] produkList;
    AppStorage.Dombak[] dombakList;
}

struct MonitoringStokDetailInfo {
    uint256 stokInventoryId;
    uint256 produkId;
    string namaProduk;
    uint256 totalStok;
    MonitoringStokDetailInfoOnStokInventoryDombak[] stokInventoryDombakList;
    uint256 createdAt;
    uint256 updatedAt;
    bool deleted;
}
struct MonitoringStokDetailInfoOnStokInventoryDombak {
    uint256 stokInventoryDombakId;
    uint256 dombakId;
    string namaDombak;
    uint256 stok;
    uint256 createdAt;
    uint256 updatedAt;
    bool deleted;
}

struct MonitoringStokEditInfo {
    uint256 stokInventoryId;
    uint256 produkId;
    string namaProduk;
    uint256 totalStok;
    MonitoringStokDetailInfoOnStokInventoryDombak[] stokInventoryDombakList;
    uint256 createdAt;
    uint256 updatedAt;
    bool deleted;
    AppStorage.Dombak[] dombakList;
}

struct MonitoringStokRiwayatIndexInfo {
    uint256 stokInventoryId;
    uint256 dokumenStokId;
    uint256 tanggal;
    string typeMovement;
    string namaPegawai;
    string namaProduk;
    string jamKerja;
    string namaDombak;
    int256 stokAwal;
    int256 stokAkhir;
    int256 stokAkhirTeoritis;
    int256 totalLoss;
    string tandaLoss;
    uint256 createdAt;
    uint256 updatedAt;
    bool deleted;
}

// Stand Meter
struct StandMeterView {
    uint256 dokumenStokId;
    uint256 tanggal;
    string typeMovement;
    string namaProduk;
    string namaNozzle;
    string namaDombak;
    string namaJamKerja;
    int256 stokAwal;
    int256 stokAkhir;
    AppStorage.SimbolLosses simbol;
    int256 stokLosses;
    uint256 createdAt;
    uint256 updatedAt;
    bool deleted;
}
