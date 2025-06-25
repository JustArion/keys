// @ts-ignore
import beautify from 'js-beautify'
import { URL } from 'node:url'
import ivm from 'isolated-vm'
import fs from 'fs'
import {error, info} from "./logging";


export async function extractKeyFromUrl(url : string) : Promise<string>
{
    const isolate = new ivm.Isolate({ memoryLimit: 128, inspector: false })
    const context = isolate.createContextSync()

    const ctxGlobal = context.global

    ctxGlobal.setSync('global', ctxGlobal.derefInto())

    ctxGlobal.getSync('global').setSync('atob', (data : string) => {
        const atobData = atob(data)
        // info('[ATOB]', data, '->', atobData)
        return atobData
    })

    ctxGlobal.getSync('console').setSync('log', (...args: any[]) => {
        // info(...args)
    })
    ctxGlobal.getSync('console').setSync('error', (...args: any[]) => {
        error(...args)
    })


    // const cryptoJSUrl = URL.parse('https://megacloud.blog/js/crypto-js.js')
    // if (!cryptoJSUrl)
    //     return;

    await runFromFile('./remote/crypto-js.js', isolate, context)

    await runFromFile('corrections.js', isolate, context)

    const path = URL.parse(url)
    if (!path)
        throw new Error('Invalid URL, Dev issue')

    let cjsKey = ''
    ctxGlobal.getSync('CryptoJS').getSync('AES').setSync('decrypt', (cipherText : string, key : string) => {
        console.log(`Found key for ${path.hostname} ${key}`)
        cjsKey = key
        isolate.dispose()
    })

    try
    {
        // await runFromUrl(`https://megacloud.blog/js/player/m/v2/pro/embed-1.min.js?v=${Date.now()}`, isolate, context)
        // await runFromFile('./remote/embed.js', isolate, context)
        // await runFromUrl(`https://cloudvidz.net/js/player/m/v2/pro/embed-1.min.js?v=${Date.now()}`, isolate, context)

        await runFromUrl(url, isolate, context)
    }
    catch(e)
    {
        // @ts-ignore
        if (e.message !== 'Isolate was disposed during execution')
        {
            console.error('Error from ', url)
            throw e;
        }
    }

    if (cjsKey === '')
        error('Failed to get key for', url)

    return cjsKey
}


async function runFromFile(path : string, isolation : ivm.Isolate, context : ivm.Context)
{
    // info(`Running '${path}'`)
    const text = fs.readFileSync(path, 'utf-8')
    await isolation.compileScriptSync(text)
        .run(context)
}

async function runFromUrl(path : string, isolation : ivm.Isolate, context : ivm.Context)
{
    const url = URL.parse(path)
    if (!url)
        return
    // info(`Executing '${path}'`)

    let embed = await fetch(url)
    let text = await embed.text()
    text =  beautify.js(text, {indent_size: 2, space_in_empty_paren: true })

    fs.writeFileSync('./remote/embed.js', text)

    await isolation.compileScriptSync(text)
        .run(context)
}
