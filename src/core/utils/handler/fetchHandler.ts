export const fetchHandler = async (
  url: string,
  options: RequestInit = {},
) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    const text = await response.text();

    let data: any;

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error('Invalid JSON response from server');
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          `Request failed with status ${response.status}`,
      );
    }

    return data;
  } catch (error: any) {
    console.log('❌ Fetch Error:', error?.message || error);
    throw error;
  }
};