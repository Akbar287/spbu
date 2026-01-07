'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useAccount } from 'wagmi';
import { simulateContract, writeContract } from '@wagmi/core';
import {
    ClipboardList, ArrowLeft, Hash, Calendar, User, Package,
    AlertCircle, CheckCircle2, Loader2, XCircle, Edit3, Trash2,
    Droplet, FileText, Clock, Info, Shield, Send, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { config } from '@/config/wagmi';

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

export default function PerencanaanShow() {
    const navigate = useNavigate();
    const { rencanaId } = useParams<{ rencanaId: string }>();
    const rencanaPembelianId = rencanaId ? parseInt(rencanaId, 10) : 0;
    const isValidId = !isNaN(rencanaPembelianId) && rencanaPembelianId > 0;
    const { address } = useAccount();

    const [showKonfirmasiModal, setShowKonfirmasiModal] = useState(false);
    const [konfirmasiType, setKonfirmasiType] = useState<'approve' | 'reject'>('approve');
    const [keterangan, setKeterangan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Fetch main data
    const { data: rencanaPembelianResponse, isLoading: isLoadingMain, error, refetch } = useReadContract({
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

    // Check if user is admin
    const { data: isAdminResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'hasRole',
        args: [
            '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775' as `0x${string}`, // ADMIN_ROLE keccak256
            address as `0x${string}`
        ],
        query: { enabled: !!address }
    });

    const isAdmin = isAdminResponse as boolean | undefined;

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
                harga: Number(d.harga) / 100, // Assuming scaled x100
                jumlah: Number(d.jumlah),
                subTotal: Number(d.subTotal) / 100,
                satuan: d.satuanJumlah,
            }));
    }, [details, produkMap]);

    // Handle konfirmasi
    const handleKonfirmasi = async () => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const isApprove = konfirmasiType === 'approve';
            const { request } = await simulateContract(config, {
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'konfirmasiRencanaPembelian',
                args: [BigInt(rencanaPembelianId), isApprove, keterangan],
            });

            await writeContract(config, request);
            setSubmitSuccess(true);
            setTimeout(() => {
                setShowKonfirmasiModal(false);
                setSubmitSuccess(false);
                refetch();
            }, 1500);
        } catch (error: any) {
            console.error('Error:', error);
            setSubmitError(error.message || 'Terjadi kesalahan');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Check if already confirmed (konfirmasiBy != address(0))
    const isAlreadyConfirmed = rencanaPembelian?.konfirmasiBy !== '0x0000000000000000000000000000000000000000';
    const isRejected = isAlreadyConfirmed && !rencanaPembelian?.konfirmasi;

    // Redirect to rejected page if item is rejected
    useEffect(() => {
        if (!isLoadingMain && rencanaPembelian && isRejected) {
            navigate(`/procurement/perencanaan/${rencanaId}/ditolak`, { replace: true });
        }
    }, [isLoadingMain, rencanaPembelian, isRejected, navigate, rencanaId]);

    // Loading state
    const isLoading = isLoadingMain || isLoadingDetails;

    if (isLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-amber-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
                    <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">Memuat data...</p>
                </div>
            </div>
        );
    }

    // Error or not found
    if (error || !rencanaPembelian || rencanaPembelian.rencanaPembelianId === BigInt(0) || rencanaPembelian.deleted) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-amber-100/80 dark:bg-slate-900" />
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
                            onClick={() => navigate('/procurement/perencanaan')}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl"
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
            <div className="absolute inset-0 bg-amber-100/80 dark:bg-slate-900" />

            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-amber-400/20 to-orange-400/20 dark:from-amber-600/30 dark:to-orange-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/procurement/perencanaan')}
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
                    className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500" />
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
                                        Detail Perencanaan Pembelian
                                    </p>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className={`px-4 py-2 rounded-full backdrop-blur-md border ${rencanaPembelian.konfirmasi
                                ? 'bg-green-500/20 border-green-300/50 text-green-100'
                                : 'bg-yellow-500/20 border-yellow-300/50 text-yellow-100'
                                }`}>
                                {rencanaPembelian.konfirmasi ? (
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Dikonfirmasi
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Menunggu Konfirmasi
                                    </span>
                                )}
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
                            <Info className="w-5 h-5 text-amber-500" />
                            Informasi Umum
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* ID */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                    <Hash className="w-4 h-4 text-amber-600 dark:text-amber-400" />
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

                {/* Konfirmasi Info (if already confirmed - konfirmasiBy != address(0)) */}
                {isAlreadyConfirmed && (
                    <motion.div
                        className={`relative overflow-hidden rounded-2xl border mb-6 ${rencanaPembelian.konfirmasi
                            ? 'border-green-200/50 dark:border-green-700/50'
                            : 'border-red-200/50 dark:border-red-700/50'
                            }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className={`absolute inset-0 backdrop-blur-md ${rencanaPembelian.konfirmasi
                            ? 'bg-green-50/60 dark:bg-green-900/20'
                            : 'bg-red-50/60 dark:bg-red-900/20'
                            }`} />

                        <div className="relative z-10 p-6">
                            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${rencanaPembelian.konfirmasi
                                ? 'text-green-800 dark:text-green-300'
                                : 'text-red-800 dark:text-red-300'
                                }`}>
                                {rencanaPembelian.konfirmasi ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                    <XCircle className="w-5 h-5" />
                                )}
                                {rencanaPembelian.konfirmasi ? 'Diterima' : 'Ditolak'}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className={`text-xs mb-1 ${rencanaPembelian.konfirmasi
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-red-600 dark:text-red-400'
                                        }`}>Dikonfirmasi Oleh</p>
                                    <p className={`font-semibold ${rencanaPembelian.konfirmasi
                                        ? 'text-green-800 dark:text-green-200'
                                        : 'text-red-800 dark:text-red-200'
                                        }`}>
                                        {shortenAddress(rencanaPembelian.konfirmasiBy)}
                                    </p>
                                </div>
                                <div>
                                    <p className={`text-xs mb-1 ${rencanaPembelian.konfirmasi
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-red-600 dark:text-red-400'
                                        }`}>Waktu Konfirmasi</p>
                                    <p className={`font-semibold ${rencanaPembelian.konfirmasi
                                        ? 'text-green-800 dark:text-green-200'
                                        : 'text-red-800 dark:text-red-200'
                                        }`}>
                                        {formatDateTime(new Date(Number(rencanaPembelian.konfirmasiAt) * 1000))}
                                    </p>
                                </div>
                                {rencanaPembelian.keteranganKonfirmasi && (
                                    <div className="md:col-span-2">
                                        <p className={`text-xs mb-1 ${rencanaPembelian.konfirmasi
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-red-600 dark:text-red-400'
                                            }`}>Keterangan</p>
                                        <p className={`font-semibold ${rencanaPembelian.konfirmasi
                                            ? 'text-green-800 dark:text-green-200'
                                            : 'text-red-800 dark:text-red-200'
                                            }`}>
                                            {rencanaPembelian.keteranganKonfirmasi}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Admin Actions (only show if admin and not yet confirmed) */}
                {isAdmin && !isAlreadyConfirmed && (
                    <motion.div
                        className="relative overflow-hidden rounded-2xl border border-amber-200/50 dark:border-amber-700/50 mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="absolute inset-0 bg-amber-50/60 dark:bg-amber-900/20 backdrop-blur-md" />

                        <div className="relative z-10 p-6">
                            <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Aksi Admin
                            </h2>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <motion.button
                                    onClick={() => {
                                        setKonfirmasiType('approve');
                                        setKeterangan('');
                                        setShowKonfirmasiModal(true);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30"
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <ThumbsUp className="w-5 h-5" />
                                    Terima
                                </motion.button>
                                <motion.button
                                    onClick={() => {
                                        setKonfirmasiType('reject');
                                        setKeterangan('');
                                        setShowKonfirmasiModal(true);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30"
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <ThumbsDown className="w-5 h-5" />
                                    Tolak
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                    className="flex flex-col sm:flex-row gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <motion.button
                        onClick={() => navigate(`/procurement/perencanaan/${rencanaId}/edit`)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-semibold rounded-xl border border-amber-200 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Edit3 className="w-5 h-5" />
                        Edit
                    </motion.button>
                    <motion.button
                        onClick={() => navigate('/procurement/perencanaan')}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/30"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Kembali ke Daftar
                    </motion.button>
                </motion.div>
            </div>

            {/* Konfirmasi Modal */}
            <AnimatePresence>
                {showKonfirmasiModal && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !isSubmitting && setShowKonfirmasiModal(false)}
                    >
                        <motion.div
                            className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-3 rounded-full ${konfirmasiType === 'approve'
                                        ? 'bg-green-100 dark:bg-green-900/30'
                                        : 'bg-red-100 dark:bg-red-900/30'
                                        }`}>
                                        {konfirmasiType === 'approve' ? (
                                            <ThumbsUp className="w-6 h-6 text-green-600" />
                                        ) : (
                                            <ThumbsDown className="w-6 h-6 text-red-600" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                            Konfirmasi Perencanaan
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {rencanaPembelian.kodePembelian}
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Keterangan (Opsional)
                                    </label>
                                    <textarea
                                        value={keterangan}
                                        onChange={(e) => setKeterangan(e.target.value)}
                                        placeholder="Tambahkan keterangan..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 resize-none"
                                    />
                                </div>

                                {submitError && (
                                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-500/30 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                        <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <motion.button
                                        onClick={() => setShowKonfirmasiModal(false)}
                                        disabled={isSubmitting}
                                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                                        whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                                        whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                                    >
                                        Batal
                                    </motion.button>
                                    <motion.button
                                        onClick={handleKonfirmasi}
                                        disabled={isSubmitting || submitSuccess}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-xl shadow-lg ${submitSuccess
                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                                            : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-green-500/30'
                                            } disabled:opacity-70`}
                                        whileHover={{ scale: isSubmitting || submitSuccess ? 1 : 1.02 }}
                                        whileTap={{ scale: isSubmitting || submitSuccess ? 1 : 0.98 }}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Memproses...
                                            </>
                                        ) : submitSuccess ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" />
                                                Berhasil!
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Konfirmasi
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
