'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import {
    Wallet, ArrowLeft, Hash, Calendar, User, Package,
    AlertCircle, Loader2, Droplet, FileText, Info,
    Receipt, Percent, DollarSign, Calculator, CreditCard, ShieldCheck, ArrowRight
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain interfaces for Jabatan (SSOT for roleHash)
interface BlockchainJabatanWithRole {
    jabatanId: bigint;
    levelId: bigint;
    namaJabatan: string;
    keterangan: string;
    roleHash: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// Blockchain interfaces
interface BlockchainProdukDetailWithHarga {
    detailRencanaPembelianId: bigint;
    namaProduk: string;
    quantity: bigint;
    satuan: string;
    harga: bigint;
    total: bigint;
}

interface BlockchainDetailRencanaPembelianView {
    rencanaPembelianId: bigint;
    kodePembelian: string;
    tanggalPembelian: bigint;
    jumlahTotal: bigint;
    produk: BlockchainProdukDetailWithHarga[];
    pajakPembelianId: bigint;
    ppn: bigint;
    ppbkb: bigint;
    pph: bigint;
    gross: bigint;
    net: bigint;
}

interface BlockchainRencanaPembelian {
    rencanaPembelianId: bigint;
    spbuId: bigint;
    statusPurchaseId: bigint;
    walletMember: string;
    tanggalPembelian: bigint;
    kodePembelian: string;
    deskripsi: string;
    grandTotal: bigint;
    konfirmasi: boolean;
    konfirmasiBy: string;
    konfirmasiAt: bigint;
    keteranganKonfirmasi: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainKtp {
    ktpId: bigint;
    nama: string;
}

interface BlockchainStatusPurchase {
    statusPurchaseId: bigint;
    namaStatus: string;
}

interface BlockchainPembayaran {
    pembayaranId: bigint;
    rencanaPembelianId: bigint;
    totalBayar: bigint;
    konfirmasiAdmin: boolean;
    konfirmasiDirektur: boolean;
    deleted: boolean;
}

// Display interfaces
interface ProdukDetail {
    id: number;
    namaProduk: string;
    quantity: number;
    satuan: string;
    harga: number;
    total: number;
}

interface TaxInfo {
    pajakPembelianId: number;
    net: number;
    ppn: number;
    ppbkb: number;
    pph: number;
    gross: number;
}

// Format functions
const formatTanggal = (date: Date): string => {
    return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
};

const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('id-ID').format(value);
};

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
};

