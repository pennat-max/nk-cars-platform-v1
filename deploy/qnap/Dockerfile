FROM node:22.19.0-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN sed -i 's/\r$//' scripts/*.sh
RUN chmod +x scripts/*.sh
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV TZ=Asia/Bangkok
ENV WRANGLER_LOG_PATH=.wrangler/wrangler.log

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || '3000') + '/').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "run", "start", "--", "--port", "3000", "--hostname", "0.0.0.0"]
