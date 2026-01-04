/**
 * TypeScript Type Definitions for SPBU Management Diamond Contract
 * Auto-generated from AppStorage.sol struct definitions
 * 
 * All numeric values from Solidity are returned as bigint in TypeScript
 * Scaled values (marked as x100) need to be divided by 100 for actual value
 */

// ============================================================================
// ENUMS
// ============================================================================

/** Gender enum - 0 = Pria, 1 = Wanita */
export enum Gender {
    Pria = 0,
    Wanita = 1,
}

/** Jenis komponen gaji - 0 = Tambah, 1 = Kurang */
export enum JenisGaji {
    Tambah = 0,  // Menambah gaji (tunjangan, bonus)
    Kurang = 1,  // Mengurangi gaji (potongan, pajak)
}

/** Simbol losses - 0 = Lebih, 1 = Kurang */
export enum SimbolLosses {
    Lebih = 0,   // Stok aktual lebih dari seharusnya
    Kurang = 1,  // Stok aktual kurang (rugi)
}

/** Jenis transaksi keuangan - 0 = Debit (masuk), 1 = Kredit (keluar) */
export enum JenisTransaksi {
    Debit = 0,   // Uang masuk
    Kredit = 1,  // Uang keluar
}

// ============================================================================
// 1. DOMAIN IDENTITAS
// ============================================================================

