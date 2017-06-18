var cluster = require('cluster');


if (cluster.isMaster) {
    var numCPUs = require('os').cpus().length;

    // Fork workers.
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        cluster.fork();
    });
} else if (cluster.isWorker) {
    require('./worker').start();
}