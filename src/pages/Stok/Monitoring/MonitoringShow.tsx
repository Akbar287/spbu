'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Activity, ArrowLeft, Edit3, Trash2, Hash, Droplet,
    AlertCircle, Loader2, Sparkles, Clock, Database, Eye
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { formatNumber } from '@/lib/utils';

// Blockchain Interfaces
interface BlockchainStokInventoryDombak {
    stokInventoryDombakId: bigint;
    dombakId: bigint;
    namaDombak: string;
    stok: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainMonitoringStokDetailInfo {
    stokInventoryId: bigint;
    produkId: bigint;
    namaProduk: string;
    totalStok: bigint;
    stokInventoryDombakList: BlockchainStokInventoryDombak[];
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// Display Interface
interface StokInventoryData {
    stokInventoryId: number;
    produkId: number;
    namaProduk: string;
    totalStok: number;
    dombakList: {
        stokInventoryDombakId: number;
        dombakId: number;
        namaDombak: string;
        stok: number;
        createdAt: Date;
        updatedAt: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

export default function MonitoringShow() {
    const navigate = useNavigate();
    const { stokId } = useParams<{ stokId: string }>();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch Stok Inventory Detail
    const { data: blockchainData, isLoading, error } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getStokInventoryDetail',
        args: stokId ? [BigInt(stokId)] : undefined,
        query: {
            enabled: !!stokId,
        },
    });

    // Write Contract Hook
    const { writeContract, isPending: isWritePending, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle delete success
    useEffect(() => {
        if (isWriteSuccess) {
            setIsDeleting(false);
            navigate('/stok/pemantauan-stok');
        }
    }, [isWriteSuccess, navigate]);

    // Format Data
    const stokData = useMemo((): StokInventoryData | null => {
        if (!blockchainData) return null;
        const data = blockchainData as BlockchainMonitoringStokDetailInfo;

        if (data.deleted || Number(data.stokInventoryId) === 0) return null;

        return {
            stokInventoryId: Number(data.stokInventoryId),
            produkId: Number(data.produkId),
            namaProduk: data.namaProduk,
            totalStok: Number(data.totalStok) / 100, // scaled x100
            dombakList: data.stokInventoryDombakList
                .filter(d => !d.deleted)
                .map(d => ({
                    stokInventoryDombakId: Number(d.stokInventoryDombakId),
                    dombakId: Number(d.dombakId),
                    namaDombak: d.namaDombak,
                    stok: Number(d.stok) / 100, // scaled x100
                    createdAt: new Date(Number(d.createdAt) * 1000),
                    updatedAt: new Date(Number(d.updatedAt) * 1000),
                })),
            createdAt: new Date(Number(data.createdAt) * 1000),
            updatedAt: new Date(Number(data.updatedAt) * 1000),
        };
    }, [blockchainData]);

    const notFound = !isLoading && !error && !stokData;

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
        if (!stokId) return;
        setIsDeleting(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'deleteStokInventory',
                args: [BigInt(stokId)],
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
                <div className="absolute inset-0 bg-blue-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat detail Stok Inventory...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Not found state
    if (notFound || !stokData) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4 text-center p-8"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Stok Inventory Tidak Ditemukan</h2>
                        <p className="text-slate-600 dark:text-slate-400">Data Stok Inventory dengan ID {stokId} tidak ditemukan.</p>
                        <motion.button
                            onClick={() => navigate('/stok/pemantauan-stok')}
                            className="mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-2xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Kembali ke Daftar
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-blue-100/80 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-blue-400/20 to-indigo-400/20 dark:from-blue-600/30 dark:to-indigo-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-cyan-400/15 to-blue-400/15 dark:from-cyan-500/20 dark:to-blue-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/stok/pemantauan-stok')}
                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm mt-32"
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
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <motion.div
                                className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30"
                                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Activity className="w-8 h-8 text-white" />
                            </motion.div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                    Detail Stok Inventory
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">
                                    {stokData.namaProduk}
                                </p>
                            </div>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <motion.button
                                onClick={() => navigate(`/stok/pemantauan-stok/${stokData.stokInventoryId}/riwayat`)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/30"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Eye className="w-4 h-4" />
                                Riwayat
                            </motion.button>
                            <motion.button
                                onClick={() => navigate(`/stok/pemantauan-stok/${stokData.stokInventoryId}/edit`)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Edit3 className="w-4 h-4" />
                                Edit
                            </motion.button>
                            <motion.button
                                onClick={() => setShowDeleteModal(true)}
                                disabled
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium rounded-xl shadow-lg shadow-red-500/30"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Trash2 className="w-4 h-4" />
                                Hapus
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Summary Cards */}
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <div className="p-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
                            <Hash className="w-4 h-4" />
                            ID
                        </div>
                        <p className="font-bold text-slate-800 dark:text-white text-xl">{stokData.stokInventoryId}</p>
                    </div>
                    <div className="p-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
                            <Droplet className="w-4 h-4" />
                            Produk ID
                        </div>
                        <p className="font-bold text-slate-800 dark:text-white text-xl">{stokData.produkId}</p>
                    </div>
                    <div className="p-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
                            <Database className="w-4 h-4" />
                            Jumlah Dombak
                        </div>
                        <p className="font-bold text-slate-800 dark:text-white text-xl">{stokData.dombakList.length}</p>
                    </div>
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 backdrop-blur-xl rounded-xl border border-emerald-200/50 dark:border-emerald-700/50">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm mb-1">
                            <Activity className="w-4 h-4" />
                            Total Stok
                        </div>
                        <p className="font-bold text-emerald-700 dark:text-emerald-300 text-xl">{formatNumber(stokData.totalStok)} L</p>
                    </div>
                </motion.div>

                {/* Dombak List Card */}
                <motion.div
                    className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {/* Glassmorphism Background */}
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                    {/* Animated Sparkles */}
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute pointer-events-none"
                            style={{ top: `${15 + (i * 18)}%`, left: `${10 + (i * 20)}%` }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0], rotate: [0, 180] }}
                            transition={{ duration: 3, repeat: Infinity, delay: i * 0.8, ease: 'easeInOut' }}
                        >
                            <Sparkles className="w-4 h-4 text-blue-400/60 dark:text-blue-300/40" />
                        </motion.div>
                    ))}

