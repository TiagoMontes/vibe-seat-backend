import { roleRepository } from '@/modules/role/role.repository';

export const roleService = {
  create: async (name: string) => {
    // Verificar se já existe uma role com esse nome
    const existingRole = await roleRepository.findByName(name);
    if (existingRole) {
      throw new Error('Já existe uma role com esse nome.');
    }

    return await roleRepository.create({ name });
  },

  getAll: async () => {
    return await roleRepository.findAll();
  },

  getById: async (id: number) => {
    const role = await roleRepository.findById(id);
    if (!role) {
      throw new Error('Role não encontrada');
    }
    return role;
  },

  update: async (id: number, name: string) => {
    // Verificar se a role existe
    const existing = await roleRepository.findById(id);
    if (!existing) {
      throw new Error('Role não encontrada');
    }

    // Verificar se já existe outra role com esse nome
    const existingWithName = await roleRepository.findByName(name);
    if (existingWithName && existingWithName.id !== id) {
      throw new Error('Já existe uma role com esse nome.');
    }

    return await roleRepository.update(id, { name });
  },

  delete: async (id: number) => {
    // Verificar se a role existe e buscar contadores
    const existing = await roleRepository.findByIdWithCounts(id);
    if (!existing) {
      throw new Error('Role não encontrada');
    }

    // Verificar se há usuários vinculados
    if (existing._count.users > 0) {
      throw new Error(
        `Não é possível deletar a role. Existem ${existing._count.users} usuários vinculados a esta role.`
      );
    }

    // Verificar se há solicitações de aprovação pendentes
    if (existing._count.requestedByUsers > 0) {
      throw new Error(
        `Não é possível deletar a role. Existem ${existing._count.requestedByUsers} solicitações de aprovação para esta role.`
      );
    }

    return await roleRepository.delete(id);
  },
};
