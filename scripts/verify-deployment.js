import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createPublicClient, http } from "viem";
import { defineChain } from "viem";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const networkArg = args.find(arg => arg.startsWith('--network='));
const NETWORK_NAME = networkArg ? networkArg.split('=')[1] : 'sepolia';
if (NETWORK_NAME !== 'sepolia') {
    console.error(`Unsupported network: ${NETWORK_NAME}. Use --network=sepolia`);
    process.exit(1);
}

const RPC_URL = process.env.REACT_APP_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';

const sepoliaChain = defineChain({
    id: 11155111,
    name: 'Ethereum Sepolia',
    nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
    rpcUrls: { default: { http: [RPC_URL] } },
});

async function main() {
    console.log("🔍 Verifying deployed contracts on Ethereum Sepolia...\n");

    // Read deployment file
    const deploymentFile = path.join(__dirname, `../deployments/${NETWORK_NAME}.json`);
    if (!fs.existsSync(deploymentFile)) {
        throw new Error(`Deployment file not found: ${deploymentFile}`);
    }
    const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));

    // Create client
    const publicClient = createPublicClient({
        chain: sepoliaChain,
        transport: http(RPC_URL),
    });

    console.log(`Network: ${deployment.network}`);
    console.log(`Chain ID: ${deployment.chainId}`);
    console.log(`Deployed at: ${deployment.deployedAt}\n`);

    let successCount = 0;
    let failedCount = 0;

    // Verify each contract
    for (const [name, address] of Object.entries(deployment.contracts)) {
        try {
            const code = await publicClient.getBytecode({ address });

            if (code && code !== '0x' && code.length > 4) {
                console.log(`✅ ${name}`);
                console.log(`   Address: ${address}`);
                console.log(`   Bytecode: ${code.length} chars\n`);
                successCount++;
            } else {
                console.log(`❌ ${name}`);
                console.log(`   Address: ${address}`);
                console.log(`   Error: No bytecode found!\n`);
                failedCount++;
            }
        } catch (error) {
            console.log(`❌ ${name}`);
            console.log(`   Address: ${address}`);
            console.log(`   Error: ${error.message}\n`);
            failedCount++;
        }
    }

    console.log("═══════════════════════════════════════════");
    console.log(`📊 Verification Results:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    console.log(`   📦 Total: ${successCount + failedCount}`);
    console.log("═══════════════════════════════════════════");

    if (failedCount === 0) {
        console.log("\n🎉 All contracts verified successfully!");
    } else {
        console.log(`\n⚠️  ${failedCount} contracts failed verification`);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    });
