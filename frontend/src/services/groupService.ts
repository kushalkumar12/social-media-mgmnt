import { api } from './api';

export interface AccountGroupDTO {
  id: number;
  groupName: string;
  status: 'ACTIVE' | 'INACTIVE';
  memberCount: number;
  inactiveCount: number;
  accountIds: number[];
  createdAt: string;
}

export const groupService = {
  getGroups: async (): Promise<AccountGroupDTO[]> => {
    const res = await api.get('/groups');
    return res.data;
  },

  createGroup: async (groupName: string, accountIds: number[] = [], status: string = 'ACTIVE'): Promise<AccountGroupDTO> => {
    const res = await api.post('/groups', { groupName, accountIds, status });
    return res.data;
  },

  updateGroup: async (id: number, data: { groupName?: string; status?: string; accountIds?: number[] }): Promise<AccountGroupDTO> => {
    const res = await api.put(`/groups/${id}`, data);
    return res.data;
  },

  deleteGroup: async (id: number): Promise<void> => {
    await api.delete(`/groups/${id}`);
  }
};
