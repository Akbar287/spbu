'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import {
    Eye, ChevronLeft, ChevronRight,
    ArrowLeft, Grid3X3, List, Loader2, Package, AlertCircle, Warehouse, Calendar, FileText
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Interface from blockchain - matches ProdukMenuMs2ViewByProdukIdPembelian struct
interface BlockchainMs2PembelianItem {
    rencanaPembelianId: bigint;
    detailRencanaPembelianId: bigint;
    tanggalPembelian: bigint;
    kodePembelian: string;
    totalStok: bigint;
}

// Interface from blockchain - matches ProdukMenuMs2ViewByProdukId struct
interface BlockchainMs2Response {
    produkId: bigint;
    namaProduk: string;
    totalJumlah: string; // Count as string
    produk: BlockchainMs2PembelianItem[];
}

// Display interface
interface Ms2DetailItem {
    rencanaPembelianId: number;
    detailRencanaPembelianId: number;
    tanggalPembelian: Date;
    kodePembelian: string;
    totalStok: number;
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

export default function Ms2ProdukShow() {
    const navigate = useNavigate();
    const { produkId } = useParams<{ produkId: string }>();
    const produkIdNumber = produkId ? parseInt(produkId) : 0;

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Calculate offset for pagination
    const offset = (currentPage - 1) * pageSize;

    // Fetch data from blockchain with pagination - now returns single object
    const { data: response, isLoading, error, refetch } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllMs2ByProdukId',
        args: [BigInt(offset), BigInt(pageSize), BigInt(produkIdNumber)],
        query: { enabled: produkIdNumber > 0 }
    });

    // Parse response
    const ms2Data = useMemo(() => {
        if (!response) return null;
        const data = response as BlockchainMs2Response;
        return {
            produkId: Number(data.produkId),
            namaProduk: data.namaProduk,
            totalJumlah: parseInt(data.totalJumlah) || 0,
            produk: data.produk
        };
    }, [response]);

    // Get total items from totalJumlah field
    const totalItems = ms2Data?.totalJumlah || 0;
    const namaProduk = ms2Data?.namaProduk || '';

    // Convert blockchain data to display format
    const detailList = useMemo((): Ms2DetailItem[] => {
        if (!ms2Data?.produk) return [];

        return ms2Data.produk.map((item) => ({
            rencanaPembelianId: Number(item.rencanaPembelianId),
            detailRencanaPembelianId: Number(item.detailRencanaPembelianId),
            tanggalPembelian: new Date(Number(item.tanggalPembelian) * 1000),
            kodePembelian: item.kodePembelian,
            totalStok: Number(item.totalStok),
        }));
    }, [ms2Data]);

    // Pagination logic
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = offset;
    const endIndex = Math.min(offset + detailList.length, totalItems);

    // Error state
    if (error) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-50/80 dark:bg-slate-900" />
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
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl"
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
            <div className="absolute inset-0 bg-blue-50/80 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-blue-400/20 to-indigo-400/20 dark:from-blue-600/30 dark:to-indigo-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-indigo-400/15 to-blue-400/15 dark:from-indigo-500/20 dark:to-blue-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/procurement/ms2')}
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
                                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-300 dark:to-indigo-300 bg-clip-text text-transparent flex items-center gap-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <motion.div
                                    className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Warehouse className="w-7 h-7 text-white" />
                                </motion.div>
                                {namaProduk || 'Stok di Kilang Minyak'}
                            </motion.h1>
                            <motion.p
                                className="text-slate-500 dark:text-slate-400 mt-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                Daftar stok produk SPBU yang tersimpan di kilang minyak pusat (Produk ID: {produkId})
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
                                    className="px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
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
                                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Grid3X3 className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <List className="w-5 h-5" />
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Stats Summary */}
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-blue-200 dark:border-blue-700 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Total Item</p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                    {formatNumber(totalItems)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-700 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                                <Warehouse className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Total Stok</p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                    {formatNumber(detailList.reduce((sum, item) => sum + item.totalStok, 0))}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && detailList.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700"
                    >
                        <Warehouse className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300">
                            Tidak ada stok di kilang
                        </h3>
                        <p className="text-slate-400 mt-2">
                            Produk ini tidak memiliki stok yang tersimpan di kilang minyak pusat.
                        </p>
                    </motion.div>
                )}

                {/* Data Grid/List */}
                {!isLoading && detailList.length > 0 && (
                    <>
                        {viewMode === 'grid' ? (
                            <motion.div
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {detailList.map((item) => (
                                    <motion.div
                                        key={item.detailRencanaPembelianId}
                                        variants={cardVariants}
                                        className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                                        whileHover={{ y: -4 }}
                                    >
                                        <div className="p-6">
                                            {/* Header */}
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-lg text-slate-800 dark:text-white truncate">
                                                        {item.kodePembelian}
                                                    </h3>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        Detail ID: {item.detailRencanaPembelianId}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="space-y-3 mb-4">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm">{formatTanggal(item.tanggalPembelian)}</span>
                                                </div>
                                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Stok</p>
                                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                        {formatNumber(item.totalStok)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <motion.button
                                                onClick={() => navigate(`/procurement/ms2/${produkIdNumber}/${item.rencanaPembelianId}/${item.detailRencanaPembelianId}`)}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <Eye className="w-4 h-4" />
                                                Lihat Detail
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                className="space-y-4"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {detailList.map((item) => (
                                    <motion.div
                                        key={item.detailRencanaPembelianId}
                                        variants={cardVariants}
                                        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all p-6"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg text-slate-800 dark:text-white">
                                                        {item.kodePembelian}
                                                    </h3>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        Detail ID: {item.detailRencanaPembelianId}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="text-center">
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Tanggal</p>
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        {formatTanggal(item.tanggalPembelian)}
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Stok</p>
                                                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                        {formatNumber(item.totalStok)}
                                                    </p>
                                                </div>
                                                <motion.button
                                                    onClick={() => navigate(`/procurement/pembelian/show/${item.rencanaPembelianId}`)}
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Detail
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <motion.div
                                className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Menampilkan {startIndex + 1} - {endIndex} dari {totalItems} item
                                </p>
                                <div className="flex items-center gap-2">
                                    <motion.button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                        whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
                                        whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </motion.button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            return (
                                                <motion.button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${currentPage === pageNum
                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                        }`}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    {pageNum}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                    <motion.button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                        whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
                                        whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
