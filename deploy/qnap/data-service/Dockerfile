FROM node:22.19.0-bookworm-slim

WORKDIR /service
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY deploy/qnap/data-service/*.mjs ./

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "server.mjs"]
