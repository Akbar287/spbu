'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Wallet, ArrowLeft, Plus, Edit3, Trash2, Eye,
    Loader2, CreditCard, Banknote, Calendar, CheckCircle,
    AlertCircle, TrendingDown
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { waitForTransactionReceipt } from 'viem/actions';
import { useConfig } from 'wagmi';

// Interfaces
interface BlockchainPembayaran {
    pembayaranId: bigint;
    rencanaPembelianId: bigint;
    walletMember: string;
    noCekBg: string;
    noRekening: string;
    namaRekening: string;
    namaBank: string;
    totalBayar: bigint;
    konfirmasiAdmin: boolean;
    konfirmasiDirektur: boolean;
    konfirmasiByAdmin: string;
    konfirmasiByDirektur: string;
    konfirmasiAtAdmin: bigint;
    konfirmasiAtDirektur: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainRencanaPembelian {
    rencanaPembelianId: bigint;
    kodePembelian: string;
    grandTotal: bigint;
    statusPurchaseId: bigint;
}

interface BlockchainPajakPembelian {
    pajakPembelianId: bigint;
    rencanaPembelianId: bigint;
    pajakPembelianLibId: bigint;
    netPrice: bigint;
    ppn: bigint;
    ppbkb: bigint;
    pph: bigint;
    grossPrice: bigint;
    calculated: boolean;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface Pembayaran {
    pembayaranId: number;
    rencanaPembelianId: number;
    noCekBg: string; // Used for Bank Name in this context based on user request usually, but let's stick to field names
    noRekening: string;
    namaRekening: string;
    namaBank: string;
    totalBayar: number;
    konfirmasiAdmin: boolean;
    konfirmasiDirektur: boolean;
    createdAt: Date;
    status: 'Pending' | 'Confirmed';
}

// Animation Variants
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

// Helper functions
const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

const formatTanggal = (date: Date): string => {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

export default function PembayaranBayarIndex() {
    const navigate = useNavigate();
    const { rencanaId } = useParams<{ rencanaId: string }>();
    const rencanaPembelianId = rencanaId ? parseInt(rencanaId, 10) : 0;
    const isValidId = !isNaN(rencanaPembelianId) && rencanaPembelianId > 0;
    const config = useConfig();


    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isDeleting, setIsDeleting] = useState(false);
    const [page, setPage] = useState(0); // View data offsets usually 0-indexed in smart contract calls here
    const limit = 10;
    const [deleteTarget, setDeleteTarget] = useState<Pembayaran | null>(null);

    // 1. Fetch Rencana Pembelian Info (for Total Bill)
    const { data: rencanaData } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getRencanaPembelianById',
        args: [BigInt(rencanaPembelianId)],
        query: { enabled: isValidId }
    });

    const rencanaPembelian = rencanaData as BlockchainRencanaPembelian | undefined;

