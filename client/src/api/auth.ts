import { api } from "@/api/client";
import { User } from "@/types";

export async function login(email: string, password: string) {
  const { data } = await api.post<{ token: string; user: User }>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function register(payload: {
  companyName: string;
  name: string;
  email: string;
  password: string;
}) {
  const { data } = await api.post<{ token: string; user: User }>("/auth/register", payload);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get<User>("/auth/me");
  return data;
}
