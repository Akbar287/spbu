// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

/**
 * ============================================================================
 *                          SPBU MANAGEMENT SYSTEM
 *                         Smart Contract Storage
 * ============================================================================
 *
 * @title AppStorage - Penyimpanan Data Terpusat untuk Sistem Manajemen SPBU
 * @author Tim Pengembang SPBU
 * @notice Library ini berisi semua struktur data (struct) dan penyimpanan untuk
 *         mengelola operasional SPBU berbasis blockchain.
 *
 * ============================================================================
 *                              DAFTAR ISI
 * ============================================================================
 *
 *  1. Domain Role Definitions   - Definisi peran pengguna dalam sistem
 *  2. Domain Identifikasi       - Data identitas member/karyawan
 *  3. Domain Organisasi         - Struktur organisasi SPBU
 *  4. Domain Human Capital      - Penggajian dan kompensasi
 *  5. Domain Aset Management    - Pengelolaan aset dan fasilitas
 *  6. Domain Inventory          - Stok BBM dan manajemen tangki
 *  7. Domain Pengadaan          - Pembelian dan procurement
 *  8. Domain Logistik           - Pengiriman dan penerimaan BBM
 *  9. Domain Point of Sales     - Penjualan dan transaksi harian
 * 10. Domain Keuangan           - Petty cash dan penarikan dana
 * 11. Domain Attendance         - Kehadiran dan penjadwalan karyawan
 * 12. Domain Quality Control    - Tera dan kalibrasi dispenser
 *
 * ============================================================================
 *                           PANDUAN PENGGUNAAN
 * ============================================================================
 *
 * KONSEP SCALED x100:
 * - Nilai desimal disimpan dengan dikali 100 untuk presisi
 * - Contoh: 12.50 liter disimpan sebagai 1250
 * - Contoh: Rp 8,500.75 disimpan sebagai 850075
 *
 * UNIX TIMESTAMP:
 * - Waktu disimpan dalam format Unix timestamp (detik sejak 1 Jan 1970)
 * - Untuk jam, gunakan: hours * 3600 + minutes * 60
 *
 * SOFT DELETE:
 * - Field 'deleted' digunakan untuk menandai data yang dihapus
 * - Data tidak benar-benar dihapus dari blockchain (immutable)
 *
 * RELASI DATA:
 * - Mapping dengan format 'AToB' menunjukkan relasi dari A ke B
 * - Array uint256[] menyimpan daftar ID yang berelasi
 *
 * ============================================================================
 */
