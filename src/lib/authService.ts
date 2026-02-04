import { apiFetch } from '../../services/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  department?: string;
  phoneNumber?: string;
  lineId?: string;
}

export interface AuthResponse {
  access_token: string;
  userId: number;
  role?: string;
  message?: string;
}

export class AuthService {
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiFetch('/auth/login', 'POST', {
        email: credentials.email,
        password: credentials.password,
      });

      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('userId', response.userId?.toString() || '');
        // ✅ ตรวจสอบ role จาก response ก่อน ไม่ใช่ใช้ default 'USER'
        const role = (response.role || 'USER').toUpperCase();
        localStorage.setItem('role', role);
        // console.log('Login successful - Role:', role); // Debug log
        return { ...response, role };
      }

      throw new Error(response.message || 'Login failed');
    } catch (error: any) {
      throw new Error(error.message || 'An error occurred during login');
    }
  }

  static async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const response = await apiFetch('/auth/register', 'POST', {
        name: data.name,
        email: data.email,
        password: data.password,
        department: data.department,
        phoneNumber: data.phoneNumber,
        lineId: data.lineId,
      });

      if (response.userId) {
        console.log('Register successful - Role:', response.role); // Debug log
        return response;
      }

      throw new Error(response.message || 'Registration failed');
    } catch (error: any) {
      throw new Error(error.message || 'An error occurred during registration');
    }
  }

  static logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
  }

  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('access_token');
  }

  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  static getRole(): string {
    if (typeof window === 'undefined') return 'USER';
    return (localStorage.getItem('role') || 'USER').toUpperCase();
  }

  static isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  static getUserId(): number | null {
    if (typeof window === 'undefined') return null;
    const id = localStorage.getItem('userId');
    return id ? parseInt(id, 10) : null;
  }
}
