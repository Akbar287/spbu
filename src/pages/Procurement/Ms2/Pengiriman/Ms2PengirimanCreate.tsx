'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Truck, ArrowLeft, Calendar, Package, Clock, Loader2,
    AlertCircle, CheckCircle, Plus, Minus, Droplet, MessageSquare, Copy
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

const kodeProduk = [
    {
        nama: "Pertamina Dex",
        kode: "PDX"
    },
    {
        nama: "Pertamax",
        kode: "PX"
    },
    {
        nama: "Pertalite",
        kode: "PL"
    },
    {
        nama: "Dexlite",
        kode: "DT"
    },
    {
        nama: "Solar",
        kode: "BST"
    }
]

// Blockchain interfaces
interface BlockchainProdukWithDetail {
    produkId: bigint;
    detailRencanaPembelianId: bigint;
    namaProduk: string;
    jumlah: bigint;
    tanggalPembelian: bigint;
    kodePembelian: string;
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

// Display interfaces
interface ProdukItem {
    produkId: number;
    detailRencanaPembelianId: number;
    namaProduk: string;
    jumlah: number;
    tanggalPembelian: Date;
    kodePembelian: string;
    selected: boolean;
    jamKerjaId: number;
}

interface JamKerjaItem {
    jamKerjaId: number;
    namaJamKerja: string;
}

interface BlockchainSpbu {
    spbuId: bigint;
    nomorSpbu: string;
    namaSpbu: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface SmsFormData {
    sisaStok: string;
    loTersedia: string;
    penerimaanTerakhir: string;
}

// Format functions
const formatTanggal = (date: Date): string => {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(date);
};

const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('id-ID').format(value);
};

export default function Ms2PengirimanCreate() {
    const navigate = useNavigate();
    const [tanggalPengiriman, setTanggalPengiriman] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [selectedItems, setSelectedItems] = useState<Map<number, ProdukItem>>(new Map());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [smsFormData, setSmsFormData] = useState<Map<number, SmsFormData>>(new Map());
    const [copiedId, setCopiedId] = useState<number | null>(null);

    // Fetch available products for MS2
    const { data: produkResponse, isLoading: isLoadingProduk, error: errorProduk } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllProdukWithDetailRencanaPembelian',
        args: [],
    });

    // Fetch jam kerja
    const { data: jamKerjaResponse, isLoading: isLoadingJamKerja } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllJamKerja',
        args: [BigInt(0), BigInt(100)],
    });

    // Fetch SPBU data
    const { data: spbuResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllSpbu',
        args: [BigInt(0), BigInt(10)],
    });

    const nomorSpbu = useMemo(() => {
        if (!spbuResponse) return '';
        const [data] = spbuResponse as [BlockchainSpbu[], bigint];
        const spbu = data.find(s => !s.deleted);
        return spbu?.nomorSpbu || '';
    }, [spbuResponse]);

    // Write contract hook
    const { writeContract, isPending: isWritePending, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle write success
    React.useEffect(() => {
        if (isWriteSuccess) {
            setShowSuccess(true);
            setTimeout(() => {
                navigate('/procurement/ms2/pengiriman');
            }, 2000);
        }
    }, [isWriteSuccess, navigate]);

    // Process produk data
    const produkList = useMemo((): ProdukItem[] => {
        if (!produkResponse) return [];
        const data = produkResponse as BlockchainProdukWithDetail[];
        return data.map((item) => ({
            produkId: Number(item.produkId),
            detailRencanaPembelianId: Number(item.detailRencanaPembelianId),
            namaProduk: item.namaProduk,
            jumlah: Number(item.jumlah), // Stock quantity, no scaling needed
            tanggalPembelian: new Date(Number(item.tanggalPembelian) * 1000),
            kodePembelian: item.kodePembelian,
            selected: false,
            jamKerjaId: 0,
        }));
    }, [produkResponse]);

    // Process jam kerja data
    const jamKerjaList = useMemo((): JamKerjaItem[] => {
        if (!jamKerjaResponse) return [];
        const [data] = jamKerjaResponse as [BlockchainJamKerja[], bigint];
        return data
            .filter(item => !item.deleted)
            .map((item) => ({
                jamKerjaId: Number(item.jamKerjaId),
                namaJamKerja: item.namaJamKerja,
            }));
    }, [jamKerjaResponse]);

    // Toggle item selection
    const toggleItem = (item: ProdukItem) => {
        const newSelected = new Map(selectedItems);
        const newSmsForm = new Map(smsFormData);
        if (newSelected.has(item.detailRencanaPembelianId)) {
            newSelected.delete(item.detailRencanaPembelianId);
            newSmsForm.delete(item.produkId);
        } else {
            newSelected.set(item.detailRencanaPembelianId, { ...item, selected: true, jamKerjaId: jamKerjaList[0]?.jamKerjaId || 0 });
            // Initialize SMS form if product not already in form
            if (!newSmsForm.has(item.produkId)) {
                newSmsForm.set(item.produkId, { sisaStok: '', loTersedia: '', penerimaanTerakhir: '' });
            }
        }
        setSelectedItems(newSelected);
        setSmsFormData(newSmsForm);
    };

    // Update jam kerja for selected item
    const updateJamKerja = (detailId: number, jamKerjaId: number) => {
        const newSelected = new Map(selectedItems);
        const item = newSelected.get(detailId);
        if (item) {
            newSelected.set(detailId, { ...item, jamKerjaId });
            setSelectedItems(newSelected);
        }
    };

    // Handle submit
    const handleSubmit = async () => {
        if (selectedItems.size === 0) return;

        setIsSubmitting(true);
        try {
            const items = Array.from(selectedItems.values());
            const detailIds = items.map(item => BigInt(item.detailRencanaPembelianId));
            const jamKerjaIds = items.map(item => BigInt(item.jamKerjaId));
            const tanggalTimestamp = BigInt(Math.floor(new Date(tanggalPengiriman).getTime() / 1000));

            // Generate SMS codes
            const smsCodes = getUniqueProdukIds().map(produkId => generateSmsCode(produkId));
            const kodeSms = smsCodes.join(' ');

            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'createMs2',
                args: [tanggalTimestamp, kodeSms, detailIds, jamKerjaIds],
            });
        } catch (error) {
            console.error('Error submitting:', error);
            setIsSubmitting(false);
        }
    };

    // Update SMS form data
    const updateSmsForm = (produkId: number, field: keyof SmsFormData, value: string) => {
        const newSmsForm = new Map(smsFormData);
        const current = newSmsForm.get(produkId) || { sisaStok: '', loTersedia: '', penerimaanTerakhir: '' };
        newSmsForm.set(produkId, { ...current, [field]: value });
        setSmsFormData(newSmsForm);
    };

    // Get unique produk IDs from selected items
    const getUniqueProdukIds = () => {
        const ids = new Set<number>();
        selectedItems.forEach(item => ids.add(item.produkId));
        return Array.from(ids);
    };

    // Get total jumlah for a produk
    const getTotalJumlahForProduk = (produkId: number) => {
        let total = 0;
        selectedItems.forEach(item => {
            if (item.produkId === produkId) {
                total += item.jumlah;
            }
        });
        return total;
    };

    // Calculate ritase (8KL = 1 ritase)
    const calculateRitase = (jumlah: number) => {
        return Math.ceil(jumlah / 8000);
    };

    // Get kode produk from nama produk
    const getKodeProduk = (namaProduk: string) => {
        const found = kodeProduk.find(p => p.nama.toLowerCase() === namaProduk.toLowerCase());
        return found?.kode || namaProduk.substring(0, 3).toUpperCase();
    };

    // Generate SMS code for a produk
    const generateSmsCode = (produkId: number) => {
        const items = Array.from(selectedItems.values()).filter(i => i.produkId === produkId);
        if (items.length === 0) return '';

        const namaProduk = items[0].namaProduk;
        const kode = getKodeProduk(namaProduk);
        const form = smsFormData.get(produkId) || { sisaStok: '0', loTersedia: '0', penerimaanTerakhir: '0' };
        const totalJumlah = getTotalJumlahForProduk(produkId);
        const stokKL = Math.round(totalJumlah / 1000); // Convert L to KL
        const ritase = calculateRitase(totalJumlah);

        return `Stok ${nomorSpbu} ${kode}-${form.sisaStok || 0}-${form.loTersedia || 0}-${form.penerimaanTerakhir || 0}-${ritase}:${stokKL}`;
    };

    // Copy SMS code to clipboard
    const copyToClipboard = (produkId: number) => {
        const code = generateSmsCode(produkId);
        navigator.clipboard.writeText(code);
        setCopiedId(produkId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const isLoading = isLoadingProduk || isLoadingJamKerja;

    if (isLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-50/80 dark:bg-slate-900" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">Memuat data...</p>
                </div>
            </div>
        );
    }

    if (errorProduk) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-50/80 dark:bg-slate-900" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
                    <motion.div
                        className="flex flex-col items-center gap-4 max-w-md text-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Gagal Memuat Data</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                            {errorProduk.message}
                        </p>
                        <motion.button
                            onClick={() => navigate('/procurement/ms2/pengiriman')}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Kembali
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-indigo-50/80 dark:bg-slate-900" />

            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-indigo-400/20 to-purple-400/20 dark:from-indigo-600/30 dark:to-purple-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/procurement/ms2/pengiriman')}
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
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-4">
                        <motion.div
                            className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30"
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                        >
                            <Truck className="w-7 h-7 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
                                Ajukan Pengiriman
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Pilih produk dan jam kerja untuk pengiriman
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Date Picker */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />
                    <div className="relative z-10 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                            Tanggal Pengiriman
                        </h2>
                        <input
                            type="date"
                            value={tanggalPengiriman}
                            onChange={(e) => setTanggalPengiriman(e.target.value)}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                </motion.div>

                {/* Product Selection */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />
                    <div className="relative z-10 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-indigo-500" />
                            Pilih Produk untuk Dikirim ({selectedItems.size} dipilih)
                        </h2>

                        {produkList.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Tidak ada produk yang tersedia untuk dikirim</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {produkList.map((item, index) => {
                                    const isSelected = selectedItems.has(item.detailRencanaPembelianId);
                                    const selectedItem = selectedItems.get(item.detailRencanaPembelianId);

                                    return (
                                        <motion.div
                                            key={item.detailRencanaPembelianId}
                                            className={`p-4 rounded-xl border transition-all ${isSelected
                                                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600'
                                                : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                                                }`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.05 * index }}
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                                {/* Product Info & Toggle */}
                                                <div className="flex items-center gap-3 flex-1">
                                                    <motion.button
                                                        onClick={() => toggleItem(item)}
                                                        className={`p-2 rounded-lg transition-all ${isSelected
                                                            ? 'bg-indigo-500 text-white'
                                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                                                            }`}
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                    >
                                                        {isSelected ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                    </motion.button>

                                                    <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
                                                        <Droplet className="w-5 h-5 text-white" />
                                                    </div>

                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-slate-800 dark:text-white">
                                                            {item.namaProduk}
                                                        </h4>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                                            {item.kodePembelian} • {formatTanggal(item.tanggalPembelian)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Stock Info */}
                                                <div className="flex items-center gap-4">
                                                    <div className="text-center px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">Stok</p>
                                                        <p className="font-bold text-slate-800 dark:text-white">
                                                            {formatNumber(item.jumlah)} L
                                                        </p>
                                                    </div>

                                                    {/* Jam Kerja Select - Only show when selected */}
                                                    <AnimatePresence>
                                                        {isSelected && (
                                                            <motion.div
                                                                initial={{ opacity: 0, width: 0 }}
                                                                animate={{ opacity: 1, width: 'auto' }}
                                                                exit={{ opacity: 0, width: 0 }}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <Clock className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                                                <select
                                                                    value={selectedItem?.jamKerjaId || 0}
                                                                    onChange={(e) => updateJamKerja(item.detailRencanaPembelianId, Number(e.target.value))}
                                                                    className="px-3 py-2 bg-white dark:bg-slate-700 border border-indigo-300 dark:border-indigo-600 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none min-w-[150px]"
                                                                >
                                                                    <option value={0}>Pilih Jam Kerja</option>
                                                                    {jamKerjaList.map((jk) => (
                                                                        <option key={jk.jamKerjaId} value={jk.jamKerjaId}>
                                                                            {jk.namaJamKerja}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Summary */}
                {selectedItems.size > 0 && (
                    <motion.div
                        className="relative overflow-hidden rounded-2xl border border-indigo-200/50 dark:border-indigo-700/50 mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/20 dark:to-purple-900/20 backdrop-blur-md" />
                        <div className="relative z-10 p-6">
                            <h2 className="text-lg font-semibold text-indigo-800 dark:text-indigo-300 mb-4">
                                Ringkasan Pengiriman
                            </h2>
                            <div className="space-y-2">
                                {Array.from(selectedItems.values()).map((item) => {
                                    const jamKerja = jamKerjaList.find(jk => jk.jamKerjaId === item.jamKerjaId);
                                    return (
                                        <div key={item.detailRencanaPembelianId} className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Droplet className="w-4 h-4 text-cyan-500" />
                                                <span className="font-medium text-slate-800 dark:text-white">{item.namaProduk}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-slate-600 dark:text-slate-400">{formatNumber(item.jumlah)} L</span>
                                                <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg">
                                                    {jamKerja?.namaJamKerja || 'Belum dipilih'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* SMS Code Card */}
                {selectedItems.size > 0 && (
                    <motion.div
                        className="relative overflow-hidden rounded-2xl border border-green-200/50 dark:border-green-700/50 mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 backdrop-blur-md" />
                        <div className="relative z-10 p-6">
                            <h2 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                Kode SMS Pertamina
                            </h2>
                            <div className="space-y-6">
                                {getUniqueProdukIds().map((produkId) => {
                                    const items = Array.from(selectedItems.values()).filter(i => i.produkId === produkId);
                                    if (items.length === 0) return null;
                                    const namaProduk = items[0].namaProduk;
                                    const kode = getKodeProduk(namaProduk);
                                    const form = smsFormData.get(produkId) || { sisaStok: '', loTersedia: '', penerimaanTerakhir: '' };
                                    const totalJumlah = getTotalJumlahForProduk(produkId);
                                    const stokKL = Math.round(totalJumlah / 1000);
                                    const ritase = calculateRitase(totalJumlah);

                                    return (
                                        <div key={produkId} className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-green-200 dark:border-green-700">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Droplet className="w-5 h-5 text-cyan-500" />
                                                <h3 className="font-semibold text-slate-800 dark:text-white">{namaProduk}</h3>
                                                <span className="px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 text-xs rounded-lg">
                                                    {kode}
                                                </span>
                                                <span className="text-sm text-slate-500 dark:text-slate-400 ml-auto">
                                                    {formatNumber(totalJumlah)} L ({stokKL} KL) • {ritase} Ritase
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Sisa Stok (KL)</label>
                                                    <input
                                                        type="number"
                                                        value={form.sisaStok}
                                                        onChange={(e) => updateSmsForm(produkId, 'sisaStok', e.target.value)}
                                                        placeholder="0"
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">LO Tersedia</label>
                                                    <input
                                                        type="number"
                                                        value={form.loTersedia}
                                                        onChange={(e) => updateSmsForm(produkId, 'loTersedia', e.target.value)}
                                                        placeholder="0"
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Penerimaan Terakhir</label>
                                                    <input
                                                        type="number"
                                                        value={form.penerimaanTerakhir}
                                                        onChange={(e) => updateSmsForm(produkId, 'penerimaanTerakhir', e.target.value)}
                                                        placeholder="0"
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-lg border border-green-300 dark:border-green-600">
                                                <code className="flex-1 text-sm font-mono text-green-800 dark:text-green-200 break-all">
                                                    {generateSmsCode(produkId)}
                                                </code>
                                                <motion.button
                                                    onClick={() => copyToClipboard(produkId)}
                                                    className={`p-2 rounded-lg transition-all ${copiedId === produkId ? 'bg-green-500 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-green-900/50'}`}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    {copiedId === produkId ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                </motion.button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                    className="flex flex-col sm:flex-row gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <motion.button
                        onClick={handleSubmit}
                        disabled={selectedItems.size === 0 || isSubmitting || isWritePending || Array.from(selectedItems.values()).some(item => item.jamKerjaId === 0)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: selectedItems.size === 0 ? 1 : 1.02, y: selectedItems.size === 0 ? 0 : -2 }}
                        whileTap={{ scale: selectedItems.size === 0 ? 1 : 0.98 }}
                    >
                        {isSubmitting || isWritePending ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Memproses...
                            </>
                        ) : (
                            <>
                                <Truck className="w-5 h-5" />
                                Ajukan Pengiriman ({selectedItems.size})
                            </>
                        )}
                    </motion.button>

                    <motion.button
                        onClick={() => navigate('/procurement/ms2/pengiriman')}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Batal
                    </motion.button>
                </motion.div>
            </div>

            {/* Success Modal */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden p-8 text-center"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        >
                            <motion.div
                                className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.1 }}
                            >
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </motion.div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                Pengiriman Berhasil Diajukan!
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Mengarahkan ke daftar pengiriman...
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
