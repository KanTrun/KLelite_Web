
import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { getApiError, ErrorType } from '../services/api';

vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  return {
    ...actual,
    isAxiosError: (err: any) => err.isAxiosError === true,
  };
});

describe('Frontend API Error Handling', () => {
  it('should detect network errors', () => {
    const networkError = {
      isAxiosError: true,
      code: 'ERR_NETWORK',
      message: 'Network Error',
    };

    const result = getApiError(networkError);
    expect(result.type).toBe(ErrorType.NETWORK);
    expect(result.message).toContain('kết nối mạng');
  });

  it('should detect server errors (500)', () => {
    const serverError = {
      isAxiosError: true,
      response: {
        status: 500,
        data: { message: 'Internal Server Error' },
      },
    };

    const result = getApiError(serverError);
    expect(result.type).toBe(ErrorType.SERVER);
    expect(result.message).toContain('máy chủ');
  });

  it('should detect client errors (400)', () => {
    const clientError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: { message: 'Invalid Input' },
      },
    };

    const result = getApiError(clientError);
    expect(result.type).toBe(ErrorType.CLIENT);
    expect(result.message).toBe('Invalid Input');
  });
});
