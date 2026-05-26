// Mengambil URL dari .env
const ipfsApiUrl = process.env.REACT_APP_IPFS_API_URL;
const gatewayUrl = process.env.REACT_APP_IPFS_GATEWAY_URL;
const ipfsApiBearerToken = process.env.REACT_APP_IPFS_API_BEARER_TOKEN;

type PinataUploadResponse = {
    IpfsHash?: string;
};

const getRequiredIpfsApiUrl = () => {
    if (!ipfsApiUrl) {
        throw new Error('REACT_APP_IPFS_API_URL belum diisi.');
    }
    return ipfsApiUrl;
};

const getRequiredBearerToken = () => {
    if (!ipfsApiBearerToken) {
        throw new Error('REACT_APP_IPFS_API_BEARER_TOKEN belum diisi.');
    }
    return ipfsApiBearerToken;
};

const buildPinataUnpinUrl = (cid: string) => {
    const uploadUrl = new URL(getRequiredIpfsApiUrl());
    const normalizedPath = uploadUrl.pathname.replace(/\/+$/, '');

    if (!normalizedPath.endsWith('/pinFileToIPFS')) {
        throw new Error('REACT_APP_IPFS_API_URL harus mengarah ke endpoint .../pinFileToIPFS');
    }

    const pinningBasePath = normalizedPath.replace(/\/pinFileToIPFS$/, '');
    uploadUrl.pathname = `${pinningBasePath}/unpin/${encodeURIComponent(cid)}`;
    uploadUrl.search = '';
    return uploadUrl.toString();
};

const fixMissingHttpScheme = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.startsWith('ttps://') || trimmed.startsWith('ttp://')) {
        return `h${trimmed}`;
    }
    return trimmed;
};

const extractCid = (value: string) => {
    const cleaned = value.trim();
    const withoutIpfsScheme = cleaned.replace(/^ipfs:\/\//i, '');
    const ipfsPathMarker = '/ipfs/';
    const markerIndex = withoutIpfsScheme.indexOf(ipfsPathMarker);

    if (markerIndex >= 0) {
        return withoutIpfsScheme.slice(markerIndex + ipfsPathMarker.length).replace(/^\/+/, '');
    }

    return withoutIpfsScheme.replace(/^\/+/, '');
};

export const uploadToIPFS = async (file: File) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(getRequiredIpfsApiUrl(), {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${getRequiredBearerToken()}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Pinata upload gagal (${response.status}): ${errorText}`);
        }

        const data = (await response.json()) as PinataUploadResponse;
        if (!data.IpfsHash) {
            throw new Error('Respons Pinata tidak mengandung IpfsHash.');
        }

        return data.IpfsHash;
    } catch (error) {
        console.error('Gagal upload ke IPFS:', error);
        throw error;
    }
};

export const getIPFSUrl = (cid: string) => {
    if (!cid) return '';

    const fixedCidValue = fixMissingHttpScheme(cid);
    if (/^https?:\/\//i.test(fixedCidValue)) {
        return fixedCidValue;
    }

    const extractedCid = extractCid(fixedCidValue);

    const rawGateway = gatewayUrl?.trim() || 'https://gateway.pinata.cloud/ipfs/';
    const fixedGatewayValue = fixMissingHttpScheme(rawGateway);
    const gatewayWithScheme = /^https?:\/\//i.test(fixedGatewayValue)
        ? fixedGatewayValue
        : `https://${fixedGatewayValue.replace(/^\/+/, '')}`;
    const normalizedGateway = gatewayWithScheme.endsWith('/') ? gatewayWithScheme : `${gatewayWithScheme}/`;

    return `${normalizedGateway}${extractedCid}`;
};


export const unpinFromIPFS = async (cid: string) => {
    try {
        const response = await fetch(buildPinataUnpinUrl(cid), {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${getRequiredBearerToken()}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Pinata unpin gagal (${response.status}): ${errorText}`);
        }

        return true;
    } catch (error) {
        console.error('Gagal unpin dari IPFS:', error);
        throw error;
    }
};
