'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    ArrowLeft, Calendar, Building2, User,
    AlertCircle, Loader2, Droplet, FileText, Info,
    Receipt, Percent, DollarSign, Calculator, CheckCircle,
    Upload, Hash, Edit3, Paperclip, X, FileCheck
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { uploadToIPFS, getIPFSUrl } from '@/config/ipfs';

// Blockchain interfaces - matches FileLoDetailId struct from ViewStructs.sol
interface BlockchainFileLoDetailProduk {
    detailRencanaPembelianId: bigint;
    produkId: bigint;
    namaProduk: string;
    harga: bigint;
    jumlah: bigint;
    subTotal: bigint;
    satuanJumlah: string;
}

interface BlockchainFileLoDetailPembayaran {
    pembayaranId: bigint;
    rencanaPembelianId: bigint;
    walletMember: string;
    noCekBg: string;
    noRekening: string;
    namaRekening: string;
    namaBank: string;
    totalBayar: bigint;
}

// Matches FileLoDetailId struct from ViewStructs.sol
interface BlockchainFileLoDetail {
    fileLoId: bigint;
    detailRencanaPembelianId: bigint;
    pengirimanId: bigint;
    rencanaPembelianId: bigint;
    namaSpbu: string;
    walletMember: string;
    tanggalPembelian: bigint;
    kodePembelian: string;
    deskripsi: string;
    grandTotal: bigint; // scaled x100
    ppn: bigint;
    ppbkb: bigint;
    pph: bigint;
    jumlah: bigint; // scaled x100
    satuanJumlah: string;
    noFaktur: string;
    noLo: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
    ipfsHash: string;
    produkList: BlockchainFileLoDetailProduk[];
    pembayaranList: BlockchainFileLoDetailPembayaran[];
}

// Display interfaces
interface ProdukItem {
    detailRencanaPembelianId: number;
    namaProduk: string;
    harga: number;
    jumlah: number;
    subTotal: number;
    satuanJumlah: string;
    isHighlighted: boolean;
}

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

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
};

