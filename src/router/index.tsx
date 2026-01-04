import AuthMiddleware from '@/middleware/AuthMiddleware'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Home from '@/pages/dashboard/Home'

import Profil from '@/pages/Profil/Profil'
import ProfilEdit from '@/pages/Profil/ProfilEdit'
import Notifikasi from '@/pages/Notifikasi/Notifikasi'
import KonfigurasiDashboard from '@/pages/Konfigurasi/KonfigurasiDashboard'
import NotFound from '@/pages/errors/not-found'
import MasterDashboard from '@/pages/Master/MasterDashboard'
import DombakIndex from '@/pages/Master/Dombak/DombakIndex'
import AsetIndex from '@/pages/Master/Aset/AsetIndex'
import AsetCreate from '@/pages/Master/Aset/AsetCreate'
import AsetShow from '@/pages/Master/Aset/AsetShow'
import AsetEdit from '@/pages/Master/Aset/AsetEdit'
import FileAsetIndex from '@/pages/Master/Aset/FileAset/FileAsetIndex'
import FileAsetEdit from '@/pages/Master/Aset/FileAset/FileAsetEdit'
import FileAsetShow from '@/pages/Master/Aset/FileAset/FileAsetShow'
import FileAsetCreate from '@/pages/Master/Aset/FileAset/FileAsetCreate'
import FasilitasEdit from '@/pages/Master/Fasilitas/FasilitasEdit'
import FasilitasShow from '@/pages/Master/Fasilitas/FasilitasShow'
import FasilitasCreate from '@/pages/Master/Fasilitas/FasilitasCreate'
import FasilitasIndex from '@/pages/Master/Fasilitas/FasilitasIndex'
import FileFasilitasEdit from '@/pages/Master/Fasilitas/FileFasilitas/FileFasilitasEdit'
import FileFasilitasShow from '@/pages/Master/Fasilitas/FileFasilitas/FileFasilitasShow'
import FileFasilitasCreate from '@/pages/Master/Fasilitas/FileFasilitas/FileFasilitasCreate'
import FileFasilitasIndex from '@/pages/Master/Fasilitas/FileFasilitas/FileFasilitasIndex'
import ProdukEdit from '@/pages/Master/Produk/ProdukEdit'
import ProdukShow from '@/pages/Master/Produk/ProdukShow'
import ProdukCreate from '@/pages/Master/Produk/ProdukCreate'
import ProdukIndex from '@/pages/Master/Produk/ProdukIndex'
import HargaEdit from '@/pages/Master/Harga/HargaEdit'
import HargaShow from '@/pages/Master/Harga/HargaShow'
import HargaRiwayatShow from '@/pages/Master/Harga/HargaRiwayatShow'
import HargaRiwayatIndex from '@/pages/Master/Harga/HargaRiwayatIndex'
import HargaCreate from '@/pages/Master/Harga/HargaCreate'
import HargaIndex from '@/pages/Master/Harga/HargaIndex'
import MemberIndex from '@/pages/Master/Member/MemberIndex'
import MemberCreate from '@/pages/Master/Member/MemberCreate'
import MemberShow from '@/pages/Master/Member/MemberShow'
import MemberEdit from '@/pages/Master/Member/MemberEdit'
import MemberJabatanIndex from '@/pages/Master/Member/MemberJabatanIndex'
import MemberJabatanCreate from '@/pages/Master/Member/MemberJabatanCreate'
import DombakEdit from '@/pages/Master/Dombak/DombakEdit'
import DombakShow from '@/pages/Master/Dombak/DombakShow'
import DombakCreate from '@/pages/Master/Dombak/DombakCreate'
import KonversiEdit from '@/pages/Master/Dombak/Konversi/KonversiEdit'
import KonversiShow from '@/pages/Master/Dombak/Konversi/KonversiShow'
import KonversiUpload from '@/pages/Master/Dombak/Konversi/KonversiUpload'
import KonversiCreate from '@/pages/Master/Dombak/Konversi/KonversiCreate'
import KonversiIndex from '@/pages/Master/Dombak/Konversi/KonversiIndex'
import PayungEdit from '@/pages/Master/Payung/PayungEdit'
import PayungShow from '@/pages/Master/Payung/PayungShow'
import PayungCreate from '@/pages/Master/Payung/PayungCreate'
import PayungIndex from '@/pages/Master/Payung/PayungIndex'
import PayungDombakIndex from '@/pages/Master/Payung/PayungDombakIndex'
import PayungDombakCreate from '@/pages/Master/Payung/PayungDombakCreate'
import DispenserEdit from '@/pages/Master/Dispenser/DispenserEdit'
import DispenserShow from '@/pages/Master/Dispenser/DispenserShow'
import DispenserCreate from '@/pages/Master/Dispenser/DispenserCreate'
import DispenserIndex from '@/pages/Master/Dispenser/DispenserIndex'
import NozzleEdit from '@/pages/Master/Nozzle/NozzleEdit'
import NozzleShow from '@/pages/Master/Nozzle/NozzleShow'
import NozzleCreate from '@/pages/Master/Nozzle/NozzleCreate'
import NozzleIndex from '@/pages/Master/Nozzle/NozzleIndex'
import ProcurementMenu from '@/pages/Procurement/ProcurementMenu'
import PerencanaanKonfirmasi from '@/pages/Procurement/Perencanaan/PerencanaanKonfirmasi'
import PerencanaanDitolakShow from '@/pages/Procurement/Perencanaan/PerencanaanDitolakShow'
import PerencanaanEdit from '@/pages/Procurement/Perencanaan/PerencanaanEdit'
import PerencanaanShow from '@/pages/Procurement/Perencanaan/PerencanaanShow'
import PerencanaanDitolakIndex from '@/pages/Procurement/Perencanaan/PerencanaanDitolakIndex'
import PerencanaanCreate from '@/pages/Procurement/Perencanaan/PerencanaanCreate'
import PerencanaanIndex from '@/pages/Procurement/Perencanaan/PerencanaanIndex'
import DetailRencanaEdit from '@/pages/Procurement/Perencanaan/DetailRencanaEdit'
import DetailRencanaShow from '@/pages/Procurement/Perencanaan/DetailRencanaShow'
import DetailRencanaCreate from '@/pages/Procurement/Perencanaan/DetailRencanaCreate'
import DetailRencanaIndex from '@/pages/Procurement/Perencanaan/DetailRencanaIndex'
import PembelianIndex from '@/pages/Procurement/Pembelian/PembelianIndex'
import PembelianShow from '@/pages/Procurement/Pembelian/PembelianShow'
import PembelianKonfirmasiUlang from '@/pages/Procurement/Pembelian/PembelianKonfirmasiUlang'
import PembelianKonfirmasiHarga from '@/pages/Procurement/Pembelian/PembelianKonfirmasiHarga'
import PembayaranEdit from '@/pages/Procurement/Pembayaran/PembayaranEdit'
import PembayaranDetail from '@/pages/Procurement/Pembayaran/PembayaranDetail'
import PembayaranCreate from '@/pages/Procurement/Pembayaran/PembayaranCreate'
import PembayaranPajak from '@/pages/Procurement/Pembayaran/PembayaranPajak'
import PembayaranShow from '@/pages/Procurement/Pembayaran/PembayaranShow'
import PembayaranIndex from '@/pages/Procurement/Pembayaran/PembayaranIndex'
import FilePembayaranIndex from '@/pages/Procurement/Pembayaran/FilePembayaran/FilePembayaranIndex'
import FilePembayaranCreate from '@/pages/Procurement/Pembayaran/FilePembayaran/FilePembayaranCreate'
import FilePembayaranShow from '@/pages/Procurement/Pembayaran/FilePembayaran/FilePembayaranShow'
import FilePembayaranEdit from '@/pages/Procurement/Pembayaran/FilePembayaran/FilePembayaranEdit'
import DetailPembelianEdit from '@/pages/Procurement/Pembelian/DetailPembelian/DetailPembelianEdit'
import DetailPembelianShow from '@/pages/Procurement/Pembelian/DetailPembelian/DetailPembelianShow'
import DetailPembelianPajak from '@/pages/Procurement/Pembelian/DetailPembelian/DetailPembelianPajak'
import DetailPembelianIndex from '@/pages/Procurement/Pembelian/DetailPembelian/DetailPembelianIndex'
import Ms2ProdukIndex from '@/pages/Procurement/Ms2/Produk/Ms2ProdukIndex'
import Ms2DetailShow from '@/pages/Procurement/Ms2/Produk/Ms2DetailShow'
import Ms2ProdukShow from '@/pages/Procurement/Ms2/Produk/Ms2ProdukShow'
import Ms2PengirimanIndex from '@/pages/Procurement/Ms2/Pengiriman/Ms2PengirimanIndex'
import Ms2PengirimanKonfirm from '@/pages/Procurement/Ms2/Pengiriman/Ms2PengirimanKonfirm'
import Ms2PengirimanShow from '@/pages/Procurement/Ms2/Pengiriman/Ms2PengirimanShow'
import Ms2PengirimanCreate from '@/pages/Procurement/Ms2/Pengiriman/Ms2PengirimanCreate'
import FileLoShow from '@/pages/Procurement/Delivery/FileLoShow'
import FileLoCreate from '@/pages/Procurement/Delivery/FileLoCreate'
import PengirimanCatatan from '@/pages/Procurement/Delivery/PengirimanCatatan'
import PengirimanShow from '@/pages/Procurement/Delivery/PengirimanShow'
import PengirimanIndex from '@/pages/Procurement/Delivery/PengirimanIndex'
import LampiranEdit from '@/pages/Procurement/Delivery/FileLampiran/LampiranEdit'
import LampiranShow from '@/pages/Procurement/Delivery/FileLampiran/LampiranShow'
import LampiranCreate from '@/pages/Procurement/Delivery/FileLampiran/LampiranCreate'
import LampiranIndex from '@/pages/Procurement/Delivery/FileLampiran/LampiranIndex'
import StokMenu from '@/pages/Stok/StokMenu'
import MonitoringRiwayatDetail from '@/pages/Stok/Monitoring/MonitoringRiwayatDetail'
import MonitoringRiwayat from '@/pages/Stok/Monitoring/MonitoringRiwayat'
import MonitoringEdit from '@/pages/Stok/Monitoring/MonitoringEdit'
import MonitoringShow from '@/pages/Stok/Monitoring/MonitoringShow'
import MonitoringCreate from '@/pages/Stok/Monitoring/MonitoringCreate'
import MonitoringIndex from '@/pages/Stok/Monitoring/MonitoringIndex'
import MonitoringDombakCreate from '@/pages/Stok/Monitoring/MonitoringDombakCreate'
import MonitoringDombakIndex from '@/pages/Stok/Monitoring/MonitoringDombakIndex'
import FilePenerimaanIndex from '@/pages/Stok/Penerimaan/FilePenerimaan/FilePenerimaanIndex'
import PenerimaanIndex from '@/pages/Stok/Penerimaan/PenerimaanIndex'
import PenerimaanDetail from '@/pages/Stok/Penerimaan/PenerimaanDetail'
import PenerimaanShow from '@/pages/Stok/Penerimaan/PenerimaanShow'
import PenerimaanVerifikasiShow from '@/pages/Stok/Penerimaan/PenerimaanVerifikasiShow'
import PenerimaanVerifikasi from '@/pages/Stok/Penerimaan/PenerimaanVerifikasi'
import PenerimaanRiwayatShow from '@/pages/Stok/Penerimaan/PenerimaanRiwayatShow'
import PenerimaanRiwayat from '@/pages/Stok/Penerimaan/PenerimaanRiwayat'
import FilePenerimaanEdit from '@/pages/Stok/Penerimaan/FilePenerimaan/FilePenerimaanEdit'
import FilePenerimaanShow from '@/pages/Stok/Penerimaan/FilePenerimaan/FilePenerimaanShow'
import FilePenerimaanCreate from '@/pages/Stok/Penerimaan/FilePenerimaan/FilePenerimaanCreate'
import StokTransferEdit from '@/pages/Stok/StokTransfer/StokTransferEdit'
import StokTransferShow from '@/pages/Stok/StokTransfer/StokTransferShow'
import StokTransferRiwayatShow from '@/pages/Stok/StokTransfer/StokTransferRiwayatShow'
import StokTransferRiwayat from '@/pages/Stok/StokTransfer/StokTransferRiwayat'
import StokTransferCreate from '@/pages/Stok/StokTransfer/StokTransferCreate'
import StokTransferIndex from '@/pages/Stok/StokTransfer/StokTransferIndex'
import FileStokTransferIndex from '@/pages/Stok/StokTransfer/FileStokTransfer/FileStokTransferIndex'
import FileStokTransferCreate from '@/pages/Stok/StokTransfer/FileStokTransfer/FileStokTransferCreate'
import FileStokTransferShow from '@/pages/Stok/StokTransfer/FileStokTransfer/FileStokTransferShow'
import FileStokTransferEdit from '@/pages/Stok/StokTransfer/FileStokTransfer/FileStokTransferEdit'
import StokSummaryEdit from '@/pages/Stok/StokSummary/StokSummaryEdit'
import StokSummaryShow from '@/pages/Stok/StokSummary/StokSummaryShow'
import StokSummaryCreate from '@/pages/Stok/StokSummary/StokSummaryCreate'
import StokSummaryIndex from '@/pages/Stok/StokSummary/StokSummaryIndex'
import StokTakingIndex from '@/pages/Stok/StokTaking/StokTakingIndex'
import StokTakingEdit from '@/pages/Stok/StokTaking/StokTakingEdit'
import StokTakingShow from '@/pages/Stok/StokTaking/StokTakingShow'
import StokTakingRiwayatShow from '@/pages/Stok/StokTaking/StokTakingRiwayatShow'
import StokTakingRiwayat from '@/pages/Stok/StokTaking/StokTakingRiwayat'
import StokTakingCreate from '@/pages/Stok/StokTaking/StokTakingCreate'
import FileStokTakingIndex from '@/pages/Stok/StokTaking/FileStokTaking/FileStokTakingIndex'
import FileStokTakingEdit from '@/pages/Stok/StokTaking/FileStokTaking/FileStokTakingEdit'
import FileStokTakingShow from '@/pages/Stok/StokTaking/FileStokTaking/FileStokTakingShow'
import FileStokTakingCreate from '@/pages/Stok/StokTaking/FileStokTaking/FileStokTakingCreate'
import TotalisatorIndex from '@/pages/Stok/StandMeter/TotalisatorIndex'
import TotalisatorCreate from '@/pages/Stok/StandMeter/TotalisatorCreate'
import TotalisatorRiwayat from '@/pages/Stok/StandMeter/TotalisatorRiwayat'
import TotalisatorRiwayatShow from '@/pages/Stok/StandMeter/TotalisatorRiwayatShow'
import TotalisatorShow from '@/pages/Stok/StandMeter/TotalisatorShow'
import TotalisatorFinal from '@/pages/Stok/StandMeter/TotalisatorFinal'
import TotalisatorEdit from '@/pages/Stok/StandMeter/TotalisatorEdit'
import FileTotalisatorEdit from '@/pages/Stok/StandMeter/FileTotalisator/FileTotalisatorEdit'
import FileTotalisatorShow from '@/pages/Stok/StandMeter/FileTotalisator/FileTotalisatorShow'
import FileTotalisatorCreate from '@/pages/Stok/StandMeter/FileTotalisator/FileTotalisatorCreate'
import FileTotalisatorIndex from '@/pages/Stok/StandMeter/FileTotalisator/FileTotalisatorIndex'
import StokPengembalianIndex from '@/pages/Tera/Pengembalian/StokPengembalianIndex'
import StokPeminjamanIndex from '@/pages/Tera/Peminjaman/StokPeminjamanIndex'
import TeraMenu from '@/pages/Tera/TeraMenu'
import SetoranMenu from '@/pages/Setoran/SetoranMenu'
import FinancialMenu from '@/pages/Financial/FinancialMenu'
import PettyCashEdit from '@/pages/Financial/PettyCash/PettyCashEdit'
import PettyCashShow from '@/pages/Financial/PettyCash/PettyCashShow'
import PettyCashCreate from '@/pages/Financial/PettyCash/PettyCashCreate'
import PettyCashIndex from '@/pages/Financial/PettyCash/PettyCashIndex'
import FilePettyCashEdit from '@/pages/Financial/PettyCash/FilePettyCash/FilePettyCashEdit'
import FilePettyCashShow from '@/pages/Financial/PettyCash/FilePettyCash/FilePettyCashShow'
import FilePettyCashCreate from '@/pages/Financial/PettyCash/FilePettyCash/FilePettyCashCreate'
import FilePettyCashIndex from '@/pages/Financial/PettyCash/FilePettyCash/FilePettyCashIndex'
import RekapPajakShow from '@/pages/Financial/RekapPajak/RekapPajakShow'
import RekapPajakIndex from '@/pages/Financial/RekapPajak/RekapPajakIndex'
import PerubahanModalIndex from '@/pages/Financial/PerubahanModal/PerubahanModalIndex'
import ArusKasIndex from '@/pages/Financial/ArusKas/ArusKasIndex'
import BukuBesarIndex from '@/pages/Financial/BukuBesar/BukuBesarIndex'
import NeracaIndex from '@/pages/Financial/Neraca/NeracaIndex'
import LabaRugiIndex from '@/pages/Financial/LabaRugi/LabaRugiIndex'
import MarginIndex from '@/pages/Financial/Margin/MarginIndex'
import AbsensiMenu from '@/pages/Absensi/AbsensiMenu'
import JadwalQr from '@/pages/Absensi/JadwalKerja/JadwalQr'
import JadwalUpload from '@/pages/Absensi/JadwalKerja/JadwalUpload'
import JadwalTemplate from '@/pages/Absensi/JadwalKerja/JadwalTemplate'
import JadwalKerjaIndex from '@/pages/Absensi/JadwalKerja/JadwalKerjaIndex'
import AbsensiIndex from '@/pages/Absensi/Absensi/AbsensiIndex'
import AbsensiEdit from '@/pages/Absensi/Absensi/AbsensiEdit'
import AbsensiShow from '@/pages/Absensi/Absensi/AbsensiShow'
import LaporanAbsensiIndex from '@/pages/Absensi/LaporanAbsensi/LaporanAbsensiIndex'
import JamKerjaEdit from '@/pages/Konfigurasi/JamKerja/JamKerjaEdit'
import JamKerjaShow from '@/pages/Konfigurasi/JamKerja/JamKerjaShow'
import JamKerjaCreate from '@/pages/Konfigurasi/JamKerja/JamKerjaCreate'
import JamKerjaIndex from '@/pages/Konfigurasi/JamKerja/JamKerjaIndex'
import PajakIndex from '@/pages/Konfigurasi/Pajak/PajakIndex'
import PajakEdit from '@/pages/Konfigurasi/Pajak/PajakEdit'
import PajakShow from '@/pages/Konfigurasi/Pajak/PajakShow'
import PajakCreate from '@/pages/Konfigurasi/Pajak/PajakCreate'
import SpbuEdit from '@/pages/Konfigurasi/Spbu/SpbuEdit'
import SpbuShow from '@/pages/Konfigurasi/Spbu/SpbuShow'
import SpbuCreate from '@/pages/Konfigurasi/Spbu/SpbuCreate'
import SpbuIndex from '@/pages/Konfigurasi/Spbu/SpbuIndex'
import DivisiEdit from '@/pages/Konfigurasi/Divisi/DivisiEdit'
import DivisiShow from '@/pages/Konfigurasi/Divisi/DivisiShow'
import DivisiCreate from '@/pages/Konfigurasi/Divisi/DivisiCreate'
import DivisiIndex from '@/pages/Konfigurasi/Divisi/DivisiIndex'
import LevelEdit from '@/pages/Konfigurasi/Level/LevelEdit'
import LevelShow from '@/pages/Konfigurasi/Level/LevelShow'
import LevelCreate from '@/pages/Konfigurasi/Level/LevelCreate'
import LevelIndex from '@/pages/Konfigurasi/Level/LevelIndex'
import JabatanIndex from '@/pages/Konfigurasi/Jabatan/JabatanIndex'
import JabatanCreate from '@/pages/Konfigurasi/Jabatan/JabatanCreate'
import JabatanShow from '@/pages/Konfigurasi/Jabatan/JabatanShow'
import JabatanEdit from '@/pages/Konfigurasi/Jabatan/JabatanEdit'
import HariIndex from '@/pages/Konfigurasi/Hari/HariIndex'
import HariCreate from '@/pages/Konfigurasi/Hari/HariCreate'
import HariShow from '@/pages/Konfigurasi/Hari/HariShow'
import HariEdit from '@/pages/Konfigurasi/Hari/HariEdit'
import KehadiranShow from '@/pages/Kehadiran/KehadiranShow'
import KehadiranIndex from '@/pages/Kehadiran/KehadiranIndex'
import OpenPenjualanIndex from '@/pages/Setoran/OpenPenjualan/OpenPenjualanIndex'
import OpenPenjualanCreate from '@/pages/Setoran/OpenPenjualan/OpenPenjualanCreate'
import OpenPenjualanShow from '@/pages/Setoran/OpenPenjualan/OpenPenjualanShow'
import OpenPenjualanDetailIndex from '@/pages/Setoran/OpenPenjualan/OpenPenjualanDetail/OpenPenjualanDetailIndex'
import OpenPenjualanDetailCreate from '@/pages/Setoran/OpenPenjualan/OpenPenjualanDetail/OpenPenjualanDetailCreate'
import OpenPenjualanDetailShow from '@/pages/Setoran/OpenPenjualan/OpenPenjualanDetail/OpenPenjualanDetailShow'
import PjOperasionalShow from '@/pages/Setoran/PjOperasional/PjOperasionalShow'
import PjOperasionalCreate from '@/pages/Setoran/PjOperasional/PjOperasionalCreate'
import PjOperasionalIndex from '@/pages/Setoran/PjOperasional/PjOperasionalIndex'
import PenitipanSetoranShow from '@/pages/Setoran/PenitipanSetoran/PenitipanSetoranShow'
import PenitipanSetoranIndex from '@/pages/Setoran/PenitipanSetoran/PenitipanSetoranIndex'
import ClosingPenjualanIndex from '@/pages/Setoran/ClosingPenjualan/ClosingPenjualanIndex'
import ClosingPenjualanShow from '@/pages/Setoran/ClosingPenjualan/ClosingPenjualanShow'
import SetoranBankShow from '@/pages/Setoran/SetoranBank/SetoranBankShow'
import SetoranBankIndex from '@/pages/Setoran/SetoranBank/SetoranBankIndex'
import BankEdit from '@/pages/Setoran/SetoranBank/Bank/BankEdit'
import BankShow from '@/pages/Setoran/SetoranBank/Bank/BankShow'
import BankCreate from '@/pages/Setoran/SetoranBank/Bank/BankCreate'
import BankIndex from '@/pages/Setoran/SetoranBank/Bank/BankIndex'
import FileBankIndex from '@/pages/Setoran/SetoranBank/Bank/FileBank/FileBankIndex'
import FileBankCreate from '@/pages/Setoran/SetoranBank/Bank/FileBank/FileBankCreate'
import TagEdit from '@/pages/Artikel/Tag/TagEdit'
import TagShow from '@/pages/Artikel/Tag/TagShow'
import TagCreate from '@/pages/Artikel/Tag/TagCreate'
import TagIndex from '@/pages/Artikel/Tag/TagIndex'
import ArtikelMenu from '@/pages/Artikel/ArtikelMenu'
import KategoriEdit from '@/pages/Artikel/Kategori/KategoriEdit'
import KategoriShow from '@/pages/Artikel/Kategori/KategoriShow'
import KategoriCreate from '@/pages/Artikel/Kategori/KategoriCreate'
import KategoriIndex from '@/pages/Artikel/Kategori/KategoriIndex'
import PostEdit from '@/pages/Artikel/Post/PostEdit'
import PostShow from '@/pages/Artikel/Post/PostShow'
import PostCreate from '@/pages/Artikel/Post/PostCreate'
import PostIndex from '@/pages/Artikel/Post/PostIndex'
import FilePostEdit from '@/pages/Artikel/Post/FilePost/FilePostEdit'
import FilePostShow from '@/pages/Artikel/Post/FilePost/FilePostShow'
import FilePostCreate from '@/pages/Artikel/Post/FilePost/FilePostCreate'
import FilePostIndex from '@/pages/Artikel/Post/FilePost/FilePostIndex'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'


