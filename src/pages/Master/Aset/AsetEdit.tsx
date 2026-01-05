'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Package, ArrowLeft, Save, Building2,
    AlertCircle, CheckCircle2, Loader2, Sparkles, FileText, DollarSign, Hash, TrendingDown, ToggleLeft
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain Interfaces
interface BlockchainAset {
    asetId: bigint;
    spbuId: bigint;
    nama: string;
    keterangan: string;
    jumlah: bigint;
    harga: bigint;
    penyusutanPerHari: bigint;
    digunakan: boolean;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainSpbu {
    spbuId: bigint;
    namaSpbu: string;
    deleted: boolean;
}

// Form data interface
interface AsetFormData {
    spbuId: number;
    nama: string;
    keterangan?: string;
    jumlah: number;
    harga: number;
    penyusutanPerHari: number;
    digunakan: boolean;
}

// Validation Schema
const asetValidationSchema = yup.object({
    spbuId: yup.number()
        .required('SPBU wajib dipilih')
        .min(1, 'SPBU wajib dipilih'),
    nama: yup.string()
        .required('Nama aset wajib diisi')
        .min(2, 'Nama aset minimal 2 karakter')
        .max(100, 'Nama aset maksimal 100 karakter'),
    keterangan: yup.string()
        .max(500, 'Keterangan maksimal 500 karakter'),
    jumlah: yup.number()
        .required('Jumlah wajib diisi')
        .min(1, 'Jumlah minimal 1'),
    harga: yup.number()
        .required('Harga wajib diisi')
        .min(0, 'Harga tidak boleh negatif'),
    penyusutanPerHari: yup.number()
        .required('Penyusutan wajib diisi')
        .min(0, 'Penyusutan tidak boleh negatif'),
    digunakan: yup.boolean()
        .required(),
}).required();

export default function AsetEdit() {
    const navigate = useNavigate();
    const { asetId } = useParams<{ asetId: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [formLoaded, setFormLoaded] = useState(false);

    // Fetch Aset Data
    const { data: blockchainAset, isLoading: isLoadingAset, error: errorAset } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAsetById',
        args: asetId ? [BigInt(asetId)] : undefined,
        query: {
            enabled: !!asetId,
        },
    });