const shortenAddress = (address: string): string => {
    if (!address || address === '0x0000000000000000000000000000000000000000') return '-';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default function FileLoShow() {
    const navigate = useNavigate();
    const { pengirimanId, fileLoId } = useParams<{ pengirimanId: string, fileLoId: string }>();

    const pengirimanIdNumber = pengirimanId ? parseInt(pengirimanId, 10) : 0;
    const fileLoIdNumber = fileLoId ? parseInt(fileLoId, 10) : 0;
    const isValidFileLoId = !isNaN(fileLoIdNumber) && fileLoIdNumber > 0;

    // Form state for File LO
    const [noFaktur, setNoFaktur] = useState('');
    const [noLo, setNoLo] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'saving' | 'success' | 'error'>('idle');
    const [isEditMode, setIsEditMode] = useState(false); // Form lock state
    const [errorPopup, setErrorPopup] = useState<string | null>(null); // Error popup message
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                setErrorPopup('Ukuran file maksimal 5MB');
                return;
            }
            // Validate file type
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                setErrorPopup('Format file harus PDF, JPG, atau PNG');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle drag events for file upload
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            // Validate file
            if (file.size > 5 * 1024 * 1024) {
                setErrorPopup('Ukuran file maksimal 5MB');
                return;
            }
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                setErrorPopup('Format file harus PDF, JPG, atau PNG');
                return;
            }
            setSelectedFile(file);
        }
    };

    // Fetch FileLo detail using fileLoId from URL
    const { data: detailResponse, isLoading, error, refetch } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getPengirimShowFileLo',
        args: isValidFileLoId ? [BigInt(fileLoIdNumber)] : undefined,
        query: { enabled: isValidFileLoId }
    });

    const detail = detailResponse as BlockchainFileLoDetail | undefined;
    const hasFileLo = isValidFileLoId && detail && Number(detail.fileLoId) > 0;

    // Fetch KTP for employee name
    const { data: ktpResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getKtpByWallet',
        args: [detail?.walletMember as `0x${string}`],
        query: { enabled: !!detail?.walletMember }
    });

    const ktp = ktpResponse as { ktpId: bigint; nama: string } | undefined;

    // FileLo data is now directly in detail (not an array of fileLo)
    // Populate form if existing data found (on first load only)
    const formInitializedRef = React.useRef(false);
    useEffect(() => {
        if (detail && hasFileLo && !formInitializedRef.current) {
            setNoFaktur(detail.noFaktur || '');
            setNoLo(detail.noLo || '');
            formInitializedRef.current = true;
        }
    }, [detail, hasFileLo]);

    // Convert to display format
    const produkList = useMemo((): ProdukItem[] => {
        if (!detail?.produkList) return [];
        return detail.produkList.map(item => ({
            detailRencanaPembelianId: Number(item.detailRencanaPembelianId),
            namaProduk: item.namaProduk,
            harga: Number(item.harga) / 100,
            jumlah: Number(item.jumlah),
            subTotal: Number(item.subTotal) / 100,
            satuanJumlah: item.satuanJumlah,
            isHighlighted: detail ? Number(detail.detailRencanaPembelianId) === Number(item.detailRencanaPembelianId) : false,
        }));
    }, [detail]);

    // Calculate financial summary
    // grandTotal from blockchain is the NET price (sum of product subtotals)
    // gross = net + ppn + ppbkb + pph
    const financialSummary = useMemo(() => {
        if (!detail) return { net: 0, ppn: 0, pph: 0, ppbkb: 0, gross: 0 };
        const net = Number(detail.grandTotal) / 100; // grandTotal is actually net price
        const ppn = Number(detail.ppn) / 100;
        const pph = Number(detail.pph) / 100;
        const ppbkb = Number(detail.ppbkb) / 100;
        const gross = net + ppn + ppbkb + pph; // gross = net + all taxes
        return { net, ppn, pph, ppbkb, gross };
    }, [detail]);

    // Write contract hook
    const { writeContractAsync } = useWriteContract();

    // Handle form submit - uses updateFileLo to update existing FileLo
    const handleSubmit = async () => {
        // Validate required fields
        if (!noFaktur || !noLo || !hasFileLo) return;

        // File is required - must have either selectedFile or existing ipfsHash
        const hasFile = selectedFile || (detail?.ipfsHash && detail.ipfsHash !== '');
        if (!hasFile) {
            setErrorPopup('File dokumen LO wajib diupload');
            return;
        }

        setIsSubmitting(true);
        setUploadStatus('idle');

        try {
            // 1. Upload file to IPFS if selected
            let ipfsCid: string = detail?.ipfsHash || '';
            if (selectedFile) {
                setUploadStatus('uploading');
                ipfsCid = await uploadToIPFS(selectedFile);
            }

            setUploadStatus('saving');

            // 2. Update FileLo on blockchain using updateFileLo
            await writeContractAsync({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'updateFileLo',
                args: [
                    BigInt(fileLoIdNumber),
                    ipfsCid,
                    noFaktur,
                    noLo
                ]
            });

            setUploadStatus('success');

            // Refresh the data to show the updated FileLo
            await refetch();

            // Reset file selection after successful update
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            // Lock form after successful save
            setIsEditMode(false);
        } catch (err: any) {
            console.error('Error updating File LO:', err);
            setUploadStatus('error');
            setErrorPopup(err.message || 'Terjadi kesalahan saat menyimpan File LO');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading state
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

    // Error or not found (only show error if we have a fileLo but can't load detail)
    if (hasFileLo && (error || !detail || detail.fileLoId === BigInt(0))) {
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
                            <AlertCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                            Data Tidak Ditemukan
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Data File LO dengan ID {fileLoId} tidak ditemukan atau telah dihapus.
                        </p>
                        <motion.button
                            onClick={() => navigate(`/procurement/pengiriman/${pengirimanId}`)}
                            className="mt-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-2xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Kembali ke Pengiriman
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-indigo-50/80 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-indigo-400/20 to-violet-400/20 dark:from-indigo-600/30 dark:to-violet-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-purple-400/15 to-pink-400/15 dark:from-purple-500/20 dark:to-pink-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate(`/procurement/pengiriman/${pengirimanId}`)}
                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Pengiriman
                </motion.button>

                {/* Header Section */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600" />
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
                    <div className="relative z-10 p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <FileText className="w-8 h-8 text-white" />
                                </motion.div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                                        {hasFileLo ? 'Detail File LO' : 'Buat File LO'}
                                    </h1>
                                    <p className="text-white/80 mt-1">
                                        {detail?.kodePembelian || `File LO ID: ${fileLoIdNumber}`}
                                    </p>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className={`px-4 py-2 rounded-full backdrop-blur-md border ${hasFileLo
                                ? 'bg-green-500/20 border-green-300/50 text-green-100'
                                : 'bg-yellow-500/20 border-yellow-300/50 text-yellow-100'
                                }`}>
                                <span className="flex items-center gap-2">
                                    {hasFileLo ? (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            File LO Tersimpan
                                        </>
                                    ) : (
                                        <>
                                            <Receipt className="w-4 h-4" />
                                            Menunggu Input
                                        </>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Show info if no FileLo yet */}
                {!hasFileLo && (
                    <motion.div
                        className="relative overflow-hidden rounded-2xl border border-yellow-200/50 dark:border-yellow-700/50 mb-6 p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="absolute inset-0 bg-yellow-50/60 dark:bg-yellow-900/20 backdrop-blur-md" />
                        <div className="relative z-10 flex items-start gap-4">
                            <div className="p-3 bg-yellow-100 dark:bg-yellow-800/50 rounded-xl">
                                <Info className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                                    File LO Belum Dibuat
                                </h3>
                                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                                    Silakan isi form di bawah untuk membuat File LO untuk detail rencana pembelian ini.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Informasi Umum Card - Only show if we have detail */}
                {detail && (
                    <motion.div
                        className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                        <div className="relative z-10 p-6">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <Info className="w-5 h-5 text-indigo-500" />
                                Informasi Umum
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* SPBU */}
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                        <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">SPBU</p>
                                        <p className="font-semibold text-slate-800 dark:text-white">
                                            {detail.namaSpbu || '-'}
                                        </p>
                                    </div>
                                </div>

                                {/* Kode Pembelian */}
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <Hash className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Kode Pembelian</p>
                                        <p className="font-semibold text-slate-800 dark:text-white">
                                            {detail.kodePembelian || '-'}
                                        </p>
                                    </div>
                                </div>

                                {/* Tanggal */}
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Tanggal Pembelian</p>
                                        <p className="font-semibold text-slate-800 dark:text-white">
                                            {detail.tanggalPembelian ? formatTanggal(new Date(Number(detail.tanggalPembelian) * 1000)) : '-'}
                                        </p>
                                    </div>
                                </div>

                                {/* Diajukan Oleh */}
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Diajukan Oleh</p>
                                        <p className="font-semibold text-slate-800 dark:text-white">
                                            {ktp?.nama || (detail.walletMember ? shortenAddress(detail.walletMember) : '-')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Deskripsi */}
                            {detail.deskripsi && (
                                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Deskripsi</p>
                                    <p className="text-slate-700 dark:text-slate-300">{detail.deskripsi}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Daftar Produk - Only show if we have detail */}
                {detail && (
                    <motion.div
                        className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                        <div className="relative z-10 p-6">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <Droplet className="w-5 h-5 text-indigo-500" />
                                Daftar Produk
                            </h2>

                            <div className="space-y-3">
                                {produkList.map((produk, index) => (
                                    <motion.div
                                        key={index}
                                        className={`p-4 rounded-xl border transition-all ${produk.isHighlighted
                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600'
                                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                                            }`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + index * 0.05 }}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${produk.isHighlighted
                                                    ? 'bg-indigo-100 dark:bg-indigo-800/50'
                                                    : 'bg-slate-100 dark:bg-slate-700/50'
                                                    }`}>
                                                    <Droplet className={`w-5 h-5 ${produk.isHighlighted
                                                        ? 'text-indigo-600 dark:text-indigo-400'
                                                        : 'text-slate-500 dark:text-slate-400'
                                                        }`} />
                                                </div>
                                                <div>
                                                    <p className={`font-semibold ${produk.isHighlighted
                                                        ? 'text-indigo-800 dark:text-indigo-200'
                                                        : 'text-slate-800 dark:text-white'
                                                        }`}>
                                                        {produk.namaProduk}
                                                        {produk.isHighlighted && (
                                                            <span className="ml-2 px-2 py-0.5 bg-indigo-500 text-white text-xs rounded-full">
                                                                Terpilih
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        {formatNumber(produk.jumlah)} {produk.satuanJumlah} × {formatCurrency(produk.harga)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold ${produk.isHighlighted
                                                    ? 'text-indigo-700 dark:text-indigo-300'
                                                    : 'text-slate-700 dark:text-slate-300'
                                                    }`}>
                                                    {formatCurrency(produk.subTotal)}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Financial Summary - Only show if we have detail */}
                {detail && (
                    <motion.div
                        className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                        <div className="relative z-10 p-6">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-indigo-500" />
                                Ringkasan Keuangan
                            </h2>

                            <div className="space-y-3">
                                {/* Net/Subtotal */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Subtotal</span>
                                    </div>
                                    <p className="font-bold text-slate-800 dark:text-white">
                                        {formatCurrency(financialSummary.net)}
                                    </p>
                                </div>

                                {/* PPN */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                            <Percent className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">PPN</span>
                                    </div>
                                    <p className="font-bold text-green-600 dark:text-green-400">
                                        {formatCurrency(financialSummary.ppn)}
                                    </p>
                                </div>

                                {/* PPBKB */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                            <Percent className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">PPBKB</span>
                                    </div>
                                    <p className="font-bold text-amber-600 dark:text-amber-400">
                                        {formatCurrency(financialSummary.ppbkb)}
                                    </p>
                                </div>

                                {/* PPH */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                            <Percent className="w-4 h-4 text-red-600 dark:text-red-400" />
                                        </div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">PPH</span>
                                    </div>
                                    <p className="font-bold text-red-600 dark:text-red-400">
                                        {formatCurrency(financialSummary.pph)}
                                    </p>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-slate-200 dark:border-slate-700" />

                                {/* Grand Total */}
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20 rounded-xl border border-indigo-200 dark:border-indigo-700">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                            <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Grand Total</span>
                                    </div>
                                    <p className="font-bold text-indigo-700 dark:text-indigo-300 text-xl">
                                        {formatCurrency(financialSummary.gross)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Form File LO Card */}
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                    <div className="relative z-10 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <FileCheck className="w-5 h-5 text-indigo-500" />
                            Form File Lorry Order (LO)
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* No Faktur */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    No. Faktur <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={noFaktur}
                                    onChange={(e) => setNoFaktur(e.target.value)}
                                    disabled={!isEditMode}
                                    placeholder="Masukkan nomor faktur"
                                    className={`w-full px-4 py-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-700 dark:text-slate-200 ${!isEditMode ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`}
                                />
                            </div>

                            {/* No LO */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    No. LO (Lorry Order) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={noLo}
                                    onChange={(e) => setNoLo(e.target.value)}
                                    disabled={!isEditMode}
                                    placeholder="Masukkan nomor LO"
                                    className={`w-full px-4 py-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-700 dark:text-slate-200 ${!isEditMode ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`}
                                />
                            </div>
                        </div>

                        {/* File Upload - show when hasFileLo and in edit mode */}
                        {hasFileLo && isEditMode && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Upload Dokumen LO <span className="text-red-500">*</span> {detail?.ipfsHash ? '(Ganti File)' : ''}
                                </label>
                                {selectedFile ? (
                                    <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-100 dark:bg-indigo-800/50 rounded-lg">
                                                <Paperclip className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-indigo-800 dark:text-indigo-200">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                                                    {(selectedFile.size / 1024).toFixed(2)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <motion.button
                                            onClick={handleRemoveFile}
                                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <X className="w-5 h-5" />
                                        </motion.button>
                                    </div>
                                ) : (
                                    <div
                                        className={`relative border-2 border-dashed rounded-xl transition-all ${dragActive
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                            : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10'}`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            onChange={handleFileChange}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        <div className="flex flex-col items-center justify-center p-8 cursor-pointer">
                                            <Upload className={`w-8 h-8 mb-2 ${dragActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {dragActive ? 'Lepaskan file di sini' : 'Drag & drop atau klik untuk upload file'}
                                            </p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                                PDF, JPG, PNG (Max 5MB)
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Show existing IPFS file if available */}
                        {hasFileLo && detail?.ipfsHash && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    File Terupload Saat Ini
                                </label>
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700">
                                    {/* Check if it's an image or PDF */}
                                    <a
                                        href={getIPFSUrl(detail.ipfsHash)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-indigo-100 dark:bg-indigo-800/50 rounded-lg">
                                                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-indigo-800 dark:text-indigo-200">
                                                    Dokumen Lorry Order
                                                </p>
                                                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                                                    Klik untuk melihat file
                                                </p>
                                            </div>
                                        </div>
                                        {/* Show image preview if IPFS hash exists */}
                                        <img
                                            src={getIPFSUrl(detail.ipfsHash)}
                                            alt="File LO Preview"
                                            className="w-full max-h-48 object-contain rounded-lg border border-indigo-200 dark:border-indigo-700"
                                            onError={(e) => {
                                                // Hide image if it fails to load (might be PDF)
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Edit/Save Button */}
                        {hasFileLo && (
                            <div className="mt-6 flex flex-col gap-3">
                                {!isEditMode ? (
                                    // Show Edit Button when form is locked
                                    <motion.button
                                        onClick={() => {
                                            setIsEditMode(true);
                                            setUploadStatus('idle');
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Edit3 className="w-5 h-5" />
                                        Edit Data
                                    </motion.button>
                                ) : (
                                    // Show Save Button when form is unlocked
                                    <motion.button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || !noFaktur || !noLo || (!selectedFile && !detail?.ipfsHash)}
                                        className={`w-full flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-2xl transition-all shadow-lg ${uploadStatus === 'success'
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/30'
                                            : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-500/30'
                                            } disabled:opacity-70 disabled:cursor-not-allowed`}
                                        whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                                        whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                                    >
                                        {uploadStatus === 'uploading' ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Mengupload ke IPFS...
                                            </>
                                        ) : uploadStatus === 'saving' ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Menyimpan ke Blockchain...
                                            </>
                                        ) : uploadStatus === 'success' ? (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                Berhasil Disimpan!
                                            </>
                                        ) : uploadStatus === 'error' ? (
                                            <>
                                                <AlertCircle className="w-5 h-5" />
                                                Gagal, Coba Lagi
                                            </>
                                        ) : (
                                            <>
                                                <FileCheck className="w-5 h-5" />
                                                Simpan Perubahan
                                            </>
                                        )}
                                    </motion.button>
                                )}

                                {/* Show saved indicator when not in edit mode and has data */}
                                {!isEditMode && uploadStatus === 'success' && (
                                    <motion.div
                                        className="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        <span className="text-sm font-medium text-green-700 dark:text-green-300">Data berhasil disimpan</span>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {/* Link to Lampiran */}
                        {hasFileLo && (
                            <motion.button
                                onClick={() => navigate(`/procurement/pengiriman/${pengirimanId}/file_lo/${fileLoId}/lampiran`)}
                                className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/30 transition-all"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Paperclip className="w-5 h-5" />
                                Kelola File Lampiran
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Error Popup Modal */}
            <AnimatePresence>
                {errorPopup && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setErrorPopup(null)}
                    >
                        <motion.div
                            className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 text-center">
                                <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                                    <AlertCircle className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                    Terjadi Kesalahan
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    {errorPopup}
                                </p>
                                <motion.button
                                    onClick={() => setErrorPopup(null)}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold rounded-2xl shadow-lg shadow-red-500/30 transition-all"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <X className="w-5 h-5 inline-block mr-2" />
                                    Tutup
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
