import * as yup from 'yup';

export const spbuValidationSchema = yup.object().shape({
    namaSpbu: yup
        .string()
        .required('Nama SPBU wajib diisi')
        .min(3, 'Nama SPBU minimal 3 karakter')
        .max(100, 'Nama SPBU maksimal 100 karakter'),
    nomorSpbu: yup
        .string()
        .required('Nomor SPBU wajib diisi')
        .matches(/^[0-9.-]+$/, 'Nomor SPBU hanya boleh berisi angka, titik, dan strip')
        .min(5, 'Nomor SPBU minimal 5 karakter')
        .max(20, 'Nomor SPBU maksimal 20 karakter'),
    tanggalPendirian: yup
        .date()
        .required('Tanggal pendirian wajib diisi')
        .max(new Date(), 'Tanggal pendirian tidak boleh lebih dari hari ini')
        .typeError('Format tanggal tidak valid'),
    alamat: yup
        .string()
        .required('Alamat wajib diisi')
        .min(10, 'Alamat minimal 10 karakter')
        .max(500, 'Alamat maksimal 500 karakter'),
    luasLahan: yup
        .number()
        .required('Luas lahan wajib diisi')
        .positive('Luas lahan harus lebih dari 0')
        .max(1000000, 'Luas lahan maksimal 1.000.000')
        .typeError('Luas lahan harus berupa angka'),
    satuanLuas: yup
        .string()
        .required('Satuan luas wajib diisi')
        .oneOf(['m²', 'ha', 'are'], 'Pilih satuan luas yang valid'),
});

export type SpbuFormData = yup.InferType<typeof spbuValidationSchema>;
