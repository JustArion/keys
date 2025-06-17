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
            console.error('[!] Resource type is not iframe:', resourceData);
            exit(1);
        }

        // We Extract domain & ID from the link https://{domain}/embed-2/v2/e-1/{id}?k=1
        const link = resourceData.link;
        const resourceLinkMatch = link.match(/https:\/\/([^/]+)\/embed-2\/v2\/e-1\/([^?]+)/);
        if (!resourceLinkMatch) 
        {
            console.error('[!] Failed to extract domain and ID from link:', resourceData);
            exit(2);
        }
        let baseUrl = `https://${resourceLinkMatch[1]}`;
        const id = resourceLinkMatch[2];

        // Fetch encrypted sources
        const embedContentRaw = await FetchUrl(`${baseUrl}/embed-2/v2/e-1/getSources?id=${id}`, { 'referer': `${baseUrl}/embed-2/v2/e-1/getSources?id=${id}`});
        const embedContent = JSON.parse(embedContentRaw);
        if (!embedContent.sources || !embedContent.sources.length) 
        {
            console.error('[!] No sources found in embed content:', embedContent);
            exit(4);
        }
        const encryptedBase64 = embedContent.sources
        console.debug('[*] Encrypted Source:', encryptedBase64);

        const keys = GetKeys();

        // MegaCloud
        let [json, key] = await GetScriptKey(`https://${resourceLinkMatch[1]}`, PlayerType.ANIME, encryptedBase64);
        if (key != null)
        {
            console.log('[*] MegaCloud Anime Key:', key);
            console.log('[*] Decrypted JSON:', json);

            if (keys.MegaCloud.Anime.Key != key)
            {
                keys.MegaCloud.Anime = UpdateKey(key);
                SaveKeys(keys);
            }
        }

        // ---
        [json, key] = await GetScriptKey(`https://${resourceLinkMatch[1]}`, PlayerType.MOVIES);
        if (key != null)
        {
            console.log('[*] MegaCloud Movies Key:', key);

            if (keys.MegaCloud.Movies.Key != key)
            {
                keys.MegaCloud.Movies = UpdateKey(key);
                SaveKeys(keys);
            }
        }
        // ------
        // VideoStr
        [json, key] = await GetScriptKey(`https://videostr.net`, PlayerType.ANIME);
        if (key != null)
        {
            console.log('[*] VideoStr Anime Key:', key);

            if (keys.VideoStr.Anime.Key != key)
            {
                keys.VideoStr.Anime = UpdateKey(key);;
                SaveKeys(keys);
            }
        }
        // ---
        [json, key] = await GetScriptKey(`https://videostr.net`, PlayerType.MOVIES);
        if (key != null)
        {
            console.log('[*] VideoStr Movies Key:', key);

            if (keys.VideoStr.Movies.Key != key)
            {
                keys.VideoStr.Movies = UpdateKey(key);
                SaveKeys(keys);
            }
        }
        // ------
        // CloudVidz
        // TODO: Currently not working!
        // [json, key] = await GetScriptKey(`https://cloudvidz.net`, PlayerType.ANIME);
        // if (key != null)
        // {
        //     console.log('[*] CloudVidz Anime Key:', key);
        //     if (keys.CloudVidz.Anime.Key != key)
        //     {
        //         keys.CloudVidz.Anime = UpdateKey(key);
        //         SaveKeys(keys);
        //     }
        // }
        // // ---
        [json, key] = await GetScriptKey(`https://cloudvidz.net`, PlayerType.MOVIES);
        if (key != null)
        {
            console.log('[*] CloudVidz Movies Key:', key);

            if (keys.CloudVidz.Movies.Key != key)
            {
                keys.CloudVidz.Movies = UpdateKey(key);
                SaveKeys(keys);
            }
        }
        // ------
    } catch (ex) 
    {
        console.error(`[!] An error occurred: ${ex.message}`);
        exit(7);
    }
})();

