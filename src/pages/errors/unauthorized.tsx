'use client'

export default function Unauthorized() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
            <h1 className="text-4xl font-bold mb-4">401 - Unauthorized</h1>
            <p className="mb-6">
                Anda tidak memiliki izin untuk mengakses halaman ini.
            </p>
            <button
                onClick={() => window.history.back()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                Kembali
            </button>
        </div>
    )
}