    // 1b. Fetch Rincian to get Gross Price (includes taxes) - same approach as PembayaranShow
    const { data: rincianResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getRincianPembelianDetails',
        args: [BigInt(rencanaPembelianId)],
        query: { enabled: isValidId }
    });

    // Extract grossPrice from rincian data (same as PembayaranShow.tsx)
    const grossTotal = useMemo(() => {
        if (!rincianResponse) return 0;
        const rincianList = rincianResponse as Array<{ gross: bigint }>;
        if (!rincianList || rincianList.length === 0) return 0;
        // Get gross from first item (all items have same total tax info)
        return Number(rincianList[0].gross);
    }, [rincianResponse]);

    // 2. Fetch Payment Count
    const { data: countData, refetch: refetchCount } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getCountAllPembayaran',
        args: [BigInt(rencanaPembelianId)],
        query: { enabled: isValidId }
    });

    const totalItems = countData ? Number(countData) : 0;

    // 3. Fetch Payments
    const { data: pembayaranData, isLoading, error: pembayaranError, refetch: refetchList } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllPembayaran',
        args: [BigInt(page * limit), BigInt(limit), BigInt(rencanaPembelianId)],
        query: { enabled: isValidId }
    });
    // 4. Delete Action
    const { writeContractAsync } = useWriteContract();

    const handleDeleteClick = (pembayaran: Pembayaran) => {
        setDeleteTarget(pembayaran);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            setIsDeleting(true);
            const hash = await writeContractAsync({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'deletePembayaran',
                args: [BigInt(deleteTarget.pembayaranId)]
            });

            await waitForTransactionReceipt(config.getClient(), { hash });
            refetchList();
            refetchCount();
            setDeleteTarget(null);
        } catch (error) {
            console.error('Delete failed:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    // Process Data
    const payments = useMemo<Pembayaran[]>(() => {
        if (!pembayaranData) return [];
        try {
            const list = pembayaranData as BlockchainPembayaran[];
            if (!Array.isArray(list)) {
                console.error('Data is not array:', list);
                return [];
            }
            return list.map(p => ({
                pembayaranId: Number(p.pembayaranId),
                rencanaPembelianId: Number(p.rencanaPembelianId),
                noCekBg: p.noCekBg,
                noRekening: p.noRekening,
                namaRekening: p.namaRekening,
                namaBank: p.namaBank,
                totalBayar: Number(p.totalBayar), // scaled x100 in contract? Assume consistent scaling
                konfirmasiAdmin: p.konfirmasiAdmin,
                konfirmasiDirektur: p.konfirmasiDirektur,
                createdAt: new Date(Number(p.createdAt) * 1000),
                status: (p.konfirmasiAdmin && p.konfirmasiDirektur) ? 'Confirmed' : 'Pending'
            }));
        } catch (e) {
            console.error('Mapping error:', e);
            return [];
        }
    }, [pembayaranData]);


    // Calculate Summary - Using grossTotal (includes taxes) as the total to pay
    const { totalTagihan, totalBayar, sisaTagihan } = useMemo(() => {
        // Use grossTotal from PajakPembelian (includes taxes)
        // Both grossTotal and totalBayar are scaled x100 in contract
        const tagihan = grossTotal / 100;
        // Sum ALL approved payments (confirmed by admin AND direktur)
        const bayar = payments
            .filter(p => p.konfirmasiAdmin && p.konfirmasiDirektur)
            .reduce((acc, curr) => acc + curr.totalBayar / 100, 0);
        return {
            totalTagihan: tagihan,
            totalBayar: bayar,
            sisaTagihan: Math.max(0, tagihan - bayar)
        };
    }, [grossTotal, payments]);

    if (!isValidId) {
        return <div className="p-8 text-center text-red-500">ID Rencana Pembelian tidak valid</div>;
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-900">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-emerald-100/50 to-transparent dark:from-emerald-900/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-teal-100/50 to-transparent dark:from-teal-900/20 blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                <motion.button
                    onClick={() => navigate('/procurement/pembayaran/' + rencanaId)}
                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </motion.button>

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                <Wallet className="w-8 h-8 text-emerald-500" />
                                Daftar Pembayaran
                            </h1>
                            <p className="text-slate-500 mt-1">
                                Kelola pembayaran untuk {rencanaPembelian?.kodePembelian || `ID #${rencanaId}`}
                            </p>
                        </div>

                        <motion.button
                            onClick={() => navigate(`/procurement/pembayaran/${rencanaId}/bayar/create`)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 font-semibold"
                        >
                            <Plus className="w-5 h-5" />
                            Tambah Pembayaran
                        </motion.button>
                    </div>
                </motion.div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Total Tagihan */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Banknote className="w-24 h-24 text-slate-800 dark:text-white" />
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tagihan</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                            {formatCurrency(totalTagihan)}
                        </h3>
                    </motion.div>

                    {/* Sudah Dibayar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-700 shadow-sm relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <CheckCircle className="w-24 h-24 text-emerald-600" />
                        </div>
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Sudah Dibayar</p>
                        <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            {formatCurrency(totalBayar)}
                        </h3>
                    </motion.div>

                    {/* Sisa Tagihan */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-orange-200 dark:border-orange-700 shadow-sm relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrendingDown className="w-24 h-24 text-orange-600" />
                        </div>
                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Sisa Tagihan</p>
                        <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                            {formatCurrency(sisaTagihan)}
                        </h3>
                    </motion.div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && payments.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700"
                    >
                        <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                            <CreditCard className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Belum Ada Pembayaran</h3>
                        <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                            Belum ada riwayat pembayaran untuk rencana pembelian ini. Silakan buat pembayaran baru.
                        </p>
                    </motion.div>
                )}

                {/* Grid Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {payments.map((item) => (
                        <div
                            key={item.pembayaranId}
                            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow group relative overflow-hidden"
                        >
                            {/* Header Info */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                                        <Banknote className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800 dark:text-white">{item.namaBank}</h3>
                                        <p className="text-xs text-slate-500">{item.noRekening}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${item.status === 'Confirmed'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>
                                    {item.status}
                                </span>
                            </div>

                            {/* Main Amount */}
                            <div className="mb-4">
                                <p className="text-xs text-slate-500 mb-1">Nominal Bayar</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-white">
                                    {formatCurrency(item.totalBayar / 100)}
                                </p>
                            </div>

                            {/* Details */}
                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Wallet className="w-4 h-4" />
                                    <span>{item.namaRekening}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatTanggal(item.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Ref: {item.noCekBg || '-'}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    onClick={() => navigate(`/procurement/pembayaran/${rencanaId}/bayar/${item.pembayaranId}`)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                                >
                                    <Eye className="w-4 h-4" />
                                    Detail
                                </button>

                                {!item.konfirmasiAdmin && (
                                    <>
                                        <button
                                            onClick={() => navigate(`/procurement/pembayaran/${rencanaId}/bayar/${item.pembayaranId}/edit`)}
                                            className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                                            title="Edit"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(item)}
                                            disabled={isDeleting}
                                            className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                                            title="Hapus"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination (Simple prev/next if needed, currently just one page limit) */}
                {/* Add pagination controls here if limit < totalItems */}
            </div>
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !isDeleting && setDeleteTarget(null)}
                    >
                        <motion.div
                            className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 text-center">
                                <motion.div
                                    className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.1 }}
                                >
                                    <Trash2 className="w-8 h-8 text-red-500" />
                                </motion.div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                    Hapus Pembayaran?
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Apakah Anda yakin ingin menghapus pembayaran ke <strong className="text-slate-800 dark:text-white">{deleteTarget.namaBank}</strong> sebesar <strong className="text-emerald-600">{formatCurrency(deleteTarget.totalBayar / 100)}</strong>?
                                </p>
                                <div className="flex gap-3">
                                    <motion.button
                                        onClick={() => setDeleteTarget(null)}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                                        whileHover={{ scale: isDeleting ? 1 : 1.02 }}
                                        whileTap={{ scale: isDeleting ? 1 : 0.98 }}
                                    >
                                        Batal
                                    </motion.button>
                                    <motion.button
                                        onClick={confirmDelete}
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
