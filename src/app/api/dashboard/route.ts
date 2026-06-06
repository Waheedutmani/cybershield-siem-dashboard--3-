import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('cybershield_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalAlerts,
      failedLogins,
      activeUsers,
      recentLogs,
      criticalAlerts,
      highAlerts,
      mediumAlerts,
      lowAlerts,
      blockedIPs,
    ] = await Promise.all([
      db.securityAlert.count(),
      db.securityLog.count({ where: { type: 'LOGIN_FAILED' } }),
      db.user.count({ where: { status: 'Active' } }),
      db.securityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      db.securityAlert.count({ where: { severity: 'Critical', status: { not: 'Resolved' } } }),
      db.securityAlert.count({ where: { severity: 'High', status: { not: 'Resolved' } } }),
      db.securityAlert.count({ where: { severity: 'Medium', status: { not: 'Resolved' } } }),
      db.securityAlert.count({ where: { severity: 'Low', status: { not: 'Resolved' } } }),
      db.blockedIP.count(),
    ]);

    const recentFailedLogins = await db.securityLog.count({
      where: {
        type: 'LOGIN_FAILED',
        createdAt: { gte: oneHourAgo },
      },
    });

    const recentAttacks = await db.securityLog.count({
      where: {
        type: { in: ['BRUTE_FORCE', 'SQL_INJECTION', 'XSS_ATTACK', 'PORT_SCAN', 'DDOS_ATTEMPT', 'MALWARE_DETECTION', 'PHISHING', 'UNAUTHORIZED_ACCESS', 'SUSPICIOUS_IP'] },
        createdAt: { gte: oneDayAgo },
      },
    });

    // Calculate average threat score from recent events
    const recentScoredLogs = await db.securityLog.findMany({
      where: {
        createdAt: { gte: oneHourAgo },
        threatScore: { gt: 0 },
      },
      select: { threatScore: true },
    });

    let threatScore = 0;
    if (recentScoredLogs.length > 0) {
      const avg = recentScoredLogs.reduce((sum, l) => sum + l.threatScore, 0) / recentScoredLogs.length;
      threatScore = Math.round(avg);
    }

    let threatLevel = 'Low';
    if (criticalAlerts > 0) threatLevel = 'Critical';
    else if (highAlerts > 2) threatLevel = 'High';
    else if (highAlerts > 0 || mediumAlerts > 5) threatLevel = 'Medium';

    // Check simulation status
    const simulationStatus = false; // Will be checked from engine

    return NextResponse.json({
      totalAlerts,
      failedLogins,
      activeUsers,
      recentLogs,
      threatLevel,
      threatBreakdown: { critical: criticalAlerts, high: highAlerts, medium: mediumAlerts, low: lowAlerts },
      recentFailedLogins,
      recentAttacks,
      blockedIPs,
      threatScore,
      simulationStatus,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
