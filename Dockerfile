FROM node:alpine

RUN apk add --update \
  libc6-compat

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app
RUN npm install

EXPOSE 5001

CMD [ "npm", "start" ]

