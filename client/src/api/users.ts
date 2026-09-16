import { api } from "@/api/client";
import { User, UserRole } from "@/types";

export async function listUsers() {
  const { data } = await api.get<User[]>("/users");
  return data;
}

export async function createUser(payload: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}) {
  const { data } = await api.post<User>("/users", payload);
  return data;
}

export async function updateUser(id: string, payload: Partial<User>) {
  const { data } = await api.patch<User>(`/users/${id}`, payload);
  return data;
}
