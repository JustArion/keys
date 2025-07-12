Get the key needed to decode data from certain sites.
<br>eg.
```json
// {{DOMAIN}}/embed-2/v2/e-1/getSources?id=UwIeKnaHYVOs
{
  "sources": "U2FsdGVkX19u7GkA9EfIm6wgZFYV1Jzm/TrBZhW++2draGCbFfJEvUcZdMnXpPXHIwKpxFisyvTG4wljFPYy8mq82k7YkUF80w0ifKXMcwGB0ZBxWUHK/dDFn1b2Z2TpJq36GcDUWWDn9MhgzJOin54vCJOoObP2Npn8i2YVjUQ=",
  "tracks": [ ],
  "encrypted": true,
  "intro": {
    "start": 0,
    "end": 107
  },
  "outro": {
    "start": 1318,
    "end": 1376
  },
  "server": 6
}
```

You'd use the decryption key to decrypt the source, using something like CryptoJS.

```ts
import CryptoJS from 'crypto-js'

// You'd get this from this api
const animeKey = '3a0cf595d561eeeabd847d86c2c5832dae13b853cd05bb2d353a82b3e90a46b5'

// You'd get this from
// {{DOMAIN}}/embed-2/v2/e-1/getSources?id=UwIeKnaHYVOs
const data = json.sources

console.log(CryptoJS.AES.decrypt(payload, key).toString(CryptoJS.enc.Utf8)) // Outputs: [{"file":"https://{{link}}.m3u8","type":"hls"}]

```