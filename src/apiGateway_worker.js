const SERVERLESS = {}; 

// 注入全局变量，让 require 的代码可以访问到，通过全局变量来提供返回值
global.SERVERLESS = SERVERLESS;
require(process.argv[2]);

const http = require('http');
startServer();

async function startServer() {
    http.createServer(handleRoute).listen(3000);
    console.log('api gateway worker started @3000');
}

async function handleRoute(req, resp) {
    resp.setHeader('Access-Control-Allow-Origin', '*');
    // CORS 有一个预检
    if (req.method === 'OPTIONS') {
        resp.setHeader('Access-Control-Allow-Headers', '*');
        resp.end('');
        return;
    }
    const func = SERVERLESS.functions[req.url.substr(1)];
    if (!func) {
        const error = `no function defined for ${req.url}`;
        console.error(error);
        resp.end(JSON.stringify({ error }));
        return;
    }
    try {
        await func(req, resp);
    } catch (e) {
        resp.end(JSON.stringify({ error: new String(e) }));
        return;
    }
}
