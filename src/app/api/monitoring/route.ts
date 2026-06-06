import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('cybershield_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const users = await db.user.findMany({
      orderBy: { name: 'asc' },
    });

    const monitoringData = await Promise.all(
      users.map(async (user) => {
        const loginLogs = await db.securityLog.findMany({
          where: {
            type: 'LOGIN_SUCCESS',
            userId: user.id,
          },
          orderBy: { createdAt: 'desc' },
        });

        const failedLogs = await db.securityLog.findMany({
          where: {
            type: 'LOGIN_FAILED',
            userId: user.id,
          },
          orderBy: { createdAt: 'desc' },
        });

        // Get unique IPs
        const allIps = [
          ...new Set([
            ...loginLogs.map((l) => l.ipAddress),
            ...failedLogs.map((l) => l.ipAddress),
          ]),
        ];

        const lastLogin = loginLogs.length > 0 ? loginLogs[0].createdAt : user.lastLogin;

        // Calculate risk score based on failed logins
        let riskScore = 0;
        if (failedLogs.length > 20) riskScore = 90;
        else if (failedLogs.length > 10) riskScore = 70;
        else if (failedLogs.length > 5) riskScore = 50;
        else if (failedLogs.length > 2) riskScore = 30;
        else riskScore = 10;

        // Count recent activity
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentLogins = loginLogs.filter((l) => l.createdAt >= oneHourAgo).length;
        const recentFailed = failedLogs.filter((l) => l.createdAt >= oneHourAgo).length;

        return {
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          loginCount: loginLogs.length,
          failedLoginCount: failedLogs.length,
          lastLogin: lastLogin ? lastLogin.toISOString() : null,
          ipHistory: allIps,
          recentLogins,
          recentFailed,
          riskScore,
          riskLevel: riskScore >= 70 ? 'High' : riskScore >= 40 ? 'Medium' : 'Low',
        };
      })
    );

    // Sort by risk score descending
    monitoringData.sort((a, b) => b.riskScore - a.riskScore);

    return NextResponse.json({ users: monitoringData });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
