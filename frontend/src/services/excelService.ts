import { api } from './api';

export interface ExcelRowPreview {
  rowIndex: number;
  name: string;
  caption: string;
  scheduleDateStr?: string;
  scheduleTimeStr?: string;
  scheduledTimeStr: string;
  scheduledTime: string;
  mediaUrl: string;
  postType: string;
  location?: string;
  instagramAccountId?: number;
  valid: boolean;
  validationErrors: string[];
}

export interface ExcelUploadResponse {
  batchId: number;
  fileName: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  rows: ExcelRowPreview[];
}

export interface CommitBatchResponse {
  batchId: number;
  committedCount: number;
  message: string;
}

export const excelService = {
  downloadTemplate: async (): Promise<void> => {
    const response = await api.get('/posts/excel-template', {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'instagram_posts_template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  uploadExcel: async (file: File): Promise<ExcelUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/posts/upload-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  commitBatch: async (
    batchId: number,
    defaultInstagramAccountId?: number,
    selectedRowIndices?: number[]
  ): Promise<CommitBatchResponse> => {
    const response = await api.post('/posts/commit-excel-batch', {
      batchId,
      defaultInstagramAccountId,
      selectedRowIndices
    });
    return response.data;
  }
};
