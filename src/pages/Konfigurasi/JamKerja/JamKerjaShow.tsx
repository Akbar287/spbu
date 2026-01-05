'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Clock, ArrowLeft, Edit3, Trash2, Hash, FileText,
    AlertCircle, Loader2, Sparkles, CheckCircle2, Fuel, Timer, Coffee, ArrowUpDown, Calendar
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain Interfaces
interface BlockchainJamKerja {
    jamKerjaId: bigint;
    spbuId: bigint;
    namaJamKerja: string;
    jamDatang: bigint;
    jamPulang: bigint;
    jamMulaiIstirahat: bigint;
    jamSelesaiIstirahat: bigint;
    urutan: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainSpbu {
    spbuId: bigint;
    namaSpbu: string;
    deleted: boolean;
}

interface BlockchainHari {
    hariId: bigint;
    namaHari: string;
    hariKerja: boolean;
    deleted: boolean;
}

// Display Interface
interface JamKerjaData {
    jamKerjaId: number;
    spbuId: number;
    spbuName: string;
    namaJamKerja: string;
    jamDatang: string;
    jamPulang: string;
    jamMulaiIstirahat: string;
    jamSelesaiIstirahat: string;
    urutan: number;
    createdAt: Date;
    updatedAt: Date;
}

// Helper: Convert minutes from midnight to HH:MM
const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export default function JamKerjaShow() {
    const navigate = useNavigate();
    const { jamKerjaId } = useParams<{ jamKerjaId: string }>();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch JamKerja Data
    const { data: blockchainJamKerja, isLoading: isLoadingJamKerja, error: errorJamKerja } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getJamKerjaById',
        args: jamKerjaId ? [BigInt(jamKerjaId)] : undefined,
        query: {
            enabled: !!jamKerjaId,
        },
    });

    const spbuId = blockchainJamKerja ? (blockchainJamKerja as BlockchainJamKerja).spbuId : undefined;

    // Fetch SPBU Data (to get name)
    const { data: blockchainSpbu, isLoading: isLoadingSpbu } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getSpbuById',
        args: spbuId ? [spbuId] : undefined,
        query: {
            enabled: !!spbuId,
        },
    });

    // Fetch Hari related to JamKerja
    const { data: hariResponse, isLoading: isLoadingHari } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getHariByJamKerja',
        args: jamKerjaId ? [BigInt(jamKerjaId)] : undefined,
        query: {
            enabled: !!jamKerjaId,
        },
    });

    // Process Hari List
    const hariList = useMemo(() => {
        if (!hariResponse) return [];
        const rawHari = hariResponse as BlockchainHari[];
        return rawHari
            .filter(h => !h.deleted)
            .map(h => ({
                id: Number(h.hariId),
                name: h.namaHari,
                isWorkDay: h.hariKerja
            }));
    }, [hariResponse]);

    // Write Contract Hook (Delete)
    const { writeContract, isPending: isWritePending, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle delete success
    useEffect(() => {
        if (isWriteSuccess) {
            setIsDeleting(false);
            navigate('/konfigurasi/jam-kerja');
        }
    }, [isWriteSuccess, navigate]);

    // Format Data
    const jamKerjaData = useMemo((): JamKerjaData | null => {
        if (!blockchainJamKerja) return null;
        const jk = blockchainJamKerja as BlockchainJamKerja;

        if (jk.deleted || Number(jk.jamKerjaId) === 0) return null;

        let spbuName = 'Loading...';
        if (blockchainSpbu) {
            const spbu = blockchainSpbu as BlockchainSpbu;
            spbuName = spbu.namaSpbu;
        }

        return {
            jamKerjaId: Number(jk.jamKerjaId),
            spbuId: Number(jk.spbuId),
            spbuName: spbuName,
            namaJamKerja: jk.namaJamKerja,
            jamDatang: minutesToTime(Number(jk.jamDatang)),
            jamPulang: minutesToTime(Number(jk.jamPulang)),
            jamMulaiIstirahat: minutesToTime(Number(jk.jamMulaiIstirahat)),
            jamSelesaiIstirahat: minutesToTime(Number(jk.jamSelesaiIstirahat)),
            urutan: Number(jk.urutan),
            createdAt: new Date(Number(jk.createdAt) * 1000),
            updatedAt: new Date(Number(jk.updatedAt) * 1000),
        };
    }, [blockchainJamKerja, blockchainSpbu]);

    const isLoading = isLoadingJamKerja || (!!spbuId && isLoadingSpbu) || isLoadingHari;
    const notFound = !isLoading && !errorJamKerja && !jamKerjaData;

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
        if (!jamKerjaId) return;
        setIsDeleting(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'deleteJamKerja',
                args: [BigInt(jamKerjaId)],
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
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat detail Jam Kerja...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Not found state
    if (notFound || !jamKerjaData) {
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
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Jam Kerja Tidak Ditemukan</h2>
                        <p className="text-slate-600 dark:text-slate-400">Data Jam Kerja dengan ID {jamKerjaId} tidak ditemukan.</p>
                        <motion.button
                            onClick={() => navigate('/konfigurasi/jam-kerja')}
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
        { label: 'ID Jam Kerja', value: jamKerjaData.jamKerjaId.toString(), icon: Hash, color: 'orange' },
        { label: 'Nama Jam Kerja', value: jamKerjaData.namaJamKerja, icon: Clock, color: 'amber' },
        { label: 'SPBU', value: jamKerjaData.spbuName, icon: Fuel, color: 'emerald' },
        { label: 'Jam Datang', value: jamKerjaData.jamDatang, icon: Timer, color: 'green' },
        { label: 'Jam Pulang', value: jamKerjaData.jamPulang, icon: Timer, color: 'red' },
        { label: 'Mulai Istirahat', value: jamKerjaData.jamMulaiIstirahat, icon: Coffee, color: 'blue' },
        { label: 'Selesai Istirahat', value: jamKerjaData.jamSelesaiIstirahat, icon: Coffee, color: 'purple' },
        { label: 'Urutan Shift', value: jamKerjaData.urutan.toString(), icon: ArrowUpDown, color: 'indigo' },
        { label: 'Dibuat', value: formatDateTime(jamKerjaData.createdAt), icon: FileText, color: 'slate' },
        { label: 'Diperbarui', value: formatDateTime(jamKerjaData.updatedAt), icon: FileText, color: 'cyan' },
    ];

    const colorMap: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
        orange: { bg: 'bg-orange-100', text: 'text-orange-600', darkBg: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-400' },
        amber: { bg: 'bg-amber-100', text: 'text-amber-600', darkBg: 'dark:bg-amber-900/30', darkText: 'dark:text-amber-400' },
        emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', darkBg: 'dark:bg-emerald-900/30', darkText: 'dark:text-emerald-400' },
        green: { bg: 'bg-green-100', text: 'text-green-600', darkBg: 'dark:bg-green-900/30', darkText: 'dark:text-green-400' },
        red: { bg: 'bg-red-100', text: 'text-red-600', darkBg: 'dark:bg-red-900/30', darkText: 'dark:text-red-400' },
        blue: { bg: 'bg-blue-100', text: 'text-blue-600', darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-400' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-600', darkBg: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-400' },
        indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', darkBg: 'dark:bg-indigo-900/30', darkText: 'dark:text-indigo-400' },
        slate: { bg: 'bg-slate-100', text: 'text-slate-600', darkBg: 'dark:bg-slate-900/30', darkText: 'dark:text-slate-400' },
        cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', darkBg: 'dark:bg-cyan-900/30', darkText: 'dark:text-cyan-400' },
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-orange-100/80 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-orange-400/20 to-amber-400/20 dark:from-orange-600/30 dark:to-amber-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-yellow-400/15 to-lime-400/15 dark:from-yellow-500/20 dark:to-lime-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-red-400/15 to-pink-400/15 dark:from-red-500/20 dark:to-pink-500/20 blur-3xl"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/konfigurasi/jam-kerja')}
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
                                className="p-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg shadow-orange-500/30"
                                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Clock className="w-8 h-8 text-white" />
                            </motion.div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                    Detail Jam Kerja
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">
                                    {jamKerjaData.namaJamKerja}
                                </p>
                            </div>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <motion.button
                                onClick={() => navigate(`/konfigurasi/jam-kerja/${jamKerjaData.jamKerjaId}/edit`)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl shadow-lg shadow-orange-500/30"
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

                {/* Hari Kerja Section */}
                <motion.div
                    className="mt-6 relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />
                    <div className="relative z-10 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                                <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                                    Hari Kerja
                                </p>
                                <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                                    {hariList.length} Hari Terpilih
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {hariList.length > 0 ? (
                                hariList.map((hari) => (
                                    <motion.span
                                        key={hari.id}
                                        className={`px-4 py-2 rounded-xl font-medium text-sm ${hari.isWorkDay
                                                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30'
                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                            }`}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        {hari.name}
                                    </motion.span>
                                ))
                            ) : (
                                <p className="text-slate-500 dark:text-slate-400 italic">
                                    Tidak ada hari yang dipilih
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Status Badge */}
                <motion.div
                    className="mt-6 p-4 bg-emerald-50/80 dark:bg-emerald-900/20 backdrop-blur-sm rounded-2xl border border-emerald-200/50 dark:border-emerald-500/30 flex items-center gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 }}
                >
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <div>
                        <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Status Aktif</h3>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">Jam kerja ini sedang aktif dan digunakan</p>
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
                                    Hapus Jam Kerja?
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Apakah Anda yakin ingin menghapus <strong>{jamKerjaData.namaJamKerja}</strong>? Tindakan ini tidak dapat dibatalkan.
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
