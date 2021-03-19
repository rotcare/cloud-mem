const { httpRpcServers, ioConf } = require(process.argv[2]);

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
    const httpRpcServer = httpRpcServers[req.url.substr(1)];
    if (!httpRpcServer) {
        const error = `no function defined for ${req.url}`;
        console.error(error);
        resp.end(JSON.stringify({ error }));
        return;
    }
    try {
        await httpRpcServer.handle(ioConf, req, resp);
    } catch (e) {
        resp.end(JSON.stringify({ error: new String(e) }));
        return;
    }
}
