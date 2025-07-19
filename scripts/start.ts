#!/usr/bin/env bun
import { $ } from "bun";

console.log("🚀 Buildando imagens...");
await $`docker compose build`;

console.log("⬆️ Subindo containers...");
await $`docker compose up -d`;

console.log("🔗 Entrando no container...");
await $`docker exec -it backend-app-1 /bin/bash`;