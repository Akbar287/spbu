'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import {
    FileImage, ArrowLeft, Plus, Eye, Hash, Clock,
    AlertCircle, Loader2, Download, Image, FileText, Package
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { getIPFSUrl } from '@/config/ipfs';

// Blockchain Interface
interface BlockchainFileLampiran {
    fileLampiranFileLoId: bigint;
    fileLoId: bigint;
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
interface FileLampiranDisplay {
    fileLampiranId: number;
    fileLoId: number;
    ipfsHash: string;
    namaFile: string;
    namaDokumen: string;
    mimeType: string;
    fileSize: number;
    createdAt: Date;
    updatedAt: Date;
}

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
} as const;

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
} as const;

// Format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file icon based on mime type
const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    return FileText;
};

export default function LampiranIndex() {
    const navigate = useNavigate();
    const { pengirimanId, fileLoId } = useParams<{ pengirimanId: string; fileLoId: string }>();

    // Fetch FileLampiran list
    const { data: filesResponse, isLoading, error } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getFileLampiranByFileLo',
        args: fileLoId ? [BigInt(fileLoId)] : undefined,
        query: {
            enabled: !!fileLoId,
        },
    });

    // Process data
    const filesList = useMemo(() => {
        if (!filesResponse) return [];

        const response = filesResponse as BlockchainFileLampiran[];
        return response
            .filter(f => !f.deleted && Number(f.fileLampiranFileLoId) > 0)
            .map((f): FileLampiranDisplay => ({
                fileLampiranId: Number(f.fileLampiranFileLoId),
                fileLoId: Number(f.fileLoId),
                ipfsHash: f.ipfsHash,
                namaFile: f.namaFile,
                namaDokumen: f.namaDokumen,
                mimeType: f.mimeType,
                fileSize: Number(f.fileSize),
                createdAt: new Date(Number(f.createdAt) * 1000),
                updatedAt: new Date(Number(f.updatedAt) * 1000),
            }));
    }, [filesResponse]);

    // Format datetime
    const formatDateTime = (date: Date) => {
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-teal-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat file lampiran...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-teal-100/80 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-teal-400/20 to-cyan-400/20 dark:from-teal-600/30 dark:to-cyan-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-emerald-400/15 to-green-400/15 dark:from-emerald-500/20 dark:to-green-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate(`/procurement/pengiriman/${pengirimanId}/file_lo/${fileLoId}`)}
                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke File LO
                </motion.button>

                {/* Header Section */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <motion.h1
                                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent flex items-center gap-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <motion.div
                                    className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-lg shadow-teal-500/30"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <FileImage className="w-7 h-7 text-white" />
                                </motion.div>
                                File Lampiran
                            </motion.h1>
                            <motion.div
                                className="flex items-center gap-2 mt-2 text-slate-500 dark:text-slate-400"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Package className="w-4 h-4" />
                                <span>File LO ID: {fileLoId}</span>
                                <span className="text-slate-300 dark:text-slate-600">|</span>
                                <span>{filesList.length} file</span>
                            </motion.div>
                        </div>

                        {/* Add Button */}
                        <motion.button
                            onClick={() => navigate(`/procurement/pengiriman/${pengirimanId}/file_lo/${fileLoId}/lampiran/create`)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold rounded-2xl shadow-lg shadow-teal-500/30 transition-all"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Plus className="w-5 h-5" />
                            Upload File
                        </motion.button>
                    </div>
                </motion.div>

                {/* Files Grid */}
                {filesList.length === 0 ? (
                    <motion.div
                        className="flex flex-col items-center justify-center h-64 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-full mb-4">
                            <FileImage className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Belum Ada File Lampiran
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                            Upload file gambar atau dokumen lampiran untuk File LO ini.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {filesList.map((file) => {
                            const FileIcon = getFileIcon(file.mimeType);
                            const isImage = file.mimeType.startsWith('image/');

                            return (
                                <motion.div
                                    key={file.fileLampiranId}
                                    variants={cardVariants}
                                    className="group relative"
                                >
                                    <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
                                        {/* Preview Area */}
                                        <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 overflow-hidden">
                                            {isImage ? (
                                                <img
                                                    src={getIPFSUrl(file.ipfsHash)}
                                                    alt={file.namaDokumen}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = '';
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <FileIcon className="w-16 h-16 text-slate-400" />
                                                </div>
                                            )}

                                            {/* ID Badge */}
                                            <motion.div
                                                className="absolute top-3 right-3 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full border border-white/30"
                                                whileHover={{ scale: 1.1 }}
                                            >
                                                <span className="text-sm font-bold text-white flex items-center gap-1.5 drop-shadow-lg">
                                                    <Hash className="w-3.5 h-3.5" />
                                                    {file.fileLampiranId}
                                                </span>
                                            </motion.div>

                                            {/* File Type Badge */}
                                            <div className="absolute bottom-3 left-3 px-2 py-1 bg-teal-500/90 rounded-lg">
                                                <span className="text-xs font-bold text-white uppercase">
                                                    {file.mimeType.split('/')[1]}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5">
                                            <h3 className="font-semibold text-slate-700 dark:text-slate-200 truncate mb-1">
                                                {file.namaDokumen}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate mb-3">
                                                {file.namaFile}
                                            </p>

                                            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-4">
                                                <span>{formatFileSize(file.fileSize)}</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatDateTime(file.createdAt)}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                <motion.button
                                                    onClick={() => navigate(`/procurement/pengiriman/${pengirimanId}/file_lo/${fileLoId}/lampiran/${file.fileLampiranId}`)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 dark:from-teal-500/40 dark:to-cyan-500/40 text-teal-600 dark:text-teal-200 font-medium rounded-xl hover:from-teal-500/20 hover:to-cyan-500/20 transition-all border border-teal-200/50 dark:border-teal-400/50 cursor-pointer"
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Lihat
                                                </motion.button>
                                                <motion.a
                                                    href={getIPFSUrl(file.ipfsHash)}
                                                    download={file.namaFile}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2.5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-600/40 dark:to-cyan-600/40 text-blue-600 dark:text-cyan-200 rounded-xl border border-blue-200/50 dark:border-cyan-400/50 hover:shadow-lg transition-all"
                                                    whileHover={{ scale: 1.15 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </motion.a>
                                            </div>
                                        </div>

                                        {/* Bottom Gradient Line */}
                                        <motion.div
                                            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500"
                                            initial={{ scaleX: 0, opacity: 0 }}
                                            whileHover={{ scaleX: 1, opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                            style={{ originX: 0 }}
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
