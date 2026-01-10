// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";
import "../structs/ViewStructs.sol";

/**
 * @title LogisticFileFacet
 * @notice FileLo, FileLampiranFileLo, Segel, Penerimaan, FilePenerimaan CRUD
 * @dev Split from LogisticFacet to reduce contract size below 24KB
 */
contract LogisticFileFacet {
    // ==================== Events ====================
    event FileLoCreated(
        uint256 indexed fileLoId,
        uint256 indexed pengirimanId,
        uint256 indexed produkId,
        uint256 createdAt
    );
    event FileLoUpdated(uint256 indexed fileLoId, uint256 updatedAt);
    event FileLoDeleted(uint256 indexed fileLoId, uint256 deletedAt);

    event FileLampiranFileLoCreated(
        uint256 indexed id,
        uint256 indexed fileLoId,
        uint256 createdAt
    );
    event FileLampiranFileLoDeleted(uint256 indexed id, uint256 deletedAt);

    event PengirimanUpdated(uint256 indexed id, uint256 createdAt);
    event SegelCreated(
        uint256 indexed segelId,
        uint256 indexed fileLoId,
        string noSegel,
        uint256 createdAt
    );
    event SegelUpdated(uint256 indexed segelId, uint256 updatedAt);
    event SegelDeleted(uint256 indexed segelId, uint256 deletedAt);
    event DetailRencanaPembelianUpdated(
        uint256 indexed pengirimanId,
        uint256 deletedAt
    );

    event PenerimaanCreated(
        uint256 indexed penerimaanId,
        uint256 indexed fileLoId,
        uint256 createdAt
    );
    event PenerimaanDeleted(uint256 indexed penerimaanId, uint256 deletedAt);

    event FilePenerimaanCreated(
        uint256 indexed id,
        uint256 indexed penerimaanId,
        uint256 createdAt
    );
    event FilePenerimaanDeleted(uint256 indexed id, uint256 deletedAt);

    // ==================== Internal ====================
    function _onlyAdmin() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        require(ac.roles[keccak256("ADMIN_ROLE")][msg.sender], "Admin only");
    }

    function _onlyDirekturAndDirekturUtama() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        require(
            ac.roles[keccak256("DIREKTUR_ROLE")][msg.sender] ||
                ac.roles[keccak256("DIREKTUR_UTAMA_ROLE")][msg.sender],
            "Direktur or Direktur Utama only"
        );
    }

    function _onlyAdminOrOperator() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        require(
            ac.roles[keccak256("ADMIN_ROLE")][msg.sender] ||
                ac.roles[keccak256("OPERATOR_ROLE")][msg.sender],
            "Admin or Operator only"
        );
    }

    function _removeFromArray(uint256[] storage arr, uint256 _id) internal {
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == _id) {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                break;
            }
        }
    }

    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    // ==================== FileLo CRUD ====================
    function updateFileLo(
        uint256 _fileLoId,
        string calldata _ipfsHash,
        string calldata _noFaktur,
        string calldata _noLo
    ) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.FileLo storage data = s.fileLoList[_fileLoId];
        require(data.fileLoId != 0, "Not found");
        data.ipfsHash = _ipfsHash;
        data.noFaktur = _noFaktur;
        data.noLo = _noLo;
        data.updatedAt = block.timestamp;

        emit FileLoUpdated(_fileLoId, block.timestamp);
    }

    function konfirmasiPengirimanByAdmin(
        uint256 _pengirimanId,
        bool konfirmasiAdmin
    ) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.Pengiriman storage data = s.pengirimanList[_pengirimanId];
        require(data.pengirimanId != 0, "Not found");
        data.konfirmasiAdmin = konfirmasiAdmin;
        data.konfirmasiAdminBy = msg.sender;
        data.konfirmasiAdminAt = block.timestamp;
        emit PengirimanUpdated(_pengirimanId, block.timestamp);
    }

    function konfirmasiPengirimanByDirektur(
        uint256 _pengirimanId,
        bool konfirmasiDirektur
    ) external {
        _onlyDirekturAndDirekturUtama();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.Pengiriman storage data = s.pengirimanList[_pengirimanId];
        require(data.pengirimanId != 0, "Not found");
        data.konfirmasiDirektur = konfirmasiDirektur;
        data.konfirmasiDirekturBy = msg.sender;
        data.konfirmasiDirekturAt = block.timestamp;
        emit PengirimanUpdated(_pengirimanId, block.timestamp);
    }

    // ==================== FileLampiranFileLo CRUD ====================
    function createFileLampiranFileLo(
        uint256 _fileLoId,
        string calldata _ipfsHash,
        string calldata _namaFile,
        string calldata _namaDokumen,
        string calldata _mimeType,
        uint256 _fileSize
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        require(s.fileLoList[_fileLoId].fileLoId != 0, "FileLo not found");

        s.fileLampiranFileLoCounter++;
        uint256 newId = s.fileLampiranFileLoCounter;
        s.fileLampiranFileLoList[newId] = AppStorage.FileLampiranFileLo({
            fileLampiranFileLoId: newId,
            fileLoId: _fileLoId,
            ipfsHash: _ipfsHash,
            namaFile: _namaFile,
            namaDokumen: _namaDokumen,
            mimeType: _mimeType,
            fileSize: _fileSize,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.fileLampiranFileLoIds.push(newId);
        s.fileLoIdToFileLampiranFileLoIds[_fileLoId].push(newId);
        emit FileLampiranFileLoCreated(newId, _fileLoId, block.timestamp);
        return newId;
    }

    function deleteFileLampiranFileLo(uint256 _id) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.FileLampiranFileLo storage data = s.fileLampiranFileLoList[
            _id
        ];
        require(data.fileLampiranFileLoId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.fileLampiranFileLoIds, _id);
        emit FileLampiranFileLoDeleted(_id, block.timestamp);
    }

    function getFileLampiranByFileLo(
        uint256 _fileLoId
    ) external view returns (AppStorage.FileLampiranFileLo[] memory) {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        uint256[] memory ids = s.fileLoIdToFileLampiranFileLoIds[_fileLoId];
        AppStorage.FileLampiranFileLo[]
            memory result = new AppStorage.FileLampiranFileLo[](ids.length);
        for (uint256 i = 0; i < ids.length; i++)
            result[i] = s.fileLampiranFileLoList[ids[i]];
        return result;
    }

    function getFileLampiranById(
        uint256 _id
    ) external view returns (AppStorage.FileLampiranFileLo memory) {
        return AppStorage.logistikStorage().fileLampiranFileLoList[_id];
    }

    // ==================== Segel CRUD ====================
    function createSegel(
        uint256 _fileLoId,
        string calldata _noSegel
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        require(s.fileLoList[_fileLoId].fileLoId != 0, "FileLo not found");

        s.segelCounter++;
        uint256 newId = s.segelCounter;
        s.segelList[newId] = AppStorage.Segel({
            segelId: newId,
            fileLoId: _fileLoId,
            noSegel: _noSegel,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.segelIds.push(newId);
        s.fileLoIdToSegelIds[_fileLoId].push(newId);
        emit SegelCreated(newId, _fileLoId, _noSegel, block.timestamp);
        return newId;
    }

    function updateSegel(uint256 _id, string calldata _noSegel) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.Segel storage data = s.segelList[_id];
        require(data.segelId != 0 && !data.deleted, "Not found");
        data.noSegel = _noSegel;
        data.updatedAt = block.timestamp;
        emit SegelUpdated(_id, block.timestamp);
    }

    function deleteSegel(uint256 _id) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.Segel storage data = s.segelList[_id];
        require(data.segelId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.segelIds, _id);
        emit SegelDeleted(_id, block.timestamp);
    }

    function getSegelById(
        uint256 _id
    ) external view returns (AppStorage.Segel memory) {
        return AppStorage.logistikStorage().segelList[_id];
    }

    function getSegelByFileLo(
        uint256 _fileLoId
    ) external view returns (AppStorage.Segel[] memory) {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        uint256[] memory ids = s.fileLoIdToSegelIds[_fileLoId];
        AppStorage.Segel[] memory result = new AppStorage.Segel[](ids.length);
        for (uint256 i = 0; i < ids.length; i++)
            result[i] = s.segelList[ids[i]];
        return result;
    }

    // ==================== Penerimaan CRUD ====================
    function createPenerimaan(
        uint256 _fileLoId,
        uint256 _dokumenStokId,
        uint256 _tanggal
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        require(s.fileLoList[_fileLoId].fileLoId != 0, "FileLo not found");

        s.penerimaanCounter++;
        uint256 newId = s.penerimaanCounter;
        s.penerimaanList[newId] = AppStorage.Penerimaan({
            penerimaanId: newId,
            fileLoId: _fileLoId,
            dokumenStokId: _dokumenStokId,
            tanggal: _tanggal,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.penerimaanIds.push(newId);
        s.fileLoIdToPenerimaanIds[_fileLoId].push(newId);
        emit PenerimaanCreated(newId, _fileLoId, block.timestamp);
        return newId;
    }

    function deletePenerimaan(uint256 _id) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.Penerimaan storage data = s.penerimaanList[_id];
        require(data.penerimaanId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.penerimaanIds, _id);
        emit PenerimaanDeleted(_id, block.timestamp);
    }

    function getPenerimaanById(
        uint256 _id
    ) external view returns (AppStorage.Penerimaan memory) {
        return AppStorage.logistikStorage().penerimaanList[_id];
    }

    // ==================== FilePenerimaan CRUD ====================
    function createFilePenerimaan(
        uint256 _penerimaanId,
        string calldata _ipfsHash,
        string calldata _namaFile,
        string calldata _namaDokumen,
        string calldata _mimeType,
        uint256 _fileSize
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        require(
            s.penerimaanList[_penerimaanId].penerimaanId != 0,
            "Penerimaan not found"
        );

        s.filePenerimaanCounter++;
        uint256 newId = s.filePenerimaanCounter;
        s.filePenerimaanList[newId] = AppStorage.FilePenerimaan({
            filePenerimaanId: newId,
            penerimaanId: _penerimaanId,
            ipfsHash: _ipfsHash,
            namaFile: _namaFile,
            namaDokumen: _namaDokumen,
            mimeType: _mimeType,
            fileSize: _fileSize,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.filePenerimaanIds.push(newId);
        s.penerimaanIdToFilePenerimaanIds[_penerimaanId].push(newId);
        emit FilePenerimaanCreated(newId, _penerimaanId, block.timestamp);
        return newId;
    }

    function deleteFilePenerimaan(uint256 _id) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.FilePenerimaan storage data = s.filePenerimaanList[_id];
        require(data.filePenerimaanId != 0 && !data.deleted, "Not found");
        data.deleted = true;
        _removeFromArray(s.filePenerimaanIds, _id);
        emit FilePenerimaanDeleted(_id, block.timestamp);
    }

    function getFilePenerimaanByPenerimaan(
        uint256 _penerimaanId
    ) external view returns (AppStorage.FilePenerimaan[] memory) {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        uint256[] memory ids = s.penerimaanIdToFilePenerimaanIds[_penerimaanId];
        AppStorage.FilePenerimaan[]
            memory result = new AppStorage.FilePenerimaan[](ids.length);
        for (uint256 i = 0; i < ids.length; i++)
            result[i] = s.filePenerimaanList[ids[i]];
        return result;
    }

    // ==================== Utility ====================
    function getTotalFileLo() external view returns (uint256) {
        return AppStorage.logistikStorage().fileLoIds.length;
    }
    function getTotalSegel() external view returns (uint256) {
        return AppStorage.logistikStorage().segelIds.length;
    }
    function getTotalPenerimaan() external view returns (uint256) {
        return AppStorage.logistikStorage().penerimaanIds.length;
    }

    // Penerimaan
    function getPenerimaanView(
        uint256 offset,
        uint256 limit
    ) external view returns (PenerimaanView[] memory) {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.PengadaanStorage storage pengadaan = AppStorage
            .pengadaanStorage();
        AppStorage.InventoryStorage storage inv = AppStorage.inventoryStorage();

        // Inisialisasi array dengan ukuran limit (maksimal)
        PenerimaanView[] memory tempResult = new PenerimaanView[](limit);
        uint256 resultCount = 0;
        uint256 processedCount = 0;

        // Iterasi mundur (dari terbaru ke terlama) biasanya lebih baik untuk user
        for (uint256 i = s.fileLoCounter; i >= 1 && resultCount < limit; i--) {
            AppStorage.FileLo storage data = s.fileLoList[i];
            AppStorage.Pengiriman storage pen = s.pengirimanList[
                data.pengirimanId
            ];

            // Filter: Admin & Direktur sudah konfirmasi dan data tidak dihapus
            if (
                pen.konfirmasiAdmin && pen.konfirmasiDirektur && !data.deleted
            ) {
                // Lewati data sebanyak offset
                if (processedCount < offset) {
                    processedCount++;
                    continue;
                }

                uint256[] storage detailRpIds = pengadaan
                    .fileLoToDetailRencanaPembelianIds[data.fileLoId];
                if (detailRpIds.length == 0) continue;

                AppStorage.DetailRencanaPembelian storage detailRP = pengadaan
                    .detailRencanaPembelianList[detailRpIds[0]];
                AppStorage.RencanaPembelian storage rencPembelian = pengadaan
                    .rencanaPembelianList[detailRP.rencanaPembelianId];
                AppStorage.Produk storage produk = inv.produkList[
                    data.produkId
                ];
                uint256[] storage penerimaanIds = s.fileLoIdToPenerimaanIds[
                    data.fileLoId
                ];

                tempResult[resultCount] = PenerimaanView({
                    fileLoId: data.fileLoId,
                    penerimaanId: penerimaanIds.length > 0
                        ? penerimaanIds[0]
                        : 0,
                    noFaktur: data.noFaktur,
                    noLo: data.noLo,
                    tanggalPembelian: rencPembelian.tanggalPembelian,
                    namaProduk: produk.namaProduk,
                    jumlah: data.jumlah,
                    satuanJumlah: data.satuanJumlah,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                    deleted: data.deleted
                });
                resultCount++;
            }
        }

        // Resize array agar tidak ada slot kosong jika data < limit
        if (resultCount == limit) {
            return tempResult;
        } else {
            PenerimaanView[] memory finalResult = new PenerimaanView[](
                resultCount
            );
            for (uint256 j = 0; j < resultCount; j++) {
                finalResult[j] = tempResult[j];
            }
            return finalResult;
        }
    }

    function countTotalPenerimaan() external view returns (uint256) {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        uint256 total = 0;

        for (uint256 i = 1; i <= s.fileLoCounter; i++) {
            AppStorage.FileLo storage data = s.fileLoList[i];
            AppStorage.Pengiriman storage pen = s.pengirimanList[
                data.pengirimanId
            ];

            // Sesuaikan filter dengan yang ada di fungsi view
            if (
                pen.konfirmasiAdmin && pen.konfirmasiDirektur && !data.deleted
            ) {
                total++;
            }
        }
        return total;
    }

    function getPenerimaanDetailInfo(
        uint256 _fileLoId
    ) external view returns (PenerimaanDetailInfo memory) {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.PengadaanStorage storage pengadaan = AppStorage
            .pengadaanStorage();
        AppStorage.IdentityStorage storage identity = AppStorage
            .identityStorage();
        AppStorage.OrganisasiStorage storage org = AppStorage.orgStorage();

        AppStorage.FileLo storage fileLo = s.fileLoList[_fileLoId];
        require(fileLo.fileLoId != 0, "File LO not found");

        AppStorage.Pengiriman storage pengiriman = s.pengirimanList[
            fileLo.pengirimanId
        ];

        // --- PROSES PENERIMAAN ---
        uint256[] storage penerimaanIds = s.fileLoIdToPenerimaanIds[
            fileLo.fileLoId
        ];

        // Hitung yang tidak didelete untuk ukuran array yang akurat
        uint256 activePenerimaanCount = 0;
        for (uint256 i = 0; i < penerimaanIds.length; i++) {
            if (!s.penerimaanList[penerimaanIds[i]].deleted) {
                activePenerimaanCount++;
            }
        }

        AppStorage.Penerimaan[]
            memory penerimaanList = new AppStorage.Penerimaan[](
                activePenerimaanCount
            );
        uint256 pIdx = 0;
        for (uint256 i = 0; i < penerimaanIds.length; i++) {
            AppStorage.Penerimaan storage pData = s.penerimaanList[
                penerimaanIds[i]
            ];
            if (!pData.deleted) {
                penerimaanList[pIdx] = pData; // Langsung salin dari storage ke memory
                pIdx++;
            }
        }

        // --- PROSES DATA PENDUKUNG ---
        uint256[] storage drpIds = pengadaan.fileLoToDetailRencanaPembelianIds[
            _fileLoId
        ];
        require(drpIds.length > 0, "Detail Rencana Pembelian not found");

        AppStorage.DetailRencanaPembelian storage detailRP = pengadaan
            .detailRencanaPembelianList[drpIds[0]];
        AppStorage.RencanaPembelian storage rencPembelian = pengadaan
            .rencanaPembelianList[detailRP.rencanaPembelianId];
        AppStorage.Ktp storage ktp = identity.ktpMember[
            rencPembelian.walletMember
        ];
        AppStorage.Spbu storage spbu = org.spbuList[rencPembelian.spbuId];

        uint256[] storage pajakIds = pengadaan
            .rencanaPembelianToPajakPembelianIds[
                rencPembelian.rencanaPembelianId
            ];
        require(pajakIds.length > 0, "Pajak not found");
        AppStorage.PajakPembelian storage pajak = pengadaan.pajakPembelianList[
            pajakIds[0]
        ];

        // --- PROSES PEMBAYARAN ---
        uint256[] storage pembayaranIds = pengadaan
            .rencanaPembelianToPembayaranIds[rencPembelian.rencanaPembelianId];
        FileLoDetailPembayaranId[]
            memory pembayaranList = new FileLoDetailPembayaranId[](
                pembayaranIds.length
            );

        for (uint256 i = 0; i < pembayaranIds.length; i++) {
            AppStorage.Pembayaran storage pem = pengadaan.pembayaranList[
                pembayaranIds[i]
            ];
            pembayaranList[i] = FileLoDetailPembayaranId({
                pembayaranId: pem.pembayaranId,
                rencanaPembelianId: pem.rencanaPembelianId,
                walletMember: pem.walletMember,
                noCekBg: pem.noCekBg,
                noRekening: pem.noRekening,
                namaRekening: pem.namaRekening,
                namaBank: pem.namaBank,
                totalBayar: pem.totalBayar
            });
        }

        return
            PenerimaanDetailInfo({
                fileLoId: fileLo.fileLoId,
                detailRencanaPembelianId: detailRP.detailRencanaPembelianId,
                pengirimanId: pengiriman.pengirimanId,
                tanggalPengiriman: pengiriman.tanggal,
                rencanaPembelianId: rencPembelian.rencanaPembelianId,
                deskripsi: rencPembelian.deskripsi,
                namaSpbu: spbu.namaSpbu,
                pegawaiPengusul: ktp.nama,
                tanggalPembelian: rencPembelian.tanggalPembelian,
                kodePembelian: rencPembelian.kodePembelian,
                grandTotal: rencPembelian.grandTotal,
                ppn: pajak.ppn,
                ppbkb: pajak.ppbkb,
                pph: pajak.pph,
                harga: detailRP.harga,
                totalHarga: detailRP.subTotal,
                jumlah: detailRP.jumlah,
                satuanJumlah: detailRP.satuanJumlah,
                noFaktur: fileLo.noFaktur,
                noLo: fileLo.noLo,
                noDo: pengiriman.noDo,
                noPol: pengiriman.noPolisi,
                createdAt: fileLo.createdAt,
                updatedAt: fileLo.updatedAt,
                deleted: fileLo.deleted,
                ipfsHash: fileLo.ipfsHash,
                pembayaranList: pembayaranList,
                penerimaanList: penerimaanList
            });
    }

    function getPenerimaanCreateDetailInfoDombak(
        uint256 _fileLoId
    ) external view returns (PenerimaanCreateDetail memory) {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.InventoryStorage storage inventory = AppStorage
            .inventoryStorage();

        AppStorage.FileLo storage fileLo = s.fileLoList[_fileLoId];
        require(fileLo.fileLoId != 0, "File LO not found");

        // --- PROSES PENERIMAAN ---
        AppStorage.Penerimaan[] memory penerimaanList;
        {
            uint256[] storage pIds = s.fileLoIdToPenerimaanIds[fileLo.fileLoId];
            uint256 activeCount = 0;
            for (uint256 i = 0; i < pIds.length; i++) {
                if (!s.penerimaanList[pIds[i]].deleted) activeCount++;
            }
            penerimaanList = new AppStorage.Penerimaan[](activeCount);
            uint256 pIdx = 0;
            for (uint256 i = 0; i < pIds.length; i++) {
                if (!s.penerimaanList[pIds[i]].deleted) {
                    penerimaanList[pIdx] = s.penerimaanList[pIds[i]];
                    pIdx++;
                }
            }
        }

        // --- PROSES DOMBAK ---
        DombakPenerimaanCreateDetail[] memory dombakList;
        uint256 drpIdHolder; // Untuk menyimpan ID agar stack tetap lega
        {
            AppStorage.PengadaanStorage storage pengadaan = AppStorage
                .pengadaanStorage();
            uint256[] storage drpIds = pengadaan
                .fileLoToDetailRencanaPembelianIds[_fileLoId];
            require(drpIds.length > 0, "Detail Rencana Pembelian not found");
            drpIdHolder = drpIds[0];

            uint256 stokInvId = inventory.produkToStokInventoryId[
                pengadaan.detailRencanaPembelianList[drpIdHolder].produkId
            ];
            require(stokInvId > 0, "Stok Inventory not found");

            uint256[] storage stokDombakIds = inventory
                .stokInventoryToStokInventoryDombakIds[stokInvId];
            dombakList = new DombakPenerimaanCreateDetail[](
                stokDombakIds.length
            );

            for (uint256 i = 0; i < stokDombakIds.length; i++) {
                AppStorage.StokInventoryDombak storage sid = inventory
                    .stokInventoryDombakList[stokDombakIds[i]];
                dombakList[i] = DombakPenerimaanCreateDetail({
                    dombakId: sid.dombakId,
                    namaDombak: inventory.dombakList[sid.dombakId].namaDombak,
                    stok: sid.stok
                });
            }
        }

        // --- PROSES DATA FINAL ---
        AppStorage.PengadaanStorage storage p = AppStorage.pengadaanStorage();
        AppStorage.DetailRencanaPembelian storage drp = p
            .detailRencanaPembelianList[drpIdHolder];
        AppStorage.RencanaPembelian storage rp = p.rencanaPembelianList[
            drp.rencanaPembelianId
        ];
        AppStorage.AttendaceStorage storage attendance = AppStorage
            .attendanceStorage();

        // Mapping Jam Kerja
        AppStorage.JamKerja[] memory jamKerjaList = new AppStorage.JamKerja[](
            attendance.jamKerjaIds.length
        );
        for (uint256 i = 0; i < attendance.jamKerjaIds.length; i++) {
            jamKerjaList[i] = attendance.jamKerjaList[
                attendance.jamKerjaIds[i]
            ];
        }

        return
            PenerimaanCreateDetail({
                fileLoId: fileLo.fileLoId,
                detailRencanaPembelianId: drp.detailRencanaPembelianId,
                pengirimanId: fileLo.pengirimanId,
                tanggalPengiriman: s
                    .pengirimanList[fileLo.pengirimanId]
                    .tanggal,
                rencanaPembelianId: drp.rencanaPembelianId,
                deskripsi: rp.deskripsi,
                namaSpbu: AppStorage.orgStorage().spbuList[rp.spbuId].namaSpbu,
                pegawaiPengusul: AppStorage
                    .identityStorage()
                    .ktpMember[rp.walletMember]
                    .nama,
                tanggalPembelian: rp.tanggalPembelian,
                kodePembelian: rp.kodePembelian,
                harga: drp.harga,
                totalHarga: drp.subTotal,
                jumlah: drp.jumlah,
                satuanJumlah: drp.satuanJumlah,
                noFaktur: fileLo.noFaktur,
                noLo: fileLo.noLo,
                noDo: s.pengirimanList[fileLo.pengirimanId].noDo,
                noPol: s.pengirimanList[fileLo.pengirimanId].noPolisi,
                createdAt: fileLo.createdAt,
                updatedAt: fileLo.updatedAt,
                deleted: fileLo.deleted,
                ipfsHash: fileLo.ipfsHash,
                dombakList: dombakList,
                jamKerjaList: jamKerjaList
            });
    }
}
