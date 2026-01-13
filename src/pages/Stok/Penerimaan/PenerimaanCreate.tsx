'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useConfig } from 'wagmi';
import { readContract } from '@wagmi/core';
import {
    ArrowLeft, Building2, Truck,
    AlertCircle, Loader2, Droplet, FileText,
    Receipt, Calculator, ClipboardCheck,
    Package, Plus, Save, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { formatNumber } from '@/lib/utils';

// Blockchain interfaces
interface BlockchainDombak {
    dombakId: bigint;
    namaDombak: string;
    stok: bigint;
}

interface BlockchainJamKerja {
    jamKerjaId: bigint;
    namaJamKerja: string;
    jamMulai: bigint;
    jamSelesai: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainPenerimaanCreateDetail {
    fileLoId: bigint;
    detailRencanaPembelianId: bigint;
    pengirimanId: bigint;
    tanggalPengiriman: bigint;
    rencanaPembelianId: bigint;
    deskripsi: string;
    namaSpbu: string;
    pegawaiPengusul: string;
    tanggalPembelian: bigint;
    kodePembelian: string;
    harga: bigint;
    totalHarga: bigint;
    jumlah: bigint;
    satuanJumlah: string;
    noFaktur: string;
    noLo: string;
    noDo: string;
    noPol: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
    ipfsHash: string;
    dombakList: BlockchainDombak[];
    jamKerjaList: BlockchainJamKerja[];
}

// Form state for each dombak
interface DombakFormState {
    dombakId: number;
    namaDombak: string;
    stokSaatIni: number;
    tinggiSebelum: string;
    tinggiSetelah: string;
    alokasiDombak: string;
    volumeSebelum: number;
    volumeSetelah: number;
    isLoadingSebelum: boolean;
    isLoadingSetelah: boolean;
}

export default function PenerimaanCreate() {
    const navigate = useNavigate();
    const { fileLoId } = useParams<{ fileLoId: string }>();

    const fileLoIdNumber = fileLoId ? parseInt(fileLoId, 10) : 0;
    const isValidFileLoId = !isNaN(fileLoIdNumber) && fileLoIdNumber > 0;

    // Form states
    const [dombakForms, setDombakForms] = useState<DombakFormState[]>([]);
    const [tanggalPenerimaan, setTanggalPenerimaan] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [jamKerjaId, setJamKerjaId] = useState<string>('');
    const [jamPenerimaan, setJamPenerimaan] = useState<string>(
        new Date().toTimeString().slice(0, 5)
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch detail data
    const { data: detailResponse, isLoading, error } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getPenerimaanCreateDetailInfoDombak',
        args: isValidFileLoId ? [BigInt(fileLoIdNumber)] : undefined,
        query: { enabled: isValidFileLoId }
    });

    const detail = detailResponse as BlockchainPenerimaanCreateDetail | undefined;
    const hasData = isValidFileLoId && detail && Number(detail.fileLoId) > 0;

    // Initialize dombak forms when data is loaded
    useEffect(() => {
        if (detail?.dombakList && dombakForms.length === 0) {
            const initialForms: DombakFormState[] = detail.dombakList.map(d => ({
                dombakId: Number(d.dombakId),
                namaDombak: d.namaDombak,
                stokSaatIni: Number(d.stok) / 100, // scaled x100 in blockchain
                tinggiSebelum: '',
                tinggiSetelah: '',
                alokasiDombak: '',
                volumeSebelum: 0,
                volumeSetelah: 0,
                isLoadingSebelum: false,
                isLoadingSetelah: false,
            }));
            setDombakForms(initialForms);
        }
    }, [detail, dombakForms.length]);

    // Jam kerja options
    const jamKerjaOptions = useMemo(() => {
        if (!detail?.jamKerjaList) return [];
        return detail.jamKerjaList
            .filter(j => !j.deleted)
            .map(j => ({
                id: Number(j.jamKerjaId),
                nama: j.namaJamKerja,
            }));
    }, [detail]);

    // Get wagmi config for readContract
    const config = useConfig();

    // Function to fetch volume by height using blockchain
    const fetchVolumeByTinggi = useCallback(async (dombakId: number, tinggi: number): Promise<number> => {
        try {
            const result = await readContract(config, {
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'getKonversiByTinggi',
                args: [BigInt(dombakId), BigInt(tinggi)],
            });
            // Result is volume in bigint scaled x100, convert and unscale
            return Number(result || 0) / 100;
        } catch (error) {
            console.error('Error fetching volume:', error);
            return 0;
        }
    }, [config]);

    // Read contract for volume conversion - we'll use individual calls
    const handleTinggiChange = async (
        index: number,
        field: 'tinggiSebelum' | 'tinggiSetelah',
        value: string
    ) => {
        // Regex to allow only numbers and a single dot
        const regex = /^\d*\.?\d*$/;
        if (!regex.test(value)) return;

        const newForms = [...dombakForms];
        newForms[index][field] = value;

        if (field === 'tinggiSebelum') {
            newForms[index].isLoadingSebelum = true;
        } else {
            newForms[index].isLoadingSetelah = true;
        }
        setDombakForms(newForms);

        // Scaling logic: e.g. "120.5" -> 12050
        const floatVal = parseFloat(value);
        if (!isNaN(floatVal) && floatVal > 0) {
            const scaledTinggi = Math.round(floatVal * 100);

            // Debounce and fetch volume
            setTimeout(async () => {
                const volume = await fetchVolumeByTinggi(newForms[index].dombakId, scaledTinggi);
                const updatedForms = [...dombakForms];
                if (field === 'tinggiSebelum') {
                    updatedForms[index].volumeSebelum = volume;
                    updatedForms[index].isLoadingSebelum = false;
                } else {
                    updatedForms[index].volumeSetelah = volume;
                    updatedForms[index].isLoadingSetelah = false;
                }
                setDombakForms(updatedForms);
            }, 500);
        } else {
            const updatedForms = [...dombakForms];
            if (field === 'tinggiSebelum') {
                updatedForms[index].volumeSebelum = 0;
                updatedForms[index].isLoadingSebelum = false;
            } else {
                updatedForms[index].volumeSetelah = 0;
                updatedForms[index].isLoadingSetelah = false;
            }
            setDombakForms(updatedForms);
        }
    };

    const handleAlokasiChange = (index: number, value: string) => {
        const newForms = [...dombakForms];
        newForms[index].alokasiDombak = value;
        setDombakForms(newForms);
    };

    // Calculate totals
    const calculations = useMemo(() => {
        const volumeAktual = dombakForms.reduce((sum, d) => {
            return sum + (d.volumeSetelah - d.volumeSebelum);
        }, 0);

        const volumeYangDibeli = detail ? Number(detail.jumlah) : 0;
        const volumeLossProfit = volumeAktual - volumeYangDibeli;

        return { volumeAktual, volumeYangDibeli, volumeLossProfit };
    }, [dombakForms, detail]);

    // Handle form submit (placeholder - blockchain function to follow)
    const handleSubmit = async () => {
        setIsSubmitting(true);
        // TODO: Implement blockchain createPenerimaan call
        console.log('Submitting:', {
            fileLoId: fileLoIdNumber,
            tanggalPenerimaan,
            jamKerjaId,
            jamPenerimaan,
            dombakForms,
            calculations
        });
        setIsSubmitting(false);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-50/80 dark:bg-slate-900" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">Memuat data...</p>
                </div>
            </div>
        );
    }

    // Error or not found
    if (error || !hasData) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-50/80 dark:bg-slate-900" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
                    <motion.div
                        className="flex flex-col items-center gap-4 max-w-md text-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                            Data Tidak Ditemukan
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Data File LO dengan ID {fileLoId} tidak ditemukan.
                        </p>
                        <motion.button
                            onClick={() => navigate('/stok/penerimaan-minyak')}
                            className="mt-4 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-2xl"
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
            <div className="absolute inset-0 bg-emerald-50/80 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-emerald-400/20 to-green-400/20 dark:from-emerald-600/30 dark:to-green-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-teal-400/15 to-cyan-400/15 dark:from-teal-500/20 dark:to-cyan-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate(`/stok/penerimaan-minyak/${fileLoIdNumber}`)}
                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </motion.button>

                {/* Header Section */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600" />
                    <div className="relative z-10 p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Plus className="w-8 h-8 text-white" />
                                </motion.div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                                        Form Penerimaan Minyak
                                    </h1>
                                    <p className="text-white/80 mt-1">
                                        {detail.kodePembelian} - {detail.noLo}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Info Summary Cards */}
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="p-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
                            <Building2 className="w-4 h-4" />
                            SPBU
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-white truncate">{detail.namaSpbu}</p>
                    </div>
                    <div className="p-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
                            <FileText className="w-4 h-4" />
                            No. Faktur
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-white truncate">{detail.noFaktur}</p>
                    </div>
                    <div className="p-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
                            <Truck className="w-4 h-4" />
                            No. Polisi
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-white truncate">{detail.noPol}</p>
                    </div>
                    <div className="p-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
                            <Package className="w-4 h-4" />
                            Volume Dibeli
                        </div>
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">{formatNumber(Number(detail.jumlah))} {detail.satuanJumlah}</p>
                    </div>
                </motion.div>

                {/* Dombak Form Cards */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                    <div className="relative z-10 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Droplet className="w-5 h-5 text-emerald-500" />
                            Input Per Dombak
                        </h2>

                        <div className="space-y-4">
                            {dombakForms.map((dombak, index) => (
                                <motion.div
                                    key={dombak.dombakId}
                                    className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.25 + index * 0.05 }}
                                >
                                    {/* Dombak Header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                                <Droplet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-800 dark:text-white">
                                                    {dombak.namaDombak}
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Stok saat ini: {formatNumber(dombak.stokSaatIni)} L
                                                </p>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-full text-sm text-slate-600 dark:text-slate-300">
                                            ID: {dombak.dombakId}
                                        </div>
                                    </div>

                                    {/* Input Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Tinggi Sebelum */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Tinggi Sebelum (cm)
                                            </label>
                                            <input
                                                type="text"
                                                value={dombak.tinggiSebelum}
                                                onChange={(e) => handleTinggiChange(index, 'tinggiSebelum', e.target.value)}
                                                placeholder="0"
                                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-slate-700 dark:text-slate-200"
                                            />
                                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                {dombak.isLoadingSebelum ? (
                                                    <><Loader2 className="w-3 h-3 animate-spin" /> Mengkonversi...</>
                                                ) : (
                                                    <>Volume: <span className="font-medium text-slate-700 dark:text-slate-300">{formatNumber(dombak.volumeSebelum)} L</span></>
                                                )}
                                            </div>
                                        </div>

                                        {/* Tinggi Setelah */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Tinggi Setelah (cm)
                                            </label>
                                            <input
                                                type="text"
                                                value={dombak.tinggiSetelah}
                                                onChange={(e) => handleTinggiChange(index, 'tinggiSetelah', e.target.value)}
                                                placeholder="0"
                                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-slate-700 dark:text-slate-200"
                                            />
                                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                {dombak.isLoadingSetelah ? (
                                                    <><Loader2 className="w-3 h-3 animate-spin" /> Mengkonversi...</>
                                                ) : (
                                                    <>Volume: <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatNumber(dombak.volumeSetelah)} L</span></>
                                                )}
                                            </div>
                                        </div>

                                        {/* Alokasi Dombak */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Alokasi Dombak (L)
                                            </label>
                                            <input
                                                type="number"
                                                value={dombak.alokasiDombak}
                                                onChange={(e) => handleAlokasiChange(index, e.target.value)}
                                                placeholder="0"
                                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-slate-700 dark:text-slate-200"
                                            />
                                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                Selisih: <span className={`font-medium ${dombak.volumeSetelah - dombak.volumeSebelum >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {formatNumber(dombak.volumeSetelah - dombak.volumeSebelum)} L
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Penerimaan Form Card */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                    <div className="relative z-10 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <ClipboardCheck className="w-5 h-5 text-emerald-500" />
                            Detail Penerimaan
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {/* Tanggal Penerimaan */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Tanggal Penerimaan <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={tanggalPenerimaan}
                                    onChange={(e) => setTanggalPenerimaan(e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-slate-700 dark:text-slate-200"
                                />
                            </div>

                            {/* Jam Kerja */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Jam Kerja <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={jamKerjaId}
                                    onChange={(e) => setJamKerjaId(e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-slate-700 dark:text-slate-200 cursor-pointer"
                                >
                                    <option value="">Pilih Jam Kerja</option>
                                    {jamKerjaOptions.map(jk => (
                                        <option key={jk.id} value={jk.id}>{jk.nama}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Jam Penerimaan */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Jam Penerimaan <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    value={jamPenerimaan}
                                    onChange={(e) => setJamPenerimaan(e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-slate-700 dark:text-slate-200"
                                />
                            </div>
                        </div>

                        {/* Volume Summary */}
                        <div className="space-y-3">
                            {/* Volume Aktual */}
                            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                        <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Volume Aktual (L)</span>
                                        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Total selisih volume semua dombak</p>
                                    </div>
                                </div>
                                <p className="font-bold text-emerald-700 dark:text-emerald-300 text-xl">
                                    {formatNumber(calculations.volumeAktual)}
                                </p>
                            </div>

                            {/* Volume Yang Dibeli */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Volume Yang Dibeli (L)</span>
                                </div>
                                <p className="font-bold text-slate-800 dark:text-white">
                                    {formatNumber(calculations.volumeYangDibeli)}
                                </p>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-slate-200 dark:border-slate-700" />

                            {/* Loss/Profit */}
                            <div className={`flex items-center justify-between p-4 rounded-xl border ${calculations.volumeLossProfit >= 0
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${calculations.volumeLossProfit >= 0
                                        ? 'bg-green-100 dark:bg-green-900/30'
                                        : 'bg-red-100 dark:bg-red-900/30'
                                        }`}>
                                        {calculations.volumeLossProfit > 0 ? (
                                            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        ) : calculations.volumeLossProfit < 0 ? (
                                            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                                        ) : (
                                            <Minus className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <span className={`text-sm font-medium ${calculations.volumeLossProfit >= 0
                                            ? 'text-green-700 dark:text-green-300'
                                            : 'text-red-700 dark:text-red-300'
                                            }`}>
                                            {calculations.volumeLossProfit >= 0 ? 'Profit' : 'Loss'} (L)
                                        </span>
                                        <p className={`text-xs ${calculations.volumeLossProfit >= 0
                                            ? 'text-green-600/70 dark:text-green-400/70'
                                            : 'text-red-600/70 dark:text-red-400/70'
                                            }`}>
                                            Volume Aktual - Volume Dibeli
                                        </p>
                                    </div>
                                </div>
                                <p className={`font-bold text-xl ${calculations.volumeLossProfit >= 0
                                    ? 'text-green-700 dark:text-green-300'
                                    : 'text-red-700 dark:text-red-300'
                                    }`}>
                                    {calculations.volumeLossProfit >= 0 ? '+' : ''}{formatNumber(calculations.volumeLossProfit)}
                                </p>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !jamKerjaId}
                            className="w-full mt-6 flex items-center justify-center gap-2 px-5 py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/30 disabled:shadow-none disabled:cursor-not-allowed"
                            whileHover={{ scale: isSubmitting || !jamKerjaId ? 1 : 1.02 }}
                            whileTap={{ scale: isSubmitting || !jamKerjaId ? 1 : 0.98 }}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Simpan Penerimaan
                                </>
                            )}
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
