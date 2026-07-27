import { GET } from './route';

describe('GET /health', () => {
  it('returns a stable web health response', async () => {
    const response = GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 'ok',
      service: 'web',
    });
  });
});
