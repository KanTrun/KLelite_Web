import connectDB from '../config/database';

// Mock the prisma module
jest.mock('../lib/prisma', () => ({
  $connect: jest.fn(),
  $disconnect: jest.fn(),
}));

import prisma from '../lib/prisma';

describe('Database Stability', () => {
  let exitSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let setTimeoutSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
        throw new Error(`Process.exit called with ${code}`);
    });
    logSpy = jest.spyOn(console, 'log').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();

    setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((handler: any) => {
        if (typeof handler === 'function') {
            handler();
        }
        return {} as any;
    });
  });

  afterEach(() => {
    exitSpy.mockRestore();
    logSpy.mockRestore();
    errorSpy.mockRestore();
    setTimeoutSpy.mockRestore();
  });

  it('should retry connecting to MySQL with exponential backoff on failure', async () => {
    const connectMock = prisma.$connect as jest.Mock;
    connectMock
      .mockRejectedValueOnce(new Error('Connection failed 1'))
      .mockRejectedValueOnce(new Error('Connection failed 2'))
      .mockResolvedValueOnce(undefined);

    await connectDB();
    expect(connectMock).toHaveBeenCalledTimes(3);
    expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 5000);
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 10000);
  });

  it('should exit process after maximum retries', async () => {
    const connectMock = prisma.$connect as jest.Mock;
    connectMock.mockRejectedValue(new Error('Persistent failure'));
    await expect(connectDB()).rejects.toThrow('Process.exit called with 1');
    expect(connectMock).toHaveBeenCalledTimes(5);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
