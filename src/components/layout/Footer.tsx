import { motion } from 'framer-motion';
import { Github, Twitter, Linkedin, Heart, Blocks } from 'lucide-react';
import { useConnection } from 'wagmi';

const socialLinks = [
    { icon: Github, href: 'https://github.com/Akbar287', label: 'GitHub' },
    { icon: Twitter, href: 'https://twitter.com/Akbar287_', label: 'Twitter' },
    { icon: Linkedin, href: 'https://www.linkedin.com/in/muhammad-akbar-596803201/', label: 'LinkedIn' },
];

export default function Footer() {
    const connection = useConnection();
    const currentYear = new Date().getFullYear();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring' as const,
                stiffness: 100,
                damping: 15,
            },
        },
    };

    return (
        <footer className="relative overflow-hidden">
            {/* Aero Glass Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/60 to-white/80 dark:from-slate-800/40 dark:via-slate-800/60 dark:to-slate-900/80 backdrop-blur-xl" />

            {/* Glass Shine Effect - Top highlight like Windows 7 */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/30 to-transparent" />
            <div className="absolute inset-x-0 top-[1px] h-12 bg-gradient-to-b from-white/50 dark:from-white/10 to-transparent pointer-events-none" />

            {/* Glass Border */}
            <div className="absolute inset-0 border-t border-white/50 dark:border-white/10" />

            {/* Subtle inner shadow for depth */}
            <div className="absolute inset-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]" />

            {/* Animated color orbs behind the glass */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl"
                    animate={{
                        x: [0, 50, 0],
                        y: [0, -30, 0],
                        scale: [1, 1.3, 1],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-32 left-1/3 w-64 h-64 bg-cyan-400/20 dark:bg-cyan-500/10 rounded-full blur-3xl"
                    animate={{
                        x: [0, -30, 0],
                        y: [0, 20, 0],
                        scale: [1.2, 1, 1.2],
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-32 right-1/3 w-64 h-64 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-3xl"
                    animate={{
                        x: [0, 40, 0],
                        y: [0, -20, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-32 -right-32 w-64 h-64 bg-pink-400/20 dark:bg-pink-500/10 rounded-full blur-3xl"
                    animate={{
                        x: [0, -50, 0],
                        y: [0, 30, 0],
                        scale: [1.1, 0.9, 1.1],
                    }}
                    transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            <motion.div
                className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
            >
                {
                    connection.isDisconnected && (
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
                            {/* Brand Section */}
                            <motion.div variants={itemVariants} className="flex flex-col items-center md:items-start">
                                <motion.div
                                    className="flex items-center gap-3 mb-4"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    {/* Glass icon container */}
                                    <motion.div
                                        className="relative w-10 h-10 rounded-xl overflow-hidden"
                                        animate={{ rotate: [0, 5, -5, 0] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/80 to-purple-600/80 backdrop-blur-sm" />
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Blocks className="w-5 h-5 text-white drop-shadow-lg" />
                                        </div>
                                    </motion.div>
                                    <span className="text-xl font-bold text-slate-800 dark:text-white drop-shadow-sm">
                                        Manajemen SPBU
                                    </span>
                                </motion.div>
                                <p className="text-sm text-slate-600 dark:text-slate-300 text-center md:text-left max-w-xs">
                                    Pencatatan data SPBU dengan aman di blockchain Ethereum. Terdesentralisasi, transparan, dan abadi.
                                </p>
                            </motion.div>

                            {/* Social Links */}
                            <motion.div variants={itemVariants} className="flex flex-col items-center md:items-end">
                                <h4 className="font-semibold text-slate-800 dark:text-white mb-4 drop-shadow-sm">
                                    Connect
                                </h4>
                                <div className="flex gap-3">
                                    {socialLinks.map((social) => (
                                        <motion.a
                                            key={social.label}
                                            href={social.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="relative w-10 h-10 rounded-xl overflow-hidden group"
                                            whileHover={{ scale: 1.1, y: -3 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {/* Glass button background */}
                                            <div className="absolute inset-0 bg-white/60 dark:bg-white/10 backdrop-blur-sm border border-white/50 dark:border-white/20 rounded-xl group-hover:bg-blue-500/20 dark:group-hover:bg-blue-500/30 transition-colors" />
                                            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 dark:from-white/20 to-transparent rounded-t-xl" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <social.icon className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                            </div>
                                        </motion.a>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    )
                }

                {/* Glass Divider */}
                {
                    connection.isDisconnected && (
                        <motion.div
                            className="h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/30 to-transparent mb-8"
                            initial={{ scaleX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        />
                    )
                }

                {/* Copyright */}
                <motion.div
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300"
                >
                    <span>Made with</span>
                    <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <Heart className="w-4 h-4 text-red-500 fill-red-500 drop-shadow-md" />
                    </motion.span>
                    <span>by</span>
                    <motion.a
                        href="https://www.linkedin.com/in/muhammad-akbar-596803201/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        whileHover={{ scale: 1.05 }}
                    >
                        Akbar
                    </motion.a>
                    <span className="hidden sm:inline">•</span>
                    <span>&copy; {currentYear} Manajemen SPBU</span>
                </motion.div>
            </motion.div>
        </footer>
    );
}
