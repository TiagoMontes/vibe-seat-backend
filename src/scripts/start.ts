#!/usr/bin/env bun
import { $ } from 'bun';

console.log('⬆️ Subindo containers...');
await $`docker compose up -d --build --scale app=4`;

console.log('📦 Instalando dependências no container...');
await $`docker compose exec app bun install`;

console.log('🔗 Entrando no container...');
await $`docker compose exec app bash`;

console.log('✅ Projeto iniciado com sucesso!');
