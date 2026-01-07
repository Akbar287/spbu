import * as yup from 'yup';

export const pembayaranSchema = yup.object().shape({
    namaBank: yup
        .string()
        .required('Nama Bank wajib diisi')
        .min(3, 'Nama Bank minimal 3 karakter'),
    noRekening: yup
        .string()
        .required('Nomor Rekening wajib diisi')
        .min(5, 'Nomor Rekening minimal 5 karakter'),
    namaRekening: yup
        .string()
        .required('Nama Pemilik Rekening wajib diisi')
        .min(3, 'Nama Pemilik Rekening minimal 3 karakter'),
    noCekBg: yup
        .string()
        .optional()
        .default(''),
    totalBayar: yup
        .number()
        .transform((value) => (isNaN(value) ? undefined : value))
        .required('Nominal wajib diisi')
        .min(1, 'Nominal harus lebih dari 0')
});

export type PembayaranValues = yup.InferType<typeof pembayaranSchema>;
