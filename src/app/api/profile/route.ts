import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, sanitizeInput } from '@/lib/auth';

// Helper: get authenticated session
function getAuthSession(request: NextRequest) {
  const token = request.cookies.get('cybershield_session')?.value;
  if (!token) return null;
  const session = getSession(token);
  if (!session) return null;
  return session;
}

// GET /api/profile - Returns full profile data
export async function GET(request: NextRequest) {
  try {
    const session = getAuthSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;
    const role = session.user.role;

    // Fetch user from DB
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        lastLogin: true,
      },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Login history (last 15 entries)
    const loginHistory = await db.securityLog.findMany({
      where: {
        userId,
        OR: [{ type: 'LOGIN_SUCCESS' }, { type: 'LOGIN_FAILED' }],
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    // Login counts
    const failedLoginCount = await db.securityLog.count({
      where: { type: 'LOGIN_FAILED', userId },
    });
    const successfulLoginCount = await db.securityLog.count({
      where: { type: 'LOGIN_SUCCESS', userId },
    });

    // Active sessions count
    const activeSessionsCount = await db.activityLog.count({
      where: { userId, action: 'LOGIN_SUCCESS' },
    });

    // Recent activity logs (last 10)
    const recentActivity = await db.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Alerts resolved by this user
    const alertsResolved = await db.securityAlert.count({
      where: { resolvedBy: session.user.name },
    });

    // Role-based extra data
    const extraData: Record<string, unknown> = {};

    if (role === 'Admin' || role === 'Analyst') {
      extraData.totalAlerts = await db.securityAlert.count();
    }

    if (role === 'Admin') {
      extraData.totalUsers = await db.user.count();
      extraData.blockedIPs = await db.blockedIP.count();
    }

    if (role === 'Analyst') {
      extraData.logsReviewed = await db.activityLog.count({
        where: {
          userId,
          action: { in: ['LOG_VIEWED', 'ALERT_REVIEWED', 'THREAT_INVESTIGATED'] },
        },
      });
    }

    return NextResponse.json({
      user,
      loginHistory,
      failedLoginCount,
      successfulLoginCount,
      activeSessionsCount,
      recentActivity,
      alertsResolved,
      ...extraData,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH /api/profile - Update profile (name, email)
export async function PATCH(request: NextRequest) {
  try {
    const session = getAuthSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const name = body.name ? sanitizeInput(body.name) : undefined;
    const email = body.email ? sanitizeInput(body.email).toLowerCase() : undefined;

    if (!name && !email) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (name && name.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    // Check email uniqueness if changing email
    if (email && email !== session.user.email) {
      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
    }

    const updateData: Record<string, string> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        action: 'PROFILE_UPDATED',
        userId: session.user.id,
        details: `User updated profile: ${Object.keys(updateData).join(', ')}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({ user: updatedUser, message: 'Profile updated successfully' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
