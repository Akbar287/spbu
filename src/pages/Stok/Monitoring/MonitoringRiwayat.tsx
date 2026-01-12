'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import {
    ChevronLeft, ChevronRight, Eye, X,
    Loader2, Droplet, LayoutGrid, List,
    Activity, ArrowLeft, Hash, Clock, Calendar,
    TrendingUp, TrendingDown, User, FileText, AlertCircle
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { formatNumber } from '@/lib/utils';

// Blockchain RiwayatStok interface
interface BlockchainRiwayatStok {
    stokInventoryId: bigint;
    dokumenStokId: bigint;
    tanggal: bigint;
    typeMovement: string;
    namaPegawai: string;
    namaProduk: string;
    jamKerja: string;
    namaDombak: string;
    stokAwal: bigint;
    stokAkhir: bigint;
    stokAkhirTeoritis: bigint;
    totalLoss: bigint;
    tandaLoss: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// Display interface
interface RiwayatStokDisplay {
    stokInventoryId: number;
    dokumenStokId: number;
    tanggal: Date;
    typeMovement: string;
    namaPegawai: string;
    namaProduk: string;
    jamKerja: string;
    namaDombak: string;
    stokAwal: number;
    stokAkhir: number;
    stokAkhirTeoritis: number;
    totalLoss: number;
    tandaLoss: string;
    createdAt: Date;
    updatedAt: Date;
}

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
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

// Card gradient colors based on movement type
const getMovementColor = (type: string): { bg: string; text: string; gradient: string } => {
    switch (type.toLowerCase()) {
        case 'penerimaan':
            return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', gradient: 'from-emerald-500 to-teal-600' };
        case 'penjualan':
            return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', gradient: 'from-blue-500 to-indigo-600' };
        case 'transfer':
            return { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400', gradient: 'from-violet-500 to-purple-600' };
        case 'adjustment':
            return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', gradient: 'from-amber-500 to-orange-600' };
        default:
            return { bg: 'bg-slate-100 dark:bg-slate-900/30', text: 'text-slate-600 dark:text-slate-400', gradient: 'from-slate-500 to-gray-600' };
    }
};

export default function MonitoringRiwayat() {
    const navigate = useNavigate();
    const { stokId } = useParams<{ stokId: string }>();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedItem, setSelectedItem] = useState<RiwayatStokDisplay | null>(null);

    const stokInventoryId = stokId ? Number(stokId) : 0;

    // Fetch riwayat data
    const { data: riwayatResponse, isLoading } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllDokumenStokRiwayat',
        args: [BigInt((currentPage - 1) * pageSize), BigInt(pageSize), BigInt(stokInventoryId)],
        query: { enabled: stokInventoryId > 0 }
    });

    // Convert riwayat data
    const { riwayatList, totalCount } = useMemo(() => {
        if (!riwayatResponse) return { riwayatList: [], totalCount: 0 };
        const [data, total] = riwayatResponse as [BlockchainRiwayatStok[], bigint];
        const list: RiwayatStokDisplay[] = data
            .filter(r => !r.deleted)
            .map(r => ({
                stokInventoryId: Number(r.stokInventoryId),
                dokumenStokId: Number(r.dokumenStokId),
                tanggal: new Date(Number(r.tanggal) * 1000),
                typeMovement: r.typeMovement,
                namaPegawai: r.namaPegawai,
                namaProduk: r.namaProduk,
                jamKerja: r.jamKerja,
                namaDombak: r.namaDombak,
                stokAwal: Number(r.stokAwal) / 100, // scaled x100
                stokAkhir: Number(r.stokAkhir) / 100,
                stokAkhirTeoritis: Number(r.stokAkhirTeoritis) / 100,
                totalLoss: Number(r.totalLoss) / 100,
                tandaLoss: r.tandaLoss,
                createdAt: new Date(Number(r.createdAt) * 1000),
                updatedAt: new Date(Number(r.updatedAt) * 1000),
            }));

        return { riwayatList: list, totalCount: Number(total) };
    }, [riwayatResponse]);

    // Pagination logic
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);

    // Format datetime
    const formatDateTime = (date: Date) => {
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-indigo-100/80 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-indigo-400/20 to-purple-400/20 dark:from-indigo-600/30 dark:to-purple-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-blue-400/15 to-indigo-400/15 dark:from-blue-500/20 dark:to-indigo-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate(`/stok/pemantauan-stok/${stokId}`)}
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
                                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent flex items-center gap-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <motion.div
                                    className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <FileText className="w-7 h-7 text-white" />
                                </motion.div>
                                Riwayat Stok
                            </motion.h1>
                            <motion.p
                                className="text-slate-500 dark:text-slate-400 mt-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                Riwayat perubahan stok untuk Stok Inventory #{stokId}
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
                                    className="px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
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
                                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <LayoutGrid className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <List className="w-5 h-5" />
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {[
                        { label: 'Total Riwayat', value: formatNumber(totalCount), icon: FileText, color: 'from-indigo-500 to-purple-600' },
                        { label: 'Halaman', value: `${currentPage} / ${totalPages || 1}`, icon: Hash, color: 'from-blue-500 to-cyan-600' },
                        { label: 'Stok Inventory ID', value: stokId || '-', icon: Activity, color: 'from-emerald-500 to-teal-600' },
                    ].map((stat) => (
                        <motion.div
                            key={stat.label}
                            variants={cardVariants}
                            className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 p-4 shadow-lg"
                            whileHover={{ scale: 1.02, y: -2 }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                                    <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{stat.value}</p>
                                </div>
                                <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg`}>
                                    <stat.icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                        <p className="text-slate-400 dark:text-slate-500 font-medium animate-pulse">
                            Memuat riwayat stok...
                        </p>
                    </div>
                ) : riwayatList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-full mb-4">
                            <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Belum Ada Riwayat
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                            Belum ada riwayat perubahan stok untuk produk ini.
                        </p>
                    </div>
                ) : (
                    <motion.div
                        className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'flex flex-col gap-3'}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        key={`${currentPage}-${pageSize}`}
                    >
                        {riwayatList.map((item, index) => {
                            const colors = getMovementColor(item.typeMovement);
                            const stokChange = item.stokAkhir - item.stokAwal;
                            const isPositive = stokChange >= 0;

                            return (
                                <motion.div
                                    key={item.dokumenStokId}
                                    variants={cardVariants}
                                    className="group relative"
                                >
                                    <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 p-4">
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                                                    {item.typeMovement}
                                                </div>
                                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                                    #{item.dokumenStokId}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(item.tanggal)}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Droplet className="w-4 h-4 text-cyan-500" />
                                                <span className="text-slate-600 dark:text-slate-300">{item.namaDombak}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="w-4 h-4 text-violet-500" />
                                                <span className="text-slate-600 dark:text-slate-300">{item.namaPegawai}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="w-4 h-4 text-amber-500" />
                                                <span className="text-slate-600 dark:text-slate-300">{item.jamKerja}</span>
                                            </div>
                                        </div>

                                        {/* Stok Change */}
                                        <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                                    {formatNumber(item.stokAwal)} L → {formatNumber(item.stokAkhir)} L
                                                </div>
                                                <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                                    {isPositive ? '+' : ''}{formatNumber(stokChange)} L
                                                </div>
                                            </div>
                                            {item.totalLoss !== 0 && (
                                                <div className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    Loss: {item.tandaLoss}{formatNumber(Math.abs(item.totalLoss))} L
                                                </div>
                                            )}
                                        </div>

                                        {/* View Detail Button */}
                                        <motion.button
                                            onClick={() => setSelectedItem(item)}
                                            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Eye className="w-4 h-4" />
                                            Lihat Detail
                                        </motion.button>
                                    </div>
                                </motion.div>
                            );
                        })}
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
                            Menampilkan {startIndex + 1} - {endIndex} dari {totalCount} Riwayat
                        </p>
                        <div className="flex items-center gap-2">
                            <motion.button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
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
                                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                                                    : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
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
                                className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                                whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
                                whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedItem(null)}
                    >
                        <motion.div
                            className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className={`p-6 bg-gradient-to-r ${getMovementColor(selectedItem.typeMovement).gradient}`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">
                                            Detail Riwayat #{selectedItem.dokumenStokId}
                                        </h3>
                                        <p className="text-white/80 text-sm mt-1">
                                            {selectedItem.typeMovement}
                                        </p>
                                    </div>
                                    <motion.button
                                        onClick={() => setSelectedItem(null)}
                                        className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <X className="w-5 h-5 text-white" />
                                    </motion.button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 space-y-4">
                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tanggal</p>
                                        <p className="font-semibold text-slate-800 dark:text-white">{formatDate(selectedItem.tanggal)}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Jam Kerja</p>
                                        <p className="font-semibold text-slate-800 dark:text-white">{selectedItem.jamKerja}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Pegawai</p>
                                        <p className="font-semibold text-slate-800 dark:text-white">{selectedItem.namaPegawai}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Dombak</p>
                                        <p className="font-semibold text-slate-800 dark:text-white">{selectedItem.namaDombak}</p>
                                    </div>
                                </div>

                                {/* Produk */}
                                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Produk</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">{selectedItem.namaProduk}</p>
                                </div>

                                {/* Stok Info */}
                                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-500/30">
                                    <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3">Perubahan Stok</h4>
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div>
                                            <p className="text-xs text-blue-600 dark:text-blue-400">Stok Awal</p>
                                            <p className="text-lg font-bold text-blue-800 dark:text-blue-200">{formatNumber(selectedItem.stokAwal)} L</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-600 dark:text-blue-400">Stok Akhir</p>
                                            <p className="text-lg font-bold text-blue-800 dark:text-blue-200">{formatNumber(selectedItem.stokAkhir)} L</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-600 dark:text-blue-400">Selisih</p>
                                            <p className={`text-lg font-bold ${selectedItem.stokAkhir - selectedItem.stokAwal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {selectedItem.stokAkhir - selectedItem.stokAwal >= 0 ? '+' : ''}{formatNumber(selectedItem.stokAkhir - selectedItem.stokAwal)} L
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Teoritis & Loss */}
                                {selectedItem.totalLoss !== 0 && (
                                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200/50 dark:border-amber-500/30">
                                        <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-3">Analisis Loss</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-xs text-amber-600 dark:text-amber-400">Stok Teoritis</p>
                                                <p className="text-lg font-bold text-amber-800 dark:text-amber-200">{formatNumber(selectedItem.stokAkhirTeoritis)} L</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-amber-600 dark:text-amber-400">Total Loss</p>
                                                <p className="text-lg font-bold text-amber-800 dark:text-amber-200">{selectedItem.tandaLoss}{formatNumber(Math.abs(selectedItem.totalLoss))} L</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Timestamps */}
                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <span>Dibuat: {formatDateTime(selectedItem.createdAt)}</span>
                                    <span>Update: {formatDateTime(selectedItem.updatedAt)}</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
