import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('cybershield_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'logs'; // logs | alerts | report
    const format = searchParams.get('format') || 'csv'; // csv | pdf

    if (type === 'logs') {
      const severity = searchParams.get('severity') || '';
      const search = searchParams.get('search') || '';

      const where: Record<string, unknown> = {};
      if (severity) where.severity = severity;
      if (search) {
        where.OR = [
          { details: { contains: search } },
          { ipAddress: { contains: search } },
        ];
      }

      const logs = await db.securityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5000,
      });

      if (format === 'csv') {
        const csv = [
          'ID,Type,IP Address,Details,Severity,Threat Score,Created At',
          ...logs.map((log) =>
            `"${log.id}","${log.type}","${log.ipAddress}","${log.details.replace(/"/g, '""')}","${log.severity}",${log.threatScore},"${log.createdAt.toISOString()}"`
          ),
        ].join('\n');

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="cybershield-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
          },
        });
      }
    }

    if (type === 'alerts') {
      const severity = searchParams.get('severity') || '';
      const status = searchParams.get('status') || '';

      const where: Record<string, unknown> = {};
      if (severity) where.severity = severity;
      if (status) where.status = status;

      const alerts = await db.securityAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5000,
      });

      if (format === 'csv') {
        const csv = [
          'ID,Title,Description,Severity,Status,Source IP,Threat Score,Created At,Updated At',
          ...alerts.map((alert) =>
            `"${alert.id}","${alert.title}","${alert.description.replace(/"/g, '""')}","${alert.severity}","${alert.status}","${alert.sourceIp || ''}",${alert.threatScore},"${alert.createdAt.toISOString()}","${alert.updatedAt.toISOString()}"`
          ),
        ].join('\n');

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="cybershield-alerts-${new Date().toISOString().slice(0, 10)}.csv"`,
          },
        });
      }
    }

    if (type === 'report') {
      // Generate a comprehensive security report CSV
      const [
        totalAlerts,
        criticalAlerts,
        highAlerts,
        mediumAlerts,
        lowAlerts,
        totalLogs,
        failedLogins,
        blockedIPs,
        activeUsers,
      ] = await Promise.all([
        db.securityAlert.count(),
        db.securityAlert.count({ where: { severity: 'Critical' } }),
        db.securityAlert.count({ where: { severity: 'High' } }),
        db.securityAlert.count({ where: { severity: 'Medium' } }),
        db.securityAlert.count({ where: { severity: 'Low' } }),
        db.securityLog.count(),
        db.securityLog.count({ where: { type: 'LOGIN_FAILED' } }),
        db.blockedIP.count(),
        db.user.count({ where: { status: 'Active' } }),
      ]);

      const recentLogs = await db.securityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const recentAlerts = await db.securityAlert.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const lines: string[] = [];
      lines.push('CYBERSHIELD SIEM SECURITY REPORT');
      lines.push(`Generated: ${new Date().toISOString()}`);
      lines.push('');

      lines.push('=== SUMMARY ===');
      lines.push(`Total Alerts,${totalAlerts}`);
      lines.push(`Critical Alerts,${criticalAlerts}`);
      lines.push(`High Alerts,${highAlerts}`);
      lines.push(`Medium Alerts,${mediumAlerts}`);
      lines.push(`Low Alerts,${lowAlerts}`);
      lines.push(`Total Security Logs,${totalLogs}`);
      lines.push(`Failed Login Attempts,${failedLogins}`);
      lines.push(`Blocked IPs,${blockedIPs}`);
      lines.push(`Active Users,${activeUsers}`);
      lines.push('');

      lines.push('=== RECENT SECURITY LOGS (Last 100) ===');
      lines.push('Type,IP Address,Details,Severity,Threat Score,Timestamp');
      recentLogs.forEach((log) => {
        lines.push(`"${log.type}","${log.ipAddress}","${log.details.replace(/"/g, '""')}","${log.severity}",${log.threatScore},"${log.createdAt.toISOString()}"`);
      });
      lines.push('');

      lines.push('=== RECENT ALERTS (Last 100) ===');
      lines.push('Title,Severity,Status,Source IP,Threat Score,Timestamp');
      recentAlerts.forEach((alert) => {
        lines.push(`"${alert.title}","${alert.severity}","${alert.status}","${alert.sourceIp || ''}",${alert.threatScore},"${alert.createdAt.toISOString()}"`);
      });

      const csv = lines.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="cybershield-report-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid type or format' }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