    // Fetch SPBU Data for Dropdown
    const { data: spbuResponse, isLoading: isLoadingSpbu } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllSpbu',
        args: [BigInt(0), BigInt(100)],
    });

    // Write Contract Hook
    const { writeContractAsync } = useWriteContract();

    // Process SPBU List
    const spbuList = useMemo(() => {
        if (!spbuResponse) return [];
        const [rawSpbu] = spbuResponse as [BlockchainSpbu[], bigint];
        return rawSpbu
            .filter(spbu => !spbu.deleted)
            .map(spbu => ({
                id: Number(spbu.spbuId),
                name: spbu.namaSpbu
            }));
    }, [spbuResponse]);

    // Process Aset Data
    const asetData = useMemo(() => {
        if (!blockchainAset) return null;
        const a = blockchainAset as BlockchainAset;
        if (a.deleted || Number(a.asetId) === 0) return null;
        return a;
    }, [blockchainAset]);

    const notFound = !isLoadingAset && !errorAset && !asetData;

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        setValue,
        watch,
    } = useForm<AsetFormData>({
        resolver: yupResolver(asetValidationSchema) as any,
        mode: 'onChange',
    });

    const digunakan = watch('digunakan');

    // Populate Form when data loads
    useEffect(() => {
        if (asetData && !formLoaded) {
            setValue('spbuId', Number(asetData.spbuId));
            setValue('nama', asetData.nama);
            setValue('keterangan', asetData.keterangan);
            setValue('jumlah', Number(asetData.jumlah));
            setValue('harga', Number(asetData.harga));
            setValue('penyusutanPerHari', Number(asetData.penyusutanPerHari));
            setValue('digunakan', asetData.digunakan);
            setFormLoaded(true);
        }
    }, [asetData, formLoaded, setValue]);

    const onSubmit = async (data: AsetFormData) => {
        if (!asetId) return;

        setIsSubmitting(true);
        try {
            await writeContractAsync({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'updateAset',
                args: [
                    BigInt(asetId),
                    BigInt(data.spbuId),
                    data.nama,
                    data.keterangan || '',
                    BigInt(data.jumlah),
                    BigInt(data.harga),
                    BigInt(data.penyusutanPerHari),
                    data.digunakan,
                ],
            });

            setSubmitSuccess(true);
            setTimeout(() => {
                navigate('/master/aset');
            }, 1500);
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputBaseClass = "w-full px-4 py-3 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border transition-all duration-200 outline-none";
    const inputNormalClass = "border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";
    const inputErrorClass = "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20";
    const inputSuccessClass = "border-emerald-400 dark:border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

    const getInputClass = (fieldName: keyof AsetFormData) => {
        if (errors[fieldName]) return `${inputBaseClass} ${inputErrorClass}`;
        if (touchedFields[fieldName] && !errors[fieldName]) return `${inputBaseClass} ${inputSuccessClass}`;
        return `${inputBaseClass} ${inputNormalClass}`;
    };

    // Loading State
    if (isLoadingAset || isLoadingSpbu) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-50 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat data Aset...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Not Found State
    if (notFound) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-50 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4 text-center p-8"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Aset Tidak Ditemukan</h2>
                        <p className="text-slate-600 dark:text-slate-400">Data Aset dengan ID {asetId} tidak ditemukan.</p>
                        <motion.button
                            onClick={() => navigate('/master/aset')}
                            className="mt-4 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-2xl"
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
            <div className="absolute inset-0 bg-emerald-50 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-emerald-400/20 to-teal-400/20 dark:from-emerald-600/30 dark:to-teal-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-green-400/15 to-lime-400/15 dark:from-green-500/20 dark:to-lime-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/master/aset')}
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
                            className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/30"
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Package className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Edit Aset
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Perbarui data Aset #{asetId}
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
                    <motion.div
                        className="absolute top-[10%] right-[10%] pointer-events-none"
                        animate={{ opacity: [0, 0.5, 0], scale: [0, 1, 0] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    >
                        <Sparkles className="w-5 h-5 text-emerald-400/50" />
                    </motion.div>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 p-6 md:p-8 space-y-6">
                        {/* SPBU Selection */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Building2 className="w-4 h-4 text-emerald-500" />
                                Pilih SPBU
                            </label>
                            <select
                                {...register('spbuId')}
                                className={`${getInputClass('spbuId')} text-slate-700 dark:text-slate-200 cursor-pointer`}
                            >
                                <option value={0}>-- Pilih SPBU --</option>
                                {spbuList.map((spbu) => (
                                    <option key={spbu.id} value={spbu.id}>
                                        {spbu.name}
                                    </option>
                                ))}
                            </select>
                            {errors.spbuId && (
                                <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.spbuId.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Nama Aset */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Package className="w-4 h-4 text-emerald-500" />
                                Nama Aset
                            </label>
                            <input
                                type="text"
                                {...register('nama')}
                                placeholder="Contoh: Komputer Kasir, Dispenser BBM"
                                className={`${getInputClass('nama')} text-slate-700 dark:text-slate-200 placeholder-slate-400`}
                            />
                            {errors.nama && (
                                <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.nama.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Jumlah & Harga */}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Hash className="w-4 h-4 text-blue-500" />
                                    Jumlah
                                </label>
                                <input
                                    type="number"
                                    {...register('jumlah')}
                                    min={1}
                                    className={`${getInputClass('jumlah')} text-slate-700 dark:text-slate-200`}
                                />
                                {errors.jumlah && (
                                    <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.jumlah.message}
                                    </motion.p>
                                )}
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <DollarSign className="w-4 h-4 text-green-500" />
                                    Harga (Rp)
                                </label>
                                <input
                                    type="number"
                                    {...register('harga')}
                                    min={0}
                                    className={`${getInputClass('harga')} text-slate-700 dark:text-slate-200`}
                                />
                                {errors.harga && (
                                    <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.harga.message}
                                    </motion.p>
                                )}
                            </div>
                        </motion.div>

                        {/* Penyusutan */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.45 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <TrendingDown className="w-4 h-4 text-orange-500" />
                                Penyusutan Per Hari (Rp)
                            </label>
                            <input
                                type="number"
                                {...register('penyusutanPerHari')}
                                min={0}
                                className={`${getInputClass('penyusutanPerHari')} text-slate-700 dark:text-slate-200`}
                            />
                            {errors.penyusutanPerHari && (
                                <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.penyusutanPerHari.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Digunakan Toggle */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <ToggleLeft className="w-4 h-4 text-purple-500" />
                                Status Penggunaan
                            </label>
                            <div className="flex items-center gap-4">
                                <motion.button
                                    type="button"
                                    onClick={() => setValue('digunakan', true)}
                                    className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all ${digunakan
                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
                                        }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    ✓ Aktif Digunakan
                                </motion.button>
                                <motion.button
                                    type="button"
                                    onClick={() => setValue('digunakan', false)}
                                    className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all ${!digunakan
                                            ? 'bg-gradient-to-r from-red-500 to-orange-500 border-red-500 text-white shadow-lg shadow-red-500/30'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-red-300'
                                        }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    ✗ Tidak Digunakan
                                </motion.button>
                            </div>
                        </motion.div>

                        {/* Keterangan */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.55 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <FileText className="w-4 h-4 text-emerald-500" />
                                Keterangan
                            </label>
                            <textarea
                                {...register('keterangan')}
                                rows={4}
                                placeholder="Deskripsi atau catatan tentang aset..."
                                className={`${getInputClass('keterangan')} text-slate-700 dark:text-slate-200 placeholder-slate-400 resize-none`}
                            />
                            {errors.keterangan && (
                                <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.keterangan.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Form Actions */}
                        <motion.div
                            className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <motion.button
                                type="submit"
                                disabled={isSubmitting || submitSuccess}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-2xl transition-all shadow-lg ${submitSuccess
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30'
                                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/30'
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
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
