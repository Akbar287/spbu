'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useReadContract, useWriteContract } from 'wagmi';
import { ArrowUpDown, ArrowLeft, Save, AlertCircle, CheckCircle2, Loader2, Sparkles, Ruler, Droplets } from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain Interfaces
interface BlockchainKonversi { konversiId: bigint; dombakId: bigint; satuanUkurTinggiId: bigint; satuanUkurVolumeId: bigint; tinggi: bigint; volume: bigint; createdAt: bigint; updatedAt: bigint; deleted: boolean; }
interface BlockchainDombak { dombakId: bigint; namaDombak: string; deleted: boolean; }
interface BlockchainSatuanUkurTinggi { satuanUkurTinggiId: bigint; namaSatuan: string; singkatan: string; deleted: boolean; }
interface BlockchainSatuanUkurVolume { satuanUkurVolumeId: bigint; namaSatuan: string; singkatan: string; deleted: boolean; }

// Form data interface
interface KonversiFormData { satuanUkurTinggiId: number; satuanUkurVolumeId: number; tinggi: number; volume: number; }

// Validation Schema
const konversiValidationSchema = yup.object({
    satuanUkurTinggiId: yup.number().required('Satuan Ukur Tinggi wajib dipilih').min(1, 'Satuan Ukur Tinggi wajib dipilih'),
    satuanUkurVolumeId: yup.number().required('Satuan Ukur Volume wajib dipilih').min(1, 'Satuan Ukur Volume wajib dipilih'),
    tinggi: yup.number().required('Tinggi wajib diisi').min(0, 'Tinggi minimal 0'),
    volume: yup.number().required('Volume wajib diisi').min(0, 'Volume minimal 0'),
}).required();

