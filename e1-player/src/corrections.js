jwplayer = shroud(function () {
    return {
        setup: shroudDummy(),
        on: shroudDummy()
    }
})

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
    playerSettings: {"time":0,"autoPlay":0,"playOriginalAudio":0,"autoSkipIntro":0,"vast":0},
    CryptoJS: CryptoJS,
}

JSON = shroud({})
JSON.parse = shroud(function (... args) {
    console.log('json args', ... args)
})

setTimeout = shroudDummy()
clearTimeout = shroudDummy()


const jqData = {
    "#megacloud-player": {
        id: '',
    }
}
$ = function(selector)
{
    if (typeof selector !== "string") {
        return {
            on: () => {},
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
    if (typeof callback === 'function') {

        let mockResponse = ''
        if (url === '/embed-1/e-1/banners')
            mockResponse = {"status":true,"data":[]}
        else
            mockResponse = {"sources":"","encrypted":true}

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
    const x = function () {}
    x.toString = function() { return 'dumm'}
    return x;
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