import { hash } from './utilities/cryptography'
import { info, error, fatal } from './utilities/logging'
import { Api as API } from './utilities/api'
import { extractKeyFromUrl } from './utilities/extractor'

// Don't remove me ;-;
// Changes working directory to index.js
process.chdir(__dirname)

const baseUrls = [
    'https://megacloud.blog',
    'https://videostr.net',
    'https://cloudvidz.net',
    'https://cdnstreame.net'
]
async function main()
{
    const start = Date.now()
    API.load()

    // info(API.keys)

    const urls = generateUrls()
    const results = await Promise.all(urls.map(async ({ domain, url, type }) => {
        const domainEntry = API.keys[domain] || {}
        const oldEntry = domainEntry[type] || {}

        let jsHash: string
        try {
            jsHash = await fetchHash(url)
        } catch (e) {
            error(`Failed to fetch or hash for ${url}: ${e}. (The site is likely down)`)
            return null
        }

        const oldHash = oldEntry.hash
        if (oldHash && jsHash == oldHash) {
            info(`Skipping (${type}) ${domain}`)
            return null
        }

        const extractedKey = await extractKeyFromUrl(url)
        const updated = {
            key: extractedKey,
            hash: jsHash,
            last_updated: API.getTimestamp()
        }

        return { domain, type, oldEntry, updated }
    }))

    for (const result of results) {
        if (!result) continue
        const { domain, type, oldEntry, updated } = result
        API.update(`${domain}.${type}`, updated)
        info(
            oldEntry && Object.keys(oldEntry).length
                ? `Updated (${type}) ${domain}: ${diffKeys(oldEntry, updated)}`
                : `Created (${type}) ${domain}: ${JSON.stringify(updated)}`
        )
    }

    const end = Date.now()
    info('executed in', (end - start) / 1000, 'sec')

    // info(API.keys)
    API.save()
}

main()
    .catch(fatal)


function diffKeys(oldObj: any, newObj: any): string {
    const diffs: string[] = []
    for (const key in newObj) {
        if (key === 'last_updated') continue
        if (oldObj?.[key] !== newObj[key]) {
            diffs.push(`${key}: "${oldObj?.[key]}" -> "${newObj[key]}"`)
        }
    }
    return diffs.length ? diffs.join(', ') : 'No changes'
}

function generateUrls() {
    const types : string[] = ['a', 'm']
    return baseUrls.flatMap(baseUrl =>
        types.map(type => ({
            domain: getDomain(baseUrl),
            url: `${baseUrl}/js/player/${type}/v2/pro/embed-1.min.js`,
            type: type === 'a' ? 'anime' : 'movie'
        }))
    )
}

function getDomain(url: string): string {
    const { hostname } = new URL(url)
    return hostname.split('.').slice(0, -1).join('.')
}

async function fetchHash(url : string): Promise<string> {
    const res = await fetch(url)
    const text = await res.text()
    return hash(text, false)
}