import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createSession, sanitizeInput, verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = sanitizeInput(body.email || '').toLowerCase();
    const password = body.password || '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      await db.securityLog.create({
        data: {
          type: 'LOGIN_FAILED',
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          details: `Failed login attempt for: ${email}`,
          severity: 'Medium',
        },
      });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!verifyPassword(password, user.password)) {
      await db.securityLog.create({
        data: {
          type: 'LOGIN_FAILED',
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          details: `Failed login attempt for user: ${user.name}`,
          severity: 'Medium',
          userId: user.id,
        },
      });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    await db.securityLog.create({
      data: {
        type: 'LOGIN_SUCCESS',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        details: `Successful login by: ${user.name}`,
        severity: 'Low',
        userId: user.id,
      },
    });

    const { token, session } = createSession({ id: user.id, email: user.email, name: user.name, role: user.role });

    const response = NextResponse.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    });

    response.cookies.set('cybershield_session', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
