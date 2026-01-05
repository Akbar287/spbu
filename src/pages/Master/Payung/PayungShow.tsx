'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Container, ArrowLeft, Edit3, Trash2, Hash,
    AlertCircle, Loader2, Sparkles, CheckCircle2,
    CheckCircle, XCircle, Umbrella, Clock, Building2
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain Interfaces
interface BlockchainPayung {
    payungId: bigint;
    namaPayung: string;
    aktif: boolean;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainDombak {
    dombakId: bigint;
    spbuId: bigint;
    namaDombak: string;
    aktif: boolean;
    deleted: boolean;
}

interface BlockchainSpbu {
    spbuId: bigint;
    namaSpbu: string;
    deleted: boolean;
}

// Display Interface
interface PayungData {
    payungId: number;
    namaPayung: string;
    aktif: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface DombakDisplay {
    id: number;
    name: string;
    spbuName: string;
}

export default function PayungShow() {
    const navigate = useNavigate();
    const { payungId } = useParams<{ payungId: string }>();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch Payung Data
    const { data: blockchainPayung, isLoading: isLoadingPayung, error: errorPayung } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getPayungById',
        args: payungId ? [BigInt(payungId)] : undefined,
        query: {
            enabled: !!payungId,
        },
    });

    // Fetch Related Dombak IDs
    const { data: relatedDombakIds } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getDombakByPayungId',
        args: payungId ? [BigInt(payungId)] : undefined,
        query: {
            enabled: !!payungId,
        },
    });

    // Fetch All Dombak for mapping
    const { data: allDombakData } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllDombak',
        args: [BigInt(0), BigInt(100)], // Assuming max 100 for now or implement better caching
    });

    // Fetch All SPBU for mapping
    const { data: allSpbuData } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllSpbu',
        args: [BigInt(0), BigInt(100)],
    });

    // Write Contract Hook
    const { writeContract, isPending: isWritePending, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle delete success
    useEffect(() => {
        if (isWriteSuccess && isDeleting) {
            setIsDeleting(false);
            navigate('/master/payung');
        }
    }, [isWriteSuccess, isDeleting, navigate]);

    // Format Data
    const payungData = useMemo((): PayungData | null => {
        if (!blockchainPayung) return null;
        const p = blockchainPayung as BlockchainPayung;

        if (p.deleted || Number(p.payungId) === 0) return null;

        return {
            payungId: Number(p.payungId),
            namaPayung: p.namaPayung,
            aktif: p.aktif,
            createdAt: new Date(Number(p.createdAt) * 1000),
            updatedAt: new Date(Number(p.updatedAt) * 1000),
        };
    }, [blockchainPayung]);

    // Map Related Dombaks
    const relatedDombaks = useMemo((): DombakDisplay[] => {
        if (!relatedDombakIds || !allDombakData || !allSpbuData) return [];

        const dombakIds = (relatedDombakIds as bigint[]).map(id => Number(id));
        const [rawDombak] = allDombakData as [BlockchainDombak[], bigint];
        const [rawSpbu] = allSpbuData as [BlockchainSpbu[], bigint];

        // Create SPBU Map
        const spbuMap = new Map<number, string>();
        rawSpbu.forEach(s => {
            if (!s.deleted) spbuMap.set(Number(s.spbuId), s.namaSpbu);
        });

        // Create Dombak Map
        const dombakMap = new Map<number, { name: string, spbuId: number }>();
        rawDombak.forEach(d => {
            dombakMap.set(Number(d.dombakId), { name: d.namaDombak, spbuId: Number(d.spbuId) });
        });

        return dombakIds.map(id => {
            const d = dombakMap.get(id);
            if (!d) return null;
            return {
                id,
                name: d.name,
                spbuName: spbuMap.get(d.spbuId) || 'Unknown SPBU'
            };
        }).filter((d): d is DombakDisplay => d !== null);

    }, [relatedDombakIds, allDombakData, allSpbuData]);

    const isLoading = isLoadingPayung;
    const notFound = !isLoading && !errorPayung && !payungData;

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
        if (!payungId) return;
        setIsDeleting(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'deletePayung',
                args: [BigInt(payungId)],
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
                <div className="absolute inset-0 bg-indigo-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat detail Payung...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Not found state
    if (notFound || !payungData) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4 text-center p-8"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Payung Tidak Ditemukan</h2>
                        <p className="text-slate-600 dark:text-slate-400">Data Payung dengan ID {payungId} tidak ditemukan.</p>
                        <motion.button
                            onClick={() => navigate('/master/payung')}
                            className="mt-4 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-2xl"
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
        { label: 'ID Payung', value: payungData.payungId.toString(), icon: Hash, color: 'indigo' },
        { label: 'Nama Payung', value: payungData.namaPayung, icon: Umbrella, color: 'purple' },
        { label: 'Dibuat', value: formatDateTime(payungData.createdAt), icon: Clock, color: 'slate' },
        { label: 'Diperbarui', value: formatDateTime(payungData.updatedAt), icon: Clock, color: 'gray' },
    ];

    const colorMap: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
        indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', darkBg: 'dark:bg-indigo-900/30', darkText: 'dark:text-indigo-400' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-600', darkBg: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-400' },
        slate: { bg: 'bg-slate-100', text: 'text-slate-600', darkBg: 'dark:bg-slate-900/30', darkText: 'dark:text-slate-400' },
        gray: { bg: 'bg-gray-100', text: 'text-gray-600', darkBg: 'dark:bg-gray-900/30', darkText: 'dark:text-gray-400' },
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-indigo-100/80 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-indigo-400/20 to-purple-400/20 dark:from-indigo-600/30 dark:to-purple-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-blue-400/15 to-cyan-400/15 dark:from-blue-500/20 dark:to-cyan-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/master/payung')}
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
                                className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30"
                                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Umbrella className="w-8 h-8 text-white" />
                            </motion.div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                    Detail Payung
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">
                                    {payungData.namaPayung}
                                </p>
                            </div>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <motion.button
                                onClick={() => navigate(`/master/payung/${payungData.payungId}/edit`)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/30"
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

                {/* Status Badge */}
                <motion.div
                    className={`mb-6 p-4 backdrop-blur-sm rounded-2xl border flex items-center gap-3 ${payungData.aktif
                        ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-500/30'
                        : 'bg-red-50/80 dark:bg-red-900/20 border-red-200/50 dark:border-red-500/30'
                        }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    {payungData.aktif ? (
                        <>
                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                            <div>
                                <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Payung Aktif</h3>
                                <p className="text-sm text-emerald-600 dark:text-emerald-400">Payung ini sedang aktif digunakan</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <XCircle className="w-6 h-6 text-red-500" />
                            <div>
                                <h3 className="text-sm font-semibold text-red-700 dark:text-red-300">Tidak Aktif</h3>
                                <p className="text-sm text-red-600 dark:text-red-400">Payung ini sedang dinonaktifkan</p>
                            </div>
                        </>
                    )}
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
                            <Sparkles className="w-4 h-4 text-indigo-400/60 dark:text-indigo-300/40" />
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

                {/* Related Dombaks Card */}
                <motion.div
                    className="mt-6 relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />
                    <div className="relative z-10 p-6 md:p-8">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Container className="w-5 h-5 text-indigo-500" />
                            Dombak Terhubung
                        </h3>

                        {relatedDombaks.length === 0 ? (
                            <p className="text-slate-500 dark:text-slate-400 italic">
                                Belum ada dombak yang terhubung dengan payung ini.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {relatedDombaks.map((dombak, index) => (
                                    <motion.div
                                        key={dombak.id}
                                        className="p-4 bg-white/50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700/50"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.4 + index * 0.1 }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                                <Container className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-700 dark:text-slate-200">
                                                    {dombak.name}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                                    <Building2 className="w-3 h-3" />
                                                    {dombak.spbuName}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
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
                                    Hapus Payung?
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Apakah Anda yakin ingin menghapus <strong>{payungData.namaPayung}</strong>? Tindakan ini tidak dapat dibatalkan.
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
