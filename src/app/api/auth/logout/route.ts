import { NextRequest, NextResponse } from 'next/server';
import { destroySession, getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('cybershield_session')?.value;
    if (token) {
      const session = getSession(token);
      if (session) {
        const { db } = await import('@/lib/db');
        await db.securityLog.create({
          data: {
            type: 'LOGOUT',
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            details: `User logged out: ${session.user.name}`,
            severity: 'Low',
            userId: session.user.id,
          },
        });
      }
      destroySession(token);
    }

    const response = NextResponse.json({ message: 'Logged out successfully' });
    response.cookies.set('cybershield_session', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
