import CryptoJS from "crypto-js";

const source = 'U2FsdGVkX1/sPKm7Oo65xkUirEqITcTaeAec6Bb5OCSXIVRJxd7ccr1oupsjA0xVmRxScyqRbL0WvT/OnLVGYx+CxRNfmk87Vy91Tq3C7m43+BMiNX7lYzCs2BDULswvDrCgf5rk891thUdsPXG70KDvsqi6LB0NbOiSvbL7Jnv+D4w3pqdTYO1z5ChXcjs2Vha1wcdduH/1LBs9vyw/p+9og+timbZXf9F25KW5tjUINw7HtAQET24fUnTn2yTqzsAECfEFnn3/VBNTuyrCDr8dJy2RC2nmQN+/jbiJfwFU0aFywCb4qgn0My/YOpbQ7L1zrJVccB2IxMvMvGGIIi2iipnVHB/sLHLXu9bWwIF925cmqPeZpvJm4w+9cSd1TcSeCzx7QQN0JI5Y2Oe30A0fIPdk4/+3PZyDm7sTQcXTt7kKR1X4ImnPcvageFPlGDFlmYgt5JxP7DEY2+lBLpLV2sP7SWvZVKry0lZL6tv+fObBgBDaWE8geG+TYh0SFoWhK0wldpg0VDzCR4oaaw=='
const key = '217b4f4cbd4baeb5bdaeb43096f55c9095f7ab789a7498dda782473eaee2c791';

const decrypted = CryptoJS.AES.decrypt(source, key);

const plaintext = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));

console.log('Decrypted JSON:', plaintext);