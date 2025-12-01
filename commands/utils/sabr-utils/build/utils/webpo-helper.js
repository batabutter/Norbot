"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWebPoToken = generateWebPoToken;
const bgutils_js_1 = require("bgutils-js");
const jsdom_1 = require("jsdom");
async function generateWebPoToken(contentBinding) {
    const requestKey = 'O43z0dpjhgX20SCx4KAo';
    if (!contentBinding)
        throw new Error('Could not get visitor data');
    const dom = new jsdom_1.JSDOM();
    Object.assign(globalThis, {
        window: dom.window,
        document: dom.window.document
    });
    const bgConfig = {
        fetch: (input, init) => fetch(input, init),
        globalObj: globalThis,
        identifier: contentBinding,
        requestKey
    };
    const bgChallenge = await bgutils_js_1.BG.Challenge.create(bgConfig);
    if (!bgChallenge)
        throw new Error('Could not get challenge');
    const interpreterJavascript = bgChallenge.interpreterJavascript.privateDoNotAccessOrElseSafeScriptWrappedValue;
    if (interpreterJavascript) {
        new Function(interpreterJavascript)();
    }
    else
        throw new Error('Could not load VM');
    const poTokenResult = await bgutils_js_1.BG.PoToken.generate({
        program: bgChallenge.program,
        globalName: bgChallenge.globalName,
        bgConfig
    });
    const placeholderPoToken = bgutils_js_1.BG.PoToken.generatePlaceholder(contentBinding);
    return {
        visitorData: contentBinding,
        placeholderPoToken,
        poToken: poTokenResult.poToken,
    };
}
