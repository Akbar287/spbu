'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import { simulateContract, writeContract } from '@wagmi/core';
import {
    ClipboardList, ArrowLeft, Save, Package, Calendar, Tag,
    AlertCircle, CheckCircle2, Loader2, Sparkles, Plus, Trash2,
    FileText, Droplet, Info, Edit3
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
interface Produk {
    id: number;
    namaProduk: string;
    oktan: number;
}

interface ExistingDetail {
    id: number;
    produkId: number;
    namaProduk: string;
    jumlah: number;
    satuan: string;
    isDeleted: boolean;
}

interface NewProduct {
    produkId: number;
    namaProduk: string;
    totalQuantity: number;
    satuan: string;
}

// Constants
const UNIT_SIZE = 8000;

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

export default function PerencanaanEdit() {
    const navigate = useNavigate();
    const { rencanaId } = useParams<{ rencanaId: string }>();
    const rencanaPembelianId = rencanaId ? parseInt(rencanaId, 10) : 0;
    const isValidId = !isNaN(rencanaPembelianId) && rencanaPembelianId > 0;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [deskripsi, setDeskripsi] = useState('');

    // Existing details state
    const [existingDetails, setExistingDetails] = useState<ExistingDetail[]>([]);
    const [detailsToDelete, setDetailsToDelete] = useState<number[]>([]);

    // New products to add
    const [newProducts, setNewProducts] = useState<NewProduct[]>([]);
    const [selectedProdukId, setSelectedProdukId] = useState<number>(0);
    const [quantity, setQuantity] = useState<number>(8000);

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

    // Fetch all products
    const { data: produkResponse, isLoading: isLoadingProduk } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllProduk',
        args: [BigInt(0), BigInt(100)],
    });

    // Fetch status purchase
    const rencanaPembelian = rencanaPembelianResponse as BlockchainRencanaPembelian | undefined;

    const { data: statusResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getStatusPurchaseById',
        args: [rencanaPembelian?.statusPurchaseId || BigInt(1)],
        query: { enabled: !!rencanaPembelian?.statusPurchaseId }
    });

    const statusPurchase = statusResponse as BlockchainStatusPurchase | undefined;

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

    // Create produk map
    const produkMap = useMemo(() => {
        const map = new Map<number, string>();
        produkList.forEach(p => map.set(p.id, p.namaProduk));
        return map;
    }, [produkList]);

    // Initialize form with existing data
    useEffect(() => {
        if (rencanaPembelian) {
            setDeskripsi(rencanaPembelian.deskripsi || '');
        }
    }, [rencanaPembelian]);

    // Initialize existing details
    useEffect(() => {
        if (detailsResponse && produkMap.size > 0) {
            const details = detailsResponse as BlockchainDetailRencanaPembelian[];
            const mapped = details
                .filter(d => !d.deleted)
                .map(d => ({
                    id: Number(d.detailRencanaPembelianId),
                    produkId: Number(d.produkId),
                    namaProduk: produkMap.get(Number(d.produkId)) || `Produk #${d.produkId}`,
                    jumlah: Number(d.jumlah),
                    satuan: d.satuanJumlah,
                    isDeleted: false,
                }));
            setExistingDetails(mapped);
        }
    }, [detailsResponse, produkMap]);

    // Mark detail for deletion
    const handleDeleteExisting = (detailId: number) => {
        setExistingDetails(prev =>
            prev.map(d => d.id === detailId ? { ...d, isDeleted: true } : d)
        );
        setDetailsToDelete(prev => [...prev, detailId]);
    };

    // Restore deleted detail
    const handleRestoreExisting = (detailId: number) => {
        setExistingDetails(prev =>
            prev.map(d => d.id === detailId ? { ...d, isDeleted: false } : d)
        );
        setDetailsToDelete(prev => prev.filter(id => id !== detailId));
    };

    // Add new product
    const handleAddProduct = () => {
        if (selectedProdukId === 0 || quantity <= 0) return;

        const produk = produkList.find(p => p.id === selectedProdukId);
        if (!produk) return;

        const existingIndex = newProducts.findIndex(p => p.produkId === selectedProdukId);
        if (existingIndex >= 0) {
            const updated = [...newProducts];
            updated[existingIndex].totalQuantity += quantity;
            setNewProducts(updated);
        } else {
            setNewProducts([...newProducts, {
                produkId: selectedProdukId,
                namaProduk: produk.namaProduk,
                totalQuantity: quantity,
                satuan: 'liter',
            }]);
        }

        setSelectedProdukId(0);
        setQuantity(8000);
    };

    // Remove new product
    const handleRemoveNewProduct = (produkId: number) => {
        setNewProducts(newProducts.filter(p => p.produkId !== produkId));
    };

    // Calculate units
    const calculateUnits = (totalQuantity: number): number[] => {
        const units: number[] = [];
        let remaining = totalQuantity;
        while (remaining > 0) {
            units.push(Math.min(remaining, UNIT_SIZE));
            remaining -= UNIT_SIZE;
        }
        return units;
    };

    // Submit changes
    const onSubmit = async () => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Prepare arrays for delete and new products
            const deleteDetailIds: bigint[] = detailsToDelete.map(id => BigInt(id));
            const produkIds: bigint[] = [];
            const jumlahList: bigint[] = [];
            const satuanList: string[] = [];

            // Split each new product into 8000 liter units
            for (const product of newProducts) {
                const units = calculateUnits(product.totalQuantity);
                for (const unitQty of units) {
                    produkIds.push(BigInt(product.produkId));
                    jumlahList.push(BigInt(unitQty));
                    satuanList.push(product.satuan);
                }
            }

            // Single call to updateRencanaPembelian
            const { request } = await simulateContract(config, {
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'updateRencanaPembelian',
                args: [
                    BigInt(rencanaPembelianId),
                    deskripsi,
                    deleteDetailIds,
                    produkIds,
                    jumlahList,
                    satuanList,
                ],
            });
            await writeContract(config, request);

            setSubmitSuccess(true);
            setTimeout(() => {
                navigate(`/procurement/perencanaan/${rencanaId}`);
            }, 1500);
        } catch (error: any) {
            console.error('Error submitting:', error);
            setSubmitError(error.message || 'Terjadi kesalahan');
            setIsSubmitting(false);
        }
    };

    // Loading state
    const isLoading = isLoadingMain || isLoadingDetails || isLoadingProduk;

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
                    <motion.div className="flex flex-col items-center gap-4 max-w-md text-center">
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Data Tidak Ditemukan</h3>
                        <motion.button
                            onClick={() => navigate('/procurement/perencanaan')}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl"
                        >
                            Kembali ke Datar
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Already confirmed - cannot edit
    if (rencanaPembelian.konfirmasi) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-amber-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
                    <motion.div className="flex flex-col items-center gap-4 max-w-md text-center">
                        <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                            <AlertCircle className="w-10 h-10 text-yellow-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Tidak Dapat Diedit</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            Perencanaan ini sudah dikonfirmasi dan tidak dapat diedit.
                        </p>
                        <motion.button
                            onClick={() => navigate(`/procurement/perencanaan/${rencanaId}`)}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl"
                        >
                            Kembali ke Detail
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    const activeExistingDetails = existingDetails.filter(d => !d.isDeleted);
    const deletedExistingDetails = existingDetails.filter(d => d.isDeleted);

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
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate(`/procurement/perencanaan/${rencanaId}`)}
                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 mt-32"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </motion.button>

                {/* Header */}
                <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-4">
                        <motion.div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/30">
                            <Edit3 className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Edit Perencanaan
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                {rencanaPembelian.kodePembelian}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Form Card */}
                <motion.div
                    className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                    <div className="relative z-10 p-6 md:p-8 space-y-6">
                        {/* Read-only Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Tanggal */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Calendar className="w-4 h-4 text-amber-500" />
                                    Tanggal Pembelian
                                </label>
                                <div className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                                    {formatTanggal(new Date(Number(rencanaPembelian.tanggalPembelian) * 1000))}
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Tag className="w-4 h-4 text-amber-500" />
                                    Status
                                </label>
                                <div className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                                    {statusPurchase?.namaStatus || 'Rencana'}
                                </div>
                            </div>
                        </div>

                        {/* Deskripsi - Editable */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <FileText className="w-4 h-4 text-amber-500" />
                                Deskripsi
                            </label>
                            <textarea
                                value={deskripsi}
                                onChange={(e) => setDeskripsi(e.target.value)}
                                placeholder="Catatan atau deskripsi perencanaan..."
                                rows={2}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 resize-none transition-all"
                            />
                        </div>

                        {/* Existing Products */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                <Package className="w-4 h-4 text-amber-500" />
                                Produk Saat Ini ({activeExistingDetails.length})
                            </h3>

                            {activeExistingDetails.length === 0 && deletedExistingDetails.length === 0 ? (
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-center text-slate-500">
                                    Tidak ada produk
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {activeExistingDetails.map((detail) => (
                                        <div
                                            key={detail.id}
                                            className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Droplet className="w-4 h-4 text-cyan-500" />
                                                <span className="text-slate-700 dark:text-slate-300">
                                                    {detail.namaProduk}
                                                </span>
                                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                                                    {formatNumber(detail.jumlah)} {detail.satuan}
                                                </span>
                                            </div>
                                            <motion.button
                                                onClick={() => handleDeleteExisting(detail.id)}
                                                className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </motion.button>
                                        </div>
                                    ))}

                                    {/* Deleted items */}
                                    {deletedExistingDetails.map((detail) => (
                                        <div
                                            key={detail.id}
                                            className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-700/50 flex items-center justify-between opacity-60"
                                        >
                                            <div className="flex items-center gap-3 line-through">
                                                <Droplet className="w-4 h-4 text-red-400" />
                                                <span className="text-red-600 dark:text-red-400">
                                                    {detail.namaProduk}
                                                </span>
                                                <span className="text-sm text-red-500">
                                                    {formatNumber(detail.jumlah)} {detail.satuan}
                                                </span>
                                            </div>
                                            <motion.button
                                                onClick={() => handleRestoreExisting(detail.id)}
                                                className="px-3 py-1 text-sm text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg"
                                                whileHover={{ scale: 1.05 }}
                                            >
                                                Batalkan
                                            </motion.button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add New Product */}
                        <div className="p-4 bg-amber-50/50 dark:bg-amber-900/20 rounded-2xl border border-amber-200/50 dark:border-amber-500/30">
                            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-4 flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Tambah Produk Baru
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Pilih Produk</label>
                                    <select
                                        value={selectedProdukId}
                                        onChange={(e) => setSelectedProdukId(Number(e.target.value))}
                                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm"
                                    >
                                        <option value={0}>-- Pilih Produk --</option>
                                        {produkList.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.namaProduk} (RON {p.oktan})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Jumlah (Liter)</label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        min={1000}
                                        step={1000}
                                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <motion.button
                                        onClick={handleAddProduct}
                                        disabled={selectedProdukId === 0}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl disabled:opacity-50"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Tambah
                                    </motion.button>
                                </div>
                            </div>
                        </div>

                        {/* New Products List */}
                        {newProducts.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    Produk Baru ({newProducts.length})
                                </h3>
                                <div className="space-y-2">
                                    {newProducts.map((product) => {
                                        const units = calculateUnits(product.totalQuantity);
                                        return (
                                            <div
                                                key={product.produkId}
                                                className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700/50 flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Droplet className="w-4 h-4 text-green-500" />
                                                    <div>
                                                        <span className="text-green-700 dark:text-green-300 font-medium">
                                                            {product.namaProduk}
                                                        </span>
                                                        <span className="text-sm text-green-600 dark:text-green-400 ml-2">
                                                            {formatNumber(product.totalQuantity)} liter = {units.length} unit
                                                        </span>
                                                    </div>
                                                </div>
                                                <motion.button
                                                    onClick={() => handleRemoveNewProduct(product.produkId)}
                                                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                                                    whileHover={{ scale: 1.1 }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </motion.button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {submitError && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                <p className="text-sm text-red-600">{submitError}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                            <motion.button
                                onClick={onSubmit}
                                disabled={isSubmitting || submitSuccess}
                                className={`w-full flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-2xl shadow-lg ${submitSuccess
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                                    } disabled:opacity-70`}
                                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : submitSuccess ? (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Berhasil!
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Simpan Perubahan
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
