'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import { ArrowUpDown, ArrowLeft, Edit3, Trash2, Hash, AlertCircle, Loader2, Sparkles, Ruler, Droplets, Container, Clock } from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain Interfaces
interface BlockchainKonversi { konversiId: bigint; dombakId: bigint; satuanUkurTinggiId: bigint; satuanUkurVolumeId: bigint; tinggi: bigint; volume: bigint; createdAt: bigint; updatedAt: bigint; deleted: boolean; }
interface BlockchainDombak { dombakId: bigint; namaDombak: string; deleted: boolean; }
interface BlockchainSatuanUkurTinggi { satuanUkurTinggiId: bigint; namaSatuan: string; singkatan: string; deleted: boolean; }
interface BlockchainSatuanUkurVolume { satuanUkurVolumeId: bigint; namaSatuan: string; singkatan: string; deleted: boolean; }

// Display Interface
interface KonversiData { konversiId: number; dombakId: number; dombakName: string; satuanUkurTinggiId: number; satuanUkurTinggiName: string; satuanUkurVolumeId: number; satuanUkurVolumeName: string; tinggi: number; volume: number; createdAt: Date; updatedAt: Date; }

export default function KonversiShow() {
    const navigate = useNavigate();
    const { dombakId, konversiId } = useParams<{ dombakId: string; konversiId: string }>();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch Konversi Data
    const { data: blockchainKonversi, isLoading: isLoadingKonversi, error: errorKonversi } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`, abi: DIAMOND_ABI, functionName: 'getKonversiById',
        args: konversiId ? [BigInt(konversiId)] : undefined, query: { enabled: !!konversiId },
    });

    const konversi = blockchainKonversi as BlockchainKonversi | undefined;

    // Fetch Dombak Data
    const { data: blockchainDombak, isLoading: isLoadingDombak } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`, abi: DIAMOND_ABI, functionName: 'getDombakById',
        args: konversi?.dombakId ? [konversi.dombakId] : undefined, query: { enabled: !!konversi?.dombakId },
    });

    // Fetch SatuanUkurTinggi Data
    const { data: blockchainSatuanTinggi, isLoading: isLoadingSatuanTinggi } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`, abi: DIAMOND_ABI, functionName: 'getSatuanUkurTinggiById',
        args: konversi?.satuanUkurTinggiId ? [konversi.satuanUkurTinggiId] : undefined, query: { enabled: !!konversi?.satuanUkurTinggiId },
    });

    // Fetch SatuanUkurVolume Data
    const { data: blockchainSatuanVolume, isLoading: isLoadingSatuanVolume } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`, abi: DIAMOND_ABI, functionName: 'getSatuanUkurVolumeById',
        args: konversi?.satuanUkurVolumeId ? [konversi.satuanUkurVolumeId] : undefined, query: { enabled: !!konversi?.satuanUkurVolumeId },
    });

    const { writeContract, isSuccess: isWriteSuccess } = useWriteContract();

    useEffect(() => {
        if (isWriteSuccess && isDeleting) { setIsDeleting(false); navigate(`/master/dombak/${dombakId}/konversi`); }
    }, [isWriteSuccess, isDeleting, navigate, dombakId]);

    // Format Data
    const konversiData = useMemo((): KonversiData | null => {
        if (!konversi) return null;
        if (konversi.deleted || Number(konversi.konversiId) === 0) return null;

        const dombak = blockchainDombak as BlockchainDombak | undefined;
        const satuanTinggi = blockchainSatuanTinggi as BlockchainSatuanUkurTinggi | undefined;
        const satuanVolume = blockchainSatuanVolume as BlockchainSatuanUkurVolume | undefined;

        return {
            konversiId: Number(konversi.konversiId), dombakId: Number(konversi.dombakId),
            dombakName: dombak?.namaDombak || 'Loading...', satuanUkurTinggiId: Number(konversi.satuanUkurTinggiId),
            satuanUkurTinggiName: satuanTinggi ? `${satuanTinggi.namaSatuan} (${satuanTinggi.singkatan})` : 'Loading...',
            satuanUkurVolumeId: Number(konversi.satuanUkurVolumeId),
            satuanUkurVolumeName: satuanVolume ? `${satuanVolume.namaSatuan} (${satuanVolume.singkatan})` : 'Loading...',
            tinggi: Number(konversi.tinggi), volume: Number(konversi.volume),
            createdAt: new Date(Number(konversi.createdAt) * 1000), updatedAt: new Date(Number(konversi.updatedAt) * 1000),
        };
    }, [konversi, blockchainDombak, blockchainSatuanTinggi, blockchainSatuanVolume]);

    const isLoading = isLoadingKonversi || isLoadingDombak || isLoadingSatuanTinggi || isLoadingSatuanVolume;
    const notFound = !isLoading && !errorKonversi && !konversiData;

    const formatDateTime = (date: Date) => date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const handleDelete = async () => {
        if (!konversiId) return;
        setIsDeleting(true);
        try { writeContract({ address: DIAMOND_ADDRESS as `0x${string}`, abi: DIAMOND_ABI, functionName: 'deleteKonversi', args: [BigInt(konversiId)] }); }
        catch (error) { console.error('Error deleting:', error); setIsDeleting(false); }
    };

    if (isLoading) return (<div className="min-h-screen relative overflow-hidden"><div className="absolute inset-0 bg-amber-50 dark:bg-slate-900" /><div className="relative z-10 flex items-center justify-center min-h-screen"><motion.div className="flex flex-col items-center gap-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}><Loader2 className="w-12 h-12 text-amber-500 animate-spin" /><p className="text-slate-600 dark:text-slate-400 font-medium">Memuat detail Konversi...</p></motion.div></div></div>);

    if (notFound || !konversiData) return (<div className="min-h-screen relative overflow-hidden"><div className="absolute inset-0 bg-amber-50 dark:bg-slate-900" /><div className="relative z-10 flex items-center justify-center min-h-screen"><motion.div className="flex flex-col items-center gap-4 text-center p-8" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}><div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full"><AlertCircle className="w-12 h-12 text-red-500" /></div><h2 className="text-2xl font-bold text-slate-800 dark:text-white">Konversi Tidak Ditemukan</h2><p className="text-slate-600 dark:text-slate-400">Data Konversi dengan ID {konversiId} tidak ditemukan.</p><motion.button onClick={() => navigate(`/master/dombak/${dombakId}/konversi`)} className="mt-4 px-6 py-3 bg-amber-600 text-white font-semibold rounded-2xl" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Kembali ke Daftar</motion.button></motion.div></div></div>);

    const detailItems = [
        { label: 'ID Konversi', value: konversiData.konversiId.toString(), icon: Hash, color: 'amber' },
        { label: 'Dombak', value: konversiData.dombakName, icon: Container, color: 'purple' },
        { label: 'Satuan Ukur Tinggi', value: konversiData.satuanUkurTinggiName, icon: Ruler, color: 'orange' },
        { label: 'Satuan Ukur Volume', value: konversiData.satuanUkurVolumeName, icon: Droplets, color: 'blue' },
        { label: 'Tinggi', value: konversiData.tinggi.toString(), icon: Ruler, color: 'emerald' },
        { label: 'Volume', value: konversiData.volume.toString(), icon: Droplets, color: 'cyan' },
        { label: 'Dibuat', value: formatDateTime(konversiData.createdAt), icon: Clock, color: 'slate' },
        { label: 'Diperbarui', value: formatDateTime(konversiData.updatedAt), icon: Clock, color: 'gray' },
    ];

    const colorMap: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
        amber: { bg: 'bg-amber-100', text: 'text-amber-600', darkBg: 'dark:bg-amber-900/30', darkText: 'dark:text-amber-400' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-600', darkBg: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-400' },
        orange: { bg: 'bg-orange-100', text: 'text-orange-600', darkBg: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-400' },
        blue: { bg: 'bg-blue-100', text: 'text-blue-600', darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-400' },
        emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', darkBg: 'dark:bg-emerald-900/30', darkText: 'dark:text-emerald-400' },
        cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', darkBg: 'dark:bg-cyan-900/30', darkText: 'dark:text-cyan-400' },
        slate: { bg: 'bg-slate-100', text: 'text-slate-600', darkBg: 'dark:bg-slate-900/30', darkText: 'dark:text-slate-400' },
        gray: { bg: 'bg-gray-100', text: 'text-gray-600', darkBg: 'dark:bg-gray-900/30', darkText: 'dark:text-gray-400' },
    };

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
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <motion.div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/30" whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }} transition={{ duration: 0.5 }}><ArrowUpDown className="w-8 h-8 text-white" /></motion.div>
                            <div><h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Detail Konversi</h1><p className="text-slate-500 dark:text-slate-400 mt-1">Dombak: {konversiData.dombakName}</p></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <motion.button onClick={() => navigate(`/master/dombak/${dombakId}/konversi/${konversiData.konversiId}/edit`)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/30" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Edit3 className="w-4 h-4" />Edit</motion.button>
                            <motion.button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium rounded-xl shadow-lg shadow-red-500/30" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Trash2 className="w-4 h-4" />Hapus</motion.button>
                        </div>
                    </div>
                </motion.div>

                <motion.div className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />
                    {[...Array(5)].map((_, i) => (<motion.div key={i} className="absolute pointer-events-none" style={{ top: `${15 + (i * 18)}%`, left: `${10 + (i * 20)}%` }} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0], rotate: [0, 180] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.8, ease: 'easeInOut' }}><Sparkles className="w-4 h-4 text-amber-400/60 dark:text-amber-300/40" /></motion.div>))}
                    <div className="relative z-10 p-6 md:p-8 space-y-4">
                        {detailItems.map((item, index) => { const colors = colorMap[item.color]; return (<motion.div key={item.label} className="flex items-start gap-4 p-4 bg-white/50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700/50" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + index * 0.05 }}><div className={`p-3 ${colors.bg} ${colors.darkBg} rounded-xl`}><item.icon className={`w-5 h-5 ${colors.text} ${colors.darkText}`} /></div><div className="flex-1 min-w-0"><p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">{item.label}</p><p className="mt-1 text-lg font-semibold text-slate-700 dark:text-slate-200 break-words">{item.value}</p></div></motion.div>); })}
                    </div>
                </motion.div>
            </div>

            <AnimatePresence>
                {showDeleteModal && (<motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteModal(false)}><motion.div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}><div className="p-6 text-center"><div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4"><Trash2 className="w-8 h-8 text-red-500" /></div><h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Hapus Konversi?</h3><p className="text-slate-600 dark:text-slate-400 mb-6">Apakah Anda yakin ingin menghapus konversi ini? Tindakan ini tidak dapat dibatalkan.</p><div className="flex gap-3"><motion.button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Batal</motion.button><motion.button onClick={handleDelete} disabled={isDeleting} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-2xl disabled:opacity-70" whileHover={{ scale: isDeleting ? 1 : 1.02 }} whileTap={{ scale: isDeleting ? 1 : 0.98 }}>{isDeleting ? (<><Loader2 className="w-4 h-4 animate-spin" />Menghapus...</>) : (<><Trash2 className="w-4 h-4" />Hapus</>)}</motion.button></div></div></motion.div></motion.div>)}
            </AnimatePresence>
        </div>
    );
}