function UpdateKey(key)
{
    return {
        Key: key,
        LastUpdated: GetTimestamp()
    };
}
function SaveKeys(keys)
{
    fs.writeFileSync('./data/keys.json', JSON.stringify(keys, null, 2)); // Indented
}
function GetKeys()
{
    try
    {
        return JSON.parse(fs.readFileSync('./data/keys.json'));
    }
    catch 
    {
        return {
            "MegaCloud": 
            {
                "Anime": 
                {
                    "Key": "",
                    "LastUpdated":
                    {
                        "Timestamp": 0,
                        "Time": ""
                    }
                },
                "Movies": 
                {
                    "Key": "",
                    "LastUpdated":
                    {
                        "Timestamp": 0,
                        "Time": ""
                    }
                }
            },
            "VideoStr":
            {
                "Anime": 
                {
                    "Key": "",
                    "LastUpdated":
                    {
                        "Timestamp": 0,
                        "Time": ""
                    }
                },
                "Movies": 
                {
                    "Key": "",
                    "LastUpdated":
                    {
                        "Timestamp": 0,
                        "Time": ""
                    }
                }
            },
            "CloudVidz":
            {
                "Anime": 
                {
                    "Key": "",
                    "LastUpdated":
                    {
                        "Timestamp": 0,
                        "Time": ""
                    }
                },
                "Movies": 
                {
                    "Key": "",
                    "LastUpdated":
                    {
                        "Timestamp": 0,
                        "Time": ""
                    }
                }
            }
        }
    }
}

function GetTimestamp()
{
    const timestamp = Date.now();
    const date = new Date();
    const time = date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
    });

    return {
        Timestamp: timestamp,
        Time: time
    };
}

async function FetchUrl(url, additionalHeaders = {}) 
{
    const headers = 
    {
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0',
        ...additionalHeaders
    };
    const res = await fetch(url, { headers });
    if (!res.ok) {
        console.error(`[!] Failed to fetch ${url}: ${res.status} ${res.statusText}`);
        exit(3);
    }
    return await res.text();
}

function GetScriptKeyOffline(encBase64 = null)
{
    // Run deobfuscate.js (assumes it writes to output.js)
    execSync('node ./deobfuscate.js', { stdio: 'ignore' });
    const deobfuscated = fs.readFileSync('output.js', 'utf8');

    try 
    {
        // [
        //     {
        //         file: 'https://eh.netmagcdn.com:2228/hls-playback/.../master.m3u8',
        //         type: 'hls'
        //     }
        // ]
        return ExtractKey(deobfuscated, encBase64);        
    } catch (ex) 
    {
        console.error(`[!] Failed to parse decrypted JSON: (${ex.message})`);
    }
}
async function GetScriptKey(baseUrl, playerType, encBase64 = null)
{
    // Fetch obfuscated JS
    const obfuscatedJS = await FetchUrl(`${baseUrl}/js/player/${playerType}/v2/pro/embed-1.min.js?v=${Math.floor(Date.now() / 1000)}`);
    fs.writeFileSync('input.txt', obfuscatedJS);

    return GetScriptKeyOffline(encBase64);
}

const PlayerType = {
    ANIME: 'a',
    MOVIES: 'm',
}

