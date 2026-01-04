import * as yup from 'yup';

export interface JabatanFormData {
    levelId: number;
    namaJabatan: string;
    keterangan: string;
}

export const jabatanValidationSchema = yup.object().shape({
    levelId: yup
        .number()
        .required('Level wajib dipilih')
        .min(1, 'Level wajib dipilih')
        .typeError('Level wajib dipilih'),
    namaJabatan: yup
        .string()
        .required('Nama Jabatan wajib diisi')
        .min(3, 'Nama Jabatan minimal 3 karakter')
        .max(50, 'Nama Jabatan maksimal 50 karakter'),
    keterangan: yup
        .string()
        .transform((value) => (value === null || value === undefined ? '' : value)) // Ensure string
        .max(200, 'Keterangan maksimal 200 karakter')
        .default(''),
});
