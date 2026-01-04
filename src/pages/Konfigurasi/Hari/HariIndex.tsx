'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Calendar, Hash, Clock, Briefcase,
    Plus, Edit3, Trash2, Eye, ChevronLeft, ChevronRight,
    Grid3X3, List, Loader2, XCircle
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain Interface
interface BlockchainHari {
    hariId: bigint;
    namaHari: string;
    hariKerja: boolean;
    deskripsi: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// Display Interface
interface Hari {
    hariId: number;
    namaHari: string;
    hariKerja: boolean;
    deskripsi: string;
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

export default function HariIndex() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [deleteTarget, setDeleteTarget] = useState<Hari | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch Hari data from blockchain
    const { data: hariResponse, isLoading, refetch: refetchHari } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllHari',
        args: [BigInt(0), BigInt(100)],
    });

    // Write contract for delete
    const { writeContract, isPending: isWritePending, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle delete success
    React.useEffect(() => {
        if (isWriteSuccess) {
            setDeleteTarget(null);
            setIsDeleting(false);
            refetchHari();
        }
    }, [isWriteSuccess, refetchHari]);

    // Process blockchain data
    const { hariList, totalItems } = useMemo(() => {
        if (!hariResponse) return { hariList: [], totalItems: 0 };

        const [rawHari] = hariResponse as [BlockchainHari[], bigint];

        const converted: Hari[] = rawHari
            .filter(h => !h.deleted)
            .map(h => ({
                hariId: Number(h.hariId),
                namaHari: h.namaHari,
                hariKerja: h.hariKerja,
                deskripsi: h.deskripsi,
                createdAt: new Date(Number(h.createdAt) * 1000),
                updatedAt: new Date(Number(h.updatedAt) * 1000),
            }));

        return { hariList: converted, totalItems: converted.length };
    }, [hariResponse]);

    // Pagination logic
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedHari = useMemo(() =>
        hariList.slice(startIndex, endIndex),
        [hariList, startIndex, endIndex]
    );

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'deleteHari',
                args: [BigInt(deleteTarget.hariId)],
            });
        } catch (error) {
            console.error('Error deleting:', error);
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-teal-50/50 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-teal-400/20 to-cyan-400/20 dark:from-teal-600/30 dark:to-cyan-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-emerald-400/15 to-green-400/15 dark:from-emerald-500/20 dark:to-green-500/20 blur-3xl"
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
                                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-800 to-teal-600 dark:from-white dark:to-teal-300 bg-clip-text text-transparent flex items-center gap-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <motion.div
                                    className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-lg shadow-teal-500/30"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Calendar className="w-7 h-7 text-white" />
                                </motion.div>
                                Konfigurasi Hari
                            </motion.h1>
                            <motion.p
                                className="text-slate-500 dark:text-slate-400 mt-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                Kelola konfigurasi hari dan status hari kerja
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
                                    className="px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none cursor-pointer"
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
                                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-teal-100 dark:bg-teal-700 text-teal-600 dark:text-teal-300' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Grid3X3 className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-teal-100 dark:bg-teal-700 text-teal-600 dark:text-teal-300' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <List className="w-5 h-5" />
                                </motion.button>
                            </div>

                            {/* Add Button */}
                            <motion.button
                                onClick={() => navigate('/konfigurasi/hari/create')}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold rounded-2xl shadow-lg shadow-teal-500/30 transition-all"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Plus className="w-5 h-5" />
                                Tambah Hari
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
                            <Loader2 className="w-12 h-12 text-teal-500 animate-spin mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">Memuat data hari...</p>
                        </motion.div>
                    ) : hariList.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center justify-center py-20 text-center"
                        >
                            <div className="w-24 h-24 bg-teal-100 dark:bg-teal-800 rounded-full flex items-center justify-center mb-6">
                                <Calendar className="w-12 h-12 text-teal-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Belum Ada Konfigurasi Hari</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                                Belum ada konfigurasi hari yang ditambahkan. Silakan tambahkan konfigurasi baru untuk memulai.
                            </p>
                            <motion.button
                                onClick={() => navigate('/konfigurasi/hari/create')}
                                className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-2xl shadow-lg shadow-teal-500/30"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Tambah Hari Baru
                            </motion.button>
                        </motion.div>
                    ) : (
                        <motion.div
                            className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'flex flex-col gap-4'}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            key={`${currentPage}-${pageSize}`}
                        >
                            {paginatedHari.map((hari, index) => (
                                <motion.div
                                    key={hari.hariId}
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
                                            background: 'linear-gradient(45deg, rgba(20,184,166,0.3), rgba(6,182,212,0.3), rgba(34,197,94,0.3))',
                                            padding: '2px',
                                        }}
                                    />

                                    {/* Card Content */}
                                    <div className="relative z-10 p-6">
                                        {/* Header with ID and Status */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <motion.div
                                                    className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-lg"
                                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                                    transition={{ duration: 0.5 }}
                                                >
                                                    <Calendar className="w-6 h-6 text-white" />
                                                </motion.div>
                                                <div>
                                                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                                        <Hash className="w-3 h-3" />
                                                        ID: {hari.hariId}
                                                    </span>
                                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                                        {hari.namaHari}
                                                    </h3>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 ${hari.hariKerja
                                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                                }`}>
                                                {hari.hariKerja ? <Briefcase className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {hari.hariKerja ? 'Hari Kerja' : 'Libur'}
                                            </span>
                                        </div>

                                        {/* Description */}
                                        <div className="mb-4">
                                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                                {hari.deskripsi || 'Tidak ada deskripsi'}
                                            </p>
                                        </div>

                                        {/* Timestamp */}
                                        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-4">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>Update: {hari.updatedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                                            <motion.button
                                                onClick={() => navigate(`/konfigurasi/hari/${hari.hariId}`)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 dark:from-teal-500/40 dark:to-cyan-500/40 text-teal-600 dark:text-teal-200 font-medium rounded-xl hover:from-teal-500/20 hover:to-cyan-500/20 transition-all border border-teal-200/50 dark:border-teal-400/50"
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                            >
                                                <Eye className="w-4 h-4" />
                                                Detail
                                            </motion.button>
                                            <motion.button
                                                className="p-2.5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-600/40 dark:to-indigo-600/40 text-blue-600 dark:text-blue-200 rounded-xl border border-blue-200/50 dark:border-blue-400/50 hover:shadow-lg transition-all"
                                                onClick={() => navigate(`/konfigurasi/hari/${hari.hariId}/edit`)}
                                                whileHover={{ scale: 1.15, rotate: 10 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </motion.button>
                                            <motion.button
                                                className="p-2.5 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-600/40 dark:to-pink-600/40 text-red-600 dark:text-pink-200 rounded-xl border border-red-200/50 dark:border-pink-400/50 hover:shadow-lg transition-all"
                                                onClick={() => setDeleteTarget(hari)}
                                                whileHover={{ scale: 1.15, rotate: -10 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </motion.button>
                                        </div>
                                    </div>

                                    {/* Bottom Gradient Line */}
                                    <motion.div
                                        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500"
                                        initial={{ scaleX: 0 }}
                                        whileHover={{ scaleX: 1 }}
                                        transition={{ duration: 0.4, ease: 'easeOut' }}
                                        style={{ transformOrigin: 'left' }}
                                    />
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
                            Menampilkan {startIndex + 1} - {Math.min(endIndex, totalItems)} dari {totalItems} Hari
                        </p>
                        <div className="flex items-center gap-2">
                            <motion.button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
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
                                                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30'
                                                    : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
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
                                className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
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
                                        Hapus Hari?
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                                        Apakah Anda yakin ingin menghapus hari <strong className="text-slate-800 dark:text-white">{deleteTarget.namaHari}</strong>? Tindakan ini tidak dapat dibatalkan.
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
