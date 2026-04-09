FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json next-env.d.ts ./
COPY services ./services

ENV NODE_ENV=production
ENV API_PORT=8080

EXPOSE 8080

CMD ["node", "--import", "tsx", "services/api/src/dev-server.ts"]
