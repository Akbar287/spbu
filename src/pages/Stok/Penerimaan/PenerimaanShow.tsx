'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import {
    ArrowLeft, Calendar, Building2, User, Truck,
    AlertCircle, Loader2, Droplet, FileText, Info,
    Receipt, Percent, DollarSign, Calculator,
    Hash, CreditCard, ClipboardCheck, Package, Plus,
    CheckCircle,
    Clock
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { getIPFSUrl } from '@/config/ipfs';
import { formatDate } from '@/lib/utils';

// Blockchain interfaces - matches PenerimaanDetailInfo struct from ViewStructs.sol
interface BlockchainPembayaran {
    pembayaranId: bigint;
    rencanaPembelianId: bigint;
    walletMember: string;
    noCekBg: string;
    noRekening: string;
    namaRekening: string;
    namaBank: string;
    totalBayar: bigint;
}

interface BlockchainPenerimaan {
    penerimaanId: bigint;
    fileLoId: bigint;
    dokumenStokId: bigint;
    tanggal: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainPenerimaanDetailInfo {
    fileLoId: bigint;
    detailRencanaPembelianId: bigint;
    pengirimanId: bigint;
    tanggalPengiriman: bigint;
    rencanaPembelianId: bigint;
    deskripsi: string;
    namaSpbu: string;
    pegawaiPengusul: string;
    tanggalPembelian: bigint;
    kodePembelian: string;
    grandTotal: bigint; // scaled x100
    ppn: bigint;
    ppbkb: bigint;
    pph: bigint;
    harga: bigint; // scaled x100
    totalHarga: bigint; // scaled x100
    jumlah: bigint;
    satuanJumlah: string;
    noFaktur: string;
    noLo: string;
    noDo: string;
    noPol: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
    ipfsHash: string;
    pembayaranList: BlockchainPembayaran[];
    penerimaanList: BlockchainPenerimaan[];
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

export default function PenerimaanShow() {
    const navigate = useNavigate();
    const { fileLoId } = useParams<{ fileLoId: string }>();

    const fileLoIdNumber = fileLoId ? parseInt(fileLoId, 10) : 0;
    const isValidFileLoId = !isNaN(fileLoIdNumber) && fileLoIdNumber > 0;

    // Fetch Penerimaan detail using getPenerimaanDetailInfo
    const { data: detailResponse, isLoading, error } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getPenerimaanDetailInfo',
        args: isValidFileLoId ? [BigInt(fileLoIdNumber)] : undefined,
        query: { enabled: isValidFileLoId }
    });

    const detail = detailResponse as BlockchainPenerimaanDetailInfo | undefined;
    const hasData = isValidFileLoId && detail && Number(detail.fileLoId) > 0;

    // Calculate financial summary
    // grandTotal from contract = netPrice (before taxes)
    // grossPrice = netPrice + ppn + ppbkb + pph
    const financialSummary = useMemo(() => {
        if (!detail) return { netPrice: 0, ppn: 0, ppbkb: 0, pph: 0, grossPrice: 0, productSubtotal: 0 };

        const netPrice = Number(detail.grandTotal) / 100; // grandTotal is net (before taxes)
        const ppn = Number(detail.ppn) / 100;
        const ppbkb = Number(detail.ppbkb) / 100;
        const pph = Number(detail.pph) / 100;
        const grossPrice = netPrice + ppn + ppbkb + pph; // Total with all taxes
        const productSubtotal = Number(detail.totalHarga) / 100; // This product's subtotal

        return { netPrice, ppn, ppbkb, pph, grossPrice, productSubtotal };
    }, [detail]);

