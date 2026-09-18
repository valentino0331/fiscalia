import { describe, it, expect, vi } from 'vitest';
import { createRateLimiter } from '../middleware/rateLimit';
import { Request, Response } from 'express';

function mockReqRes(ip = '127.0.0.1', path = '/chat') {
  const req = {
    ip,
    baseUrl: '',
    path,
    socket: { remoteAddress: ip },
    headers: {},
  } as unknown as Request;

  const headersSent: Record<string, any> = {};
  let statusCode = 200;
  let jsonBody: any = null;

  const res = {
    setHeader: vi.fn((key: string, val: any) => {
      headersSent[key] = val;
    }),
    status: vi.fn((code: number) => {
      statusCode = code;
      return res;
    }),
    json: vi.fn((body: any) => {
      jsonBody = body;
      return res;
    }),
  } as unknown as Response;

  return { req, res, headersSent, getStatus: () => statusCode, getJson: () => jsonBody };
}

describe('Rate Limiter Middleware', () => {
  it('allows requests within threshold and sets rate limit headers', () => {
    const limiter = createRateLimiter({ windowMs: 10000, max: 3 });
    const { req, res, headersSent, getStatus } = mockReqRes('10.0.0.1');
    const next = vi.fn();

    limiter(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(getStatus()).toBe(200);
    expect(headersSent['X-RateLimit-Limit']).toBe(3);
    expect(headersSent['X-RateLimit-Remaining']).toBe(2);
  });

  it('blocks requests exceeding max limit with 429 status and Retry-After header', () => {
    const limiter = createRateLimiter({ windowMs: 10000, max: 2, message: 'Límite excedido' });
    const ip = '10.0.0.2';
    const next = vi.fn();

    // 1st request - ok
    const req1 = mockReqRes(ip);
    limiter(req1.req, req1.res, next);
    expect(next).toHaveBeenCalledTimes(1);

    // 2nd request - ok
    const req2 = mockReqRes(ip);
    limiter(req2.req, req2.res, next);
    expect(next).toHaveBeenCalledTimes(2);

    // 3rd request - blocked
    const req3 = mockReqRes(ip);
    limiter(req3.req, req3.res, next);
    expect(next).toHaveBeenCalledTimes(2); // next not called
    expect(req3.getStatus()).toBe(429);
    expect(req3.getJson().code).toBe('TOO_MANY_REQUESTS');
    expect(req3.headersSent['Retry-After']).toBeDefined();
  });

  it('tracks different IP addresses independently', () => {
    const limiter = createRateLimiter({ windowMs: 10000, max: 1 });
    const next = vi.fn();

    // IP A request 1
    const reqA1 = mockReqRes('192.168.1.1');
    limiter(reqA1.req, reqA1.res, next);
    expect(reqA1.getStatus()).toBe(200);

    // IP B request 1 (different client, should not be blocked)
    const reqB1 = mockReqRes('192.168.1.2');
    limiter(reqB1.req, reqB1.res, next);
    expect(reqB1.getStatus()).toBe(200);

    // IP A request 2 (should be blocked)
    const reqA2 = mockReqRes('192.168.1.1');
    limiter(reqA2.req, reqA2.res, next);
    expect(reqA2.getStatus()).toBe(429);
  });
});
