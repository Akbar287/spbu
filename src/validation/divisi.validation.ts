import * as yup from 'yup';

export interface DivisiFormData {
    spbuId: number;
    namaDivisi: string;
    keterangan: string;
}

export const divisiValidationSchema = yup.object({
    spbuId: yup.number().required('SPBU harus dipilih').min(1, 'P Pilih SPBU valid'),
    namaDivisi: yup.string().required('Nama Divisi harus diisi').min(3, 'Minimal 3 karakter'),
    keterangan: yup.string().required('Keterangan harus diisi'),
});
