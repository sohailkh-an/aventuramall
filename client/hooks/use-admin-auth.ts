"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { User } from "@tiktokshop/shared";

export function useAdminAuth() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'auth', 'me'],
    queryFn: () => apiClient.get<{ data: User }>('/api/admin/auth/me'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    admin: data?.data,
    isLoading,
    error,
    isAuthenticated: !!data?.data,
    refetch,
  };
}
