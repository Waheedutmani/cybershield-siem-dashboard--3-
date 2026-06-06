import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, sanitizeInput } from '@/lib/auth';

function randomIp(): string {
  return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

const sqlPayloads = [
  "SELECT * FROM users WHERE 1=1",
  "DROP TABLE users;--",
  "' OR '1'='1' --",
  "UNION SELECT username, password FROM users",
  "'; DELETE FROM users WHERE '1'='1",
];

const xssPayloads = [
  "<script>alert('XSS')</script>",
  "<img src=x onerror=alert(1)>",
  "<svg onload=alert('XSS')>",
  "javascript:alert('XSS')",
  "<body onload=alert('XSS')>",
];

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('cybershield_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // RBAC: Only Admin and Analyst can trigger simulations
    if (session.user.role !== 'Admin' && session.user.role !== 'Analyst') {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const attackType = sanitizeInput(body.attackType || '');

    const ip = randomIp();
    let logType = '';
    let details = '';
    let severity = 'High';
    let alertTitle = '';
    let alertDesc = '';

    switch (attackType) {
      case 'brute_force': {
        const count = Math.floor(Math.random() * 50) + 10;
        logType = 'BRUTE_FORCE';
        details = `Brute force attack detected from ${ip}: ${count} failed login attempts in 5 minutes`;
        severity = 'Critical';
        alertTitle = 'Brute Force Attack Detected';
        alertDesc = `${count} failed login attempts from IP ${ip} in 5 minutes`;

        for (let i = 0; i < Math.min(count, 20); i++) {
          await db.securityLog.create({
            data: {
              type: 'LOGIN_FAILED',
              ipAddress: ip,
              details: `Brute force attempt #${i + 1} from ${ip}`,
              severity: 'High',
            },
          });
        }
        break;
      }
      case 'sql_injection': {
        const payload = sqlPayloads[Math.floor(Math.random() * sqlPayloads.length)];
        logType = 'SQL_INJECTION';
        details = `SQL injection attempt from ${ip}: payload="${payload}"`;
        severity = 'Critical';
        alertTitle = 'SQL Injection Attempt';
        alertDesc = `Malicious SQL payload detected from ${ip}: ${payload}`;
        break;
      }
      case 'xss': {
        const payload = xssPayloads[Math.floor(Math.random() * xssPayloads.length)];
        logType = 'XSS_ATTACK';
        details = `XSS attack attempt from ${ip}: payload="${payload}"`;
        severity = 'High';
        alertTitle = 'XSS Attack Attempt';
        alertDesc = `Cross-site scripting payload detected from ${ip}: ${payload}`;
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid attack type' }, { status: 400 });
    }

    await db.securityLog.create({
      data: { type: logType, ipAddress: ip, details, severity },
    });

    const alert = await db.securityAlert.create({
      data: {
        title: alertTitle,
        description: alertDesc,
        severity,
        status: 'New',
        sourceIp: ip,
      },
    });

    await db.activityLog.create({
      data: {
        action: 'ATTACK_SIMULATED',
        userId: session.user.id,
        details: `${session.user.name} simulated ${attackType} attack from ${ip}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Simulated ${attackType} attack`,
      alert,
      ip,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
