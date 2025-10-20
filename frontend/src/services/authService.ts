import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  fullName?: string;
  phoneNumber?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

class AuthService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
    
    // If token exists in localStorage, set it in axios defaults
    if (this.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
    
    this.setupAxiosInterceptors();
  }

  private setupAxiosInterceptors() {
    // Add token to requests
    axios.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Handle auth errors
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
          // Only redirect if we're not already on the login or register page
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, data);
    const authResponse = response.data;
    this.setToken(authResponse.accessToken);
    return authResponse;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, data);
    const authResponse = response.data;
    this.setToken(authResponse.accessToken);
    return authResponse;
  }

  async getProfile(): Promise<User> {
    const response = await axios.get(`${API_BASE_URL}/auth/profile`);
    return response.data;
  }

  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await axios.put(`${API_BASE_URL}/auth/profile`, data);
    return response.data;
  }

  async changePassword(data: ChangePasswordData): Promise<void> {
    await axios.put(`${API_BASE_URL}/auth/change-password`, data);
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
  }

  private setToken(token: string): void {
    this.token = token;
    localStorage.setItem('authToken', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const authService = new AuthService();