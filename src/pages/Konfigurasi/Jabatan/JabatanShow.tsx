'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Briefcase, ArrowLeft, Edit3, Trash2, Hash, Clock, FileText,
    AlertCircle, Loader2, Sparkles, CheckCircle2, BarChart2
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
interface JabatanData {
    jabatanId: number;
    levelId: number;
    levelName: string;
    namaJabatan: string;
    keterangan: string;
    createdAt: Date;
    updatedAt: Date;
}

export default function JabatanShow() {
    const navigate = useNavigate();
    const { jabatanId } = useParams<{ jabatanId: string }>();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch Jabatan Data
    const { data: blockchainJabatan, isLoading: isLoadingJabatan, error: errorJabatan } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getJabatanById',
        args: jabatanId ? [BigInt(jabatanId)] : undefined,
        query: {
            enabled: !!jabatanId,
        },
    });

    const levelId = blockchainJabatan ? (blockchainJabatan as BlockchainJabatan).levelId : undefined;

    // Fetch Level Data (to get name)
    const { data: blockchainLevel, isLoading: isLoadingLevel } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getLevelById',
        args: levelId ? [levelId] : undefined,
        query: {
            enabled: !!levelId,
        },
    });

    // Write Contract Hook (Delete)
    const { writeContract, isPending: isWritePending, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle delete success
    useEffect(() => {
        if (isWriteSuccess) {
            setIsDeleting(false);
            navigate('/konfigurasi/jabatan');
        }
    }, [isWriteSuccess, navigate]);

    // Format Data
    const jabatanData = useMemo((): JabatanData | null => {
        if (!blockchainJabatan) return null;
        const jab = blockchainJabatan as BlockchainJabatan;

        if (jab.deleted || Number(jab.jabatanId) === 0) return null;

        let levelName = 'Loading...';
        if (blockchainLevel) {
            const lvl = blockchainLevel as BlockchainLevel;
            levelName = lvl.namaLevel;
        }

        return {
            jabatanId: Number(jab.jabatanId),
            levelId: Number(jab.levelId),
            levelName: levelName,
            namaJabatan: jab.namaJabatan,
            keterangan: jab.keterangan || '-',
            createdAt: new Date(Number(jab.createdAt) * 1000),
            updatedAt: new Date(Number(jab.updatedAt) * 1000),
        };
    }, [blockchainJabatan, blockchainLevel]);

    const isLoading = isLoadingJabatan || (!!levelId && isLoadingLevel);
    const notFound = !isLoading && !errorJabatan && !jabatanData;

    // Format datetime
    const formatDateTime = (date: Date) => {
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleDelete = async () => {
        if (!jabatanId) return;
        setIsDeleting(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'deleteJabatan',
                args: [BigInt(jabatanId)],
            });
        } catch (error) {
            console.error('Error deleting:', error);
            setIsDeleting(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-amber-50/50 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat detail Jabatan...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Not Found state
    if (notFound) {
        return (
            <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-50 dark:bg-slate-900" />
                <div className="relative z-10 text-center max-w-md px-4">
                    <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Data Jabatan Tidak Ditemukan</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">
                        Jabatan dengan ID tersebut tidak ditemukan atau mungkin sudah dihapus.
                    </p>
                    <motion.button
                        onClick={() => navigate('/konfigurasi/jabatan')}
                        className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-2xl shadow-lg shadow-amber-500/30"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Kembali ke Daftar
                    </motion.button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br dark:bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-700 dark:to-slate-700" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-l from-amber-400/20 to-orange-400/20 dark:from-amber-600/20 dark:to-orange-600/20 blur-3xl opacity-50"
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                    className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-red-400/20 to-rose-400/20 dark:from-red-600/20 dark:to-rose-600/20 blur-3xl opacity-50"
                    animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/konfigurasi/jabatan')}
                    className="mb-8 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-5 h-5" />
                    Kembali ke Daftar Jabatan
                </motion.button>

                {jabatanData && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {/* Main Card */}
                        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
                            {/* Card Header with Gradient */}
                            <div className="relative h-48 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 overflow-hidden">
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

                                {/* Icon Overlay */}
                                <div className="absolute -bottom-6 right-10 opacity-10 rotate-12">
                                    <Briefcase className="w-40 h-40 text-white" />
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />

                                <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
                                    <div className="flex items-center gap-6">
                                        <motion.div
                                            className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl"
                                            initial={{ scale: 0, rotate: -20 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', delay: 0.2 }}
                                        >
                                            <Briefcase className="w-10 h-10 text-white" />
                                        </motion.div>
                                        <div>
                                            <motion.div
                                                className="flex items-center gap-3 mb-2"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.3 }}
                                            >
                                                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-white border border-white/30 flex items-center gap-1">
                                                    <Hash className="w-3 h-3" />
                                                    ID: {jabatanData.jabatanId}
                                                </span>
                                                <span className="px-3 py-1 bg-emerald-500/80 backdrop-blur-md rounded-full text-xs font-semibold text-white border border-emerald-400/50 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Aktif
                                                </span>
                                            </motion.div>
                                            <motion.h1
                                                className="text-4xl font-bold text-white drop-shadow-md"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 }}
                                            >
                                                {jabatanData.namaJabatan}
                                            </motion.h1>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Left Column: Info list */}
                                <div className="md:col-span-2 space-y-6">
                                    <motion.div
                                        className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-6 border border-slate-100 dark:border-slate-700"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-600 pb-3">
                                            <FileText className="w-5 h-5 text-amber-500" />
                                            Informasi Detail
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Level</div>
                                                <div className="sm:col-span-2 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                                        <BarChart2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    {jabatanData.levelName}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Keterangan</div>
                                                <div className="sm:col-span-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                                                    {jabatanData.keterangan}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-800">
                                            <div className="text-sm text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-2">
                                                <Clock className="w-4 h-4" /> Dibuat Pada
                                            </div>
                                            <div className="font-semibold text-slate-700 dark:text-slate-200 text-lg">
                                                {formatDateTime(jabatanData.createdAt)}
                                            </div>
                                        </div>
                                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5 border border-amber-100 dark:border-amber-800">
                                            <div className="text-sm text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4" /> Terakhir Update
                                            </div>
                                            <div className="font-semibold text-slate-700 dark:text-slate-200 text-lg">
                                                {formatDateTime(jabatanData.updatedAt)}
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Right Column: Actions */}
                                <div className="space-y-4">
                                    <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 h-full">
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 text-center">Tindakan</h3>
                                        <div className="space-y-3">
                                            <motion.button
                                                onClick={() => navigate(`/konfigurasi/jabatan/${jabatanData.jabatanId}/edit`)}
                                                className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/20"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <Edit3 className="w-5 h-5" />
                                                Edit Data
                                            </motion.button>

                                            <motion.button
                                                onClick={() => setShowDeleteModal(true)}
                                                className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white dark:bg-slate-800 text-red-500 font-semibold rounded-xl border-2 border-red-100 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                                Hapus Data
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                    {showDeleteModal && jabatanData && (
                        <motion.div
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDeleteModal(false)}
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
                                        Apakah Anda yakin ingin menghapus Jabatan <strong className="text-slate-800 dark:text-white">{jabatanData.namaJabatan}</strong>? Tindakan ini tidak dapat dibatalkan.
                                    </p>
                                    <div className="flex gap-3">
                                        <motion.button
                                            onClick={() => setShowDeleteModal(false)}
                                            disabled={isDeleting}
                                            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            Batal
                                        </motion.button>
                                        <motion.button
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg shadow-red-500/30"
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
