import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createSession, sanitizeInput } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = sanitizeInput(body.name || '');
    const email = sanitizeInput(body.email || '').toLowerCase();
    const password = body.password || '';
    const role = sanitizeInput(body.role || 'User');

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const validRoles = ['Admin', 'Analyst', 'User'];
    const userRole = validRoles.includes(role) ? role : 'User';

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashPassword(password),
        role: userRole,
        status: 'Active',
      },
    });

    await db.securityLog.create({
      data: {
        type: 'LOGIN_SUCCESS',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        details: `New account created and logged in: ${user.name} (${user.role})`,
        severity: 'Low',
        userId: user.id,
      },
    });

    const { token } = createSession({ id: user.id, email: user.email, name: user.name, role: user.role });

    const response = NextResponse.json({
      message: 'Registration successful',
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
