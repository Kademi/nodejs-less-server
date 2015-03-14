var less = require('less');

var FAKE_FILENAME = '__input__.less';

exports.run = function(input, baseURL, callback) {
    var lessOptions = {};

    if (baseURL) {
        // Set a fake filename, so the less compiler could resolve imports using baseURL as a root
        lessOptions.filename = baseURL.resolve(FAKE_FILENAME);
    } else {
        lessOptions.filename = FAKE_FILENAME;
    }

    less.render(input, lessOptions, function(err, output) {
        if (err) {
            return callback(prepareError(err, baseURL));
        }
        
        callback(null, output.css);
    });
};

function prepareError(err, baseURL) {
    var originalMessage = err.message,
        errorLines = [],
        extractLines = [];

    if (err.stack && !err.type) {
        err.message = "Message=" + err.stack;
        return err;
    }
    if (!err.hasOwnProperty('index') || !err.extract) {
        err.message = "Message=" + (err.stack || originalMessage);
        return err;
    }

    errorLines.push('Column=' + (err.column + 1));
    errorLines.push('Line=' + (err.line));

    if (err.filename) {
        if (baseURL) {
            var baseURLString = baseURL.format();
            if (err.filename.indexOf(baseURLString) === 0) {
                err.filename = err.filename.slice(baseURLString.length);
            }
        }
    }

    errorLines.push('Filename=' + (err.filename || ''));
    errorLines.push('Type=' + err.type + 'Error');

    if (typeof err.extract[0] == 'string') {
        extractLines.push('' + (err.line - 1) + ' ' + err.extract[0]);
    }
    if (typeof err.extract[1] == 'string') {
        extractLines.push('' + (err.line) + ' ' + err.extract[1]);
        var whitespacePrefix = '',
            _groups = err.extract[1].match(/^(\s*)/i);

        if (_groups) { whitespacePrefix = _groups[0]; }

        var pointerPosition = ('' + err.line).length + 1 + err.column + 1 - whitespacePrefix.length;

        extractLines.push(whitespacePrefix + new Array(pointerPosition).join(' ') + '^');
    }
    // if (typeof err.extract[2] == 'string') {
    //     extractLines.push('' + (err.line + 1) + ' ' + err.extract[2]);
    // }

    errorLines.push('Message=' + originalMessage);

    errorLines = errorLines.concat(extractLines);
    err.message = errorLines.join('\n');

    return err;
}
