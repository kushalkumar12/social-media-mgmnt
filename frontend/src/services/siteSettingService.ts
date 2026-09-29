import { api } from './api';

export interface PublicSettings {
  registrationOtpEnabled: boolean;
}

export interface SiteSetting {
  key: String;
  value: string;
  description: string;
  updatedAt?: string;
}

export const siteSettingService = {
  getPublicSettings: async (): Promise<PublicSettings> => {
    const response = await api.get('/settings/public');
    return response.data;
  },

  getAllSettings: async (): Promise<SiteSetting[]> => {
    const response = await api.get('/settings/admin');
    return response.data;
  },

  updateSetting: async (key: string, value: string): Promise<SiteSetting> => {
    const response = await api.put(`/settings/admin/${key}`, { value });
    return response.data;
  },

  toggleOtp: async (enabled: boolean): Promise<SiteSetting> => {
    const response = await api.post(`/settings/admin/toggle-otp?enabled=${enabled}`);
    return response.data;
  }
};
