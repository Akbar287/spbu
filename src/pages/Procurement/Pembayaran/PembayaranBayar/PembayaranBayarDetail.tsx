'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import {
    Wallet, ArrowLeft, Loader2,
    Building, CreditCard, User, Banknote, Hash,
    CheckCircle, Clock, AlertCircle, Calendar, FileText, ShieldCheck
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain interfaces for Jabatan
interface BlockchainJabatanWithRole {
    jabatanId: bigint;
    levelId: bigint;
    namaJabatan: string;
    keterangan: string;
    roleHash: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// Interface
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

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

const formatDateTime = (timestamp: bigint | number): string => {
    const date = new Date(Number(timestamp) * 1000);
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export default function PembayaranBayarDetail() {
    const navigate = useNavigate();
    const { address } = useAccount();
    const { rencanaId, pembayaranId } = useParams<{ rencanaId: string, pembayaranId: string }>();
    const planId = rencanaId ? parseInt(rencanaId, 10) : 0;
    const payId = pembayaranId ? parseInt(pembayaranId, 10) : 0;
    const isValid = planId > 0 && payId > 0;

    const [isConfirming, setIsConfirming] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState<'admin' | 'direktur' | null>(null);

    // Fetch Payment Data
    const { data: pembayaranData, isLoading, refetch } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getPembayaranById',
        args: [BigInt(payId)],
        query: { enabled: isValid }
    });