                    {/* Content */}
                    <div className="relative z-10 p-6 md:p-8">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Droplet className="w-5 h-5 text-blue-500" />
                            Distribusi Stok per Dombak
                        </h2>

                        {stokData.dombakList.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
                                <Droplet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Tidak ada dombak terdaftar
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {stokData.dombakList.map((dombak, index) => (
                                    <motion.div
                                        key={dombak.stokInventoryDombakId}
                                        className="p-4 bg-white/50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700/50"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + index * 0.05 }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                                                    <Droplet className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-800 dark:text-white">
                                                        {dombak.namaDombak}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        ID: {dombak.dombakId}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatNumber(dombak.stok)} <span className="text-sm font-normal">L</span>
                                                </p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500">
                                                    Update: {dombak.updatedAt.toLocaleDateString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Total Summary */}
                                <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200/50 dark:border-emerald-500/30">
                                    <div className="flex items-center justify-between">
                                        <span className="text-emerald-700 dark:text-emerald-300 font-medium">Total Keseluruhan</span>
                                        <span className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                                            {formatNumber(stokData.totalStok)} L
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Timestamps Card */}
                <motion.div
                    className="p-4 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-700/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Dibuat</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDateTime(stokData.createdAt)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Diperbarui</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDateTime(stokData.updatedAt)}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
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
                                    Hapus Stok Inventory?
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Apakah Anda yakin ingin menghapus stok inventory untuk <strong>{stokData.namaProduk}</strong>? Tindakan ini tidak dapat dibatalkan.
                                </p>
                                <div className="flex gap-3">
                                    <motion.button
                                        onClick={() => setShowDeleteModal(false)}
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
