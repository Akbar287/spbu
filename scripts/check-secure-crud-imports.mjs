import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagesRoot = path.join(__dirname, '../src/pages');

const forbidden = ["from 'wagmi'", 'from "wagmi"', "from '@wagmi/core'", 'from "@wagmi/core"'];

function collectFiles(rootDir) {
    const stack = [rootDir];
    const files = [];

    while (stack.length > 0) {
        const current = stack.pop();
        if (!current) continue;

        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                stack.push(fullPath);
                continue;
            }

            if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
                files.push(fullPath);
            }
        }
    }

    return files;
}

function main() {
    const files = collectFiles(pagesRoot);
    const violations = [];

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (forbidden.some((snippet) => line.includes(snippet))) {
                violations.push({
                    file: path.relative(path.join(__dirname, '..'), file),
                    line: i + 1,
                    source: line.trim(),
                });
            }
        }
    }

    if (violations.length === 0) {
        console.log('✅ No direct wagmi/@wagmi/core imports found in src/pages.');
        process.exit(0);
    }

    console.error('❌ Forbidden direct blockchain imports found in src/pages:');
    for (const violation of violations) {
        console.error(`- ${violation.file}:${violation.line}`);
        console.error(`  ${violation.source}`);
    }
    process.exit(1);
}

main();
