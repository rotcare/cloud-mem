import { ApiGateway, Serverless } from '@rotcare/cloud';
import * as childProcess from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import fetch from 'node-fetch';
import * as net from 'net';

let payload = {
    sharedLayer: '',
};
let worker: childProcess.ChildProcess | undefined;
const pidPath = '/tmp/apiGateway_worker.pid';
const jsPath = path.join(__dirname, 'apiGateway_worker.js');

export const apiGateway: ApiGateway & Serverless = {
    createSharedLayer: async (layerCode) => {
        payload.sharedLayer = layerCode;
    },
    createFunction: async () => {},
    invokeFunction: async (functionName: string) => {
        while(true) {
            if (await isPortReachable(3000)) {
                break;
            } else {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        await fetch(`http://localhost:3000/${functionName}`, { method: 'POST', body: '[[]]' });
    },
    createRoute: async (options) => {
    },
    reload: async(options) => {
        const tmpPath = `/tmp/${options.projectPackageName.replace('/', '-')}`;
        const sharedLayerJsPath = `${tmpPath}.js`;
        fs.writeFileSync(sharedLayerJsPath, payload.sharedLayer);
        if (worker) {
            fs.existsSync(pidPath) && fs.unlinkSync(pidPath);
            worker.kill();
        } else {
            startWorker([sharedLayerJsPath]);
        }
    }
};

function startWorker(args: string[]) {
    try {
        const pid = Number.parseInt(fs.readFileSync(pidPath).toString());
        process.kill(pid);
        fs.unlinkSync(pidPath);
    } catch (e) {
        // pid file might not present
    }
    worker = childProcess.spawn(process.argv0, ['-r', 'source-map-support/register', jsPath, ...args]);
    fs.writeFileSync(pidPath, `${worker.pid}`);
    worker.stdout!.pipe(process.stdout);
    worker.stderr!.pipe(process.stderr);
    worker.on('exit', async (code) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        worker = undefined;
        fs.existsSync(pidPath) && fs.unlinkSync(pidPath);
        startWorker(args);
    });
}

async function isPortReachable(port: number) {
	const promise = new Promise(((resolve, reject) => {
		const socket = new net.Socket();

		const onError = () => {
			socket.destroy();
			reject();
		};

		socket.setTimeout(500);
		socket.once('error', onError);
		socket.once('timeout', onError);

		socket.connect(port, 'localhost', () => {
			socket.end();
			resolve(undefined);
		});
	}));

	try {
		await promise;
		return true;
	} catch (_) {
		return false;
	}
};