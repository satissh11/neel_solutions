export async function readApiResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('json')) {
    throw new Error(
      `The API returned a non-JSON response (HTTP ${response.status}). Check that the API service is running and connected to its database.`,
    );
  }

  let data: T;
  try {
    data = await response.json() as T;
  } catch {
    throw new Error('The API returned invalid JSON. Please try again later.');
  }

  if (!response.ok) {
    const error = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
      ? data.error
      : `The API request failed (HTTP ${response.status}).`;
    throw new Error(error);
  }

  return data;
}
