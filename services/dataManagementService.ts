import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface DataTypeInfo {
  key: string;
  label: string;
  icon: string;
  count: number;
  description: string;
}

export const dataManagementService = {
  async getDataTypes(): Promise<DataTypeInfo[]> {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${API_URL}/data-management/types`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async clearData(types: string[], exportFirst: boolean): Promise<any> {
    const token = localStorage.getItem('access_token');
    const response = await axios.post(
      `${API_URL}/data-management/clear`,
      { types, exportFirst },
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: exportFirst ? 'blob' : 'json',
      }
    );
    return response;
  },

  async exportData(types: string[]): Promise<Blob> {
    const token = localStorage.getItem('access_token');
    const response = await axios.post(
      `${API_URL}/data-management/export`,
      { types },
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      }
    );
    return response.data;
  },
};
