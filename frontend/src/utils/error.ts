export function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object' &&
    (error as { response?: unknown }).response !== null
  ) {
    const response = (error as { response: { data?: unknown } }).response;
    const data = response.data;
    if (typeof data === 'object' && data !== null) {
      const apiError = (data as { error?: unknown }).error;
      if (typeof apiError === 'string' && apiError.trim()) {
        return apiError;
      }
      const apiMessage = (data as { message?: unknown }).message;
      if (typeof apiMessage === 'string' && apiMessage.trim()) {
        return apiMessage;
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
