'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Droplets, Plus, Grid3X3, List, ChevronLeft, ChevronRight,
    Eye, Edit3, Trash2, Loader2, AlertCircle, Tag, Hash,
    ArrowLeft
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain SatuanUkurVolume interface
interface BlockchainSatuanUkurVolume {
    satuanUkurVolumeId: bigint;
    namaSatuan: string;
    singkatan: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// Display SatuanUkurVolume interface
interface SatuanUkurVolume {
    id: number;
    namaSatuan: string;
    singkatan: string;
    createdAt: Date;
}

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
} as const;

const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } }
} as const;

const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
} as const;

export default function SatuanUkurVolumeIndex() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [deleteTarget, setDeleteTarget] = useState<SatuanUkurVolume | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch total count for pagination
    const { data: totalCountResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getCountSatuanUkurVolume',
        args: [],
    });

    // Fetch Data from blockchain with proper offset/limit
    const offset = (currentPage - 1) * pageSize;
    const { data: listResponse, isLoading, error, refetch } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllSatuanUkurVolume',
        args: [BigInt(offset), BigInt(pageSize)],
    });

    // Write contract hook
    const { writeContract, isPending: isWritePending, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle delete success
    React.useEffect(() => {
        if (isWriteSuccess) {
            setDeleteTarget(null);
            setIsDeleting(false);
            refetch();
        }
    }, [isWriteSuccess, refetch]);

    // Convert blockchain data to display format
    const items = useMemo(() => {
        if (!listResponse) return [];

        const rawList = Array.isArray(listResponse) ? listResponse : [];

        return (rawList as BlockchainSatuanUkurVolume[])
            .filter(item => !item.deleted)
            .map(item => ({
                id: Number(item.satuanUkurVolumeId),
                namaSatuan: item.namaSatuan,
                singkatan: item.singkatan,
                createdAt: new Date(Number(item.createdAt) * 1000),
            }));
    }, [listResponse]);

    // Calculate pagination values
    const totalItems = totalCountResponse ? Number(totalCountResponse) : 0;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = offset + 1;
    const endIndex = Math.min(offset + items.length, totalItems);

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'deleteSatuanUkurVolume',
                args: [BigInt(deleteTarget.id)],
            });
        } catch (error) {
            console.error('Error deleting:', error);
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-blue-100/80 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-blue-400/20 to-cyan-400/20 dark:from-blue-600/30 dark:to-cyan-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-teal-400/15 to-emerald-400/15 dark:from-teal-500/20 dark:to-emerald-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-400/15 to-blue-400/15 dark:from-indigo-500/20 dark:to-blue-500/20 blur-3xl"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8">
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
                                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent flex items-center gap-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <motion.div
                                    className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg shadow-blue-500/30"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Droplets className="w-7 h-7 text-white" />
                                </motion.div>
                                Satuan Ukur Volume
                            </motion.h1>
                            <motion.p
                                className="text-slate-500 dark:text-slate-400 mt-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                Kelola satuan pengukuran volume (L, mL, dll)
                            </motion.p>
                        </div>

                        {/* Action Buttons */}
                        <motion.div
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
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

                            <motion.button
                                onClick={() => navigate('/konfigurasi/satuan-ukur-volume/create')}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 transition-all"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Plus className="w-5 h-5" />
                                Tambah Satuan
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Loading State */}
                {isLoading && (
                    <motion.div
                        className="flex flex-col items-center justify-center py-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                        <p className="text-slate-600 dark:text-slate-400">Memuat data...</p>
                    </motion.div>
                )}

                {/* Error State */}
                {error && (
                    <motion.div
                        className="flex flex-col items-center justify-center py-20"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Gagal Memuat Data</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">{error.message}</p>
                        <motion.button
                            onClick={() => refetch()}
                            className="mt-4 px-6 py-2 bg-blue-600 text-white font-medium rounded-xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Coba Lagi
                        </motion.button>
                    </motion.div>
                )}

                {/* Empty State */}
                {!isLoading && !error && items.length === 0 && (
                    <motion.div
                        className="flex flex-col items-center justify-center py-20"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="p-6 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                            <Droplets className="w-12 h-12 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Belum Ada Data</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">Mulai dengan menambahkan satuan ukur volume pertama</p>
                        <motion.button
                            onClick={() => navigate('/konfigurasi/satuan-ukur-volume/create')}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-2xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Plus className="w-5 h-5" />
                            Tambah Satuan
                        </motion.button>
                    </motion.div>
                )}

                {/* Grid/List View */}
                {!isLoading && !error && items.length > 0 && (
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
                        {items.map((item, index) => (
                            <motion.div
                                key={item.id}
                                variants={cardVariants}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500"
                            >
                                {/* Card Background */}
                                <div className="absolute inset-0 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl" />

                                {/* Animated Gradient Border */}
                                <motion.div
                                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                    style={{
                                        background: 'linear-gradient(45deg, rgba(59,130,246,0.3), rgba(6,182,212,0.3), rgba(59,130,246,0.3))',
                                        backgroundSize: '300% 300%',
                                    }}
                                    animate={{
                                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                                    }}
                                    transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                                />

                                <div className="absolute inset-[1px] rounded-3xl bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl" />

                                {/* Card Content */}
                                <div className="relative z-10">
                                    {/* Header */}
                                    <div className="relative h-28 overflow-hidden rounded-t-3xl">
                                        <motion.div
                                            className="absolute inset-0"
                                            style={{
                                                background: `linear-gradient(135deg, 
                                                    hsl(${200 + index * 10}, 80%, 60%) 0%, 
                                                    hsl(${180 + index * 10}, 70%, 55%) 100%)`,
                                            }}
                                        />

                                        {/* ID Badge */}
                                        <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full">
                                            <span className="text-xs font-bold text-white flex items-center gap-1">
                                                <Hash className="w-3 h-3" />
                                                {item.id}
                                            </span>
                                        </div>

                                        <div className="absolute bottom-4 left-4 right-4 text-white">
                                            <h3 className="text-xl font-bold truncate flex items-center gap-2">
                                                <Tag className="w-5 h-5" />
                                                {item.namaSatuan}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="p-5">
                                        <div className="mb-6">
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Singkatan</p>
                                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{item.singkatan}</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center gap-2">
                                            <motion.button
                                                onClick={() => navigate(`/konfigurasi/satuan-ukur-volume/${item.id}`)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 font-medium rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                            >
                                                <Eye className="w-4 h-4" />
                                                Detail
                                            </motion.button>
                                            <motion.button
                                                className="p-2.5 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-300 rounded-xl hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors"
                                                onClick={() => navigate(`/konfigurasi/satuan-ukur-volume/${item.id}/edit`)}
                                                whileHover={{ scale: 1.15 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </motion.button>
                                            <motion.button
                                                className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                                onClick={() => setDeleteTarget(item)}
                                                whileHover={{ scale: 1.15 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </motion.button>
                                        </div>
                                    </div>
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
                            Menampilkan {startIndex} - {endIndex} dari {totalItems} Satuan
                        </p>
                        <div className="flex items-center gap-2">
                            <motion.button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500 transition-all"
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
                                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                                                    : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400'}`}
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
                                className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500 transition-all"
                                whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
                                whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Delete Modal */}
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
                                <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                                    <Trash2 className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                    Hapus Satuan Ukur?
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Apakah Anda yakin ingin menghapus <strong>{deleteTarget.namaSatuan}</strong>? Tindakan ini tidak dapat dibatalkan.
                                </p>
                                <div className="flex gap-3">
                                    <motion.button
                                        onClick={() => setDeleteTarget(null)}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Batal
                                    </motion.button>
                                    <motion.button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-2xl disabled:opacity-70"
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
