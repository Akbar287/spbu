import hardhat from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createPublicClient, http } from "viem";
import { defineChain } from "viem";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const besuPrivate = defineChain({
    id: 287287,
    name: 'Besu IBFT Private Network',
    nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
    rpcUrls: { default: { http: ['http://43.163.104.18'] } },
});

async function main() {
    console.log("🔍 Verifying deployed contracts on Besu...\n");

    // Read deployment file
    const deploymentFile = path.join(__dirname, "../deployments/besu.json");
    const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));

    // Create client
    const publicClient = createPublicClient({
        chain: besuPrivate,
        transport: http('http://43.163.104.18'),
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
