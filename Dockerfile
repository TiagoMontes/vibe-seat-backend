# Etapa base
FROM oven/bun:1.1

WORKDIR /app

COPY . .

RUN bun install

CMD ["bun", "run", "src/index.ts"]