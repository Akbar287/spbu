'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Ruler, ArrowLeft, Edit3, Trash2, Tag, Type,
    AlertCircle, Loader2, Sparkles, CheckCircle2, Hash
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { formatDate } from '@/lib/utils';

// Blockchain SatuanUkurTinggi interface
interface BlockchainSatuanUkurTinggi {
    satuanUkurTinggiId: bigint;
    namaSatuan: string;
    singkatan: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// Display SatuanUkurTinggi interface
interface SatuanUkurTinggiData {
    id: number;
    namaSatuan: string;
    singkatan: string;
    createdAt: Date;
    updatedAt: Date;
}

export default function SatuanUkurTinggiShow() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Write contract hook
    const { writeContract, isPending: isWritePending, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle delete success
    React.useEffect(() => {
        if (isWriteSuccess) {
            setIsDeleting(false);
            navigate('/konfigurasi/satuan-ukur-tinggi');
        }
    }, [isWriteSuccess, navigate]);

    // Fetch SatuanUkurTinggi data from blockchain by ID
    const { data: blockchainData, isLoading, error, refetch } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getSatuanUkurTinggiById',
        args: id ? [BigInt(id)] : undefined,
        query: {
            enabled: !!id,
        },
    });

    // Convert blockchain data to display format
    const satuanData = useMemo((): SatuanUkurTinggiData | null => {
        if (!blockchainData) return null;
        const data = blockchainData as BlockchainSatuanUkurTinggi;

        // Check if deleted or not found (id = 0)
        if (data.deleted || Number(data.satuanUkurTinggiId) === 0) return null;

        return {
            id: Number(data.satuanUkurTinggiId),
            namaSatuan: data.namaSatuan,
            singkatan: data.singkatan,
            createdAt: new Date(Number(data.createdAt) * 1000),
            updatedAt: new Date(Number(data.updatedAt) * 1000),
        };
    }, [blockchainData]);

    // Not found state
    const notFound = !isLoading && !error && !satuanData;

    const handleDelete = async () => {
        if (!id) return;

        setIsDeleting(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'deleteSatuanUkurTinggi',
                args: [BigInt(id)],
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
                <div className="absolute inset-0 bg-orange-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat detail Satuan Ukur...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-orange-100/80 dark:bg-slate-900" />
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
                        <div className="flex gap-3">
                            <motion.button
                                onClick={() => navigate('/konfigurasi/satuan-ukur-tinggi')}
                                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Kembali
                            </motion.button>
                            <motion.button
                                onClick={() => refetch()}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Coba Lagi
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Not found state
    if (notFound || !satuanData) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-orange-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4 text-center p-8"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Satuan Ukur Tidak Ditemukan</h2>
                        <p className="text-slate-600 dark:text-slate-400">Data Satuan Ukur dengan ID {id} tidak ditemukan.</p>
                        <motion.button
                            onClick={() => navigate('/konfigurasi/satuan-ukur-tinggi')}
                            className="mt-4 px-6 py-3 bg-orange-600 text-white font-semibold rounded-2xl"
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

    const detailItems = [
        { label: 'ID', value: satuanData.id.toString(), icon: Hash, color: 'orange' },
        { label: 'Nama Satuan', value: satuanData.namaSatuan, icon: Tag, color: 'blue' },
        { label: 'Singkatan', value: satuanData.singkatan, icon: Type, color: 'emerald' },
        { label: 'Dibuat Pada', value: formatDate(satuanData.createdAt), icon: Ruler, color: 'violet' },
    ];

    const colorMap: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
        orange: { bg: 'bg-orange-100', text: 'text-orange-600', darkBg: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-400' },
        blue: { bg: 'bg-blue-100', text: 'text-blue-600', darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-400' },
        emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', darkBg: 'dark:bg-emerald-900/30', darkText: 'dark:text-emerald-400' },
        violet: { bg: 'bg-violet-100', text: 'text-violet-600', darkBg: 'dark:bg-violet-900/30', darkText: 'dark:text-violet-400' },
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-orange-100/80 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-orange-400/20 to-red-400/20 dark:from-orange-600/30 dark:to-red-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-amber-400/15 to-yellow-400/15 dark:from-amber-500/20 dark:to-yellow-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-red-400/15 to-rose-400/15 dark:from-red-500/20 dark:to-rose-500/20 blur-3xl"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/konfigurasi/satuan-ukur-tinggi')}
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
                                className="p-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg shadow-orange-500/30"
                                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Ruler className="w-8 h-8 text-white" />
                            </motion.div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                    Detail Satuan Ukur Tinggi
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">
                                    {satuanData.namaSatuan} ({satuanData.singkatan})
                                </p>
                            </div>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <motion.button
                                onClick={() => navigate(`/konfigurasi/satuan-ukur-tinggi/${satuanData.id}/edit`)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Edit3 className="w-4 h-4" />
                                Edit
                            </motion.button>
                            <motion.button
                                onClick={() => setShowDeleteModal(true)}
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

                {/* Detail Card */}
                <motion.div
                    className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50"
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
                            <Sparkles className="w-4 h-4 text-orange-400/60 dark:text-orange-300/40" />
                        </motion.div>
                    ))}

                    {/* Content */}
                    <div className="relative z-10 p-6 md:p-8 space-y-4">
                        {detailItems.map((item, index) => {
                            const colors = colorMap[item.color];
                            return (
                                <motion.div
                                    key={item.label}
                                    className="flex items-start gap-4 p-4 bg-white/50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700/50"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.05 }}
                                >
                                    <div className={`p-3 ${colors.bg} ${colors.darkBg} rounded-xl`}>
                                        <item.icon className={`w-5 h-5 ${colors.text} ${colors.darkText}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                                            {item.label}
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-slate-700 dark:text-slate-200 break-words">
                                            {item.value}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Status Badge */}
                <motion.div
                    className="mt-6 p-4 bg-emerald-50/80 dark:bg-emerald-900/20 backdrop-blur-sm rounded-2xl border border-emerald-200/50 dark:border-emerald-500/30 flex items-center gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <div>
                        <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Status Aktif</h3>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">Satuan ukur ini dapat digunakan</p>
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
                                    Hapus Satuan Ukur?
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Apakah Anda yakin ingin menghapus <strong>{satuanData.namaSatuan}</strong>? Tindakan ini tidak dapat dibatalkan.
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
