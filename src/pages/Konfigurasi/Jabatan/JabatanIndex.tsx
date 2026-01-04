'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Briefcase, FileText, Hash, Clock,
    Plus, Edit3, Trash2, Eye, ChevronLeft, ChevronRight,
    Grid3X3, List, Loader2, BarChart2
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain Interfaces
interface BlockchainJabatan {
    jabatanId: bigint;
    levelId: bigint;
    namaJabatan: string;
    keterangan: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainLevel {
    levelId: bigint;
    namaLevel: string;
    deleted: boolean;
}

// Display Interface
interface Jabatan {
    jabatanId: number;
    levelId: number;
    levelName: string;
    namaJabatan: string;
    keterangan: string;
    createdAt: Date;
    updatedAt: Date;
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

export default function JabatanIndex() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [deleteTarget, setDeleteTarget] = useState<Jabatan | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch Jabatan data
    const { data: jabatanResponse, isLoading: isLoadingJabatan, refetch: refetchJabatan } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllJabatan',
        args: [BigInt(0), BigInt(100)],
    });

    // Fetch Level data for name mapping
    const { data: levelResponse, isLoading: isLoadingLevel } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllLevel',
        args: [BigInt(0), BigInt(100)],
    });

    // Write contract for delete
    const { writeContract, isPending: isWritePending, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle delete success
    React.useEffect(() => {
        if (isWriteSuccess) {
            setDeleteTarget(null);
            setIsDeleting(false);
            refetchJabatan();
        }
    }, [isWriteSuccess, refetchJabatan]);

    // Process and combine data
    const { jabatanList, totalItems } = useMemo(() => {
        if (!jabatanResponse || !levelResponse) return { jabatanList: [], totalItems: 0 };

        const [rawJabatan] = jabatanResponse as [BlockchainJabatan[], bigint];
        const [rawLevel] = levelResponse as [BlockchainLevel[], bigint];

        // Create Level Map
        const levelMap = new Map<number, string>();
        rawLevel.forEach(lvl => {
            if (!lvl.deleted) {
                levelMap.set(Number(lvl.levelId), lvl.namaLevel);
            }
        });

        // Convert Jabatan
        const converted: Jabatan[] = rawJabatan
            .filter(j => !j.deleted)
            .map(j => ({
                jabatanId: Number(j.jabatanId),
                levelId: Number(j.levelId),
                levelName: levelMap.get(Number(j.levelId)) || 'Unknown Level',
                namaJabatan: j.namaJabatan,
                keterangan: j.keterangan || '-',
                createdAt: new Date(Number(j.createdAt) * 1000),
                updatedAt: new Date(Number(j.updatedAt) * 1000),
            }));

        return { jabatanList: converted, totalItems: converted.length };
    }, [jabatanResponse, levelResponse]);

    // Pagination logic
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedJabatan = useMemo(() =>
        jabatanList.slice(startIndex, endIndex),
        [jabatanList, startIndex, endIndex]
    );

    const isLoading = isLoadingJabatan || isLoadingLevel;

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'deleteJabatan',
                args: [BigInt(deleteTarget.jabatanId)],
            });
        } catch (error) {
            console.error('Error deleting:', error);
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-amber-50/50 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-amber-400/20 to-orange-400/20 dark:from-amber-600/30 dark:to-orange-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-red-400/15 to-rose-400/15 dark:from-red-500/20 dark:to-rose-500/20 blur-3xl"
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
                    <ChevronLeft className="w-5 h-5" />
                    Kembali ke Dashboard
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
                                    className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/30"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Briefcase className="w-7 h-7 text-white" />
                                </motion.div>
                                Daftar Jabatan
                            </motion.h1>
                            <motion.p
                                className="text-slate-500 dark:text-slate-400 mt-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                Kelola data jabatan dan strukturnya
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
                                    className="px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none cursor-pointer"
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
                                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Grid3X3 className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <List className="w-5 h-5" />
                                </motion.button>
                            </div>

                            {/* Add Button */}
                            <motion.button
                                onClick={() => navigate('/konfigurasi/jabatan/create')}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-2xl shadow-lg shadow-amber-500/30 transition-all"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Plus className="w-5 h-5" />
                                Tambah Jabatan
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20"
                        >
                            <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">Memuat data jabatan...</p>
                        </motion.div>
                    ) : jabatanList.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center justify-center py-20 text-center"
                        >
                            <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6">
                                <Briefcase className="w-12 h-12 text-amber-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Belum Ada Data Jabatan</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                                Belum ada data jabatan yang ditambahkan. Silakan tambahkan jabatan baru untuk memulai.
                            </p>
                            <motion.button
                                onClick={() => navigate('/konfigurasi/jabatan/create')}
                                className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-2xl shadow-lg shadow-amber-500/30"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Tambah Jabatan Baru
                            </motion.button>
                        </motion.div>
                    ) : (
                        <motion.div
                            className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            key={`${currentPage}-${pageSize}`} // Add key to force re-render on page/size change
                        >
                            {paginatedJabatan.map((jabatan, index) => (
                                <motion.div
                                    key={jabatan.jabatanId}
                                    variants={cardVariants}
                                    className="group relative"
                                >
                                    {/* Card with Glassmorphism */}
                                    <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
                                        {/* Animated gradient border on hover */}
                                        <motion.div
                                            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(249,115,22,0.3), rgba(239,68,68,0.3))',
                                                padding: '1px',
                                            }}
                                        />

                                        {/* Card Header with Gradient */}
                                        <div className={`relative h-28 bg-gradient-to-br ${getCardGradient(index)} overflow-hidden`}>
                                            {/* Mesh Pattern */}
                                            <div className="absolute inset-0 opacity-20">
                                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4yIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')]" />
                                            </div>

                                            {/* Jabatan ID Badge */}
                                            <motion.div
                                                className="absolute top-3 right-3 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30"
                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                            >
                                                <span className="text-sm font-bold text-white flex items-center gap-1.5 drop-shadow-lg">
                                                    <Hash className="w-3.5 h-3.5" />
                                                    {jabatan.jabatanId}
                                                </span>
                                            </motion.div>

                                            {/* Icon */}
                                            <motion.div
                                                className="absolute bottom-3 left-4 p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/40 shadow-lg"
                                                whileHover={{ rotate: [0, -15, 15, 0], scale: 1.15 }}
                                                transition={{ duration: 0.6 }}
                                            >
                                                <Briefcase className="w-6 h-6 text-white drop-shadow-lg" />
                                            </motion.div>

                                            {/* Nama Jabatan */}
                                            <motion.div
                                                className="absolute bottom-3 left-20 right-4"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 + 0.4 }}
                                            >
                                                <h3 className="text-lg font-bold text-white drop-shadow-lg truncate">
                                                    {jabatan.namaJabatan}
                                                </h3>
                                            </motion.div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5 relative">
                                            <div className="relative space-y-3">
                                                {/* Level */}
                                                <motion.div
                                                    className="flex items-center gap-3"
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 + 0.5 }}
                                                >
                                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                                        <BarChart2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    <span className="text-sm text-slate-600 dark:text-slate-300 truncate font-medium">
                                                        Level: {jabatan.levelName}
                                                    </span>
                                                </motion.div>

                                                {/* Keterangan */}
                                                <motion.div
                                                    className="flex items-start gap-3"
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 + 0.55 }}
                                                >
                                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mt-0.5">
                                                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                                        {jabatan.keterangan}
                                                    </p>
                                                </motion.div>

                                                {/* Timestamps */}
                                                <motion.div
                                                    className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500"
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 + 0.6 }}
                                                >
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>Update: {formatDate(jabatan.updatedAt)}</span>
                                                </motion.div>

                                                {/* Actions */}
                                                <motion.div
                                                    className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center gap-2"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.1 + 0.7 }}
                                                >
                                                    <motion.button
                                                        onClick={() => navigate(`/konfigurasi/jabatan/${jabatan.jabatanId}`)}
                                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/40 dark:to-orange-500/40 text-amber-600 dark:text-amber-200 font-medium rounded-xl hover:from-amber-500/20 hover:to-orange-500/20 dark:hover:from-amber-500/60 dark:hover:to-orange-500/60 transition-all border border-amber-200/50 dark:border-amber-400/50 dark:shadow-lg dark:shadow-amber-500/20 cursor-pointer"
                                                        whileHover={{ scale: 1.03 }}
                                                        whileTap={{ scale: 0.97 }}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Detail
                                                    </motion.button>
                                                    <motion.button
                                                        className="p-2.5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-600/40 dark:to-indigo-600/40 text-blue-600 dark:text-blue-200 rounded-xl border border-blue-200/50 dark:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20 dark:shadow-lg dark:shadow-blue-500/30 transition-all cursor-pointer"
                                                        onClick={() => navigate(`/konfigurasi/jabatan/${jabatan.jabatanId}/edit`)}
                                                        whileHover={{ scale: 1.15, rotate: 10 }}
                                                        whileTap={{ scale: 0.9 }}
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </motion.button>
                                                    <motion.button
                                                        className="p-2.5 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-600/40 dark:to-pink-600/40 text-red-600 dark:text-pink-200 rounded-xl border border-red-200/50 dark:border-pink-400/50 hover:shadow-lg hover:shadow-red-500/20 dark:shadow-lg dark:shadow-pink-500/30 transition-all cursor-pointer"
                                                        onClick={() => setDeleteTarget(jabatan)}
                                                        whileHover={{ scale: 1.15, rotate: -10 }}
                                                        whileTap={{ scale: 0.9 }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </motion.button>
                                                </motion.div>
                                            </div>
                                        </div>

                                        {/* Bottom Gradient Line */}
                                        <motion.div
                                            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"
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
                </AnimatePresence>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700"
                    >
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Menampilkan {startIndex + 1} - {Math.min(endIndex, totalItems)} dari {totalItems} Jabatan
                        </p>
                        <div className="flex items-center gap-2">
                            <motion.button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400 transition-all"
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
                                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                                                    : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400'}`}
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
                                className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400 transition-all"
                                whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
                                whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                    {deleteTarget && (
                        <motion.div
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteTarget(null)}
                        >
                            <motion.div
                                className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden"
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-6 text-center">
                                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                                        <Trash2 className="w-8 h-8 text-red-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                        Hapus Jabatan?
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                                        Apakah Anda yakin ingin menghapus <strong className="text-slate-800 dark:text-white">{deleteTarget.namaJabatan}</strong>? Tindakan ini tidak dapat dibatalkan.
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
        </div>
    );
}

// Format date to Indonesian format
const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

// Card gradient colors based on index
const getCardGradient = (index: number) => {
    const gradients = [
        'from-blue-500 via-indigo-500 to-purple-600',
        'from-emerald-500 via-teal-500 to-cyan-600',
        'from-orange-500 via-amber-500 to-yellow-500',
        'from-pink-500 via-rose-500 to-red-500',
        'from-violet-500 via-purple-500 to-fuchsia-600',
    ];
    return gradients[index % gradients.length];
};
