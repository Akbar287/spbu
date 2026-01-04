'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Calendar, ArrowLeft, Edit3, Trash2, Hash, Briefcase,
    AlertCircle, Loader2, Sparkles, Clock, CheckCircle2, XCircle, FileText
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain Hari interface
interface BlockchainHari {
    hariId: bigint;
    namaHari: string;
    hariKerja: boolean;
    deskripsi: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// Display interface
interface HariData {
    hariId: number;
    namaHari: string;
    hariKerja: boolean;
    deskripsi: string;
    createdAt: Date;
    updatedAt: Date;
}

export default function HariShow() {
    const navigate = useNavigate();
    const { hariId } = useParams<{ hariId: string }>();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Write contract hook
    const { writeContract, isPending: isWritePending, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle delete success
    React.useEffect(() => {
        if (isWriteSuccess) {
            setIsDeleting(false);
            navigate('/konfigurasi/hari');
        }
    }, [isWriteSuccess, navigate]);

    // Fetch Hari data from blockchain by ID
    const { data: blockchainHari, isLoading, error } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getHariById',
        args: hariId ? [BigInt(hariId)] : undefined,
        query: {
            enabled: !!hariId,
        },
    });

    // Convert blockchain data to display format
    const hariData = useMemo((): HariData | null => {
        if (!blockchainHari) return null;
        const hari = blockchainHari as BlockchainHari;

        // Check if deleted or not found
        if (hari.deleted || Number(hari.hariId) === 0) return null;

        return {
            hariId: Number(hari.hariId),
            namaHari: hari.namaHari,
            hariKerja: hari.hariKerja,
            deskripsi: hari.deskripsi,
            createdAt: new Date(Number(hari.createdAt) * 1000),
            updatedAt: new Date(Number(hari.updatedAt) * 1000),
        };
    }, [blockchainHari]);

    // Not found state
    const notFound = !isLoading && !error && !hariData;

    const handleDelete = async () => {
        if (!hariId) return;

        setIsDeleting(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'deleteHari',
                args: [BigInt(hariId)],
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
                <div className="absolute inset-0 bg-teal-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat data hari...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Not found state
    if (notFound) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-teal-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-6 text-center px-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="w-24 h-24 bg-teal-100 dark:bg-teal-800 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-12 h-12 text-teal-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Hari Tidak Ditemukan</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md">
                            Hari dengan ID <strong>#{hariId}</strong> tidak ditemukan atau telah dihapus.
                        </p>
                        <motion.button
                            onClick={() => navigate('/konfigurasi/hari')}
                            className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-2xl shadow-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Kembali ke Daftar Hari
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-teal-100/80 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-teal-400/20 to-cyan-400/20 dark:from-teal-600/30 dark:to-cyan-600/30 blur-3xl"
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-emerald-400/15 to-green-400/15 dark:from-emerald-500/20 dark:to-green-500/20 blur-3xl"
                    animate={{
                        x: [0, -80, 0],
                        y: [0, -60, 0],
                        scale: [1.2, 1, 1.2],
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/konfigurasi/hari')}
                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </motion.button>

                {hariData && (
                    <>
                        {/* Header Card */}
                        <motion.div
                            className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-600" />
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                            {/* Sparkles */}
                            <motion.div
                                className="absolute top-[10%] right-[15%] pointer-events-none"
                                animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                            >
                                <Sparkles className="w-4 h-4 text-white/50" />
                            </motion.div>

                            <div className="relative z-10 p-8">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <motion.div
                                            className="p-4 bg-white/20 backdrop-blur-lg rounded-2xl"
                                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <Calendar className="w-10 h-10 text-white" />
                                        </motion.div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Hash className="w-4 h-4 text-white/60" />
                                                <span className="text-white/60 text-sm">ID: {hariData.hariId}</span>
                                            </div>
                                            <h1 className="text-2xl md:text-3xl font-bold text-white">
                                                {hariData.namaHari}
                                            </h1>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${hariData.hariKerja
                                        ? 'bg-emerald-500/20 text-emerald-100'
                                        : 'bg-orange-500/20 text-orange-100'
                                        }`}>
                                        {hariData.hariKerja ? (
                                            <Briefcase className="w-5 h-5" />
                                        ) : (
                                            <XCircle className="w-5 h-5" />
                                        )}
                                        <span className="font-semibold">{hariData.hariKerja ? 'Hari Kerja' : 'Hari Libur'}</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-white/20">
                                    <motion.button
                                        onClick={() => navigate(`/konfigurasi/hari/${hariData.hariId}/edit`)}
                                        className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold rounded-xl transition-colors"
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        Edit Hari
                                    </motion.button>
                                    <motion.button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="flex items-center gap-2 px-6 py-3 bg-red-500/30 hover:bg-red-500/50 backdrop-blur-sm text-white font-semibold rounded-xl transition-colors"
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Hapus
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Details Card */}
                        <motion.div
                            className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />
                            <div className="relative z-10 p-6 md:p-8">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-teal-500" />
                                    Detail Hari
                                </h2>

                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Nama Hari</p>
                                        <p className="text-lg font-semibold text-slate-800 dark:text-white">
                                            {hariData.namaHari}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Status</p>
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${hariData.hariKerja
                                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                            }`}>
                                            {hariData.hariKerja ? <Briefcase className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                            {hariData.hariKerja ? 'Hari Kerja' : 'Hari Libur'}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Deskripsi</p>
                                        <p className="text-slate-800 dark:text-white">
                                            {hariData.deskripsi || 'Tidak ada deskripsi'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Metadata Card */}
                        <motion.div
                            className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />
                            <div className="relative z-10 p-6 md:p-8">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-teal-500" />
                                    Informasi Waktu
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Dibuat pada</p>
                                        <p className="text-lg font-semibold text-slate-800 dark:text-white">
                                            {hariData.createdAt.toLocaleDateString('id-ID', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Terakhir diperbarui</p>
                                        <p className="text-lg font-semibold text-slate-800 dark:text-white">
                                            {hariData.updatedAt.toLocaleDateString('id-ID', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
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
                                    Hapus Hari?
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Apakah Anda yakin ingin menghapus hari <strong className="text-slate-800 dark:text-white">{hariData?.namaHari}</strong>? Tindakan ini tidak dapat dibatalkan.
                                </p>
                                <div className="flex gap-3">
                                    <motion.button
                                        onClick={() => setShowDeleteModal(false)}
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
