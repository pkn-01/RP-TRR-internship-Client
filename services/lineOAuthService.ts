// services/lineOAuthService.ts
// Helper service for LINE OAuth integration

export interface LineAuthResponse {
  auth_url: string;
  client_id: string;
  redirect_uri: string;
  state: string;
}

export class LineOAuthService {
  /**
   * Get the LINE OAuth authorization URL from backend
   * This helps ensure redirect_uri matches between backend and LINE Console
   */
  static async getAuthUrl(): Promise<LineAuthResponse> {
    try {
      const response = await fetch('/api/auth/line-auth-url');
      
      if (!response.ok) {
        throw new Error('Failed to get LINE auth URL from backend');
      }

      const data = await response.json();
      console.log('[LINE OAuth] Authorization URL retrieved:', {
        client_id: data.client_id,
        redirect_uri: data.redirect_uri,
      });
      
      return data;
    } catch (error: any) {
      console.error('[LINE OAuth] Error getting auth URL:', error.message);
      throw error;
    }
  }

  /**
   * Redirect to LINE OAuth authorization page
   */
  static async redirectToLineAuth(): Promise<void> {
    try {
      const authData = await this.getAuthUrl();
      console.log('[LINE OAuth] Redirecting to:', authData.auth_url);
      window.location.href = authData.auth_url;
    } catch (error: any) {
      console.error('[LINE OAuth] Failed to redirect:', error.message);
      throw new Error('Failed to initiate LINE authentication. Please try again.');
    }
  }

  /**
   * Send authorization code to backend for token exchange
   */
  static async exchangeCodeForToken(code: string, state?: string): Promise<any> {
    try {
      console.log('[LINE OAuth] Exchanging authorization code:', code.substring(0, 10) + '...');
      
      const response = await fetch('/api/auth/line-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          state,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Authentication failed with status ${response.status}`
        );
      }

      const data = await response.json();
      console.log('[LINE OAuth] Token exchange successful');
      return data;
    } catch (error: any) {
      console.error('[LINE OAuth] Token exchange error:', error.message);
      throw error;
    }
  }

  /**
   * Verify that redirect_uri in .env matches what backend is using
   * Useful for debugging redirect_uri mismatch errors
   */
  static async verifyRedirectUri(): Promise<{ match: boolean; details: LineAuthResponse }> {
    try {
      const authData = await this.getAuthUrl();
      
      // Extract redirect_uri from the auth_url
      const url = new URL(authData.auth_url);
      const redirectUriFromUrl = url.searchParams.get('redirect_uri');
      
      const match = redirectUriFromUrl === authData.redirect_uri;
      
      console.log('[LINE OAuth] Redirect URI verification:', {
        fromUrl: redirectUriFromUrl,
        fromResponse: authData.redirect_uri,
        match,
      });
      
      return {
        match,
        details: authData,
      };
    } catch (error: any) {
      console.error('[LINE OAuth] Verification error:', error.message);
      throw error;
    }
  }
}

// Usage example in a component:
/*
import { LineOAuthService } from '@/services/lineOAuthService';

// In your login component:
const handleLineLogin = async () => {
  try {
    await LineOAuthService.redirectToLineAuth();
  } catch (error) {
    setErrorMessage(error.message);
  }
};

// In your callback page:
const code = searchParams.get('code');
const state = searchParams.get('state');
try {
  const result = await LineOAuthService.exchangeCodeForToken(code, state);
  localStorage.setItem('access_token', result.access_token);
  router.push('/dashboard');
} catch (error) {
  console.error('Failed to authenticate:', error);
  setError(error.message);
}

// For debugging redirect_uri issues:
const { match, details } = await LineOAuthService.verifyRedirectUri();
if (!match) {
  console.warn('Redirect URI mismatch detected!');
  console.warn('Backend is using:', details.redirect_uri);
  console.warn('Make sure this matches your LINE Console settings');
}
*/
