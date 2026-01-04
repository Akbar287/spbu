import {
    Package, Truck, Warehouse, Scale, Gauge, Receipt,
    FileText, DollarSign, Calendar, Settings, Users, Building, Briefcase,
    Clock, CreditCard, BarChart3, PieChart, TrendingUp, Fuel, Shield,
    Boxes, ClipboardList, Tag, Database,
    UserCircle, Layers, BookOpen, Newspaper, CheckCircle, ArrowUpRight
} from 'lucide-react';
import { MenuCategory, RoleMenuAccessConfig, RoleNamesConfig, RoleType } from '../types/dashboard';

/**
 * Menu Configuration
 * Contains all menu categories, items, and role-based access configuration
 */

// All menu categories with their items
export const allMenuCategories: MenuCategory[] = [
    {
        id: 'data-utama',
        title: 'Data Utama',
        description: 'Kelola data master SPBU seperti aset, fasilitas, produk, dan pegawai',
        icon: Database,
        color: 'from-violet-500 to-purple-600',
        items: [
            { id: 'aset', title: 'Aset', icon: Building, path: '/master/aset', color: 'from-violet-500 to-purple-600' },
            { id: 'fasilitas', title: 'Fasilitas', icon: Layers, path: '/master/fasilitas', color: 'from-violet-500 to-purple-600' },
            { id: 'produk', title: 'Produk', icon: Package, path: '/master/produk', color: 'from-violet-500 to-purple-600' },
            { id: 'harga', title: 'Harga', icon: Tag, path: '/master/harga', color: 'from-violet-500 to-purple-600' },
            { id: 'pegawai', title: 'Pegawai', icon: Users, path: '/master/pegawai', color: 'from-violet-500 to-purple-600' },
            { id: 'dombak', title: 'Dombak', icon: ClipboardList, path: '/master/dombak', color: 'from-violet-500 to-purple-600' },
            { id: 'payung', title: 'Payung', icon: Shield, path: '/master/payung', color: 'from-violet-500 to-purple-600' },
            { id: 'dispenser', title: 'Dispenser', icon: Fuel, path: '/master/dispenser', color: 'from-violet-500 to-purple-600' },
            { id: 'nozzle', title: 'Nozzle', icon: Gauge, path: '/master/nozzle', color: 'from-violet-500 to-purple-600' },
        ],
    },
    {
        id: 'pengadaan',
        title: 'Pengadaan',
        description: 'Manajemen proses pengadaan dari perencanaan hingga pengiriman',
        icon: Truck,
        color: 'from-blue-500 to-cyan-600',
        items: [
            { id: 'perencanaan', title: 'Perencanaan', icon: ClipboardList, path: '/procurement/perencanaan', color: 'from-blue-500 to-cyan-600' },
            { id: 'pembelian', title: 'Pembelian', icon: CreditCard, path: '/procurement/pembelian', color: 'from-blue-500 to-cyan-600' },
            { id: 'pembayaran', title: 'Pembayaran', icon: DollarSign, path: '/procurement/pembayaran', color: 'from-blue-500 to-cyan-600' },
            { id: 'ms2', title: 'MS2', icon: FileText, path: '/procurement/ms2', color: 'from-blue-500 to-cyan-600' },
            { id: 'pengiriman', title: 'Pengiriman', icon: Truck, path: '/procurement/pengiriman', color: 'from-blue-500 to-cyan-600' },
        ],
    },
    {
        id: 'inventory',
        title: 'Inventory',
        description: 'Pemantauan dan pengelolaan stok bahan bakar secara real-time',
        icon: Warehouse,
        color: 'from-emerald-500 to-teal-600',
        items: [
            { id: 'pemantauan-stok', title: 'Pemantauan Stok', icon: BarChart3, path: '/stok/pemantauan-stok', color: 'from-emerald-500 to-teal-600' },
            { id: 'penerimaan-minyak', title: 'Penerimaan Minyak', icon: Fuel, path: '/stok/penerimaan-minyak', color: 'from-emerald-500 to-teal-600' },
            { id: 'stok-taking', title: 'Stok Taking', icon: ClipboardList, path: '/stok/stok-taking', color: 'from-emerald-500 to-teal-600' },
            { id: 'stok-transfer', title: 'Stok Transfer', icon: Boxes, path: '/stok/stok-transfer', color: 'from-emerald-500 to-teal-600' },
            { id: 'stok-summary', title: 'Stok Summary', icon: PieChart, path: '/stok/stok-summary', color: 'from-emerald-500 to-teal-600' },
        ],
    },
    {
        id: 'tera',
        title: 'Tera',
        description: 'Kelola peminjaman dan pengembalian alat tera untuk kalibrasi',
        icon: Scale,
        color: 'from-amber-500 to-orange-600',
        items: [
            { id: 'peminjaman-tera', title: 'Peminjaman Tera', icon: ArrowUpRight, path: '/tera/peminjaman-tera', color: 'from-amber-500 to-orange-600' },
            { id: 'pengembalian-tera', title: 'Pengembalian Tera', icon: CheckCircle, path: '/tera/pengembalian-tera', color: 'from-amber-500 to-orange-600' },
        ],
    },
    {
        id: 'stand-meter',
        title: 'Stand Meter',
        description: 'Pencatatan dan monitoring angka meter dispenser',
        icon: Gauge,
        color: 'from-rose-500 to-pink-600',
        items: [
            { id: 'stand-meter-main', title: 'Stand Meter', icon: Gauge, path: '/stand-meter', color: 'from-rose-500 to-pink-600' },
        ],
    },
    {
        id: 'setoran',
        title: 'Setoran',
        description: 'Manajemen penjualan harian dan setoran ke bank',
        icon: Receipt,
        color: 'from-indigo-500 to-violet-600',
        items: [
            { id: 'open-penjualan', title: 'Open Penjualan', icon: Clock, path: '/setoran/open-penjualan', color: 'from-indigo-500 to-violet-600' },
            { id: 'penitipan-setoran', title: 'Penitipan Setoran', icon: DollarSign, path: '/setoran/penitipan-setoran', color: 'from-indigo-500 to-violet-600' },
            { id: 'closing-penjualan', title: 'Closing Penjualan', icon: CheckCircle, path: '/setoran/closing-penjualan', color: 'from-indigo-500 to-violet-600' },
            { id: 'setoran-bank', title: 'Setoran Bank', icon: Building, path: '/setoran/setoran-bank', color: 'from-indigo-500 to-violet-600' },
        ],
    },
    {
        id: 'artikel',
        title: 'Artikel',
        description: 'Kelola konten berita dan informasi SPBU',
        icon: Newspaper,
        color: 'from-cyan-500 to-blue-600',
        items: [
            { id: 'kategori', title: 'Kategori', icon: Layers, path: '/artikel/kategori', color: 'from-cyan-500 to-blue-600' },
            { id: 'tag', title: 'Tag', icon: Tag, path: '/artikel/tag', color: 'from-cyan-500 to-blue-600' },
            { id: 'post', title: 'Post', icon: FileText, path: '/artikel/post', color: 'from-cyan-500 to-blue-600' },
        ],
    },
    {
        id: 'keuangan',
        title: 'Keuangan',
        description: 'Laporan keuangan, neraca, laba rugi, dan arus kas',
        icon: DollarSign,
        color: 'from-green-500 to-emerald-600',
        items: [
            { id: 'petty-cash', title: 'Petty Cash', icon: CreditCard, path: '/financial/petty-cash', color: 'from-green-500 to-emerald-600' },
            { id: 'rekap-pajak', title: 'Rekap Pajak', icon: FileText, path: '/financial/rekap-pajak', color: 'from-green-500 to-emerald-600' },
            { id: 'margin', title: 'Margin', icon: TrendingUp, path: '/financial/margin', color: 'from-green-500 to-emerald-600' },
            { id: 'laba-rugi', title: 'Laba Rugi', icon: BarChart3, path: '/financial/laba-rugi', color: 'from-green-500 to-emerald-600' },
            { id: 'neraca', title: 'Neraca', icon: Scale, path: '/financial/neraca', color: 'from-green-500 to-emerald-600' },
            { id: 'buku-besar', title: 'Buku Besar', icon: BookOpen, path: '/financial/buku-besar', color: 'from-green-500 to-emerald-600' },
            { id: 'arus-kas', title: 'Arus Kas', icon: TrendingUp, path: '/financial/arus-kas', color: 'from-green-500 to-emerald-600' },
            { id: 'perubahan-modal', title: 'Perubahan Modal', icon: PieChart, path: '/financial/perubahan-modal', color: 'from-green-500 to-emerald-600' },
        ],
    },
    {
        id: 'jadwal-absensi',
        title: 'Jadwal & Absensi',
        description: 'Manajemen jadwal kerja dan absensi pegawai',
        icon: Calendar,
        color: 'from-purple-500 to-indigo-600',
        items: [
            { id: 'jadwal-pegawai', title: 'Jadwal Pegawai', icon: Calendar, path: '/jadwal_absensi/jadwal-pegawai', color: 'from-purple-500 to-indigo-600' },
            { id: 'absensi', title: 'Absensi', icon: UserCircle, path: '/jadwal_absensi/absensi', color: 'from-purple-500 to-indigo-600' },
            { id: 'laporan-rekap', title: 'Laporan Rekap', icon: FileText, path: '/jadwal_absensi/laporan-rekap', color: 'from-purple-500 to-indigo-600' },
        ],
    },
    {
        id: 'konfigurasi',
        title: 'Konfigurasi',
        description: 'Pengaturan sistem, divisi, jabatan, dan parameter kerja',
        icon: Settings,
        color: 'from-slate-500 to-gray-600',
        items: [
            { id: 'spbu', title: 'SPBU', icon: Fuel, path: '/konfigurasi/spbu', color: 'from-slate-500 to-gray-600' },
            { id: 'divisi', title: 'Divisi', icon: Layers, path: '/konfigurasi/divisi', color: 'from-slate-500 to-gray-600' },
            { id: 'level', title: 'Level', icon: BarChart3, path: '/konfigurasi/level', color: 'from-slate-500 to-gray-600' },
            { id: 'jabatan', title: 'Jabatan', icon: Briefcase, path: '/konfigurasi/jabatan', color: 'from-slate-500 to-gray-600' },
            { id: 'pajak', title: 'Pajak', icon: Receipt, path: '/konfigurasi/pajak', color: 'from-slate-500 to-gray-600' },
            { id: 'hari', title: 'Hari', icon: Calendar, path: '/konfigurasi/hari', color: 'from-slate-500 to-gray-600' },
            { id: 'jam-kerja', title: 'Jam Kerja', icon: Clock, path: '/konfigurasi/jam-kerja', color: 'from-slate-500 to-gray-600' },
        ],
    },
];

