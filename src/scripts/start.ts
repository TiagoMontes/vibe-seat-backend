#!/usr/bin/env bun
import { $ } from 'bun';

console.log('⬆️ Subindo containers...');
await $`docker compose up -d --build --scale app=4`;

console.log('📦 Instalando dependências em todos os containers...');
await $`docker exec backend-app-1 bun install`;
await $`docker exec backend-app-2 bun install`;
await $`docker exec backend-app-3 bun install`;
await $`docker exec backend-app-4 bun install`;

console.log('🗄️ Gerando cliente Prisma e aplicando migrations...');
await $`docker exec backend-app-1 bunx prisma generate`;
await $`docker exec backend-app-1 bunx prisma migrate deploy`;
await $`docker exec backend-app-2 bunx prisma generate`;
await $`docker exec backend-app-3 bunx prisma generate`;
await $`docker exec backend-app-4 bunx prisma generate`;

console.log('🌱 Executando seeds...');
await $`docker exec backend-app-1 bun run seed:admin`;
await $`docker exec backend-app-1 bun run seed:days-of-week`;

console.log('🔗 Entrando no container principal...');
await $`docker exec -it backend-app-1 bash`;

console.log('✅ Projeto iniciado com sucesso!');