const shortenAddress = (address: string): string => {
    if (!address) return '-';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default function PembayaranShow() {
    const navigate = useNavigate();
    const { address } = useAccount();
    const { rencanaId } = useParams<{ rencanaId: string }>();
    const rencanaPembelianId = rencanaId ? parseInt(rencanaId, 10) : 0;
    const isValidId = !isNaN(rencanaPembelianId) && rencanaPembelianId > 0;

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    // Fetch main rencana data
    const { data: rencanaPembelianResponse, isLoading: isLoadingMain, error, refetch } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getRencanaPembelianById',
        args: [BigInt(isValidId ? rencanaPembelianId : 0)],
        query: { enabled: isValidId }
    });

    // Fetch rincian pembelian details (with harga and tax)
    const { data: rincianResponse, isLoading: isLoadingRincian } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getRincianPembelianDetails',
        args: [BigInt(isValidId ? rencanaPembelianId : 0)],
        query: { enabled: isValidId }
    });

    // Fetch all payments for this rencana
    const { data: pembayaranResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllPembayaran',
        args: [BigInt(0), BigInt(100), BigInt(isValidId ? rencanaPembelianId : 0)],
        query: { enabled: isValidId }
    });

    // Fetch all Jabatan to get roleHash (SSOT)
    const { data: jabatanResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllJabatan',
        args: [BigInt(0), BigInt(100)],
    });

    // Extract admin roleHash from jabatan
    const adminRoleHash = useMemo(() => {
        const EMPTY_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';
        if (!jabatanResponse) return null;

        const [jabatanList] = jabatanResponse as [BlockchainJabatanWithRole[], bigint];
        for (const j of jabatanList) {
            if (j.deleted || !j.roleHash || j.roleHash === EMPTY_HASH) continue;
            if (j.namaJabatan.toLowerCase() === 'admin') return j.roleHash;
        }
        return null;
    }, [jabatanResponse]);

    // Check if user is Admin
    const { data: isAdminResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'hasRole',
        args: [adminRoleHash as `0x${string}`, address as `0x${string}`],
        query: { enabled: !!address && !!adminRoleHash }
    });
    const isAdmin = isAdminResponse as boolean ?? false;

    const rencanaPembelian = rencanaPembelianResponse as BlockchainRencanaPembelian | undefined;
    const rincianList = rincianResponse as BlockchainDetailRencanaPembelianView[] | undefined;
    const pembayaranList = pembayaranResponse as BlockchainPembayaran[] | undefined;

    // Fetch member KTP
    const { data: ktpResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getKtpByWallet',
        args: [rencanaPembelian?.walletMember as `0x${string}`],
        query: { enabled: !!rencanaPembelian?.walletMember }
    });

    const ktp = ktpResponse as BlockchainKtp | undefined;

    // Fetch status purchase
    const { data: statusResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getStatusPurchaseById',
        args: [rencanaPembelian?.statusPurchaseId || BigInt(0)],
        query: { enabled: !!rencanaPembelian?.statusPurchaseId }
    });

    const statusPurchase = statusResponse as BlockchainStatusPurchase | undefined;

    // Write contract
    const { writeContract, isSuccess } = useWriteContract();

    // Handle success
    useEffect(() => {
        if (isSuccess) {
            setIsConfirming(false);
            setShowConfirmModal(false);
            refetch();
        }
    }, [isSuccess, refetch]);

    // Process rincian data
    const { produkList, taxInfo } = useMemo(() => {
        if (!rincianList || rincianList.length === 0) {
            return { produkList: [], taxInfo: null };
        }

        // Get first item for tax info (all items should have same tax)
        const firstItem = rincianList[0];
        const tax: TaxInfo = {
            pajakPembelianId: Number(firstItem.pajakPembelianId),
            net: Number(firstItem.net) / 100,
            ppn: Number(firstItem.ppn) / 100,
            ppbkb: Number(firstItem.ppbkb) / 100,
            pph: Number(firstItem.pph) / 100,
            gross: Number(firstItem.gross) / 100,
        };

        // Collect all products from all rincian items
        const products: ProdukDetail[] = [];
        rincianList.forEach(rincian => {
            rincian.produk.forEach(p => {
                products.push({
                    id: Number(p.detailRencanaPembelianId),
                    namaProduk: p.namaProduk,
                    quantity: Number(p.quantity),
                    satuan: p.satuan,
                    harga: Number(p.harga) / 100,
                    total: Number(p.total) / 100,
                });
            });
        });

        return { produkList: products, taxInfo: tax };
    }, [rincianList]);

    // Calculate payment status
    const paymentStatus = useMemo(() => {
        if (!pembayaranList || !taxInfo) {
            return { totalPaid: 0, remaining: 0, allApproved: false, hasPendingApprovals: false };
        }

        const validPayments = pembayaranList.filter(p => !p.deleted && Number(p.pembayaranId) !== 0);
        const approvedPayments = validPayments.filter(p => p.konfirmasiAdmin && p.konfirmasiDirektur);
        const totalPaid = approvedPayments.reduce((sum, p) => sum + Number(p.totalBayar) / 100, 0);
        const remaining = taxInfo.gross - totalPaid;
        const hasPendingApprovals = validPayments.some(p => !p.konfirmasiAdmin || !p.konfirmasiDirektur);
        const allApproved = validPayments.length > 0 && validPayments.every(p => p.konfirmasiAdmin && p.konfirmasiDirektur);

        return { totalPaid, remaining, allApproved, hasPendingApprovals };
    }, [pembayaranList, taxInfo]);

    // Can confirm to MS2: admin, no remaining bills, all payments approved, still in Pembayaran status
    const canConfirmToMs2 = isAdmin &&
        paymentStatus.remaining <= 0 &&
        paymentStatus.allApproved &&
        statusPurchase?.namaStatus?.toLowerCase() === 'pembayaran';

    const handleConfirmToMs2 = () => {
        if (!rencanaPembelianId) return;
        setIsConfirming(true);
        writeContract({
            address: DIAMOND_ADDRESS as `0x${string}`,
            abi: DIAMOND_ABI,
            functionName: 'konfirmasiStatusPurchasePembayaranToMs2',
            args: [BigInt(rencanaPembelianId)]
        });
    };

    const isLoading = isLoadingMain || isLoadingRincian;

    if (isLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-50/80 dark:bg-slate-900" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">Memuat data...</p>
                </div>
            </div>
        );
    }

    if (error || !rencanaPembelian || rencanaPembelian.rencanaPembelianId === BigInt(0) || rencanaPembelian.deleted) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-50/80 dark:bg-slate-900" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
                    <motion.div
                        className="flex flex-col items-center gap-4 max-w-md text-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Data Tidak Ditemukan</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                            Pembayaran dengan ID {rencanaId} tidak ditemukan atau sudah dihapus.
                        </p>
                        <motion.button
                            onClick={() => navigate('/procurement/pembayaran')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Kembali ke Daftar
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-emerald-50/80 dark:bg-slate-900" />

            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-emerald-400/20 to-teal-400/20 dark:from-emerald-600/30 dark:to-teal-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/procurement/pembayaran')}
                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </motion.button>

                {/* Header Card */}
                <motion.div
                    className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500" />

                    <div className="relative z-10 p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                >
                                    <Wallet className="w-8 h-8 text-white" />
                                </motion.div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                                        {rencanaPembelian.kodePembelian}
                                    </h1>
                                    <p className="text-white/80 mt-1">
                                        Detail Pembayaran
                                    </p>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="px-4 py-2 rounded-full backdrop-blur-md border bg-emerald-500/20 border-emerald-300/50 text-emerald-100">
                                <span className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    {statusPurchase?.namaStatus || 'Pembayaran'}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Info Card */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                    <div className="relative z-10 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-emerald-500" />
                            Informasi Umum
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* ID */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                    <Hash className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">ID</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {Number(rencanaPembelian.rencanaPembelianId)}
                                    </p>
                                </div>
                            </div>

                            {/* Tanggal */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Tanggal Pembelian</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {formatTanggal(new Date(Number(rencanaPembelian.tanggalPembelian) * 1000))}
                                    </p>
                                </div>
                            </div>

                            {/* Diajukan Oleh */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Diajukan Oleh</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {ktp?.nama || shortenAddress(rencanaPembelian.walletMember)}
                                    </p>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {statusPurchase?.namaStatus || '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Deskripsi */}
                        {rencanaPembelian.deskripsi && (
                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Deskripsi</p>
                                <p className="text-slate-700 dark:text-slate-300">{rencanaPembelian.deskripsi}</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Detail Products Card */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                    <div className="relative z-10 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Droplet className="w-5 h-5 text-cyan-500" />
                            Rincian Produk ({produkList.length})
                        </h2>

                        <div className="space-y-3">
                            {produkList.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>Belum ada rincian produk</p>
                                </div>
                            ) : (
                                produkList.map((produk, index) => (
                                    <motion.div
                                        key={produk.id}
                                        className="p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * index }}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl shadow-lg">
                                                    <Droplet className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-800 dark:text-white">
                                                        {produk.namaProduk}
                                                    </h4>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        ID: #{produk.id}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                                <div className="text-center">
                                                    <p className="text-xs text-slate-400">Jumlah</p>
                                                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                                                        {formatNumber(produk.quantity)} {produk.satuan}
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-slate-400">Harga</p>
                                                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                                                        {formatCurrency(produk.harga)}
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-slate-400">Subtotal</p>
                                                    <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                                        {formatCurrency(produk.total)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Tax Summary Card */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-emerald-200/50 dark:border-emerald-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20 backdrop-blur-md" />

                    <div className="relative z-10 p-6">
                        <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300 mb-4 flex items-center gap-2">
                            <Calculator className="w-5 h-5" />
                            Ringkasan Biaya & Pajak
                        </h2>

                        {taxInfo ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {/* Total Bersih (Net) */}
                                <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-emerald-200 dark:border-emerald-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <DollarSign className="w-4 h-4 text-emerald-600" />
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Total Bersih (Net)</p>
                                    </div>
                                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                                        {formatCurrency(taxInfo.net)}
                                    </p>
                                </div>

                                {/* PPN */}
                                <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-blue-200 dark:border-blue-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Percent className="w-4 h-4 text-blue-600" />
                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">PPN</p>
                                    </div>
                                    <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                                        {formatCurrency(taxInfo.ppn)}
                                    </p>
                                </div>

                                {/* PPH */}
                                <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-purple-200 dark:border-purple-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Percent className="w-4 h-4 text-purple-600" />
                                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">PPH</p>
                                    </div>
                                    <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                                        {formatCurrency(taxInfo.pph)}
                                    </p>
                                </div>

                                {/* PPBKB */}
                                <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-orange-200 dark:border-orange-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Percent className="w-4 h-4 text-orange-600" />
                                        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">PPBKB</p>
                                    </div>
                                    <p className="text-xl font-bold text-orange-700 dark:text-orange-300">
                                        {formatCurrency(taxInfo.ppbkb)}
                                    </p>
                                </div>

                                {/* Total Kotor (Gross) - Span 2 columns */}
                                <div className="p-4 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-800/50 dark:to-teal-800/50 rounded-xl border-2 border-emerald-400 dark:border-emerald-500 md:col-span-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                        <p className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">Total Kotor (Gross)</p>
                                    </div>
                                    <p className="text-2xl md:text-3xl font-bold text-emerald-800 dark:text-emerald-200">
                                        {formatCurrency(taxInfo.gross)}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                <Calculator className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Belum ada data pajak</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Payment Progress Card */}
                {taxInfo && (
                    <motion.div
                        className="relative overflow-hidden rounded-2xl border border-blue-200/50 dark:border-blue-700/50 mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-md" />

                        <div className="relative z-10 p-6">
                            <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
                                <Wallet className="w-5 h-5" />
                                Status Pembayaran
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-green-200 dark:border-green-700">
                                    <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Sudah Dibayar</p>
                                    <p className="text-xl font-bold text-green-700 dark:text-green-300">
                                        {formatCurrency(paymentStatus.totalPaid)}
                                    </p>
                                </div>
                                <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-amber-200 dark:border-amber-700">
                                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">Sisa Tagihan</p>
                                    <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
                                        {formatCurrency(Math.max(0, paymentStatus.remaining))}
                                    </p>
                                </div>
                                <div className={`p-4 rounded-xl border ${paymentStatus.allApproved && paymentStatus.remaining <= 0
                                    ? 'bg-emerald-100/50 dark:bg-emerald-800/30 border-emerald-300 dark:border-emerald-600'
                                    : 'bg-amber-100/50 dark:bg-amber-800/30 border-amber-300 dark:border-amber-600'
                                    }`}>
                                    <p className="text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">Status</p>
                                    <p className={`text-lg font-bold ${paymentStatus.allApproved && paymentStatus.remaining <= 0
                                        ? 'text-emerald-700 dark:text-emerald-300'
                                        : 'text-amber-700 dark:text-amber-300'
                                        }`}>
                                        {paymentStatus.remaining <= 0 && paymentStatus.allApproved
                                            ? 'LUNAS'
                                            : paymentStatus.hasPendingApprovals
                                                ? 'MENUNGGU APPROVAL'
                                                : 'BELUM LUNAS'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                    className="flex flex-col sm:flex-row gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <motion.button
                        onClick={() => navigate(`/procurement/pembayaran/${rencanaId}/bayar`)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <CreditCard className="w-5 h-5" />
                        Bayar
                    </motion.button>

                    {/* Confirm to MS2 Button */}
                    {canConfirmToMs2 && (
                        <motion.button
                            onClick={() => setShowConfirmModal(true)}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <ShieldCheck className="w-5 h-5" />
                            Lanjut ke MS2
                            <ArrowRight className="w-4 h-4" />
                        </motion.button>
                    )}

                    <motion.button
                        onClick={() => navigate('/procurement/pembayaran')}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold rounded-xl border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Kembali ke Daftar
                    </motion.button>
                </motion.div>
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {showConfirmModal && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !isConfirming && setShowConfirmModal(false)}
                    >
                        <motion.div
                            className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 text-center">
                                <motion.div
                                    className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.1 }}
                                >
                                    <ArrowRight className="w-8 h-8 text-purple-500" />
                                </motion.div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                    Lanjutkan ke MS2?
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Semua pembayaran sudah lunas dan disetujui. Apakah Anda yakin ingin melanjutkan <strong>{rencanaPembelian.kodePembelian}</strong> ke tahap MS2 (Pengiriman)?
                                </p>
                                <div className="flex gap-3">
                                    <motion.button
                                        onClick={() => setShowConfirmModal(false)}
                                        disabled={isConfirming}
                                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                                        whileHover={{ scale: isConfirming ? 1 : 1.02 }}
                                        whileTap={{ scale: isConfirming ? 1 : 0.98 }}
                                    >
                                        Batal
                                    </motion.button>
                                    <motion.button
                                        onClick={handleConfirmToMs2}
                                        disabled={isConfirming}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/30 disabled:opacity-70"
                                        whileHover={{ scale: isConfirming ? 1 : 1.02 }}
                                        whileTap={{ scale: isConfirming ? 1 : 0.98 }}
                                    >
                                        {isConfirming ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="w-4 h-4" />
                                                Konfirmasi
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
