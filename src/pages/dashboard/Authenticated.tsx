'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAccount, useReadContract } from '@/services/blockchain/wagmi';
import {
    LayoutDashboard, Receipt, TrendingUp, Fuel, Users, Truck,
    ChevronRight, Sparkles, CreditCard, Search, X, ChevronDown,
    Shield,
    RefreshCw
} from 'lucide-react';
import {
    DIAMOND_ADDRESS,
    DIAMOND_ABI,
} from '../../contracts/config';
import { RoleType, MenuCategory, MenuItem } from '../../types/dashboard';
import {
    allMenuCategories,
    roleMenuAccess,
    roleItemAccess,
    roleNames,
    mapJabatanToRole
} from '../../config/menu';
import { Ktp, Jabatan } from '../../types/contracts';

export default function Authenticated() {
    const navigate = useNavigate();
    const { address, isConnected } = useAccount();
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedJabatanIndex, setSelectedJabatanIndex] = useState<number>(0);
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState<boolean>(false);

    // Fetch KTP data from Diamond (IdentityMemberFacet)
    const { data: ktpData, isLoading: isLoadingKtp, error: ktpError } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getKtpByWallet',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address && isConnected,
        },
    });

    // Fetch Jabatan data from Diamond (OrganizationFacet)
    const { data: jabatanData, isLoading: isLoadingJabatan } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getJabatansByWallet',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address && isConnected,
        },
    });

    // Extract user name from KTP data
    const userName = useMemo(() => {
        if (ktpData && typeof ktpData === 'object' && 'nama' in ktpData) {
            return (ktpData as Ktp).nama || 'Pengguna';
        }
        return 'Pengguna';
    }, [ktpData]);

    // Get list of jabatan (roles) for this wallet
    const jabatanList = useMemo((): Jabatan[] => {
        if (jabatanData && Array.isArray(jabatanData)) {
            return (jabatanData as Jabatan[]).filter(j => !j.deleted);
        }
        return [];
    }, [jabatanData]);
    // Restore selected role from localStorage when list changes
    useEffect(() => {
        if (jabatanList.length > 0) {
            const storedJabatanId = localStorage.getItem('selectedJabatanId');
            if (storedJabatanId) {
                const index = jabatanList.findIndex(j => j.jabatanId.toString() === storedJabatanId);
                if (index !== -1) {
                    setSelectedJabatanIndex(index);
                }
            }
        }
    }, [jabatanList]);


    // Has multiple roles?
    const hasMultipleRoles = jabatanList.length > 1;

    // Currently selected jabatan
    const selectedJabatan = useMemo((): Jabatan | null => {
        if (jabatanList.length > 0 && selectedJabatanIndex < jabatanList.length) {
            return jabatanList[selectedJabatanIndex];
        }
        return null;
    }, [jabatanList, selectedJabatanIndex]);

    // Extract role from selected jabatan
    const currentRole = useMemo((): RoleType => {
        if (selectedJabatan) {
            return mapJabatanToRole(selectedJabatan.namaJabatan);
        }
        // Default to admin for development/testing
        return 'admin';
    }, [selectedJabatan]);

    // Loading state
    const isLoading = isLoadingKtp || isLoadingJabatan;

    // Check if wallet is unauthorized (not registered in KTP)
    const isUnauthorized = useMemo(() => {
        // Still loading, don't decide yet
        if (isLoading) return false;

        // If there's an error fetching KTP, might be unauthorized
        if (ktpError) return true;

        // If no KTP data, unauthorized
        if (!ktpData) return true;

        // If ktpId is 0 or nama is empty, wallet not registered
        if (typeof ktpData === 'object' && 'ktpId' in ktpData) {
            const ktp = ktpData as Ktp;
            if (Number(ktp.ktpId) === 0 || !ktp.nama || ktp.nama.trim() === '') {
                return true;
            }
        }

        return false;
    }, [isLoading, ktpError, ktpData]);

    // Generate filtered menus based on role
    const filteredMenus = useMemo(() => {
        const categoryAccess = roleMenuAccess[currentRole];
        const itemAccess = roleItemAccess[currentRole];

        // For roles with category-level access
        if (categoryAccess.length > 0 && itemAccess.length === 0) {
            return allMenuCategories.filter(cat => categoryAccess.includes(cat.id));
        }

        // For roles with item-level access only
        if (itemAccess.length > 0) {
            const result: MenuCategory[] = [];

            // Add artikel category if accessible
            if (categoryAccess.includes('artikel')) {
                const artikelCat = allMenuCategories.find(c => c.id === 'artikel');
                if (artikelCat) result.push(artikelCat);
            }

            // Create custom categories from item access
            const accessibleItems: MenuItem[] = [];
            allMenuCategories.forEach(cat => {
                cat.items.forEach(item => {
                    if (itemAccess.includes(item.id)) {
                        accessibleItems.push(item);
                    }
                });
            });

            if (accessibleItems.length > 0) {
                result.unshift({
                    id: 'akses-menu',
                    title: 'Menu Akses',
                    description: 'Menu yang dapat Anda akses berdasarkan jabatan',
                    icon: LayoutDashboard,
                    color: 'from-violet-500 to-purple-600',
                    items: accessibleItems,
                });
            }

            return result;
        }

        return [];
    }, [currentRole]);

    // Filter menus based on search query
    const searchFilteredMenus = useMemo(() => {
        if (!searchQuery.trim()) return filteredMenus;

        const query = searchQuery.toLowerCase().trim();

        return filteredMenus.map(category => {
            const filteredItems = category.items.filter(item =>
                item.title.toLowerCase().includes(query) ||
                item.id.toLowerCase().includes(query)
            );

            return { ...category, items: filteredItems };
        }).filter(category => category.items.length > 0);
    }, [filteredMenus, searchQuery]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 },
        },
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: 'spring' as const, stiffness: 100, damping: 15 },
        },
    };

    // Unauthorized screen - wallet not registered in system
    if (isUnauthorized) {
        return (
            <div className="min-h-screen overflow-hidden pt-20 relative">
                {/* Background */}
                <div className="absolute inset-0 bg-purple-100/80 dark:bg-slate-900" />

                {/* Animated Background Gradients */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <motion.div
                        className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-violet-400/20 to-indigo-400/20 dark:from-violet-600/30 dark:to-indigo-600/30 blur-3xl"
                        animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-cyan-400/15 to-emerald-400/15 dark:from-cyan-500/20 dark:to-emerald-500/20 blur-3xl"
                        animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-pink-400/15 to-rose-400/15 dark:from-pink-500/20 dark:to-rose-500/20 blur-3xl"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                    />
                </div>

                <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-lg w-full text-center"
                    >
                        {/* Icon */}
                        <motion.div
                            className="mx-auto w-24 h-24 mb-6 relative"
                            animate={{
                                rotate: [0, 5, -5, 0],
                                scale: [1, 1.05, 1],
                            }}
                            transition={{ duration: 4, repeat: Infinity }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl shadow-lg shadow-red-500/30" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Shield className="w-12 h-12 text-white" />
                            </div>
                        </motion.div>

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl font-bold text-red-400 dark:text-white mb-4">
                            Akses Tidak Diizinkan
                        </h1>

                        {/* Message */}
                        <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
                            Anda perlu izin dari Admin untuk akses aplikasi ini.
                        </p>

                        {/* Wallet Info */}
                        <div className="bg-gray-500/10 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/20">
                            <p className="text-sm text-gray-700 dark:text-gray-400 mb-2">Wallet Anda</p>
                            <p className="font-mono text-gray-700 dark:text-white text-sm break-all">
                                {address}
                            </p>
                        </div>

                        {/* Help text */}
                        <p className="text-sm text-gray-700 dark:text-gray-400 mb-8">
                            Hubungi administrator sistem untuk mendaftarkan wallet Anda ke dalam sistem.
                        </p>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <motion.button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-gray-500/10 dark:bg-white/10 hover:bg-white/20 text-gray-700 dark:text-white font-medium rounded-xl border border-white/20 transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <RefreshCw className="w-4 h-4 inline-block mr-2" />
                                Coba Lagi
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen overflow-hidden pt-20">
            {/* Animated Gradient Background */}
            <div className="fixed inset-0">
                {/* Base animated gradient */}
                <motion.div
                    className="absolute inset-0"
                    animate={{
                        background: [
                            'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #6B8DD6 50%, #8E37D7 75%, #667eea 100%)',
                            'linear-gradient(135deg, #11998e 0%, #38ef7d 25%, #667eea 50%, #764ba2 75%, #11998e 100%)',
                            'linear-gradient(135deg, #764ba2 0%, #667eea 25%, #38ef7d 50%, #11998e 75%, #764ba2 100%)',
                            'linear-gradient(135deg, #38ef7d 0%, #11998e 25%, #764ba2 50%, #667eea 75%, #38ef7d 100%)',
                            'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #6B8DD6 50%, #8E37D7 75%, #667eea 100%)',
                        ],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                />

                {/* Light mode overlay - makes colors softer/pastel */}
                <div className="absolute inset-0 bg-white/50 dark:bg-transparent" />

                {/* Dark overlay for dark mode */}
                <div className="absolute inset-0 bg-transparent dark:bg-black/60" />

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(255, 255, 255, 0.3) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px',
                    }}
                />

                {/* Large animated gradient orbs - Green & Purple (reduced to 2) */}
                <motion.div
                    className="absolute -top-1/4 -left-1/4 w-[900px] h-[900px] rounded-full blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 60%)' }}
                    animate={{ x: [0, 150, 0], y: [0, 80, 0], scale: [1, 1.3, 1] }}
                    transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 60%)' }}
                    animate={{ x: [0, -120, 0], y: [0, 100, 0], scale: [1.2, 0.9, 1.2] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Floating particles - reduced to 6 */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className={`absolute rounded-full ${i % 2 === 0 ? 'bg-emerald-400/40' : 'bg-violet-400/40'}`}
                        style={{
                            left: `${5 + i * 16}%`,
                            top: `${10 + (i % 3) * 30}%`,
                            width: `${6 + (i % 3) * 3}px`,
                            height: `${6 + (i % 3) * 3}px`,
                        }}
                        animate={{
                            y: [0, -40 - (i % 3) * 15, 0],
                            opacity: [0.3, 0.7, 0.3],
                        }}
                        transition={{ duration: 5 + i * 0.5, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
                    />
                ))}
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
                {/* Section 1: Banner/Header */}
                <motion.section
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-12"
                >
                    {/* Welcome Banner */}
                    <motion.div
                        className="relative rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-700 dark:via-purple-700 dark:to-indigo-700 p-8 md:p-12 shadow-2xl"
                        whileHover={{ scale: 1.01, zIndex: 10 }}
                        transition={{ type: 'spring' as const, stiffness: 200 }}
                    >
                        {/* Animated background elements */}
                        <motion.div
                            className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
                            animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.2, 1] }}
                            transition={{ duration: 8, repeat: Infinity }}
                        />
                        <motion.div
                            className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-2xl"
                            animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
                            transition={{ duration: 6, repeat: Infinity }}
                        />

                        {/* Sparkles - reduced to 2 */}
                        {[...Array(2)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute"
                                style={{ left: `${25 + i * 30}%`, top: `${25 + i * 25}%` }}
                                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                                transition={{ duration: 4, repeat: Infinity, delay: i * 1 }}
                            >
                                <Sparkles className="w-4 h-4 text-white/50" />
                            </motion.div>
                        ))}

                        <div className="relative z-10">
                            <motion.div
                                className="flex items-center gap-3 mb-4"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <motion.div
                                    className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                >
                                    <LayoutDashboard className="w-8 h-8 text-white" />
                                </motion.div>
                                <div>
                                    <h1 className="text-2xl md:text-4xl font-bold text-white">
                                        Selamat Datang, {isLoading ? '...' : userName}
                                    </h1>
                                    <p className="text-white/70 text-sm md:text-base mt-1">
                                        Sistem Informasi Manajemen SPBU Terpadu
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div
                                className="flex flex-wrap items-center gap-4 mt-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                {/* Connected wallet address */}
                                <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                                    <span className="text-white/70 text-sm">Wallet: </span>
                                    <span className="text-white font-mono text-sm">
                                        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connecting...'}
                                    </span>
                                </div>

                                {/* Role Badge / Selector */}
                                {hasMultipleRoles ? (
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500/30 to-purple-500/30 backdrop-blur-sm rounded-full border border-violet-400/40 hover:from-violet-500/40 hover:to-purple-500/40 transition-all cursor-pointer"
                                        >
                                            <span className="text-white/70 text-sm">Role:</span>
                                            <span className="text-white font-medium text-sm">
                                                {isLoading ? 'Loading...' : selectedJabatan?.namaJabatan || roleNames[currentRole]}
                                            </span>
                                            <ChevronDown className={`w-4 h-4 text-white/70 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        <AnimatePresence>
                                            {isRoleDropdownOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    className="absolute top-full left-0 mt-2 w-72 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl z-[100] max-h-80 overflow-hidden"
                                                >
                                                    <div className="p-2 max-h-72 overflow-y-auto">
                                                        <p className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                                            Pilih Jabatan ({jabatanList.length} tersedia)
                                                        </p>
                                                        {jabatanList.map((jabatan, index) => (
                                                            <button
                                                                key={jabatan.jabatanId.toString()}
                                                                onClick={() => {
                                                                    setSelectedJabatanIndex(index);
                                                                    // Persist to local storage
                                                                    localStorage.setItem('selectedJabatanId', jabatan.jabatanId.toString());
                                                                    setIsRoleDropdownOpen(false);
                                                                }}
                                                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${selectedJabatanIndex === index
                                                                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                                                                    }`}
                                                            >
                                                                <div className={`w-2 h-2 rounded-full ${selectedJabatanIndex === index
                                                                    ? 'bg-violet-500'
                                                                    : 'bg-slate-300 dark:bg-slate-600'
                                                                    }`} />
                                                                <div className="text-left">
                                                                    <p className="font-medium text-sm">{jabatan.namaJabatan}</p>
                                                                    {jabatan.keterangan && (
                                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{jabatan.keterangan}</p>
                                                                    )}
                                                                </div>
                                                                {selectedJabatanIndex === index && (
                                                                    <span className="ml-auto text-xs bg-violet-500 text-white px-2 py-0.5 rounded-full">
                                                                        Aktif
                                                                    </span>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <div className="px-4 py-2 bg-gradient-to-r from-violet-500/30 to-purple-500/30 backdrop-blur-sm rounded-full border border-violet-400/40">
                                        <span className="text-white/70 text-sm">Role: </span>
                                        <span className="text-white font-medium text-sm">
                                            {isLoading ? 'Loading...' : selectedJabatan?.namaJabatan || roleNames[currentRole]}
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Quick Stats */}
                    <motion.div
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {[
                            { label: 'Total Transaksi', value: '1,234', icon: Receipt, color: 'from-violet-500 to-purple-600' },
                            { label: 'Stok BBM', value: '45,000 L', icon: Fuel, color: 'from-emerald-500 to-teal-600' },
                            { label: 'Pendapatan Hari Ini', value: 'Rp 12.5 Jt', icon: TrendingUp, color: 'from-cyan-500 to-blue-600' },
                            { label: 'Pegawai Aktif', value: '24', icon: Users, color: 'from-amber-500 to-orange-600' },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                variants={cardVariants}
                                whileHover={{ scale: 1.03, y: -5 }}
                                className="relative overflow-hidden p-5 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 shadow-lg cursor-pointer group"
                            >
                                <motion.div
                                    className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                                />
                                <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${stat.color} mb-3`}>
                                    <stat.icon className="w-5 h-5 text-white" />
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {stat.value}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-white/50">{stat.label}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.section>

                {/* Section: Dashboard Charts */}

                {/* Section 2: Menu Cards by Category */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {/* Header with Title and Search */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 my-6">
                        <motion.h2
                            className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Sparkles className="w-6 h-6 text-violet-500" />
                            Menu {roleNames[currentRole]}
                        </motion.h2>

                        {/* Search Box */}
                        <motion.div
                            className="relative w-full sm:w-80"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="relative">
                                <Search className="absolute z-50 left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 dark:text-slate-300" />
                                <input
                                    type="text"
                                    placeholder="Cari menu..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-10 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all duration-300 text-slate-800 dark:text-white placeholder:text-slate-400 shadow-lg"
                                />
                                {searchQuery && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/4 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <X className="w-4 h-4 text-slate-400" />
                                    </motion.button>
                                )}
                            </div>

                        </motion.div>
                    </div>

                    {/* No Results Message */}
                    {searchQuery && searchFilteredMenus.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-12"
                        >
                            <Search className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">
                                Tidak ada menu ditemukan
                            </h3>
                            <p className="text-slate-400 dark:text-slate-500">
                                Coba kata kunci lain untuk "{searchQuery}"
                            </p>
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentRole + searchQuery}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-8"
                        >
                            {searchFilteredMenus.map((category, catIndex) => (
                                <motion.div
                                    key={category.id}
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: catIndex * 0.15, type: 'spring', stiffness: 100 }}
                                >
                                    {/* Jumbotron Container */}
                                    <div className="relative overflow-hidden rounded-3xl">
                                        {/* Jumbotron Background with Gradient */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-90`} />
                                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

                                        {/* Floating Orbs */}
                                        <motion.div
                                            className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl"
                                            animate={{ scale: [1, 1.2, 1], x: [0, 20, 0], y: [0, -10, 0] }}
                                            transition={{ duration: 8, repeat: Infinity }}
                                        />
                                        <motion.div
                                            className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-white/10 blur-3xl"
                                            animate={{ scale: [1.2, 1, 1.2], x: [0, -10, 0] }}
                                            transition={{ duration: 6, repeat: Infinity }}
                                        />

                                        {/* Jumbotron Content */}
                                        <div className="relative z-10 p-6 md:p-8">
                                            {/* Header with 3D Icon */}
                                            <div className="flex items-start gap-5 mb-6">
                                                {/* 3D Category Icon */}
                                                <motion.div
                                                    className="relative flex-shrink-0"
                                                    whileHover={{ scale: 1.1 }}
                                                    transition={{ type: 'spring', stiffness: 300 }}
                                                >
                                                    {/* Shadow layer */}
                                                    <div className="absolute inset-0 translate-x-1 translate-y-1 bg-black/30 rounded-2xl blur-md" />
                                                    {/* Main icon container */}
                                                    <div className="relative p-4 md:p-5 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-2xl"
                                                        style={{ transform: 'perspective(500px) rotateX(10deg) rotateY(-5deg)' }}>
                                                        {/* Inner highlight */}
                                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 to-transparent" />
                                                        <category.icon className="relative w-10 h-10 md:w-12 md:h-12 text-white drop-shadow-lg" />
                                                    </div>

                                                </motion.div>

                                                {/* Title and Description */}
                                                <div className="flex-1 min-w-0">
                                                    <motion.h3
                                                        className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg"
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: catIndex * 0.1 + 0.2 }}
                                                    >
                                                        {category.title}
                                                    </motion.h3>
                                                    <motion.p
                                                        className="text-white/80 text-sm md:text-base"
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: catIndex * 0.1 + 0.3 }}
                                                    >
                                                        {category.description}
                                                    </motion.p>
                                                </div>

                                                {/* Item count badge */}
                                                <motion.div
                                                    className="flex-shrink-0 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30"
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: catIndex * 0.1 + 0.4 }}
                                                >
                                                    <span className="text-white text-sm font-medium">{category.items.length} menu</span>
                                                </motion.div>
                                            </div>

                                            {/* Menu Items Grid Inside Jumbotron */}
                                            <motion.div
                                                variants={containerVariants}
                                                initial="hidden"
                                                animate="visible"
                                                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                                            >
                                                {category.items.map((item, itemIndex) => (
                                                    <motion.div
                                                        key={item.id}
                                                        variants={cardVariants}
                                                        whileHover={{
                                                            scale: 1.05,
                                                            y: -8,
                                                            transition: { type: 'spring' as const, stiffness: 400, damping: 20 },
                                                        }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => navigate(item.path)}
                                                        onMouseEnter={() => setHoveredCard(item.id)}
                                                        onMouseLeave={() => setHoveredCard(null)}
                                                        className="relative group cursor-pointer"
                                                    >
                                                        {/* Card with glassmorphism */}
                                                        <div className="relative overflow-hidden p-4 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                                                            {/* Hover gradient */}
                                                            <motion.div
                                                                className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-2xl`}
                                                                initial={{ opacity: 0 }}
                                                                whileHover={{ opacity: 0.1 }}
                                                                transition={{ duration: 0.3 }}
                                                            />

                                                            {/* 3D Icon Container */}
                                                            <div className="relative mb-3">
                                                                {/* 3D shadow */}
                                                                <div className={`absolute inset-0 translate-x-1 translate-y-1 bg-gradient-to-br ${item.color} rounded-xl opacity-40 blur-sm`} />

                                                                {/* Main 3D icon */}
                                                                <div
                                                                    className={`relative inline-flex p-3 rounded-xl bg-gradient-to-br ${item.color} shadow-lg`}
                                                                    style={{
                                                                        transform: 'perspective(200px) rotateX(8deg) rotateY(-5deg)',
                                                                        boxShadow: `0 10px 30px -10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.1)`
                                                                    }}
                                                                >
                                                                    {/* Inner highlight */}
                                                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 via-transparent to-transparent" />
                                                                    <item.icon className="relative w-6 h-6 text-white drop-shadow-md" />
                                                                </div>

                                                                {/* Glow effect on hover */}
                                                                <motion.div
                                                                    className={`absolute inset-0 rounded-xl bg-gradient-to-br ${item.color} blur-xl`}
                                                                    initial={{ opacity: 0 }}
                                                                    animate={hoveredCard === item.id ? { opacity: 0.4 } : { opacity: 0 }}
                                                                    transition={{ duration: 0.3 }}
                                                                />
                                                            </div>

                                                            {/* Title */}
                                                            <h4 className="font-semibold text-slate-800 dark:text-white text-sm group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-300 truncate">
                                                                {item.title}
                                                            </h4>

                                                            {/* Hover indicator */}
                                                            <motion.div
                                                                className="absolute bottom-2 right-2"
                                                                initial={{ opacity: 0, scale: 0.5 }}
                                                                animate={hoveredCard === item.id ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
                                                                transition={{ duration: 0.2 }}
                                                            >
                                                                <ChevronRight className={`w-4 h-4 text-violet-500`} />
                                                            </motion.div>

                                                            {/* Bottom gradient line */}
                                                            <motion.div
                                                                className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color}`}
                                                                initial={{ scaleX: 0, originX: 0 }}
                                                                whileHover={{ scaleX: 1 }}
                                                                transition={{ duration: 0.3 }}
                                                            />
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </motion.section>
            </div>
        </div>
    );
}
