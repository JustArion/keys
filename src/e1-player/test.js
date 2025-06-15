import fs from 'fs';
import { execSync } from 'child_process';
import CryptoJS from 'crypto-js';
import { exit } from 'process';


(async () => {
    try {

        // {"type":"iframe","link":"https://example.link/embed-2/v2/e-1/Zg7AF9QDZPee?k=1","server":1,"sources":[],"tracks":[],"htmlGuide":""}
        const resource = await fetch('https://hianime.to/ajax/v2/episode/sources?id=437666');

        // We check if the type is iframe
        const resourceData = await resource.json();
        if (resourceData.type !== 'iframe') {
            console.error('Resource type is not iframe:', resourceData);
            exit(1);
        }

        // We Extract domain & ID from the link https://{domain}/embed-2/v2/e-1/{id}?k=1
        const link = resourceData.link;
        const resourceLinkMatch = link.match(/https:\/\/([^/]+)\/embed-2\/v2\/e-1\/([^?]+)/);
        if (!resourceLinkMatch) {
            console.error('Failed to extract domain and ID from link:', resourceData);
            exit(2);
        }
        const baseUrl = `https://${resourceLinkMatch[1]}`;
        const ID = resourceLinkMatch[2];

        const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0';
        async function fetchUrl(url, additionalHeaders = {}) {
            const headers = {
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': USER_AGENT,
                ...additionalHeaders
            };
            const res = await fetch(baseUrl + url, { headers });
            if (!res.ok) {
                console.error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
                exit(3);
            }
            return await res.text();
        }

        // Fetch obfuscated JS
        const obfuscatedJS = await fetchUrl(`/js/player/a/v2/pro/embed-1.min.js?v=${Math.floor(Date.now() / 1000)}`);
        fs.writeFileSync('input.txt', obfuscatedJS);
        console.debug('JavaScript content retrieved and saved to input.txt');

        // Fetch encrypted sources
        const embedContentRaw = await fetchUrl(`/embed-2/v2/e-1/getSources?id=${ID}`, { 'referer': `${baseUrl}/embed-2/v2/e-1/getSources?id=${ID}`});
        const embedContent = JSON.parse(embedContentRaw);
        if (!embedContent.sources || !embedContent.sources.length) 
        {
            console.error('No sources found in embed content:', embedContent);
            exit(4);
        }
        const encryptedBase64 = embedContent.sources
        console.debug('Encrypted Source:', encryptedBase64);

        // Run deobfuscate.js (assumes it writes to output.js)
        execSync('node ./deobfuscate.js', { stdio: 'ignore' });
        const deobfuscated = fs.readFileSync('output.js', 'utf8');

        // We're targeting something that looks like:
        // K = ["542", "e3", "8129", "68c", "974c", "3", "9a11", "922a", "0b0", "89c", "6b", "7b", "b21c", "3295", "91", "7", "ec", "ffcf", "4a89", "a", "fcd3", "d2", "b"];
        // n = [3, 16, 18, 14, 0, 19, 22, 9, 21, 7, 12, 13, 6, 1, 11, 2, 15, 4, 20, 17, 10, 5, 8];
        let regex = /\w+\s*=\s*(\[(?:"[^"]*",?\s*)+\]);\s*\w+\s*=\s*(\[(?:\d+,?\s*)+\]);/;
        const match = deobfuscated.match(regex);

        let key = '';
        if (match) 
        {
            console.log('Deobfuscated content found via string mapping.');

            // It's all just valid json so we can parse it xdxd
            const pattern = JSON.parse(match[1]);
            const index = JSON.parse(match[2]);

            key = index.map(i => pattern[i]).join('');
        }
        else
        {
            // D = "--217b4f4cbd4baeb5bdaeb43096f55c9095f7ab789a7498dda782473eaee2c791";
            regex = /([a-f0-9]{64,})/;

            const keyMatch = deobfuscated.match(regex);
            if (keyMatch)
            {
                console.log('Deobfuscated content found via key extraction.');
                key = keyMatch[1];
            }
            else
            {
                //   O = ["30", "30", "63", "61", "33", "65", "66", "30", "63", "61", "65", "62", "32", "65", "64", "31", "65", "65", "38", "31", "65", "36", "35", "36", "35", "64", "63", "36", "61", "61", "38", "34", "37", "32", "62", "35", "33", "35", "33", "36", "61", "34", "65", "62", "30", "65", "35", "34", "62", "32", "62", "39", "64", "31", "63", "63", "31", "64", "39", "38", "61", "30", "34", "64"];
                // ["30", "30", "63", "61", "33", "65", "66", "30", "63", "61", "65", "62", "32", "65", "64", "31", "65", "65", "38", "31", "65", "36", "35", "36", "35", "64", "63", "36", "61", "61", "38", "34", "37", "32", "62", "35", "33", "35", "33", "36", "61", "34", "65", "62", "30", "65", "35", "34", "62", "32", "62", "39", "64", "31", "63", "63", "31", "64", "39", "38", "61", "30", "34", "64"].map(hex => String.fromCharCode(parseInt(hex, 16))).join("")
                regex = /\w+\s*=\s*(\[(?:"[0-9a-fA-F]+",?\s*){64}\])/;
                const arrMatch = deobfuscated.match(regex);
                if (arrMatch) 
                {
                    console.log('Deobfuscated content found via hex array extraction.');
                    const hexArray = JSON.parse(arrMatch[1]);
                    if (hexArray.length === 64) {
                        key = hexArray.map(hex => String.fromCharCode(parseInt(hex, 16))).join("");
                    } else {
                        console.error('Found array does not have 64 elements.');
                        exit(5);
                    }
                } else 
                {
                    // a = [97, 56, 55, 55, 50, 100, 49, 57, 50, 53, 101, 53, 53, 48, 55, 56, 101, 53, 99, 101, 48, 57, 98, 101, 56, 98, 99, 54, 50, 101, 99, 54, 56, 99, 98, 100, 98, 53, 102, 102, 50, 56, 55, 52, 55, 52, 101, 54, 54, 101, 99, 49, 51, 49, 97, 100, 98, 52, 49, 48, 98, 51, 49, 98];
                    // h = () => {
                        // p.z9e.s2fm9gH();
                        // if (p.q4.m8Eqosd()) {
                        // return g8HqS["fromCharCode"](...a);
                        // }
                    regex = /\w+\s*=\s*(\[(?:\d+,?\s*)+\])/;
                    const intArrayMatch = deobfuscated.match(regex);
                    if (intArrayMatch)
                    {
                        console.log('Deobfuscated content found via integer array extraction.');
                        const intArray = JSON.parse(intArrayMatch[1]);
                        key = String.fromCharCode(...intArray);
                    }
                    else
                    {
                        console.error('Regexes did not match any known patterns for key extraction.');
                        exit(5);
                    }
                }
            }
        }

        console.log('Key:', key);

        const decrypted = CryptoJS.AES.decrypt(encryptedBase64, key);
        try 
        {
            // [
            //     {
            //         file: 'https://eh.netmagcdn.com:2228/hls-playback/.../master.m3u8',
            //         type: 'hls'
            //     }
            // ]
            const plaintext = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));

            console.log('Decrypted JSON:', plaintext);
            
            fs.writeFileSync('./data/decryption_key', key);
        } catch (ex) 
        {
            console.error('Failed to parse decrypted JSON:', ex.message);
            exit(6);
        }
    } catch (ex) 
    {
        console.error('Error:', ex.message);
        exit(7);
    }
})();
