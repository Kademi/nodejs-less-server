var http = require('http'),
        formidable = require('formidable'),
        urllib = require('url'),
        fs = require('fs'),
        compiler = require('./compiler'),
        cluster = require('cluster'),
        logger = require('morgan');

var settings = {
    PORT: process.env.PORT || 3000
};

// Custom Morgan format
logger.token('real-ip', function (req, res) {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
});

logger.format('custom', function developmentFormatLine(tokens, req, res) {
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
        fn = developmentFormatLine[color] = logger.compile('Worker ' + cluster.worker.id + ' - :real-ip - \x1b[0m:method :url \x1b[' +
                color + 'm:status \x1b[0m:response-time ms - :res[content-length]\x1b[0m');
    }

    return fn(tokens, req, res);
});

var customLogger = logger('custom');

module.exports = {
    start: function () {

        function respondWithError(res, status, message) {
            res.writeHead(status, {'content-type': 'text/plain'});
            res.end(message + '\n');
        }

        function respondWithResult(res, result) {
            res.writeHead(200, {'content-type': 'text/css'});
            res.end(result);
        }

        http.createServer(function (req, res) {
            customLogger(req, res, function (err) {
                if (err)
                    return respondWithError(res, 400, err.message);

                if (req.url === '/' && req.method.toLowerCase() === 'post') {
                    // Main entry point (POST request to /)
                    var form = new formidable.IncomingForm();

                    form.parse(req, function (err, fields, files) {
                        var
                                url = fields.url || '',
                                compress = fields.compress || false,
                                input = fields.less;

                        if (typeof compress === 'string') {
                            compress = compress === 'true';
                        }

                        if (typeof input == 'undefined' && files.less) {
                            // Source file has been received as an attachment
                            input = fs.readFileSync(files.less.path, {encoding: 'utf-8'});
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

                        var parsedURL = urllib.parse(url);
                        if (!parsedURL.host) {
                            // Assume that URL is incorrect
                            parsedURL = null;
                        }

                        compiler.run(input, parsedURL, compress, function (err, output) {
                            if (err) {
                                console.log('Compilation failed for request with URL set to:', url);
                                console.log(err.message + '\n');
                                return respondWithError(res, 400, err.message);
                            }

                            respondWithResult(res, output);
                        });
                    });
                } else if (req.url === '/health' && req.method.toLowerCase() === 'get') {
                    res.writeHead(200, {'content-type': 'text/plain'});
                    res.end("ok");
                } else {
                    return respondWithError(res, 404, 'Nothing to do here');
                }
            });
        }).listen(settings.PORT, function () {
            console.log('LESS server is running on port %d with worker %d', settings.PORT, cluster.worker.id);
        });
    }
};