import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    console.log('[Frontend API] Getting LINE auth URL from backend');

    // Call your NestJS backend to get LINE OAuth authorization URL
    const response = await fetch(`${API_BASE_URL}/api/auth/line-auth-url`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Backend error:', data);
      return NextResponse.json(
        { message: data.message || 'Failed to get auth URL' },
        { status: response.status }
      );
    }

    console.log('[Frontend API] LINE auth URL retrieved successfully');
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Line auth URL error:', error);
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}
