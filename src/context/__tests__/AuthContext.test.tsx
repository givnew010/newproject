import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock the api module before importing the AuthProvider
vi.mock('../../lib/api', () => ({
  authApi: {
    login: vi.fn(),
    me: vi.fn(),
  }
}));

import { authApi } from '../../lib/api';
import { AuthProvider, useAuth } from '../AuthContext';

function TestComponent() {
  const { user, loading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{loading ? 'true' : 'false'}</span>
      <span data-testid="user">{user ? (user.username ?? (user as any).fullName ?? 'user') : 'null'}</span>
      <button onClick={() => void login('alice', 'pw')}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  it('initializes with no token', async () => {
    (authApi.me as any).mockResolvedValue({ success: false });
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('login sets user and token', async () => {
    const mockRes = { success: true, data: { token: 'tk', user: { id: 1, username: 'alice', full_name: 'Alice', role: 'admin' } } };
    (authApi.login as any).mockResolvedValue(mockRes);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('alice'));
    expect(localStorage.getItem('auth_token')).toBe('tk');
  });

  it('logout clears token and user', async () => {
    localStorage.setItem('auth_token', 'tk');
    (authApi.me as any).mockResolvedValue({ success: true, data: { id: 1, username: 'alice', full_name: 'Alice', role: 'admin' } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // wait for auth:me to populate user
    await waitFor(() => expect(screen.getByTestId('user').textContent).not.toBe('null'));

    fireEvent.click(screen.getByText('logout'));

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('null'));
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});
