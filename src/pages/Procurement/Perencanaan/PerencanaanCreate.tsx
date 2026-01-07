'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import { simulateContract, writeContract } from '@wagmi/core';
import {
    ClipboardList, ArrowLeft, Save, Package, Calendar, Tag,
    AlertCircle, CheckCircle2, Loader2, Sparkles, Plus, Trash2,
    FileText, Droplet, Info
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { config } from '@/config/wagmi';

// Blockchain Produk interface
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

// Blockchain StatusPurchase interface
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

// Display Produk interface
interface Produk {
    id: number;
    namaProduk: string;
    oktan: number;
}

// Selected product for order
interface SelectedProduct {
    produkId: number;
    namaProduk: string;
    totalQuantity: number; // in liters
    satuan: string;
}

// Constants
const UNIT_SIZE = 8000; // Fixed unit size in liters
const SPBU_ID = 1; // Default SPBU ID

// Format date
const formatTanggal = (date: Date): string => {
    return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
};

// Format number
const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('id-ID').format(value);
};

export default function PerencanaanCreate() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [deskripsi, setDeskripsi] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
    const [selectedProdukId, setSelectedProdukId] = useState<number>(0);
    const [quantity, setQuantity] = useState<number>(8000);

    // Current date for tanggalPembelian
    const currentDate = new Date();
    const tanggalPembelian = Math.floor(currentDate.getTime() / 1000);

    // Fetch all products
    const { data: produkResponse, isLoading: isLoadingProduk } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllProduk',
        args: [BigInt(0), BigInt(100)],
    });

    // Fetch status purchase with namaStatus = "Rencana"
    const { data: statusCountResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getCountStatusPurchase',
        args: [],
    });

    // We need to find the status with namaStatus = "Rencana"
    // For simplicity, we'll fetch all and find it
    const statusCount = statusCountResponse ? Number(statusCountResponse) : 0;

    // Generate calls to fetch all status purchases
    const statusCalls = useMemo(() => {
        if (statusCount === 0) return [];
        const calls = [];
        for (let i = 1; i <= statusCount; i++) {
            calls.push(i);
        }
        return calls;
    }, [statusCount]);

    // Fetch first status (assuming ID 1 is "Rencana" or we default to 1)
    const { data: statusPurchaseResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getStatusPurchaseById',
        args: [BigInt(1)], // Default to ID 1
        query: { enabled: statusCount > 0 }
    });

    // Get status purchase ID (default to 1 for "Rencana")
    const statusPurchase = statusPurchaseResponse as BlockchainStatusPurchase | undefined;
    const statusPurchaseId = statusPurchase?.statusPurchaseId ? Number(statusPurchase.statusPurchaseId) : 1;
    const statusNama = statusPurchase?.namaStatus || 'Rencana';
    const isStatusReady = statusPurchaseId > 0 && !isNaN(statusPurchaseId);

    // Convert produk data
    const produkList = useMemo((): Produk[] => {
        if (!produkResponse) return [];
        const [data] = produkResponse as [BlockchainProduk[], bigint];
        return data
            .filter((p) => !p.deleted && p.aktif)
            .map((p) => ({
                id: Number(p.produkId),
                namaProduk: p.namaProduk,
                oktan: Number(p.oktan),
            }));
    }, [produkResponse]);

    // Add product to selection
    const handleAddProduct = () => {
        if (selectedProdukId === 0 || quantity <= 0) return;

        const produk = produkList.find(p => p.id === selectedProdukId);
        if (!produk) return;

        // Check if product already exists
        const existingIndex = selectedProducts.findIndex(p => p.produkId === selectedProdukId);
        if (existingIndex >= 0) {
            // Update quantity
            const updated = [...selectedProducts];
            updated[existingIndex].totalQuantity += quantity;
            setSelectedProducts(updated);
        } else {
            // Add new product
            setSelectedProducts([...selectedProducts, {
                produkId: selectedProdukId,
                namaProduk: produk.namaProduk,
                totalQuantity: quantity,
                satuan: 'liter',
            }]);
        }

        // Reset form
        setSelectedProdukId(0);
        setQuantity(8000);
    };

    // Remove product from selection
    const handleRemoveProduct = (produkId: number) => {
        setSelectedProducts(selectedProducts.filter(p => p.produkId !== produkId));
    };

    // Calculate units for each product (8000 liter per unit)
    const calculateUnits = (totalQuantity: number): number[] => {
        const units: number[] = [];
        let remaining = totalQuantity;
        while (remaining > 0) {
            units.push(Math.min(remaining, UNIT_SIZE));
            remaining -= UNIT_SIZE;
        }
        return units;
    };

    // Submit form
    const onSubmit = async () => {
        if (selectedProducts.length === 0) {
            setSubmitError('Pilih minimal satu produk');
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Prepare arrays for blockchain call
            const produkIds: bigint[] = [];
            const jumlahList: bigint[] = [];
            const satuanList: string[] = [];

            // Split each product into 8000 liter units
            for (const product of selectedProducts) {
                const units = calculateUnits(product.totalQuantity);
                for (const unitQty of units) {
                    produkIds.push(BigInt(product.produkId));
                    jumlahList.push(BigInt(unitQty));
                    satuanList.push(product.satuan);
                }
            }

            const safeSpbuId = !isNaN(SPBU_ID) ? SPBU_ID : 1;
            const safeStatusPurchaseId = isStatusReady ? statusPurchaseId : 1;
            const safeTanggalPembelian = !isNaN(tanggalPembelian) ? tanggalPembelian : Math.floor(Date.now() / 1000);

            const { request } = await simulateContract(config, {
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'createRencanaPembelian',
                args: [
                    BigInt(safeSpbuId),
                    BigInt(safeStatusPurchaseId),
                    BigInt(safeTanggalPembelian),
                    deskripsi,
                    produkIds,
                    jumlahList,
                    satuanList,
                ],
            });

            await writeContract(config, request);
            setSubmitSuccess(true);
            setTimeout(() => {
                navigate('/procurement/perencanaan');
            }, 1500);
        } catch (error: any) {
            console.error('Error submitting form:', error);
            setSubmitError(error.message || 'Terjadi kesalahan saat menyimpan');
            setIsSubmitting(false);
        }
    };

    // Calculate total units summary
    const totalUnits = selectedProducts.reduce((acc, p) => {
        return acc + Math.ceil(p.totalQuantity / UNIT_SIZE);
    }, 0);

    const totalLiters = selectedProducts.reduce((acc, p) => acc + p.totalQuantity, 0);

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-amber-100/80 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-amber-400/20 to-orange-400/20 dark:from-amber-600/30 dark:to-orange-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-yellow-400/15 to-amber-400/15 dark:from-yellow-500/20 dark:to-amber-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/procurement/perencanaan')}
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
                            className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/30"
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <ClipboardList className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Buat Perencanaan Pembelian
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Tambahkan produk BBM yang akan dipesan
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
                            <Sparkles className="w-4 h-4 text-amber-400/60 dark:text-amber-300/40" />
                        </motion.div>
                    ))}

                    {/* Form Content */}
                    <div className="relative z-10 p-6 md:p-8 space-y-6">
                        {/* Read-only Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Tanggal Pembelian (Read-only) */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Calendar className="w-4 h-4 text-amber-500" />
                                    Tanggal Pembelian
                                </label>
                                <div className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                                    {formatTanggal(currentDate)}
                                </div>
                                <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                                    <Info className="w-3 h-3" /> Otomatis diisi dengan tanggal hari ini
                                </p>
                            </motion.div>

                            {/* Status (Read-only) */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.35 }}
                            >
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Tag className="w-4 h-4 text-amber-500" />
                                    Status
                                </label>
                                <div className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                                    {statusNama}
                                </div>
                                <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                                    <Info className="w-3 h-3" /> Status default untuk perencanaan baru
                                </p>
                            </motion.div>
                        </div>

                        {/* Deskripsi */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <FileText className="w-4 h-4 text-amber-500" />
                                Deskripsi (Opsional)
                            </label>
                            <textarea
                                value={deskripsi}
                                onChange={(e) => setDeskripsi(e.target.value)}
                                placeholder="Catatan atau deskripsi perencanaan..."
                                rows={2}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 resize-none transition-all"
                            />
                        </motion.div>

                        {/* Add Product Section */}
                        <motion.div
                            className="p-4 bg-amber-50/50 dark:bg-amber-900/20 rounded-2xl border border-amber-200/50 dark:border-amber-500/30"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.45 }}
                        >
                            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-4 flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Tambah Produk
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Produk Select */}
                                <div className="md:col-span-1">
                                    <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Pilih Produk</label>
                                    <select
                                        value={selectedProdukId}
                                        onChange={(e) => setSelectedProdukId(Number(e.target.value))}
                                        disabled={isLoadingProduk}
                                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none cursor-pointer disabled:opacity-50"
                                    >
                                        <option value={0}>-- Pilih Produk --</option>
                                        {produkList.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.namaProduk} (RON {p.oktan})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Quantity Input */}
                                <div className="md:col-span-1">
                                    <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Jumlah (Liter)</label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        min={1000}
                                        step={1000}
                                        placeholder="8000"
                                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                                    />
                                    <p className="mt-1 text-xs text-slate-400">Min 1000 liter, kelipatan 1000</p>
                                </div>

                                {/* Add Button */}
                                <div className="md:col-span-1 flex items-end">
                                    <motion.button
                                        type="button"
                                        onClick={handleAddProduct}
                                        disabled={selectedProdukId === 0 || quantity <= 0}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-xl shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Tambah
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Selected Products List */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                <Droplet className="w-4 h-4 text-cyan-500" />
                                Produk yang Dipilih ({selectedProducts.length})
                            </h3>

                            {selectedProducts.length === 0 ? (
                                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600">
                                    <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Belum ada produk yang dipilih
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <AnimatePresence>
                                        {selectedProducts.map((product, index) => {
                                            const units = calculateUnits(product.totalQuantity);
                                            return (
                                                <motion.div
                                                    key={product.produkId}
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
                                                                    {product.namaProduk}
                                                                </h4>
                                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                                    {formatNumber(product.totalQuantity)} {product.satuan} = <strong>{units.length} unit</strong> ({units.map(u => formatNumber(u)).join(' + ')} liter)
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <motion.button
                                                            onClick={() => handleRemoveProduct(product.produkId)}
                                                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </motion.button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>

                                    {/* Summary */}
                                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200/50 dark:border-amber-500/30">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-amber-700 dark:text-amber-300">Total</span>
                                            <span className="font-bold text-amber-800 dark:text-amber-200">
                                                {formatNumber(totalLiters)} liter ({totalUnits} unit)
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

                        {/* Submit Button */}
                        <motion.div
                            className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55 }}
                        >
                            <motion.button
                                type="button"
                                onClick={onSubmit}
                                disabled={isSubmitting || submitSuccess || selectedProducts.length === 0}
                                className={`w-full flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-2xl transition-all shadow-lg ${submitSuccess
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/30'
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
                                        Simpan Perencanaan
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Info Card */}
                <motion.div
                    className="mt-6 p-4 bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm rounded-2xl border border-blue-200/50 dark:border-blue-500/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Informasi Pemesanan
                    </h3>
                    <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                        <li>• Setiap pesanan akan dipecah menjadi unit 8.000 liter</li>
                        <li>• Contoh: 16.000 liter = 2 unit × 8.000 liter</li>
                        <li>• Setiap unit akan dicatat sebagai DetailRencanaPembelian terpisah</li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
}
