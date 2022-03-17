FROM node:16
ENV NPM_CONFIG_LOGLEVEL info
ENV PORT 80

RUN mkdir -p /var/lib/nodejsless
ADD package.json /var/lib/nodejsless
ADD server.js /var/lib/nodejsless
ADD compiler.js /var/lib/nodejsless
ADD worker.js /var/lib/nodejsless

EXPOSE 80

RUN cd /var/lib/nodejsless; npm install --production

CMD cd /var/lib/nodejsless; PORT=80; npm start
