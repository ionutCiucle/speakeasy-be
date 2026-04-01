import { describe, it, expect, vi, beforeEach } from 'vitest';
import { register, login } from './controller';
import { validate } from '@speakeasy/middleware';
import { authSchema } from './routes';
import * as store from './store';

vi.mock('./store');

const mockReq = (body: object) => ({ body } as never);
const mockRes = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_EXPIRES_IN = '7d';
});

describe('payload validation', () => {
  const validateAuth = validate(authSchema);
  const next = vi.fn();

  beforeEach(() => next.mockReset());

  it.each([
    ['missing email', { password: 'pass' }],
    ['missing password', { email: 'a@b.com' }],
    ['empty email', { email: '', password: 'pass' }],
    ['empty password', { email: 'a@b.com', password: '' }],
  ])('returns 400 when %s', (_label, body) => {
    const res = mockRes();
    validateAuth(mockReq(body), res as never, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Validation failed' }));
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() for a valid payload', () => {
    const res = mockRes();
    validateAuth(mockReq({ email: 'a@b.com', password: 'pass' }), res as never, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('register', () => {
  it('returns 409 when email is already in use', async () => {
    vi.mocked(store.findUserByEmail).mockResolvedValue({ id: '1', email: 'a@b.com', passwordHash: 'h', createdAt: new Date() });
    const res = mockRes();
    await register(mockReq({ email: 'a@b.com', password: 'pass' }), res as never);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email already in use' });
  });

  it('returns 201 with token and user on success', async () => {
    vi.mocked(store.findUserByEmail).mockResolvedValue(null);
    vi.mocked(store.createUser).mockResolvedValue({ id: 'abc', email: 'a@b.com', passwordHash: 'h', createdAt: new Date() });
    const res = mockRes();
    await register(mockReq({ email: 'a@b.com', password: 'pass' }), res as never);
    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.json.mock.calls[0][0];
    expect(body).toHaveProperty('token');
    expect(body.user).toEqual({ id: 'abc', email: 'a@b.com' });
  });
});

describe('login', () => {
  it('returns 401 when user is not found', async () => {
    vi.mocked(store.findUserByEmail).mockResolvedValue(null);
    const res = mockRes();
    await login(mockReq({ email: 'a@b.com', password: 'pass' }), res as never);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
  });

  it('returns 401 when password is wrong', async () => {
    vi.mocked(store.findUserByEmail).mockResolvedValue({ id: '1', email: 'a@b.com', passwordHash: 'wrong-hash', createdAt: new Date() });
    const res = mockRes();
    await login(mockReq({ email: 'a@b.com', password: 'pass' }), res as never);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns token and user on success', async () => {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash('correct', 12);
    vi.mocked(store.findUserByEmail).mockResolvedValue({ id: '1', email: 'a@b.com', passwordHash: hash, createdAt: new Date() });
    const res = mockRes();
    await login(mockReq({ email: 'a@b.com', password: 'correct' }), res as never);
    expect(res.status).not.toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body).toHaveProperty('token');
    expect(body.user).toEqual({ id: '1', email: 'a@b.com' });
  });
});
