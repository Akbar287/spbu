'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    ArrowLeft, Save, X, DollarSign, CheckCircle2,
    Loader2, Package, AlertCircle, TrendingUp, TrendingDown, Clock
} from 'lucide-react';
import { DIAMOND_ABI, DIAMOND_ADDRESS } from '@/contracts/config';
import { useReadContract, useWriteContract } from 'wagmi';

// Interfaces
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

interface BlockchainJamKerja {
    jamKerjaId: bigint;
    spbuId: bigint;
    namaJamKerja: string;
    jamDatang: bigint;
    jamPulang: bigint;
    jamMulaiIstirahat: bigint;
    jamSelesaiIstirahat: bigint;
    urutan: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// Form data interface
interface HargaFormData {
    produkId: number;
    jamKerjaId: number;
    hargaJual: number;
    hargaBeli: number;
}

// Validation Schema
const hargaValidationSchema = yup.object({
    produkId: yup.number()
        .required('Produk wajib dipilih')
        .min(1, 'Produk wajib dipilih'),
    jamKerjaId: yup.number()
        .required('Jam Kerja wajib dipilih')
        .min(0, 'Jam Kerja tidak valid'),
    hargaJual: yup.number()
        .required('Harga jual wajib diisi')
        .min(1, 'Harga jual minimal 1'),
    hargaBeli: yup.number()
        .required('Harga beli wajib diisi')
        .min(1, 'Harga beli minimal 1'),
}).required();

export default function HargaCreate() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Fetch Produk data for dropdown
    const { data: produkResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllProduk',
        args: [BigInt(0), BigInt(100)],
    });

    // Fetch Jam Kerja data for dropdown
    const { data: jamKerjaResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllJamKerja',
        args: [BigInt(0), BigInt(100)],
    });

    const produkList = useMemo(() => {
        if (!produkResponse) return [];
        const [rawProduk] = produkResponse as [BlockchainProduk[], bigint];
        return rawProduk
            .filter(produk => !produk.deleted && produk.aktif)
            .map(produk => ({
                id: Number(produk.produkId),
                name: produk.namaProduk,
                oktan: Number(produk.oktan)
            }));
    }, [produkResponse]);

    const jamKerjaList = useMemo(() => {
        if (!jamKerjaResponse) return [];
        const [rawJamKerja] = jamKerjaResponse as [BlockchainJamKerja[], bigint];
        return rawJamKerja
            .filter(jk => !jk.deleted)
            .map(jk => ({
                id: Number(jk.jamKerjaId),
                name: jk.namaJamKerja
            }));
    }, [jamKerjaResponse]);

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        reset,
        watch,
    } = useForm<HargaFormData>({
        resolver: yupResolver(hargaValidationSchema) as any,
        mode: 'onChange',
        defaultValues: {
            produkId: 0,
            jamKerjaId: 0,
            hargaJual: 0,
            hargaBeli: 0,
        },
    });

    const hargaJual = watch('hargaJual');
    const hargaBeli = watch('hargaBeli');
    const margin = (hargaJual || 0) - (hargaBeli || 0);

    const { writeContractAsync } = useWriteContract();

    const onSubmit = async (data: HargaFormData) => {
        setIsSubmitting(true);
        try {
            await writeContractAsync({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'createHarga',
                args: [
                    BigInt(data.produkId),
                    BigInt(data.jamKerjaId),
                    BigInt(data.hargaJual * 100), // Scale x100
                    BigInt(data.hargaBeli * 100), // Scale x100
                ],
            });


            setSubmitSuccess(true);
            setTimeout(() => {
                navigate('/master/harga');
            }, 1500);
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputBaseClass = "w-full px-4 py-3 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border transition-all duration-200 outline-none";
    const inputNormalClass = "border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20";
    const inputErrorClass = "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20";
    const inputSuccessClass = "border-amber-400 dark:border-amber-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20";

    const getInputClass = (fieldName: keyof HargaFormData) => {
        if (errors[fieldName]) return `${inputBaseClass} ${inputErrorClass}`;
        if (touchedFields[fieldName] && !errors[fieldName]) return `${inputBaseClass} ${inputSuccessClass}`;
        return `${inputBaseClass} ${inputNormalClass}`;
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-amber-50 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-amber-400/20 to-orange-400/20 dark:from-amber-600/30 dark:to-orange-600/30 blur-3xl"
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-yellow-400/15 to-lime-400/15 dark:from-yellow-500/20 dark:to-lime-500/20 blur-3xl"
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
                    onClick={() => navigate('/master/harga')}
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
                            <DollarSign className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Tambah Harga Baru
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Tambahkan harga untuk produk BBM
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
                    <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 p-6 md:p-8 space-y-6">
                        {/* Produk Selection */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Package className="w-4 h-4 text-amber-500" />
                                Pilih Produk
                            </label>
                            <select
                                {...register('produkId')}
                                className={`${getInputClass('produkId')} text-slate-700 dark:text-slate-200 cursor-pointer`}
                            >
                                <option value={0}>-- Pilih Produk --</option>
                                {produkList.map((produk) => (
                                    <option key={produk.id} value={produk.id}>
                                        {produk.name} (RON {produk.oktan})
                                    </option>
                                ))}
                            </select>
                            {errors.produkId && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.produkId.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Jam Kerja Selection */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Clock className="w-4 h-4 text-blue-500" />
                                Pilih Jam Kerja
                            </label>
                            <select
                                {...register('jamKerjaId')}
                                className={`${getInputClass('jamKerjaId')} text-slate-700 dark:text-slate-200 cursor-pointer`}
                            >
                                <option value={0}>-- Pilih Jam Kerja --</option>
                                {jamKerjaList.map((jk) => (
                                    <option key={jk.id} value={jk.id}>
                                        {jk.name}
                                    </option>
                                ))}
                            </select>
                            {errors.jamKerjaId && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.jamKerjaId.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Harga Jual & Harga Beli */}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                    Harga Jual (Rp)
                                </label>
                                <input
                                    type="number"
                                    {...register('hargaJual')}
                                    min={0}
                                    placeholder="0"
                                    className={`${getInputClass('hargaJual')} text-slate-700 dark:text-slate-200`}
                                />
                                {errors.hargaJual && (
                                    <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.hargaJual.message}
                                    </motion.p>
                                )}
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <TrendingDown className="w-4 h-4 text-red-500" />
                                    Harga Beli (Rp)
                                </label>
                                <input
                                    type="number"
                                    {...register('hargaBeli')}
                                    min={0}
                                    placeholder="0"
                                    className={`${getInputClass('hargaBeli')} text-slate-700 dark:text-slate-200`}
                                />
                                {errors.hargaBeli && (
                                    <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.hargaBeli.message}
                                    </motion.p>
                                )}
                            </div>
                        </motion.div>

                        {/* Margin Preview */}
                        {hargaJual > 0 && hargaBeli > 0 && (
                            <motion.div
                                className={`p-4 rounded-xl border ${margin >= 0
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-500/30'
                                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30'
                                    }`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`font-medium ${margin >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                        Margin per liter:
                                    </span>
                                    <span className={`text-xl font-bold ${margin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        Rp {margin.toLocaleString('id-ID')}
                                    </span>
                                </div>
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
                                type="submit"
                                disabled={isSubmitting || submitSuccess}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-2xl transition-all shadow-lg ${submitSuccess
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/30'
                                    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-amber-500/30'
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
                                        Simpan Harga
                                    </>
                                )}
                            </motion.button>
                            <motion.button
                                type="button"
                                onClick={() => reset()}
                                disabled={isSubmitting}
                                className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                            >
                                <X className="w-5 h-5 inline-block mr-2" />
                                Reset
                            </motion.button>
                        </motion.div>
                    </form>
                </motion.div>

                {/* Form Tips */}
                <motion.div
                    className="mt-6 p-4 bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm rounded-2xl border border-amber-200/50 dark:border-amber-500/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                >
                    <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">
                        💡 Informasi
                    </h3>
                    <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1">
                        <li>• Pilih produk BBM yang akan diberi harga</li>
                        <li>• Harga Jual adalah harga eceran ke konsumen</li>
                        <li>• Harga Beli adalah harga pembelian dari Pertamina</li>
                        <li>• Pilih jam kerja spesifik untuk pemberlakuan harga</li>
                        <li>• Setelah memasuki jam kerja yang dipilih, harga akan otomatis berlaku</li>
                        <li>• Harga lama akan otomatis diarsipkan ke riwayat harga</li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
}