export default function KonversiEdit() {
    const navigate = useNavigate();
    const { dombakId, konversiId } = useParams<{ dombakId: string; konversiId: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [formLoaded, setFormLoaded] = useState(false);

    // Fetch Konversi Data
    const { data: blockchainKonversi, isLoading: isLoadingKonversi, error: errorKonversi } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`, abi: DIAMOND_ABI, functionName: 'getKonversiById',
        args: konversiId ? [BigInt(konversiId)] : undefined, query: { enabled: !!konversiId },
    });

    // Fetch Dombak Data for display
    const { data: blockchainDombak, isLoading: isLoadingDombak } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`, abi: DIAMOND_ABI, functionName: 'getDombakById',
        args: dombakId ? [BigInt(dombakId)] : undefined, query: { enabled: !!dombakId },
    });

    // Fetch Satuan Ukur Tinggi Data for Dropdown
    const { data: satuanTinggiResponse, isLoading: isLoadingSatuanTinggi } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`, abi: DIAMOND_ABI, functionName: 'getAllSatuanUkurTinggi', args: [BigInt(0), BigInt(100)],
    });

    // Fetch Satuan Ukur Volume Data for Dropdown
    const { data: satuanVolumeResponse, isLoading: isLoadingSatuanVolume } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`, abi: DIAMOND_ABI, functionName: 'getAllSatuanUkurVolume', args: [BigInt(0), BigInt(100)],
    });

    const { writeContractAsync } = useWriteContract();

    const dombakData = useMemo(() => {
        if (!blockchainDombak) return null;
        const d = blockchainDombak as BlockchainDombak;
        if (d.deleted || Number(d.dombakId) === 0) return null;
        return { id: Number(d.dombakId), name: d.namaDombak };
    }, [blockchainDombak]);

    const satuanTinggiList = useMemo(() => {
        if (!satuanTinggiResponse) return [];
        const rawList = Array.isArray(satuanTinggiResponse) ? satuanTinggiResponse : [];
        return (rawList as BlockchainSatuanUkurTinggi[]).filter(item => !item.deleted).map(item => ({ id: Number(item.satuanUkurTinggiId), name: item.namaSatuan, singkatan: item.singkatan }));
    }, [satuanTinggiResponse]);

    const satuanVolumeList = useMemo(() => {
        if (!satuanVolumeResponse) return [];
        const rawList = Array.isArray(satuanVolumeResponse) ? satuanVolumeResponse : [];
        return (rawList as BlockchainSatuanUkurVolume[]).filter(item => !item.deleted).map(item => ({ id: Number(item.satuanUkurVolumeId), name: item.namaSatuan, singkatan: item.singkatan }));
    }, [satuanVolumeResponse]);

    const konversiData = useMemo(() => {
        if (!blockchainKonversi) return null;
        const k = blockchainKonversi as BlockchainKonversi;
        if (k.deleted || Number(k.konversiId) === 0) return null;
        return k;
    }, [blockchainKonversi]);

    const notFound = !isLoadingKonversi && !errorKonversi && !konversiData;

    const { register, handleSubmit, formState: { errors, touchedFields }, setValue } = useForm<KonversiFormData>({
        resolver: yupResolver(konversiValidationSchema) as any, mode: 'onChange',
    });

    // Populate Form when data loads
    useEffect(() => {
        if (konversiData && !formLoaded) {
            setValue('satuanUkurTinggiId', Number(konversiData.satuanUkurTinggiId));
            setValue('satuanUkurVolumeId', Number(konversiData.satuanUkurVolumeId));
            setValue('tinggi', Number(konversiData.tinggi));
            setValue('volume', Number(konversiData.volume));
            setFormLoaded(true);
        }
    }, [konversiData, formLoaded, setValue]);

    const onSubmit = async (data: KonversiFormData) => {
        if (!konversiId || !dombakId) return;
        setIsSubmitting(true);
        try {
            await writeContractAsync({
                address: DIAMOND_ADDRESS as `0x${string}`, abi: DIAMOND_ABI, functionName: 'updateKonversi',
                args: [BigInt(konversiId), BigInt(dombakId), BigInt(data.satuanUkurTinggiId), BigInt(data.satuanUkurVolumeId), BigInt(data.tinggi), BigInt(data.volume)],
            });
            setSubmitSuccess(true);
            setTimeout(() => navigate(`/master/dombak/${dombakId}/konversi`), 1500);
        } catch (error) { console.error('Error submitting form:', error); }
        finally { setIsSubmitting(false); }
    };

    const inputBaseClass = "w-full px-4 py-3 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border transition-all duration-200 outline-none";
    const getInputClass = (fieldName: keyof KonversiFormData) => {
        if (errors[fieldName]) return `${inputBaseClass} border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20`;
        if (touchedFields[fieldName]) return `${inputBaseClass} border-emerald-400 dark:border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20`;
        return `${inputBaseClass} border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20`;
    };

    if (isLoadingKonversi || isLoadingDombak || isLoadingSatuanTinggi || isLoadingSatuanVolume) return (<div className="min-h-screen relative overflow-hidden"><div className="absolute inset-0 bg-amber-50 dark:bg-slate-900" /><div className="relative z-10 flex items-center justify-center min-h-screen"><motion.div className="flex flex-col items-center gap-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}><Loader2 className="w-12 h-12 text-amber-500 animate-spin" /><p className="text-slate-600 dark:text-slate-400 font-medium">Memuat data Konversi...</p></motion.div></div></div>);

    if (notFound) return (<div className="min-h-screen relative overflow-hidden"><div className="absolute inset-0 bg-amber-50 dark:bg-slate-900" /><div className="relative z-10 flex items-center justify-center min-h-screen"><motion.div className="flex flex-col items-center gap-4 text-center p-8" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}><div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full"><AlertCircle className="w-12 h-12 text-red-500" /></div><h2 className="text-2xl font-bold text-slate-800 dark:text-white">Konversi Tidak Ditemukan</h2><p className="text-slate-600 dark:text-slate-400">Data Konversi dengan ID {konversiId} tidak ditemukan.</p><motion.button onClick={() => navigate(`/master/dombak/${dombakId}/konversi`)} className="mt-4 px-6 py-3 bg-amber-600 text-white font-semibold rounded-2xl" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Kembali ke Daftar</motion.button></motion.div></div></div>);

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-amber-50 dark:bg-slate-900" />
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-amber-400/20 to-orange-400/20 dark:from-amber-600/30 dark:to-orange-600/30 blur-3xl" animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.div className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-yellow-400/15 to-lime-400/15 dark:from-yellow-500/20 dark:to-lime-500/20 blur-3xl" animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                <motion.button onClick={() => navigate(`/master/dombak/${dombakId}/konversi`)} className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm mt-32" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} whileHover={{ x: -5 }} whileTap={{ scale: 0.95 }}><ArrowLeft className="w-4 h-4" />Kembali</motion.button>

                <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="flex items-center gap-4">
                        <motion.div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/30" whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }} transition={{ duration: 0.5 }}><ArrowUpDown className="w-8 h-8 text-white" /></motion.div>
                        <div><h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Edit Konversi</h1><p className="text-slate-500 dark:text-slate-400 mt-1">Dombak: <span className="font-semibold text-amber-600">{dombakData?.name || `ID ${dombakId}`}</span></p></div>
                    </div>
                </motion.div>

                <motion.div className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />
                    <motion.div className="absolute top-[10%] right-[10%] pointer-events-none" animate={{ opacity: [0, 0.5, 0], scale: [0, 1, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }}><Sparkles className="w-5 h-5 text-amber-400/50" /></motion.div>

                    <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 p-6 md:p-8 space-y-6">
                        {/* Satuan Ukur Tinggi Selection */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"><Ruler className="w-4 h-4 text-amber-500" />Satuan Ukur Tinggi</label>
                            <select {...register('satuanUkurTinggiId')} className={`${getInputClass('satuanUkurTinggiId')} text-slate-700 dark:text-slate-200 cursor-pointer`}>
                                <option value={0}>-- Pilih Satuan Ukur Tinggi --</option>
                                {satuanTinggiList.map((item) => (<option key={item.id} value={item.id}>{item.name} ({item.singkatan})</option>))}
                            </select>
                            {errors.satuanUkurTinggiId && <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.satuanUkurTinggiId.message}</motion.p>}
                        </motion.div>

                        {/* Satuan Ukur Volume Selection */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"><Droplets className="w-4 h-4 text-blue-500" />Satuan Ukur Volume</label>
                            <select {...register('satuanUkurVolumeId')} className={`${getInputClass('satuanUkurVolumeId')} text-slate-700 dark:text-slate-200 cursor-pointer`}>
                                <option value={0}>-- Pilih Satuan Ukur Volume --</option>
                                {satuanVolumeList.map((item) => (<option key={item.id} value={item.id}>{item.name} ({item.singkatan})</option>))}
                            </select>
                            {errors.satuanUkurVolumeId && <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.satuanUkurVolumeId.message}</motion.p>}
                        </motion.div>

                        {/* Tinggi */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"><Ruler className="w-4 h-4 text-orange-500" />Tinggi</label>
                            <input type="number" step="any" {...register('tinggi')} placeholder="Contoh: 100" className={`${getInputClass('tinggi')} text-slate-700 dark:text-slate-200 placeholder-slate-400`} />
                            {errors.tinggi && <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.tinggi.message}</motion.p>}
                        </motion.div>

                        {/* Volume */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"><Droplets className="w-4 h-4 text-cyan-500" />Volume</label>
                            <input type="number" step="any" {...register('volume')} placeholder="Contoh: 500" className={`${getInputClass('volume')} text-slate-700 dark:text-slate-200 placeholder-slate-400`} />
                            {errors.volume && <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.volume.message}</motion.p>}
                        </motion.div>

                        {/* Form Actions */}
                        <motion.div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                            <motion.button type="submit" disabled={isSubmitting || submitSuccess} className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-2xl transition-all shadow-lg ${submitSuccess ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30' : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-amber-500/30'} disabled:opacity-70 disabled:cursor-not-allowed`} whileHover={{ scale: isSubmitting || submitSuccess ? 1 : 1.02, y: isSubmitting || submitSuccess ? 0 : -2 }} whileTap={{ scale: isSubmitting || submitSuccess ? 1 : 0.98 }}>
                                {isSubmitting ? (<><Loader2 className="w-5 h-5 animate-spin" />Menyimpan...</>) : submitSuccess ? (<><CheckCircle2 className="w-5 h-5" />Berhasil Diupdate!</>) : (<><Save className="w-5 h-5" />Simpan Perubahan</>)}
                            </motion.button>
                        </motion.div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
