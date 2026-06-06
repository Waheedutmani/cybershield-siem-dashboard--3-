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
    const q = searchParams.get('q') || '';
    const type = searchParams.get('type') || '';
    const severity = searchParams.get('severity') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    // Build where clause for SecurityLog
    const logWhere: Record<string, unknown> = {};
    if (q) {
      logWhere.OR = [
        { ipAddress: { contains: q } },
        { details: { contains: q } },
        { type: { contains: q } },
      ];
    }
    if (type) logWhere.type = type;
    if (severity) logWhere.severity = severity;

    // Build where clause for SecurityAlert
    const alertWhere: Record<string, unknown> = {};
    if (q) {
      alertWhere.OR = [
        { sourceIp: { contains: q } },
        { title: { contains: q } },
        { description: { contains: q } },
      ];
    }
    if (severity) alertWhere.severity = severity;

    // Query both tables in parallel
    const [logs, alerts, totalLogs, totalAlerts] = await Promise.all([
      db.securityLog.findMany({
        where: logWhere,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.securityAlert.findMany({
        where: alertWhere,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.securityLog.count({ where: logWhere }),
      db.securityAlert.count({ where: alertWhere }),
    ]);

    // Merge results into a unified format
    const results = [
      ...logs.map((log) => ({
        id: log.id,
        source: 'log' as const,
        type: log.type,
        severity: log.severity,
        ipAddress: log.ipAddress,
        details: log.details,
        title: log.type,
        description: log.details,
        threatScore: log.threatScore,
        status: null,
        createdAt: log.createdAt.toISOString(),
      })),
      ...alerts.map((alert) => ({
        id: alert.id,
        source: 'alert' as const,
        type: alert.title,
        severity: alert.severity,
        ipAddress: alert.sourceIp || 'unknown',
        details: alert.description,
        title: alert.title,
        description: alert.description,
        threatScore: alert.threatScore,
        status: alert.status,
        createdAt: alert.createdAt.toISOString(),
      })),
    ];

    // Sort combined results by date descending
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Paginate the combined results
    const total = totalLogs + totalAlerts;
    const paginatedResults = results.slice(0, limit);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      results: paginatedResults,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
