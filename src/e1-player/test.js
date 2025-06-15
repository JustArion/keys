import fs from 'fs';
import { execSync } from 'child_process';
import CryptoJS from 'crypto-js';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0';
const BASE_URL = 'https://megacloud.blog';
const ID = 'Zg7AF9QDZPee';

async function fetchUrl(url, additionalHeaders = {}) {
    const headers = {
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': USER_AGENT,
        ...additionalHeaders
    };
    const res = await fetch(BASE_URL + url, { headers });
    if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    }
    return await res.text();
}

(async () => {
    try {
        // Fetch obfuscated JS
        const obfuscatedJS = await fetchUrl(`/js/player/a/v2/pro/embed-1.min.js?v=${Math.floor(Date.now() / 1000)}`);
        fs.writeFileSync('input.txt', obfuscatedJS);
        console.log('JavaScript content retrieved and saved to input.txt');

        // Fetch encrypted sources
        const embedContentRaw = await fetchUrl(`/embed-2/v2/e-1/getSources?id=${ID}`, {
            'referer': `${BASE_URL}/embed-2/v2/e-1/getSources?id=${ID}`
        });
        const embedContent = JSON.parse(embedContentRaw);
        if (!embedContent.sources || !embedContent.sources.length) {
            throw new Error('No sources found for the given ID.');
        }
        const encryptedBase64 = embedContent.sources
        console.log('Encrypted Source:', encryptedBase64);

        // Run deobfuscate.js (assumes it writes to output.js)
        execSync('node ./deobfuscate.js', { stdio: 'ignore' });
        const deobfuscated = fs.readFileSync('output.js', 'utf8');

        // Extract key from deobfuscated output
        // We're targeting something that looks like:
        // K = ["542", "e3", "8129", "68c", "974c", "3", "9a11", "922a", "0b0", "89c", "6b", "7b", "b21c", "3295", "91", "7", "ec", "ffcf", "4a89", "a", "fcd3", "d2", "b"];
        // n = [3, 16, 18, 14, 0, 19, 22, 9, 21, 7, 12, 13, 6, 1, 11, 2, 15, 4, 20, 17, 10, 5, 8];
        const regex = /\w+\s*=\s*(\[(?:"[^"]*",?\s*)+\]);\s*\w+\s*=\s*(\[(?:\d+,?\s*)+\]);/;
        const match = deobfuscated.match(regex);
        if (!match) {
            throw new Error('Failed to find the required arrays in the deobfuscated content.');
        }
        
        // It's all just valid json so we can parse it xdxd
        const pattern = JSON.parse(match[1]);
        const index = JSON.parse(match[2]);

        let key = index.map(i => pattern[i]).join('');

        console.log('Key:', key);

        // Decrypt
        const decrypted = CryptoJS.AES.decrypt(encryptedBase64, key);
        try {
            const plaintext = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
            console.log('Decrypted JSON:', plaintext);
        } catch (err) {
            console.error('JSON NOT VALID');
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
})();
