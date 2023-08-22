FROM node:18.17.1

USER root
RUN apt-get update && apt-get install -y dnsutils tzdata ffmpeg \
 && mkdir -p /home/node/app && chown node:node -R /home/node \
 && apt-get clean

RUN npm i -g nodemon

USER node
ENV NODE_ENV=production
ENV TZ=Europe/Budapest
WORKDIR /home/node/app

COPY --chown=node:node ["./package.json", "./"]
#COPY --chown=node:node ["./package-lock.json", "./"]

RUN npm i

WORKDIR /home/node/app

COPY --chown=node:node ["./", "./"]

CMD ["node", "index.js"]
