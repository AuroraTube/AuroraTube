FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update   && apt-get install -y --no-install-recommends     ffmpeg     yt-dlp     ca-certificates   && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

USER node
EXPOSE 3000
CMD ["npm", "start"]
