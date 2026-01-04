import * as yup from 'yup';

export interface LevelFormData {
    divisiId: number;
    namaLevel: string;
    keterangan: string;
}

export const levelValidationSchema = yup.object({
    divisiId: yup.number().required('Divisi harus dipilih').min(1, 'Pilih Divisi valid'),
    namaLevel: yup.string().required('Nama Level harus diisi').min(3, 'Minimal 3 karakter'),
    keterangan: yup.string().required('Keterangan harus diisi'),
});
