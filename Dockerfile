# Etapa base
FROM oven/bun:1.1

WORKDIR /app

# Copiar package.json e bun.lock primeiro para cache
COPY package.json bun.lock* ./

# Instalar dependências
RUN bun install

# Copiar o resto dos arquivos
COPY . .

CMD ["bun", "run", "src/index.ts"]