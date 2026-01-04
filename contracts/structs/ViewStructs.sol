// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;
import "../storage/AppStorage.sol";

struct FasilitasWithFiles {
    AppStorage.Fasilitas fasilitas;
    AppStorage.FileFasilitas[] files;
}

struct AsetWithFiles {
    AppStorage.Aset aset;
    AppStorage.FileAset[] files;
}
