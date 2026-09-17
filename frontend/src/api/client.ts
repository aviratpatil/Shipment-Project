import type { ApiResponse } from "../types";

const BASE_URL = "http://localhost:5000/api";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    const errorMsg =
      data.message ||
      (data.errors && data.errors.map((e) => e.message).join(", ")) ||
      "An unexpected error occurred.";
    throw new Error(errorMsg);
  }

  return data;
}
