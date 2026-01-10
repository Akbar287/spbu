'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, X, Droplet, CheckCircle2,
    Loader2, AlertCircle, Plus, Trash2, Activity, Hash
} from 'lucide-react';
import { DIAMOND_ABI, DIAMOND_ADDRESS } from '@/contracts/config';
import { useReadContract, useWriteContract } from 'wagmi';
import { formatNumber } from '@/lib/utils';

// Blockchain interfaces
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

interface BlockchainDombak {
    dombakId: bigint;
    spbuId: bigint;
    namaDombak: string;
    aktif: boolean;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface MonitoringStokCreateInfo {
    produkList: BlockchainProduk[];
    dombakList: BlockchainDombak[];
}

// Selected dombak with stok
interface SelectedDombak {
    dombakId: number;
    namaDombak: string;
    stok: string;
}

export default function MonitoringCreate() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [selectedProdukId, setSelectedProdukId] = useState<number>(0);
    const [selectedDombaks, setSelectedDombaks] = useState<SelectedDombak[]>([]);
    const [tempDombakId, setTempDombakId] = useState<number>(0);
    const [tempStok, setTempStok] = useState<string>('0');

    // Fetch data from getDataToCreateStokInventory
    const { data: createInfoResponse, isLoading } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getDataToCreateStokInventory',
        args: [],
    });

    const createInfo = createInfoResponse as MonitoringStokCreateInfo | undefined;

    // Convert produk list
    const produkList = useMemo(() => {
        if (!createInfo?.produkList) return [];
        return createInfo.produkList
            .filter(p => !p.deleted && p.aktif)
            .map(p => ({
                id: Number(p.produkId),
                namaProduk: p.namaProduk,
                oktan: Number(p.oktan)
            }));
    }, [createInfo]);

    // Convert dombak list
    const dombakList = useMemo(() => {
        if (!createInfo?.dombakList) return [];
        return createInfo.dombakList
            .filter(d => !d.deleted && d.aktif)
            .map(d => ({
                id: Number(d.dombakId),
                namaDombak: d.namaDombak
            }));
    }, [createInfo]);

    // Available dombaks (not yet selected)
    const availableDombaks = useMemo(() => {
        const selectedIds = selectedDombaks.map(d => d.dombakId);
        return dombakList.filter(d => !selectedIds.includes(d.id));
    }, [dombakList, selectedDombaks]);

    // Add dombak to selection
    const handleAddDombak = () => {
        if (tempDombakId === 0 || !tempStok) return;

        const dombak = dombakList.find(d => d.id === tempDombakId);
        if (!dombak) return;

        setSelectedDombaks([...selectedDombaks, {
            dombakId: tempDombakId,
            namaDombak: dombak.namaDombak,
            stok: tempStok
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

    const { writeContractAsync } = useWriteContract();

    const handleSubmit = async () => {
        if (selectedProdukId === 0) {
            setSubmitError('Pilih produk terlebih dahulu');
            return;
        }
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
                functionName: 'createStokInventory',
                args: [
                    BigInt(selectedProdukId),
                    dombakIds,
                    stoks
                ],
            });

            setSubmitSuccess(true);
            setTimeout(() => {
                navigate('/stok/pemantauan-stok');
            }, 1500);
        } catch (error: any) {
            console.error('Error submitting form:', error);
            setSubmitError(error.message || 'Terjadi kesalahan saat menyimpan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setSelectedProdukId(0);
        setSelectedDombaks([]);
        setTempDombakId(0);
        setTempStok('0');
        setSubmitError(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-50 dark:bg-slate-900" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">Memuat data...</p>
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
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-cyan-400/15 to-blue-400/15 dark:from-cyan-500/20 dark:to-blue-500/20 blur-3xl"
                    animate={{
                        x: [0, -80, 0],
                        y: [0, -60, 0],
                        scale: [1.2, 1, 1.2],
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/stok/pemantauan-stok')}
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
                                Tambah Stok Inventory
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Buat stok inventory baru untuk produk BBM
                            </p>
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

                    {/* Form Content */}
                    <div className="relative z-10 p-6 md:p-8 space-y-6">
                        {/* Produk Selection */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Droplet className="w-4 h-4 text-blue-500" />
                                Pilih Produk
                            </label>
                            <select
                                value={selectedProdukId}
                                onChange={(e) => setSelectedProdukId(Number(e.target.value))}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
                            >
                                <option value={0}>-- Pilih Produk --</option>
                                {produkList.map((produk) => (
                                    <option key={produk.id} value={produk.id}>
                                        {produk.namaProduk} (RON {produk.oktan})
                                    </option>
                                ))}
                            </select>
                            {produkList.length === 0 && (
                                <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    Tidak ada produk tersedia (semua produk sudah memiliki stok inventory)
                                </p>
                            )}
                        </motion.div>

                        {/* Add Dombak Section */}
                        <motion.div
                            className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-500/30"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-4 flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Tambah Dombak
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
                                    <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Initial Stok (L)</label>
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
                            {availableDombaks.length === 0 && dombakList.length > 0 && (
                                <p className="mt-3 text-xs text-blue-600 dark:text-blue-400">
                                    Semua dombak sudah ditambahkan
                                </p>
                            )}
                        </motion.div>

                        {/* Selected Dombaks List */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                <Droplet className="w-4 h-4 text-cyan-500" />
                                Dombak yang Dipilih ({selectedDombaks.length})
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
                                                        <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                                                            <Droplet className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-slate-800 dark:text-white">
                                                                {dombak.namaDombak}
                                                            </h4>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                ID: {dombak.dombakId}
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

                                    {/* Summary */}
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-500/30">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-blue-700 dark:text-blue-300">Total Stok</span>
                                            <span className="font-bold text-blue-800 dark:text-blue-200">
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
                            transition={{ delay: 0.5 }}
                        >
                            <motion.button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting || submitSuccess || selectedProdukId === 0 || selectedDombaks.length === 0}
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
                                        Berhasil Disimpan!
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Simpan Stok Inventory
                                    </>
                                )}
                            </motion.button>
                            <motion.button
                                type="button"
                                onClick={handleReset}
                                disabled={isSubmitting}
                                className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                            >
                                <X className="w-5 h-5 inline-block mr-2" />
                                Reset
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Form Tips */}
                <motion.div
                    className="mt-6 p-4 bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm rounded-2xl border border-blue-200/50 dark:border-blue-500/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                >
                    <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                        💡 Informasi
                    </h3>
                    <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                        <li>• Pilih produk yang akan ditambahkan stok inventory-nya</li>
                        <li>• Setiap produk hanya bisa memiliki satu stok inventory</li>
                        <li>• Tambahkan dombak yang menyimpan produk tersebut beserta stok awalnya</li>
                        <li>• Total stok adalah jumlah dari semua stok di masing-masing dombak</li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
}
