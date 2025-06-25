jwplayer = createDummy()

performance = { now: shroud(function() { return Date.now(); }) };
attachEvent = shroudDummy()
document = shroud({})
document.on = shroudDummy()
window = {
    navigator: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.'
    },
    performance: performance,
    attachEvent: attachEvent,
    document: document,
    playerSettings: {
        autoPlay: '',
    },
    CryptoJS: CryptoJS,
}

setTimeout = shroudDummy()
clearTimeout = shroudDummy()

const jqData = {
    "#megacloud-player": {
        id: '',
        realid: '',
    }
}
$ = function(selector)
{
    if (typeof selector !== "string") {
        return {
            on: () => {},
            ready: fn => fn()
        };
    }

    // console.log("Selecting root", selector)
    return {
        data: key => {
            // console.log(`Selecting ${selector}.${key}`)
            return jqData[selector]?.[key]
        }
    };
}
$.get = function(url, callback) {
    console.log(`[*][AJAX] -> ${url}`);
    const mockResponse = { "sources": "", "encrypted": true}
    if (typeof callback === 'function') {
        callback(mockResponse);
    }
};



shroud(jwplayer)
shroud(global.performance)
shroud(global.performance.now)

function MobileDetect(userAgent) {
    this.userAgent = userAgent || (window && window.navigator ? window.navigator.userAgent : "");
}

MobileDetect.prototype.isMobile = function() {
    return false
};

function createDummy()
{
    return function () {}
}

function shroudDummy()
{
    return shroud(function(){})
}
function shroud(fn)
{
    fn.toString = function() { return `function log() {
        [native code]
    }` }

    delete fn.prototype
    delete fn.toString.prototype

    return fn
}