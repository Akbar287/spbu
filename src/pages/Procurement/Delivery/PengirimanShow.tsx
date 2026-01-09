'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Truck, ArrowLeft, Calendar, User, Package,
    AlertCircle, Loader2, Droplet, FileText, Clock, Car,
    MessageSquare, CheckCircle, XCircle, Plus, Edit3, X
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain interfaces
interface BlockchainPengirimanByIdForListFileLo {
    fileLoId: bigint;
    detailRencanaPembelianId: bigint;
    produkId: bigint;
    namaProduk: string;
    jumlah: bigint;
    satuanJumlah: string;
    noFaktur: string;
    noLo: string;
}

interface BlockchainPengirimanById {
    pengirimanId: bigint;
    walletMember: string;
    tanggal: bigint;
    noDo: string;
    noPolisi: string;
    catatan: string;
    ms2: boolean;
    ms2By: string;
    ms2At: bigint;
    konfirmasiAdmin: boolean;
    konfirmasiDirektur: boolean;
    konfirmasiAdminBy: string;
    konfirmasiAdminAt: bigint;
    konfirmasiDirekturBy: string;
    konfirmasiDirekturAt: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
    fileLoList: BlockchainPengirimanByIdForListFileLo[];
}

interface BlockchainKtp {
    ktpId: bigint;
    nama: string;
    nik: string;
    walletAddress: string;
}

// Display interfaces
interface FileLoItem {
    fileLoId: number;
    detailRencanaPembelianId: number;
    produkId: number;
    namaProduk: string;
    jumlah: number;
    satuanJumlah: string;
    noFaktur: string;
    noLo: string;
    hasFileLo: boolean;
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

const shortenAddress = (address: string): string => {
    if (!address || address === '0x0000000000000000000000000000000000000000') return '-';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default function PengirimanShow() {
    const navigate = useNavigate();
    const { pengirimanId } = useParams<{ pengirimanId: string }>();
    const pengirimanIdNumber = pengirimanId ? parseInt(pengirimanId, 10) : 0;
    const isValidId = !isNaN(pengirimanIdNumber) && pengirimanIdNumber > 0;

    // Edit catatan state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editCatatan, setEditCatatan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit penerima state
    const [showPenerimaModal, setShowPenerimaModal] = useState(false);
    const [selectedKtpId, setSelectedKtpId] = useState<number | null>(null);
    const [isSubmittingPenerima, setIsSubmittingPenerima] = useState(false);

    // Confirmation state
    const [isConfirmingAdmin, setIsConfirmingAdmin] = useState(false);
    const [isConfirmingDirektur, setIsConfirmingDirektur] = useState(false);

    // Fetch pengiriman data
    const { data: pengirimanResponse, isLoading, error, refetch } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getPengirimanById',
        args: [BigInt(isValidId ? pengirimanIdNumber : 0)],
        query: { enabled: isValidId }
    });

    // Write contract hook
    const { writeContract, isPending: isWritePending, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle write success
    useEffect(() => {
        if (isWriteSuccess) {
            setShowEditModal(false);
            setShowPenerimaModal(false);
            setIsSubmitting(false);
            setIsSubmittingPenerima(false);
            setIsConfirmingAdmin(false);
            setIsConfirmingDirektur(false);
            refetch();
        }
    }, [isWriteSuccess, refetch]);

    // Fetch KTP list
    const { data: ktpListResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllKtpIdAndNama',
        args: [],
    });

    const ktpList = useMemo(() => {
        if (!ktpListResponse) return [];
        const list = ktpListResponse as BlockchainKtp[];
        return list.map(k => ({
            ktpId: Number(k.ktpId),
            nama: k.nama,
            nik: k.nik,
            walletAddress: k.walletAddress,
        }));
    }, [ktpListResponse]);

    const pengiriman = pengirimanResponse as BlockchainPengirimanById | undefined;

    // Convert to display format
    const fileLoList = useMemo((): FileLoItem[] => {
        if (!pengiriman?.fileLoList) return [];
        return pengiriman.fileLoList.map(item => ({
            fileLoId: Number(item.fileLoId),
            produkId: Number(item.produkId),
            detailRencanaPembelianId: Number(item.detailRencanaPembelianId),
            namaProduk: item.namaProduk,
            jumlah: Number(item.jumlah),
            satuanJumlah: item.satuanJumlah,
            noFaktur: item.noFaktur,
            noLo: item.noLo,
            hasFileLo: item.noFaktur !== '' && item.noLo !== '',
        }));
    }, [pengiriman]);

