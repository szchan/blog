"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getMe, login, logout } from "@/lib/admin-api";
import { setToken, removeToken } from "@/lib/auth";
import type { LoginRequest } from "@/lib/types";

export function useMe() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    retry: false,
    staleTime: Infinity,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const result = await login(data);
      setToken(result.access_token);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      router.push("/admin/posts");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      removeToken();
      queryClient.clear();
      router.push("/admin/login");
    },
  });
}
