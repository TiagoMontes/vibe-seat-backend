import { prisma } from '@/lib/prisma';
import { auditService } from '@/modules/audit/audit.service';

async function testAuditSystem() {
  console.log('🔍 Testando sistema de auditoria...\n');

  try {
    // Teste 1: Log de criação
    console.log('1. Testando log de criação...');
    await auditService.logCreate(
      'TestTable',
      999,
      {
        name: 'Test Item',
        status: 'active',
        description: 'This is a test item',
      },
      {
        userId: 1,
        ip: '127.0.0.1',
        userAgent: 'Test Script',
        route: '/test',
        method: 'POST',
      }
    );
    console.log('✅ Log de criação criado com sucesso\n');

    // Teste 2: Log de atualização
    console.log('2. Testando log de atualização...');
    await auditService.logUpdate(
      'TestTable',
      999,
      {
        name: 'Test Item',
        status: 'active',
        description: 'This is a test item',
      },
      {
        name: 'Updated Test Item',
        status: 'active',
        description: 'This is an updated test item',
      },
      {
        userId: 1,
        ip: '127.0.0.1',
        userAgent: 'Test Script',
        route: '/test',
        method: 'PUT',
      }
    );
    console.log('✅ Log de atualização criado com sucesso\n');

    // Teste 3: Log de mudança de status
    console.log('3. Testando log de mudança de status...');
    await auditService.logStatusChange(
      'TestTable',
      999,
      'active',
      'inactive',
      {
        userId: 1,
        ip: '127.0.0.1',
        userAgent: 'Test Script',
        route: '/test/status',
        method: 'PATCH',
      },
      {
        reason: 'Maintenance required',
      }
    );
    console.log('✅ Log de mudança de status criado com sucesso\n');

    // Teste 4: Log de exclusão
    console.log('4. Testando log de exclusão...');
    await auditService.logDelete(
      'TestTable',
      999,
      {
        name: 'Updated Test Item',
        status: 'inactive',
        description: 'This is an updated test item',
      },
      {
        userId: 1,
        ip: '127.0.0.1',
        userAgent: 'Test Script',
        route: '/test',
        method: 'DELETE',
      }
    );
    console.log('✅ Log de exclusão criado com sucesso\n');

    // Teste 5: Buscar logs por registro
    console.log('5. Testando busca de logs por registro...');
    const logs = await auditService.getLogsByRecord('TestTable', 999);
    console.log(`✅ Encontrados ${logs.length} logs para o registro de teste\n`);

    // Teste 6: Testar sanitização de campos sensíveis
    console.log('6. Testando sanitização de campos sensíveis...');
    await auditService.logCreate(
      'User',
      888,
      {
        username: 'testuser',
        password: 'supersecret123',
        email: 'test@example.com',
        token: 'jwt-token-here',
      },
      {
        userId: 1,
      }
    );
    console.log('✅ Log com campos sensíveis criado com sucesso\n');

    // Teste 7: Verificar logs criados
    console.log('7. Verificando todos os logs de teste criados...');
    const allTestLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { tableName: 'TestTable' },
          { tableName: 'User', recordId: '888' },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`✅ Total de logs de teste encontrados: ${allTestLogs.length}\n`);

    // Mostrar alguns detalhes dos logs
    allTestLogs.forEach((log, index) => {
      console.log(`Log ${index + 1}:`);
      console.log(`  - Tabela: ${log.tableName}`);
      console.log(`  - Registro ID: ${log.recordId}`);
      console.log(`  - Ação: ${log.action}`);
      console.log(`  - Usuário ID: ${log.userId || 'Sistema'}`);
      console.log(`  - Data: ${log.createdAt.toLocaleString('pt-BR')}`);
      
      if (log.changes) {
        console.log(`  - Mudanças: ${Object.keys(log.changes as object).length} campos alterados`);
      }
      
      if (log.metadata) {
        const metadata = log.metadata as any;
        console.log(`  - IP: ${metadata.ip || 'N/A'}`);
        console.log(`  - Rota: ${metadata.route || 'N/A'}`);
      }
      console.log('');
    });

    console.log('🎉 Todos os testes de auditoria passaram com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante os testes de auditoria:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar os testes
testAuditSystem();