'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import {
    Package, ArrowLeft, Grid3X3, List, Loader2,
    ShoppingCart, Box, TrendingUp, Eye,
    Truck
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Interface from blockchain
interface BlockchainMs2Produk {
    produkId: bigint;
    namaProduk: string;
    totalJumlah: bigint;
    totalPembelian: bigint;
}

// Display interface
interface Ms2ProdukItem {
    produkId: number;
    namaProduk: string;
    totalJumlah: number;
    totalPembelian: number;
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

// Format number dengan separator
const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('id-ID').format(value);
};

export default function Ms2ProdukIndex() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Fetch all products with pending MS2
    const { data: ms2Response, isLoading } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllMs2ByProduk',
        args: [],
    });

    // Convert blockchain data to display format
    const produkList = useMemo((): Ms2ProdukItem[] => {
        if (!ms2Response) return [];

        const data = ms2Response as BlockchainMs2Produk[];
        return data.map((item) => ({
            produkId: Number(item.produkId),
            namaProduk: item.namaProduk,
            totalJumlah: Number(item.totalJumlah), // Count of DetailRencanaPembelian
            totalPembelian: Number(item.totalPembelian),
        }));
    }, [ms2Response]);

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-900">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-blue-100/50 to-transparent dark:from-blue-900/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-indigo-100/50 to-transparent dark:from-indigo-900/20 blur-3xl" />
            </div>

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

                {/* Header */}
                <motion.div
                    className="mb-8"
                    variants={headerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                                    <Package className="w-6 h-6" />
                                </div>
                                MS2 - Produk Menunggu
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-2">
                                Daftar produk dengan pembelian yang belum di-MS2
                            </p>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-2">
                            <div className="flex bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list'
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                            <motion.button
                                onClick={() => navigate('/procurement/ms2/pengiriman')}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 transition-all"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Truck className="w-5 h-5" />
                                Ajukan Pengiriman
                            </motion.button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-blue-200 dark:border-blue-700 shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                    <Box className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Produk</p>
                                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                        {formatNumber(produkList.length)}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-700 shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                                    <ShoppingCart className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Stok</p>
                                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                        {formatNumber(produkList.reduce((sum, p) => sum + p.totalPembelian, 0))}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && produkList.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700"
                    >
                        <Package className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300">
                            Tidak ada produk menunggu MS2
                        </h3>
                        <p className="text-slate-400 mt-2">
                            Semua produk sudah diproses MS2
                        </p>
                    </motion.div>
                )}

                {/* Product List - Grid View */}
                {!isLoading && produkList.length > 0 && viewMode === 'grid' && (
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {produkList.map((produk) => (
                            <motion.div
                                key={produk.produkId}
                                variants={cardVariants}
                                className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                                whileHover={{ y: -4 }}
                            >
                                <div className="p-6">
                                    {/* Product Header */}
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                                            <Package className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-lg text-slate-800 dark:text-white truncate">
                                                {produk.namaProduk}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                ID: {produk.produkId}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                            <div className="flex items-center gap-2 mb-1">
                                                <TrendingUp className="w-4 h-4 text-blue-500" />
                                                <span className="text-xs text-slate-500 dark:text-slate-400">Total Jumlah</span>
                                            </div>
                                            <p className="text-lg font-bold text-slate-800 dark:text-white">
                                                {formatNumber(produk.totalJumlah)}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                            <div className="flex items-center gap-2 mb-1">
                                                <ShoppingCart className="w-4 h-4 text-indigo-500" />
                                                <span className="text-xs text-slate-500 dark:text-slate-400">Pembelian</span>
                                            </div>
                                            <p className="text-lg font-bold text-slate-800 dark:text-white">
                                                {formatNumber(produk.totalPembelian)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <motion.button
                                        onClick={() => navigate(`/procurement/ms2/${produk.produkId}`)}
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
                )}

                {/* Product List - List View */}
                {!isLoading && produkList.length > 0 && viewMode === 'list' && (
                    <motion.div
                        className="space-y-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {produkList.map((produk) => (
                            <motion.div
                                key={produk.produkId}
                                variants={cardVariants}
                                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all p-6"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                                            <Package className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg text-slate-800 dark:text-white">
                                                {produk.namaProduk}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                ID: {produk.produkId}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Total Jumlah</p>
                                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                {formatNumber(produk.totalJumlah)}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Pembelian</p>
                                            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                                {formatNumber(produk.totalPembelian)}
                                            </p>
                                        </div>
                                        <motion.button
                                            onClick={() => navigate(`/procurement/ms2/produk/${produk.produkId}`)}
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
            </div>
        </div>
    );
}
