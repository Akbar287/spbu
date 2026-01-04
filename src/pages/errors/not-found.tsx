'use client'

import { NavLink } from 'react-router-dom'

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
            <h1 className="text-4xl font-bold mb-4">404 - Halaman Tidak Ada</h1>
            <p className="mb-6">
                Sepertinya Halaman yang kamu cari nggak ada deh.
            </p>
            <NavLink to="/" className="text-blue-500 hover:underline">
                Kembali Ke Halaman Awal
            </NavLink>
        </div>
    )
}
