# Backend do XadrezMestre: Express + Stockfish NATIVO (usado por Cloud Run, Fly.io, etc.)
FROM node:22-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Stockfish oficial (binário já traz a rede NNUE). Troque SF_BUILD conforme a CPU:
#   stockfish-ubuntu-x86-64-avx2  (padrão, maioria dos servidores)
#   stockfish-ubuntu-x86-64-bmi2  (mais rápido em CPUs recentes)
#   stockfish-ubuntu-x86-64       (genérico, caso a CPU não tenha AVX2)
ARG SF_TAG=sf_18
ARG SF_BUILD=stockfish-ubuntu-x86-64-avx2
RUN curl -fsSL "https://github.com/official-stockfish/Stockfish/releases/download/${SF_TAG}/${SF_BUILD}.tar" \
  | tar -x -C /opt \
 && install -m 0755 "/opt/stockfish/${SF_BUILD}" /usr/local/bin/stockfish \
 && mkdir -p /usr/share/doc/stockfish && cp /opt/stockfish/Copying.txt /opt/stockfish/AUTHORS /usr/share/doc/stockfish/ \
 && rm -rf /opt/stockfish

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ENV NODE_ENV=production \
    PORT=8080 \
    STOCKFISH_PATH=/usr/local/bin/stockfish \
    ENGINE_POOL=2 \
    ENGINE_HASH_MB=64

USER node
EXPOSE 8080
# 'node --import tsx' (e não 'npm start') para o SIGTERM chegar direto ao Node e fechar o Stockfish
CMD ["node", "--import", "tsx", "server.ts"]
