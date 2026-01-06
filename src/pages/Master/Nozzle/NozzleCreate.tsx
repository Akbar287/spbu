'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    ArrowLeft, Save, X, Container, CheckCircle2,
    Loader2, AlertCircle, ToggleLeft, Fuel, Droplets, Gauge
} from 'lucide-react';
import { DIAMOND_ABI, DIAMOND_ADDRESS } from '@/contracts/config';
import { useReadContract, useWriteContract } from 'wagmi';

// Interfaces
interface BlockchainDispenser {
    dispenserId: bigint;
    namaDispenser: string;
    deleted: boolean;
}

interface BlockchainProduk {
    produkId: bigint;
    namaProduk: string;
    deleted: boolean;
}

// Form data interface
interface NozzleFormData {
    dispenserId: string;
    produkId: string;
    namaNozzle: string;
    aktif: boolean;
}

// Validation Schema
const nozzleValidationSchema = yup.object({
    dispenserId: yup.string()
        .required('Dispenser wajib dipilih'),
    produkId: yup.string()
        .required('Produk wajib dipilih'),
    namaNozzle: yup.string()
        .required('Nama nozzle wajib diisi')
        .min(2, 'Nama nozzle minimal 2 karakter')
        .max(100, 'Nama nozzle maksimal 100 karakter'),
    aktif: yup.boolean()
        .required(),
}).required();

export default function NozzleCreate() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Fetch Dispenser data for select box
    const { data: dispenserResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllDispenser',
        args: [BigInt(0), BigInt(100)],
    });

    // Fetch Produk data for select box
    const { data: produkResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllProduk',
        args: [BigInt(0), BigInt(100)],
    });

    const dispenserList = useMemo(() => {
        if (!dispenserResponse) return [];
        const rawDispenser = dispenserResponse as BlockchainDispenser[];
        return rawDispenser
            .filter(d => !d.deleted)
            .map(d => ({
                id: Number(d.dispenserId),
                name: d.namaDispenser,
            }));
    }, [dispenserResponse]);

    const produkList = useMemo(() => {
        if (!produkResponse) return [];
        // Handle potential tuple return if defined that way, though usually array for getAll
        // Based on previous checks, getAllProduk returns just the array if signature matches standard
        // But let's be safe like in NozzleIndex
        let rawProduk: BlockchainProduk[] = [];
        if (Array.isArray(produkResponse) && produkResponse.length > 0 && Array.isArray((produkResponse as any)[0])) {
            rawProduk = (produkResponse as any)[0];
        } else if (Array.isArray(produkResponse)) {
            rawProduk = produkResponse as BlockchainProduk[];
        }

        return rawProduk
            .filter(p => !p.deleted)
            .map(p => ({
                id: Number(p.produkId),
                name: p.namaProduk,
            }));
    }, [produkResponse]);

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        reset,
        watch,
        setValue,
    } = useForm<NozzleFormData>({
        resolver: yupResolver(nozzleValidationSchema),
        mode: 'onChange',
        defaultValues: {
            namaNozzle: '',
            aktif: true,
        },
    });

    const aktif = watch('aktif');
    const { writeContractAsync } = useWriteContract();

    const onSubmit = async (data: NozzleFormData) => {
        setIsSubmitting(true);
        try {
            await writeContractAsync({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'createNozzle',
                args: [
                    BigInt(data.dispenserId),
                    BigInt(data.produkId),
                    data.namaNozzle,
                    data.aktif,
                ],
            });

            setSubmitSuccess(true);
            setTimeout(() => {
                navigate('/master/nozzle');
            }, 1500);
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputBaseClass = "w-full px-4 py-3 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border transition-all duration-200 outline-none";
    const inputNormalClass = "border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";
    const inputErrorClass = "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20";
    const inputSuccessClass = "border-indigo-400 dark:border-indigo-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

    const getInputClass = (fieldName: keyof NozzleFormData) => {
        if (errors[fieldName]) return `${inputBaseClass} ${inputErrorClass}`;
        if (touchedFields[fieldName] && !errors[fieldName]) return `${inputBaseClass} ${inputSuccessClass}`;
        return `${inputBaseClass} ${inputNormalClass}`;
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-indigo-50 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-indigo-400/20 to-purple-400/20 dark:from-indigo-600/30 dark:to-purple-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-blue-400/15 to-cyan-400/15 dark:from-blue-500/20 dark:to-cyan-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/master/nozzle')}
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
                            className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30"
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Gauge className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Tambah Nozzle Baru
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Tambahkan nozzle baru, kaitkan dengan dispenser dan jenis produk
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

                        {/* Grid for Select Boxes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Dispenser Select */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Fuel className="w-4 h-4 text-indigo-500" />
                                    Pilih Dispenser
                                </label>
                                <div className="relative">
                                    <select
                                        {...register('dispenserId')}
                                        className={`${getInputClass('dispenserId')} appearance-none text-slate-700 dark:text-slate-200 cursor-pointer`}
                                    >
                                        <option value="">-- Pilih Dispenser --</option>
                                        {dispenserList.map((d) => (
                                            <option key={d.id} value={d.id}>
                                                {d.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                        </svg>
                                    </div>
                                </div>
                                {errors.dispenserId && (
                                    <motion.p
                                        className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.dispenserId.message}
                                    </motion.p>
                                )}
                            </motion.div>

                            {/* Produk Select */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.35 }}
                            >
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Droplets className="w-4 h-4 text-purple-500" />
                                    Pilih Jenis Produk
                                </label>
                                <div className="relative">
                                    <select
                                        {...register('produkId')}
                                        className={`${getInputClass('produkId')} appearance-none text-slate-700 dark:text-slate-200 cursor-pointer`}
                                    >
                                        <option value="">-- Pilih Produk --</option>
                                        {produkList.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                        </svg>
                                    </div>
                                </div>
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
                        </div>

                        {/* Nama Nozzle */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Container className="w-4 h-4 text-indigo-500" />
                                Nama Nozzle
                            </label>
                            <input
                                type="text"
                                {...register('namaNozzle')}
                                placeholder="Contoh: Nozzle Premium 1"
                                className={`${getInputClass('namaNozzle')} text-slate-700 dark:text-slate-200 placeholder-slate-400`}
                            />
                            {errors.namaNozzle && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.namaNozzle.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Status Aktif Toggle */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.45 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <ToggleLeft className="w-4 h-4 text-purple-500" />
                                Status Nozzle
                            </label>
                            <div className="flex items-center gap-4">
                                <motion.button
                                    type="button"
                                    onClick={() => setValue('aktif', true)}
                                    className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all ${aktif
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
                                        }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    ✓ Aktif
                                </motion.button>
                                <motion.button
                                    type="button"
                                    onClick={() => setValue('aktif', false)}
                                    className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all ${!aktif
                                        ? 'bg-gradient-to-r from-red-500 to-orange-500 border-red-500 text-white shadow-lg shadow-red-500/30'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-red-300'
                                        }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    ✗ Tidak Aktif
                                </motion.button>
                            </div>
                        </motion.div>

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
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-indigo-500/30'
                                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-500/30'
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
                                        Simpan Nozzle
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
            </div>
        </div>
    );
}