library AppStorage {
    // ==================== 1. Domain Role Definitions ====================
    /**
     * @notice Definisi peran (role) pengguna dalam sistem SPBU
     * @dev Role menggunakan keccak256 hash untuk keamanan dan efisiensi
     *
     * Hierarki Role:
     * - KOMISARIS_ROLE  : Pemilik/pengawas tertinggi, akses readonly laporan
     * - DIREKTUR_ROLE   : Pengambil keputusan strategis, approval akhir
     * - ADMIN_ROLE      : Pengelola sistem dan data master
     * - OPERATOR_ROLE   : Karyawan operasional pompa BBM
     * - SECURITY_ROLE   : Petugas keamanan SPBU
     * - OFFICEBOY_ROLE  : Petugas kebersihan dan pendukung
     * - PARTNER_ROLE    : Mitra eksternal (supplier, dll)
     */

    // Role untuk level tertinggi dalam organisasi
    bytes32 public constant KOMISARIS_ROLE = keccak256("KOMISARIS_ROLE");
    bytes32 public constant DIREKTUR_ROLE = keccak256("DIREKTUR_ROLE");

    // Role untuk pengelola sistem
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Role untuk karyawan operasional
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant SECURITY_ROLE = keccak256("SECURITY_ROLE");
    bytes32 public constant OFFICEBOY_ROLE = keccak256("OFFICEBOY_ROLE");

    // Role untuk mitra eksternal
    bytes32 public constant PARTNER_ROLE = keccak256("PARTNER_ROLE");

    // ==================== 2. Domain Identifikasi ====================
    /**
     * @notice Domain untuk mengelola identitas member dan karyawan
     * @dev Menyimpan data KTP, alamat, dan notifikasi
     *
     * Alur Data:
     * StatusMember -> Ktp -> AreaMember
     *                    -> Notifikasi
     *
     * Integrasi:
     * - KTP terhubung dengan wallet address untuk autentikasi
     * - Email & No HP untuk komunikasi
     */

    /**
     * @notice Enum untuk jenis kelamin
     */
    enum Gender {
        Pria, // 0 = Pria/Laki-laki
        Wanita // 1 = Wanita/Perempuan
    }

    /**
     * @notice Status keanggotaan member (Aktif, Non-Aktif, Pending, dll)
     */

    struct StatusMember {
        uint256 statusMemberId;
        string namaStatus;
        string keterangan;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Ktp {
        uint256 ktpId;
        uint256 statusMemberId;
        string nik;
        string nama;
        Gender gender;
        string tempatLahir;
        uint256 tanggalLahir;
        bool verified;
        address walletAddress;
        string email;
        string noHp;
        string noWa;
        uint256 bergabungSejak;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct AreaMember {
        uint256 areaMemberId;
        uint256 ktpId;
        string provinsi;
        string kabupaten;
        string kecamatan;
        string kelurahan;
        string alamat;
        string rw;
        string rt;
        string no;
        string kodePos;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Notifikasi {
        uint256 notifikasiId;
        string judul;
        string konten;
        bool read;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct IdentityStorage {
        // Storage
        mapping(uint256 => StatusMember) statusMembers;
        mapping(uint256 => Ktp) ktp;
        mapping(uint256 => AreaMember) areaMember;
        mapping(uint256 => Notifikasi) notifikasi;
        mapping(address => Ktp) ktpMember;
        // Relation
        mapping(uint256 => uint256[]) statusMemberToKtpIds;
        mapping(uint256 => uint256[]) ktpToAreaMemberIds;
        mapping(uint256 => uint256[]) ktpToNotifikasiIds;
        // Get All
        uint256[] allStatusMemberIds;
        uint256[] allKtpIds;
        // Counters
        uint256 statusMemberCounter;
        uint256 ktpCounter;
        mapping(address => uint256) areaMemberCounter;
        mapping(address => uint256) notifikasiCounter;
    }

    // ==================== 3. Domain Organisasi ====================
    /**
     * @notice Domain untuk struktur organisasi SPBU
     * @dev Hierarki: SPBU -> Divisi -> Level -> Jabatan
     *
     * Contoh Struktur:
     * - SPBU Pertamina XX.XXX.XX
     *   ├─ Divisi Operasional
     *   │  ├─ Level Supervisor
     *   │  │  └─ Jabatan: Kepala Shift
     *   │  └─ Level Staff
     *   │     └─ Jabatan: Operator Pompa
     *   └─ Divisi Keuangan
     *      └─ Level Staff
     *         └─ Jabatan: Kasir
     */

    /**
     * @notice Data SPBU (Stasiun Pengisian Bahan Bakar Umum)
     * @param spbuId ID unik SPBU
     * @param namaSpbu Nama lengkap SPBU (contoh: "SPBU Pertamina 44.501.18")
     * @param nomorSpbu Nomor registrasi resmi (contoh: "44.501.18")
     * @param tanggalPendirian Unix timestamp tanggal berdiri
     * @param alamat Alamat lengkap SPBU
     * @param luasLahan Luas area dalam satuan tertentu
     * @param satuanLuas Satuan luas (m², ha, are)
     */
    struct Spbu {
        uint256 spbuId;
        string namaSpbu;
        string nomorSpbu;
        uint256 tanggalPendirian;
        string alamat;
        uint256 luasLahan;
        string satuanLuas;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Divisi {
        uint256 divisiId;
        uint256 spbuId;
        string namaDivisi;
        string keterangan;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Level {
        uint256 levelId;
        uint256 divisiId;
        string namaLevel;
        string keterangan;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Jabatan {
        uint256 jabatanId;
        uint256 levelId;
        string namaJabatan;
        string keterangan;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct OrganisasiStorage {
        mapping(uint256 => Spbu) spbuList;
        mapping(uint256 => Divisi) divisiList;
        mapping(uint256 => Level) levelList;
        mapping(uint256 => Jabatan) jabatanList;
        // relation
        mapping(uint256 => uint256[]) spbuToDivisiIds;
        mapping(uint256 => uint256[]) divisiToLevelIds;
        mapping(uint256 => uint256[]) levelToJabatanIds;
        mapping(uint256 => address[]) jabatanToWalletIds;
        mapping(address => uint256[]) walletToJabatanIds;
        // Get All
        uint256[] allSpbuIds;
        uint256[] allDivisiIds;
        uint256[] allLevelIds;
        uint256[] allJabatanIds;
        // Counters
        uint256 spbuCounter;
        uint256 divisiCounter;
        uint256 levelCounter;
        uint256 jabatanCounter;
    }

    // ==================== 4. Domain Human Capital ====================
    /**
     * @notice Domain untuk pengelolaan gaji dan kompensasi karyawan
     * @dev Mendukung gaji pokok, tunjangan, potongan, dan bonus
     *
     * Alur Penggajian:
     * 1. Gaji (template berdasarkan jabatan)
     * 2. GajiWallet (gaji aktual per karyawan per periode)
     * 3. DetailGaji (komponen: tunjangan, potongan)
     * 4. Bonus (jika ada)
     *
     * Semua nilai uang menggunakan scaled x100 untuk presisi desimal
     */

    /**
     * @notice Jenis komponen gaji
     */
    enum JenisGaji {
        Tambah, // 0 = Menambah gaji (gaji pokok, tunjangan makan, transport, dll)
        Kurang // 1 = Mengurangi gaji (potongan BPJS, pajak, pinjaman, dll)
    }

    /**
     * @notice Struct untuk jenis/template gaji berdasarkan jabatan
     */
    struct Gaji {
        uint256 gajiId;
        uint256 jabatanId; // Referensi ke jabatan di OrganizationContract
        string keterangan; // Deskripsi gaji
        int256 jumlah; // Jumlah gaji pokok
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    /**
     * @notice Struct untuk gaji yang diberikan ke wallet/karyawan tertentu
     */
    struct GajiWallet {
        uint256 gajiWalletId;
        uint256 gajiId; // Referensi ke Gaji
        address wallet; // Alamat wallet karyawan
        uint256 tanggalGaji; // Tanggal gaji diberikan (Unix timestamp)
        int256 totalGajiBersih; // Total gaji setelah semua komponen dihitung
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    /**
     * @notice Struct untuk detail komponen gaji (tunjangan, potongan, dll)
     */
    struct DetailGaji {
        uint256 detailGajiId;
        uint256 gajiWalletId; // Referensi ke GajiWallet
        string namaGaji; // Nama komponen (contoh: "Tunjangan Makan", "Potongan BPJS")
        JenisGaji jenis; // Tambah atau Kurang
        int256 jumlahUang; // Jumlah uang komponen (diakumulasi jadi totalGajiBersih)
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    /**
     * @notice Struct untuk bonus (relasi one-to-one dengan DetailGaji)
     */
    struct Bonus {
        uint256 bonusId;
        uint256 detailGajiId; // Referensi ke DetailGaji
        int256 persentase; // Persentase bonus
        int256 totalBonus; // Total bonus dalam rupiah
        string deskripsi; // Deskripsi bonus
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct HumanCapitalStorage {
        // ==================== Storage ====================
        mapping(uint256 => Gaji) gajiList;
        mapping(uint256 => GajiWallet) gajiWalletList;
        mapping(uint256 => DetailGaji) detailGajiList;
        mapping(uint256 => Bonus) bonusList;
        // Relasi mappings (1 Domain Out)
        mapping(uint256 => uint256[]) jabatanToGajiIds;
        mapping(uint256 => uint256[]) gajiToGajiWalletIds;
        mapping(uint256 => uint256[]) gajiWalletToDetailIds;
        mapping(uint256 => uint256) detailGajiToBonusId;
        mapping(address => uint256[]) walletToGajiWalletIds;
        // Get All
        uint256[] gajiIds;
        uint256[] gajiWalletIds;
        // Counters
        uint256 gajiCounter;
        uint256 gajiWalletCounter;
        uint256 detailGajiCounter;
        uint256 bonusCounter;
    }

    // ==================== 5. Domain Aset Management ====================
    /**
     * @notice Domain untuk pengelolaan aset dan fasilitas SPBU
     * @dev Mendukung pencatatan fasilitas, aset, dan dokumentasi foto
     *
     * Jenis Data:
     * - Fasilitas: Infrastruktur SPBU (toilet, mushola, minimarket)
     * - Aset     : Barang inventaris dengan nilai penyusutan
     *
     * File disimpan di IPFS dengan metadata lengkap
     */

    /**
     * @notice Data fasilitas SPBU
     * @param fasilitasId ID unik fasilitas
     * @param spbuId ID SPBU yang memiliki fasilitas ini
     * @param nama Nama fasilitas (contoh: "Toilet", "Mushola")
     * @param jumlah Jumlah unit fasilitas
     */
    struct Fasilitas {
        uint256 fasilitasId;
        uint256 spbuId;
        string nama;
        string keterangan;
        int256 jumlah;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Aset {
        uint256 asetId;
        uint256 spbuId;
        string nama;
        string keterangan;
        int256 jumlah;
        int256 harga;
        int256 penyusutanPerHari;
        bool digunakan;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    /**
     * @notice Struct untuk menyimpan file gambar fasilitas
     * @dev Mendukung penyimpanan IPFS dengan field ipfsHash dan mimeType
     */
    struct FileFasilitas {
        uint256 fileFasilitasId;
        uint256 fasilitasId;
        string ipfsHash; // IPFS CID/Hash (contoh: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco")
        string namaFile; // Nama file asli (contoh: "foto_toilet.jpg")
        string namaDokumen; // Nama dokumen yang ditampilkan (contoh: "Foto Toilet Depan")
        string mimeType; // Tipe file (contoh: "image/jpeg", "image/png")
        uint256 fileSize; // Ukuran file dalam bytes
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    /**
     * @notice Struct untuk menyimpan file gambar aset
     * @dev Mendukung penyimpanan IPFS dengan field ipfsHash dan mimeType
     */
    struct FileAset {
        uint256 fileAsetId;
        uint256 asetId;
        string ipfsHash; // IPFS CID/Hash
        string namaFile; // Nama file asli
        string namaDokumen; // Nama dokumen yang ditampilkan
        string mimeType; // Tipe file (image/jpeg, image/png, image/jpg)
        uint256 fileSize; // Ukuran file dalam bytes
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct AsetStorage {
        // ==================== Storage ====================
        mapping(uint256 => Fasilitas) fasilitasList;
        mapping(uint256 => Aset) asetList;
        mapping(uint256 => FileFasilitas) fileFasilitasList;
        mapping(uint256 => FileAset) fileAsetList;
        //relation (2 domain Out)
        mapping(uint256 => uint256[]) spbuToAsetIds;
        mapping(uint256 => uint256[]) asetToFileAsetIds;
        mapping(uint256 => uint256[]) spbuToFasilitasIds;
        mapping(uint256 => uint256[]) fasilitasToFileFasilitasIds;
        // Get All
        uint256[] allFasilitasIds;
        uint256[] allAsetIds;
        // Counters
        uint256 fasilitasCounter;
        uint256 asetCounter;
        uint256 fileFasilitasCounter;
        uint256 fileAsetCounter;
    }

    // ==================== 6. Domain Inventory ====================
    /**
     * @notice Domain untuk manajemen stok BBM dan inventori
     * @dev Mengelola produk BBM, tangki (dombak), stok, dan pergerakan stok
     *
     * Komponen Utama:
     * - Produk      : Jenis BBM (Pertamax, Pertalite, Solar, dll)
     * - Dombak      : Tangki penyimpanan BBM underground
     * - StokInventory: Catatan stok per produk
     * - DokumenStok : Dokumen pergerakan stok (masuk/keluar/transfer)
     * - Konversi    : Tabel konversi tinggi-volume untuk pengukuran tangki
     * - Losses      : Pencatatan kehilangan stok (evaporasi, kebocoran)
     *
     * SCALED x100: Semua volume (liter) disimpan x100 untuk presisi
     */

    /**
     * @notice Simbol untuk menandai jenis losses
     */
    enum SimbolLosses {
        Lebih, // 0 = Stok aktual lebih dari seharusnya
        Kurang // 1 = Stok aktual kurang dari seharusnya (rugi)
    }

    /**
     * @notice Data produk BBM
     * @param produkId ID unik produk
     * @param spbuId ID SPBU yang menjual produk ini
     * @param namaProduk Nama produk (contoh: "Pertamax", "Pertalite")
     * @param aktif Status keaktifan produk
     * @param oktan Nilai oktan BBM (contoh: 92, 95, 98)
     */

    struct Produk {
        uint256 produkId;
        uint256 spbuId;
        string namaProduk;
        bool aktif;
        uint256 oktan; // 2 digit oktan (contoh: 92, 95, 98)
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct StokInventory {
        uint256 stokInventoryId;
        uint256 produkId;
        uint256 stok; // Float scaled x100 (12.50 liter = 1250)
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct TypeDokumenStok {
        uint256 typeDokumenStokId;
        string typeMovement; // 'Commit Change From User' | 'Good Issue Sales' | 'Good Issue Tera' | 'Good Receive Penerimaan' | 'Good Return Tera' | 'Good Transfer Receive' | 'Good Transfer Send' | 'Loss' | 'Stok Taking' | 'Stok Taking Good Receive Penerimaan' | 'Stok Taking Good Receive Penyesuaian' | 'Stok Taking Good Transfer' | 'Stok Taking Good Transfer Penyesuaian'
        string deskripsi;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Dombak {
        uint256 dombakId;
        uint256 spbuId;
        string namaDombak;
        bool aktif;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct StokInventoryDombak {
        uint256 stokInventoryDombakId;
        uint256 dombakId;
        uint256 stokInventoryId;
        uint256 stok; // Float scaled x100
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct SatuanUkurTinggi {
        uint256 satuanUkurTinggiId;
        string namaSatuan; // "Centimeter", "Meter"
        string singkatan; // "cm", "m"
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct SatuanUkurVolume {
        uint256 satuanUkurVolumeId;
        string namaSatuan; // "Liter", "Kiloliter"
        string singkatan; // "L", "kL"
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Konversi {
        uint256 konversiId;
        uint256 dombakId;
        uint256 satuanUkurTinggiId;
        uint256 satuanUkurVolumeId;
        uint256 tinggi; // Float scaled x100
        uint256 volume; // Float scaled x100
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct DokumenStok {
        uint256 dokumenStokId;
        uint256 stokInventoryId;
        uint256 typeDokumenStokId;
        uint256 jamKerjaId; // Referensi ke kontrak lain
        uint256 dombakId;
        address wallet; // Operator yang mengisi
        uint256 tanggal; // Unix timestamp
        int256 stokAwal; // Float scaled x100 (bisa negatif untuk adjustment)
        int256 stokAkhir; // Float scaled x100
        bool confirmation; // false = pending, true = confirmed by admin
        address confirmedBy; // Admin yang mengkonfirmasi
        uint256 confirmedAt; // Waktu konfirmasi
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct FileDokumenStok {
        uint256 fileDokumenStokId;
        uint256 dokumenStokId;
        string ipfsHash; // IPFS CID
        string namaFile;
        string namaDokumen;
        string mimeType;
        uint256 fileSize;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct DombakTransfer {
        uint256 dombakTransferId;
        uint256 produkId;
        uint256 dombakDariId; // Dombak asal
        uint256 dombakKeId; // Dombak tujuan
        uint256 konversiId; // ID konversi untuk convert tinggi-volume
        uint256 jamKerjaId;
        uint256 tanggal; // Unix timestamp
        uint256 waktu; // Unix timestamp (jam:menit:detik)
        int256 jumlahTransfer; // Float scaled x100
        bool konfirmasi; // false = pending, true = confirmed
        address createdBy; // Operator yang membuat
        address confirmedBy; // Admin yang mengkonfirmasi
        uint256 confirmedAt;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct JenisLosses {
        uint256 jenisLossesId;
        string jenisLosses; // "Evaporasi", "Kebocoran", "Pencurian", dll
        string deskripsi;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Losses {
        uint256 lossesId;
        uint256 jenisLossesId;
        uint256 dokumenStokId;
        uint256 tanggal; // Unix timestamp
        SimbolLosses simbol; // Lebih atau Kurang
        int256 stok; // Float scaled x100
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct PenerimaanStokTaking {
        uint256 penerimaanStokTakingId;
        uint256 penerimaanId;
        uint256 dokumenStokId;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct InventoryStorage {
        // ==================== Storage ====================
        mapping(uint256 => Produk) produkList;
        mapping(uint256 => StokInventory) stokInventoryList;
        mapping(uint256 => TypeDokumenStok) typeDokumenStokList;
        mapping(uint256 => Dombak) dombakList;
        mapping(uint256 => StokInventoryDombak) stokInventoryDombakList;
        mapping(uint256 => SatuanUkurTinggi) satuanUkurTinggiList;
        mapping(uint256 => SatuanUkurVolume) satuanUkurVolumeList;
        mapping(uint256 => Konversi) konversiList;
        mapping(uint256 => DokumenStok) dokumenStokList;
        mapping(uint256 => FileDokumenStok) fileDokumenStokList;
        mapping(uint256 => DombakTransfer) dombakTransferList;
        mapping(uint256 => JenisLosses) jenisLossesList;
        mapping(uint256 => Losses) lossesList;
        mapping(uint256 => PenerimaanStokTaking) penerimaanStokTakingList;
        //Relation
        mapping(uint256 => uint256[]) SpbuToProdukIds;
        mapping(uint256 => uint256) produkToStokInventoryId;
        mapping(uint256 => uint256[]) stokInventoryToStokInventoryDombakIds;
        mapping(uint256 => uint256[]) typeDokumenStokToDokumenStokIds;
        mapping(address => uint256[]) walletToDokumenStokIds;
        mapping(uint256 => uint256[]) jamKerjaToDokumenStokIds;
        mapping(uint256 => uint256[]) dombakToDokumenStokIds;
        mapping(uint256 => uint256[]) dokumenStokToFileDokumenStokIds;
        mapping(uint256 => uint256[]) stokInventoryToDokumenStokIds;
        mapping(uint256 => uint256[]) SpbuToDombakIds;
        mapping(uint256 => uint256[]) dombakToStokInventoryIds;
        mapping(uint256 => uint256[]) dombakToPayungIds;
        mapping(uint256 => uint256[]) payungToDombakIds;
        mapping(uint256 => uint256[]) dombakToKonversiIds;
        mapping(uint256 => uint256[]) satuanUkurTinggiToKonversiIds;
        mapping(uint256 => uint256[]) satuanUkurVolumeToKonversiIds;
        mapping(uint256 => uint256[]) konversiToDokumenStokIds;
        mapping(uint256 => uint256[]) dokumenStokToKonversiIds;
        mapping(uint256 => uint256[]) jenisLossesToLossesIds;
        mapping(uint256 => uint256[]) dokumenStokToLossesIds;
        mapping(uint256 => uint256[]) dokumenStokToDombakTransferIds;
        mapping(uint256 => uint256[]) dombakTransferToDokumenStokIds;
        mapping(uint256 => uint256[]) jamKerjaToDombakTransferIds;
        mapping(uint256 => uint256[]) produkToDombakTransferIds;
        mapping(uint256 => uint256[]) dokumenStokToPenerimaanStokTakingIds;
        mapping(uint256 => uint256[]) penerimaanToPenerimaanStokTakingIds;
        // Get All
        uint256[] produkIds;
        uint256[] stokInventoryIds;
        uint256[] typeDokumenStokIds;
        uint256[] dombakIds;
        uint256[] stokInventoryDombakIds;
        uint256[] satuanUkurTinggiIds;
        uint256[] satuanUkurVolumeIds;
        uint256[] konversiIds;
        uint256[] dokumenStokIds;
        uint256[] fileDokumenStokIds;
        uint256[] dombakTransferIds;
        uint256[] jenisLossesIds;
        uint256[] lossesIds;
        uint256[] penerimaanStokTakingIds;
        // Counters
        uint256 produkCounter;
        uint256 stokInventoryCounter;
        uint256 typeDokumenStokCounter;
        uint256 dombakCounter;
        uint256 stokInventoryDombakCounter;
        uint256 satuanUkurTinggiCounter;
        uint256 satuanUkurVolumeCounter;
        uint256 konversiCounter;
        uint256 dokumenStokCounter;
        uint256 fileDokumenStokCounter;
        uint256 dombakTransferCounter;
        uint256 jenisLossesCounter;
        uint256 lossesCounter;
        uint256 penerimaanStokTakingCounter;
    }

    // ==================== 7. Domain Pengadaan ====================
    /**
     * @notice Domain untuk proses pengadaan/pembelian BBM
     * @dev Mengelola rencana pembelian, approval, pajak, dan pembayaran
     *
     * Alur Pengadaan:
     * 1. RencanaPembelian (draft oleh admin)
     * 2. DetailRencanaPembelian (list produk yang akan dibeli)
     * 3. Approval oleh Direktur
     * 4. PajakPembelian (perhitungan PPN, PPBKB, PPh)
     * 5. Pembayaran (transfer ke supplier)
     * 6. Konfirmasi MS2 (Mandiri Selang 2) dan Delivery
     *
     * Status: Draft -> Pending -> Approved -> Completed / Rejected
     */

    /**
     * @notice Status pembelian
     * @param namaStatus (Draft, Pending, Approved, Rejected, Completed)
     */
    struct StatusPurchase {
        uint256 statusPurchaseId;
        uint256 spbuId;
        string namaStatus; // Draft, Pending, Approved, Rejected, Completed
        string deskripsi;
        bool aktif;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct RencanaPembelian {
        uint256 rencanaPembelianId;
        uint256 spbuId;
        uint256 statusPurchaseId;
        address walletMember;
        uint256 tanggalPembelian;
        string kodePembelian;
        string deskripsi;
        uint256 grandTotal; // scaled x100
        bool konfirmasi;
        address konfirmasiBy;
        uint256 konfirmasiAt;
        string keteranganKonfirmasi;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct DetailRencanaPembelian {
        uint256 detailRencanaPembelianId;
        uint256 rencanaPembelianId;
        uint256 produkId;
        uint256 harga; // scaled x100
        uint256 jumlah; // scaled x100
        uint256 subTotal; // scaled x100
        string satuanJumlah;
        bool konfirmasi;
        address konfirmasiBy;
        uint256 konfirmasiAt;
        bool ms2;
        address ms2By;
        uint256 ms2At;
        bool delivery;
        address deliveryBy;
        uint256 deliveryAt;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct PajakPembelianLib {
        uint256 pajakPembelianLibId;
        uint256 ppn; // scaled x100 (contoh: 11% = 1100)
        uint256 ppbkb; // scaled x100
        uint256 pph; // scaled x100
        bool aktif;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct PajakPembelian {
        uint256 pajakPembelianId;
        uint256 rencanaPembelianId;
        uint256 pajakPembelianLibId;
        uint256 netPrice; // scaled x100
        uint256 ppn; // scaled x100
        uint256 ppbkb; // scaled x100
        uint256 pph; // scaled x100
        uint256 grossPrice; // scaled x100
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Pembayaran {
        uint256 pembayaranId;
        uint256 rencanaPembelianId;
        address walletMember;
        string noCekBg;
        string noRekening;
        string namaRekening;
        string namaBank;
        uint256 totalBayar; // scaled x100
        bool konfirmasiAdmin;
        bool konfirmasiDirektur;
        address konfirmasiByAdmin;
        address konfirmasiByDirektur;
        uint256 konfirmasiAtAdmin;
        uint256 konfirmasiAtDirektur;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct FilePembayaran {
        uint256 filePembayaranId;
        uint256 pembayaranId;
        string ipfsHash;
        string namaFile;
        string namaDokumen;
        string mimeType;
        uint256 fileSize;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct DetailRencanaPembelianFiloLo {
        uint256 detailRencanaPembelianFileLoId;
        uint256 detailRencanaPembelianId;
        uint256 fileLoId;
        uint256 createdAt;
        bool deleted;
    }

    struct PengadaanStorage {
        // ==================== Storage ====================
        mapping(uint256 => StatusPurchase) statusPurchaseList;
        mapping(uint256 => RencanaPembelian) rencanaPembelianList;
        mapping(uint256 => DetailRencanaPembelian) detailRencanaPembelianList;
        mapping(uint256 => PajakPembelianLib) pajakPembelianLibList;
        mapping(uint256 => PajakPembelian) pajakPembelianList;
        mapping(uint256 => Pembayaran) pembayaranList;
        mapping(uint256 => FilePembayaran) filePembayaranList;
        mapping(uint256 => DetailRencanaPembelianFiloLo) detailRencanaPembelianFiloLoList;
        // Relation
        mapping(uint256 => uint256[]) spbuToStatusPurchaseIds;
        mapping(uint256 => uint256[]) statusPurchaseToRencanaPembelianIds;
        mapping(uint256 => uint256[]) spbuToRencanaPembelianIds;
        mapping(address => uint256[]) walletToRencanaPembelianIds;
        mapping(uint256 => uint256[]) rencanaPembelianToPajakPembelianIds;
        mapping(uint256 => uint256[]) pajakPembelianLibToPajakPembelianIds;
        mapping(uint256 => uint256[]) rencanaPembelianToPembayaranIds;
        mapping(uint256 => uint256[]) pembayaranToFilePembayaranIds;
        mapping(address => uint256[]) walletToPembayaranIds;
        mapping(uint256 => uint256[]) rencanaPembelianToDetailRencanaPembelianIds;
        mapping(uint256 => uint256[]) produkToDetailRencanaPembelianIds;
        mapping(uint256 => uint256[]) detailRencanaPembelianToFileLoIds;
        mapping(uint256 => uint256[]) fileLoToDetailRencanaPembelianIds;
        //Accepted
        mapping(address => uint256[]) walletToKonfirmasiRencanaPembelian;
        mapping(address => uint256[]) walletToKonfirmasiDetailRencanaPembelian;
        mapping(address => uint256[]) walletToKonfirmasiDeliveryOnDetailRencanaPembelian;
        mapping(address => uint256[]) walletToKonfirmasiMs2OnDetailRencanaPembelian;
        mapping(address => uint256[]) walletToKonfirmasiAdminPembayaran;
        mapping(address => uint256[]) walletToKonfirmasiDirekturPembayaran;
        // Counters
        uint256 statusPurchaseCounter;
        uint256 rencanaPembelianCounter;
        uint256 detailRencanaPembelianCounter;
        uint256 pajakPembelianLibCounter;
        uint256 pajakPembelianCounter;
        uint256 pembayaranCounter;
        uint256 filePembayaranCounter;
        uint256 detailRencanaPembelianFiloLoCounter;
    }

    // ==================== 8. Domain Logistik ====================
    /**
     * @notice Domain untuk pengiriman dan penerimaan BBM
     * @dev Mengelola proses dari order hingga BBM diterima di SPBU
     *
     * Komponen:
     * - Ms2         : Mandiri Selang 2 (kode pengambilan di depot)
     * - Pengiriman  : Data pengiriman dan tracking
     * - Supir       : Data pengemudi mobil tangki
     * - FileLo      : Loading Order (dokumen pengiriman)
     * - Segel       : Nomor segel pada tangki mobil
     * - Penerimaan  : Konfirmasi BBM diterima di SPBU
     *
     * Alur:
     * MS2 -> Pengiriman -> Supir -> FileLo -> Segel -> Penerimaan
     */

    /**
     * @notice Data MS2 (Mandiri Selang 2)
     * @dev Kode yang didapat dari depot untuk pengambilan BBM
     */
    struct Ms2 {
        uint256 ms2Id;
        address walletMember;
        uint256 tanggal;
        string kodeSms;
        bool konfirmasiSelesai;
        address konfirmasiBy;
        uint256 konfirmasiAt;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Pengiriman {
        uint256 pengirimanId;
        address walletMember;
        uint256 tanggal;
        string noDo;
        string noPolisi;
        string catatan;
        bool ms2;
        address ms2By;
        uint256 ms2At;
        bool konfirmasiPengiriman;
        bool konfirmasiSelesai;
        address konfirmasiPengirimanBy;
        uint256 konfirmasiPengirimanAt;
        address konfirmasiSelesaiBy;
        uint256 konfirmasiSelesaiAt;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Supir {
        uint256 supirId;
        uint256 pengirimanId;
        string namaSupir;
        string noTelp;
        string noSim;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct DetailRencanaPembelianMs2 {
        uint256 detailRencanaPembelianMs2Id;
        uint256 ms2Id;
        uint256 detailRencanaPembelianId;
        uint256 jamKerjaId;
        bool konfirmasiPengiriman;
        address konfirmasiPengirimanBy;
        uint256 konfirmasiPengirimanAt;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct FileLo {
        uint256 fileLoId;
        uint256 pengirimanId;
        uint256 produkId;
        uint256 jumlah; // scaled x100
        string satuanJumlah;
        string noFaktur;
        string noLo;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct FileLampiranFileLo {
        uint256 fileLampiranFileLoId;
        uint256 fileLoId;
        string ipfsHash;
        string namaFile;
        string namaDokumen;
        string mimeType;
        uint256 fileSize;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Segel {
        uint256 segelId;
        uint256 fileLoId;
        string noSegel;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Penerimaan {
        uint256 penerimaanId;
        uint256 fileLoId;
        uint256 dokumenStokId;
        uint256 tanggal;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct FilePenerimaan {
        uint256 filePenerimaanId;
        uint256 penerimaanId;
        string ipfsHash;
        string namaFile;
        string namaDokumen;
        string mimeType;
        uint256 fileSize;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct LogistikStorage {
        // ==================== Storage ====================
        mapping(uint256 => Ms2) ms2List;
        mapping(uint256 => Pengiriman) pengirimanList;
        mapping(uint256 => Supir) supirList;
        mapping(uint256 => DetailRencanaPembelianMs2) detailRencanaPembelianMs2List;
        mapping(uint256 => FileLo) fileLoList;
        mapping(uint256 => FileLampiranFileLo) fileLampiranFileLoList;
        mapping(uint256 => Segel) segelList;
        mapping(uint256 => Penerimaan) penerimaanList;
        mapping(uint256 => FilePenerimaan) filePenerimaanList;
        // Relation
        mapping(uint256 => uint256[]) pengirimanIdToMs2Ids;
        mapping(uint256 => uint256[]) walletToMs2Ids;
        mapping(uint256 => uint256[]) walletToPengirimanIds;
        mapping(uint256 => uint256[]) ms2IdToPengirimanIds;
        mapping(uint256 => uint256[]) detailRencanaPembelianToDetailRencanaPembelianMs2Ids;
        mapping(uint256 => uint256[]) pengirimanIdToSupirIds;
        mapping(uint256 => uint256[]) produkToFileLoIds;
        mapping(uint256 => uint256[]) pengirimanToFileLoIds;
        mapping(uint256 => uint256[]) fileLoIdToSegelIds;
        mapping(uint256 => uint256[]) fileLoIdToPenerimaanIds;
        mapping(uint256 => uint256[]) fileLoIdToFileLampiranFileLoIds;
        mapping(uint256 => uint256[]) penerimaanIdToFilePenerimaanIds;
        // Get All
        uint256[] ms2Ids;
        uint256[] pengirimanIds;
        uint256[] supirIds;
        uint256[] detailRencanaPembelianMs2Ids;
        uint256[] fileLoIds;
        uint256[] fileLampiranFileLoIds;
        uint256[] segelIds;
        uint256[] penerimaanIds;
        uint256[] filePenerimaanIds;
        // Accepted Wallet
        mapping(address => uint256[]) walletToKonfirmasiPengirimanOnDetailRencanaPembelianMs2;
        mapping(address => uint256[]) walletToKonfirmasiSelesaiOnMs2;
        mapping(address => uint256[]) walletToKonfirmasiSelesaiOnPengiriman;
        mapping(address => uint256[]) walletToKonfirmasiPengirimanOnPengiriman;
        mapping(address => uint256[]) walletToKonfirmasiMs2OnPengiriman;
        // Counters
        uint256 ms2Counter;
        uint256 pengirimanCounter;
        uint256 supirCounter;
        uint256 detailRencanaPembelianMs2Counter;
        uint256 fileLoCounter;
        uint256 fileLampiranFileLoCounter;
        uint256 segelCounter;
        uint256 penerimaanCounter;
        uint256 filePenerimaanCounter;
        uint256 pengirimanMs2Counter;
    }

    // ==================== 9. Domain Point of Sales ====================
    /**
     * @notice Domain untuk penjualan BBM dan transaksi harian
     * @dev Mencatat semua transaksi penjualan di pompa BBM
     *
     * Hierarki Peralatan:
     * Payung -> Dispenser -> Nozzle -> StandMeter
     *
     * Komponen:
     * - Payung    : Kanopi/atap pelindung pompa
     * - Dispenser : Mesin pompa BBM
     * - Nozzle    : Selang/pistol pengisian BBM
     * - StandMeter: Pembacaan angka meter pompa
     * - Penjualan : Record transaksi harian
     * - Harga     : Harga jual per shift
     *
     * Alur Penjualan:
     * 1. Baca StandMeter awal shift
     * 2. Hitung selisih = penjualan liter
     * 3. Kalikan dengan Harga = total penjualan
     * 4. Cocokkan dengan uang kotak
     */

    /**
     * @notice Status setoran kasir
     * @param namaStatus (Belum Disetor, Sudah Disetor, Pending)
     */
    struct StatusSetoran {
        uint256 statusSetoranId;
        string namaStatus; // Belum Disetor, Sudah Disetor, Pending
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Harga {
        uint256 hargaId;
        uint256 produkId;
        uint256 jamKerjaId;
        uint256 hargaJual; // scaled x100
        uint256 hargaBeli; // scaled x100
        bool isDefault;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Payung {
        uint256 payungId;
        string namaPayung;
        bool aktif;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Dispenser {
        uint256 dispenserId;
        uint256 payungId;
        string namaDispenser;
        bool aktif;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Nozzle {
        uint256 nozzleId;
        uint256 dispenserId;
        uint256 produkId;
        string namaNozzle;
        bool aktif;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct StandMeter {
        uint256 standMeterId;
        uint256 nozzleId;
        uint256 jamKerjaId;
        uint256 dombakId;
        uint256 tanggal;
        uint256 standMeterAwal; // scaled x100
        uint256 standMeterAkhir; // scaled x100
        bool konfirmasi;
        address konfirmasiBy;
        uint256 konfirmasiAt;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct FileStandMeter {
        uint256 fileStandMeterId;
        uint256 standMeterId;
        string ipfsHash;
        string namaFile;
        string namaDokumen;
        string mimeType;
        uint256 fileSize;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Penjualan {
        uint256 penjualanId;
        uint256 statusSetoranId;
        uint256 produkId;
        uint256 spbuId;
        uint256 nozzleId;
        uint256 jamKerjaId;
        uint256 tanggal;
        uint256 totalUangKotak; // scaled x100
        uint256 totalPenjualan; // scaled x100
        bool verifiedAdmin;
        bool verifiedDirektur;
        address verifiedByAdmin;
        address verifiedByDirektur;
        uint256 verifiedAtAdmin;
        uint256 verifiedAtDirektur;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct DetailPenjualan {
        uint256 detailPenjualanId;
        uint256 penjualanId;
        uint256 standMeterId;
        uint256 hargaId;
        uint256 liter; // scaled x100
        uint256 totalDetailJual; // scaled x100
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct PjOperasionalSetoran {
        uint256 pjOperasionalSetoranId;
        uint256 penjualanId;
        uint256 jabatanId;
        address walletMember;
        uint256 createdAt;
        bool deleted;
    }

    struct PointOfSalesStorage {
        // ==================== Storage ====================
        mapping(uint256 => StatusSetoran) statusSetoranList;
        mapping(uint256 => Harga) hargaList;
        mapping(uint256 => Payung) payungList;
        mapping(uint256 => Dispenser) dispenserList;
        mapping(uint256 => Nozzle) nozzleList;
        mapping(uint256 => StandMeter) standMeterList;
        mapping(uint256 => FileStandMeter) fileStandMeterList;
        mapping(uint256 => Penjualan) penjualanList;
        mapping(uint256 => DetailPenjualan) detailPenjualanList;
        mapping(uint256 => PjOperasionalSetoran) pjOperasionalSetoranList;
        // Relation
        mapping(uint256 => uint256[]) spbuToPayungList;
        mapping(uint256 => uint256[]) payungToDispenserList;
        mapping(uint256 => uint256[]) dispenserToNozzleList;
        mapping(uint256 => uint256[]) produkToNozzleList;
        mapping(uint256 => uint256[]) nozzleToStandMeterList;
        mapping(uint256 => uint256[]) jamKerjaToStandMeterList;
        mapping(uint256 => uint256[]) dombakToStandMeterList;
        mapping(uint256 => uint256[]) standMeterToFileStandMeterList;
        mapping(uint256 => uint256[]) standMeterToDokumenStokList;
        mapping(uint256 => uint256[]) DokumenStokToStandMeterList;
        mapping(uint256 => uint256[]) statusSetoranToPenjualanList;
        mapping(uint256 => uint256[]) spbuToPenjualanList;
        mapping(uint256 => uint256[]) produkToPenjualanList;
        mapping(uint256 => uint256[]) nozzleToPenjualanList;
        mapping(uint256 => uint256[]) jamKerjaToPenjualanList;
        mapping(uint256 => uint256[]) penjualanToDetailPenjualanList;
        mapping(uint256 => uint256[]) standMeterToDetailPenjualanList;
        mapping(uint256 => uint256[]) produkToHargaList;
        mapping(uint256 => uint256[]) jamKerjaToHargaList;
        mapping(uint256 => uint256[]) penjualanToPjOperasionalSetoranList;
        mapping(uint256 => uint256[]) jabatanToPjOperasionalSetoranList;
        mapping(address => uint256[]) walletMemberToPjOperasionalSetoranList;
        //Get All
        uint256[] statusSetoranIds;
        uint256[] hargaIds;
        uint256[] payungIds;
        uint256[] dispenserIds;
        uint256[] nozzleIds;
        uint256[] standMeterIds;
        uint256[] fileStandMeterIds;
        uint256[] penjualanIds;
        uint256[] detailPenjualanIds;
        uint256[] pjOperasionalSetoranIds;
        // Wallet Konfirmasi
        mapping(address => uint256[]) walletToKonfirmasiAdminPenjualan;
        mapping(address => uint256[]) walletToKonfirmasiDirekturPenjualan;
        // Counters
        uint256 statusSetoranCounter;
        uint256 hargaCounter;
        uint256 payungCounter;
        uint256 dispenserCounter;
        uint256 nozzleCounter;
        uint256 standMeterCounter;
        uint256 fileStandMeterCounter;
        uint256 penjualanCounter;
        uint256 detailPenjualanCounter;
        uint256 pjOperasionalSetoranCounter;
        uint256 standMeterDokumenStokCounter;
    }

    // ==================== 10. Domain Keuangan ====================
    /**
     * @notice Domain untuk pengelolaan keuangan SPBU
     * @dev Mencatat petty cash, penarikan dana, dan arus kas
     *
     * Komponen:
     * - PettyCash  : Kas kecil untuk operasional harian
     * - Penarikan  : Penarikan uang hasil penjualan ke bank
     * - PenjualanPenarikan : Relasi penarikan dengan penjualan
     *
     * Jenis Transaksi:
     * - Debit  : Uang masuk (hasil penjualan)
     * - Kredit : Uang keluar (pengeluaran operasional)
     */

    /**
     * @notice Jenis transaksi keuangan
     */
    enum jenisTransaksi {
        Debit, // 0 = Uang masuk
        Kredit // 1 = Uang keluar
    }

    /**
     * @notice Data petty cash (kas kecil)
     * @param spbuId ID SPBU pemilik kas
     * @param noKode Kode transaksi internal
     * @param noBukti Nomor bukti/kwitansi
     * @param total Jumlah uang (scaled x100)
     */

    struct PettyCash {
        uint256 pettyCashId;
        uint256 spbuId;
        string noKode;
        string noBukti;
        string deskripsi;
        uint256 tanggal;
        uint256 total; // scaled x100
        jenisTransaksi jenisTransaksi;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct FilePettyCash {
        uint256 filePettyCashId;
        uint256 pettyCashId;
        string ipfsHash;
        string namaFile;
        string namaDokumen;
        string mimeType;
        uint256 fileSize;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Penarikan {
        uint256 penarikanId;
        uint256 penjualanId;
        address walletMember;
        uint256 tanggal;
        string namaBank;
        string noReferensi;
        string metodeTransfer;
        bool accepted;
        address acceptedBy;
        uint256 acceptedAt;
        uint256 totalUang; // scaled x100
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct FilePenarikan {
        uint256 filePenarikanId;
        uint256 penarikanId;
        string ipfsHash;
        string namaFile;
        string namaDokumen;
        string mimeType;
        uint256 fileSize;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct PenjualanPenarikan {
        uint256 penjualanPenarikanId;
        uint256 penjualanId;
        address walletMember;
        uint256 totalTarikanUang; // scaled x100
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct KeuanganStorage {
        // ==================== Storage ====================
        mapping(uint256 => PettyCash) pettyCashList;
        mapping(uint256 => FilePettyCash) filePettyCashList;
        mapping(uint256 => Penarikan) penarikanList;
        mapping(uint256 => FilePenarikan) filePenarikanList;
        mapping(uint256 => PenjualanPenarikan) penjualanPenarikanList;
        // Relation
        mapping(uint256 => uint256[]) spbuToPettyCashList;
        mapping(uint256 => uint256[]) pettyCashToFilePettyCashList;
        mapping(uint256 => uint256[]) penerimaanToPettyCashList;
        mapping(uint256 => uint256[]) pettyCashToPenerimaanList;
        mapping(uint256 => uint256[]) penarikanToFilePenarikanList;
        mapping(uint256 => uint256[]) penjualanToPenarikanList;
        mapping(address => uint256[]) walletToPenarikanList;
        mapping(uint256 => uint256[]) penjualanToPenjualanPenarikanList;
        mapping(address => uint256[]) walletToPenjualanPenarikanList;
        //Get All
        uint256[] pettyCashIds;
        uint256[] filePettyCashIds;
        uint256[] penarikanIds;
        uint256[] filePenarikanIds;
        uint256[] penjualanPenarikanIds;
        // Wallet Konfirmasi
        mapping(address => uint256[]) walletToAcceptedByOnPenarikanList;
        // Counters
        uint256 pettyCashCounter;
        uint256 filePettyCashCounter;
        uint256 penarikanCounter;
        uint256 filePenarikanCounter;
        uint256 penerimaanPettyCashCounter;
        uint256 penjualanPenarikanCounter;
    }

    // ==================== 11. Domain Attendance ====================
    /**
     * @notice Domain untuk kehadiran dan penjadwalan karyawan
     * @dev Mengelola shift kerja, absensi, dan jadwal karyawan
     *
     * Komponen:
     * - JamKerja       : Definisi shift (Shift 1, 2, 3)
     * - Hari           : Master data hari (Senin-Minggu)
     * - Penjadwalan    : Jadwal kerja per karyawan per hari
     * - Presensi       : Record absensi aktual
     * - StatusPresensi : Status kehadiran (On Time, Terlambat, Sakit, Izin)
     *
     * Alur:
     * 1. Admin buat Penjadwalan untuk karyawan
     * 2. Karyawan scan QR untuk Presensi
     * 3. Sistem hitung keterlambatan otomatis
     */

    /**
     * @notice Status presensi karyawan
     * @param namaStatus (Alpa, Sakit, Terlambat, On Time, Izin)
     */
    struct StatusPresensi {
        uint256 statusPresensiId;
        string namaStatus; // Alpa, Sakit, Terlambat, On Time, Izin
        string deskripsi;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct StatusKehadiran {
        uint256 statusKehadiranId;
        string namaStatus; // Tanpa Keterangan, Dijadwalkan, Sakit, Cuti, Hadir
        string deskripsi;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Hari {
        uint256 hariId;
        string namaHari; // Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu
        bool hariKerja;
        string deskripsi;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct JamKerja {
        uint256 jamKerjaId;
        uint256 spbuId;
        string namaJamKerja; // Shift 1, Shift 2, Shift 3
        uint256 jamDatang; // Unix timestamp untuk waktu datang (hours * 3600 + minutes * 60)
        uint256 jamPulang; // Unix timestamp untuk waktu pulang
        uint256 jamMulaiIstirahat;
        uint256 jamSelesaiIstirahat;
        int256 urutan;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Presensi {
        uint256 presensiId;
        uint256 penjadwalanId;
        uint256 statusPresensiId;
        address walletMember;
        uint256 tanggal;
        uint256 jamDatang; // Unix timestamp waktu absen masuk
        uint256 jamPulang; // Unix timestamp waktu absen pulang (0 jika belum)
        bool verified;
        uint256 terlambat; // Waktu terlambat dalam detik
        address verifiedBy;
        uint256 verifiedAt;
        string keterangan;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct Penjadwalan {
        uint256 penjadwalanId;
        uint256 jamKerjaId;
        uint256 statusKehadiranId;
        address walletMember;
        uint256 tanggal;
        string kodePenjadwalan; // Random string untuk QR Code
        string deskripsi;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct AttendaceStorage {
        // ==================== Storage ====================
        mapping(uint256 => StatusPresensi) statusPresensiList;
        mapping(uint256 => StatusKehadiran) statusKehadiranList;
        mapping(uint256 => Hari) hariList;
        mapping(uint256 => JamKerja) jamKerjaList;
        mapping(uint256 => Presensi) presensiList;
        mapping(uint256 => Penjadwalan) penjadwalanList;
        // Relation
        mapping(uint256 => uint256[]) spbuToJamKerjaList;
        mapping(uint256 => uint256[]) hariToJamKerjaList;
        mapping(uint256 => uint256[]) jamKerjaToHariList;
        mapping(uint256 => uint256[]) jamKerjaToPresensiList;
        mapping(uint256 => uint256[]) statusPresensiToPresensiList;
        mapping(address => uint256[]) walletToPresensiList;
        mapping(uint256 => uint256[]) statusKehadiranToPenjadwalanList;
        mapping(address => uint256[]) walletToPenjadwalanList;
        mapping(uint256 => uint256[]) jamKerjaToPenjadwalanList;
        mapping(uint256 => uint256[]) penjadwalanToNozzleList;
        mapping(uint256 => uint256[]) nozzleToPenjadwalanList;
        // Wallet Konfirmasi
        mapping(address => uint256[]) walletToAcceptedByOnPenjadwalanList;
        // Get All
        uint256[] statusPresensiIds;
        uint256[] statusKehadiranIds;
        uint256[] hariIds;
        uint256[] jamKerjaIds;
        uint256[] presensiIds;
        uint256[] penjadwalanIds;
        // Counters
        uint256 statusPresensiCounter;
        uint256 statusKehadiranCounter;
        uint256 hariCounter;
        uint256 jamKerjaCounter;
        uint256 presensiCounter;
        uint256 penjadwalanCounter;
        uint256 hariJamKerjaCounter;
        uint256 penjadwalanNozzleCounter;
    }

    // ==================== 12. Domain Quality Control ====================
    /**
     * @notice Domain untuk tera dan kalibrasi dispenser SPBU
     * @dev Mencatat proses tera wajib tahunan oleh Metrologi
     *
     * Tera adalah proses kalibrasi dispenser oleh Dinas Metrologi
     * untuk memastikan akurasi pengukuran BBM
     *
     * Komponen:
     * - Tera       : Data tera per SPBU
     * - DetailTera : Detail per dispenser/dombak yang ditera
     * - TeraReturn : Pengembalian alat tera (jika ada peminjaman)
     *
     * Biaya tera dicatat sebagai pengeluaran di PettyCash
     */

    /**
     * @notice Data tera dispenser
     * @param teraId ID unik tera
     * @param spbuId ID SPBU yang ditera
     * @param noKode Nomor kode tera
     * @param noBukti Nomor bukti/sertifikat
     * @param grandTotal Total biaya tera (scaled x100)
     */
    struct Tera {
        uint256 teraId;
        uint256 spbuId;
        string noKode;
        string noBukti;
        uint256 tanggal;
        uint256 grandTotal; // scaled x100
        string keterangan;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct DetailTera {
        uint256 detailTeraId;
        uint256 teraId;
        uint256 dokumenStokId;
        uint256 dombakId;
        uint256 quantity; // scaled x100
        uint256 harga; // scaled x100
        string keterangan;
        uint256 createdAt;
        uint256 updatedAt;
        bool deleted;
    }

    struct TeraReturn {
        uint256 teraReturnId;
        uint256 dariTeraId; // tera peminjaman asal
        uint256 keTeraId; // tera pengembalian baru
        uint256 createdAt;
        bool deleted;
    }

    struct QualityControlStorage {
        // ==================== Storage ====================
        mapping(uint256 => Tera) teraList;
        mapping(uint256 => DetailTera) detailTeraList;
        mapping(uint256 => TeraReturn) teraReturnList;
        // Relation
        mapping(uint256 => uint256[]) teraToDetailTeraList;
        mapping(uint256 => uint256[]) teraToPettyCashList;
        mapping(uint256 => uint256[]) pettyCashToTeraList;
        mapping(uint256 => uint256[]) dokumenStokToDetailTeraList;
        mapping(uint256 => uint256[]) teraToTeraReturnDariList;
        mapping(uint256 => uint256[]) teraToTeraReturnKeList;
        // Get All
        uint256[] teraIds;
        uint256[] detailTeraIds;
        uint256[] teraReturnIds;
        // Counters
        uint256 teraCounter;
        uint256 detailTeraCounter;
        uint256 teraReturnCounter;
    }

    // ============================================================================
    //                    DIAMOND STORAGE - ACCESS CONTROL
    // ============================================================================
    // Bagian ini ditambahkan untuk mendukung Diamond Pattern (ERC-2535)
    // AccessControlStorage menyimpan mapping role-based access control (RBAC)
    // ============================================================================

    /**
     * @notice Storage untuk Role-Based Access Control (RBAC)
     * @dev Menyimpan mapping role => address => hasRole
     */
    struct AccessControlStorage {
        // Mapping: role => account => hasRole
        mapping(bytes32 => mapping(address => bool)) roles;
    }

    // ============================================================================
    //                    DIAMOND STORAGE GETTER FUNCTIONS
    // ============================================================================
    // Fungsi-fungsi ini menggunakan Diamond Storage Pattern
    // Setiap domain memiliki slot unik berdasarkan keccak256 hash
    // Ini memungkinkan facets mengakses storage yang sama melalui delegatecall
    // ============================================================================

    // Storage slot positions (Diamond Storage Pattern)
    bytes32 constant ACCESS_CONTROL_POSITION =
        keccak256("spbu.storage.accessControl");
    bytes32 constant IDENTITY_POSITION = keccak256("spbu.storage.identity");
    bytes32 constant ORG_POSITION = keccak256("spbu.storage.organization");
    bytes32 constant HC_POSITION = keccak256("spbu.storage.humanCapital");
    bytes32 constant ASET_POSITION = keccak256("spbu.storage.asetManagement");
    bytes32 constant INVENTORY_POSITION = keccak256("spbu.storage.inventory");
    bytes32 constant PENGADAAN_POSITION = keccak256("spbu.storage.pengadaan");
    bytes32 constant LOGISTIK_POSITION = keccak256("spbu.storage.logistik");
    bytes32 constant POS_POSITION = keccak256("spbu.storage.pointOfSales");
    bytes32 constant KEUANGAN_POSITION = keccak256("spbu.storage.keuangan");
    bytes32 constant ATTENDANCE_POSITION = keccak256("spbu.storage.attendance");
    bytes32 constant QC_POSITION = keccak256("spbu.storage.qualityControl");

    /**
     * @notice Get AccessControl storage
     */
    function accessControlStorage()
        internal
        pure
        returns (AccessControlStorage storage s)
    {
        bytes32 position = ACCESS_CONTROL_POSITION;
        assembly {
            s.slot := position
        }
    }

    /**
     * @notice Get Identity storage
     */
    function identityStorage()
        internal
        pure
        returns (IdentityStorage storage s)
    {
        bytes32 position = IDENTITY_POSITION;
        assembly {
            s.slot := position
        }
    }

    /**
     * @notice Get Organization storage
     */
    function orgStorage() internal pure returns (OrganisasiStorage storage s) {
        bytes32 position = ORG_POSITION;
        assembly {
            s.slot := position
        }
    }

    /**
     * @notice Get Human Capital storage
     */
    function hcStorage() internal pure returns (HumanCapitalStorage storage s) {
        bytes32 position = HC_POSITION;
        assembly {
            s.slot := position
        }
    }

    /**
     * @notice Get Asset Management storage
     */
    function asetStorage() internal pure returns (AsetStorage storage s) {
        bytes32 position = ASET_POSITION;
        assembly {
            s.slot := position
        }
    }

    /**
     * @notice Get Inventory storage
     */
    function inventoryStorage()
        internal
        pure
        returns (InventoryStorage storage s)
    {
        bytes32 position = INVENTORY_POSITION;
        assembly {
            s.slot := position
        }
    }

    /**
     * @notice Get Pengadaan storage
     */
    function pengadaanStorage()
        internal
        pure
        returns (PengadaanStorage storage s)
    {
        bytes32 position = PENGADAAN_POSITION;
        assembly {
            s.slot := position
        }
    }

    /**
     * @notice Get Logistik storage
     */
    function logistikStorage()
        internal
        pure
        returns (LogistikStorage storage s)
    {
        bytes32 position = LOGISTIK_POSITION;
        assembly {
            s.slot := position
        }
    }

    /**
     * @notice Get Point of Sales storage
     */
    function posStorage()
        internal
        pure
        returns (PointOfSalesStorage storage s)
    {
        bytes32 position = POS_POSITION;
        assembly {
            s.slot := position
        }
    }

    /**
     * @notice Get Keuangan storage
     */
    function keuanganStorage()
        internal
        pure
        returns (KeuanganStorage storage s)
    {
        bytes32 position = KEUANGAN_POSITION;
        assembly {
            s.slot := position
        }
    }

    /**
     * @notice Get Attendance storage
     */
    function attendanceStorage()
        internal
        pure
        returns (AttendaceStorage storage s)
    {
        bytes32 position = ATTENDANCE_POSITION;
        assembly {
            s.slot := position
        }
    }

    /**
     * @notice Get Quality Control storage
     */
    function qcStorage()
        internal
        pure
        returns (QualityControlStorage storage s)
    {
        bytes32 position = QC_POSITION;
        assembly {
            s.slot := position
        }
    }
}
