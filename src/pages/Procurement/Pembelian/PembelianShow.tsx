'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import { simulateContract, writeContract } from '@wagmi/core';
import {
    ShoppingCart, ArrowLeft, Hash, Calendar, User, Package,
    AlertCircle, Loader2, Droplet, FileText, Info, Edit3,
    Receipt, Percent, DollarSign, Calculator, CheckCircle2,
    Send, X
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { config } from '@/config/wagmi';

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

export default function PembelianShow() {
    const navigate = useNavigate();
    const { pembelianId } = useParams<{ pembelianId: string }>();
    const rencanaPembelianId = pembelianId ? parseInt(pembelianId, 10) : 0;
    const isValidId = !isNaN(rencanaPembelianId) && rencanaPembelianId > 0;

    // Modal and confirmation states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmSuccess, setConfirmSuccess] = useState(false);
    const [confirmError, setConfirmError] = useState<string | null>(null);

    // Fetch main rencana data
    const { data: rencanaPembelianResponse, isLoading: isLoadingMain, error } = useReadContract({
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

    const rencanaPembelian = rencanaPembelianResponse as BlockchainRencanaPembelian | undefined;
    const rincianList = rincianResponse as BlockchainDetailRencanaPembelianView[] | undefined;

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

    // Check if already in Pembayaran status
    const isAlreadyPembayaran = useMemo(() => {
        if (!statusPurchase) return false;
        return statusPurchase.namaStatus === 'Pembayaran';
    }, [statusPurchase]);

    // Handle confirmation to pembayaran
    const handleConfirmToPembayaran = async () => {
        setIsConfirming(true);
        setConfirmError(null);

        try {
            const { request } = await simulateContract(config, {
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'konfirmasiPembelianToPembayaran',
                args: [BigInt(rencanaPembelianId)],
            });

            await writeContract(config, request);
            setConfirmSuccess(true);
        } catch (err: any) {
            console.error('Error:', err);
            setConfirmError(err.message || 'Terjadi kesalahan saat konfirmasi');
        } finally {
            setIsConfirming(false);
        }
    };

    const isLoading = isLoadingMain || isLoadingRincian;

    if (isLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-orange-50/80 dark:bg-slate-900" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">Memuat data...</p>
                </div>
            </div>
        );
    }

    if (error || !rencanaPembelian || rencanaPembelian.rencanaPembelianId === BigInt(0) || rencanaPembelian.deleted) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-orange-50/80 dark:bg-slate-900" />
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
                            Pembelian dengan ID {pembelianId} tidak ditemukan atau sudah dihapus.
                        </p>
                        <motion.button
                            onClick={() => navigate('/procurement/pembelian')}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl"
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
            <div className="absolute inset-0 bg-orange-50/80 dark:bg-slate-900" />

            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-orange-400/20 to-amber-400/20 dark:from-orange-600/30 dark:to-amber-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/procurement/pembelian')}
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
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500" />

                    <div className="relative z-10 p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                >
                                    <ShoppingCart className="w-8 h-8 text-white" />
                                </motion.div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                                        {rencanaPembelian.kodePembelian}
                                    </h1>
                                    <p className="text-white/80 mt-1">
                                        Detail Pembelian
                                    </p>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="px-4 py-2 rounded-full backdrop-blur-md border bg-yellow-500/20 border-yellow-300/50 text-yellow-100">
                                <span className="flex items-center gap-2">
                                    <Receipt className="w-4 h-4" />
                                    Menunggu Konfirmasi Harga
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
                            <Info className="w-5 h-5 text-orange-500" />
                            Informasi Umum
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* ID */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                    <Hash className="w-4 h-4 text-orange-600 dark:text-orange-400" />
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
                                                <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-lg">
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

                {/* Action Buttons */}
                <motion.div
                    className="flex flex-col sm:flex-row gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <motion.button
                        onClick={() => navigate(`/procurement/pembelian/${pembelianId}/edit`)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Edit3 className="w-5 h-5" />
                        Ubah Data Harga
                    </motion.button>
                    <motion.button
                        onClick={() => setShowConfirmModal(true)}
                        disabled={isAlreadyPembayaran}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl shadow-lg transition-all ${isAlreadyPembayaran
                            ? 'bg-emerald-500 text-white cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/30'
                            }`}
                        whileHover={{ scale: isAlreadyPembayaran ? 1 : 1.02, y: isAlreadyPembayaran ? 0 : -2 }}
                        whileTap={{ scale: isAlreadyPembayaran ? 1 : 0.98 }}
                    >
                        {isAlreadyPembayaran ? (
                            <>
                                <CheckCircle2 className="w-5 h-5" />
                                Sudah Diteruskan ke Pembayaran
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Konfirmasi ke Pembayaran
                            </>
                        )}
                    </motion.button>
                    <motion.button
                        onClick={() => navigate('/procurement/pembelian')}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 font-semibold rounded-xl border border-orange-200 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Kembali ke Daftar
                    </motion.button>
                </motion.div>

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
                                className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-500">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-white/20 rounded-xl">
                                            <Send className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Konfirmasi Pembayaran</h3>
                                            <p className="text-white/80 text-sm">Teruskan ke proses pembayaran</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Body */}
                                <div className="p-6">
                                    {confirmSuccess ? (
                                        <div className="text-center py-4">
                                            <motion.div
                                                className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', damping: 10 }}
                                            >
                                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                            </motion.div>
                                            <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                                                Berhasil!
                                            </h4>
                                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                                Rencana pembelian telah diteruskan ke proses pembayaran.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                                Apakah Anda yakin ingin meneruskan rencana pembelian <strong className="text-slate-800 dark:text-white">{rencanaPembelian.kodePembelian}</strong> ke proses pembayaran?
                                            </p>
                                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700 mb-4">
                                                <div className="flex items-start gap-2">
                                                    <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                                                    <div className="text-sm text-amber-700 dark:text-amber-300">
                                                        <strong>Perhatian:</strong> Setelah dikonfirmasi, status akan berubah menjadi &quot;Pembayaran&quot; dan tidak dapat dikembalikan.
                                                    </div>
                                                </div>
                                            </div>

                                            {confirmError && (
                                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-500/30 mb-4">
                                                    <p className="text-sm text-red-600 dark:text-red-400">{confirmError}</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Modal Footer */}
                                <div className="p-6 pt-0 flex gap-3">
                                    {confirmSuccess ? (
                                        <motion.button
                                            onClick={() => {
                                                setShowConfirmModal(false);
                                                navigate('/procurement/pembayaran');
                                            }}
                                            className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            Lihat di Pembayaran
                                        </motion.button>
                                    ) : (
                                        <>
                                            <motion.button
                                                onClick={() => setShowConfirmModal(false)}
                                                disabled={isConfirming}
                                                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
                                                whileHover={{ scale: isConfirming ? 1 : 1.02 }}
                                                whileTap={{ scale: isConfirming ? 1 : 0.98 }}
                                            >
                                                <X className="w-4 h-4 inline mr-2" />
                                                Batal
                                            </motion.button>
                                            <motion.button
                                                onClick={handleConfirmToPembayaran}
                                                disabled={isConfirming}
                                                className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl disabled:opacity-50"
                                                whileHover={{ scale: isConfirming ? 1 : 1.02 }}
                                                whileTap={{ scale: isConfirming ? 1 : 0.98 }}
                                            >
                                                {isConfirming ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                                                        Memproses...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 inline mr-2" />
                                                        Ya, Konfirmasi
                                                    </>
                                                )}
                                            </motion.button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
