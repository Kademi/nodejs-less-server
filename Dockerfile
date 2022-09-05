FROM node:16-alpine
ENV NPM_CONFIG_LOGLEVEL info
ENV PORT 80

RUN \
    apk update && \
    apk upgrade

RUN mkdir -p /var/lib/nodejsless
ADD package.json /var/lib/nodejsless
ADD server.mjs /var/lib/nodejsless
ADD compiler.mjs /var/lib/nodejsless
ADD worker.mjs /var/lib/nodejsless
ADD undici-file-manager.mjs /var/lib/nodejsless

EXPOSE 80

RUN cd /var/lib/nodejsless; npm install --production

CMD cd /var/lib/nodejsless; PORT=80; npm start
