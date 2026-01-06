// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "../storage/AppStorage.sol";

contract CmsFacet {
    // ==================== Events ====================
    // Kategori Events
    event KategoriCreated(
        uint256 indexed kategoriId,
        string kategori,
        uint256 timestamp
    );
    event KategoriUpdated(
        uint256 indexed kategoriId,
        string kategori,
        uint256 timestamp
    );
    event KategoriDeleted(uint256 indexed kategoriId, uint256 timestamp);

    // Tag Events
    event TagCreated(uint256 indexed tagId, string nama, uint256 timestamp);
    event TagUpdated(uint256 indexed tagId, string nama, uint256 timestamp);
    event TagDeleted(uint256 indexed tagId, uint256 timestamp);

    // Artikel Events
    event ArtikelCreated(
        uint256 indexed artikelId,
        string title,
        address walletMember,
        uint256 timestamp
    );
    event ArtikelUpdated(
        uint256 indexed artikelId,
        string title,
        uint256 timestamp
    );
    event ArtikelDeleted(uint256 indexed artikelId, uint256 timestamp);

    // ==================== Modifiers ====================
    function _onlyAdmin() internal view {
        AppStorage.AccessControlStorage storage ac = AppStorage
            .accessControlStorage();
        require(ac.roles[keccak256("ADMIN_ROLE")][msg.sender], "Admin only");
    }

    // ==================== Kategori CRUD ====================
    function createKategori(
        string memory _kategori,
        string memory _deskripsi
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.CmsStorage storage s = AppStorage.cmsStorage();

        s.kategoriIdCounter++;
        uint256 newId = s.kategoriIdCounter;

        s.kategoriList[newId] = AppStorage.Kategori({
            kategoriId: newId,
            kategori: _kategori,
            deskripsi: _deskripsi,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.kategoriIdList.push(newId);
        emit KategoriCreated(newId, _kategori, block.timestamp);
        return newId;
    }

    function updateKategori(
        uint256 _id,
        string memory _kategori,
        string memory _deskripsi
    ) external {
        _onlyAdmin();
        AppStorage.CmsStorage storage s = AppStorage.cmsStorage();
        AppStorage.Kategori storage data = s.kategoriList[_id];
        require(data.kategoriId != 0, "Kategori not found");
        require(!data.deleted, "Kategori deleted");

        data.kategori = _kategori;
        data.deskripsi = _deskripsi;
        data.updatedAt = block.timestamp;

        emit KategoriUpdated(_id, _kategori, block.timestamp);
    }

    function deleteKategori(uint256 _id) external {
        _onlyAdmin();
        AppStorage.CmsStorage storage s = AppStorage.cmsStorage();
        AppStorage.Kategori storage data = s.kategoriList[_id];
        require(data.kategoriId != 0, "Kategori not found");
        require(!data.deleted, "Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;

        emit KategoriDeleted(_id, block.timestamp);
    }

    function getKategoriById(
        uint256 _id
    ) external view returns (AppStorage.Kategori memory) {
        return AppStorage.cmsStorage().kategoriList[_id];
    }

    function getAllKategori(
        uint256 offset,
        uint256 limit
    ) external view returns (AppStorage.Kategori[] memory) {
        AppStorage.CmsStorage storage s = AppStorage.cmsStorage();
        uint256[] storage ids = s.kategoriIdList;

        uint256 count = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (!s.kategoriList[ids[i]].deleted) count++;
        }

        if (offset >= count) return new AppStorage.Kategori[](0);

        uint256 resultSize = (offset + limit > count) ? count - offset : limit;
        AppStorage.Kategori[] memory result = new AppStorage.Kategori[](
            resultSize
        );

        uint256 currentIndex = 0;
        uint256 added = 0;

        for (uint256 i = 0; i < ids.length && added < resultSize; i++) {
            if (!s.kategoriList[ids[i]].deleted) {
                if (currentIndex >= offset) {
                    result[added] = s.kategoriList[ids[i]];
                    added++;
                }
                currentIndex++;
            }
        }

        return result;
    }

    function getCountKategori() external view returns (uint256) {
        AppStorage.CmsStorage storage s = AppStorage.cmsStorage();
        uint256 count = 0;
        for (uint256 i = 0; i < s.kategoriIdList.length; i++) {
            if (!s.kategoriList[s.kategoriIdList[i]].deleted) count++;
        }
        return count;
    }

    // ==================== Tag CRUD ====================
    function createTag(
        string memory _nama,
        string memory _deskripsi
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.CmsStorage storage s = AppStorage.cmsStorage();

        s.tagIdCounter++;
        uint256 newId = s.tagIdCounter;

        s.tagList[newId] = AppStorage.Tag({
            tagId: newId,
            nama: _nama,
            deskripsi: _deskripsi,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        s.tagIdList.push(newId);
        emit TagCreated(newId, _nama, block.timestamp);
        return newId;
    }

    function updateTag(
        uint256 _id,
        string memory _nama,
        string memory _deskripsi
    ) external {
        _onlyAdmin();
        AppStorage.CmsStorage storage s = AppStorage.cmsStorage();
        AppStorage.Tag storage data = s.tagList[_id];
        require(data.tagId != 0, "Tag not found");
        require(!data.deleted, "Tag deleted");

        data.nama = _nama;
        data.deskripsi = _deskripsi;
        data.updatedAt = block.timestamp;

        emit TagUpdated(_id, _nama, block.timestamp);
    }

    function deleteTag(uint256 _id) external {
        _onlyAdmin();
        AppStorage.CmsStorage storage s = AppStorage.cmsStorage();
        AppStorage.Tag storage data = s.tagList[_id];
        require(data.tagId != 0, "Tag not found");
        require(!data.deleted, "Already deleted");

        data.deleted = true;
        data.updatedAt = block.timestamp;

        emit TagDeleted(_id, block.timestamp);
    }

    function getTagById(
        uint256 _id
    ) external view returns (AppStorage.Tag memory) {
        return AppStorage.cmsStorage().tagList[_id];
    }

    function getAllTag(
        uint256 offset,
        uint256 limit
    ) external view returns (AppStorage.Tag[] memory) {
        AppStorage.CmsStorage storage s = AppStorage.cmsStorage();
        uint256[] storage ids = s.tagIdList;

        uint256 count = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (!s.tagList[ids[i]].deleted) count++;
        }

        if (offset >= count) return new AppStorage.Tag[](0);

        uint256 resultSize = (offset + limit > count) ? count - offset : limit;
        AppStorage.Tag[] memory result = new AppStorage.Tag[](resultSize);

        uint256 currentIndex = 0;
        uint256 added = 0;

        for (uint256 i = 0; i < ids.length && added < resultSize; i++) {
            if (!s.tagList[ids[i]].deleted) {
                if (currentIndex >= offset) {
                    result[added] = s.tagList[ids[i]];
                    added++;
                }
                currentIndex++;
            }
        }

        return result;
    }

    function getCountTag() external view returns (uint256) {
        AppStorage.CmsStorage storage s = AppStorage.cmsStorage();
        uint256 count = 0;
        for (uint256 i = 0; i < s.tagIdList.length; i++) {
            if (!s.tagList[s.tagIdList[i]].deleted) count++;
        }
        return count;
    }

    // ==================== Artikel CRUD ====================
    function createArtikel(
        string memory _title,
        string memory _content,
        uint256[] memory _kategoriIds,
        uint256[] memory _tagIds,
        bool _active
    ) external returns (uint256) {
        _onlyAdmin();
        AppStorage.CmsStorage storage s = AppStorage.cmsStorage();

        s.artikelIdCounter++;
        uint256 newId = s.artikelIdCounter;

        s.artikelList[newId] = AppStorage.Artikel({
            artikelId: newId,
            title: _title,
            content: _content,
            active: _active,
            walletMember: msg.sender,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deleted: false
        });

        for (uint256 i = 0; i < _kategoriIds.length; i++) {
            s.kategoriToArtikelList[_kategoriIds[i]].push(newId);
        }
        for (uint256 i = 0; i < _tagIds.length; i++) {
            s.tagToArtikelList[_tagIds[i]].push(newId);
        }
        s.artikelToKategoriList[newId] = _kategoriIds;
        s.artikelToTagList[newId] = _tagIds;
        s.artikelIdList.push(newId);
        emit ArtikelCreated(newId, _title, msg.sender, block.timestamp);
        return newId;
    }

    function updateArtikel(
        uint256 _id,
        string memory _title,
        uint256[] memory _kategoriIds,
        uint256[] memory _tagIds,
        string memory _content,
        bool _active
    ) external {
        _onlyAdmin();
        AppStorage.CmsStorage storage s = AppStorage.cmsStorage();
        AppStorage.Artikel storage data = s.artikelList[_id];
        require(data.artikelId != 0, "Artikel not found");
        require(!data.deleted, "Artikel deleted");

        for (uint256 i = 0; i < s.kategoriToArtikelList[_id].length; i++) {
            if (s.kategoriToArtikelList[_id][i] == _id) {
                _removeFromArray(s.kategoriToArtikelList[_id], _id);
            }
        }

        for (uint256 i = 0; i < s.tagToArtikelList[_id].length; i++) {
            if (s.tagToArtikelList[_id][i] == _id) {
                _removeFromArray(s.tagToArtikelList[_id], _id);
            }
        }

        _removeFromArray(s.artikelToKategoriList[_id], _id);
        _removeFromArray(s.artikelToTagList[_id], _id);
        s.artikelToKategoriList[_id] = _kategoriIds;
        s.artikelToTagList[_id] = _tagIds;

        data.title = _title;
        data.content = _content;
        data.active = _active;
        data.updatedAt = block.timestamp;

        emit ArtikelUpdated(_id, _title, block.timestamp);
    }

    function deleteArtikel(uint256 _id) external {
        _onlyAdmin();
        AppStorage.CmsStorage storage s = AppStorage.cmsStorage();
        AppStorage.Artikel storage data = s.artikelList[_id];
        require(data.artikelId != 0, "Artikel not found");
        require(!data.deleted, "Already deleted");

        for (uint256 i = 0; i < s.kategoriToArtikelList[_id].length; i++) {
            if (s.kategoriToArtikelList[_id][i] == _id) {
                _removeFromArray(s.kategoriToArtikelList[_id], _id);
            }
        }

        for (uint256 i = 0; i < s.tagToArtikelList[_id].length; i++) {
            if (s.tagToArtikelList[_id][i] == _id) {
                _removeFromArray(s.tagToArtikelList[_id], _id);
            }
        }

        _removeFromArray(s.artikelToKategoriList[_id], _id);
        _removeFromArray(s.artikelToTagList[_id], _id);
        _removeFromArray(s.artikelIdList, _id);

        data.deleted = true;
        data.updatedAt = block.timestamp;

        emit ArtikelDeleted(_id, block.timestamp);
    }

    function getArtikelById(
        uint256 _id
    ) external view returns (AppStorage.Artikel memory) {
        return AppStorage.cmsStorage().artikelList[_id];
    }

    function getAllArtikel(
        uint256 offset,
        uint256 limit
    ) external view returns (AppStorage.Artikel[] memory) {
        AppStorage.CmsStorage storage s = AppStorage.cmsStorage();
        uint256[] storage ids = s.artikelIdList;

        uint256 count = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (!s.artikelList[ids[i]].deleted) count++;
        }

        if (offset >= count) return new AppStorage.Artikel[](0);

        uint256 resultSize = (offset + limit > count) ? count - offset : limit;
        AppStorage.Artikel[] memory result = new AppStorage.Artikel[](
            resultSize
        );

        uint256 currentIndex = 0;
        uint256 added = 0;

        for (uint256 i = 0; i < ids.length && added < resultSize; i++) {
            if (!s.artikelList[ids[i]].deleted) {
                if (currentIndex >= offset) {
                    result[added] = s.artikelList[ids[i]];
                    added++;
                }
                currentIndex++;
            }
        }

        return result;
    }

    function getCountArtikel() external view returns (uint256) {
        AppStorage.CmsStorage storage s = AppStorage.cmsStorage();
        uint256 count = 0;
        for (uint256 i = 0; i < s.artikelIdList.length; i++) {
            if (!s.artikelList[s.artikelIdList[i]].deleted) count++;
        }
        return count;
    }

    // ==================== Artikel-Kategori Relation ====================
    function addArtikelToKategori(
        uint256 _artikelId,
        uint256 _kategoriId
    ) external {
        _onlyAdmin();
        AppStorage.CmsStorage storage s = AppStorage.cmsStorage();
        require(s.artikelList[_artikelId].artikelId != 0, "Artikel not found");
        require(
            s.kategoriList[_kategoriId].kategoriId != 0,
            "Kategori not found"
        );

        s.artikelToKategoriList[_artikelId].push(_kategoriId);
        s.kategoriToArtikelList[_kategoriId].push(_artikelId);
    }

    function removeArtikelFromKategori(
        uint256 _artikelId,
        uint256 _kategoriId
    ) external {
        _onlyAdmin();
        AppStorage.CmsStorage storage s = AppStorage.cmsStorage();

        _removeFromArray(s.artikelToKategoriList[_artikelId], _kategoriId);
        _removeFromArray(s.kategoriToArtikelList[_kategoriId], _artikelId);
    }

    function getArtikelsByKategori(
        uint256 _kategoriId
    ) external view returns (uint256[] memory) {
        return AppStorage.cmsStorage().kategoriToArtikelList[_kategoriId];
    }

    function getKategoriesByArtikel(
        uint256 _artikelId
    ) external view returns (uint256[] memory) {
        return AppStorage.cmsStorage().artikelToKategoriList[_artikelId];
    }

    // ==================== Artikel-Tag Relation ====================
    function addTagToArtikel(uint256 _artikelId, uint256 _tagId) external {
        _onlyAdmin();
        AppStorage.CmsStorage storage s = AppStorage.cmsStorage();
        require(s.artikelList[_artikelId].artikelId != 0, "Artikel not found");
        require(s.tagList[_tagId].tagId != 0, "Tag not found");

        s.artikelToTagList[_artikelId].push(_tagId);
        s.tagToArtikelList[_tagId].push(_artikelId);
    }

    function removeTagFromArtikel(uint256 _artikelId, uint256 _tagId) external {
        _onlyAdmin();
        AppStorage.CmsStorage storage s = AppStorage.cmsStorage();

        _removeFromArray(s.artikelToTagList[_artikelId], _tagId);
        _removeFromArray(s.tagToArtikelList[_tagId], _artikelId);
    }

    function getArtikelsByTag(
        uint256 _tagId
    ) external view returns (uint256[] memory) {
        return AppStorage.cmsStorage().tagToArtikelList[_tagId];
    }

    function getTagsByArtikel(
        uint256 _artikelId
    ) external view returns (uint256[] memory) {
        return AppStorage.cmsStorage().artikelToTagList[_artikelId];
    }

    // ==================== Helper Functions ====================
    function _removeFromArray(uint256[] storage arr, uint256 value) internal {
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == value) {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                break;
            }
        }
    }
}
