'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    BarChart2, ArrowLeft, Edit3, Trash2, Hash, Clock, FileText,
    AlertCircle, Loader2, Sparkles, CheckCircle2, Layers
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain Interfaces
interface BlockchainLevel {
    levelId: bigint;
    divisiId: bigint;
    namaLevel: string;
    keterangan: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainDivisi {
    divisiId: bigint;
    namaDivisi: string;
    deleted: boolean;
}

// Display Interface
interface LevelData {
    levelId: number;
    divisiId: number;
    divisiName: string;
    namaLevel: string;
    keterangan: string;
    createdAt: Date;
    updatedAt: Date;
}

export default function LevelShow() {
    const navigate = useNavigate();
    const { levelId } = useParams<{ levelId: string }>();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch Level Data
    const { data: blockchainLevel, isLoading: isLoadingLevel, error: errorLevel } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getLevelById',
        args: levelId ? [BigInt(levelId)] : undefined,
        query: {
            enabled: !!levelId,
        },
    });

    const divisiId = blockchainLevel ? (blockchainLevel as BlockchainLevel).divisiId : undefined;

    // Fetch Divisi Data (to get name)
    const { data: blockchainDivisi, isLoading: isLoadingDivisi } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getDivisiById',
        args: divisiId ? [divisiId] : undefined,
        query: {
            enabled: !!divisiId,
        },
    });

    // Write Contract Hook (Delete)
    const { writeContract, isPending: isWritePending, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle delete success
    useEffect(() => {
        if (isWriteSuccess) {
            setIsDeleting(false);
            navigate('/konfigurasi/level');
        }
    }, [isWriteSuccess, navigate]);

    // Format Data
    const levelData = useMemo((): LevelData | null => {
        if (!blockchainLevel) return null;
        const lev = blockchainLevel as BlockchainLevel;

        if (lev.deleted || Number(lev.levelId) === 0) return null;

        let divisiName = 'Loading...';
        if (blockchainDivisi) {
            const div = blockchainDivisi as BlockchainDivisi;
            divisiName = div.namaDivisi;
        }

        return {
            levelId: Number(lev.levelId),
            divisiId: Number(lev.divisiId),
            divisiName: divisiName,
            namaLevel: lev.namaLevel,
            keterangan: lev.keterangan || '-',
            createdAt: new Date(Number(lev.createdAt) * 1000),
            updatedAt: new Date(Number(lev.updatedAt) * 1000),
        };
    }, [blockchainLevel, blockchainDivisi]);

    const isLoading = isLoadingLevel || (!!divisiId && isLoadingDivisi);
    const notFound = !isLoading && !errorLevel && !levelData;

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
        if (!levelId) return;
        setIsDeleting(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'deleteLevel',
                args: [BigInt(levelId)],
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
                <div className="absolute inset-0 bg-purple-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat detail Level...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Not Found state
    if (notFound) {
        return (
            <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-300 to-pink-100 via-green-200 dark:bg-slate-900" />
                <div className="relative z-10 text-center max-w-md px-4">
                    <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Data Level Tidak Ditemukan</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">
                        Level dengan ID tersebut tidak ditemukan atau mungkin sudah dihapus.
                    </p>
                    <motion.button
                        onClick={() => navigate('/konfigurasi/level')}
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30"
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
            <div className="absolute inset-0 bg-gradient-to-br from-purple-300 to-pink-100 via-green-200 dark:bg-gradient-to-br dark:from-purple-900 dark:to-pink-900 dark:via-green-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-l from-purple-400/20 to-pink-400/20 dark:from-purple-600/20 dark:to-pink-600/20 blur-3xl opacity-50"
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                    className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-indigo-400/20 to-blue-400/20 dark:from-indigo-600/20 dark:to-blue-600/20 blur-3xl opacity-50"
                    animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/konfigurasi/level')}
                    className="mb-8 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-5 h-5" />
                    Kembali ke Daftar Level
                </motion.button>

                {levelData && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {/* Main Card */}
                        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
                            {/* Card Header with Gradient */}
                            <div className="relative h-48 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 overflow-hidden">
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

                                {/* Icon Overlay */}
                                <div className="absolute -bottom-6 right-10 opacity-10 rotate-12">
                                    <BarChart2 className="w-40 h-40 text-white" />
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
                                            <BarChart2 className="w-10 h-10 text-white" />
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
                                                    ID: {levelData.levelId}
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
                                                {levelData.namaLevel}
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
                                            <FileText className="w-5 h-5 text-blue-500" />
                                            Informasi Detail
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Nama Divisi</div>
                                                <div className="sm:col-span-2 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                                        <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    {levelData.divisiName}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Keterangan</div>
                                                <div className="sm:col-span-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                                                    {levelData.keterangan}
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
                                                {formatDateTime(levelData.createdAt)}
                                            </div>
                                        </div>
                                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-5 border border-purple-100 dark:border-purple-800">
                                            <div className="text-sm text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4" /> Terakhir Update
                                            </div>
                                            <div className="font-semibold text-slate-700 dark:text-slate-200 text-lg">
                                                {formatDateTime(levelData.updatedAt)}
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
                                                onClick={() => navigate(`/konfigurasi/level/${levelData.levelId}/edit`)}
                                                className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20"
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
                    {showDeleteModal && levelData && (
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
                                        Hapus Level?
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                                        Apakah Anda yakin ingin menghapus Level <strong className="text-slate-800 dark:text-white">{levelData.namaLevel}</strong>? Tindakan ini tidak dapat dibatalkan.
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
