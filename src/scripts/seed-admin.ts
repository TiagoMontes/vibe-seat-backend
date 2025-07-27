import { prisma } from '@/lib/prisma';

async function main() {
  // Create hierarchical roles: user -> attendant -> admin
  await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: { name: 'user' },
  });

  await prisma.role.upsert({
    where: { name: 'attendant' },
    update: {},
    create: { name: 'attendant' },
  });

  const roleAdmin = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin' },
  });

  const existingUser = await prisma.user.findFirst({
    where: { username: 'admin' },
  });

  if (!existingUser) {
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: await Bun.password.hash('admin123', 'bcrypt'),
        roleId: roleAdmin.id,
        status: 'approved',
        fullname: 'Administrador do Sistema',
        cpf: '000.000.000-00',
        jobFunction: 'Administrador',
        position: 'Admin',
        registration: 'ADM001',
        sector: 'TI',
        email: 'admin@sejusp.com',
        phone: '(00) 00000-0000',
        gender: 'Outro',
        birthDate: new Date('1990-01-01'),
      },
    });
    console.log('✅ Admin criado com sucesso:', admin.username);
    console.log('✅ Roles criadas: user, attendant, admin');
  } else {
    console.log('⚠️ Admin já existe:', existingUser.username);
    console.log('✅ Roles verificadas: user, attendant, admin');
  }
}

main().finally(() => prisma.$disconnect());