export interface StatusMember {
    statusMemberId: bigint;
    namaStatus: string;
    keterangan: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Ktp {
    ktpId: bigint;
    statusMemberId: bigint;
    nik: string;
    nama: string;
    gender: Gender;
    tempatLahir: string;
    tanggalLahir: bigint;
    verified: boolean;
    walletAddress: `0x${string}`;
    email: string;
    noHp: string;
    noWa: string;
    bergabungSejak: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface AreaMember {
    areaMemberId: bigint;
    ktpId: bigint;
    provinsi: string;
    kabupaten: string;
    kecamatan: string;
    kelurahan: string;
    alamat: string;
    rw: string;
    rt: string;
    no: string;
    kodePos: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Notifikasi {
    notifikasiId: bigint;
    judul: string;
    konten: string;
    read: boolean;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// ============================================================================
// 2. DOMAIN ORGANISASI
// ============================================================================

export interface Spbu {
    spbuId: bigint;
    namaSpbu: string;
    nomorSpbu: string;
    tanggalPendirian: bigint;
    alamat: string;
    luasLahan: bigint;
    satuanLuas: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Divisi {
    divisiId: bigint;
    spbuId: bigint;
    namaDivisi: string;
    keterangan: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Level {
    levelId: bigint;
    divisiId: bigint;
    namaLevel: string;
    keterangan: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Jabatan {
    jabatanId: bigint;
    levelId: bigint;
    namaJabatan: string;
    keterangan: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// ============================================================================
// 3. DOMAIN HUMAN CAPITAL
// ============================================================================

export interface Gaji {
    gajiId: bigint;
    jabatanId: bigint;
    keterangan: string;
    jumlah: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface GajiWallet {
    gajiWalletId: bigint;
    gajiId: bigint;
    wallet: `0x${string}`;
    tanggalGaji: bigint;
    totalGajiBersih: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface DetailGaji {
    detailGajiId: bigint;
    gajiWalletId: bigint;
    namaGaji: string;
    jenis: JenisGaji;
    jumlahUang: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Bonus {
    bonusId: bigint;
    detailGajiId: bigint;
    persentase: bigint;
    totalBonus: bigint;
    deskripsi: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// ============================================================================
// 4. DOMAIN ASET
// ============================================================================

export interface Fasilitas {
    fasilitasId: bigint;
    spbuId: bigint;
    nama: string;
    keterangan: string;
    jumlah: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Aset {
    asetId: bigint;
    spbuId: bigint;
    nama: string;
    keterangan: string;
    jumlah: bigint;
    harga: bigint;
    penyusutanPerHari: bigint;
    digunakan: boolean;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface FileFasilitas {
    fileFasilitasId: bigint;
    fasilitasId: bigint;
    ipfsHash: string;
    namaFile: string;
    namaDokumen: string;
    mimeType: string;
    fileSize: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface FileAset {
    fileAsetId: bigint;
    asetId: bigint;
    ipfsHash: string;
    namaFile: string;
    namaDokumen: string;
    mimeType: string;
    fileSize: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// ============================================================================
// 5. DOMAIN INVENTORY
// ============================================================================

export interface Produk {
    produkId: bigint;
    spbuId: bigint;
    namaProduk: string;
    aktif: boolean;
    oktan: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface StokInventory {
    stokInventoryId: bigint;
    produkId: bigint;
    stok: bigint; // scaled x100
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface TypeDokumenStok {
    typeDokumenStokId: bigint;
    typeMovement: string;
    deskripsi: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Dombak {
    dombakId: bigint;
    spbuId: bigint;
    namaDombak: string;
    aktif: boolean;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface StokInventoryDombak {
    stokInventoryDombakId: bigint;
    dombakId: bigint;
    stokInventoryId: bigint;
    stok: bigint; // scaled x100
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface SatuanUkurTinggi {
    satuanUkurTinggiId: bigint;
    namaSatuan: string;
    singkatan: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface SatuanUkurVolume {
    satuanUkurVolumeId: bigint;
    namaSatuan: string;
    singkatan: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Konversi {
    konversiId: bigint;
    dombakId: bigint;
    satuanUkurTinggiId: bigint;
    satuanUkurVolumeId: bigint;
    tinggi: bigint; // scaled x100
    volume: bigint; // scaled x100
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface DokumenStok {
    dokumenStokId: bigint;
    stokInventoryId: bigint;
    typeDokumenStokId: bigint;
    jamKerjaId: bigint;
    dombakId: bigint;
    wallet: `0x${string}`;
    tanggal: bigint;
    stokAwal: bigint; // scaled x100
    stokAkhir: bigint; // scaled x100
    confirmation: boolean;
    confirmedBy: `0x${string}`;
    confirmedAt: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface FileDokumenStok {
    fileDokumenStokId: bigint;
    dokumenStokId: bigint;
    ipfsHash: string;
    namaFile: string;
    namaDokumen: string;
    mimeType: string;
    fileSize: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface DombakTransfer {
    dombakTransferId: bigint;
    produkId: bigint;
    dombakDariId: bigint;
    dombakKeId: bigint;
    konversiId: bigint;
    jamKerjaId: bigint;
    tanggal: bigint;
    waktu: bigint;
    jumlahTransfer: bigint; // scaled x100
    konfirmasi: boolean;
    createdBy: `0x${string}`;
    confirmedBy: `0x${string}`;
    confirmedAt: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface JenisLosses {
    jenisLossesId: bigint;
    jenisLosses: string;
    deskripsi: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Losses {
    lossesId: bigint;
    jenisLossesId: bigint;
    dokumenStokId: bigint;
    tanggal: bigint;
    simbol: SimbolLosses;
    stok: bigint; // scaled x100
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface PenerimaanStokTaking {
    penerimaanStokTakingId: bigint;
    penerimaanId: bigint;
    dokumenStokId: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// ============================================================================
// 6. DOMAIN PENGADAAN
// ============================================================================

export interface StatusPurchase {
    statusPurchaseId: bigint;
    spbuId: bigint;
    namaStatus: string;
    deskripsi: string;
    aktif: boolean;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface RencanaPembelian {
    rencanaPembelianId: bigint;
    spbuId: bigint;
    statusPurchaseId: bigint;
    walletMember: `0x${string}`;
    tanggalPembelian: bigint;
    kodePembelian: string;
    deskripsi: string;
    grandTotal: bigint; // scaled x100
    konfirmasi: boolean;
    konfirmasiBy: `0x${string}`;
    konfirmasiAt: bigint;
    keteranganKonfirmasi: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface DetailRencanaPembelian {
    detailRencanaPembelianId: bigint;
    rencanaPembelianId: bigint;
    produkId: bigint;
    harga: bigint; // scaled x100
    jumlah: bigint; // scaled x100
    subTotal: bigint; // scaled x100
    satuanJumlah: string;
    konfirmasi: boolean;
    konfirmasiBy: `0x${string}`;
    konfirmasiAt: bigint;
    ms2: boolean;
    ms2By: `0x${string}`;
    ms2At: bigint;
    delivery: boolean;
    deliveryBy: `0x${string}`;
    deliveryAt: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface PajakPembelianLib {
    pajakPembelianLibId: bigint;
    ppn: bigint; // scaled x100
    ppbkb: bigint; // scaled x100
    pph: bigint; // scaled x100
    aktif: boolean;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface PajakPembelian {
    pajakPembelianId: bigint;
    rencanaPembelianId: bigint;
    pajakPembelianLibId: bigint;
    netPrice: bigint; // scaled x100
    ppn: bigint; // scaled x100
    ppbkb: bigint; // scaled x100
    pph: bigint; // scaled x100
    grossPrice: bigint; // scaled x100
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Pembayaran {
    pembayaranId: bigint;
    rencanaPembelianId: bigint;
    walletMember: `0x${string}`;
    noCekBg: string;
    noRekening: string;
    namaRekening: string;
    namaBank: string;
    totalBayar: bigint; // scaled x100
    konfirmasiAdmin: boolean;
    konfirmasiDirektur: boolean;
    konfirmasiByAdmin: `0x${string}`;
    konfirmasiByDirektur: `0x${string}`;
    konfirmasiAtAdmin: bigint;
    konfirmasiAtDirektur: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface FilePembayaran {
    filePembayaranId: bigint;
    pembayaranId: bigint;
    ipfsHash: string;
    namaFile: string;
    namaDokumen: string;
    mimeType: string;
    fileSize: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface DetailRencanaPembelianFiloLo {
    detailRencanaPembelianFileLoId: bigint;
    detailRencanaPembelianId: bigint;
    fileLoId: bigint;
    createdAt: bigint;
    deleted: boolean;
}

// ============================================================================
// 7. DOMAIN LOGISTIK
// ============================================================================

export interface Ms2 {
    ms2Id: bigint;
    walletMember: `0x${string}`;
    tanggal: bigint;
    kodeSms: string;
    konfirmasiSelesai: boolean;
    konfirmasiBy: `0x${string}`;
    konfirmasiAt: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Pengiriman {
    pengirimanId: bigint;
    walletMember: `0x${string}`;
    tanggal: bigint;
    noDo: string;
    noPolisi: string;
    catatan: string;
    ms2: boolean;
    ms2By: `0x${string}`;
    ms2At: bigint;
    konfirmasiPengiriman: boolean;
    konfirmasiSelesai: boolean;
    konfirmasiPengirimanBy: `0x${string}`;
    konfirmasiPengirimanAt: bigint;
    konfirmasiSelesaiBy: `0x${string}`;
    konfirmasiSelesaiAt: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Supir {
    supirId: bigint;
    pengirimanId: bigint;
    namaSupir: string;
    noTelp: string;
    noSim: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface DetailRencanaPembelianMs2 {
    detailRencanaPembelianMs2Id: bigint;
    ms2Id: bigint;
    detailRencanaPembelianId: bigint;
    jamKerjaId: bigint;
    konfirmasiPengiriman: boolean;
    konfirmasiPengirimanBy: `0x${string}`;
    konfirmasiPengirimanAt: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface FileLo {
    fileLoId: bigint;
    pengirimanId: bigint;
    produkId: bigint;
    jumlah: bigint; // scaled x100
    satuanJumlah: string;
    noFaktur: string;
    noLo: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface FileLampiranFileLo {
    fileLampiranFileLoId: bigint;
    fileLoId: bigint;
    ipfsHash: string;
    namaFile: string;
    namaDokumen: string;
    mimeType: string;
    fileSize: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Segel {
    segelId: bigint;
    fileLoId: bigint;
    noSegel: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Penerimaan {
    penerimaanId: bigint;
    fileLoId: bigint;
    dokumenStokId: bigint;
    tanggal: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface FilePenerimaan {
    filePenerimaanId: bigint;
    penerimaanId: bigint;
    ipfsHash: string;
    namaFile: string;
    namaDokumen: string;
    mimeType: string;
    fileSize: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// ============================================================================
// 8. DOMAIN POINT OF SALES
// ============================================================================

export interface StatusSetoran {
    statusSetoranId: bigint;
    namaStatus: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Harga {
    hargaId: bigint;
    produkId: bigint;
    jamKerjaId: bigint;
    hargaJual: bigint; // scaled x100
    hargaBeli: bigint; // scaled x100
    isDefault: boolean;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Payung {
    payungId: bigint;
    namaPayung: string;
    aktif: boolean;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Dispenser {
    dispenserId: bigint;
    payungId: bigint;
    namaDispenser: string;
    aktif: boolean;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Nozzle {
    nozzleId: bigint;
    dispenserId: bigint;
    produkId: bigint;
    namaNozzle: string;
    aktif: boolean;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface StandMeter {
    standMeterId: bigint;
    nozzleId: bigint;
    jamKerjaId: bigint;
    dombakId: bigint;
    tanggal: bigint;
    standMeterAwal: bigint; // scaled x100
    standMeterAkhir: bigint; // scaled x100
    konfirmasi: boolean;
    konfirmasiBy: `0x${string}`;
    konfirmasiAt: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface FileStandMeter {
    fileStandMeterId: bigint;
    standMeterId: bigint;
    ipfsHash: string;
    namaFile: string;
    namaDokumen: string;
    mimeType: string;
    fileSize: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Penjualan {
    penjualanId: bigint;
    statusSetoranId: bigint;
    produkId: bigint;
    spbuId: bigint;
    nozzleId: bigint;
    jamKerjaId: bigint;
    tanggal: bigint;
    totalUangKotak: bigint; // scaled x100
    totalPenjualan: bigint; // scaled x100
    verifiedAdmin: boolean;
    verifiedDirektur: boolean;
    verifiedByAdmin: `0x${string}`;
    verifiedByDirektur: `0x${string}`;
    verifiedAtAdmin: bigint;
    verifiedAtDirektur: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface DetailPenjualan {
    detailPenjualanId: bigint;
    penjualanId: bigint;
    standMeterId: bigint;
    hargaId: bigint;
    liter: bigint; // scaled x100
    totalDetailJual: bigint; // scaled x100
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface PjOperasionalSetoran {
    pjOperasionalSetoranId: bigint;
    penjualanId: bigint;
    jabatanId: bigint;
    walletMember: `0x${string}`;
    createdAt: bigint;
    deleted: boolean;
}

// ============================================================================
// 9. DOMAIN ATTENDANCE (from AttendanceFacet splits)
// ============================================================================

export interface StatusPresensi {
    statusPresensiId: bigint;
    namaStatus: string;
    deskripsi: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface StatusKehadiran {
    statusKehadiranId: bigint;
    namaStatus: string;
    deskripsi: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Hari {
    hariId: bigint;
    namaHari: string;
    hariKerja: boolean;
    deskripsi: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface JamKerja {
    jamKerjaId: bigint;
    spbuId: bigint;
    namaJamKerja: string;
    jamDatang: bigint;
    jamPulang: bigint;
    jamMulaiIstirahat: bigint;
    jamSelesaiIstirahat: bigint;
    urutan: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Penjadwalan {
    penjadwalanId: bigint;
    jamKerjaId: bigint;
    statusKehadiranId: bigint;
    walletMember: `0x${string}`;
    tanggal: bigint;
    kodePenjadwalan: string;
    deskripsi: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Presensi {
    presensiId: bigint;
    penjadwalanId: bigint;
    statusPresensiId: bigint;
    walletMember: `0x${string}`;
    tanggal: bigint;
    jamDatang: bigint;
    jamPulang: bigint;
    verified: boolean;
    terlambat: bigint;
    verifiedBy: `0x${string}`;
    verifiedAt: bigint;
    keterangan: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// ============================================================================
// 10. DOMAIN KEUANGAN (FINANCE)
// ============================================================================

export interface PettyCash {
    pettyCashId: bigint;
    spbuId: bigint;
    noKode: string;
    noBukti: string;
    deskripsi: string;
    tanggal: bigint;
    total: bigint; // scaled x100
    jenisTransaksi: JenisTransaksi;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface FilePettyCash {
    filePettyCashId: bigint;
    pettyCashId: bigint;
    ipfsHash: string;
    namaFile: string;
    namaDokumen: string;
    mimeType: string;
    fileSize: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface Penarikan {
    penarikanId: bigint;
    penjualanId: bigint;
    walletMember: `0x${string}`;
    tanggal: bigint;
    namaBank: string;
    noReferensi: string;
    metodeTransfer: string;
    accepted: boolean;
    acceptedBy: `0x${string}`;
    acceptedAt: bigint;
    totalUang: bigint; // scaled x100
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface FilePenarikan {
    filePenarikanId: bigint;
    penarikanId: bigint;
    ipfsHash: string;
    namaFile: string;
    namaDokumen: string;
    mimeType: string;
    fileSize: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface PenjualanPenarikan {
    penjualanPenarikanId: bigint;
    penjualanId: bigint;
    walletMember: `0x${string}`;
    totalTarikanUang: bigint; // scaled x100
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// ============================================================================
// 11. DOMAIN QUALITY CONTROL
// ============================================================================

export interface Tera {
    teraId: bigint;
    spbuId: bigint;
    noKode: string;
    noBukti: string;
    tanggal: bigint;
    grandTotal: bigint; // scaled x100
    keterangan: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface DetailTera {
    detailTeraId: bigint;
    teraId: bigint;
    dokumenStokId: bigint;
    dombakId: bigint;
    quantity: bigint; // scaled x100
    harga: bigint; // scaled x100
    keterangan: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

export interface TeraReturn {
    teraReturnId: bigint;
    dariTeraId: bigint;
    keTeraId: bigint;
    createdAt: bigint;
    deleted: boolean;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/** Pagination result wrapper */
export interface PaginatedResult<T> {
    result: T[];
    total: bigint;
}

/** Common file struct for all IPFS files */
export interface BaseFile {
    ipfsHash: string;
    namaFile: string;
    namaDokumen: string;
    mimeType: string;
    fileSize: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/** Convert scaled x100 bigint to actual number */
export const fromScaled = (value: bigint): number => Number(value) / 100;

/** Convert number to scaled x100 bigint */
export const toScaled = (value: number): bigint => BigInt(Math.round(value * 100));

/** Convert Unix timestamp bigint to Date */
export const toDate = (timestamp: bigint): Date => new Date(Number(timestamp) * 1000);

/** Convert Date to Unix timestamp bigint */
export const toTimestamp = (date: Date): bigint => BigInt(Math.floor(date.getTime() / 1000));
