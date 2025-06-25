import { exit } from 'process'

export function error(...args: any[]) {
    console.error('[!]', ...args)
}

export function info(...args: any[]) {
    console.log('[*]', ...args)
}

export function fatal(...args: any[])
{
    console.log('[!]', ...args)
    exit(1)
}
