import axios from 'axios';
import { Client, DuoException, util } from '../../src';

const clientOps = {
  clientId: '12345678901234567890',
  clientSecret: '1234567890123456789012345678901234567890',
  apiHost: 'api-123456.duo.com',
  redirectUrl: 'https://redirect-example.com/callback',
};

const healthCheckGoodHttpRequest = { response: { timestamp: util.getTimeInSeconds() }, stat: 'OK' };
const healthCheckFailedHttpRequest = {
  code: 40002,
  message: 'invalid_client',
  message_detail: 'Failed to verify signature.',
  stat: 'FAIL',
  timestamp: util.getTimeInSeconds(),
};
const healthCheckMissingStatRequest = { response: { timestamp: util.getTimeInSeconds() } };
const healthCheckMissingMessageRequest = { stat: 'FAIL' };

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Health check', () => {
  beforeAll(() => {
    mockedAxios.create.mockReturnThis();
  });

  it('should thrown when failed', async () => {
    const client = new Client(clientOps);
    const response = { data: healthCheckFailedHttpRequest };
    mockedAxios.post.mockResolvedValue(response);

    await expect(client.healthCheck()).rejects.toBeInstanceOf(DuoException);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('should thrown with missing response data #1', async () => {
    const client = new Client(clientOps);
    const response = { data: healthCheckMissingMessageRequest };
    mockedAxios.post.mockResolvedValue(response);

    await expect(client.healthCheck()).rejects.toBeInstanceOf(DuoException);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('should thrown with missing response data #2', async () => {
    const client = new Client(clientOps);
    const response = { data: healthCheckMissingStatRequest };
    mockedAxios.post.mockResolvedValue(response);

    await expect(client.healthCheck()).rejects.toBeInstanceOf(DuoException);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('should return correct health check response', async () => {
    const client = new Client(clientOps);
    const response = { data: healthCheckGoodHttpRequest };
    mockedAxios.post.mockResolvedValue(response);

    const healthCheck = await client.healthCheck();

    expect(healthCheck).toBe(response.data);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });
});
