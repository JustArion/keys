import CRC32 from 'crc-32'
export function hash(text : string, upperCase : boolean = true)
{
    // Signed -> Unsigned
    const hash = CRC32.str(text) >>> 0;
    const retVal = hash.toString(16)

    if (upperCase)
        return retVal.toUpperCase()
    else
        return retVal
}
