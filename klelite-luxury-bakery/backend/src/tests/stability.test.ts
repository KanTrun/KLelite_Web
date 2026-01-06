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

  it('should connect to MySQL once successfully', async () => {
    const connectMock = prisma.$connect as jest.Mock;
    connectMock.mockResolvedValue(undefined);

    await connectDB();
    expect(connectMock).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith('MySQL Connected via Prisma');
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should log an error and not exit on MySQL connection failure', async () => {
    const connectMock = prisma.$connect as jest.Mock;
    connectMock.mockRejectedValue(new Error('Connection failed'));

    await connectDB();
    expect(connectMock).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('MySQL connection failed'));
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
