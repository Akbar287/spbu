import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Wallet, LogOut, Copy, Check, AlertTriangle } from 'lucide-react';
import { Connector, useAccount, useConnect, useConnectors, useSwitchChain } from 'wagmi';
import { QrCode, Plug } from 'lucide-react';
import { disconnect } from '@wagmi/core'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import React from 'react';
import { useTheme } from '../../config/ThemeContext';
import { formatAddress } from '../../lib/utils';
import { config, ganache } from '@/config/wagmi';
import { addGanacheToWallet } from '@/lib/addNetworkToWallet';


export default function Navbar() {
    const { address, isConnected, chainId } = useAccount();
    const { switchChain } = useSwitchChain();
    const [openDialog, setOpenDialog] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    const { theme, toggleTheme } = useTheme();
    const [networkRejected, setNetworkRejected] = React.useState(false);

    // Check if connected to wrong network (Ganache for local dev)
    const isWrongNetwork = isConnected && chainId !== ganache.id;

    // Handle switching to Ganache network (for local development)
    const handleSwitchToGanache = async () => {
        setNetworkRejected(false);
        try {
            switchChain({ chainId: ganache.id });
        } catch (err) {
            // If switch fails, try to add the network
            const added = await addGanacheToWallet();
            if (!added) {
                setNetworkRejected(true);
            }
        }
    };


    async function handleDisconnect() {
        // Disconnect from wagmi
        await disconnect(config);

        // Clear any cached connection data
        if (typeof window !== 'undefined') {
            // Clear localStorage items related to wallet connections
            const keysToRemove = Object.keys(localStorage).filter(key =>
                key.includes('wagmi') ||
                key.includes('walletconnect') ||
                key.includes('wc@2') ||
                key.includes('WALLETCONNECT') ||
                key.includes('-walletlink')
            );
            keysToRemove.forEach(key => localStorage.removeItem(key));

            // Clear sessionStorage as well
            const sessionKeysToRemove = Object.keys(sessionStorage).filter(key =>
                key.includes('wagmi') ||
                key.includes('walletconnect')
            );
            sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
        }
    }

    // Reset network rejected state when chain changes
    React.useEffect(() => {
        if (chainId === ganache.id) {
            setNetworkRejected(false);
        }
    }, [chainId]);

    function copyAddress() {
        if (address) {
            navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    return (
        <motion.nav
            className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 py-3 sm:py-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
        >
            <div className="max-w-7xl mx-auto bg-white/10 dark:bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-white/10 shadow-xl shadow-purple-500/10">
                <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <motion.div
                        className="text-lg sm:text-2xl font-bold bg-gradient-to-r dark:from-purple-400 dark:to-pink-400 from-purple-600 to-pink-600 bg-clip-text text-transparent"
                        whileHover={{ scale: 1.05 }}
                    >
                        SPBU
                    </motion.div>

                    <div className="flex items-center gap-1.5 sm:gap-3">
                        <AnimatePresence mode="wait">
                            {isConnected && address ? (
                                /* Connected State - Show Address & Disconnect */
                                <motion.div
                                    key="connected"
                                    className="flex items-center gap-2"
                                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, x: -20 }}
                                    transition={{ duration: 0.3, type: 'spring' }}
                                >
                                    {/* Address Display with Copy */}
                                    <motion.button
                                        onClick={copyAddress}
                                        className="relative flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-full border border-purple-300/30 dark:border-purple-500/30 cursor-pointer group"
                                        whileHover={{ scale: 1.02, borderColor: 'rgba(168, 85, 247, 0.5)' }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {/* Pulsing dot indicator */}
                                        <motion.div
                                            className="w-2 h-2 bg-green-400 rounded-full"
                                            animate={{
                                                scale: [1, 1.3, 1],
                                                opacity: [1, 0.7, 1],
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: 'easeInOut',
                                            }}
                                        />
                                        <span className="text-xs sm:text-sm font-mono dark:text-purple-300 text-purple-700">
                                            {formatAddress(address)}
                                        </span>
                                        <motion.div
                                            initial={false}
                                            animate={{ rotate: copied ? 360 : 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {copied ? (
                                                <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                                            ) : (
                                                <Copy className="w-3 h-3 sm:w-4 sm:h-4 dark:text-purple-400 text-purple-600 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </motion.div>

                                        {/* Copied tooltip */}
                                        <AnimatePresence>
                                            {copied && (
                                                <motion.div
                                                    className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-green-500 text-white text-xs rounded-lg whitespace-nowrap"
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -5 }}
                                                >
                                                    Tersalin!
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.button>

                                    {/* Disconnect Button */}
                                    <motion.button
                                        onClick={handleDisconnect}
                                        className="relative flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-red-500 to-rose-600 rounded-full text-white text-xs sm:text-sm font-semibold shadow-lg shadow-red-500/30 overflow-hidden group cursor-pointer"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {/* Animated background on hover */}
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-rose-600 to-red-500"
                                            initial={{ opacity: 0 }}
                                            whileHover={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                        />

                                        {/* Glow effect */}
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-400 blur-lg opacity-0 group-hover:opacity-50"
                                            animate={{
                                                scale: [1, 1.2, 1],
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: 'easeInOut',
                                            }}
                                        />

                                        {/* Content */}
                                        <motion.div
                                            className="relative z-10 flex items-center gap-1 sm:gap-2"
                                            whileHover={{ x: [0, 3, 0] }}
                                            transition={{ duration: 0.4 }}
                                        >
                                            <motion.div
                                                whileHover={{ rotate: [0, -20, 0] }}
                                                transition={{ duration: 0.4 }}
                                            >
                                                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                                            </motion.div>
                                            <span className="hidden sm:inline">Putuskan</span>
                                        </motion.div>

                                        {/* Shine effect */}
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                            initial={{ x: '-100%' }}
                                            whileHover={{ x: '100%' }}
                                            transition={{ duration: 0.6 }}
                                        />
                                    </motion.button>
                                </motion.div>
                            ) : (
                                /* Disconnected State - Show Connect Button */
                                <motion.button
                                    key="disconnected"
                                    className="relative flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white text-xs sm:text-base font-semibold shadow-lg shadow-purple-500/30 overflow-hidden group cursor-pointer"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setOpenDialog(true)}
                                    initial={{ opacity: 0, scale: 0.8, x: -20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                                    transition={{ duration: 0.3, type: 'spring' }}
                                >
                                    {/* Animated background on hover */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600"
                                        initial={{ opacity: 0 }}
                                        whileHover={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />

                                    {/* Glow effect */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 blur-lg opacity-0 group-hover:opacity-50"
                                        animate={{
                                            scale: [1, 1.2, 1],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                        }}
                                    />

                                    {/* Content */}
                                    <motion.div
                                        className="relative z-10 flex items-center gap-1 sm:gap-2"
                                        whileHover={{ x: [0, -3, 0] }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <motion.div
                                            whileHover={{ rotate: [0, -15, 15, 0] }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <Wallet className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </motion.div>
                                        <span>Connect Wallet</span>
                                    </motion.div>

                                    {/* Shine effect on hover */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                        initial={{ x: '-100%' }}
                                        whileHover={{ x: '100%' }}
                                        transition={{ duration: 0.6 }}
                                    />
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {/* Theme Toggle Button */}
                        <motion.button
                            onClick={toggleTheme}
                            className="p-2 sm:p-3 dark:bg-white/10 bg-purple-100 backdrop-blur-xl rounded-full border dark:border-white/20 border-purple-300 hover:border-purple-400 transition-all duration-300 group relative cursor-pointer"
                            whileHover={{ scale: 1.1, rotate: 180 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <motion.div
                                initial={false}
                                animate={{ rotate: theme === 'dark' ? 0 : 180 }}
                                transition={{ duration: 0.5, ease: 'easeInOut' }}
                            >
                                {theme === 'dark' ? (
                                    <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                                ) : (
                                    <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                                )}
                            </motion.div>

                            <motion.div
                                className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300"
                                animate={{
                                    scale: [1, 1.2, 1],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            />
                        </motion.button>
                    </div>
                </div>
            </div>
            <ConnectWalletDialog openDialog={openDialog} setOpenDialog={setOpenDialog} />

            {/* Wrong Network Warning Banner */}
            <AnimatePresence>
                {isWrongNetwork && (
                    <motion.div
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-orange-300 dark:border-orange-500/50 shadow-2xl shadow-orange-500/20 p-5">
                            <div className="flex items-start gap-4">
                                <motion.div
                                    className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0"
                                    animate={{ rotate: [0, -10, 10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                    <AlertTriangle className="w-6 h-6 text-white" />
                                </motion.div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">
                                        Jaringan tidak sesuai
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                        Aplikasi ini memerlukan koneksi ke jaringan Ganache lokal (Chain ID: 1337). Silakan beralih ke jaringan Ganache untuk melanjutkan.
                                    </p>
                                    <motion.button
                                        onClick={handleSwitchToGanache}
                                        className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {networkRejected ? 'Coba Lagi' : 'Beralih ke Ganache'}
                                    </motion.button>
                                    {networkRejected && (
                                        <motion.p
                                            className="text-xs text-red-500 mt-2 text-center"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            Anda menolak perubahan jaringan. Klik tombol di atas untuk mencoba lagi.
                                        </motion.p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    )
}

function isInstalled(connector: Connector) {
    return Boolean((connector as any).ready);
}

function getWalletIcon(connectorId: string) {
    const icons: Record<string, any> = {
        'walletConnect': QrCode,
        'metaMask': Wallet,
        'coinbaseWallet': Wallet,
        'injected': Plug,
    };
    return icons[connectorId] || Wallet;
}

function categorizeConnectors(connectors: readonly Connector[]) {
    const installed: Connector[] = [];
    const popular: Connector[] = [];
    const others: Connector[] = [];

    connectors.forEach((c) => {
        if (isInstalled(c)) {
            installed.push(c);
        } else {
            const id = (c as any).id;
            if (['metaMask', 'walletConnect', 'coinbaseWallet'].includes(id)) {
                popular.push(c);
            } else {
                others.push(c);
            }
        }
    });

    return { installed, popular, others };
}


function ConnectWalletDialog({ openDialog, setOpenDialog }: { openDialog: boolean; setOpenDialog: (open: boolean) => void }) {
    const connectors = useConnectors();
    const { connect, isPending, error } = useConnect();
    const [selectedConnector, setSelectedConnector] = React.useState<Connector | null>(null);
    const [connectionStatus, setConnectionStatus] = React.useState<'idle' | 'connecting' | 'success' | 'error'>('idle');

    // Filter out injected connector
    const filteredConnectors = React.useMemo(() =>
        connectors.filter(c => (c as any).id !== 'injected'),
        [connectors]
    );

    const { installed, popular, others } = React.useMemo(() =>
        categorizeConnectors(filteredConnectors),
        [filteredConnectors]
    );

    // Auto-connect when wallet is selected
    const handleWalletClick = async (connector: Connector) => {
        setSelectedConnector(connector);
        setConnectionStatus('idle'); // Reset status when selecting again

        // For WalletConnect, just select it (user will scan QR)
        if ((connector as any).id === 'walletConnect') {
            return;
        }

        // For other wallets, auto-connect
        setConnectionStatus('connecting');
        try {
            await connect({ connector });
            setConnectionStatus('success');
            setTimeout(() => {
                setOpenDialog(false);
            }, 1000);
        } catch (err) {
            console.error('Connection error:', err);
            setConnectionStatus('error');
            // Don't close dialog, let user retry
        }
    };

    // Retry connection for the currently selected wallet
    const handleRetry = () => {
        if (selectedConnector) {
            handleWalletClick(selectedConnector);
        }
    };

    const WalletItem = ({ connector, category }: { connector: Connector; category?: string }) => {
        const isSelected = selectedConnector?.uid === (connector as any).uid;
        const isConnecting = isPending && isSelected;
        const Icon = getWalletIcon((connector as any).id);

        return (
            <button
                onClick={() => handleWalletClick(connector)}
                disabled={isPending}
                className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left
                    ${isSelected
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                    ${isPending && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                    {connector.name}
                </span>
                {isConnecting && (
                    <div className="ml-auto">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </button>
        );
    };

    return (
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent className="w-full max-w-3xl p-0 gap-0">
                <div className="grid grid-cols-7">
                    {/* Left Panel - Wallet List */}
                    <div className="col-span-3 border-r dark:border-gray-800 px-6 py-8 max-h-[600px] overflow-y-auto">
                        <DialogHeader className="mb-6">
                            <DialogTitle>Hubungkan Dompet</DialogTitle>
                        </DialogHeader>

                        {/* Terinstal */}
                        {installed.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-xs font-semibold text-blue-500 mb-3">Terinstal</h3>
                                <div className="space-y-1">
                                    {installed.map((c) => (
                                        <WalletItem key={(c as any).uid} connector={c} category="installed" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Populer */}
                        {popular.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-xs font-semibold text-gray-500 mb-3">Populer</h3>
                                <div className="space-y-1">
                                    {popular.map((c) => (
                                        <WalletItem key={(c as any).uid} connector={c} category="popular" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Lebih Banyak */}
                        {others.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 mb-3">Lebih Banyak</h3>
                                <div className="space-y-1">
                                    {others.map((c) => (
                                        <WalletItem key={(c as any).uid} connector={c} category="others" />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel - Connection Area */}
                    <div className="col-span-4 p-8 flex flex-col items-center justify-center min-h-[500px]">
                        {selectedConnector ? (
                            <>
                                {(selectedConnector as any).id === 'walletConnect' ? (
                                    // WalletConnect - Show QR Code
                                    <>
                                        <h2 className="text-2xl font-bold mb-8">
                                            Pindai dengan {selectedConnector.name}
                                        </h2>

                                        <div className="relative mb-8">
                                            {/* Placeholder QR Code */}
                                            <div className="w-80 h-80 bg-white p-4 rounded-2xl shadow-2xl flex items-center justify-center border-4 border-black">
                                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                                                    <QrCode className="w-16 h-16 text-gray-400" />
                                                </div>
                                            </div>
                                            {/* Wallet Icon Overlay */}
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                                                <Wallet className="w-8 h-8 text-white" />
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-500">
                                            Tidak memiliki {selectedConnector.name}?{' '}
                                            <a href="#" className="text-blue-500 hover:underline">
                                                DAPATKAN
                                            </a>
                                        </p>
                                    </>
                                ) : (
                                    // Other Wallets - Show Status
                                    <div className="text-center">
                                        <h2 className="text-2xl font-bold mb-8">
                                            {selectedConnector.name}
                                        </h2>

                                        {connectionStatus === 'connecting' && (
                                            <div className="mb-6">
                                                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                                <p className="text-lg text-gray-600 dark:text-gray-400">
                                                    Menghubungkan ke {selectedConnector.name}...
                                                </p>
                                                <p className="text-sm text-gray-500 mt-2">
                                                    Silakan periksa ekstensi wallet Anda
                                                </p>
                                            </div>
                                        )}

                                        {connectionStatus === 'success' && (
                                            <div className="mb-6">
                                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <p className="text-lg text-green-600 dark:text-green-400 font-semibold">
                                                    Terhubung!
                                                </p>
                                            </div>
                                        )}

                                        {connectionStatus === 'idle' && (
                                            <div className="mb-6">
                                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Wallet className="w-8 h-8 text-blue-500" />
                                                </div>
                                                <p className="text-lg text-gray-600 dark:text-gray-400">
                                                    Klik untuk menghubungkan
                                                </p>
                                            </div>
                                        )}

                                        {connectionStatus === 'error' && (
                                            <div className="mb-6">
                                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </div>
                                                <p className="text-lg text-red-600 dark:text-red-400 font-semibold mb-2">
                                                    Koneksi Gagal
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                                    Terjadi kesalahan saat menghubungkan ke {selectedConnector.name}
                                                </p>
                                                {error && (
                                                    <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
                                                        {error.message}
                                                    </p>
                                                )}
                                                <motion.button
                                                    onClick={handleRetry}
                                                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl shadow-lg"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    Coba Lagi
                                                </motion.button>
                                            </div>
                                        )}

                                        {!isInstalled(selectedConnector) && connectionStatus === 'idle' && (
                                            <p className="text-sm text-gray-500 mt-4">
                                                Tidak memiliki {selectedConnector.name}?{' '}
                                                <a href="#" className="text-blue-500 hover:underline">
                                                    DAPATKAN
                                                </a>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            // No wallet selected
                            <div className="text-center text-gray-400">
                                <Wallet className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p>Pilih wallet untuk melanjutkan</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