// Role-based menu access - which categories each role can access
export const roleMenuAccess: RoleMenuAccessConfig = {
    admin: [
        'data-utama', 'pengadaan', 'inventory', 'tera', 'stand-meter', 'setoran', 'artikel', 'keuangan', 'jadwal-absensi', 'konfigurasi'
    ],
    direktur: [
        'pengadaan', 'inventory', 'setoran', 'keuangan', 'jadwal-absensi'
    ],
    komisaris: ['artikel', 'stok-summary'],
    partner: ['artikel', 'stok-summary'],
    operator: [
        'perencanaan', 'penerimaan-minyak', 'stok-taking', 'stok-transfer', 'peminjaman-tera', 'pengembalian-tera', 'stand-meter', 'artikel'
    ],
    security: ['artikel'],
    officeboy: ['artikel'],
};

// Role item-level access (for operators and others with specific item access)
export const roleItemAccess: RoleMenuAccessConfig = {
    admin: [], // Admin has full access via category
    direktur: ['pembayaran', 'ms2', 'pengiriman', 'pemantauan-stok', 'penerimaan-minyak', 'stok-summary'],
    komisaris: ['stok-summary'],
    partner: ['stok-summary'],
    operator: ['perencanaan', 'penerimaan-minyak', 'stok-taking', 'stok-transfer', 'peminjaman-tera', 'pengembalian-tera', 'stand-meter-main'],
    security: [],
    officeboy: [],
};

