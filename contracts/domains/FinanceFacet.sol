// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";

/**
 * @title FinanceFacet
 * @notice Mengelola keuangan SPBU dalam Diamond Pattern
 * @dev Entities: PettyCash, FilePettyCash, Penarikan, FilePenarikan, PenjualanPenarikan
 *
 * Mapping Relations:
 * - spbuToPettyCashList, pettyCashToFilePettyCashList
 * - penerimaanToPettyCashList, pettyCashToPenerimaanList
 * - penarikanToFilePenarikanList, penjualanToPenarikanList
 * - walletToPenarikanList, penjualanToPenjualanPenarikanList
 * - walletToPenjualanPenarikanList, walletToAcceptedByOnPenarikanList
 *
 * Nilai uang menggunakan uint256 scaled x100 untuk 2 desimal
 */
contract FinanceFacet {
    // ==================== Events ====================

    // PettyCash Events
    event PettyCashCreated(
        uint256 indexed pettyCashId,
        uint256 indexed spbuId,
        AppStorage.jenisTransaksi jenis,
        uint256 createdAt
    );
    event PettyCashUpdated(uint256 indexed pettyCashId, uint256 updatedAt);
    event PettyCashDeleted(uint256 indexed pettyCashId, uint256 deletedAt);

    // FilePettyCash Events
    event FilePettyCashCreated(
        uint256 indexed filePettyCashId,
        uint256 indexed pettyCashId,
        uint256 createdAt
    );
    event FilePettyCashDeleted(
        uint256 indexed filePettyCashId,
        uint256 deletedAt
    );

    // Penarikan Events
    event PenarikanCreated(
        uint256 indexed penarikanId,
        uint256 indexed penjualanId,
        address indexed walletMember,
        uint256 createdAt
    );
    event PenarikanUpdated(uint256 indexed penarikanId, uint256 updatedAt);
    event PenarikanDeleted(uint256 indexed penarikanId, uint256 deletedAt);
    event PenarikanAccepted(
        uint256 indexed penarikanId,
        address indexed acceptedBy,
        uint256 acceptedAt
    );

    // FilePenarikan Events
    event FilePenarikanCreated(
        uint256 indexed filePenarikanId,
        uint256 indexed penarikanId,
        uint256 createdAt
    );
    event FilePenarikanDeleted(
        uint256 indexed filePenarikanId,
        uint256 deletedAt
    );

    // PenjualanPenarikan Events
    event PenjualanPenarikanCreated(
        uint256 indexed penjualanPenarikanId,
        uint256 indexed penjualanId,
        address indexed walletMember,
        uint256 createdAt
    );
    event PenjualanPenarikanDeleted(
        uint256 indexed penjualanPenarikanId,
        uint256 deletedAt
    );

    // PettyCash-Penerimaan Link Event
    event PettyCashPenerimaanLinked(
        uint256 indexed pettyCashId,
        uint256 indexed penerimaanId,
        uint256 createdAt
    );

    // ==================== Internal Access Control ====================

    function _onlyAdmin() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        bytes32 ADMIN_ROLE = keccak256("ADMIN_ROLE");
        require(ac.roles[ADMIN_ROLE][msg.sender], "FinanceFacet: Admin only");
    }

    function _onlyDirektur() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        bytes32 DIREKTUR_ROLE = keccak256("DIREKTUR_ROLE");
        require(
            ac.roles[DIREKTUR_ROLE][msg.sender],
            "FinanceFacet: Direktur only"
        );
    }

    function _onlyAdminOrOperator() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        bytes32 ADMIN_ROLE = keccak256("ADMIN_ROLE");
        bytes32 OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
        require(
            ac.roles[ADMIN_ROLE][msg.sender] ||
                ac.roles[OPERATOR_ROLE][msg.sender],
            "FinanceFacet: Admin or Operator only"
        );
    }

    // ==================== Internal Helper: Swap and Pop ====================

    function _removeFromArray(uint256[] storage arr, uint256 _id) internal {
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == _id) {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                break;
            }
        }
    }

    // ==================== PettyCash CRUD ====================

    function createPettyCash(
        uint256 _spbuId,
        string calldata _noKode,
        string calldata _noBukti,
        string calldata _deskripsi,
        uint256 _tanggal,
        uint256 _total,
        AppStorage.jenisTransaksi _jenisTransaksi
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();

        s.pettyCashCounter++;
        uint256 newId = s.pettyCashCounter;

        s.pettyCashList[newId] = AppStorage.PettyCash({
            pettyCashId: newId,
            spbuId: _spbuId,
            noKode: _noKode,
            noBukti: _noBukti,
            deskripsi: _deskripsi,
            tanggal: _tanggal,
            total: _total,
            jenisTransaksi: _jenisTransaksi,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        // Add to global ID array and relation
        s.pettyCashIds.push(newId);
        s.spbuToPettyCashList[_spbuId].push(newId);

        emit PettyCashCreated(newId, _spbuId, _jenisTransaksi, block.timestamp);
        return newId;
    }

    function updatePettyCash(
        uint256 _pettyCashId,
        string calldata _noKode,
        string calldata _noBukti,
        string calldata _deskripsi,
        uint256 _tanggal,
        uint256 _total,
        AppStorage.jenisTransaksi _jenisTransaksi
    ) external {
        _onlyAdmin();
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();

        AppStorage.PettyCash storage data = s.pettyCashList[_pettyCashId];
        require(data.pettyCashId != 0, "FinanceFacet: Not found");
        require(!data.deleted, "FinanceFacet: Deleted");

        data.noKode = _noKode;
        data.noBukti = _noBukti;
        data.deskripsi = _deskripsi;
        data.tanggal = _tanggal;
        data.total = _total;
        data.jenisTransaksi = _jenisTransaksi;
        data.updatedAt = block.timestamp;

        emit PettyCashUpdated(_pettyCashId, block.timestamp);
    }

    function deletePettyCash(uint256 _pettyCashId) external {
        _onlyAdmin();
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();

        AppStorage.PettyCash storage data = s.pettyCashList[_pettyCashId];
        require(data.pettyCashId != 0, "FinanceFacet: Not found");
        require(!data.deleted, "FinanceFacet: Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;

        _removeFromArray(s.pettyCashIds, _pettyCashId);
        _removeFromArray(s.spbuToPettyCashList[data.spbuId], _pettyCashId);

        emit PettyCashDeleted(_pettyCashId, block.timestamp);
    }

    function getPettyCashById(
        uint256 _pettyCashId
    ) external view returns (AppStorage.PettyCash memory) {
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();
        require(
            s.pettyCashList[_pettyCashId].pettyCashId != 0,
            "FinanceFacet: Not found"
        );
        return s.pettyCashList[_pettyCashId];
    }

    function getPettyCashBySpbu(
        uint256 _spbuId
    ) external view returns (AppStorage.PettyCash[] memory) {
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();
        uint256[] memory ids = s.spbuToPettyCashList[_spbuId];

        AppStorage.PettyCash[] memory result = new AppStorage.PettyCash[](
            ids.length
        );
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.pettyCashList[ids[i]];
        }
        return result;
    }

    function getAllPettyCash(
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (AppStorage.PettyCash[] memory result, uint256 total)
    {
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();
        uint256[] memory allIds = s.pettyCashIds;
        uint256 totalLength = allIds.length;

        if (_offset >= totalLength || totalLength == 0) {
            return (new AppStorage.PettyCash[](0), totalLength);
        }

        uint256 remaining = totalLength - _offset;
        uint256 resultLength = remaining < _limit ? remaining : _limit;
        result = new AppStorage.PettyCash[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = s.pettyCashList[allIds[_offset + i]];
        }

        return (result, totalLength);
    }

    // ==================== FilePettyCash CRUD ====================

    function createFilePettyCash(
        uint256 _pettyCashId,
        string calldata _ipfsHash,
        string calldata _namaFile,
        string calldata _namaDokumen,
        string calldata _mimeType,
        uint256 _fileSize
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();

        require(
            s.pettyCashList[_pettyCashId].pettyCashId != 0,
            "FinanceFacet: PettyCash not found"
        );

        s.filePettyCashCounter++;
        uint256 newId = s.filePettyCashCounter;

        s.filePettyCashList[newId] = AppStorage.FilePettyCash({
            filePettyCashId: newId,
            pettyCashId: _pettyCashId,
            ipfsHash: _ipfsHash,
            namaFile: _namaFile,
            namaDokumen: _namaDokumen,
            mimeType: _mimeType,
            fileSize: _fileSize,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        // Add to global ID array and relation
        s.filePettyCashIds.push(newId);
        s.pettyCashToFilePettyCashList[_pettyCashId].push(newId);

        emit FilePettyCashCreated(newId, _pettyCashId, block.timestamp);
        return newId;
    }

    function deleteFilePettyCash(uint256 _filePettyCashId) external {
        _onlyAdmin();
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();

        AppStorage.FilePettyCash storage data = s.filePettyCashList[
            _filePettyCashId
        ];
        require(data.filePettyCashId != 0, "FinanceFacet: Not found");
        require(!data.deleted, "FinanceFacet: Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;

        _removeFromArray(s.filePettyCashIds, _filePettyCashId);
        _removeFromArray(
            s.pettyCashToFilePettyCashList[data.pettyCashId],
            _filePettyCashId
        );

        emit FilePettyCashDeleted(_filePettyCashId, block.timestamp);
    }

    function getFilePettyCashByPettyCash(
        uint256 _pettyCashId
    ) external view returns (AppStorage.FilePettyCash[] memory) {
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();
        uint256[] memory ids = s.pettyCashToFilePettyCashList[_pettyCashId];

        AppStorage.FilePettyCash[]
            memory result = new AppStorage.FilePettyCash[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.filePettyCashList[ids[i]];
        }
        return result;
    }

    // ==================== PettyCash-Penerimaan Linking ====================

    function linkPettyCashToPenerimaan(
        uint256 _pettyCashId,
        uint256 _penerimaanId
    ) external {
        _onlyAdmin();
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();

        require(
            s.pettyCashList[_pettyCashId].pettyCashId != 0,
            "FinanceFacet: PettyCash not found"
        );

        s.pettyCashToPenerimaanList[_pettyCashId].push(_penerimaanId);
        s.penerimaanToPettyCashList[_penerimaanId].push(_pettyCashId);

        emit PettyCashPenerimaanLinked(
            _pettyCashId,
            _penerimaanId,
            block.timestamp
        );
    }

    function getPenerimaanByPettyCash(
        uint256 _pettyCashId
    ) external view returns (uint256[] memory) {
        return
            AppStorage.keuanganStorage().pettyCashToPenerimaanList[
                _pettyCashId
            ];
    }

    function getPettyCashByPenerimaan(
        uint256 _penerimaanId
    ) external view returns (uint256[] memory) {
        return
            AppStorage.keuanganStorage().penerimaanToPettyCashList[
                _penerimaanId
            ];
    }

    // ==================== Penarikan CRUD ====================

    function createPenarikan(
        uint256 _penjualanId,
        uint256 _tanggal,
        string calldata _namaBank,
        string calldata _noReferensi,
        string calldata _metodeTransfer,
        uint256 _totalUang
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();

        s.penarikanCounter++;
        uint256 newId = s.penarikanCounter;

        s.penarikanList[newId] = AppStorage.Penarikan({
            penarikanId: newId,
            penjualanId: _penjualanId,
            walletMember: msg.sender,
            tanggal: _tanggal,
            namaBank: _namaBank,
            noReferensi: _noReferensi,
            metodeTransfer: _metodeTransfer,
            accepted: false,
            acceptedBy: address(0),
            acceptedAt: 0,
            totalUang: _totalUang,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        // Add to global ID array and relations
        s.penarikanIds.push(newId);
        s.penjualanToPenarikanList[_penjualanId].push(newId);
        s.walletToPenarikanList[msg.sender].push(newId);

        emit PenarikanCreated(newId, _penjualanId, msg.sender, block.timestamp);
        return newId;
    }

    function updatePenarikan(
        uint256 _penarikanId,
        string calldata _namaBank,
        string calldata _noReferensi,
        string calldata _metodeTransfer,
        uint256 _totalUang
    ) external {
        _onlyAdmin();
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();

        AppStorage.Penarikan storage data = s.penarikanList[_penarikanId];
        require(data.penarikanId != 0, "FinanceFacet: Not found");
        require(!data.deleted, "FinanceFacet: Deleted");

        data.namaBank = _namaBank;
        data.noReferensi = _noReferensi;
        data.metodeTransfer = _metodeTransfer;
        data.totalUang = _totalUang;
        data.updatedAt = block.timestamp;

        emit PenarikanUpdated(_penarikanId, block.timestamp);
    }

    function deletePenarikan(uint256 _penarikanId) external {
        _onlyAdmin();
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();

        AppStorage.Penarikan storage data = s.penarikanList[_penarikanId];
        require(data.penarikanId != 0, "FinanceFacet: Not found");
        require(!data.deleted, "FinanceFacet: Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;

        _removeFromArray(s.penarikanIds, _penarikanId);
        _removeFromArray(
            s.penjualanToPenarikanList[data.penjualanId],
            _penarikanId
        );
        _removeFromArray(
            s.walletToPenarikanList[data.walletMember],
            _penarikanId
        );

        emit PenarikanDeleted(_penarikanId, block.timestamp);
    }

    function acceptPenarikan(uint256 _penarikanId) external {
        _onlyDirektur();
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();

        AppStorage.Penarikan storage data = s.penarikanList[_penarikanId];
        require(data.penarikanId != 0, "FinanceFacet: Not found");
        require(!data.deleted, "FinanceFacet: Deleted");
        require(!data.accepted, "FinanceFacet: Already accepted");

        data.accepted = true;
        data.acceptedBy = msg.sender;
        data.acceptedAt = block.timestamp;
        data.updatedAt = block.timestamp;

        s.walletToAcceptedByOnPenarikanList[msg.sender].push(_penarikanId);

        emit PenarikanAccepted(_penarikanId, msg.sender, block.timestamp);
    }

    function getPenarikanById(
        uint256 _penarikanId
    ) external view returns (AppStorage.Penarikan memory) {
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();
        require(
            s.penarikanList[_penarikanId].penarikanId != 0,
            "FinanceFacet: Not found"
        );
        return s.penarikanList[_penarikanId];
    }

    function getPenarikanByPenjualan(
        uint256 _penjualanId
    ) external view returns (AppStorage.Penarikan[] memory) {
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();
        uint256[] memory ids = s.penjualanToPenarikanList[_penjualanId];

        AppStorage.Penarikan[] memory result = new AppStorage.Penarikan[](
            ids.length
        );
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.penarikanList[ids[i]];
        }
        return result;
    }

    function getPenarikanByWallet(
        address _wallet
    ) external view returns (AppStorage.Penarikan[] memory) {
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();
        uint256[] memory ids = s.walletToPenarikanList[_wallet];

        AppStorage.Penarikan[] memory result = new AppStorage.Penarikan[](
            ids.length
        );
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.penarikanList[ids[i]];
        }
        return result;
    }

    function getAllPenarikan(
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (AppStorage.Penarikan[] memory result, uint256 total)
    {
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();
        uint256[] memory allIds = s.penarikanIds;
        uint256 totalLength = allIds.length;

        if (_offset >= totalLength || totalLength == 0) {
            return (new AppStorage.Penarikan[](0), totalLength);
        }

        uint256 remaining = totalLength - _offset;
        uint256 resultLength = remaining < _limit ? remaining : _limit;
        result = new AppStorage.Penarikan[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = s.penarikanList[allIds[_offset + i]];
        }

        return (result, totalLength);
    }

    // ==================== FilePenarikan CRUD ====================

    function createFilePenarikan(
        uint256 _penarikanId,
        string calldata _ipfsHash,
        string calldata _namaFile,
        string calldata _namaDokumen,
        string calldata _mimeType,
        uint256 _fileSize
    ) external returns (uint256) {
        _onlyAdminOrOperator();
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();

        require(
            s.penarikanList[_penarikanId].penarikanId != 0,
            "FinanceFacet: Penarikan not found"
        );

        s.filePenarikanCounter++;
        uint256 newId = s.filePenarikanCounter;

        s.filePenarikanList[newId] = AppStorage.FilePenarikan({
            filePenarikanId: newId,
            penarikanId: _penarikanId,
            ipfsHash: _ipfsHash,
            namaFile: _namaFile,
            namaDokumen: _namaDokumen,
            mimeType: _mimeType,
            fileSize: _fileSize,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        // Add to global ID array and relation
        s.filePenarikanIds.push(newId);
        s.penarikanToFilePenarikanList[_penarikanId].push(newId);

        emit FilePenarikanCreated(newId, _penarikanId, block.timestamp);
        return newId;
    }

    function deleteFilePenarikan(uint256 _filePenarikanId) external {
        _onlyAdmin();
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();

        AppStorage.FilePenarikan storage data = s.filePenarikanList[
            _filePenarikanId
        ];
        require(data.filePenarikanId != 0, "FinanceFacet: Not found");
        require(!data.deleted, "FinanceFacet: Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;

        _removeFromArray(s.filePenarikanIds, _filePenarikanId);
        _removeFromArray(
            s.penarikanToFilePenarikanList[data.penarikanId],
            _filePenarikanId
        );

        emit FilePenarikanDeleted(_filePenarikanId, block.timestamp);
    }

    function getFilePenarikanByPenarikan(
        uint256 _penarikanId
    ) external view returns (AppStorage.FilePenarikan[] memory) {
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();
        uint256[] memory ids = s.penarikanToFilePenarikanList[_penarikanId];

        AppStorage.FilePenarikan[]
            memory result = new AppStorage.FilePenarikan[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.filePenarikanList[ids[i]];
        }
        return result;
    }

    // ==================== PenjualanPenarikan CRUD ====================

    function createPenjualanPenarikan(
        uint256 _penjualanId,
        address _walletMember,
        uint256 _totalTarikanUang
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();

        s.penjualanPenarikanCounter++;
        uint256 newId = s.penjualanPenarikanCounter;

        s.penjualanPenarikanList[newId] = AppStorage.PenjualanPenarikan({
            penjualanPenarikanId: newId,
            penjualanId: _penjualanId,
            walletMember: _walletMember,
            totalTarikanUang: _totalTarikanUang,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        // Add to global ID array and relations
        s.penjualanPenarikanIds.push(newId);
        s.penjualanToPenjualanPenarikanList[_penjualanId].push(newId);
        s.walletToPenjualanPenarikanList[_walletMember].push(newId);

        emit PenjualanPenarikanCreated(
            newId,
            _penjualanId,
            _walletMember,
            block.timestamp
        );
        return newId;
    }

    function deletePenjualanPenarikan(uint256 _penjualanPenarikanId) external {
        _onlyAdmin();
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();

        AppStorage.PenjualanPenarikan storage data = s.penjualanPenarikanList[
            _penjualanPenarikanId
        ];
        require(data.penjualanPenarikanId != 0, "FinanceFacet: Not found");
        require(!data.deleted, "FinanceFacet: Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;

        _removeFromArray(s.penjualanPenarikanIds, _penjualanPenarikanId);
        _removeFromArray(
            s.penjualanToPenjualanPenarikanList[data.penjualanId],
            _penjualanPenarikanId
        );
        _removeFromArray(
            s.walletToPenjualanPenarikanList[data.walletMember],
            _penjualanPenarikanId
        );

        emit PenjualanPenarikanDeleted(_penjualanPenarikanId, block.timestamp);
    }

    function getPenjualanPenarikanByPenjualan(
        uint256 _penjualanId
    ) external view returns (AppStorage.PenjualanPenarikan[] memory) {
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();
        uint256[] memory ids = s.penjualanToPenjualanPenarikanList[
            _penjualanId
        ];

        AppStorage.PenjualanPenarikan[]
            memory result = new AppStorage.PenjualanPenarikan[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.penjualanPenarikanList[ids[i]];
        }
        return result;
    }

    function getPenjualanPenarikanByWallet(
        address _wallet
    ) external view returns (AppStorage.PenjualanPenarikan[] memory) {
        AppStorage.KeuanganStorage storage s = AppStorage.keuanganStorage();
        uint256[] memory ids = s.walletToPenjualanPenarikanList[_wallet];

        AppStorage.PenjualanPenarikan[]
            memory result = new AppStorage.PenjualanPenarikan[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.penjualanPenarikanList[ids[i]];
        }
        return result;
    }

    // ==================== Utility Functions ====================

    function getTotalPettyCash() external view returns (uint256) {
        return AppStorage.keuanganStorage().pettyCashIds.length;
    }

    function getTotalPenarikan() external view returns (uint256) {
        return AppStorage.keuanganStorage().penarikanIds.length;
    }

    function getTotalPenjualanPenarikan() external view returns (uint256) {
        return AppStorage.keuanganStorage().penjualanPenarikanIds.length;
    }
}