    // Fetch all Jabatan to get roleHash (SSOT)
    const { data: jabatanResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllJabatan',
        args: [BigInt(0), BigInt(100)],
    });

    // Extract roleHash by jabatan name
    const roleHashes = useMemo(() => {
        const EMPTY_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';
        if (!jabatanResponse) return { admin: null, direktur: null, direkturUtama: null };

        const [jabatanList] = jabatanResponse as [BlockchainJabatanWithRole[], bigint];
        const result: { admin: string | null; direktur: string | null; direkturUtama: string | null } = {
            admin: null,
            direktur: null,
            direkturUtama: null
        };

        for (const j of jabatanList) {
            if (j.deleted || !j.roleHash || j.roleHash === EMPTY_HASH) continue;
            const name = j.namaJabatan.toLowerCase();
            if (name === 'admin') result.admin = j.roleHash;
            else if (name === 'direktur') result.direktur = j.roleHash;
            else if (name === 'direktur utama') result.direkturUtama = j.roleHash;
        }
        return result;
    }, [jabatanResponse]);

    // Check if user is Admin
    const { data: isAdminResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'hasRole',
        args: [roleHashes.admin as `0x${string}`, address as `0x${string}`],
        query: { enabled: !!address && !!roleHashes.admin }
    });
    const isAdmin = isAdminResponse as boolean ?? false;

    // Check if user is Direktur
    const { data: isDirekturResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'hasRole',
        args: [roleHashes.direktur as `0x${string}`, address as `0x${string}`],
        query: { enabled: !!address && !!roleHashes.direktur }
    });

    // Check if user is Direktur Utama
    const { data: isDirekturUtamaResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'hasRole',
        args: [roleHashes.direkturUtama as `0x${string}`, address as `0x${string}`],
        query: { enabled: !!address && !!roleHashes.direkturUtama }
    });
    const isDirektur = (isDirekturResponse as boolean ?? false) || (isDirekturUtamaResponse as boolean ?? false);

    // Write contract for confirmation
    const { writeContract, isSuccess } = useWriteContract();

    // Handle confirmation success
    useEffect(() => {
        if (isSuccess) {
            setIsConfirming(false);
            setShowConfirmModal(null);
            refetch();
        }
    }, [isSuccess, refetch]);

    const p = pembayaranData as BlockchainPembayaran | undefined;

    const handleConfirmAdmin = () => {
        if (!payId) return;
        setIsConfirming(true);
        writeContract({
            address: DIAMOND_ADDRESS as `0x${string}`,
            abi: DIAMOND_ABI,
            functionName: 'konfirmasiAdminPembayaran',
            args: [BigInt(payId)]
        });
    };

    const handleConfirmDirektur = () => {
        if (!payId) return;
        setIsConfirming(true);
        writeContract({
            address: DIAMOND_ADDRESS as `0x${string}`,
            abi: DIAMOND_ABI,
            functionName: 'konfirmasiDirekturPembayaran',
            args: [BigInt(payId)]
        });
    };

    if (isLoading) return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
    );

    if (!isValid || !p || p.deleted || Number(p.pembayaranId) === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Data Tidak Ditemukan</h2>
                <button
                    onClick={() => navigate(`/procurement/pembayaran/${rencanaId}/bayar`)}
                    className="mt-4 text-emerald-600 hover:underline"
                >
                    Kembali
                </button>
            </div>
        );
    }

    // Show admin confirm button if: user is admin AND not yet confirmed by admin
    const canConfirmAdmin = isAdmin && !p.konfirmasiAdmin;
    // Show direktur confirm button if: user is direktur AND admin already confirmed AND not yet confirmed by direktur
    const canConfirmDirektur = isDirektur && p.konfirmasiAdmin && !p.konfirmasiDirektur;

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-900">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-emerald-100/50 to-transparent dark:from-emerald-900/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-teal-100/50 to-transparent dark:from-teal-900/20 blur-3xl" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                <motion.button
                    onClick={() => navigate('/procurement/pembayaran/' + rencanaId + '/bayar')}
                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </motion.button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-2 space-y-6"
                    >
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white">
                                <h1 className="text-2xl font-bold flex items-center gap-3">
                                    <Wallet className="w-6 h-6" />
                                    Detail Pembayaran #{payId}
                                </h1>
                                <p className="text-emerald-100 mt-2 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Dibuat pada {formatDateTime(p.createdAt)}
                                </p>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                                        <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-2">
                                            <Building className="w-3 h-3" /> Nama Bank
                                        </label>
                                        <p className="text-lg font-medium text-slate-900 dark:text-white">{p.namaBank}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                                        <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-2">
                                            <CreditCard className="w-3 h-3" /> No. Rekening
                                        </label>
                                        <p className="text-lg font-medium text-slate-900 dark:text-white">{p.noRekening}</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                                    <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-2">
                                        <User className="w-3 h-3" /> Nama Pemilik Rekening
                                    </label>
                                    <p className="text-lg font-medium text-slate-900 dark:text-white">{p.namaRekening}</p>
                                </div>

                                <div className="p-4 result-box rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <label className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold mb-1 flex items-center gap-2">
                                                <Banknote className="w-3 h-3" /> Nominal Bayar
                                            </label>
                                            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                                                {formatCurrency(Number(p.totalBayar) / 100)}
                                            </p>
                                        </div>
                                        <div className="md:text-right">
                                            <label className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold mb-1 flex items-center gap-2 md:justify-end">
                                                <Hash className="w-3 h-3" /> Referensi
                                            </label>
                                            <p className="text-lg font-medium text-emerald-800 dark:text-emerald-300">
                                                {p.noCekBg || '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="p-6 pt-0 space-y-3">
                                {/* File Button */}
                                <button
                                    onClick={() => navigate(`/procurement/pembayaran/${rencanaId}/bayar/${pembayaranId}/file`)}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
                                >
                                    <FileText className="w-5 h-5" />
                                    File Bukti Bayar
                                </button>

                                {/* Confirmation Buttons */}
                                {canConfirmAdmin && (
                                    <motion.button
                                        onClick={() => setShowConfirmModal('admin')}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <ShieldCheck className="w-5 h-5" />
                                        Konfirmasi Admin
                                    </motion.button>
                                )}

                                {canConfirmDirektur && (
                                    <motion.button
                                        onClick={() => setShowConfirmModal('direktur')}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <ShieldCheck className="w-5 h-5" />
                                        Konfirmasi Direktur
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Timeline Status */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 h-fit sticky top-8"
                    >
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Status Konfirmasi</h3>

                        <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                            {/* Created */}
                            <div className="relative">
                                <div className="absolute -left-[2.1rem] w-7 h-7 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-800 flex items-center justify-center">
                                    <CheckCircle className="w-3 h-3 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800 dark:text-white">Dibuat</h4>
                                    <p className="text-xs text-slate-500 mt-1">{formatDateTime(p.createdAt)}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Oleh: {shortenAddress(p.walletMember)}</p>
                                </div>
                            </div>

                            {/* Admin Confirmation */}
                            <div className="relative">
                                <div className={`absolute -left-[2.1rem] w-7 h-7 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center ${p.konfirmasiAdmin ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                                    }`}>
                                    {p.konfirmasiAdmin ? (
                                        <CheckCircle className="w-3 h-3 text-white" />
                                    ) : (
                                        <Clock className="w-3 h-3 text-slate-500" />
                                    )}
                                </div>
                                <div>
                                    <h4 className={`font-semibold ${p.konfirmasiAdmin ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                                        Konfirmasi Admin
                                    </h4>
                                    {p.konfirmasiAdmin ? (
                                        <>
                                            <p className="text-xs text-slate-500 mt-1">{formatDateTime(p.konfirmasiAtAdmin)}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Oleh: {shortenAddress(p.konfirmasiByAdmin)}</p>
                                        </>
                                    ) : (
                                        <p className="text-xs text-amber-500 mt-1 italic">Menunggu konfirmasi admin...</p>
                                    )}
                                </div>
                            </div>

                            {/* Direktur Confirmation */}
                            <div className="relative">
                                <div className={`absolute -left-[2.1rem] w-7 h-7 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center ${p.konfirmasiDirektur ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                                    }`}>
                                    {p.konfirmasiDirektur ? (
                                        <CheckCircle className="w-3 h-3 text-white" />
                                    ) : (
                                        <Clock className="w-3 h-3 text-slate-500" />
                                    )}
                                </div>
                                <div>
                                    <h4 className={`font-semibold ${p.konfirmasiDirektur ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                                        Konfirmasi Direktur
                                    </h4>
                                    {p.konfirmasiDirektur ? (
                                        <>
                                            <p className="text-xs text-slate-500 mt-1">{formatDateTime(p.konfirmasiAtDirektur)}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Oleh: {shortenAddress(p.konfirmasiByDirektur)}</p>
                                        </>
                                    ) : (
                                        <p className={`text-xs mt-1 italic ${!p.konfirmasiAdmin ? 'text-slate-400' : 'text-amber-500'}`}>
                                            {!p.konfirmasiAdmin ? 'Menunggu admin selesai...' : 'Menunggu konfirmasi direktur...'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className={`mt-8 p-4 rounded-xl text-center ${p.konfirmasiAdmin && p.konfirmasiDirektur
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            }`}>
                            <p className="font-bold text-sm uppercase tracking-wide">
                                Status: {p.konfirmasiAdmin && p.konfirmasiDirektur ? 'CONFIRMED' : 'PENDING'}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {showConfirmModal && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !isConfirming && setShowConfirmModal(null)}
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
                                    className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${showConfirmModal === 'admin'
                                        ? 'bg-blue-100 dark:bg-blue-900/30'
                                        : 'bg-purple-100 dark:bg-purple-900/30'
                                        }`}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.1 }}
                                >
                                    <ShieldCheck className={`w-8 h-8 ${showConfirmModal === 'admin' ? 'text-blue-500' : 'text-purple-500'}`} />
                                </motion.div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                    Konfirmasi {showConfirmModal === 'admin' ? 'Admin' : 'Direktur'}?
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Apakah Anda yakin ingin mengkonfirmasi pembayaran sebesar <strong className="text-emerald-600">{formatCurrency(Number(p.totalBayar) / 100)}</strong> ke <strong>{p.namaBank}</strong>?
                                </p>
                                <div className="flex gap-3">
                                    <motion.button
                                        onClick={() => setShowConfirmModal(null)}
                                        disabled={isConfirming}
                                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                                        whileHover={{ scale: isConfirming ? 1 : 1.02 }}
                                        whileTap={{ scale: isConfirming ? 1 : 0.98 }}
                                    >
                                        Batal
                                    </motion.button>
                                    <motion.button
                                        onClick={showConfirmModal === 'admin' ? handleConfirmAdmin : handleConfirmDirektur}
                                        disabled={isConfirming}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white font-semibold rounded-2xl shadow-lg disabled:opacity-70 ${showConfirmModal === 'admin'
                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-500/30'
                                            : 'bg-gradient-to-r from-purple-500 to-pink-600 shadow-purple-500/30'
                                            }`}
                                        whileHover={{ scale: isConfirming ? 1 : 1.02 }}
                                        whileTap={{ scale: isConfirming ? 1 : 0.98 }}
                                    >
                                        {isConfirming ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="w-4 h-4" />
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