// Role display names for UI
export const roleNames: RoleNamesConfig = {
    admin: 'Admin',
    direktur: 'Direktur',
    komisaris: 'Komisaris',
    partner: 'Partner',
    operator: 'Operator',
    security: 'Security',
    officeboy: 'Office Boy',
};

// Helper function to map namaJabatan from smart contract to RoleType
export const mapJabatanToRole = (namaJabatan: string): RoleType => {
    const jabatanLower = namaJabatan.toLowerCase().trim();

    if (jabatanLower.includes('admin') || jabatanLower.includes('administrator')) {
        return 'admin';
    } else if (jabatanLower.includes('direktur') || jabatanLower.includes('director')) {
        return 'direktur';
    } else if (jabatanLower.includes('komisaris') || jabatanLower.includes('commissioner')) {
        return 'komisaris';
    } else if (jabatanLower.includes('partner') || jabatanLower.includes('mitra')) {
        return 'partner';
    } else if (jabatanLower.includes('operator') || jabatanLower.includes('kasir') || jabatanLower.includes('spv') || jabatanLower.includes('supervisor')) {
        return 'operator';
    } else if (jabatanLower.includes('security') || jabatanLower.includes('satpam') || jabatanLower.includes('keamanan')) {
        return 'security';
    } else if (jabatanLower.includes('office boy') || jabatanLower.includes('ob') || jabatanLower.includes('cleaning')) {
        return 'officeboy';
    }

    // Default to operator if no match
    return 'operator';
};
