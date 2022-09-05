import Less from 'less';
import { Agent, request, setGlobalDispatcher } from 'undici';
import { URL } from 'node:url';

const isUrlRe = /^(?:https?:)?\/\//i;

const UndiciFileManager = function () { };

UndiciFileManager.prototype = Object.assign(new Less.AbstractFileManager(), {
    install(less, pluginManager) {
        let self = this;
        pluginManager.addFileManager(self);
    },

    supports(filename, currentDirectory, options, environment) {
        return isUrlRe.test(filename) || isUrlRe.test(currentDirectory);
    },

    async loadFile(filename, currentDirectory, options, environment) {
        let urlStr = isUrlRe.test(filename) ? filename : new URL(filename, currentDirectory).toString();

        try {
            const {
                statusCode,
                body
            } = await request(urlStr, {
                maxRedirections: 5,
                // bodyTimeout: 24e4, // 4 Minutes,
                // headersTimeout: 24e4 // 5 Minutes
            });

            if (statusCode >= 400) {
                const message = statusCode === 404
                    ? `resource '${urlStr}' was not found\n`
                    : `resource '${urlStr}' gave this Error:\n  ${statusCode}\n`;

                return Promise.reject({ type: 'File', message });
            } else if (statusCode >= 300) {
                return Promise.reject({
                    type: 'File',
                    message: `resource '${urlStr}' caused too many redirects`,
                });
            }

            let reponseText = await body.text();

            return {
                contents: reponseText || '',
                filename: urlStr
            };
        } catch (err) {
            return Promise.reject({
                type: 'File',
                message: `resource ${urlStr} gave this Error:\n ${err}\n`
            });
        }
    }
});

export { UndiciFileManager };