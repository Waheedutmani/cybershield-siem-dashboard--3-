import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('cybershield_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const eventType = url.searchParams.get('type') || '';

    // Fetch all events in parallel
    const logsPromise = db.securityLog.findMany({
      ...(eventType ? { where: { type: eventType.toUpperCase() } } : {}),
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const alertsPromise = db.securityAlert.findMany({
      ...(eventType ? { where: { title: { contains: eventType } } } : {}),
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const blockedIPsPromise = db.blockedIP.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const [logs, alerts, blockedIPs] = await Promise.all([logsPromise, alertsPromise, blockedIPsPromise]);

    // Combine into timeline events
    const events = [
      ...logs.map((log) => ({
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        type: 'log',
        eventType: log.type,
        description: log.details,
        severity: log.severity,
        sourceIp: log.ipAddress,
        threatScore: log.threatScore,
      })),
      ...alerts.map((alert) => ({
        id: alert.id,
        timestamp: alert.createdAt.toISOString(),
        type: 'alert',
        eventType: 'ALERT',
        description: alert.description,
        severity: alert.severity,
        sourceIp: alert.sourceIp,
        title: alert.title,
        status: alert.status,
        threatScore: alert.threatScore,
      })),
      ...blockedIPs.map((bip) => ({
        id: bip.id,
        timestamp: bip.createdAt.toISOString(),
        type: 'blocked_ip',
        eventType: 'BLOCKED_IP',
        description: bip.reason,
        severity: bip.severity,
        sourceIp: bip.ipAddress,
        autoBlocked: bip.autoBlocked,
        blockedBy: bip.blockedBy,
      })),
    ];

    // Sort by timestamp descending
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const paginatedEvents = events.slice(offset, offset + limit);

    return NextResponse.json({ events: paginatedEvents, total: events.length, limit, offset });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
