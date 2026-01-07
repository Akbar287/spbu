'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import { simulateContract, writeContract } from '@wagmi/core';
import {
    ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2,
    Droplet, Calculator, DollarSign, Percent, Receipt, Edit3
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { config } from '@/config/wagmi';

// Blockchain interfaces
interface BlockchainProdukDetailWithHarga {
    detailRencanaPembelianId: bigint;
    namaProduk: string;
    quantity: bigint;
    satuan: string;
    harga: bigint;
    total: bigint;
}

interface BlockchainDetailRencanaPembelianView {
    rencanaPembelianId: bigint;
    kodePembelian: string;
    tanggalPembelian: bigint;
    jumlahTotal: bigint;
    produk: BlockchainProdukDetailWithHarga[];
    pajakPembelianId: bigint;
    ppn: bigint;
    ppbkb: bigint;
    pph: bigint;
    gross: bigint;
    net: bigint;
}

interface BlockchainRencanaPembelian {
    rencanaPembelianId: bigint;
    kodePembelian: string;
    grandTotal: bigint;
    deleted: boolean;
}

// Form state interfaces
interface ProductPrice {
    detailId: number;
    namaProduk: string;
    quantity: number;
    satuan: string;
    harga: string; // string for input
    total: number;
}

// Format functions
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

const parseInputNumber = (value: string): number => {
    const cleaned = value.replace(/[^\d]/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
};

export default function PembelianEdit() {
    const navigate = useNavigate();
    const { pembelianId } = useParams<{ pembelianId: string }>();
    const rencanaPembelianId = pembelianId ? parseInt(pembelianId, 10) : 0;
    const isValidId = !isNaN(rencanaPembelianId) && rencanaPembelianId > 0;

    // Form states
    const [products, setProducts] = useState<ProductPrice[]>([]);
    const [taxRates, setTaxRates] = useState({ ppn: '', ppbkb: '', pph: '' });
    const [pajakPembelianId, setPajakPembelianId] = useState<number>(0);

    // UI states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Fetch main rencana data
    const { data: rencanaPembelianResponse, isLoading: isLoadingMain, error } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getRencanaPembelianById',
        args: [BigInt(isValidId ? rencanaPembelianId : 0)],
        query: { enabled: isValidId }
    });

    // Fetch rincian pembelian details
    const { data: rincianResponse, isLoading: isLoadingRincian } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getRincianPembelianDetails',
        args: [BigInt(isValidId ? rencanaPembelianId : 0)],
        query: { enabled: isValidId }
    });

    const rencanaPembelian = rencanaPembelianResponse as BlockchainRencanaPembelian | undefined;
    const rincianList = rincianResponse as BlockchainDetailRencanaPembelianView[] | undefined;

    // Initialize form from blockchain data
    useEffect(() => {
        if (rincianList && rincianList.length > 0) {
            const firstItem = rincianList[0];
            const netPrice = Number(firstItem.net);

            // ppn, ppbkb, pph are stored as NOMINAL amounts (scaled x100)
            // To get percentage: (nominal / netPrice) * 100
            // If net is 0, use default rates
            let ppnRate = 11; // default 11%
            let ppbkbRate = 5.45; // default 5.45%
            let pphRate = 0.25; // default 0.25%

            if (netPrice > 0) {
                ppnRate = (Number(firstItem.ppn) / netPrice) * 100;
                ppbkbRate = (Number(firstItem.ppbkb) / netPrice) * 100;
                pphRate = (Number(firstItem.pph) / netPrice) * 100;
            }

            setTaxRates({
                ppn: ppnRate.toFixed(2),
                ppbkb: ppbkbRate.toFixed(2),
                pph: pphRate.toFixed(2),
            });

            setPajakPembelianId(Number(firstItem.pajakPembelianId));

            // Set products
            const productList: ProductPrice[] = [];
            rincianList.forEach(rincian => {
                rincian.produk.forEach(p => {
                    productList.push({
                        detailId: Number(p.detailRencanaPembelianId),
                        namaProduk: p.namaProduk,
                        quantity: Number(p.quantity),
                        satuan: p.satuan,
                        harga: (Number(p.harga) / 100).toString(), // Convert from scaled
                        total: Number(p.total) / 100,
                    });
                });
            });
            setProducts(productList);
        }
    }, [rincianList]);

    // Calculate summary
    const summary = useMemo(() => {
        const netPrice = products.reduce((sum, p) => {
            const harga = parseInputNumber(p.harga);
            return sum + (p.quantity * harga);
        }, 0);

        const ppnRate = parseFloat(taxRates.ppn) || 0;
        const ppbkbRate = parseFloat(taxRates.ppbkb) || 0;
        const pphRate = parseFloat(taxRates.pph) || 0;

        // Tax rates are in percentage (e.g., 11 = 11%)
        const ppnAmount = (netPrice * ppnRate) / 100;
        const ppbkbAmount = (netPrice * ppbkbRate) / 100;
        const pphAmount = (netPrice * pphRate) / 100;

        const grossPrice = netPrice + ppnAmount + ppbkbAmount + pphAmount;

        return {
            netPrice,
            ppnAmount,
            ppbkbAmount,
            pphAmount,
            totalTax: ppnAmount + ppbkbAmount + pphAmount,
            grossPrice
        };
    }, [products, taxRates]);

    // Handle product price change
    const handlePriceChange = (index: number, value: string) => {
        const newProducts = [...products];
        newProducts[index].harga = value;
        setProducts(newProducts);
    };

    // Handle submit
    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Prepare arrays
            const detailIds = products.map(p => BigInt(p.detailId));
            const prices = products.map(p => BigInt(parseInputNumber(p.harga) * 100)); // Scale x100

            // Tax rates in scaled x100 format (11% = 1100)
            const ppnScaled = BigInt(Math.round(parseFloat(taxRates.ppn) * 100));
            const ppbkbScaled = BigInt(Math.round(parseFloat(taxRates.ppbkb) * 100));
            const pphScaled = BigInt(Math.round(parseFloat(taxRates.pph) * 100));

            const { request } = await simulateContract(config, {
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'updateRincianPembelianDetails',
                args: [
                    BigInt(rencanaPembelianId),
                    detailIds,
                    prices,
                    BigInt(pajakPembelianId),
                    ppnScaled,
                    ppbkbScaled,
                    pphScaled
                ],
            });

            await writeContract(config, request);
            setSubmitSuccess(true);

            setTimeout(() => {
                navigate(`/procurement/pembelian/${pembelianId}`);
            }, 1500);
        } catch (error: any) {
            console.error('Error:', error);
            setSubmitError(error.message || 'Terjadi kesalahan saat menyimpan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading = isLoadingMain || isLoadingRincian;

    if (isLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-orange-50/80 dark:bg-slate-900" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">Memuat data...</p>
                </div>
            </div>
        );
    }

    if (error || !rencanaPembelian || rencanaPembelian.rencanaPembelianId === BigInt(0) || rencanaPembelian.deleted) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-orange-50/80 dark:bg-slate-900" />
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
                        <motion.button
                            onClick={() => navigate('/procurement/pembelian')}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl"
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
            <div className="absolute inset-0 bg-orange-50/80 dark:bg-slate-900" />

            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-orange-400/20 to-amber-400/20 dark:from-orange-600/30 dark:to-amber-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate(`/procurement/pembelian/${pembelianId}`)}
                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
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
                    className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500" />
                    <div className="relative z-10 p-6 md:p-8">
                        <div className="flex items-center gap-4">
                            <motion.div
                                className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30"
                                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            >
                                <Edit3 className="w-8 h-8 text-white" />
                            </motion.div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white">
                                    Edit Harga Pembelian
                                </h1>
                                <p className="text-white/80 mt-1">
                                    {rencanaPembelian.kodePembelian}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Product Prices Card */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />
                    <div className="relative z-10 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Droplet className="w-5 h-5 text-cyan-500" />
                            Harga Produk
                        </h2>

                        <div className="space-y-4">
                            {products.map((product, index) => (
                                <div
                                    key={product.detailId}
                                    className="p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
                                                <Droplet className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-800 dark:text-white">
                                                    {product.namaProduk}
                                                </h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {formatNumber(product.quantity)} {product.satuan}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-500">Rp</span>
                                            <input
                                                type="text"
                                                value={formatNumber(parseInputNumber(product.harga))}
                                                onChange={(e) => handlePriceChange(index, e.target.value)}
                                                className="w-40 px-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-right font-semibold text-slate-700 dark:text-slate-200"
                                                placeholder="0"
                                            />
                                        </div>

                                        <div className="text-right">
                                            <p className="text-xs text-slate-400">Subtotal</p>
                                            <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(product.quantity * parseInputNumber(product.harga))}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Tax Rates Card */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />
                    <div className="relative z-10 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Percent className="w-5 h-5 text-purple-500" />
                            Tarif Pajak (%)
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* PPN */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                                <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                                    PPN (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={taxRates.ppn}
                                    onChange={(e) => setTaxRates({ ...taxRates, ppn: e.target.value })}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-700 rounded-xl border border-blue-200 dark:border-blue-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-right font-semibold text-slate-700 dark:text-slate-200"
                                    placeholder="11"
                                />
                            </div>

                            {/* PPBKB */}
                            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-700">
                                <label className="block text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
                                    PPBKB (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={taxRates.ppbkb}
                                    onChange={(e) => setTaxRates({ ...taxRates, ppbkb: e.target.value })}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-700 rounded-xl border border-orange-200 dark:border-orange-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-right font-semibold text-slate-700 dark:text-slate-200"
                                    placeholder="5.45"
                                />
                            </div>

                            {/* PPH */}
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
                                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                                    PPH (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={taxRates.pph}
                                    onChange={(e) => setTaxRates({ ...taxRates, pph: e.target.value })}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-700 rounded-xl border border-purple-200 dark:border-purple-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none text-right font-semibold text-slate-700 dark:text-slate-200"
                                    placeholder="0.25"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Summary Card */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-emerald-200/50 dark:border-emerald-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20 backdrop-blur-md" />
                    <div className="relative z-10 p-6">
                        <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300 mb-4 flex items-center gap-2">
                            <Calculator className="w-5 h-5" />
                            Ringkasan Biaya
                        </h2>

                        <div className="space-y-3">
                            {/* Net Price */}
                            <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <DollarSign className="w-4 h-4" />
                                    Net Price
                                </span>
                                <span className="font-semibold text-slate-800 dark:text-white">
                                    {formatCurrency(summary.netPrice)}
                                </span>
                            </div>

                            {/* PPN */}
                            <div className="flex justify-between items-center p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                                <span className="text-blue-600 dark:text-blue-400">
                                    PPN ({taxRates.ppn || 0}%)
                                </span>
                                <span className="font-semibold text-blue-700 dark:text-blue-300">
                                    {formatCurrency(summary.ppnAmount)}
                                </span>
                            </div>

                            {/* PPBKB */}
                            <div className="flex justify-between items-center p-3 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl">
                                <span className="text-orange-600 dark:text-orange-400">
                                    PPBKB ({taxRates.ppbkb || 0}%)
                                </span>
                                <span className="font-semibold text-orange-700 dark:text-orange-300">
                                    {formatCurrency(summary.ppbkbAmount)}
                                </span>
                            </div>

                            {/* PPH */}
                            <div className="flex justify-between items-center p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                                <span className="text-purple-600 dark:text-purple-400">
                                    PPH ({taxRates.pph || 0}%)
                                </span>
                                <span className="font-semibold text-purple-700 dark:text-purple-300">
                                    {formatCurrency(summary.pphAmount)}
                                </span>
                            </div>

                            {/* Divider */}
                            <div className="border-t-2 border-dashed border-emerald-300 dark:border-emerald-600 my-2" />

                            {/* Total Tax */}
                            <div className="flex justify-between items-center p-3 bg-amber-50/50 dark:bg-amber-900/20 rounded-xl">
                                <span className="text-amber-700 dark:text-amber-400 font-medium">
                                    Total Pajak
                                </span>
                                <span className="font-bold text-amber-700 dark:text-amber-300">
                                    {formatCurrency(summary.totalTax)}
                                </span>
                            </div>

                            {/* Gross Price */}
                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-800/50 dark:to-teal-800/50 rounded-xl border-2 border-emerald-400 dark:border-emerald-500">
                                <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
                                    <Receipt className="w-5 h-5" />
                                    Gross Price
                                </span>
                                <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                                    {formatCurrency(summary.grossPrice)}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Error Message */}
                <AnimatePresence>
                    {submitError && (
                        <motion.div
                            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-500/30 flex items-center gap-3"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Action Buttons */}
                <motion.div
                    className="flex flex-col sm:flex-row gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <motion.button
                        onClick={handleSubmit}
                        disabled={isSubmitting || submitSuccess}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl shadow-lg transition-all ${submitSuccess
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                            : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/30'
                            } disabled:opacity-50`}
                        whileHover={{ scale: isSubmitting ? 1 : 1.02, y: isSubmitting ? 0 : -2 }}
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
                                Berhasil Disimpan!
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Simpan Perubahan
                            </>
                        )}
                    </motion.button>

                    <motion.button
                        onClick={() => navigate(`/procurement/pembelian/${pembelianId}`)}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                        whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                        whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Batal
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
}
