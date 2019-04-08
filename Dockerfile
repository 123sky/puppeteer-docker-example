FROM node:10-alpine

# Installs latest Chromium (72) package.
RUN apk update && apk upgrade && \
  echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
  echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
  apk add --update ca-certificates && \
  apk add --no-cache \
  ttf-freefont \
  chromium@edge \
  nss@edge \
  harfbuzz@edge

ENV APP_PATH /docker-puppeteer
ENV NODE_ENV production

ENV CHROME_BIN /usr/bin/chromium-browser
# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

WORKDIR $APP_PATH

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . .

CMD ["node", "index.js"]
