// types/auth.ts
export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  roles: string[]; // Или UserRole[] если есть enum/type
  createdAt: string; // Или Date
  updatedAt: string; // Или Date
}

// Можно добавить и другие типы, связанные с аутентификацией, сюда же
// export interface LoginResponseDto { ... }
// export type UserRole = 'ADMIN' | 'ANALYST' | 'MANAGER';
