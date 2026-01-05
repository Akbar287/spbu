import { create } from 'kubo-rpc-client';

// Mengambil URL dari .env
const ipfsApiUrl = process.env.REACT_APP_IPFS_API_URL;
const gatewayUrl = process.env.REACT_APP_IPFS_GATEWAY_URL;

const client = create({ url: ipfsApiUrl });

export const uploadToIPFS = async (file: File) => {
    try {
        const added = await client.add(file);
        return added.path;
    } catch (error) {
        console.error('Gagal upload ke IPFS:', error);
        throw error;
    }
};

export const getIPFSUrl = (cid: string) => `${gatewayUrl}${cid}`;


export const unpinFromIPFS = async (cid: string) => {
    try {
        await client.pin.rm(cid);
        return true;
    } catch (error) {
        console.error('Gagal unpin dari IPFS:', error);
        throw error;
    }
};