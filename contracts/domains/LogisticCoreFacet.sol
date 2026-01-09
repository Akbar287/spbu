// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";
import "../structs/ViewStructs.sol";

/**
 * @title LogisticCoreFacet
 * @notice Ms2, Pengiriman, Supir, DetailRencanaPembelianMs2 CRUD
 * @dev Split from LogisticFacet to reduce contract size below 24KB
 */
contract LogisticCoreFacet {
    // ==================== Events ====================
    event Ms2Created(
        uint256 indexed ms2Id,
        address indexed walletMember,
        uint256 createdAt
    );
    event Ms2KonfirmasiSelesai(
        uint256 indexed ms2Id,
        address indexed konfirmasiBy,
        uint256 konfirmasiAt
    );
    event PengirimanCreated(
        uint256 indexed pengirimanId,
        address indexed walletMember,
        uint256 createdAt
    );
    event PengirimanEdit(uint256 indexed pengirimanId, uint256 createdAt);
    // ==================== Internal ====================
    function _onlyAdmin() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        require(ac.roles[keccak256("ADMIN_ROLE")][msg.sender], "Admin only");
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

    // ==================== Ms2 CRUD ====================
    function createMs2(
        uint256 _tanggal,
        string calldata _kodeSms,
        uint256[] calldata _detailRencanaPembelianIds,
        uint256[] calldata _jamKerjaIds
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        s.ms2Counter++;
        uint256 newId = s.ms2Counter;

        s.ms2List[newId] = AppStorage.Ms2({
            ms2Id: newId,
            walletMember: msg.sender,
            tanggal: _tanggal,
            kodeSms: _kodeSms,
            konfirmasiSelesai: false,
            konfirmasiBy: address(0),
            konfirmasiAt: 0,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.ms2Ids.push(newId);
        s.walletToMs2Ids[msg.sender].push(newId);

        for (uint256 i = 0; i < _detailRencanaPembelianIds.length; i++) {
            s.detailRencanaPembelianMs2Counter++;
            AppStorage.DetailRencanaPembelianMs2 memory data = AppStorage
                .DetailRencanaPembelianMs2({
                    detailRencanaPembelianMs2Id: s
                        .detailRencanaPembelianMs2Counter,
                    ms2Id: newId,
                    detailRencanaPembelianId: _detailRencanaPembelianIds[i],
                    jamKerjaId: _jamKerjaIds[i],
                    konfirmasiPengiriman: false,
                    konfirmasiPengirimanBy: address(0),
                    konfirmasiPengirimanAt: 0,
                    createdAt: block.timestamp,
                    updatedAt: block.timestamp,
                    deleted: false
                });
            s.detailRencanaPembelianMs2List[
                data.detailRencanaPembelianMs2Id
            ] = data;
            s.detailRencanaPembelianMs2Ids.push(
                data.detailRencanaPembelianMs2Id
            );
            s
                .detailRencanaPembelianToDetailRencanaPembelianMs2Ids[
                    _detailRencanaPembelianIds[i]
                ]
                .push(data.detailRencanaPembelianMs2Id);
            s.ms2IdToDetailRencanaPembelianMs2Ids[newId].push(
                data.detailRencanaPembelianMs2Id
            );
            s.jamKerjaToDetailRencanaPembelianMs2Ids[_jamKerjaIds[i]].push(
                data.detailRencanaPembelianMs2Id
            );
        }

        emit Ms2Created(newId, msg.sender, block.timestamp);
        return newId;
    }

    function konfirmasiMs2ToPengiriman(
        uint256 ms2Id,
        string calldata nomorDeliveryOrder,
        string calldata nomorPolisi,
        string calldata catatan
    ) external {
        _onlyAdmin();
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.PengadaanStorage storage pengadaan = AppStorage
            .pengadaanStorage();
        require(s.ms2List[ms2Id].ms2Id == ms2Id, "Ms2 not found");
        require(
            !s.ms2List[ms2Id].konfirmasiSelesai,
            "Ms2 already konfirmasi selesai"
        );
        s.ms2List[ms2Id].konfirmasiSelesai = true;
        s.ms2List[ms2Id].konfirmasiBy = msg.sender;
        s.ms2List[ms2Id].konfirmasiAt = block.timestamp;
        s.ms2List[ms2Id].updatedAt = block.timestamp;
        s.walletToKonfirmasiSelesaiOnMs2[msg.sender].push(ms2Id);

        AppStorage.DetailRencanaPembelianMs2 storage detailMs2 = s
            .detailRencanaPembelianMs2List[
                s.ms2IdToDetailRencanaPembelianMs2Ids[ms2Id][0]
            ];
        AppStorage.DetailRencanaPembelian storage detailRP = pengadaan
            .detailRencanaPembelianList[detailMs2.detailRencanaPembelianId];

        s.pengirimanCounter++;
        AppStorage.Pengiriman memory data = AppStorage.Pengiriman({
            pengirimanId: s.pengirimanCounter,
            walletMember: address(0),
            tanggal: block.timestamp,
            noDo: nomorDeliveryOrder,
            noPolisi: nomorPolisi,
            catatan: catatan,
            ms2: true,
            ms2By: msg.sender,
            ms2At: block.timestamp,
            konfirmasiAdmin: false,
            konfirmasiDirektur: false,
            konfirmasiAdminBy: address(0),
            konfirmasiAdminAt: 0,
            konfirmasiDirekturBy: address(0),
            konfirmasiDirekturAt: 0,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });
        s.pengirimanList[data.pengirimanId] = data;
        s.pengirimanIds.push(data.pengirimanId);
        s.ms2IdToPengirimanIds[ms2Id].push(data.pengirimanId);
        s.pengirimanIdToMs2Ids[data.pengirimanId].push(ms2Id);
        s.walletToPengirimanIds[msg.sender].push(data.pengirimanId);
        s.pengirimanIdToRencanaPembelianIds[data.pengirimanId].push(
            detailRP.rencanaPembelianId
        );

        for (
            uint256 i = 0;
            i < s.ms2IdToDetailRencanaPembelianMs2Ids[ms2Id].length;
            i++
        ) {
            AppStorage.DetailRencanaPembelian storage drp = pengadaan
                .detailRencanaPembelianList[
                    s
                        .detailRencanaPembelianMs2List[
                            s.ms2IdToDetailRencanaPembelianMs2Ids[ms2Id][i]
                        ]
                        .detailRencanaPembelianId
                ];

            // 1. Increment counter
            s.fileLoCounter++;
            uint256 newId = s.fileLoCounter;

            // 2. Langsung masukkan ke mapping storage
            s.fileLoList[newId] = AppStorage.FileLo({
                fileLoId: newId,
                pengirimanId: data.pengirimanId,
                produkId: drp.produkId,
                jumlah: drp.jumlah,
                satuanJumlah: drp.satuanJumlah,
                noFaktur: "",
                noLo: "",
                ipfsHash: "",
                createdAt: block.timestamp,
                updatedAt: block.timestamp,
                deleted: false
            });

            // 3. Gunakan referensi storage untuk push ke array/mapping lain agar efisien
            s.pengirimanToFileLoIds[data.pengirimanId].push(newId);
            s.produkToFileLoIds[drp.produkId].push(newId);
            s.fileLoIds.push(newId);
            pengadaan.fileLoToDetailRencanaPembelianIds[newId].push(
                drp.detailRencanaPembelianId
            );

            pengadaan
                .detailRencanaPembelianToFileLoIds[drp.detailRencanaPembelianId]
                .push(newId);

            s
                .detailRencanaPembelianMs2List[
                    s.ms2IdToDetailRencanaPembelianMs2Ids[ms2Id][i]
                ]
                .konfirmasiPengiriman = true;
            s
                .detailRencanaPembelianMs2List[
                    s.ms2IdToDetailRencanaPembelianMs2Ids[ms2Id][i]
                ]
                .konfirmasiPengirimanBy = msg.sender;
            s
                .detailRencanaPembelianMs2List[
                    s.ms2IdToDetailRencanaPembelianMs2Ids[ms2Id][i]
                ]
                .konfirmasiPengirimanAt = block.timestamp;
            s
                .detailRencanaPembelianMs2List[
                    s.ms2IdToDetailRencanaPembelianMs2Ids[ms2Id][i]
                ]
                .updatedAt = block.timestamp;
            s
                .walletToKonfirmasiPengirimanOnDetailRencanaPembelianMs2[
                    msg.sender
                ]
                .push(s.ms2IdToDetailRencanaPembelianMs2Ids[ms2Id][i]);
        }

        emit PengirimanCreated(data.pengirimanId, msg.sender, block.timestamp);
    }

    // Pengiriman
    function getAllPengiriman(
        uint256 offset,
        uint256 limit
    ) external view returns (PengirimanView[] memory) {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        AppStorage.PengadaanStorage storage p = AppStorage.pengadaanStorage();
        AppStorage.InventoryStorage storage inv = AppStorage.inventoryStorage();

        // Count non-deleted pengiriman that still need confirmation
        // Skip only when BOTH konfirmasiAdmin AND konfirmasiDirektur are true
        uint256 count = 0;
        for (uint256 i = 0; i < s.pengirimanIds.length; i++) {
            uint256 pengirimanId = s.pengirimanIds[i];
            if (
                !s.pengirimanList[pengirimanId].deleted &&
                !(s.pengirimanList[pengirimanId].konfirmasiAdmin &&
                    s.pengirimanList[pengirimanId].konfirmasiDirektur)
            ) {
                count++;
            }
        }

        // Apply pagination
        uint256 start = offset > count ? count : offset;
        uint256 end = (start + limit) > count ? count : (start + limit);
        uint256 resultSize = end - start;

        PengirimanView[] memory result = new PengirimanView[](resultSize);
        uint256 idx = 0;
        uint256 skipped = 0;

        for (
            uint256 i = 0;
            i < s.pengirimanIds.length && idx < resultSize;
            i++
        ) {
            uint256 pengirimanId = s.pengirimanIds[i];
            AppStorage.Pengiriman storage pengiriman = s.pengirimanList[
                pengirimanId
            ];

            if (
                !pengiriman.deleted &&
                !(pengiriman.konfirmasiAdmin && pengiriman.konfirmasiDirektur)
            ) {
                if (skipped < offset) {
                    skipped++;
                    continue;
                }

                // Get linked MS2 to get products
                uint256[] storage ms2Ids = s.pengirimanIdToMs2Ids[pengirimanId];
                uint256 productCount = 0;

                // Count products from all linked MS2s
                for (uint256 m = 0; m < ms2Ids.length; m++) {
                    productCount += s
                        .ms2IdToDetailRencanaPembelianMs2Ids[ms2Ids[m]]
                        .length;
                }

                // Build products array
                ProdukMenuMs2View[] memory products = new ProdukMenuMs2View[](
                    productCount
                );
                uint256 prodIdx = 0;

                for (uint256 m = 0; m < ms2Ids.length; m++) {
                    uint256 ms2Id = ms2Ids[m];
                    uint256[] storage detailMs2Ids = s
                        .ms2IdToDetailRencanaPembelianMs2Ids[ms2Id];

                    for (uint256 j = 0; j < detailMs2Ids.length; j++) {
                        AppStorage.DetailRencanaPembelianMs2
                            storage detailMs2 = s.detailRencanaPembelianMs2List[
                                detailMs2Ids[j]
                            ];
                        AppStorage.DetailRencanaPembelian storage detailRP = p
                            .detailRencanaPembelianList[
                                detailMs2.detailRencanaPembelianId
                            ];
                        AppStorage.Produk storage produk = inv.produkList[
                            detailRP.produkId
                        ];

                        if (produk.produkId != 0) {
                            products[prodIdx] = ProdukMenuMs2View({
                                produkId: produk.produkId,
                                namaProduk: produk.namaProduk,
                                totalJumlah: detailRP.jumlah,
                                totalPembelian: 1
                            });
                            prodIdx++;
                        }
                    }
                }

                result[idx] = PengirimanView({
                    pengirimanId: pengiriman.pengirimanId,
                    tanggal: pengiriman.tanggal,
                    noDo: pengiriman.noDo,
                    noPol: pengiriman.noPolisi,
                    produk: products,
                    createdAt: pengiriman.createdAt,
                    updatedAt: pengiriman.updatedAt,
                    deleted: pengiriman.deleted
                });
                idx++;
            }
        }

        return result;
    }

    function getCounterPengiriman() external view returns (uint256) {
        AppStorage.LogistikStorage storage s = AppStorage.logistikStorage();
        uint256 count = 0;
        for (uint256 i = 0; i < s.pengirimanIds.length; i++) {
            uint256 pengirimanId = s.pengirimanIds[i];
            if (
                !s.pengirimanList[pengirimanId].deleted &&
                !(s.pengirimanList[pengirimanId].konfirmasiAdmin &&
                    s.pengirimanList[pengirimanId].konfirmasiDirektur)
            ) {
                count++;
            }
        }
        return count;
    }

    function getPengirimanById(
        uint256 _pengirimanId
    ) external view returns (PengirimanById memory) {
        AppStorage.LogistikStorage storage log = AppStorage.logistikStorage();
        AppStorage.PengadaanStorage storage p = AppStorage.pengadaanStorage();
        AppStorage.InventoryStorage storage inv = AppStorage.inventoryStorage();

        AppStorage.Pengiriman storage pengiriman = log.pengirimanList[
            _pengirimanId
        ];

        // Get MS2 IDs linked to this pengiriman
        uint256[] storage ms2Ids = log.pengirimanIdToMs2Ids[_pengirimanId];

        // Count total detail items
        uint256 totalCount = 0;
        for (uint256 m = 0; m < ms2Ids.length; m++) {
            totalCount += log
                .ms2IdToDetailRencanaPembelianMs2Ids[ms2Ids[m]]
                .length;
        }

        PengirimanByIdForListFileLo[]
            memory fileLoList = new PengirimanByIdForListFileLo[](totalCount);
        uint256 idx = 0;

        // Iterate through MS2s and their details
        for (uint256 m = 0; m < ms2Ids.length; m++) {
            uint256 ms2Id = ms2Ids[m];
            uint256[] storage detailMs2Ids = log
                .ms2IdToDetailRencanaPembelianMs2Ids[ms2Id];

            for (uint256 i = 0; i < detailMs2Ids.length; i++) {
                AppStorage.DetailRencanaPembelianMs2 storage detailMs2 = log
                    .detailRencanaPembelianMs2List[detailMs2Ids[i]];
                AppStorage.DetailRencanaPembelian storage detailRP = p
                    .detailRencanaPembelianList[
                        detailMs2.detailRencanaPembelianId
                    ];
                AppStorage.Produk storage produk = inv.produkList[
                    detailRP.produkId
                ];

                uint256[] storage fileLoIds = p
                    .detailRencanaPembelianToFileLoIds[
                        detailRP.detailRencanaPembelianId
                    ];
                bool hasFile = fileLoIds.length > 0;
                AppStorage.FileLo storage fileLo = hasFile
                    ? log.fileLoList[fileLoIds[0]]
                    : log.fileLoList[0];

                fileLoList[idx] = PengirimanByIdForListFileLo({
                    fileLoId: hasFile ? fileLo.fileLoId : 0,
                    detailRencanaPembelianId: detailRP.detailRencanaPembelianId,
                    produkId: produk.produkId,
                    namaProduk: produk.namaProduk,
                    jumlah: detailRP.jumlah,
                    satuanJumlah: detailRP.satuanJumlah,
                    noFaktur: hasFile ? fileLo.noFaktur : "",
                    noLo: hasFile ? fileLo.noLo : ""
                });
                idx++;
            }
        }

        return
            PengirimanById({
                pengirimanId: pengiriman.pengirimanId,
                walletMember: pengiriman.walletMember,
                tanggal: pengiriman.tanggal,
                noDo: pengiriman.noDo,
                noPolisi: pengiriman.noPolisi,
                catatan: pengiriman.catatan,
                ms2: pengiriman.ms2,
                ms2By: pengiriman.ms2By,
                ms2At: pengiriman.ms2At,
                konfirmasiAdmin: pengiriman.konfirmasiAdmin,
                konfirmasiDirektur: pengiriman.konfirmasiDirektur,
                konfirmasiAdminBy: pengiriman.konfirmasiAdminBy,
                konfirmasiAdminAt: pengiriman.konfirmasiAdminAt,
                konfirmasiDirekturBy: pengiriman.konfirmasiDirekturBy,
                konfirmasiDirekturAt: pengiriman.konfirmasiDirekturAt,
                createdAt: pengiriman.createdAt,
                updatedAt: pengiriman.updatedAt,
                deleted: pengiriman.deleted,
                fileLoList: fileLoList
            });
    }

    function getPengirimShowFileLo(
        uint256 _fileLoId
    ) external view returns (FileLoDetailId memory) {
        AppStorage.LogistikStorage storage log = AppStorage.logistikStorage();
        AppStorage.PengadaanStorage storage p = AppStorage.pengadaanStorage();
        AppStorage.OrganisasiStorage storage org = AppStorage.orgStorage();
        AppStorage.InventoryStorage storage inv = AppStorage.inventoryStorage();

        AppStorage.FileLo storage fileLo = log.fileLoList[_fileLoId];
        require(fileLo.fileLoId != 0 && !fileLo.deleted, "Not found");

        uint256[] storage detailRencanaPembelianIds = p
            .fileLoToDetailRencanaPembelianIds[_fileLoId];

        AppStorage.DetailRencanaPembelian
            storage detailRP = detailRencanaPembelianIds.length > 0
                ? p.detailRencanaPembelianList[detailRencanaPembelianIds[0]]
                : p.detailRencanaPembelianList[0];

        AppStorage.RencanaPembelian storage rencanaPembelian = p
            .rencanaPembelianList[detailRP.rencanaPembelianId];

        // Perbaikan pengambilan pajak (mengambil item pertama dari relasi)
        uint256[] storage pajakIds = p.rencanaPembelianToPajakPembelianIds[
            rencanaPembelian.rencanaPembelianId
        ];
        AppStorage.PajakPembelian storage pajakPembelian = pajakIds.length > 0
            ? p.pajakPembelianList[pajakIds[0]]
            : p.pajakPembelianList[0];

        // --- LOOP PEMBAYARAN ---
        uint256[] storage pembayaranIds = p.rencanaPembelianToPembayaranIds[
            rencanaPembelian.rencanaPembelianId
        ];
        FileLoDetailPembayaranId[]
            memory pembayaranList = new FileLoDetailPembayaranId[](
                pembayaranIds.length
            );

        for (uint256 i = 0; i < pembayaranIds.length; i++) {
            AppStorage.Pembayaran storage pembayaran = p.pembayaranList[
                pembayaranIds[i]
            ];
            pembayaranList[i] = FileLoDetailPembayaranId({
                pembayaranId: pembayaran.pembayaranId,
                rencanaPembelianId: pembayaran.rencanaPembelianId,
                walletMember: pembayaran.walletMember,
                noCekBg: pembayaran.noCekBg,
                noRekening: pembayaran.noRekening,
                namaRekening: pembayaran.namaRekening,
                namaBank: pembayaran.namaBank,
                totalBayar: pembayaran.totalBayar
            });
        }

        // --- LOOP PRODUK ---
        uint256[] storage drpIds = p
            .rencanaPembelianToDetailRencanaPembelianIds[
                rencanaPembelian.rencanaPembelianId
            ];
        FileLoDetailProduk[] memory produkList = new FileLoDetailProduk[](
            drpIds.length
        );

        for (uint256 i = 0; i < drpIds.length; i++) {
            AppStorage.DetailRencanaPembelian storage drp = p
                .detailRencanaPembelianList[drpIds[i]];
            AppStorage.Produk storage produk = inv.produkList[drp.produkId];
            produkList[i] = FileLoDetailProduk({
                detailRencanaPembelianId: drp.detailRencanaPembelianId,
                produkId: produk.produkId,
                namaProduk: produk.namaProduk,
                harga: drp.harga,
                jumlah: drp.jumlah,
                subTotal: drp.subTotal,
                satuanJumlah: drp.satuanJumlah
            });
        }

        return
            FileLoDetailId({
                fileLoId: _fileLoId,
                detailRencanaPembelianId: detailRP.detailRencanaPembelianId,
                pengirimanId: fileLo.pengirimanId,
                rencanaPembelianId: detailRP.rencanaPembelianId,
                namaSpbu: org.spbuList[rencanaPembelian.spbuId].namaSpbu,
                walletMember: rencanaPembelian.walletMember,
                tanggalPembelian: rencanaPembelian.tanggalPembelian,
                kodePembelian: rencanaPembelian.kodePembelian,
                deskripsi: rencanaPembelian.deskripsi,
                grandTotal: rencanaPembelian.grandTotal,
                ppn: pajakPembelian.ppn,
                ppbkb: pajakPembelian.ppbkb,
                pph: pajakPembelian.pph,
                jumlah: detailRP.jumlah,
                satuanJumlah: detailRP.satuanJumlah,
                noFaktur: fileLo.noFaktur,
                noLo: fileLo.noLo,
                createdAt: fileLo.createdAt,
                updatedAt: fileLo.updatedAt,
                deleted: fileLo.deleted,
                ipfsHash: fileLo.ipfsHash,
                produkList: produkList,
                pembayaranList: pembayaranList
            });
    }

    function editCatatanPengiriman(
        uint256 _pengirimanId,
        string calldata catatan
    ) external {
        AppStorage.Pengiriman storage pengiriman = AppStorage
            .logistikStorage()
            .pengirimanList[_pengirimanId];

        require(
            !pengiriman.deleted &&
                !pengiriman.konfirmasiAdmin &&
                !pengiriman.konfirmasiDirektur,
            "Pengiriman tidak valid"
        );

        pengiriman.catatan = catatan;
        pengiriman.updatedAt = block.timestamp;

        emit PengirimanEdit(_pengirimanId, block.timestamp);
    }

    function editPenerimaPengiriman(
        uint256 _pengirimanId,
        uint256 _ktpId
    ) external {
        _onlyAdminOrOperator();

        AppStorage.LogistikStorage storage log = AppStorage.logistikStorage();
        AppStorage.IdentityStorage storage identity = AppStorage
            .identityStorage();

        AppStorage.Pengiriman storage pengiriman = log.pengirimanList[
            _pengirimanId
        ];
        AppStorage.Ktp storage ktp = identity.ktp[_ktpId];

        require(
            !pengiriman.deleted &&
                !pengiriman.konfirmasiAdmin &&
                !pengiriman.konfirmasiDirektur,
            "Pengiriman tidak valid"
        );
        require(!ktp.deleted && ktp.verified, "Member tidak valid");

        pengiriman.walletMember = ktp.walletAddress;
        pengiriman.updatedAt = block.timestamp;

        emit PengirimanEdit(_pengirimanId, block.timestamp);
    }
}
