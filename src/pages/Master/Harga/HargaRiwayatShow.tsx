'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import {
    DollarSign, ArrowLeft, Hash,
    AlertCircle, Loader2, Sparkles, Package, TrendingUp, TrendingDown, Clock, History
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain Interfaces
interface BlockchainHarga {
    hargaId: bigint;
    produkId: bigint;
    jamKerjaId: bigint;
    hargaJual: bigint;
    hargaBeli: bigint;
    isDefault: boolean;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainProduk {
    produkId: bigint;
    spbuId: bigint;
    namaProduk: string;
    aktif: boolean;
    oktan: bigint;
    deleted: boolean;
}

interface BlockchainJamKerja {
    jamKerjaId: bigint;
    namaJamKerja: string;
    deleted: boolean;
}

// Display Interface
interface HargaData {
    hargaId: number;
    produkId: number;
    produkName: string;
    jamKerjaId: number;
    jamKerjaName: string;
    hargaJual: number;
    hargaBeli: number;
    margin: number;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Format currency
const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value / 100); // Divide by 100 since value is scaled
};

export default function HargaRiwayatShow() {
    const navigate = useNavigate();
    const { hargaId } = useParams<{ hargaId: string }>();

    // Fetch Harga Data
    const { data: blockchainHarga, isLoading: isLoadingHarga, error: errorHarga } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getHargaById',
        args: hargaId ? [BigInt(hargaId)] : undefined,
        query: {
            enabled: !!hargaId,
        },
    });

    const produkId = blockchainHarga ? (blockchainHarga as BlockchainHarga).produkId : undefined;
    const jamKerjaId = blockchainHarga ? (blockchainHarga as BlockchainHarga).jamKerjaId : undefined;

    // Fetch Produk Data
    const { data: blockchainProduk, isLoading: isLoadingProduk } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getProdukById',
        args: produkId ? [produkId] : undefined,
        query: {
            enabled: !!produkId,
        },
    });

    // Fetch JamKerja Data
    const { data: blockchainJamKerja, isLoading: isLoadingJamKerja } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getJamKerjaById',
        args: jamKerjaId && Number(jamKerjaId) > 0 ? [jamKerjaId] : undefined,
        query: {
            enabled: !!jamKerjaId && Number(jamKerjaId) > 0,
        },
    });

    // Format Data
    const hargaData = useMemo((): HargaData | null => {
        if (!blockchainHarga) return null;
        const h = blockchainHarga as BlockchainHarga;

        if (h.deleted || Number(h.hargaId) === 0) return null;

        let produkName = 'Loading...';
        if (blockchainProduk) {
            const produk = blockchainProduk as BlockchainProduk;
            produkName = produk.namaProduk;
        }

        let jamKerjaName = 'Semua Jam Kerja';
        if (Number(h.jamKerjaId) > 0 && blockchainJamKerja) {
            const jk = blockchainJamKerja as BlockchainJamKerja;
            jamKerjaName = jk.namaJamKerja;
        }

        const hargaJual = Number(h.hargaJual);
        const hargaBeli = Number(h.hargaBeli);

        return {
            hargaId: Number(h.hargaId),
            produkId: Number(h.produkId),
            produkName,
            jamKerjaId: Number(h.jamKerjaId),
            jamKerjaName,
            hargaJual,
            hargaBeli,
            margin: hargaJual - hargaBeli,
            isDefault: h.isDefault,
            createdAt: new Date(Number(h.createdAt) * 1000),
            updatedAt: new Date(Number(h.updatedAt) * 1000),
        };
    }, [blockchainHarga, blockchainProduk, blockchainJamKerja]);

    const isLoading = isLoadingHarga || (!!produkId && isLoadingProduk) || (!!jamKerjaId && Number(jamKerjaId) > 0 && isLoadingJamKerja);
    const notFound = !isLoading && !errorHarga && !hargaData;

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

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Loader2 className="w-12 h-12 text-slate-500 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat riwayat Harga...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Not found state
    if (notFound || !hargaData) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4 text-center p-8"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Riwayat Harga Tidak Ditemukan</h2>
                        <p className="text-slate-600 dark:text-slate-400">Data riwayat Harga dengan ID {hargaId} tidak ditemukan.</p>
                        <motion.button
                            onClick={() => navigate('/master/harga/riwayat')}
                            className="mt-4 px-6 py-3 bg-slate-600 text-white font-semibold rounded-2xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Kembali ke Daftar Riwayat
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    const detailItems = [
        { label: 'ID Harga', value: hargaData.hargaId.toString(), icon: Hash, color: 'slate' },
        { label: 'Produk', value: hargaData.produkName, icon: Package, color: 'blue' },
        { label: 'Jam Kerja', value: hargaData.jamKerjaName, icon: Clock, color: 'indigo' },
        { label: 'Harga Jual', value: formatCurrency(hargaData.hargaJual), icon: TrendingUp, color: 'green' },
        { label: 'Harga Beli', value: formatCurrency(hargaData.hargaBeli), icon: TrendingDown, color: 'red' },
        { label: 'Margin', value: formatCurrency(hargaData.margin), icon: DollarSign, color: hargaData.margin >= 0 ? 'emerald' : 'orange' },
        { label: 'Dibuat', value: formatDateTime(hargaData.createdAt), icon: Clock, color: 'slate' },
        { label: 'Diarsipkan', value: formatDateTime(hargaData.updatedAt), icon: History, color: 'gray' },
    ];

    const colorMap: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
        slate: { bg: 'bg-slate-100', text: 'text-slate-600', darkBg: 'dark:bg-slate-900/30', darkText: 'dark:text-slate-400' },
        blue: { bg: 'bg-blue-100', text: 'text-blue-600', darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-400' },
        indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', darkBg: 'dark:bg-indigo-900/30', darkText: 'dark:text-indigo-400' },
        green: { bg: 'bg-green-100', text: 'text-green-600', darkBg: 'dark:bg-green-900/30', darkText: 'dark:text-green-400' },
        red: { bg: 'bg-red-100', text: 'text-red-600', darkBg: 'dark:bg-red-900/30', darkText: 'dark:text-red-400' },
        emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', darkBg: 'dark:bg-emerald-900/30', darkText: 'dark:text-emerald-400' },
        orange: { bg: 'bg-orange-100', text: 'text-orange-600', darkBg: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-400' },
        gray: { bg: 'bg-gray-100', text: 'text-gray-600', darkBg: 'dark:bg-gray-900/30', darkText: 'dark:text-gray-400' },
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background - Muted slate theme for archived */}
            <div className="absolute inset-0 bg-slate-100/80 dark:bg-slate-900" />

            {/* Animated Background Gradients - Muted colors */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-slate-400/20 to-gray-400/20 dark:from-slate-600/30 dark:to-gray-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-gray-400/15 to-slate-400/15 dark:from-gray-500/20 dark:to-slate-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/master/harga/riwayat')}
                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm mt-32"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Riwayat
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
                                className="p-4 bg-gradient-to-br from-slate-500 to-gray-600 rounded-2xl shadow-lg shadow-slate-500/30"
                                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <History className="w-8 h-8 text-white" />
                            </motion.div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                    Detail Riwayat Harga
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">
                                    {hargaData.produkName}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Status Badge - Always archived */}
                <motion.div
                    className="mb-6 p-4 backdrop-blur-sm rounded-2xl border flex items-center gap-3 bg-slate-50/80 dark:bg-slate-900/20 border-slate-200/50 dark:border-slate-500/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <Clock className="w-6 h-6 text-slate-500" />
                    <div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Harga Diarsipkan</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Harga ini sudah tidak aktif dan digantikan oleh harga baru</p>
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

                    {/* Animated Sparkles - Muted */}
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute pointer-events-none"
                            style={{ top: `${15 + (i * 18)}%`, left: `${10 + (i * 20)}%` }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: [0, 0.5, 0.5, 0], scale: [0, 1, 1, 0], rotate: [0, 180] }}
                            transition={{ duration: 3, repeat: Infinity, delay: i * 0.8, ease: 'easeInOut' }}
                        >
                            <Sparkles className="w-4 h-4 text-slate-400/60 dark:text-slate-300/40" />
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
            </div>
        </div>
    );
}