    // Check if all fileLo are complete (have noFaktur and noLo)
    const isAllFileLoComplete = useMemo(() => {
        if (!fileLoList || fileLoList.length === 0) return false;
        return fileLoList.every(item => item.noFaktur !== '' && item.noLo !== '');
    }, [fileLoList]);

    // Check if pengiriman is fully completed (both confirmations)
    const isPengirimanSelesai = pengiriman?.konfirmasiAdmin && pengiriman?.konfirmasiDirektur;
    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">Memuat data...</p>
                </div>
            </div>
        );
    }

    // Error or not found
    if (error || !pengiriman || pengiriman.pengirimanId === BigInt(0) || pengiriman.deleted) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-100/80 dark:bg-slate-900" />
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
                            Pengiriman dengan ID {pengirimanId} tidak ditemukan atau sudah dihapus.
                        </p>
                        <motion.button
                            onClick={() => navigate('/procurement/pengiriman')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl"
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

            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-blue-400/20 to-indigo-400/20 dark:from-blue-600/30 dark:to-indigo-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/procurement/pengiriman')}
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
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500" />
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4yIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')]" />
                    </div>

                    <div className="relative z-10 p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                >
                                    <Truck className="w-8 h-8 text-white" />
                                </motion.div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                                        Pengiriman #{Number(pengiriman.pengirimanId)}
                                    </h1>
                                    <p className="text-white/80 mt-1">
                                        Detail Pengiriman Produk BBM
                                    </p>
                                </div>
                            </div>

                            {/* Status Badges */}
                            <div className="flex flex-wrap gap-2">
                                {isPengirimanSelesai ? (
                                    <div className="px-4 py-2 bg-green-500/20 backdrop-blur-md rounded-xl border border-green-300/30">
                                        <span className="text-sm font-semibold text-green-100 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            Selesai
                                        </span>
                                    </div>
                                ) : (
                                    <div className="px-4 py-2 bg-yellow-500/20 backdrop-blur-md rounded-xl border border-yellow-300/30">
                                        <span className="text-sm font-semibold text-yellow-100 flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            Dalam Proses
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Info Cards Grid */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {/* Nomor DO */}
                    <div className="p-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Nomor Delivery Order</p>
                                <p className="font-semibold text-slate-800 dark:text-white">{pengiriman.noDo}</p>
                            </div>
                        </div>
                    </div>

                    {/* Nomor Polisi */}
                    <div className="p-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Car className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Nomor Polisi Truk</p>
                                <p className="font-semibold text-slate-800 dark:text-white">{pengiriman.noPolisi}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tanggal */}
                    <div className="p-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Tanggal Pengiriman</p>
                                <p className="font-semibold text-slate-800 dark:text-white">
                                    {formatTanggal(new Date(Number(pengiriman.tanggal) * 1000))}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Created At */}
                    <div className="p-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Dibuat Pada</p>
                                <p className="font-semibold text-slate-800 dark:text-white">
                                    {formatDateTime(new Date(Number(pengiriman.createdAt) * 1000))}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Wallet Member / Penerima */}
                    <div className="p-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                                    <User className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Penerima Pengiriman</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {ktpList.find(k => k.walletAddress === pengiriman.walletMember)?.nama || shortenAddress(pengiriman.walletMember)}
                                    </p>
                                </div>
                            </div>
                            {!isPengirimanSelesai && (
                                <motion.button
                                    onClick={() => setShowPenerimaModal(true)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-900 dark:hover:bg-cyan-800 text-cyan-600 dark:text-cyan-300 text-sm font-medium rounded-lg transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Edit3 className="w-4 h-4" />
                                    Edit
                                </motion.button>
                            )}
                        </div>
                    </div>

                    {/* Total Items */}
                    <div className="p-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Total Produk</p>
                                <p className="font-semibold text-slate-800 dark:text-white">{fileLoList.length} item</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Catatan */}
                <motion.div
                    className="p-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 bg-slate-100 dark:bg-slate-700/30 rounded-lg">
                                <MessageSquare className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Catatan</p>
                                <p className="text-slate-800 dark:text-white">
                                    {pengiriman.catatan || <span className="text-slate-400 italic">Belum ada catatan</span>}
                                </p>
                            </div>
                        </div>
                        {!isPengirimanSelesai && (
                            <motion.button
                                onClick={() => {
                                    setEditCatatan(pengiriman.catatan || '');
                                    setShowEditModal(true);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Edit3 className="w-4 h-4" />
                                Edit
                            </motion.button>
                        )}
                    </div>
                </motion.div>

                {/* File LO List */}
                <motion.div
                    className="p-6 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                                <Droplet className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Daftar Produk & File LO</h2>
                        </div>
                    </div>

                    {fileLoList.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                            Tidak ada produk dalam pengiriman ini
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {fileLoList.map((item, index) => (
                                <motion.div
                                    key={index}
                                    className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl border border-cyan-200/50 dark:border-cyan-700/50"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + index * 0.05 }}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-cyan-500/20 dark:bg-cyan-500/30 rounded-lg">
                                                <Droplet className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-white">{item.namaProduk}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {formatNumber(item.jumlah)} {item.satuanJumlah}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                            {item.hasFileLo ? (
                                                <>
                                                    <div className="text-sm">
                                                        <span className="text-slate-500 dark:text-slate-400">Faktur: </span>
                                                        <span className="font-medium text-slate-800 dark:text-white">{item.noFaktur || '-'}</span>
                                                    </div>
                                                    <div className="text-sm">
                                                        <span className="text-slate-500 dark:text-slate-400">LO: </span>
                                                        <span className="font-medium text-slate-800 dark:text-white">{item.noLo || '-'}</span>
                                                    </div>
                                                    <motion.button
                                                        onClick={() => navigate(`/procurement/pengiriman/${pengirimanId}/file_lo/${item.fileLoId}`)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                        Lihat File LO
                                                    </motion.button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                                                        <XCircle className="w-4 h-4" />
                                                        <span>File LO belum ada</span>
                                                    </div>
                                                    <motion.button
                                                        onClick={() => navigate(`/procurement/pengiriman/${pengirimanId}/file_lo/${item.fileLoId}`)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Buat File LO
                                                    </motion.button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Summary */}
                    {fileLoList.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-400 font-medium">Total Volume:</span>
                                <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                                    {formatNumber(fileLoList.reduce((sum, item) => sum + item.jumlah, 0))} L
                                </span>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Confirmation Section - Show when all fileLo are complete */}
                {isAllFileLoComplete && (
                    <motion.div
                        className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl mt-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="absolute inset-0 bg-white/70 dark:bg-slate-800/50 backdrop-blur-md" />

                        <div className="relative z-10 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Konfirmasi Pengiriman</h2>
                            </div>

                            {!isPengirimanSelesai ? (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                                    Semua File LO telah dilengkapi. <span className="font-semibold text-amber-600 dark:text-amber-400">Dengan konfirmasi oleh Admin dan Direktur, pengiriman ini akan ditandai selesai.</span>
                                </p>
                            ) : (
                                <p className="text-sm text-green-600 dark:text-green-400 mb-6 font-medium">
                                    ✅ Pengiriman ini telah dikonfirmasi sepenuhnya dan ditandai selesai.
                                </p>
                            )}

                            {/* Admin Confirmation */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${pengiriman?.konfirmasiAdmin
                                        ? 'bg-green-100 dark:bg-green-900/30'
                                        : 'bg-slate-200 dark:bg-slate-600'}`}>
                                        {pengiriman?.konfirmasiAdmin
                                            ? <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            : <Clock className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                        }
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white">Konfirmasi Admin</p>
                                        {pengiriman?.konfirmasiAdmin ? (
                                            <p className="text-xs text-green-600 dark:text-green-400">
                                                Dikonfirmasi pada {formatDateTime(new Date(Number(pengiriman.konfirmasiAdminAt) * 1000))}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Belum dikonfirmasi</p>
                                        )}
                                    </div>
                                </div>
                                {!pengiriman?.konfirmasiAdmin && (
                                    <motion.button
                                        onClick={() => {
                                            setIsConfirmingAdmin(true);
                                            writeContract({
                                                address: DIAMOND_ADDRESS as `0x${string}`,
                                                abi: DIAMOND_ABI,
                                                functionName: 'konfirmasiPengirimanByAdmin',
                                                args: [BigInt(pengirimanIdNumber), true],
                                            });
                                        }}
                                        disabled={isConfirmingAdmin || isWritePending}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {isConfirmingAdmin ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4" />
                                        )}
                                        {isConfirmingAdmin ? 'Memproses...' : 'Konfirmasi'}
                                    </motion.button>
                                )}
                            </div>

                            {/* Direktur Confirmation */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${pengiriman?.konfirmasiDirektur
                                        ? 'bg-green-100 dark:bg-green-900/30'
                                        : 'bg-slate-200 dark:bg-slate-600'}`}>
                                        {pengiriman?.konfirmasiDirektur
                                            ? <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            : <Clock className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                        }
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white">Konfirmasi Direktur</p>
                                        {pengiriman?.konfirmasiDirektur ? (
                                            <p className="text-xs text-green-600 dark:text-green-400">
                                                Dikonfirmasi pada {formatDateTime(new Date(Number(pengiriman.konfirmasiDirekturAt) * 1000))}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Belum dikonfirmasi</p>
                                        )}
                                    </div>
                                </div>
                                {!pengiriman?.konfirmasiDirektur && (
                                    <motion.button
                                        onClick={() => {
                                            setIsConfirmingDirektur(true);
                                            writeContract({
                                                address: DIAMOND_ADDRESS as `0x${string}`,
                                                abi: DIAMOND_ABI,
                                                functionName: 'konfirmasiPengirimanByDirektur',
                                                args: [BigInt(pengirimanIdNumber), true],
                                            });
                                        }}
                                        disabled={isConfirmingDirektur || isWritePending}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {isConfirmingDirektur ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4" />
                                        )}
                                        {isConfirmingDirektur ? 'Memproses...' : 'Konfirmasi'}
                                    </motion.button>
                                )}
                            </div>

                            {/* Completed Badge */}
                            {isPengirimanSelesai && (
                                <motion.div
                                    className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <div className="flex flex-col items-center justify-center gap-2 text-green-700 dark:text-green-300">
                                        <CheckCircle className="w-8 h-8" />
                                        <span className="font-bold text-lg">Pengiriman Sudah Ditandai Selesai</span>
                                        <p className="text-sm text-green-600 dark:text-green-400 text-center">
                                            Semua proses konfirmasi telah selesai dilakukan oleh Admin dan Direktur.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Edit Catatan Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowEditModal(false)}
                    >
                        <motion.div
                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Edit Catatan</h3>
                                <motion.button
                                    onClick={() => setShowEditModal(false)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </motion.button>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Catatan
                                </label>
                                <textarea
                                    value={editCatatan}
                                    onChange={(e) => setEditCatatan(e.target.value)}
                                    placeholder="Masukkan catatan..."
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="flex gap-3">
                                <motion.button
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-medium rounded-xl transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Batal
                                </motion.button>
                                <motion.button
                                    onClick={() => {
                                        setIsSubmitting(true);
                                        writeContract({
                                            address: DIAMOND_ADDRESS as `0x${string}`,
                                            abi: DIAMOND_ABI,
                                            functionName: 'editCatatanPengiriman',
                                            args: [BigInt(pengirimanIdNumber), editCatatan],
                                        });
                                    }}
                                    disabled={isSubmitting || isWritePending}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium rounded-xl transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {(isSubmitting || isWritePending) ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Simpan
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Penerima Modal */}
            <AnimatePresence>
                {showPenerimaModal && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowPenerimaModal(false)}
                    >
                        <motion.div
                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Pilih Penerima</h3>
                                <motion.button
                                    onClick={() => setShowPenerimaModal(false)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </motion.button>
                            </div>

                            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                                {ktpList.length === 0 ? (
                                    <p className="text-center text-slate-500 py-4">Tidak ada pegawai ditemukan</p>
                                ) : (
                                    ktpList.map((ktp) => (
                                        <motion.div
                                            key={ktp.ktpId}
                                            onClick={() => setSelectedKtpId(ktp.ktpId)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedKtpId === ktp.ktpId
                                                ? 'bg-cyan-50 dark:bg-cyan-900/30 border-cyan-500 dark:border-cyan-400'
                                                : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:border-cyan-300 dark:hover:border-cyan-600'
                                                }`}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${selectedKtpId === ktp.ktpId
                                                    ? 'bg-cyan-500 text-white'
                                                    : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
                                                    }`}>
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-slate-800 dark:text-white">{ktp.nama}</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">NIK: {ktp.nik}</p>
                                                </div>
                                                {selectedKtpId === ktp.ktpId && (
                                                    <CheckCircle className="w-5 h-5 text-cyan-500" />
                                                )}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            <div className="flex gap-3">
                                <motion.button
                                    onClick={() => setShowPenerimaModal(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-medium rounded-xl transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Batal
                                </motion.button>
                                <motion.button
                                    onClick={() => {
                                        if (!selectedKtpId) return;
                                        setIsSubmittingPenerima(true);
                                        writeContract({
                                            address: DIAMOND_ADDRESS as `0x${string}`,
                                            abi: DIAMOND_ABI,
                                            functionName: 'editPenerimaPengiriman',
                                            args: [BigInt(pengirimanIdNumber), BigInt(selectedKtpId)],
                                        });
                                    }}
                                    disabled={!selectedKtpId || isSubmittingPenerima || isWritePending}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-400 text-white font-medium rounded-xl transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {(isSubmittingPenerima || isWritePending) ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Pilih
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
