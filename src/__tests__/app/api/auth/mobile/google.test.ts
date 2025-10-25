import { POST } from '@/app/api/auth/mobile/google/route';
import { NextRequest } from 'next/server';

// Mock fetch globally
global.fetch = jest.fn();

describe('Mobile Google OAuth Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should return error if code is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/mobile/google', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Authorization code is required');
  });

  it('should exchange code for tokens successfully', async () => {
    // Mock token exchange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      }),
    });

    // Mock user info
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/photo.jpg',
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/auth/mobile/google', {
      method: 'POST',
      body: JSON.stringify({ code: 'test-auth-code' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.tokens).toBeDefined();
    expect(data.tokens.accessToken).toBe('test-access-token');
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('test@example.com');
  });

  it('should handle token exchange failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => 'Invalid authorization code',
    });

    const request = new NextRequest('http://localhost:3000/api/auth/mobile/google', {
      method: 'POST',
      body: JSON.stringify({ code: 'invalid-code' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Failed to exchange authorization code');
  });

  it('should handle user info fetch failure', async () => {
    // Mock successful token exchange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      }),
    });

    // Mock failed user info
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    const request = new NextRequest('http://localhost:3000/api/auth/mobile/google', {
      method: 'POST',
      body: JSON.stringify({ code: 'test-auth-code' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Failed to get user info');
  });

  it('should handle unexpected errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const request = new NextRequest('http://localhost:3000/api/auth/mobile/google', {
      method: 'POST',
      body: JSON.stringify({ code: 'test-auth-code' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');
  });
});
