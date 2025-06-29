// API client for Mozaia Backend
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import config from './config';
import type {
  ApiResponse,
  GenerationRequest,
  OrchestratorResponse,
  Conversation,
  Message,
  HealthStatus,
  SystemMetrics,
  ModelInfo,
  User,
} from '@/types';

// Base API client configuration
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: config.api.baseUrl,
    timeout: config.api.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      // Add auth token if available
      const token = localStorage.getItem('mozaia_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add request ID for tracking
      config.headers['X-Request-ID'] = crypto.randomUUID();
      
      // Log requests in development
      if (config.app.debug) {
        console.log('API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data,
        });
      }

      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log responses in development
      if (config.app.debug) {
        console.log('API Response:', {
          status: response.status,
          url: response.config.url,
          data: response.data,
        });
      }

      return response;
    },
    async (error: AxiosError) => {
      const { response, request, code } = error;

      // Log errors
      console.error('API Error:', {
        code,
        status: response?.status,
        url: request?.responseURL || error.config?.url,
        message: error.message,
        data: response?.data,
      });

      // Handle specific error cases
      if (response?.status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('mozaia_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (response?.status === 429) {
        // Rate limited
        toast.error('Muitas requisições. Tente novamente em alguns segundos.');
        return Promise.reject(error);
      }

      if (response?.status === 503) {
        // Service unavailable
        toast.error('Serviço temporariamente indisponível. Tente novamente.');
        return Promise.reject(error);
      }

      if (code === 'ECONNABORTED') {
        // Timeout
        toast.error('Tempo limite da requisição excedido. Tente novamente.');
        return Promise.reject(error);
      }

      if (!response) {
        // Network error
        toast.error('Erro de conexão. Verifique sua internet.');
        return Promise.reject(error);
      }

      // Generic error
      const errorMessage = 
        response?.data?.message || 
        response?.data?.error || 
        'Erro interno do servidor';
      
      toast.error(errorMessage);
      return Promise.reject(error);
    }
  );

  return client;
};

// Create API client instance
const api = createApiClient();

// Helper function to handle API responses
const handleResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  return response.data.data!;
};

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return handleResponse<{ user: User; token: string }>(response);
  },

  register: async (email: string, password: string, name?: string) => {
    const response = await api.post('/auth/register', { email, password, name });
    return handleResponse<{ user: User; token: string }>(response);
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('mozaia_token');
  },

  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    return handleResponse<{ token: string }>(response);
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return handleResponse<User>(response);
  },
};

// Chat API
export const chatApi = {
  generate: async (request: GenerationRequest): Promise<OrchestratorResponse> => {
    const response = await api.post('/api/v1/generate', request);
    return handleResponse<OrchestratorResponse>(response);
  },

  streamGenerate: async function* (request: Omit<GenerationRequest, 'enable_streaming'>) {
    const response = await api.post('/api/v1/stream', request, {
      responseType: 'stream',
      headers: {
        'Accept': 'text/event-stream',
      },
    });

    const reader = response.data.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            yield data;
            
            if (data.is_final) {
              return;
            }
          } catch (error) {
            console.error('Error parsing stream chunk:', error);
          }
        }
      }
    }
  },

  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get('/api/v1/conversations');
    return handleResponse<Conversation[]>(response);
  },

  getConversation: async (id: string): Promise<Conversation> => {
    const response = await api.get(`/api/v1/conversations/${id}`);
    return handleResponse<Conversation>(response);
  },

  createConversation: async (title: string, context: string): Promise<Conversation> => {
    const response = await api.post('/api/v1/conversations', { title, context });
    return handleResponse<Conversation>(response);
  },

  updateConversation: async (id: string, updates: Partial<Conversation>): Promise<Conversation> => {
    const response = await api.patch(`/api/v1/conversations/${id}`, updates);
    return handleResponse<Conversation>(response);
  },

  deleteConversation: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/conversations/${id}`);
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const response = await api.get(`/api/v1/conversations/${conversationId}/messages`);
    return handleResponse<Message[]>(response);
  },

  createMessage: async (conversationId: string, content: string, role: 'user' | 'assistant' = 'user'): Promise<Message> => {
    const response = await api.post(`/api/v1/conversations/${conversationId}/messages`, {
      content,
      role,
    });
    return handleResponse<Message>(response);
  },

  updateMessage: async (conversationId: string, messageId: string, updates: Partial<Message>): Promise<Message> => {
    const response = await api.patch(`/api/v1/conversations/${conversationId}/messages/${messageId}`, updates);
    return handleResponse<Message>(response);
  },

  deleteMessage: async (conversationId: string, messageId: string): Promise<void> => {
    await api.delete(`/api/v1/conversations/${conversationId}/messages/${messageId}`);
  },
};

// System API
export const systemApi = {
  getHealth: async (): Promise<HealthStatus> => {
    const response = await api.get('/health');
    return handleResponse<HealthStatus>(response);
  },

  getMetrics: async (): Promise<SystemMetrics> => {
    const response = await api.get('/metrics');
    return handleResponse<SystemMetrics>(response);
  },

  getModels: async (): Promise<ModelInfo[]> => {
    const response = await api.get('/models');
    return handleResponse<ModelInfo[]>(response);
  },

  clearCache: async (): Promise<void> => {
    await api.post('/admin/cache/clear');
  },

  preloadModel: async (modelName: string, count: number = 2): Promise<{ created: number }> => {
    const response = await api.post(`/admin/pool/${modelName}/preload`, { count });
    return handleResponse<{ created: number }>(response);
  },
};

// Upload API
export const uploadApi = {
  uploadFile: async (file: File, onProgress?: (progress: number) => void): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/v1/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(progress);
        }
      },
    });

    return handleResponse<{ url: string; filename: string }>(response);
  },
};

// Export default API client for custom requests
export default api;

// Utility functions
export const isApiError = (error: any): error is AxiosError => {
  return error?.isAxiosError === true;
};

export const getApiErrorMessage = (error: any): string => {
  if (isApiError(error)) {
    return error.response?.data?.message || 
           error.response?.data?.error || 
           error.message ||
           'Erro desconhecido da API';
  }
  return error?.message || 'Erro desconhecido';
};

// Health check utility
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    await systemApi.getHealth();
    return true;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};
