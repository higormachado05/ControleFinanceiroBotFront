export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterApiRequest {
  nome: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LinkTelegramAccountRequest {
  conviteCode: string;
  nome: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface ApiErrorResponse {
  mensagem?: string;
}
