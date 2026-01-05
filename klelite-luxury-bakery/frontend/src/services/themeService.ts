import axiosClient from './axiosClient';
import { IThemeConfig, IThemeUpdateData } from '../types/theme.types';

const themeService = {
  getCurrentTheme: async () => {
    return axiosClient.get<IThemeConfig>('/themes/current');
  },

  getAllThemes: async () => {
    return axiosClient.get<IThemeConfig[]>('/themes');
  },

  createTheme: async (data: IThemeUpdateData) => {
    return axiosClient.post<IThemeConfig>('/themes', data);
  },

  updateTheme: async (id: string, data: IThemeUpdateData) => {
    return axiosClient.put<IThemeConfig>(`/themes/${id}`, data);
  },

  activateTheme: async (id: string) => {
    return axiosClient.patch<IThemeConfig>(`/themes/${id}/activate`);
  },

  deleteTheme: async (id: string) => {
    return axiosClient.delete(`/themes/${id}`);
  }
};

export default themeService;
