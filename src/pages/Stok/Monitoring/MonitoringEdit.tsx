'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Activity, ArrowLeft, Save, Droplet, Plus, Trash2,
    AlertCircle, CheckCircle2, Loader2, Sparkles, Database, Hash
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { formatNumber } from '@/lib/utils';

// Blockchain Interfaces
interface BlockchainStokInventoryDombak {
    stokInventoryDombakId: bigint;
    dombakId: bigint;
    namaDombak: string;
    stok: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainDombak {
    dombakId: bigint;
    spbuId: bigint;
    namaDombak: string;
    aktif: boolean;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainMonitoringStokEditInfo {
    stokInventoryId: bigint;
    produkId: bigint;
    namaProduk: string;
    totalStok: bigint;
    stokInventoryDombakList: BlockchainStokInventoryDombak[];
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
    dombakList: BlockchainDombak[];
}

// Selected dombak for form
interface SelectedDombak {
    dombakId: number;
    namaDombak: string;
    stok: string;
    isExisting: boolean;
}

export default function MonitoringEdit() {
    const navigate = useNavigate();
    const { stokId } = useParams<{ stokId: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [formLoaded, setFormLoaded] = useState(false);

    const [selectedDombaks, setSelectedDombaks] = useState<SelectedDombak[]>([]);
    const [tempDombakId, setTempDombakId] = useState<number>(0);
    const [tempStok, setTempStok] = useState<string>('0');

    // Fetch Stok Inventory Edit Info
    const { data: blockchainData, isLoading, error } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getMonitoringStokEditInfo',
        args: stokId ? [BigInt(stokId)] : undefined,
        query: {
            enabled: !!stokId,
        },
    });

    const editInfo = blockchainData as BlockchainMonitoringStokEditInfo | undefined;

    // Process available dombak list (includes currently selected and available ones)
    const allDombakList = useMemo(() => {
        if (!editInfo?.dombakList) return [];
        return editInfo.dombakList
            .filter(d => !d.deleted && d.aktif)
            .map(d => ({
                id: Number(d.dombakId),
                namaDombak: d.namaDombak
            }));
    }, [editInfo]);

    // Available dombaks (not yet selected in form)
    const availableDombaks = useMemo(() => {
        const selectedIds = selectedDombaks.map(d => d.dombakId);
        return allDombakList.filter(d => !selectedIds.includes(d.id));
    }, [allDombakList, selectedDombaks]);

    // Populate form when data loads
    useEffect(() => {
        if (editInfo && !formLoaded) {
            const existingDombaks: SelectedDombak[] = editInfo.stokInventoryDombakList
                .filter(d => !d.deleted)
                .map(d => ({
                    dombakId: Number(d.dombakId),
                    namaDombak: d.namaDombak,
                    stok: (Number(d.stok) / 100).toString(), // scaled x100
                    isExisting: true
                }));
            setSelectedDombaks(existingDombaks);
            setFormLoaded(true);
        }
    }, [editInfo, formLoaded]);

    // Add dombak to selection
    const handleAddDombak = () => {
        if (tempDombakId === 0 || !tempStok) return;

        const dombak = allDombakList.find(d => d.id === tempDombakId);
        if (!dombak) return;

        setSelectedDombaks([...selectedDombaks, {
            dombakId: tempDombakId,
            namaDombak: dombak.namaDombak,
            stok: tempStok,
            isExisting: false
        }]);

        setTempDombakId(0);
        setTempStok('0');
    };

    // Remove dombak from selection
    const handleRemoveDombak = (dombakId: number) => {
        setSelectedDombaks(selectedDombaks.filter(d => d.dombakId !== dombakId));
    };

    // Update stok for a dombak
    const handleUpdateStok = (dombakId: number, stok: string) => {
        setSelectedDombaks(selectedDombaks.map(d =>
            d.dombakId === dombakId ? { ...d, stok } : d
        ));
    };

    // Calculate total stok
    const totalStok = useMemo(() => {
        return selectedDombaks.reduce((sum, d) => sum + (parseFloat(d.stok) || 0), 0);
    }, [selectedDombaks]);

    const notFound = !isLoading && !error && !editInfo;

    const { writeContractAsync } = useWriteContract();

    const handleSubmit = async () => {
        if (!stokId) return;
        if (selectedDombaks.length === 0) {
            setSubmitError('Tambahkan minimal satu dombak');
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Prepare arrays for blockchain call
            const dombakIds = selectedDombaks.map(d => BigInt(d.dombakId));
            const stoks = selectedDombaks.map(d => BigInt(Math.round(parseFloat(d.stok) * 100))); // Scale x100

            await writeContractAsync({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'updateStokInventory',
                args: [
                    BigInt(stokId),
                    dombakIds,
                    stoks
                ],
            });

            setSubmitSuccess(true);
            setTimeout(() => {
                navigate(`/stok/pemantauan-stok/${stokId}`);
            }, 1500);
        } catch (error: any) {
            console.error('Error submitting form:', error);
            setSubmitError(error.message || 'Terjadi kesalahan saat menyimpan');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading State
    if (isLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-50 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat data Stok Inventory...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Not Found State
    if (notFound || !editInfo) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-50 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4 text-center p-8"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Stok Inventory Tidak Ditemukan</h2>
                        <p className="text-slate-600 dark:text-slate-400">Data Stok Inventory dengan ID {stokId} tidak ditemukan.</p>
                        <motion.button
                            onClick={() => navigate('/stok/pemantauan-stok')}
                            className="mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-2xl"
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
            <div className="absolute inset-0 bg-blue-50 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-blue-400/20 to-indigo-400/20 dark:from-blue-600/30 dark:to-indigo-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-cyan-400/15 to-blue-400/15 dark:from-cyan-500/20 dark:to-blue-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate(`/stok/pemantauan-stok/${stokId}`)}
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
                    <div className="flex items-center gap-4">
                        <motion.div
                            className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30"
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Activity className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Edit Stok Inventory
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Perbarui data Stok Inventory #{stokId}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Product Info Card */}
                <motion.div
                    className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-500/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Produk</p>
                            <p className="font-semibold text-slate-800 dark:text-white">{editInfo.namaProduk}</p>
                        </div>
                        <div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Produk ID</p>
                            <p className="font-semibold text-slate-800 dark:text-white">{Number(editInfo.produkId)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Jumlah Dombak</p>
                            <p className="font-semibold text-slate-800 dark:text-white">{selectedDombaks.length}</p>
                        </div>
                        <div>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Total Stok</p>
                            <p className="font-bold text-emerald-700 dark:text-emerald-300">{formatNumber(totalStok)} L</p>
                        </div>
                    </div>
                </motion.div>

                {/* Form Card */}
                <motion.div
                    className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {/* Glassmorphism Background */}
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                    {/* Animated Sparkles */}
                    <motion.div
                        className="absolute top-[10%] right-[10%] pointer-events-none"
                        animate={{ opacity: [0, 0.5, 0], scale: [0, 1, 0] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    >
                        <Sparkles className="w-5 h-5 text-blue-400/50" />
                    </motion.div>

                    {/* Form Content */}
                    <div className="relative z-10 p-6 md:p-8 space-y-6">
                        {/* Add Dombak Section */}
                        <motion.div
                            className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-500/30"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-4 flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Tambah Dombak Baru
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Dombak Select */}
                                <div className="md:col-span-1">
                                    <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Pilih Dombak</label>
                                    <select
                                        value={tempDombakId}
                                        onChange={(e) => setTempDombakId(Number(e.target.value))}
                                        disabled={availableDombaks.length === 0}
                                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer disabled:opacity-50"
                                    >
                                        <option value={0}>-- Pilih Dombak --</option>
                                        {availableDombaks.map(d => (
                                            <option key={d.id} value={d.id}>
                                                {d.namaDombak}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Initial Stok Input */}
                                <div className="md:col-span-1">
                                    <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Stok Awal (L)</label>
                                    <input
                                        type="number"
                                        value={tempStok}
                                        onChange={(e) => setTempStok(e.target.value)}
                                        min={0}
                                        step="0.01"
                                        placeholder="0"
                                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    />
                                </div>

                                {/* Add Button */}
                                <div className="md:col-span-1 flex items-end">
                                    <motion.button
                                        type="button"
                                        onClick={handleAddDombak}
                                        disabled={tempDombakId === 0}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Tambah
                                    </motion.button>
                                </div>
                            </div>
                            {availableDombaks.length === 0 && allDombakList.length > 0 && (
                                <p className="mt-3 text-xs text-blue-600 dark:text-blue-400">
                                    Semua dombak sudah ditambahkan
                                </p>
                            )}
                        </motion.div>

                        {/* Selected Dombaks List */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                <Database className="w-4 h-4 text-cyan-500" />
                                Dombak Terpilih ({selectedDombaks.length})
                            </h3>

                            {selectedDombaks.length === 0 ? (
                                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600">
                                    <Droplet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Belum ada dombak yang dipilih
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <AnimatePresence>
                                        {selectedDombaks.map((dombak) => (
                                            <motion.div
                                                key={dombak.dombakId}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${dombak.isExisting
                                                            ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                                            : 'bg-blue-100 dark:bg-blue-900/30'
                                                            }`}>
                                                            <Droplet className={`w-5 h-5 ${dombak.isExisting
                                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                                : 'text-blue-600 dark:text-blue-400'
                                                                }`} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-slate-800 dark:text-white">
                                                                {dombak.namaDombak}
                                                            </h4>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                ID: {dombak.dombakId} {dombak.isExisting && '(Sudah ada)'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-xs text-slate-500 dark:text-slate-400">Stok (L):</label>
                                                            <input
                                                                type="number"
                                                                value={dombak.stok}
                                                                onChange={(e) => handleUpdateStok(dombak.dombakId, e.target.value)}
                                                                min={0}
                                                                step="0.01"
                                                                className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
                                                            />
                                                        </div>
                                                        <motion.button
                                                            onClick={() => handleRemoveDombak(dombak.dombakId)}
                                                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {/* Total Summary */}
                                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-500/30">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-emerald-700 dark:text-emerald-300">Total Stok</span>
                                            <span className="font-bold text-emerald-800 dark:text-emerald-200">
                                                {formatNumber(totalStok)} L
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Error Message */}
                        {submitError && (
                            <motion.div
                                className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-500/30 flex items-center gap-3"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
                            </motion.div>
                        )}

                        {/* Form Actions */}
                        <motion.div
                            className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <motion.button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting || submitSuccess || selectedDombaks.length === 0}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-2xl transition-all shadow-lg ${submitSuccess
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/30'
                                    } disabled:opacity-70 disabled:cursor-not-allowed`}
                                whileHover={{ scale: isSubmitting || submitSuccess ? 1 : 1.02, y: isSubmitting || submitSuccess ? 0 : -2 }}
                                whileTap={{ scale: isSubmitting || submitSuccess ? 1 : 0.98 }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : submitSuccess ? (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Berhasil Diupdate!
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Simpan Perubahan
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Form Tips */}
                <motion.div
                    className="mt-6 p-4 bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm rounded-2xl border border-blue-200/50 dark:border-blue-500/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                >
                    <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                        💡 Informasi
                    </h3>
                    <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                        <li>• Dombak berwarna hijau adalah dombak yang sudah terdaftar sebelumnya</li>
                        <li>• Dombak berwarna biru adalah dombak yang baru ditambahkan</li>
                        <li>• Hapus dombak dari daftar untuk menghapusnya dari stok inventory</li>
                        <li>• Total stok akan dihitung otomatis dari semua dombak yang dipilih</li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
}
