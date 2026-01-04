'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Fuel, MapPin, Calendar, Ruler, Hash,
    Plus, Edit3, Trash2, Eye, ChevronLeft, ChevronRight,
    Sparkles, ArrowLeft, Grid3X3, List, Loader2, AlertCircle
} from 'lucide-react';
import { formatNumber, calculateAge } from '@/lib/utils';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// SPBU Interface from blockchain
interface BlockchainSpbu {
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

// Converted SPBU for display
interface Spbu {
    spbuId: number;
    namaSpbu: string;
    nomorSpbu: string;
    tanggalPendirian: Date;
    alamat: string;
    luasLahan: number;
    satuanLuas: string;
}

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
} as const;

const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
} as const;

const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
} as const;

export default function SpbuIndex() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [deleteTarget, setDeleteTarget] = useState<Spbu | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch SPBU data from blockchain
    const { data: spbuResponse, isLoading, error, refetch } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllSpbu',
        args: [BigInt((currentPage - 1) * pageSize), BigInt(pageSize)],
    });

    // Write contract hook
    const { writeContract, isPending: isWritePending, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle delete success
    React.useEffect(() => {
        if (isWriteSuccess) {
            setDeleteTarget(null);
            setIsDeleting(false);
            refetch(); // Refresh data
        }
    }, [isWriteSuccess, refetch]);

    // Convert blockchain data to display format
    const { spbuList, totalItems } = useMemo(() => {
        if (!spbuResponse) return { spbuList: [], totalItems: 0 };

        const [result, total] = spbuResponse as [BlockchainSpbu[], bigint];

        // Filter out deleted items and convert to display format
        const converted: Spbu[] = result
            .filter(spbu => !spbu.deleted)
            .map(spbu => ({
                spbuId: Number(spbu.spbuId),
                namaSpbu: spbu.namaSpbu,
                nomorSpbu: spbu.nomorSpbu,
                tanggalPendirian: new Date(Number(spbu.tanggalPendirian) * 1000),
                alamat: spbu.alamat,
                luasLahan: Number(spbu.luasLahan),
                satuanLuas: spbu.satuanLuas,
            }));

        return { spbuList: converted, totalItems: Number(total) };
    }, [spbuResponse]);

    // Pagination
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'deleteSpbu',
                args: [BigInt(deleteTarget.spbuId)],
            });
        } catch (error) {
            console.error('Error deleting:', error);
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-purple-100/80 dark:bg-slate-900" />
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-violet-400/20 to-indigo-400/20 dark:from-violet-600/30 dark:to-indigo-600/30 blur-3xl"
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-cyan-400/15 to-emerald-400/15 dark:from-cyan-500/20 dark:to-emerald-500/20 blur-3xl"
                    animate={{
                        x: [0, -80, 0],
                        y: [0, -60, 0],
                        scale: [1.2, 1, 1.2],
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-pink-400/15 to-rose-400/15 dark:from-pink-500/20 dark:to-rose-500/20 blur-3xl"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                />
            </div>

            {/* Content Container with max-w wrapper */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/')}
                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm mt-20"
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
                                    className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg shadow-violet-500/30"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Fuel className="w-7 h-7 text-white" />
                                </motion.div>
                                Daftar SPBU
                            </motion.h1>
                            <motion.p
                                className="text-slate-500 dark:text-slate-400 mt-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                Kelola data Stasiun Pengisian Bahan Bakar Umum
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
                                    className="px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none cursor-pointer"
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
                                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Grid3X3 className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <List className="w-5 h-5" />
                                </motion.button>
                            </div>

                            {/* Add Button */}
                            <motion.button
                                onClick={() => navigate('/konfigurasi/spbu/create')}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg shadow-violet-500/30 transition-all"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Plus className="w-5 h-5" />
                                Tambah SPBU
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {[
                        { label: 'Total SPBU', value: isLoading ? '...' : totalItems, icon: Fuel, color: 'from-violet-500 to-purple-600' },
                        { label: 'Total Luas', value: isLoading ? '...' : `${formatNumber(spbuList.reduce((acc, s) => acc + s.luasLahan, 0))} m²`, icon: Ruler, color: 'from-emerald-500 to-teal-600' },
                        { label: 'Halaman', value: `${currentPage}/${totalPages || 1}`, icon: Calendar, color: 'from-blue-500 to-cyan-600' },
                        { label: 'SPBU Aktif', value: isLoading ? '...' : spbuList.length, icon: Sparkles, color: 'from-amber-500 to-orange-600' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            variants={cardVariants}
                            whileHover={{ scale: 1.03, y: -5 }}
                            className="relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer group"
                        >
                            <motion.div
                                className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                            />
                            <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${stat.color} mb-3`}>
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Loading State */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-16"
                    >
                        <Loader2 className="w-12 h-12 text-violet-500 animate-spin mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Memuat data SPBU dari blockchain...</p>
                    </motion.div>
                )}

                {/* Error State */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-16 px-4"
                    >
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Gagal Memuat Data</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4 max-w-md">
                            {error.message}
                        </p>
                        <motion.button
                            onClick={() => refetch()}
                            className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Coba Lagi
                        </motion.button>
                    </motion.div>
                )}

                {/* Empty State */}
                {!isLoading && !error && spbuList.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-16"
                    >
                        <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
                            <Fuel className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Belum Ada SPBU</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Tambahkan SPBU pertama Anda</p>
                        <motion.button
                            onClick={() => navigate('/konfigurasi/spbu/create')}
                            className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Plus className="w-4 h-4" />
                            Tambah SPBU
                        </motion.button>
                    </motion.div>
                )}

                {/* SPBU Cards Grid/List */}
                {!isLoading && !error && spbuList.length > 0 && (
                    <motion.div
                        className={viewMode === 'grid'
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            : "flex flex-col gap-4"
                        }
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        key={`${currentPage}-${pageSize}`}
                    >
                        {spbuList.map((spbu, index) => (
                            <motion.div
                                key={spbu.spbuId}
                                variants={cardVariants}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500"
                            >
                                {/* Card Background with Glassmorphism */}
                                <div className="absolute inset-0 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl" />

                                {/* Animated Gradient Border */}
                                <motion.div
                                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                    style={{
                                        background: 'linear-gradient(45deg, rgba(139,92,246,0.3), rgba(236,72,153,0.3), rgba(34,211,238,0.3), rgba(139,92,246,0.3))',
                                        backgroundSize: '300% 300%',
                                    }}
                                    animate={{
                                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                                    }}
                                    transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                                />

                                {/* Inner Border */}
                                <div className="absolute inset-[1px] rounded-3xl bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl" />

                                {/* Card Content */}
                                <div className="relative z-10">
                                    {/* Gradient Header with Enhanced Animations */}
                                    <div className="relative h-36 overflow-hidden rounded-t-3xl">
                                        {/* Animated Gradient Background */}
                                        <motion.div
                                            className="absolute inset-0"
                                            style={{
                                                background: `linear-gradient(135deg, 
                                                    hsl(${260 + index * 15}, 80%, 60%) 0%, 
                                                    hsl(${280 + index * 15}, 70%, 55%) 50%, 
                                                    hsl(${240 + index * 15}, 75%, 50%) 100%)`,
                                            }}
                                            animate={{
                                                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                                            }}
                                            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                                        />

                                        {/* Mesh Pattern Overlay */}
                                        <div className="absolute inset-0 opacity-30">
                                            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                                                <defs>
                                                    <pattern id={`grid-${spbu.spbuId}`} width="20" height="20" patternUnits="userSpaceOnUse">
                                                        <circle cx="10" cy="10" r="1.5" fill="white" fillOpacity="0.4" />
                                                    </pattern>
                                                </defs>
                                                <rect width="100%" height="100%" fill={`url(#grid-${spbu.spbuId})`} />
                                            </svg>
                                        </div>

                                        {/* Animated Shimmer Effect */}
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                            initial={{ x: '-100%' }}
                                            animate={{ x: '200%' }}
                                            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
                                        />

                                        {/* Floating Orbs with Enhanced Animation */}
                                        <motion.div
                                            className="absolute -top-8 -right-8 w-32 h-32 bg-white/25 rounded-full blur-2xl"
                                            animate={{
                                                scale: [1, 1.4, 1],
                                                opacity: [0.2, 0.5, 0.2],
                                                rotate: [0, 180, 360],
                                            }}
                                            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                                        />
                                        <motion.div
                                            className="absolute -bottom-8 -left-8 w-36 h-36 bg-pink-300/30 rounded-full blur-2xl"
                                            animate={{
                                                scale: [1, 1.3, 1],
                                                opacity: [0.3, 0.5, 0.3],
                                                x: [0, 10, 0],
                                            }}
                                            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                                        />
                                        <motion.div
                                            className="absolute top-1/2 right-1/4 w-20 h-20 bg-cyan-300/20 rounded-full blur-xl"
                                            animate={{
                                                y: [0, -15, 0],
                                                opacity: [0.2, 0.4, 0.2],
                                            }}
                                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                                        />

                                        {/* SPBU Number Badge */}
                                        <motion.div
                                            className="absolute top-4 right-4 px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/40 shadow-lg"
                                            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                            transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                        >
                                            <span className="text-sm font-bold text-white flex items-center gap-1.5 drop-shadow-lg">
                                                <Hash className="w-3.5 h-3.5" />
                                                {spbu.nomorSpbu}
                                            </span>
                                        </motion.div>

                                        {/* Icon with Glow Effect */}
                                        <motion.div
                                            className="absolute bottom-4 left-4 p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/40 shadow-lg"
                                            whileHover={{ rotate: [0, -15, 15, 0], scale: 1.15 }}
                                            transition={{ duration: 0.6 }}
                                        >
                                            <div className="relative">
                                                <Fuel className="w-8 h-8 text-white drop-shadow-lg" />
                                                {/* Glow */}
                                                <motion.div
                                                    className="absolute inset-0 bg-white/50 blur-lg rounded-full"
                                                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                            </div>
                                        </motion.div>

                                        {/* Nama SPBU di Header */}
                                        <motion.div
                                            className="absolute bottom-4 left-24 right-4"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 + 0.4 }}
                                        >
                                            <h3 className="text-xl font-bold text-white drop-shadow-lg truncate">
                                                {spbu.namaSpbu}
                                            </h3>
                                        </motion.div>
                                    </div>

                                    {/* Content with Colorful Dark Mode */}
                                    <div className="p-5 relative">
                                        <div className="relative space-y-4">
                                            {/* Address */}
                                            <motion.div
                                                className="flex items-start gap-3"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 + 0.5 }}
                                            >
                                                <div className="p-2.5 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 rounded-xl shadow-sm">
                                                    <MapPin className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-slate-400 dark:text-violet-300/70 uppercase tracking-wide">Alamat</p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-200 line-clamp-2 mt-0.5">{spbu.alamat}</p>
                                                </div>
                                            </motion.div>

                                            {/* Date & Area Row */}
                                            <motion.div
                                                className="flex items-center gap-3"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 + 0.6 }}
                                            >
                                                {/* Founded Date */}
                                                <div className="flex items-center gap-2 flex-1 p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl">
                                                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    <div>
                                                        <p className="text-[10px] font-medium text-blue-400 dark:text-blue-300/70 uppercase">Berdiri</p>
                                                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-200">{calculateAge(spbu.tanggalPendirian)} tahun</p>
                                                    </div>
                                                </div>

                                                {/* Area */}
                                                <div className="flex items-center gap-2 flex-1 p-3 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl">
                                                    <Ruler className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                    <div>
                                                        <p className="text-[10px] font-medium text-emerald-400 dark:text-emerald-300/70 uppercase">Luas</p>
                                                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">{formatNumber(spbu.luasLahan)} {spbu.satuanLuas}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>

                                        {/* Actions with Enhanced Styling */}
                                        <motion.div
                                            className="mt-5 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center gap-2"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 + 0.7 }}
                                        >
                                            <motion.button
                                                onClick={() => navigate(`/konfigurasi/spbu/${spbu.spbuId}`)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500/10 to-purple-500/10 dark:from-violet-500/40 dark:to-purple-500/40 text-violet-600 dark:text-violet-200 font-medium rounded-xl hover:from-violet-500/20 hover:to-purple-500/20 dark:hover:from-violet-500/60 dark:hover:to-purple-500/60 transition-all border border-violet-200/50 dark:border-violet-400/50 dark:shadow-lg dark:shadow-violet-500/20 cursor-pointer"
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                            >
                                                <Eye className="w-4 h-4" />
                                                Detail
                                            </motion.button>
                                            <motion.button
                                                className="p-2.5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-600/40 dark:to-cyan-600/40 text-blue-600 dark:text-cyan-200 rounded-xl border border-blue-200/50 dark:border-cyan-400/50 hover:shadow-lg hover:shadow-blue-500/20 dark:shadow-lg dark:shadow-cyan-500/30 transition-all cursor-pointer"
                                                onClick={() => navigate(`/konfigurasi/spbu/${spbu.spbuId}/edit`)}
                                                whileHover={{ scale: 1.15, rotate: 10 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </motion.button>
                                            <motion.button
                                                className="p-2.5 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-600/40 dark:to-pink-600/40 text-red-600 dark:text-pink-200 rounded-xl border border-red-200/50 dark:border-pink-400/50 hover:shadow-lg hover:shadow-red-500/20 dark:shadow-lg dark:shadow-pink-500/30 transition-all cursor-pointer"
                                                onClick={() => setDeleteTarget(spbu)}
                                                whileHover={{ scale: 1.15, rotate: -10 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </motion.button>
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Bottom Gradient Line with Animation */}
                                <motion.div
                                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-pink-500 to-cyan-500"
                                    initial={{ scaleX: 0, opacity: 0 }}
                                    whileHover={{ scaleX: 1, opacity: 1 }}
                                    transition={{ duration: 0.4, ease: 'easeOut' }}
                                    style={{ transformOrigin: 'left' }}
                                />
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
                            Menampilkan {startIndex + 1} - {Math.min(endIndex, totalItems)} dari {totalItems} SPBU
                        </p>
                        <div className="flex items-center gap-2">
                            <motion.button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-500 transition-all"
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
                                                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/30'
                                                    : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400'}`}
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
                                className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-500 transition-all"
                                whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
                                whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !isDeleting && setDeleteTarget(null)}
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
                                    className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.1 }}
                                >
                                    <Trash2 className="w-8 h-8 text-red-500" />
                                </motion.div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                    Hapus SPBU?
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Apakah Anda yakin ingin menghapus <strong className="text-slate-800 dark:text-white">{deleteTarget.namaSpbu}</strong>? Tindakan ini tidak dapat dibatalkan.
                                </p>
                                <div className="flex gap-3">
                                    <motion.button
                                        onClick={() => setDeleteTarget(null)}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                                        whileHover={{ scale: isDeleting ? 1 : 1.02 }}
                                        whileTap={{ scale: isDeleting ? 1 : 0.98 }}
                                    >
                                        Batal
                                    </motion.button>
                                    <motion.button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg shadow-red-500/30 disabled:opacity-70"
                                        whileHover={{ scale: isDeleting ? 1 : 1.02 }}
                                        whileTap={{ scale: isDeleting ? 1 : 0.98 }}
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Menghapus...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4" />
                                                Hapus
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
