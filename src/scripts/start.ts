#!/usr/bin/env bun
import { $ } from 'bun';

console.log('⬆️ Subindo containers...');
await $`docker compose up -d --build --scale app=4`;

console.log('📦 Instalando dependências em todos os containers...');
await $`docker exec backend-app-1 bun install`;
await $`docker exec backend-app-2 bun install`;
await $`docker exec backend-app-3 bun install`;
await $`docker exec backend-app-4 bun install`;

console.log('🗄️ Executando migrations em todos os containers...');
await $`docker exec backend-app-1 bun run prisma:migrate`;
await $`docker exec backend-app-2 bun run prisma:migrate`;
await $`docker exec backend-app-3 bun run prisma:migrate`;
await $`docker exec backend-app-4 bun run prisma:migrate`;

console.log('🔗 Entrando no container principal...');
await $`docker exec -it backend-app-1 bash`;

console.log('✅ Projeto iniciado com sucesso!');
