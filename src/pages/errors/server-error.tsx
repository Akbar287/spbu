'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error
    reset: () => void
}) {
    useEffect(() => {
        console.error('Error boundary:', error)
    }, [error])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
            <h1 className="text-4xl font-bold mb-4">500 - Ada Kesalahan</h1>
            <p className="mb-6">
                Sedang terjadi kesalahan dalam proses data. Mohon Coba lagi
                nanti ya...
            </p>
            <button
                onClick={() => reset()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                Coba Lagi
            </button>
        </div>
    )
}
