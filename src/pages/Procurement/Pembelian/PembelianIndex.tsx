'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import {
    Hash, User, Package, Eye, ChevronLeft, ChevronRight,
    ArrowLeft, Grid3X3, List, Loader2, Droplet, CheckCircle, AlertCircle, ShoppingCart
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Interface untuk Produk dari blockchain
interface BlockchainProdukDetail {
    namaProduk: string;
    quantity: bigint;
    satuan: string;
}

// Interface untuk RencanaPembelianView dari blockchain
interface BlockchainRencanaPembelianView {
    rencanaPembelianId: bigint;
    nama: string;
    tanggalPembelian: bigint;
    status: boolean;
    produk: BlockchainProdukDetail[];
}

// Interface untuk display
interface ProdukPerencanaan {
    namaProduk: string;
    quantity: number;
    satuan: string;
}

interface PembelianItem {
    id: number;
    tanggal: Date;
    diajukanOleh: string;
    produk: ProdukPerencanaan[];
    status: boolean;
}

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
} as const;

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
} as const;

const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: 'easeOut' }
    }
} as const;

// Format tanggal
const formatTanggal = (date: Date): string => {
    return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
};

// Format number dengan separator
const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('id-ID').format(value);
};

export default function PembelianIndex() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Fetch all status purchase to get statusPurchaseId for "Pembelian"
    const { data: statusPurchaseList } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllStatusPurchase',
        args: [],
    });

    // Find statusPurchaseId for "Pembelian" status
    const statusPurchaseId = useMemo(() => {
        if (!statusPurchaseList) return 0n;
        const found = (statusPurchaseList as { statusPurchaseId: bigint; namaStatus: string; deleted: boolean }[])
            .find(s => s.namaStatus === 'Pembelian' && !s.deleted);
        return found ? found.statusPurchaseId : 0n;
    }, [statusPurchaseList]);

    // Get total count from blockchain (only approved items - filterStatus = 2)
    const { data: totalCountResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getCountAllRencanaPembelianKonfirmasi',
        args: [2, statusPurchaseId], // filterStatus = 2 (diterima/approved), statusPurchaseId
        query: { enabled: statusPurchaseId !== 0n }
    });

    const totalItems = totalCountResponse ? Number(totalCountResponse) : 0;

    // Calculate offset for pagination
    const offset = (currentPage - 1) * pageSize;

    // Fetch data from blockchain with pagination (only approved items)
    const { data: listResponse, isLoading, error, refetch } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllRencanaPembelianKonfirmasi',
        args: [BigInt(offset), BigInt(pageSize), statusPurchaseId, 2], // offset, limit, statusPurchaseId, filterStatus = 2 (diterima)
        query: { enabled: statusPurchaseId !== 0n }
    });

    // Convert blockchain data to display format
    const pembelianList = useMemo((): PembelianItem[] => {
        if (!listResponse) return [];

        const data = listResponse as BlockchainRencanaPembelianView[];
        return data.map((item) => ({
            id: Number(item.rencanaPembelianId),
            tanggal: new Date(Number(item.tanggalPembelian) * 1000),
            diajukanOleh: item.nama || 'Unknown',
            produk: item.produk.map((p) => ({
                namaProduk: p.namaProduk,
                quantity: Number(p.quantity),
                satuan: p.satuan,
            })),
            status: item.status,
        }));
    }, [listResponse]);

    // Pagination logic
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = offset;
    const endIndex = Math.min(offset + pembelianList.length, totalItems);

    // Error state
    if (error) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-orange-50/80 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                    <motion.div
                        className="flex flex-col items-center gap-4 max-w-md text-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Gagal Memuat Data</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                            {error.message}
                        </p>
                        <motion.button
                            onClick={() => refetch()}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Coba Lagi
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-orange-50/80 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-orange-400/20 to-amber-400/20 dark:from-orange-600/30 dark:to-amber-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-red-400/15 to-orange-400/15 dark:from-red-500/20 dark:to-orange-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/')}
                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </motion.button>

                {/* Header Section */}
                <motion.div
                    className="mb-8"
                    variants={headerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <motion.h1
                                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-700 to-amber-600 dark:from-orange-300 dark:to-amber-300 bg-clip-text text-transparent flex items-center gap-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <motion.div
                                    className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg shadow-orange-500/30"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <ShoppingCart className="w-7 h-7 text-white" />
                                </motion.div>
                                Daftar Pembelian
                            </motion.h1>
                            <motion.p
                                className="text-slate-500 dark:text-slate-400 mt-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                Daftar pembelian yang sedang menunggu konfirmasi.
                            </motion.p>
                        </div>

                        {/* Action Buttons */}
                        <motion.div
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            {/* Page Size Select */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">Per halaman:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none cursor-pointer"
                                >
                                    {[5, 10, 20, 50, 100].map(size => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </div>

                            {/* View Toggle */}
                            <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
                                <motion.button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Grid3X3 className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <List className="w-5 h-5" />
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Stats Card */}
                <motion.div
                    className="mb-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div
                        variants={cardVariants}
                        className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-emerald-200/50 dark:border-emerald-700/50 p-6 shadow-lg sm:max-w-xs"
                        whileHover={{ scale: 1.02, y: -2 }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Menunggu Konfirmasi</p>
                                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">{totalItems}</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
                                <AlertCircle className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Pembelian Cards Grid */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                        <p className="text-slate-400 dark:text-slate-500 font-medium animate-pulse">
                            Memuat data pembelian...
                        </p>
                    </div>
                ) : pembelianList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-full mb-4">
                            <ShoppingCart className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Belum Ada Pembelian
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                            Belum ada perencanaan pembelian yang disetujui.
                        </p>
                    </div>
                ) : (
                    <motion.div
                        className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        key={`${currentPage}-${pageSize}`}
                    >
                        {pembelianList.map((pembelian, index) => (
                            <motion.div
                                key={pembelian.id}
                                variants={cardVariants}
                                className="group relative"
                            >
                                {/* Card with Glassmorphism */}
                                <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-orange-200/50 dark:border-orange-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
                                    {/* Card Header with Gradient */}
                                    <div className={`relative h-28 bg-gradient-to-br ${getCardGradient(index)} overflow-hidden`}>
                                        {/* Mesh Pattern */}
                                        <div className="absolute inset-0 opacity-20">
                                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4yIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')]" />
                                        </div>

                                        {/* ID Badge */}
                                        <motion.div
                                            className="absolute top-3 right-3 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30"
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                        >
                                            <span className="text-sm font-bold text-white flex items-center gap-1.5 drop-shadow-lg">
                                                <Hash className="w-3.5 h-3.5" />
                                                {pembelian.id}
                                            </span>
                                        </motion.div>

                                        <motion.div
                                            className="absolute top-3 left-3 px-3 py-1.5 backdrop-blur-md rounded-full border bg-orange-500/20 border-orange-300/50 text-white"
                                            whileHover={{ scale: 1.1 }}
                                        >
                                            <span className="text-sm font-bold flex items-center gap-1.5 drop-shadow-lg">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Menunggu Konfirmasi
                                            </span>
                                        </motion.div>

                                        {/* Icon */}
                                        <motion.div
                                            className="absolute bottom-3 left-4 p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/40 shadow-lg"
                                            whileHover={{ rotate: [0, -15, 15, 0], scale: 1.15 }}
                                            transition={{ duration: 0.6 }}
                                        >
                                            <ShoppingCart className="w-6 h-6 text-white drop-shadow-lg" />
                                        </motion.div>

                                        {/* Tanggal */}
                                        <motion.div
                                            className="absolute bottom-3 left-20 right-4"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 + 0.4 }}
                                        >
                                            <h3 className="text-lg font-bold text-white drop-shadow-lg truncate">
                                                {formatTanggal(pembelian.tanggal)}
                                            </h3>
                                        </motion.div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 relative">
                                        <div className="relative space-y-3">
                                            {/* Diajukan Oleh */}
                                            <motion.div
                                                className="flex items-center gap-3"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 + 0.5 }}
                                            >
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                                    Diajukan oleh <strong className="text-slate-800 dark:text-white">{pembelian.diajukanOleh}</strong>
                                                </span>
                                            </motion.div>

                                            {/* Produk List */}
                                            <motion.div
                                                className="space-y-2"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 + 0.55 }}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                                        <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Produk ({pembelian.produk.length})
                                                    </span>
                                                </div>
                                                <div className="pl-10 space-y-1.5">
                                                    {pembelian.produk.map((produk, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center gap-2 text-sm"
                                                        >
                                                            <Droplet className="w-3.5 h-3.5 text-cyan-500" />
                                                            <span className="text-slate-600 dark:text-slate-400">
                                                                {produk.namaProduk}
                                                            </span>
                                                            <span className="ml-auto font-semibold text-slate-700 dark:text-slate-200">
                                                                {formatNumber(produk.quantity)} {produk.satuan}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>

                                            {/* Actions - Only Detail Button */}
                                            <motion.div
                                                className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center gap-2"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 + 0.7 }}
                                            >
                                                <motion.button
                                                    onClick={() => navigate(`/procurement/pembelian/${pembelian.id}`)}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500/10 to-amber-500/10 dark:from-orange-500/40 dark:to-amber-500/40 text-orange-600 dark:text-orange-200 font-medium rounded-xl hover:from-orange-500/20 hover:to-amber-500/20 dark:hover:from-orange-500/60 dark:hover:to-amber-500/60 transition-all border border-orange-200/50 dark:border-orange-400/50 cursor-pointer"
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Lihat Detail
                                                </motion.button>
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Bottom Gradient Line */}
                                    <motion.div
                                        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500"
                                        initial={{ scaleX: 0, opacity: 0 }}
                                        whileHover={{ scaleX: 1, opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                        style={{ originX: 0 }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700"
                    >
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Menampilkan {startIndex + 1} - {endIndex} dari {totalItems} Pembelian
                        </p>
                        <div className="flex items-center gap-2">
                            <motion.button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                                whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
                                whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </motion.button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(page => {
                                        if (totalPages <= 5) return true;
                                        if (page === 1 || page === totalPages) return true;
                                        if (Math.abs(page - currentPage) <= 1) return true;
                                        return false;
                                    })
                                    .map((page, i, arr) => (
                                        <React.Fragment key={page}>
                                            {i > 0 && arr[i - 1] !== page - 1 && (
                                                <span className="px-1 text-slate-400">...</span>
                                            )}
                                            <motion.button
                                                onClick={() => setCurrentPage(page)}
                                                className={`min-w-[40px] h-10 rounded-xl font-medium transition-all ${currentPage === page
                                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                                                    : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {page}
                                            </motion.button>
                                        </React.Fragment>
                                    ))}
                            </div>

                            <motion.button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                                whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
                                whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

// Card gradient colors based on index (Orange/Amber theme)
const getCardGradient = (index: number) => {
    const gradients = [
        'from-orange-500 via-amber-500 to-yellow-600',
        'from-amber-500 via-orange-500 to-red-600',
        'from-red-500 via-orange-500 to-amber-600',
        'from-yellow-500 via-amber-500 to-orange-600',
        'from-orange-600 via-red-500 to-amber-600',
    ];
    return gradients[index % gradients.length];
};