function ExtractKey(deobfuscated, encryptedBase64Content) 
{
    // Iterate over n, each element is an index into K. each index should not exceed K's length
    // K = ["542", "e3", "8129", "68c", "974c", "3", "9a11", "922a", "0b0", "89c", "6b", "7b", "b21c", "3295", "91", "7", "ec", "ffcf", "4a89", "a", "fcd3", "d2", "b"];
    // n = [3, 16, 18, 14, 0, 19, 22, 9, 21, 7, 12, 13, 6, 1, 11, 2, 15, 4, 20, 17, 10, 5, 8];
    const v1Regex = /\w+\s*=\s*(\[(?:"[^"]*",?\s*)+\]);\s*\w+\s*=\s*(\[(?:\d+,?\s*)+\]);/;
    // Hex string that's 64 characters long
    // D = "--217b4f4cbd4baeb5bdaeb43096f55c9095f7ab789a7498dda782473eaee2c791";
    const v2Regex = /([a-f0-9]{64,})/;
    // Each element is an int string that gets converted to hex, then back to a character
    // O = ["30", "30", "63", "61", "33", "65", "66", "30", "63", "61", "65", "62", "32", "65", "64", "31", "65", "65", "38", "31", "65", "36", "35", "36", "35", "64", "63", "36", "61", "61", "38", "34", "37", "32", "62", "35", "33", "35", "33", "36", "61", "34", "65", "62", "30", "65", "35", "34", "62", "32", "62", "39", "64", "31", "63", "63", "31", "64", "39", "38", "61", "30", "34", "64"];
    const v3Regex = /\w+\s*=\s*(\[(?:"[0-9a-fA-F]+",?\s*){50,64}\])/;
    // Each element is an int that's just a character
    // a = [97, 56, 55, 55, 50, 100, 49, 57, 50, 53, 101, 53, 53, 48, 55, 56, 101, 53, 99, 101, 48, 57, 98, 101, 56, 98, 99, 54, 50, 101, 99, 54, 56, 99, 98, 100, 98, 53, 102, 102, 50, 56, 55, 52, 55, 52, 101, 54, 54, 101, 99, 49, 51, 49, 97, 100, 98, 52, 49, 48, 98, 51, 49, 98];
    // h = () => {
    // p.z9e.s2fm9gH();
    // if (p.q4.m8Eqosd()) {
    // return g8HqS["fromCharCode"](...a);
    // }
    const v4Regex = /\w+\s*=\s*(\[(?:\d+,?\s*)+\])/;
    // Simply base64
    // L = "YzAwZmZhY2NiNjZmODliODMzNGUyYzNmMTI3NDE4Mjg0ZGNjNThlMzUxN2Y2MWRiYmM2ZjZiZDk3Mzc1MGNhYw==";
    // h = () => {
    //   z.F6L.Z0lkAgs();
    //   if (!z.t2.Q1kzx_R()) {
    //     return W_cei(L);
    //   }
    const v5Regex = /((?:[A-Za-z0-9+/]{4}){16,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?)/

    // -----------------------------------------------------------------
    const v1Match = deobfuscated.match(v1Regex);
    if (v1Match) 
    {
        const pattern = JSON.parse(v1Match[1]);
        const index = JSON.parse(v1Match[2]);
        let key = index.map(i => pattern[i]).join('');
        let result = TryDecryptJson(encryptedBase64Content, key);
        if (result) 
        {
            console.log('[*] (V1) Key found when checking for string mapping.');
            return result;
        }
    }

    const v2Match = deobfuscated.match(v2Regex);
    if (v2Match) 
    {
        let key = v2Match[1];
        let result = TryDecryptJson(encryptedBase64Content, key);
        if (result) 
        {
            console.log('[*] (V2) Key found when checking for hex strings.');
            return result;
        }
    }

    const v3Match = deobfuscated.match(v3Regex);
    if (v3Match) 
    {
        const hexArray = JSON.parse(v3Match[1]);
        // if (hexArray.length === 64) 
        // {

        // }
        // else 
        //     console.error('[!] Hex array does not have 64 elements.');

            let key = hexArray.map(hex => String.fromCharCode(parseInt(hex, 16))).join("");
            let result = TryDecryptJson(encryptedBase64Content, key);
            if (result) 
            {
                console.log('[*] (V3) Key found when checking for hex arrays.');
                return result;
            }
    }

    const v4Match = deobfuscated.match(v4Regex);
    if (v4Match) 
    {
        const intArray = JSON.parse(v4Match[1]);
        let key = intArray.map(i => String.fromCharCode(i)).join('');
        let result = TryDecryptJson(encryptedBase64Content, key);
        if (result) 
        {
            console.log('[*] (V4) Key found when checking for int arrays.');
            return result;
        }
    }

    const v5Match = deobfuscated.match(v5Regex);
    if (v5Match)
    {
        let key = atob(v5Match[1]);
        if (key.length == 64)
        {
            let result = TryDecryptJson(encryptedBase64Content, key);
            if (result) 
            {
                console.log('[*] (V5) Key found when checking for base64 strings longer than 64 characters.');
                return result;
            }
        }
    }

    console.error('[!] Regexes did not match any known patterns for key extraction.');
    return [null, null];
}

function TryDecryptJson(encryptedb64, key, tryingReverse = false) 
{
    if (!encryptedb64)
        return [null, key];

    try
    {
        const decrypted = CryptoJS.AES.decrypt(encryptedb64, key);
        return [JSON.parse(decrypted.toString(CryptoJS.enc.Utf8)), key];
    }
    catch (ex)
    {
        if (tryingReverse) 
        {
            // We un-reverse to get the original that was passed to the parent stack frame.
            console.error(`[!] Failed to decrypt json with key ${Reverse(key)} after reversing, (${ex.message})`);
            return null;
        }

        // If decryption fails, we try to reverse the key
        let reversedKey = Reverse(key);
        return TryDecryptJson(encryptedb64, reversedKey, true);
    }
}

function Reverse(str) 
{
    return str.split('').reverse().join('');
}