declare module "~/types/admin" {
  // Повторяем структуру UpdateUserDto с бэкенда
  export interface UpdateUserDto {
    name?: string;
    roles?: string[]; // Используем string[], т.к. UserRole может быть не экспортирован глобально
  }
}
