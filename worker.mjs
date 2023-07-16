import { createServer } from 'http';
import formidable from 'formidable';
import { URL } from 'node:url';
import { readFileSync } from 'fs';
import { lessCompiler } from './compiler.mjs';
import cluster from 'node:cluster';
import logger, { token, format, compile } from 'morgan';
import console from 'node:console';

var settings = {
    PORT: process.env.PORT || 3000
};

// Custom Morgan format
token('real-ip', function (req, res) {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
});

format('custom', function developmentFormatLine(tokens, req, res) {
    // get the status code if response written
    var status = res._header ?
        res.statusCode :
        undefined;

    // get status color
    var color = status >= 500 ? 31 // red
        :
        status >= 400 ? 33 // yellow
            :
            status >= 300 ? 36 // cyan
                :
                status >= 200 ? 32 // green
                    :
                    0; // no color

    // get colored function
    var fn = developmentFormatLine[color];

    if (!fn) {
        // compile
        fn = developmentFormatLine[color] = compile('Worker ' + cluster.worker.id + ' - :real-ip - \x1b[0m:method :url \x1b[' +
            color + 'm:status \x1b[0m:response-time ms - :res[content-length]\x1b[0m');
    }

    return fn(tokens, req, res);
});

var customLogger = logger('custom');

export function start() {

    function respondWithError(res, status, message) {
        res.writeHead(status, { 'content-type': 'text/plain' });
        res.end(message + '\n');
    }

    function respondWithResult(res, result) {
        res.writeHead(200, { 'content-type': 'text/css' });
        res.end(result);
    }

    createServer(function (req, res) {
        customLogger(req, res, function (err) {
            if (err) {
                return respondWithError(res, 400, err.message);
            }

            if (req.url === '/' && req.method.toLowerCase() === 'post') {
                // Main entry point (POST request to /)
                var form = formidable({});

                form.parse(req, async function (err, fields, files) {
                    var url = '';
                    var compress = false;
                    var input;

                    if (Array.isArray(fields.url) && fields.url.length > 0) {
                        url = fields.url[0];
                    }

                    if (Array.isArray(fields.compress) && fields.compress.length > 0) {
                        compress = fields.compress[0];
                    }

                    if (typeof compress === 'string') {
                        compress = compress === 'true';
                    }

                    if (Array.isArray(fields.less) && fields.less.length > 0) {
                        input = fields.less[0];
                    }

                    if ((typeof input == 'undefined' || input === null) && files.less) {
                        // Source file has been received as an attachment
                        input = readFileSync(files.less.path, { encoding: 'utf-8' });
                    }

                    if (!input) {
                        // We won't raise error on empty input
                        // Empty input -> empty output
                        return respondWithResult(res, '/* Source file is empty */');
                    }

                    if (url && url[url.length - 1] !== '/') {
                        // Add trailing slash to the URL
                        url += '/';
                    }

                    var parsedURL = new URL(url);
                    if (!parsedURL.host) {
                        // Assume that URL is incorrect
                        parsedURL = null;
                    }

                    try {
                        const cssOutput = await lessCompiler(input, parsedURL, compress);
                        return respondWithResult(res, cssOutput);
                    } catch (error) {
                        console.error(error, error.stack);
                        return respondWithError(res, 400, error.message);
                    }
                });
            } else if (req.url === '/health' && req.method.toLowerCase() === 'get') {
                res.writeHead(200, { 'content-type': 'text/plain' });
                res.end("ok");
            } else {
                return respondWithError(res, 404, 'Nothing to do here');
            }
        });
    }).listen(settings.PORT, function () {
        console.log('LESS server is running on port %d with worker %d', settings.PORT, cluster.worker.id);
    });
}