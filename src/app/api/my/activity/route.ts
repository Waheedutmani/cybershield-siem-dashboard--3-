import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/my/activity - Personal activity data for User role dashboard
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('cybershield_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;

    // Fetch personal login history (last 10)
    const loginLogs = await db.securityLog.findMany({
      where: {
        OR: [
          { type: 'LOGIN_SUCCESS' },
          { type: 'LOGIN_FAILED' },
        ],
        userId: userId,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Fetch personal alerts count
    const personalAlerts = await db.securityAlert.count({
      where: {
        resolvedBy: session.user.name,
      },
    });

    // Fetch total alerts in system
    const totalAlerts = await db.securityAlert.count();

    // Fetch recent activity logs for this user
    const activityLogs = await db.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Count user's sessions
    const sessionCount = await db.activityLog.count({
      where: {
        userId,
        action: 'LOGIN_SUCCESS',
      },
    });

    // Get latest security logs (read-only for User)
    const recentSecurityLogs = await db.securityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Personal stats
    const failedLogins = await db.securityLog.count({
      where: {
        type: 'LOGIN_FAILED',
        userId,
      },
    });

    const successfulLogins = await db.securityLog.count({
      where: {
        type: 'LOGIN_SUCCESS',
        userId,
      },
    });

    return NextResponse.json({
      loginHistory: loginLogs,
      personalAlerts,
      totalAlerts,
      activityLogs,
      sessionCount,
      recentSecurityLogs,
      failedLogins,
      successfulLogins,
      user: {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        lastLogin: session.user.lastLogin,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
