'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Truck, ArrowLeft, Calendar, Package, Clock, Loader2,
    AlertCircle, CheckCircle, Droplet, Hash, FileText, Car, MessageSquare
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain interfaces
interface BlockchainProdukView {
    produkId: bigint;
    namaProduk: string;
    totalJumlah: bigint;
    totalPembelian: bigint;
}

interface BlockchainMs2View {
    ms2Id: bigint;
    tanggal: bigint;
    konfirmasiBy: string;
    produk: BlockchainProdukView[];
    totalProduk: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// Display interfaces
interface ProdukItem {
    produkId: number;
    namaProduk: string;
    totalJumlah: number;
}

interface Ms2Detail {
    ms2Id: number;
    tanggal: Date;
    konfirmasiBy: string;
    produk: ProdukItem[];
    totalProduk: number;
    createdAt: Date;
}

// Format functions
const formatTanggal = (date: Date): string => {
    return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
};

const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('id-ID').format(value);
};

// Animation variants
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

export default function Ms2PengirimanShow() {
    const navigate = useNavigate();
    const { ms2Id } = useParams<{ ms2Id: string }>();
    const ms2IdNumber = ms2Id ? parseInt(ms2Id, 10) : 0;

    // Form state
    const [nomorDo, setNomorDo] = useState('');
    const [nomorPolisi, setNomorPolisi] = useState('');
    const [catatan, setCatatan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Fetch Ms2 data - use getAllMs2 and filter by ID
    const { data: ms2Response, isLoading, error, refetch } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllMs2',
        args: [BigInt(0), BigInt(100)],
    });

    // Write contract hook
    const { writeContract, isPending: isWritePending, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle write success
    React.useEffect(() => {
        if (isWriteSuccess) {
            setShowSuccess(true);
            setTimeout(() => {
                navigate('/procurement/ms2/pengiriman');
            }, 2000);
        }
    }, [isWriteSuccess, navigate]);

    // Process Ms2 data
    const ms2Detail = useMemo((): Ms2Detail | null => {
        if (!ms2Response) return null;
        const data = ms2Response as BlockchainMs2View[];
        const item = data.find(m => Number(m.ms2Id) === ms2IdNumber);
        if (!item) return null;

        return {
            ms2Id: Number(item.ms2Id),
            tanggal: new Date(Number(item.tanggal) * 1000),
            konfirmasiBy: item.konfirmasiBy,
            produk: (item.produk || []).map(p => ({
                produkId: Number(p.produkId),
                namaProduk: p.namaProduk,
                totalJumlah: Number(p.totalJumlah),
            })),
            totalProduk: Number(item.totalProduk),
            createdAt: new Date(Number(item.createdAt) * 1000),
        };
    }, [ms2Response, ms2IdNumber]);

    // Handle form submission
    const handleSubmit = async () => {
        if (!nomorDo.trim() || !nomorPolisi.trim()) {
            alert('Nomor DO dan Nomor Polisi wajib diisi');
            return;
        }

        setIsSubmitting(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'konfirmasiMs2ToPengiriman',
                args: [
                    BigInt(ms2IdNumber),
                    nomorDo,
                    nomorPolisi,
                    catatan
                ],
            });
        } catch (err) {
            console.error('Submit error:', err);
            setIsSubmitting(false);
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                        <p className="text-slate-500 dark:text-slate-400">Memuat data...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !ms2Detail) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                    <motion.div
                        className="flex flex-col items-center gap-4 max-w-md text-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Data Tidak Ditemukan</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                            {error?.message || 'MS2 dengan ID tersebut tidak ditemukan'}
                        </p>
                        <motion.button
                            onClick={() => navigate('/procurement/ms2/pengiriman')}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Kembali
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-indigo-100/80 dark:bg-slate-900" />

            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-indigo-400/20 to-purple-400/20 dark:from-indigo-600/30 dark:to-purple-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-blue-400/15 to-indigo-400/15 dark:from-blue-500/20 dark:to-indigo-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/procurement/ms2/pengiriman')}
                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
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
                >
                    <div className="flex items-center gap-4">
                        <motion.div
                            className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30"
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                        >
                            <Truck className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Detail Pengajuan MS2
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                ID: #{ms2Detail.ms2Id} • {formatTanggal(ms2Detail.tanggal)}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* MS2 Info Card */}
                <motion.div
                    className="mb-6 p-6 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Informasi Pengiriman</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                            <Hash className="w-5 h-5 text-slate-500" />
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">ID MS2</p>
                                <p className="font-semibold text-slate-800 dark:text-white">#{ms2Detail.ms2Id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                            <Calendar className="w-5 h-5 text-slate-500" />
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Tanggal Pengiriman</p>
                                <p className="font-semibold text-slate-800 dark:text-white">{formatTanggal(ms2Detail.tanggal)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                            <Package className="w-5 h-5 text-slate-500" />
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Total Produk</p>
                                <p className="font-semibold text-slate-800 dark:text-white">{ms2Detail.totalProduk} item</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                            <Clock className="w-5 h-5 text-slate-500" />
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Dibuat Pada</p>
                                <p className="font-semibold text-slate-800 dark:text-white">{formatTanggal(ms2Detail.createdAt)}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Products Card */}
                <motion.div
                    className="mb-6 p-6 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.1 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                            <Droplet className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Produk yang Dikirim</h2>
                    </div>

                    <motion.div
                        className="space-y-3"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {ms2Detail.produk.map((prod, idx) => (
                            <motion.div
                                key={idx}
                                variants={cardVariants}
                                className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl border border-cyan-200/50 dark:border-cyan-700/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-cyan-500/20 dark:bg-cyan-500/30 rounded-lg">
                                        <Droplet className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-white">{prod.namaProduk}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">ID Produk: {prod.produkId}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                                        {formatNumber(prod.totalJumlah)}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Liter</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Total Summary */}
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400 font-medium">Total Volume:</span>
                            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                {formatNumber(ms2Detail.produk.reduce((sum, p) => sum + p.totalJumlah, 0))} L
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Confirmation Form */}
                <motion.div
                    className="p-6 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Konfirmasi Pengiriman</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Isi data pengiriman untuk memindahkan status dari MS2 ke Pengiriman
                            </p>
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/50">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                Setelah dikonfirmasi, status pengajuan akan dipindahkan dari <strong>MS2</strong> ke <strong>Pengiriman</strong>.
                                Pastikan data produk sudah benar sebelum melanjutkan.
                            </p>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        {/* Nomor DO */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <FileText className="w-4 h-4" />
                                Nomor Delivery Order (DO) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={nomorDo}
                                onChange={(e) => setNomorDo(e.target.value)}
                                placeholder="Masukkan nomor DO..."
                                className="w-full px-4 py-3 bg-white dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                            />
                        </div>

                        {/* Nomor Polisi */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Car className="w-4 h-4" />
                                Nomor Polisi (Tanki Truk) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={nomorPolisi}
                                onChange={(e) => setNomorPolisi(e.target.value.toUpperCase())}
                                placeholder="Contoh: B 1234 ABC"
                                className="w-full px-4 py-3 bg-white dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all uppercase"
                            />
                        </div>

                        {/* Catatan */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <MessageSquare className="w-4 h-4" />
                                Catatan (Opsional)
                            </label>
                            <textarea
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                                placeholder="Tambahkan catatan jika diperlukan..."
                                rows={3}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                        onClick={handleSubmit}
                        disabled={isSubmitting || isWritePending || !nomorDo.trim() || !nomorPolisi.trim()}
                        className="mt-6 w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold rounded-2xl shadow-lg shadow-green-500/30 disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isSubmitting || isWritePending ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Memproses Konfirmasi...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Konfirmasi & Pindahkan ke Pengiriman
                            </>
                        )}
                    </motion.button>
                </motion.div>
            </div>

            {/* Success Modal */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                        >
                            <motion.div
                                className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                            >
                                <CheckCircle className="w-10 h-10 text-white" />
                            </motion.div>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                                Berhasil Dikonfirmasi!
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Status pengajuan telah dipindahkan ke Pengiriman
                            </p>
                            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Mengalihkan...
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
