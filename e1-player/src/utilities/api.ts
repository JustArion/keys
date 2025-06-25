import fs from 'fs'

export class Api
{
    static keys: Record<string, any> = {}
    private static readonly path = './data/keys.json'

    static save()
    {
        if (!fs.existsSync('data'))
            fs.mkdirSync('data');
        fs.writeFileSync(Api.path, JSON.stringify(Api.keys, null, 2));
    }

    static update(path: string | string[], value: object) {
        const keys = Array.isArray(path) ? path : path.split('.');
        let obj = Api.keys;
        for (let i = 0; i < keys.length - 1; i++) {
            if (typeof obj[keys[i]] !== 'object' || obj[keys[i]] === null) {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }
        const lastKey = keys[keys.length - 1];
        if (typeof obj[lastKey] === 'object' && obj[lastKey] !== null) {
            obj[lastKey] = { ...obj[lastKey], ...value };
        } else {
            obj[lastKey] = { ...value };
        }
    }

    static load()
    {
        if (fs.existsSync(Api.path))
        {
            Api.keys = JSON.parse(fs.readFileSync(Api.path, 'utf-8'));
        }
    }

    static getTimestamp()
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
            timestamp: timestamp,
            time: time
        };
    }
}