    // Convert pembayaran list
    const pembayaranList = useMemo(() => {
        if (!detail?.pembayaranList) return [];
        return detail.pembayaranList.map(p => ({
            pembayaranId: Number(p.pembayaranId),
            noCekBg: p.noCekBg,
            noRekening: p.noRekening,
            namaRekening: p.namaRekening,
            namaBank: p.namaBank,
            totalBayar: Number(p.totalBayar) / 100,
        }));
    }, [detail]);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-50/80 dark:bg-slate-900" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">Memuat data...</p>
                </div>
            </div>
        );
    }

    // Error or not found
    if (error || !hasData) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-50/80 dark:bg-slate-900" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
                    <motion.div
                        className="flex flex-col items-center gap-4 max-w-md text-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                            Data Tidak Ditemukan
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Data Penerimaan dengan ID {fileLoId} tidak ditemukan atau belum dikonfirmasi.
                        </p>
                        <motion.button
                            onClick={() => navigate('/stok/penerimaan-minyak')}
                            className="mt-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-2xl"
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
            <div className="absolute inset-0 bg-indigo-50/80 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-indigo-400/20 to-violet-400/20 dark:from-indigo-600/30 dark:to-violet-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-purple-400/15 to-pink-400/15 dark:from-purple-500/20 dark:to-pink-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/stok/penerimaan-minyak')}
                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Daftar
                </motion.button>

                {/* Header Section */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600" />
                    <div className="absolute inset-0 opacity-10" />
                    <div className="relative z-10 p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <ClipboardCheck className="w-8 h-8 text-white" />
                                </motion.div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                                        Detail Penerimaan
                                    </h1>
                                    <p className="text-white/80 mt-1">
                                        {detail.kodePembelian || `File LO ID: ${fileLoIdNumber}`}
                                    </p>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="px-4 py-2 rounded-full backdrop-blur-md border bg-green-500/20 border-green-300/50 text-green-100">
                                <span className="flex items-center gap-2">
                                    <ClipboardCheck className="w-4 h-4" />
                                    Sudah Dikonfirmasi
                                </span>
                            </div>

                            {/* Terima Minyak Button */}
                            <motion.button
                                onClick={() => navigate(`/stok/penerimaan-minyak/${fileLoIdNumber}/create`)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold rounded-xl border border-white/30 transition-all"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Plus className="w-5 h-5" />
                                Terima Minyak
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Informasi Rencana Pembelian Card */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                    <div className="relative z-10 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-indigo-500" />
                            Informasi Rencana Pembelian
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* SPBU */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                    <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">SPBU</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {detail.namaSpbu || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Kode Pembelian */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <Hash className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Kode Pembelian</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {detail.kodePembelian || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Tanggal Pembelian */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Tanggal Pembelian</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {detail.tanggalPembelian ? formatTanggal(new Date(Number(detail.tanggalPembelian) * 1000)) : '-'}
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
                                        {detail.pegawaiPengusul || '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Deskripsi */}
                        {detail.deskripsi && (
                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Deskripsi</p>
                                <p className="text-slate-700 dark:text-slate-300">{detail.deskripsi}</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Informasi Pengiriman Card */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                    <div className="relative z-10 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Truck className="w-5 h-5 text-cyan-500" />
                            Informasi Pengiriman
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* No DO */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                                    <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">No. Delivery Order</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {detail.noDo || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* No Pol */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                                    <Truck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">No. Polisi</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {detail.noPol || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Tanggal Pengiriman */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                    <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Tanggal Pengiriman</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {detail.tanggalPengiriman ? formatTanggal(new Date(Number(detail.tanggalPengiriman) * 1000)) : '-'}
                                    </p>
                                </div>
                            </div>

                            {/* ID Pengiriman */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                                    <Hash className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">ID Pengiriman</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {Number(detail.pengirimanId) || '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* File LO Card */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                    <div className="relative z-10 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-500" />
                            Informasi File LO
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* No Faktur */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">No. Faktur</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {detail.noFaktur || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* No LO */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                                    <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">No. Lorry Order</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {detail.noLo || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Jumlah */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                    <Droplet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Jumlah</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {formatNumber(Number(detail.jumlah))} {detail.satuanJumlah}
                                    </p>
                                </div>
                            </div>

                            {/* Harga */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                    <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Harga per Unit</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {formatCurrency(Number(detail.harga) / 100)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Total Harga */}
                        <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                        <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <span className="font-medium text-indigo-700 dark:text-indigo-300">Total Harga Produk</span>
                                </div>
                                <p className="font-bold text-indigo-700 dark:text-indigo-300 text-xl">
                                    {formatCurrency(Number(detail.totalHarga) / 100)}
                                </p>
                            </div>
                        </div>

                        {/* Document Link */}
                        {detail.ipfsHash && (
                            <div className="mt-4">
                                <a
                                    href={getIPFSUrl(detail.ipfsHash)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                                >
                                    <FileText className="w-4 h-4" />
                                    Lihat Dokumen
                                </a>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Financial Summary Card */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                    <div className="relative z-10 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-indigo-500" />
                            Ringkasan Keuangan
                        </h2>

                        <div className="space-y-3">
                            {/* This Product Contribution */}
                            <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl border border-cyan-200 dark:border-cyan-700 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Droplet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                                    <span className="text-sm font-medium text-cyan-700 dark:text-cyan-300">Subtotal Produk Ini</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        {formatNumber(Number(detail.jumlah))} {detail.satuanJumlah} × {formatCurrency(Number(detail.harga) / 100)}
                                    </span>
                                    <p className="font-bold text-cyan-700 dark:text-cyan-300 text-lg">
                                        {formatCurrency(financialSummary.productSubtotal)}
                                    </p>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
                                    * Produk ini adalah salah satu penyumbang dari Grand Total. Grand Total mencakup produk lain dalam rencana pembelian.
                                </p>
                            </div>

                            {/* Net Price / Grand Total */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Grand Total (Sebelum Pajak)</span>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">Semua produk dalam rencana pembelian</p>
                                    </div>
                                </div>
                                <p className="font-bold text-slate-800 dark:text-white">
                                    {formatCurrency(financialSummary.netPrice)}
                                </p>
                            </div>

                            {/* PPN */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <Percent className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">PPN</span>
                                </div>
                                <p className="font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(financialSummary.ppn)}
                                </p>
                            </div>

                            {/* PPBKB */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                        <Percent className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">PPBKB</span>
                                </div>
                                <p className="font-bold text-amber-600 dark:text-amber-400">
                                    {formatCurrency(financialSummary.ppbkb)}
                                </p>
                            </div>

                            {/* PPH */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                        <Percent className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    </div>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">PPH</span>
                                </div>
                                <p className="font-bold text-red-600 dark:text-red-400">
                                    {formatCurrency(financialSummary.pph)}
                                </p>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-slate-200 dark:border-slate-700" />

                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20 rounded-xl border border-indigo-200 dark:border-indigo-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                        <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Total Keseluruhan</span>
                                        <p className="text-xs text-indigo-400 dark:text-indigo-500">Termasuk seluruh pajak</p>
                                    </div>
                                </div>
                                <p className="font-bold text-indigo-700 dark:text-indigo-300 text-xl">
                                    {formatCurrency(financialSummary.grossPrice)}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Pembayaran Detail Card */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                    <div className="relative z-10 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-emerald-500" />
                            Daftar Pembayaran
                        </h2>

                        <div className="space-y-3">
                            {pembayaranList.map((pembayaran, index) => (
                                <motion.div
                                    key={pembayaran.pembayaranId}
                                    className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.35 + index * 0.05 }}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                                <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-white">
                                                    {pembayaran.namaBank}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {pembayaran.namaRekening} - {pembayaran.noRekening}
                                                </p>
                                                {pembayaran.noCekBg && (
                                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                                        No. Cek/BG: {pembayaran.noCekBg}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                                                {formatCurrency(pembayaran.totalBayar)}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Total Pembayaran */}
                        <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-emerald-700 dark:text-emerald-300">Total Pembayaran</span>
                                <p className="font-bold text-emerald-700 dark:text-emerald-300 text-xl">
                                    {formatCurrency(pembayaranList.reduce((sum, p) => sum + p.totalBayar, 0))}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Penerimaan Minyak */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                    <div className="relative z-10 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Droplet className="w-5 h-5 text-cyan-500" />
                            Status Penerimaan Minyak
                        </h2>

                        <div className="space-y-4">
                            {/* Status Indicator */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${detail.penerimaanList.length !== 0
                                        ? 'bg-green-100 dark:bg-green-900/30'
                                        : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                                        {detail.penerimaanList.length !== 0
                                            ? <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            : <Clock className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                                        }
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white">
                                            {detail.penerimaanList.length !== 0 ? 'Sudah Diterima' : 'Belum Diterima'}
                                        </p>
                                        {detail.penerimaanList.length !== 0 ? (
                                            <p className="text-xs text-green-600 dark:text-green-400">
                                                Diterima pada {formatTanggal(new Date(Number(detail.penerimaanList[0].tanggal) * 1000))}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-amber-600 dark:text-amber-400">Menunggu penerimaan minyak</p>
                                        )}
                                    </div>
                                </div>

                                {/* Badge for count */}
                                {detail.penerimaanList.length > 0 && (
                                    <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                                        {detail.penerimaanList.length} Penerimaan
                                    </div>
                                )}
                            </div>

                            {/* Action Button */}
                            <motion.button
                                onClick={() => navigate(`/stok/penerimaan-minyak/${fileLoIdNumber}/create`)}
                                className={`w-full flex items-center justify-center gap-2 px-5 py-3 font-semibold rounded-xl transition-all ${detail.penerimaanList.length !== 0
                                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                                        : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg shadow-emerald-500/30'
                                    }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Plus className="w-5 h-5" />
                                {detail.penerimaanList.length !== 0 ? 'Tambah Penerimaan Lagi' : 'Terima Minyak'}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
