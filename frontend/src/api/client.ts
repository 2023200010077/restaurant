
const API_BASE_URL = "http://localhost:5000/api";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    }
  );

  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(
      result.message || "An API request failed."
    );
  }

  return result;
}

export async function apiGet<T>(
  endpoint: string
): Promise<ApiResponse<T>> {
  return request<T>(endpoint);
}

export async function apiPost<T>(
  endpoint: string,
  body: unknown
): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiPut<T>(
  endpoint: string,
  body: unknown
): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function apiDelete<T>(
  endpoint: string
): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    method: "DELETE",
  });
}