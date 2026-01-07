'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    FileImage, ArrowLeft, Trash2, Hash, FileText, Clock,
    AlertCircle, Loader2, Download, Image, Wallet, ExternalLink
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { getIPFSUrl, unpinFromIPFS } from '@/config/ipfs';

// Blockchain Interfaces
interface BlockchainFilePembayaran {
    filePembayaranId: bigint;
    pembayaranId: bigint;
    ipfsHash: string;
    namaFile: string;
    namaDokumen: string;
    mimeType: string;
    fileSize: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// Display Interface
interface FilePembayaranDisplay {
    filePembayaranId: number;
    pembayaranId: number;
    ipfsHash: string;
    namaFile: string;
    namaDokumen: string;
    mimeType: string;
    fileSize: number;
    createdAt: Date;
    updatedAt: Date;
}

// Format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format datetime
const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Get file icon based on mime type
const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    return FileText;
};

export default function FilePembayaranShow() {
    const navigate = useNavigate();
    const { rencanaId, pembayaranId, filePembayaranId } = useParams<{ rencanaId: string; pembayaranId: string; filePembayaranId: string }>();
    const fileId = filePembayaranId ? parseInt(filePembayaranId, 10) : 0;
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch all files for this pembayaran and find the specific one
    const { data: filesData, isLoading, error } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getFilePembayaranByPembayaran',
        args: pembayaranId ? [BigInt(pembayaranId)] : undefined,
        query: { enabled: !!pembayaranId },
    });

    // Write Contract Hook
    const { writeContract, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle delete success
    useEffect(() => {
        if (isWriteSuccess) {
            setIsDeleting(false);
            navigate(`/procurement/pembayaran/${rencanaId}/bayar/${pembayaranId}/file`);
        }
    }, [isWriteSuccess, navigate, rencanaId, pembayaranId]);

    // Process data - find the specific file
    const fileData = useMemo((): FilePembayaranDisplay | null => {
        if (!filesData) return null;
        const rawFiles = filesData as BlockchainFilePembayaran[];
        const found = rawFiles.find(f => Number(f.filePembayaranId) === fileId && !f.deleted);
        if (!found) return null;

        return {
            filePembayaranId: Number(found.filePembayaranId),
            pembayaranId: Number(found.pembayaranId),
            ipfsHash: found.ipfsHash,
            namaFile: found.namaFile,
            namaDokumen: found.namaDokumen,
            mimeType: found.mimeType,
            fileSize: Number(found.fileSize),
            createdAt: new Date(Number(found.createdAt) * 1000),
            updatedAt: new Date(Number(found.updatedAt) * 1000),
        };
    }, [filesData, fileId]);

    const notFound = !isLoading && !error && !fileData;
    const isImage = fileData?.mimeType.startsWith('image/');
    const FileIcon = fileData ? getFileIcon(fileData.mimeType) : FileText;

    const handleDelete = async () => {
        if (!filePembayaranId) return;
        setIsDeleting(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'deleteFilePembayaran',
                args: [BigInt(filePembayaranId)],
            });
            if (fileData) {
                await unpinFromIPFS(fileData.ipfsHash);
            }
        } catch (error) {
            console.error('Error deleting:', error);
            setIsDeleting(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat detail file...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Not found state
    if (notFound) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4 text-center p-8"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">File Tidak Ditemukan</h2>
                        <p className="text-slate-600 dark:text-slate-400">Data File dengan ID {filePembayaranId} tidak ditemukan.</p>
                        <motion.button
                            onClick={() => navigate(`/procurement/pembayaran/${rencanaId}/bayar/${pembayaranId}/file`)}
                            className="mt-4 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-2xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Kembali ke Daftar File
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-emerald-100/80 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-emerald-400/20 to-teal-400/20 dark:from-emerald-600/30 dark:to-teal-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate(`/procurement/pembayaran/${rencanaId}/bayar/${pembayaranId}/file`)}
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
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <motion.div
                                className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/30"
                                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <FileImage className="w-8 h-8 text-white" />
                            </motion.div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                    Detail File
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">
                                    {fileData?.namaDokumen}
                                </p>
                            </div>
                        </div>
                        {/* Delete Button */}
                        <motion.button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium rounded-xl shadow-lg shadow-red-500/30"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Trash2 className="w-4 h-4" />
                            Hapus
                        </motion.button>
                    </div>
                </motion.div>

                {/* Preview Card */}
                <motion.div
                    className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />
                    <div className="relative z-10 p-6">
                        {/* File Preview */}
                        <div className="relative h-64 md:h-80 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-2xl overflow-hidden mb-6">
                            {isImage ? (
                                <img
                                    src={getIPFSUrl(fileData!.ipfsHash)}
                                    alt={fileData!.namaDokumen}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    <FileIcon className="w-20 h-20 text-slate-400 mb-4" />
                                    <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
                                        {fileData?.mimeType.split('/')[1].toUpperCase()}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                            <motion.a
                                href={getIPFSUrl(fileData!.ipfsHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/30"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <ExternalLink className="w-5 h-5" />
                                Buka di Tab Baru
                            </motion.a>
                            <motion.a
                                href={getIPFSUrl(fileData!.ipfsHash)}
                                download={fileData!.namaFile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Download className="w-5 h-5" />
                                Download
                            </motion.a>
                        </div>
                    </div>
                </motion.div>

                {/* Detail Card */}
                <motion.div
                    className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />
                    <div className="relative z-10 p-6 space-y-4">
                        {[
                            { label: 'ID File', value: fileData?.filePembayaranId.toString(), icon: Hash, color: 'emerald' },
                            { label: 'Nama Dokumen', value: fileData?.namaDokumen, icon: FileText, color: 'teal' },
                            { label: 'Nama File Asli', value: fileData?.namaFile, icon: FileImage, color: 'cyan' },
                            { label: 'Tipe File', value: fileData?.mimeType, icon: FileText, color: 'blue' },
                            { label: 'Ukuran', value: formatFileSize(fileData?.fileSize || 0), icon: Wallet, color: 'green' },
                            { label: 'IPFS CID', value: fileData?.ipfsHash, icon: Hash, color: 'purple' },
                            { label: 'Tanggal Upload', value: formatDateTime(fileData?.createdAt || new Date()), icon: Clock, color: 'slate' },
                            { label: 'Terakhir Diperbarui', value: formatDateTime(fileData?.updatedAt || new Date()), icon: Clock, color: 'gray' },
                        ].map((item, index) => (
                            <motion.div
                                key={item.label}
                                className="flex items-start gap-4 p-4 bg-white/50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700/50"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + index * 0.05 }}
                            >
                                <div className={`p-3 bg-${item.color}-100 dark:bg-${item.color}-900/30 rounded-xl`}>
                                    <item.icon className={`w-5 h-5 text-${item.color}-600 dark:text-${item.color}-400`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                                        {item.label}
                                    </p>
                                    <p className="mt-1 text-lg font-semibold text-slate-700 dark:text-slate-200 break-all">
                                        {item.value}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowDeleteModal(false)}
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
                                    <Trash2 className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                    Hapus File?
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Apakah Anda yakin ingin menghapus <strong>{fileData?.namaDokumen}</strong>? Tindakan ini tidak dapat dibatalkan.
                                </p>
                                <div className="flex gap-3">
                                    <motion.button
                                        onClick={() => setShowDeleteModal(false)}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Batal
                                    </motion.button>
                                    <motion.button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-2xl disabled:opacity-70"
                                        whileHover={{ scale: isDeleting ? 1 : 1.02 }}
                                        whileTap={{ scale: isDeleting ? 1 : 0.98 }}
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Menghapus...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4" />
                                                Hapus
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
