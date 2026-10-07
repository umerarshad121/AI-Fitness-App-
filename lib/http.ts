export async function readApiError(response: Response, fallback = 'Something went wrong. Please try again.'): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string') {
      return (data as { error: string }).error;
    }
  } catch {
    /* non-JSON body */
  }
  return fallback;
}

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error('Empty response from server.');
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Invalid response from server.');
  }
}
