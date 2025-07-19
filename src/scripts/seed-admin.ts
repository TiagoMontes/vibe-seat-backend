import { prisma } from "@/lib/prisma";

async function main() {
  const roleAdmin = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin' },
  });

  const existingUser = await prisma.user.findFirst({
    where: { username: 'admin@admin.com' },
  });

  if (!existingUser) {
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: await Bun.password.hash('admin123', 'bcrypt'),
        roleId: roleAdmin.id,
        status: 'approved',
      },
    });
    console.log('✅ Admin criado com sucesso:', admin.username);
  } else {
    console.log('⚠️ Admin já existe:', existingUser.username);
  }
}

  main().finally(() => prisma.$disconnect());