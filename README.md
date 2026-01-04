# ⛽ SPBU Management System

<div align="center">

![Solidity](https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=Ethereum&logoColor=white)
![Hardhat](https://img.shields.io/badge/Hardhat-FFF100?style=for-the-badge&logo=hardhat&logoColor=black)

**Sistem Manajemen SPBU Berbasis Blockchain dengan Diamond Pattern**

[Demo](#demo) • [Fitur](#-fitur) • [Instalasi](#-instalasi) • [Arsitektur](#-arsitektur) • [Kontribusi](#-kontribusi)

</div>

---

## 📖 Tentang Project

SPBU Management System adalah aplikasi manajemen stasiun pengisian bahan bakar umum (SPBU) yang terintegrasi dengan teknologi blockchain Ethereum. Aplikasi ini menggunakan **Diamond Pattern (EIP-2535)** untuk smart contract yang modular dan upgradeable.

### Mengapa Blockchain?

- 🔐 **Immutable Records** - Data transaksi tidak dapat dimanipulasi
- 🔍 **Transparency** - Semua operasi dapat diaudit
- 🛡️ **Security** - Akses dikontrol dengan role-based permission
- ⚡ **Decentralized** - Tidak bergantung pada single point of failure

---

## ✨ Fitur

### 🏢 Manajemen Organisasi
- **SPBU** - Kelola data stasiun SPBU (nama, alamat, koordinat)
- **Divisi** - Struktur organisasi divisi
- **Jabatan** - Manajemen jabatan karyawan
- **Level** - Tingkatan level pengguna

### 👥 Human Capital
- Manajemen data karyawan
- Pengaturan role & permission
- Absensi dan kehadiran

### ⏰ Attendance System
- **Hari** - Konfigurasi hari kerja/libur
- **Jam Kerja** - Pengaturan shift kerja per SPBU
- **Status Kehadiran** - Status hadir, izin, sakit, dll
- **Status Presensi** - Check-in/check-out tracking

### 📦 Inventory & Logistics
- Manajemen stok BBM
- Transfer antar lokasi
- Monitoring level tangki

### 💰 Point of Sales
- Transaksi penjualan
- Laporan harian
- Integrasi dengan inventory

### 📋 Procurement
- Perencanaan pembelian
- Approval workflow
- Konfigurasi pajak pembelian

### 💳 Finance
- Setoran bank
- Closing penjualan
- Laporan keuangan

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, TailwindCSS, Framer Motion |
| **Routing** | React Router v6 |
| **Form** | React Hook Form + Yup Validation |
| **Web3** | wagmi, viem |
| **Smart Contract** | Solidity 0.8.33, Hardhat |
| **Pattern** | Diamond Pattern (EIP-2535) |
| **Local Blockchain** | Ganache |

---

## 📦 Instalasi

### Prerequisites

- Node.js >= 18.x
- Yarn atau npm
- Ganache (untuk local blockchain)

### 1. Clone Repository

```bash
git clone https://github.com/Akbar287/spbu.git
cd spbu
```

### 2. Install Dependencies

```bash
yarn install
# atau
npm install
```

### 3. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` dan isi:
```env
DEPLOYER_PRIVATE_KEY=your_private_key_from_ganache
```

### 4. Start Ganache

Jalankan Ganache GUI atau CLI pada port `7545`

### 5. Deploy Smart Contracts

```bash
# Compile contracts
npx hardhat compile

# Deploy to Ganache
npx hardhat run scripts/deploy.js --network ganache

# Register facet selectors
node scripts/register-facets.cjs

# Setup admin role
node scripts/manage-roles.cjs

# (Optional) Seed initial data
node scripts/seed-data.cjs
```

### 6. Update Frontend Config

Update `src/contracts/config.ts` dengan alamat contract dari deployment.

### 7. Start Development Server

```bash
yarn start
# atau
npm start
```

Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Arsitektur

### Diamond Pattern Structure

```
MainDiamond (Proxy)
├── AccessControlFacet      # Role & permission management
├── OrganizationFacet       # SPBU, Divisi, Jabatan, Level
├── IdentityMemberFacet     # User management
├── IdentityNotifFacet      # Notifications
├── HumanCapitalFacet       # Employee management
├── AttendanceConfigFacet   # Hari, JamKerja, StatusKehadiran
├── AttendanceRecordFacet   # Attendance records
├── AssetCoreFacet          # Asset management
├── AssetFileFacet          # Asset files
├── InventoryCoreFacet      # Inventory management
├── InventoryDocsFacet      # Inventory documents
├── InventoryTransferFacet  # Stock transfers
├── LogisticCoreFacet       # Logistics core
├── LogisticFileFacet       # Logistics files
├── PengadaanCoreFacet      # Procurement & Tax settings
├── PengadaanPaymentFacet   # Payment processing
├── PointOfSalesCoreFacet   # POS core
├── PointOfSalesSalesFacet  # Sales transactions
├── FinanceFacet            # Financial operations
└── QualityControlFacet     # QC operations
```

### Project Structure

```
spbu/
├── contracts/              # Solidity smart contracts
│   ├── domains/           # Facet contracts
│   ├── storage/           # AppStorage (shared state)
│   └── MainDiamond.sol    # Diamond proxy
├── scripts/               # Deployment & utility scripts
├── src/
│   ├── components/        # Reusable React components
│   ├── config/            # App configuration
│   ├── contracts/         # ABIs & contract config
│   ├── pages/             # Page components
│   │   ├── Konfigurasi/   # Configuration pages
│   │   ├── Stok/          # Stock management
│   │   ├── Setoran/       # Deposit management
│   │   └── ...
│   ├── router/            # Route definitions
│   ├── types/             # TypeScript types
│   └── validation/        # Form validation schemas
├── deployments/           # Deployment artifacts
└── hardhat.config.cjs     # Hardhat configuration
```

---

## 🔧 Scripts

| Command | Description |
|---------|-------------|
| `yarn start` | Start development server |
| `yarn build` | Build for production |
| `yarn test` | Run tests |
| `npx hardhat compile` | Compile smart contracts |
| `node scripts/register-facets.cjs` | Register facet selectors |
| `node scripts/manage-roles.cjs` | Setup admin roles |
| `node scripts/seed-data.cjs` | Seed initial data |
| `node scripts/export-abis.cjs` | Export ABIs to frontend |

---

## 🔐 Role-Based Access Control

| Role | Description |
|------|-------------|
| `ADMIN_ROLE` | Full system access |
| `MANAGER_ROLE` | Management operations |
| `OPERATOR_ROLE` | Daily operations |
| `VIEWER_ROLE` | Read-only access |

---

## 📸 Screenshots

*Coming soon*

---

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan buka issue atau submit pull request.

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buka Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📧 Contact

Akbar - [@Akbar287](https://github.com/Akbar287)

Project Link: [https://github.com/Akbar287/spbu](https://github.com/Akbar287/spbu)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ and ☕

</div>
