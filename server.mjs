import cluster from 'node:cluster';
import * as os from 'os';
import { start } from './worker.mjs';
import console from 'node:console';

if (cluster.isPrimary) {
    var numCPUs = os.cpus().length;

    cluster.on('exit', (worker, code, signal) => {
        console.warn('Worker exited', code, signal);
        cluster.fork();
    });

    // Fork workers.
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
} else if (cluster.isWorker) {
    start();
}