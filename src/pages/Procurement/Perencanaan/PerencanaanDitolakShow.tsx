'use client';

import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import {
    ClipboardList, ArrowLeft, Hash, Calendar, User, Package,
    AlertCircle, Loader2, XCircle, Droplet, FileText, Info
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain interfaces
interface BlockchainRencanaPembelian {
    rencanaPembelianId: bigint;
    spbuId: bigint;
    statusPurchaseId: bigint;
    walletMember: string;
    tanggalPembelian: bigint;
    kodePembelian: string;
    deskripsi: string;
    grandTotal: bigint;
    konfirmasi: boolean;
    konfirmasiBy: string;
    konfirmasiAt: bigint;
    keteranganKonfirmasi: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainDetailRencanaPembelian {
    detailRencanaPembelianId: bigint;
    rencanaPembelianId: bigint;
    produkId: bigint;
    harga: bigint;
    jumlah: bigint;
    subTotal: bigint;
    satuanJumlah: string;
    konfirmasi: boolean;
    konfirmasiBy: string;
    konfirmasiAt: bigint;
    ms2: boolean;
    ms2By: string;
    ms2At: bigint;
    delivery: boolean;
    deliveryBy: string;
    deliveryAt: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainKtp {
    ktpId: bigint;
    nama: string;
    nik: string;
    tempatLahir: string;
    tanggalLahir: bigint;
    jenisKelamin: string;
    alamat: string;
    rt: string;
    rw: string;
    kelurahan: string;
    kecamatan: string;
    kabupaten: string;
    provinsi: string;
    agama: string;
    statusPerkawinan: string;
    pekerjaan: string;
    kewarganegaraan: string;
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
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainStatusPurchase {
    statusPurchaseId: bigint;
    spbuId: bigint;
    namaStatus: string;
    deskripsi: string;
    aktif: boolean;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// Display interfaces
interface DetailPembelian {
    id: number;
    produkId: number;
    namaProduk: string;
    harga: number;
    jumlah: number;
    subTotal: number;
    satuan: string;
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

const formatDateTime = (date: Date): string => {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('id-ID').format(value);
};

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
};

const shortenAddress = (address: string): string => {
    if (!address) return '-';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default function PerencanaanDitolakShow() {
    const navigate = useNavigate();
    const { rencanaId } = useParams<{ rencanaId: string }>();
    const rencanaPembelianId = rencanaId ? parseInt(rencanaId, 10) : 0;
    const isValidId = !isNaN(rencanaPembelianId) && rencanaPembelianId > 0;

    // Fetch main data
    const { data: rencanaPembelianResponse, isLoading: isLoadingMain, error } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getRencanaPembelianById',
        args: [BigInt(isValidId ? rencanaPembelianId : 0)],
        query: { enabled: isValidId }
    });

    // Fetch details
    const { data: detailsResponse, isLoading: isLoadingDetails } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getDetailRencanaPembelianByRencana',
        args: [BigInt(isValidId ? rencanaPembelianId : 0)],
        query: { enabled: isValidId }
    });

    const rencanaPembelian = rencanaPembelianResponse as BlockchainRencanaPembelian | undefined;
    const details = detailsResponse as BlockchainDetailRencanaPembelian[] | undefined;

    // Fetch member KTP
    const { data: ktpResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getKtpByWallet',
        args: [rencanaPembelian?.walletMember as `0x${string}`],
        query: { enabled: !!rencanaPembelian?.walletMember }
    });

    const ktp = ktpResponse as BlockchainKtp | undefined;

    // Fetch status purchase
    const { data: statusResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getStatusPurchaseById',
        args: [rencanaPembelian?.statusPurchaseId || BigInt(0)],
        query: { enabled: !!rencanaPembelian?.statusPurchaseId }
    });

    const statusPurchase = statusResponse as BlockchainStatusPurchase | undefined;

    // Fetch all products to get names
    const { data: produkListResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllProduk',
        args: [BigInt(0), BigInt(100)],
    });

    // Map product names
    const produkMap = useMemo(() => {
        if (!produkListResponse) return new Map<number, string>();
        const [list] = produkListResponse as [BlockchainProduk[], bigint];
        const map = new Map<number, string>();
        list.forEach(p => {
            map.set(Number(p.produkId), p.namaProduk);
        });
        return map;
    }, [produkListResponse]);

    // Convert details to display format
    const detailList = useMemo((): DetailPembelian[] => {
        if (!details) return [];
        return details
            .filter(d => !d.deleted)
            .map(d => ({
                id: Number(d.detailRencanaPembelianId),
                produkId: Number(d.produkId),
                namaProduk: produkMap.get(Number(d.produkId)) || `Produk #${d.produkId}`,
                harga: Number(d.harga) / 100,
                jumlah: Number(d.jumlah),
                subTotal: Number(d.subTotal) / 100,
                satuan: d.satuanJumlah,
            }));
    }, [details, produkMap]);

    // Check if this is a rejected item (konfirmasiBy != address(0) && konfirmasi == false)
    // If not rejected, redirect to normal show page
    useEffect(() => {
        if (!isLoadingMain && rencanaPembelian) {
            const isConfirmed = rencanaPembelian.konfirmasiBy !== '0x0000000000000000000000000000000000000000';
            const isRejected = isConfirmed && !rencanaPembelian.konfirmasi;

            if (!isRejected) {
                // If not rejected (either pending or accepted), redirect to normal show page
                navigate(`/procurement/perencanaan/${rencanaId}`, { replace: true });
            }
        }
    }, [isLoadingMain, rencanaPembelian, navigate, rencanaId]);

    // Loading state
    const isLoading = isLoadingMain || isLoadingDetails;

    if (isLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-red-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
                    <Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">Memuat data...</p>
                </div>
            </div>
        );
    }

    // Error or not found
    if (error || !rencanaPembelian || rencanaPembelian.rencanaPembelianId === BigInt(0) || rencanaPembelian.deleted) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-red-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
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
                            Perencanaan pembelian dengan ID {rencanaId} tidak ditemukan atau sudah dihapus.
                        </p>
                        <motion.button
                            onClick={() => navigate('/procurement/perencanaan/ditolak')}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl"
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
            <div className="absolute inset-0 bg-red-100/80 dark:bg-slate-900" />

            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-red-400/20 to-rose-400/20 dark:from-red-600/30 dark:to-rose-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/procurement/perencanaan/ditolak')}
                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </motion.button>

                {/* Header Card */}
                <motion.div
                    className="relative overflow-hidden rounded-3xl border border-red-200/50 dark:border-red-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-rose-500 to-pink-500" />
                    <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,...')]" />

                    <div className="relative z-10 p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                >
                                    <ClipboardList className="w-8 h-8 text-white" />
                                </motion.div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                                        {rencanaPembelian.kodePembelian}
                                    </h1>
                                    <p className="text-white/80 mt-1">
                                        Detail Perencanaan Ditolak
                                    </p>
                                </div>
                            </div>

                            {/* Status Badge - Always Ditolak */}
                            <div className="px-4 py-2 rounded-full backdrop-blur-md border bg-red-500/20 border-red-300/50 text-red-100">
                                <span className="flex items-center gap-2">
                                    <XCircle className="w-4 h-4" />
                                    Ditolak
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Info Card */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                    <div className="relative z-10 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-red-500" />
                            Informasi Umum
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* ID */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                    <Hash className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">ID</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {Number(rencanaPembelian.rencanaPembelianId)}
                                    </p>
                                </div>
                            </div>

                            {/* Tanggal */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Tanggal Pembelian</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {formatTanggal(new Date(Number(rencanaPembelian.tanggalPembelian) * 1000))}
                                    </p>
                                </div>
                            </div>

                            {/* Diajukan Oleh */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Diajukan Oleh</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {ktp?.nama || shortenAddress(rencanaPembelian.walletMember)}
                                    </p>
                                </div>
                            </div>

                            {/* Status Purchase */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {statusPurchase?.namaStatus || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Grand Total */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl md:col-span-2">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                    <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Grand Total</p>
                                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(Number(rencanaPembelian.grandTotal) / 100)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Deskripsi */}
                        {rencanaPembelian.deskripsi && (
                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Deskripsi</p>
                                <p className="text-slate-700 dark:text-slate-300">{rencanaPembelian.deskripsi}</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Detail Products Card */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                    <div className="relative z-10 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Droplet className="w-5 h-5 text-cyan-500" />
                            Detail Produk ({detailList.length})
                        </h2>

                        <div className="space-y-3">
                            {detailList.map((detail, index) => (
                                <motion.div
                                    key={detail.id}
                                    className="p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-lg">
                                                <Droplet className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-800 dark:text-white">
                                                    {detail.namaProduk}
                                                </h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    ID: #{detail.id}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-sm">
                                            <div className="text-center">
                                                <p className="text-xs text-slate-400">Jumlah</p>
                                                <p className="font-semibold text-slate-700 dark:text-slate-200">
                                                    {formatNumber(detail.jumlah)} {detail.satuan}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-slate-400">Harga</p>
                                                <p className="font-semibold text-slate-700 dark:text-slate-200">
                                                    {formatCurrency(detail.harga)}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-slate-400">Subtotal</p>
                                                <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(detail.subTotal)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Rejection Info Card */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-red-200/50 dark:border-red-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="absolute inset-0 bg-red-50/60 dark:bg-red-900/20 backdrop-blur-md" />

                    <div className="relative z-10 p-6">
                        <h2 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-4 flex items-center gap-2">
                            <XCircle className="w-5 h-5" />
                            Informasi Penolakan
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-red-600 dark:text-red-400 mb-1">Ditolak Oleh</p>
                                <p className="font-semibold text-red-800 dark:text-red-200">
                                    {shortenAddress(rencanaPembelian.konfirmasiBy)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-red-600 dark:text-red-400 mb-1">Waktu Penolakan</p>
                                <p className="font-semibold text-red-800 dark:text-red-200">
                                    {formatDateTime(new Date(Number(rencanaPembelian.konfirmasiAt) * 1000))}
                                </p>
                            </div>
                            {rencanaPembelian.keteranganKonfirmasi && (
                                <div className="md:col-span-2">
                                    <p className="text-xs text-red-600 dark:text-red-400 mb-1">Alasan Penolakan</p>
                                    <p className="font-semibold text-red-800 dark:text-red-200">
                                        {rencanaPembelian.keteranganKonfirmasi}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Back Button Only */}
                <motion.div
                    className="flex flex-col sm:flex-row gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <motion.button
                        onClick={() => navigate('/procurement/perencanaan/ditolak')}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Kembali ke Daftar Ditolak
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
}
