import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Format date to Indonesian format
export const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

// Format number with thousand separator
export const formatNumber = (num: number) => {
    return num.toLocaleString('id-ID');
};

// Calculate age of SPBU
export const calculateAge = (date: Date) => {
    const now = new Date();
    const years = now.getFullYear() - date.getFullYear();
    return years;
};

// Format address to show first 6 and last 4 characters
export const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

