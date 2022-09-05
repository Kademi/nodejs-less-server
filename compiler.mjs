import Less from 'less';
import { UndiciFileManager } from './undici-file-manager.mjs';
import console from 'node:console';

const FAKE_FILENAME = '__input__.less';

const lessCompiler = async (input, baseURL, compress) => {
    const lessOptions = {
        compress,
        filename: FAKE_FILENAME,
        plugins: [
            new UndiciFileManager()
        ]
    };

    if (baseURL) {
        lessOptions.filename = baseURL.toString();
    }

    try {
        const output = await Less.render(input, lessOptions);
        return output.css;
    } catch (error) {
        console.error('Error compiling LESS', lessOptions.filename, error);
        throw prepareError(error, baseURL);
    }
}

function prepareError(err, baseURL) {
    console.error('Compilation Error', err.message, err);

    const newError = new Error();

    let originalMessage = err.message,
        errorLines = [],
        extractLines = [];

    if (err.stack && !err.type) {
        newError.message = 'message:' + err.stack;
        newError.stack = err.stack;
        return newError;
    }
    if (!err.hasOwnProperty('index') || !err.extract) {
        err.message = 'message:' + (err.stack || originalMessage);
        return err;
    }

    errorLines.push('column:' + (err.column + 1));
    errorLines.push('line:' + err.line);

    if (err.filename) {
        if (baseURL) {
            const baseURLString = baseURL.toString();
            if (err.filename.indexOf(baseURLString) === 0) {
                err.filename = err.filename.slice(baseURLString.length);
            }
        }
    }

    errorLines.push('filename:' + (err.filename || ''));
    errorLines.push('type:' + err.type + 'Error');

    if (typeof err.extract[0] == 'string') {
        extractLines.push('' + (err.line - 1) + ' ' + err.extract[0]);
    }
    if (typeof err.extract[1] == 'string') {
        extractLines.push('' + err.line + ' ' + err.extract[1]);
        let whitespacePrefix = '',
            _groups = err.extract[1].match(/^(\s*)/i);

        if (_groups) {
            whitespacePrefix = _groups[0];
        }

        const pointerPosition = ('' + err.line).length + 1 + err.column + 1 - whitespacePrefix.length;

        extractLines.push(whitespacePrefix + new Array(pointerPosition).join(' ') + '^');
    }

    errorLines.push('message:' + originalMessage);

    errorLines = errorLines.concat(extractLines);
    err.message = errorLines.join('\n');

    return err;
}


export { lessCompiler };