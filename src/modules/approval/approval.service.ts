import { prisma } from "@/lib/prisma";

export const approvalService = {

	allPendingApprovals: async () => {
    return prisma.userApproval.findMany({
      where: { status: 'pending' },
      include: { user: true, requestedRole: true },
    });
  },

	getById: async (id: number) => {
		return prisma.userApproval.findUnique({
			where: { id },
			include: { user: true, requestedRole: true },
		});
	},
	
  updateApprovalStatus: async (
    id: number,
    status: 'approved' | 'rejected',
    approverId: number
  ) => {
    const approval = await prisma.userApproval.findUnique({
      where: { id },
      include: { user: true, requestedRole: true },
    });

    if (!approval) {
      throw new Error("Solicitação de aprovação não encontrada.");
    }

    if (approval.status !== 'pending') {
      throw new Error("Esta solicitação já foi processada.");
    }

    const updatedApproval = await prisma.userApproval.update({
      where: { id },
      data: {
        status,
        approvedById: approverId,
      },
    });

    await prisma.user.update({
      where: { id: approval.userId },
      data: {
        status,
        roleId: status === 'approved' ? approval.requestedRoleId : undefined,
      },
    });

    return {
      message: `Usuário ${status} com sucesso.`,
      approval: updatedApproval,
    };
  },
};