export default function index() {
    return (
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />

                <Route element={<AuthMiddleware />}>
                    {/* Route "/profil" menangani GET (view) dan POST (store) sekaligus */}
                    <Route path="/profil" element={<Profil />} />
                    <Route path="/profil/edit" element={<ProfilEdit />} />

                    <Route path="/notifikasi" element={<Notifikasi />} />

                    {/* --- MASTER DATA --- */}
                    <Route path="/master">
                        <Route index element={<MasterDashboard />} />

                        {/* Aset & File Aset */}
                        <Route path="aset" element={<AsetIndex />} />
                        <Route path="aset/create" element={<AsetCreate />} />
                        <Route path="aset/:asetId" element={<AsetShow />} />
                        <Route path="aset/:asetId/edit" element={<AsetEdit />} />

                        {/* Nested Resource: File Aset */}
                        <Route path="aset/:asetId/file" element={<FileAsetIndex />} />
                        <Route path="aset/:asetId/file/create" element={<FileAsetCreate />} />
                        <Route path="aset/:asetId/file/:fileAsetId" element={<FileAsetShow />} />
                        <Route path="aset/:asetId/file/:fileAsetId/edit" element={<FileAsetEdit />} />

                        {/* Fasilitas & File Fasilitas */}
                        <Route path="fasilitas" element={<FasilitasIndex />} />
                        <Route path="fasilitas/create" element={<FasilitasCreate />} />
                        <Route path="fasilitas/:fasilitasId" element={<FasilitasShow />} />
                        <Route path="fasilitas/:fasilitasId/edit" element={<FasilitasEdit />} />

                        <Route path="fasilitas/:fasilitasId/file" element={<FileFasilitasIndex />} />
                        <Route path="fasilitas/:fasilitasId/file/create" element={<FileFasilitasCreate />} />
                        <Route path="fasilitas/:fasilitasId/file/:fileFasilitasId" element={<FileFasilitasShow />} />
                        <Route path="fasilitas/:fasilitasId/file/:fileFasilitasId/edit" element={<FileFasilitasEdit />} />

                        {/* Produk */}
                        <Route path="produk" element={<ProdukIndex />} />
                        <Route path="produk/create" element={<ProdukCreate />} />
                        <Route path="produk/:produkId" element={<ProdukShow />} />
                        <Route path="produk/:produkId/edit" element={<ProdukEdit />} />

                        {/* Harga */}
                        <Route path="harga" element={<HargaIndex />} />
                        <Route path="harga/create" element={<HargaCreate />} />
                        <Route path="harga/riwayat" element={<HargaRiwayatIndex />} />
                        <Route path="harga/riwayat/:hargaId" element={<HargaRiwayatShow />} />
                        <Route path="harga/:hargaId" element={<HargaShow />} />
                        <Route path="harga/:hargaId/edit" element={<HargaEdit />} />

                        {/* Member */}
                        <Route path="member" element={<MemberIndex />} />
                        <Route path="member/create" element={<MemberCreate />} />
                        <Route path="member/:memberId" element={<MemberShow />} />
                        <Route path="member/:memberId/edit" element={<MemberEdit />} />
                        {/* Jabatan Member */}
                        <Route path="member/:memberId/jabatan" element={<MemberJabatanIndex />} />
                        <Route path="member/:memberId/jabatan/create" element={<MemberJabatanCreate />} />

                        {/* Dombak & Konversi */}
                        <Route path="dombak" element={<DombakIndex />} />
                        <Route path="dombak/create" element={<DombakCreate />} />
                        <Route path="dombak/:dombakId" element={<DombakShow />} />
                        <Route path="dombak/:dombakId/edit" element={<DombakEdit />} />

                        <Route path="dombak/:dombakId/konversi" element={<KonversiIndex />} />
                        <Route path="dombak/:dombakId/konversi/create" element={<KonversiCreate />} />
                        <Route path="dombak/:dombakId/konversi/upload" element={<KonversiUpload />} />
                        <Route path="dombak/:dombakId/konversi/:konversiId" element={<KonversiShow />} />
                        <Route path="dombak/:dombakId/konversi/:konversiId/edit" element={<KonversiEdit />} />

                        {/* Payung */}
                        <Route path="payung" element={<PayungIndex />} />
                        <Route path="payung/create" element={<PayungCreate />} />
                        <Route path="payung/:payungId" element={<PayungShow />} />
                        <Route path="payung/:payungId/edit" element={<PayungEdit />} />
                        {/* Payung Dombak Relation */}
                        <Route path="payung/:payungId/dombak" element={<PayungDombakIndex />} />
                        <Route path="payung/:payungId/dombak/create" element={<PayungDombakCreate />} />

                        {/* Dispenser & Nozzle */}
                        <Route path="dispenser" element={<DispenserIndex />} />
                        <Route path="dispenser/create" element={<DispenserCreate />} />
                        <Route path="dispenser/:dispenserId" element={<DispenserShow />} />
                        <Route path="dispenser/:dispenserId/edit" element={<DispenserEdit />} />

                        <Route path="nozzle" element={<NozzleIndex />} />
                        <Route path="nozzle/create" element={<NozzleCreate />} />
                        <Route path="nozzle/:nozzleId" element={<NozzleShow />} />
                        <Route path="nozzle/:nozzleId/edit" element={<NozzleEdit />} />
                    </Route>

                    {/* --- PROCUREMENT --- */}
                    <Route path="/procurement">
                        <Route index element={<ProcurementMenu />} />

                        {/* Perencanaan */}
                        <Route path="perencanaan" element={<PerencanaanIndex />} />
                        <Route path="perencanaan/create" element={<PerencanaanCreate />} />
                        <Route path="perencanaan/ditolak" element={<PerencanaanDitolakIndex />} />
                        <Route path="perencanaan/:rencanaId" element={<PerencanaanShow />} />
                        <Route path="perencanaan/:rencanaId/edit" element={<PerencanaanEdit />} />
                        <Route path="perencanaan/:rencanaId/ditolak" element={<PerencanaanDitolakShow />} />
                        <Route path="perencanaan/:rencanaId/konfirmasi" element={<PerencanaanKonfirmasi />} />

                        {/* Detail Produk Perencanaan */}
                        <Route path="perencanaan/:rencanaId/produk" element={<DetailRencanaIndex />} />
                        <Route path="perencanaan/:rencanaId/produk/create" element={<DetailRencanaCreate />} />
                        <Route path="perencanaan/:rencanaId/produk/:detailId" element={<DetailRencanaShow />} />
                        <Route path="perencanaan/:rencanaId/produk/:detailId/edit" element={<DetailRencanaEdit />} />

                        {/* Pembelian */}
                        <Route path="pembelian" element={<PembelianIndex />} />
                        <Route path="pembelian/:pembelianId/harga" element={<PembelianKonfirmasiHarga />} />
                        <Route path="pembelian/:pembelianId/ulang" element={<PembelianKonfirmasiUlang />} />
                        <Route path="pembelian/:pembelianId/detail" element={<PembelianShow />} />

                        {/* Detail Pembelian */}
                        <Route path="pembelian/:pembelianId/produk" element={<DetailPembelianIndex />} />
                        <Route path="pembelian/:pembelianId/produk/pajak" element={<DetailPembelianPajak />} />
                        <Route path="pembelian/:pembelianId/produk/:detailId" element={<DetailPembelianShow />} />
                        <Route path="pembelian/:pembelianId/produk/:detailId/edit" element={<DetailPembelianEdit />} />

                        {/* Pembayaran */}
                        <Route path="pembayaran" element={<PembayaranIndex />} />
                        <Route path="pembayaran/:rencanaId" element={<PembayaranShow />} />
                        <Route path="pembayaran/:rencanaId/pajak" element={<PembayaranPajak />} />
                        <Route path="pembayaran/:rencanaId/tambah" element={<PembayaranCreate />} />
                        <Route path="pembayaran/:rencanaId/:pembayaranId" element={<PembayaranDetail />} />
                        <Route path="pembayaran/:rencanaId/:pembayaranId/edit" element={<PembayaranEdit />} />

                        {/* File Pembayaran */}
                        <Route path="pembayaran/:rencanaId/:pembayaranId/file" element={<FilePembayaranIndex />} />
                        <Route path="pembayaran/:rencanaId/:pembayaranId/file/tambah" element={<FilePembayaranCreate />} />
                        <Route path="pembayaran/:rencanaId/:pembayaranId/file/:fileId" element={<FilePembayaranShow />} />
                        <Route path="pembayaran/:rencanaId/:pembayaranId/file/:fileId/edit" element={<FilePembayaranEdit />} />

                        {/* MS2 & Pengiriman */}
                        <Route path="ms2" element={<Ms2ProdukIndex />} />
                        <Route path="ms2/:produkId" element={<Ms2ProdukShow />} />
                        <Route path="ms2/:produkId/:detailId" element={<Ms2DetailShow />} />

                        <Route path="ms2/pengiriman" element={<Ms2PengirimanIndex />} />
                        <Route path="ms2/pengiriman/tambah" element={<Ms2PengirimanCreate />} />
                        <Route path="ms2/pengiriman/:ms2Id" element={<Ms2PengirimanShow />} />
                        <Route path="ms2/pengiriman/:ms2Id/konfirm" element={<Ms2PengirimanKonfirm />} />

                        {/* Delivery (Pengiriman) */}
                        <Route path="delivery" element={<PengirimanIndex />} />
                        <Route path="delivery/:pengirimanId" element={<PengirimanShow />} />
                        <Route path="delivery/:pengirimanId/catatan" element={<PengirimanCatatan />} />
                        <Route path="delivery/:pengirimanId/file_lo_create" element={<FileLoCreate />} />
                        <Route path="delivery/:pengirimanId/file_lo_show/:fileLoId" element={<FileLoShow />} />

                        {/* File Lampiran LO */}
                        <Route path="delivery/:pengirimanId/file_lo_show/:fileLoId/lampiran" element={<LampiranIndex />} />
                        <Route path="delivery/:pengirimanId/file_lo_show/:fileLoId/lampiran/create" element={<LampiranCreate />} />
                        <Route path="delivery/:pengirimanId/file_lo_show/:fileLoId/lampiran/:lampiranId" element={<LampiranShow />} />
                        <Route path="delivery/:pengirimanId/file_lo_show/:fileLoId/lampiran/:lampiranId/edit" element={<LampiranEdit />} />
                    </Route>

                    {/* --- STOK / MANAJEMEN PERSEDIAAN --- */}
                    <Route path="/stok">
                        <Route index element={<StokMenu />} />

                        {/* Monitoring */}
                        <Route path="monitoring" element={<MonitoringIndex />} />
                        <Route path="monitoring/create" element={<MonitoringCreate />} />
                        <Route path="monitoring/:stokId" element={<MonitoringShow />} />
                        <Route path="monitoring/:stokId/edit" element={<MonitoringEdit />} />
                        <Route path="monitoring/:stokId/riwayat" element={<MonitoringRiwayat />} />
                        <Route path="monitoring/:stokId/riwayat/:dokumenStokId" element={<MonitoringRiwayatDetail />} />
                        {/* Monitoring Dombak */}
                        <Route path="monitoring/:stokId/dombak" element={<MonitoringDombakIndex />} />
                        <Route path="monitoring/:stokId/dombak/create" element={<MonitoringDombakCreate />} />

                        {/* Penerimaan */}
                        <Route path="penerimaan" element={<PenerimaanIndex />} />
                        <Route path="penerimaan/riwayat" element={<PenerimaanRiwayat />} />
                        <Route path="penerimaan/riwayat/:penerimaanId" element={<PenerimaanRiwayatShow />} />
                        <Route path="penerimaan/verifikasi" element={<PenerimaanVerifikasi />} />
                        <Route path="penerimaan/verifikasi/:penerimaanId" element={<PenerimaanVerifikasiShow />} />
                        <Route path="penerimaan/:fileLoId" element={<PenerimaanShow />} />
                        <Route path="penerimaan/:penerimaanId/show" element={<PenerimaanDetail />} />
                        {/* File Penerimaan */}
                        <Route path="penerimaan/verifikasi/:penerimaanId/file" element={<FilePenerimaanIndex />} />
                        <Route path="penerimaan/verifikasi/:penerimaanId/file/create" element={<FilePenerimaanCreate />} />
                        <Route path="penerimaan/verifikasi/:penerimaanId/file/:fileId" element={<FilePenerimaanShow />} />
                        <Route path="penerimaan/verifikasi/:penerimaanId/file/:fileId/edit" element={<FilePenerimaanEdit />} />

                        {/* Stok Transfer */}
                        <Route path="stok-transfer" element={<StokTransferIndex />} />
                        <Route path="stok-transfer/create" element={<StokTransferCreate />} />
                        <Route path="stok-transfer/riwayat" element={<StokTransferRiwayat />} />
                        <Route path="stok-transfer/riwayat/:stokId" element={<StokTransferRiwayatShow />} />
                        <Route path="stok-transfer/:dombakTransferId" element={<StokTransferShow />} />
                        <Route path="stok-transfer/:dombakTransferId/edit" element={<StokTransferEdit />} />
                        {/* File Stok Transfer */}
                        <Route path="stok-transfer/:dombakTransferId/stok/:dokumenStokId/file" element={<FileStokTransferIndex />} />
                        <Route path="stok-transfer/:dombakTransferId/stok/:dokumenStokId/file/create" element={<FileStokTransferCreate />} />
                        <Route path="stok-transfer/:dombakTransferId/stok/:dokumenStokId/file/:fileId" element={<FileStokTransferShow />} />
                        <Route path="stok-transfer/:dombakTransferId/stok/:dokumenStokId/file/:fileId/edit" element={<FileStokTransferEdit />} />

                        {/* Stok Summary */}
                        <Route path="stok-summary" element={<StokSummaryIndex />} />
                        <Route path="stok-summary/create" element={<StokSummaryCreate />} />
                        <Route path="stok-summary/:date" element={<StokSummaryShow />} />
                        <Route path="stok-summary/:date/edit" element={<StokSummaryEdit />} />

                        {/* Stok Taking */}
                        <Route path="stok-taking" element={<StokTakingIndex />} />
                        <Route path="stok-taking/create" element={<StokTakingCreate />} />
                        <Route path="stok-taking/riwayat" element={<StokTakingRiwayat />} />
                        <Route path="stok-taking/riwayat/:stokId" element={<StokTakingRiwayatShow />} />
                        <Route path="stok-taking/:stokId" element={<StokTakingShow />} />
                        <Route path="stok-taking/:stokId/edit" element={<StokTakingEdit />} />
                        {/* File Stok Taking */}
                        <Route path="stok-taking/:stokId/file" element={<FileStokTakingIndex />} />
                        <Route path="stok-taking/:stokId/file/create" element={<FileStokTakingCreate />} />
                        <Route path="stok-taking/:stokId/file/:fileId" element={<FileStokTakingShow />} />
                        <Route path="stok-taking/:stokId/file/:fileId/edit" element={<FileStokTakingEdit />} />

                        {/* Totalisator / Stand Meter */}
                        <Route path="totalisator" element={<TotalisatorIndex />} />
                        <Route path="totalisator/create" element={<TotalisatorCreate />} />
                        <Route path="totalisator/riwayat" element={<TotalisatorRiwayat />} />
                        <Route path="totalisator/riwayat/:standMeterId" element={<TotalisatorRiwayatShow />} />
                        <Route path="totalisator/:standMeterId" element={<TotalisatorShow />} />
                        <Route path="totalisator/:standMeterId/edit" element={<TotalisatorEdit />} />
                        <Route path="totalisator/:standMeterId/final" element={<TotalisatorFinal />} />
                        {/* File Totalisator */}
                        <Route path="totalisator/:standMeterId/file" element={<FileTotalisatorIndex />} />
                        <Route path="totalisator/:standMeterId/file/create" element={<FileTotalisatorCreate />} />
                        <Route path="totalisator/:standMeterId/file/:fileId" element={<FileTotalisatorShow />} />
                        <Route path="totalisator/:standMeterId/file/:fileId/edit" element={<FileTotalisatorEdit />} />
                    </Route>

                    {/* --- TERA --- */}
                    <Route path="/tera">
                        <Route index element={<TeraMenu />} />
                        <Route path="stok-peminjaman" element={<StokPeminjamanIndex />} />
                        <Route path="stok-pengembalian" element={<StokPengembalianIndex />} />
                    </Route>

                    {/* --- SETORAN --- */}
                    <Route path="/setoran">
                        <Route index element={<SetoranMenu />} />

                        {/* Open Penjualan */}
                        <Route path="open-penjualan" element={<OpenPenjualanIndex />} />
                        <Route path="open-penjualan/create" element={<OpenPenjualanCreate />} />
                        <Route path="open-penjualan/:penjualanId" element={<OpenPenjualanShow />} />
                        {/* Detail Open Penjualan */}
                        <Route path="open-penjualan/:penjualanId/detail" element={<OpenPenjualanDetailIndex />} />
                        <Route path="open-penjualan/:penjualanId/detail/create" element={<OpenPenjualanDetailCreate />} />
                        <Route path="open-penjualan/:penjualanId/detail/:detailId" element={<OpenPenjualanDetailShow />} />
                        {/* PJ Operasional */}
                        <Route path="open-penjualan/:penjualanId/pj" element={<PjOperasionalIndex />} />
                        <Route path="open-penjualan/:penjualanId/pj/create" element={<PjOperasionalCreate />} />
                        <Route path="open-penjualan/:penjualanId/pj/:jabatanId" element={<PjOperasionalShow />} />

                        {/* Penitipan Setoran */}
                        <Route path="penitipan-setoran" element={<PenitipanSetoranIndex />} />
                        <Route path="penitipan-setoran/:penjualanId" element={<PenitipanSetoranShow />} />

                        {/* Closing Penjualan */}
                        <Route path="closing-penjualan" element={<ClosingPenjualanIndex />} />
                        <Route path="closing-penjualan/:penjualanId" element={<ClosingPenjualanShow />} />

                        {/* Setor Ke Bank */}
                        <Route path="setoran-bank" element={<SetoranBankIndex />} />
                        <Route path="setoran-bank/:penjualanId" element={<SetoranBankShow />} />
                        {/* Bank Sub-resource */}
                        <Route path="setoran-bank/:penjualanId/bank" element={<BankIndex />} />
                        <Route path="setoran-bank/:penjualanId/bank/create" element={<BankCreate />} />
                        <Route path="setoran-bank/:penjualanId/bank/:penitipanId" element={<BankShow />} />
                        <Route path="setoran-bank/:penjualanId/bank/:penitipanId/edit" element={<BankEdit />} />
                        {/* File Bank */}
                        <Route path="setoran-bank/:penjualanId/bank/:penitipanId/file" element={<FileBankIndex />} />
                        <Route path="setoran-bank/:penjualanId/bank/:penitipanId/file/create" element={<FileBankCreate />} />
                    </Route>

                    {/* --- ARTIKEL --- */}
                    <Route path="/artikel">
                        <Route index element={<ArtikelMenu />} />

                        <Route path="tag" element={<TagIndex />} />
                        <Route path="tag/create" element={<TagCreate />} />
                        <Route path="tag/:tagId" element={<TagShow />} />
                        <Route path="tag/:tagId/edit" element={<TagEdit />} />

                        <Route path="kategori" element={<KategoriIndex />} />
                        <Route path="kategori/create" element={<KategoriCreate />} />
                        <Route path="kategori/:kategoriId" element={<KategoriShow />} />
                        <Route path="kategori/:kategoriId/edit" element={<KategoriEdit />} />

                        <Route path="post" element={<PostIndex />} />
                        <Route path="post/create" element={<PostCreate />} />
                        <Route path="post/:postId" element={<PostShow />} />
                        <Route path="post/:postId/edit" element={<PostEdit />} />
                        {/* File Post */}
                        <Route path="post/:postId/file" element={<FilePostIndex />} />
                        <Route path="post/:postId/file/create" element={<FilePostCreate />} />
                        <Route path="post/:postId/file/:fileId" element={<FilePostShow />} />
                        <Route path="post/:postId/file/:fileId/edit" element={<FilePostEdit />} />
                    </Route>

                    {/* --- FINANCIAL --- */}
                    <Route path="/financial">
                        <Route index element={<FinancialMenu />} />

                        {/* Petty Cash */}
                        <Route path="petty-cash" element={<PettyCashIndex />} />
                        <Route path="petty-cash/create" element={<PettyCashCreate />} />
                        <Route path="petty-cash/:pettyCashId" element={<PettyCashShow />} />
                        <Route path="petty-cash/:pettyCashId/edit" element={<PettyCashEdit />} />
                        {/* File Petty Cash */}
                        <Route path="petty-cash/:pettyCashId/file" element={<FilePettyCashIndex />} />
                        <Route path="petty-cash/:pettyCashId/file/create" element={<FilePettyCashCreate />} />
                        <Route path="petty-cash/:pettyCashId/file/:fileId" element={<FilePettyCashShow />} />
                        <Route path="petty-cash/:pettyCashId/file/:fileId/edit" element={<FilePettyCashEdit />} />

                        <Route path="rekap-pajak" element={<RekapPajakIndex />} />
                        <Route path="rekap-pajak/:pajakId" element={<RekapPajakShow />} />

                        <Route path="margin" element={<MarginIndex />} />
                        <Route path="laba-rugi" element={<LabaRugiIndex />} />
                        <Route path="neraca" element={<NeracaIndex />} />
                        <Route path="buku-besar" element={<BukuBesarIndex />} />
                        <Route path="arus-kas" element={<ArusKasIndex />} />
                        <Route path="perubahan-modal" element={<PerubahanModalIndex />} />
                    </Route>

                    {/* --- ABSENSI --- */}
                    <Route path="/jadwal_absensi">
                        <Route index element={<AbsensiMenu />} />

                        <Route path="jadwal" element={<JadwalKerjaIndex />} />
                        <Route path="jadwal/template" element={<JadwalTemplate />} />
                        <Route path="jadwal/upload" element={<JadwalUpload />} />
                        <Route path="jadwal/qr" element={<JadwalQr />} />

                        <Route path="absensi" element={<AbsensiIndex />} />
                        <Route path="absensi/:penjadwalanId" element={<AbsensiShow />} />
                        <Route path="absensi/:penjadwalanId/edit" element={<AbsensiEdit />} />

                        <Route path="laporan_absensi" element={<LaporanAbsensiIndex />} />
                    </Route>

                    {/* --- KONFIGURASI --- */}
                    <Route path="/konfigurasi">
                        <Route index element={<KonfigurasiDashboard />} />

                        <Route path="spbu" element={<SpbuIndex />} />
                        <Route path="spbu/create" element={<SpbuCreate />} />
                        <Route path="spbu/:spbuId" element={<SpbuShow />} />
                        <Route path="spbu/:spbuId/edit" element={<SpbuEdit />} />

                        <Route path="divisi" element={<DivisiIndex />} />
                        <Route path="divisi/create" element={<DivisiCreate />} />
                        <Route path="divisi/:divisiId" element={<DivisiShow />} />
                        <Route path="divisi/:divisiId/edit" element={<DivisiEdit />} />

                        <Route path="level" element={<LevelIndex />} />
                        <Route path="level/create" element={<LevelCreate />} />
                        <Route path="level/:levelId" element={<LevelShow />} />
                        <Route path="level/:levelId/edit" element={<LevelEdit />} />

                        <Route path="jabatan" element={<JabatanIndex />} />
                        <Route path="jabatan/create" element={<JabatanCreate />} />
                        <Route path="jabatan/:jabatanId" element={<JabatanShow />} />
                        <Route path="jabatan/:jabatanId/edit" element={<JabatanEdit />} />

                        <Route path="hari" element={<HariIndex />} />
                        <Route path="hari/create" element={<HariCreate />} />
                        <Route path="hari/:hariId" element={<HariShow />} />
                        <Route path="hari/:hariId/edit" element={<HariEdit />} />

                        <Route path="pajak" element={<PajakIndex />} />
                        <Route path="pajak/create" element={<PajakCreate />} />
                        <Route path="pajak/:pajakId" element={<PajakShow />} />
                        <Route path="pajak/:pajakId/edit" element={<PajakEdit />} />

                        <Route path="jam_kerja" element={<JamKerjaIndex />} />
                        <Route path="jam_kerja/create" element={<JamKerjaCreate />} />
                        <Route path="jam_kerja/:jamKerjaId" element={<JamKerjaShow />} />
                        <Route path="jam_kerja/:jamKerjaId/edit" element={<JamKerjaEdit />} />

                        {/* <Route path="import" element={<ImportIndex />} /> */}
                    </Route>

                    {/* --- KEHADIRAN OPERATOR --- */}
                    <Route path="/kehadiran" element={<KehadiranIndex />} />
                    <Route path="/kehadiran/:penjadwalanId" element={<KehadiranShow />} />
                </Route>

                <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
        </BrowserRouter>
    )
}