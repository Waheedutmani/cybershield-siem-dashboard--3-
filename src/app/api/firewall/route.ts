import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, sanitizeInput } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('cybershield_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    const severity = url.searchParams.get('severity') || '';

    const where: Record<string, unknown> = {};
    if (search) {
      where.ipAddress = { contains: search };
    }
    if (severity) {
      where.severity = severity;
    }

    const [blockedIPs, total] = await Promise.all([
      db.blockedIP.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.blockedIP.count({ where }),
    ]);

    return NextResponse.json({ blockedIPs, total, page, limit });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('cybershield_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const ip = sanitizeInput(body.ip || '');
    const reason = sanitizeInput(body.reason || '');
    const severity = sanitizeInput(body.severity || 'Medium');

    if (!ip) {
      return NextResponse.json({ error: 'IP address is required' }, { status: 400 });
    }

    // Simple IP format validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      return NextResponse.json({ error: 'Invalid IP address format' }, { status: 400 });
    }

    const blockedIP = await db.blockedIP.upsert({
      where: { ipAddress: ip },
      update: { reason, severity, blockedBy: session.user.name },
      create: {
        ipAddress: ip,
        reason,
        severity,
        blockedBy: session.user.name,
        autoBlocked: false,
      },
    });

    await db.activityLog.create({
      data: {
        action: 'IP_BLOCKED',
        userId: session.user.id,
        details: `${session.user.name} manually blocked IP ${ip}: ${reason}`,
        ipAddress: ip,
      },
    });

    return NextResponse.json({ success: true, blockedIP });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('cybershield_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const ip = sanitizeInput(body.ip || '');

    if (!ip) {
      return NextResponse.json({ error: 'IP address is required' }, { status: 400 });
    }

    await db.blockedIP.delete({ where: { ipAddress: ip } });

    await db.activityLog.create({
      data: {
        action: 'IP_UNBLOCKED',
        userId: session.user.id,
        details: `${session.user.name} unblocked IP ${ip}`,
        ipAddress: ip,
      },
    });

    return NextResponse.json({ success: true, message: `IP ${ip} unblocked` });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
