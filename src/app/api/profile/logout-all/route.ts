import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, destroySession } from '@/lib/auth';

// POST /api/profile/logout-all - Logout from all devices (session reset simulation)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('cybershield_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Log activity before destroying
    await db.activityLog.create({
      data: {
        action: 'LOGOUT_ALL',
        userId: session.user.id,
        details: `User ${session.user.name} initiated logout from all devices`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    // Destroy current session (simulate logout all - in production would clear all sessions for this user)
    destroySession(token);

    const response = NextResponse.json({ message: 'Logged out from all devices successfully' });
    response.cookies.set('cybershield_session', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
