import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    ArrowRight, Blocks, CheckCircle2, Sparkles, X, Send,
    MessageCircle, Linkedin, Paperclip, Loader2, Mail, Phone,
    FileText, User, Zap, Heart, Star
} from 'lucide-react';

const CTASection: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        message: '',
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const benefits = [
        "Transparansi data 100%",
        "Keamanan tingkat enterprise",
        "Audit trail lengkap",
        "Integrasi mudah",
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate email submission (in production, integrate with EmailJS, Formspree, or backend API)
        // For now, we'll open mailto link with the form data
        const mailtoLink = `mailto:muhammadakbar007akbar@gmail.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Nama: ${formData.name}\n\nPesan:\n${formData.message}\n\n${selectedFile ? `File terlampir: ${selectedFile.name}` : ''}`)}`;

        setTimeout(() => {
            window.open(mailtoLink, '_blank');
            setSubmitSuccess(true);
            setIsSubmitting(false);

            setTimeout(() => {
                setShowModal(false);
                setSubmitSuccess(false);
                setFormData({ name: '', subject: '', message: '' });
                setSelectedFile(null);
            }, 2000);
        }, 1500);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    return (
        <section className="relative py-24 overflow-hidden">
            {/* Animated background - matching HeroSection */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-purple-100/80 dark:bg-slate-900" />

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* Animated gradient orbs */}
                <motion.div
                    className="absolute top-0 left-0 w-full h-full"
                    style={{
                        background: 'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
                    }}
                    animate={{
                        opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                />
                <motion.div
                    className="absolute top-0 left-0 w-full h-full"
                    style={{
                        background: 'radial-gradient(circle at 80% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)',
                    }}
                    animate={{
                        opacity: [0.8, 0.5, 0.8],
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                />

                {/* Floating particles */}
                {[...Array(10)].map((_, i) => (
                    <motion.div
                        key={`particle-${i}`}
                        className="absolute w-2 h-2 rounded-full bg-violet-400/30 dark:bg-violet-400/20"
                        style={{
                            left: `${10 + i * 9}%`,
                            top: `${15 + (i % 4) * 22}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            x: [0, i % 2 === 0 ? 15 : -15, 0],
                            opacity: [0.2, 0.5, 0.2],
                            scale: [1, 1.3, 1],
                        }}
                        transition={{
                            duration: 4 + i * 0.5,
                            repeat: Infinity,
                            delay: i * 0.35,
                            ease: "easeInOut",
                        }}
                    />
                ))}

                {/* Floating blockchain icons */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute"
                        style={{
                            left: `${15 + i * 15}%`,
                            top: `${20 + (i % 3) * 30}%`,
                        }}
                        animate={{
                            y: [-10, 10, -10],
                            rotate: [0, 10, -10, 0],
                            opacity: [0.1, 0.3, 0.1],
                        }}
                        transition={{
                            duration: 5 + i,
                            repeat: Infinity,
                            delay: i * 0.5,
                        }}
                    >
                        <Blocks className="w-12 h-12 text-violet-400/30 dark:text-violet-500/30" />
                    </motion.div>
                ))}
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-6"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-100 to-cyan-100 dark:from-violet-500/20 dark:to-cyan-500/20 border border-violet-300 dark:border-violet-500/30 text-violet-700 dark:text-white text-sm font-medium">
                        <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                        Siap untuk Revolusi Digital?
                    </span>
                </motion.div>

                {/* Main Heading */}
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight"
                >
                    Bergabung dengan <br />
                    <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-600 dark:from-violet-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                        Masa Depan
                    </span>
                    <br />
                    Manajemen SPBU
                </motion.h2>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-slate-600 dark:text-white/60 mb-10 max-w-2xl mx-auto"
                >
                    Jadilah bagian dari revolusi blockchain dalam industri energi.
                    Tingkatkan efisiensi, transparansi, dan kepercayaan pelanggan dengan teknologi terdepan.
                </motion.p>

                {/* Benefits */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap justify-center gap-4 mb-12"
                >
                    {benefits.map((benefit, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none"
                        >
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                            <span className="text-slate-700 dark:text-white/80 text-sm">{benefit}</span>
                        </motion.div>
                    ))}
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                        <Button
                            size="lg"
                            onClick={() => setShowModal(true)}
                            className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-10 py-7 text-lg rounded-2xl shadow-2xl shadow-violet-500/30 group"
                        >
                            {/* Glow effect */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-violet-400 to-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity"
                                animate={{
                                    x: ['-100%', '100%'],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    repeatDelay: 1,
                                }}
                            />
                            <span className="relative flex items-center gap-2">
                                Implementasi Sekarang
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Button>
                    </motion.div>
                </motion.div>

                {/* Alternative Contact Methods */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                    className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Atau hubungi langsung:</p>
                    <div className="flex gap-3">
                        {/* WhatsApp */}
                        <motion.a
                            href="https://wa.me/6281288748757?text=Saya%20ingin%20konsultasi%20mengenai%20Integrasi%20Sistem%20SPBU%20dengan%20Blockchain"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span>WhatsApp</span>
                            <motion.div
                                className="absolute -top-1 -right-1 w-3 h-3 bg-green-300 rounded-full"
                                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                        </motion.a>

                        {/* LinkedIn */}
                        <motion.a
                            href="https://www.linkedin.com/in/muhammad-akbar-596803201/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Linkedin className="w-5 h-5" />
                            <span>LinkedIn</span>
                        </motion.a>
                    </div>
                </motion.div>

                {/* Trust indicators */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 }}
                    className="mt-12 flex flex-wrap justify-center items-center gap-6 text-sm text-slate-500 dark:text-slate-400"
                >
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span>Respon Cepat</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span>Konsultasi Gratis</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>Dukungan 24/7</span>
                    </div>
                </motion.div>
            </div>

            {/* Contact Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Backdrop */}
                        <motion.div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isSubmitting && setShowModal(false)}
                        />

                        {/* Modal Content */}
                        <motion.div
                            className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden"
                            initial={{ opacity: 0, scale: 0.9, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 50 }}
                            transition={{ type: 'spring', damping: 20 }}
                        >
                            {/* Animated header background */}
                            <div className="relative h-32 overflow-hidden">
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600"
                                    animate={{
                                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                                    }}
                                    transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                                    style={{ backgroundSize: '200% 200%' }}
                                />

                                {/* Floating sparkles in header */}
                                {[...Array(5)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute"
                                        style={{ left: `${15 + i * 18}%`, top: `${30 + (i % 2) * 30}%` }}
                                        animate={{
                                            y: [-5, 5, -5],
                                            opacity: [0.5, 1, 0.5],
                                            scale: [1, 1.2, 1],
                                        }}
                                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                                    >
                                        <Sparkles className="w-4 h-4 text-white/50" />
                                    </motion.div>
                                ))}

                                {/* Header content */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', delay: 0.2 }}
                                        className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl mb-2"
                                    >
                                        <Mail className="w-8 h-8" />
                                    </motion.div>
                                    <h3 className="text-xl font-bold">Hubungi Kami</h3>
                                    <p className="text-white/80 text-sm">Konsultasi gratis untuk proyek Anda</p>
                                </div>

                                {/* Close button */}
                                <motion.button
                                    onClick={() => !isSubmitting && setShowModal(false)}
                                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <X className="w-5 h-5" />
                                </motion.button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {submitSuccess ? (
                                    <motion.div
                                        className="py-8 text-center"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', delay: 0.1 }}
                                            className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4"
                                        >
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                        </motion.div>
                                        <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Pesan Terkirim!</h4>
                                        <p className="text-slate-600 dark:text-slate-400">Kami akan segera menghubungi Anda</p>
                                    </motion.div>
                                ) : (
                                    <>
                                        {/* Name */}
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                <User className="w-4 h-4 text-violet-500" />
                                                Nama Lengkap
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="John Doe"
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all text-slate-700 dark:text-slate-200 placeholder-slate-400"
                                            />
                                        </motion.div>

                                        {/* Subject */}
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                <FileText className="w-4 h-4 text-violet-500" />
                                                Judul / Subjek
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.subject}
                                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                placeholder="Konsultasi Implementasi Blockchain SPBU"
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all text-slate-700 dark:text-slate-200 placeholder-slate-400"
                                            />
                                        </motion.div>

                                        {/* Message */}
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                <MessageCircle className="w-4 h-4 text-violet-500" />
                                                Pesan
                                            </label>
                                            <textarea
                                                required
                                                rows={4}
                                                value={formData.message}
                                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                placeholder="Jelaskan kebutuhan Anda..."
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all text-slate-700 dark:text-slate-200 placeholder-slate-400 resize-none"
                                            />
                                        </motion.div>

                                        {/* File Upload */}
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                <Paperclip className="w-4 h-4 text-violet-500" />
                                                Lampiran (Opsional)
                                            </label>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            <motion.button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className={`w-full px-4 py-3 rounded-xl border-2 border-dashed transition-all ${selectedFile
                                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                                    : 'border-slate-300 dark:border-slate-600 hover:border-violet-400 bg-slate-50 dark:bg-slate-700/50'
                                                    }`}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                            >
                                                {selectedFile ? (
                                                    <span className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                        {selectedFile.name}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center justify-center gap-2 text-slate-500">
                                                        <Paperclip className="w-5 h-5" />
                                                        Klik untuk upload file
                                                    </span>
                                                )}
                                            </motion.button>
                                        </motion.div>

                                        {/* Submit Button */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                        >
                                            <motion.button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                                                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Mengirim...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-5 h-5" />
                                                        Kirim Pesan
                                                    </>
                                                )}
                                            </motion.button>
                                        </motion.div>

                                        {/* Alternative contact in modal */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.6 }}
                                            className="pt-4 border-t border-slate-200 dark:border-slate-700"
                                        >
                                            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-3">Atau hubungi langsung via:</p>
                                            <div className="flex justify-center gap-3">
                                                <motion.a
                                                    href="https://wa.me/621234567890"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium rounded-xl hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                    WhatsApp
                                                </motion.a>
                                                <motion.a
                                                    href="https://www.linkedin.com/in/muhammad-akbar/"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <Linkedin className="w-4 h-4" />
                                                    LinkedIn
                                                </motion.a>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default CTASection;
