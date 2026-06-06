import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

function randomIp(): string {
  return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const eventTypes = [
  'brute_force',
  'sql_injection',
  'xss',
  'port_scan',
  'ddos_attempt',
  'malware_detection',
  'phishing',
  'unauthorized_access',
  'suspicious_ip',
] as const;

type EventType = (typeof eventTypes)[number];

const eventConfigs: Record<EventType, { logType: string; detailsTemplate: string; severity: string; alertTitle: string; alertDescTemplate: string; scoreRange: [number, number]; createAlert: boolean }> = {
  brute_force: {
    logType: 'BRUTE_FORCE',
    detailsTemplate: 'Brute force attack detected from {ip}: {count} failed login attempts',
    severity: 'Critical',
    alertTitle: 'Brute Force Attack',
    alertDescTemplate: '{count} failed login attempts from {ip}',
    scoreRange: [80, 100],
    createAlert: true,
  },
  sql_injection: {
    logType: 'SQL_INJECTION',
    detailsTemplate: 'SQL injection attempt from {ip}: {payload}',
    severity: 'Critical',
    alertTitle: 'SQL Injection Attempt',
    alertDescTemplate: 'Malicious SQL payload from {ip}: {payload}',
    scoreRange: [75, 100],
    createAlert: true,
  },
  xss: {
    logType: 'XSS_ATTACK',
    detailsTemplate: 'XSS attack attempt from {ip}: {payload}',
    severity: 'High',
    alertTitle: 'XSS Attack Attempt',
    alertDescTemplate: 'Cross-site scripting payload from {ip}',
    scoreRange: [60, 90],
    createAlert: true,
  },
  port_scan: {
    logType: 'PORT_SCAN',
    detailsTemplate: 'Port scan detected from {ip}: scanned {count} ports',
    severity: 'High',
    alertTitle: 'Port Scan Detected',
    alertDescTemplate: '{ip} scanned {count} ports',
    scoreRange: [50, 80],
    createAlert: true,
  },
  ddos_attempt: {
    logType: 'DDOS_ATTEMPT',
    detailsTemplate: 'DDoS attempt from {ip}: {count} requests in 10s',
    severity: 'Critical',
    alertTitle: 'DDoS Attempt Detected',
    alertDescTemplate: 'Volumetric attack from {ip}: {count} requests/10s',
    scoreRange: [85, 100],
    createAlert: true,
  },
  malware_detection: {
    logType: 'MALWARE_DETECTION',
    detailsTemplate: 'Malware signature detected from {ip}: {payload}',
    severity: 'Critical',
    alertTitle: 'Malware Detection',
    alertDescTemplate: 'Known malware signature from {ip}: {payload}',
    scoreRange: [70, 100],
    createAlert: true,
  },
  phishing: {
    logType: 'PHISHING',
    detailsTemplate: 'Phishing URL detected from {ip}: {payload}',
    severity: 'High',
    alertTitle: 'Phishing Attempt',
    alertDescTemplate: 'Phishing URL blocked from {ip}',
    scoreRange: [55, 85],
    createAlert: true,
  },
  unauthorized_access: {
    logType: 'UNAUTHORIZED_ACCESS',
    detailsTemplate: 'Unauthorized access attempt from {ip} to {payload}',
    severity: 'High',
    alertTitle: 'Unauthorized Access',
    alertDescTemplate: '{ip} attempted to access restricted resource',
    scoreRange: [65, 95],
    createAlert: true,
  },
  suspicious_ip: {
    logType: 'SUSPICIOUS_IP',
    detailsTemplate: 'Suspicious activity from {ip}: {payload}',
    severity: 'Medium',
    alertTitle: 'Suspicious IP Detected',
    alertDescTemplate: '{ip} flagged for suspicious behavior',
    scoreRange: [30, 70],
    createAlert: false,
  },
};

const sqlPayloads = [
  "SELECT * FROM users WHERE 1=1",
  "DROP TABLE users;--",
  "UNION SELECT username,password FROM users",
  "'; DELETE FROM users WHERE '1'='1",
  "1; LOAD_FILE('/etc/passwd')",
];

const xssPayloads = [
  "<script>alert('XSS')</script>",
  "<img src=x onerror=alert(1)>",
  "<svg onload=alert('XSS')>",
  "javascript:alert('XSS')",
];

const malwareSigs = [
  'Trojan.Win32.Generic',
  'Worm.Linux.Mirai',
  'Ransom.CryptoLocker',
  'Backdoor.Agent.bxq',
  'Rootkit.Win32.TDSS',
];

const phishingUrls = [
  'https://cybershield-login.verify-account.com',
  'https://secure-update-password.net/auth',
  'https://admin-panel-cybershield.xyz/login',
];

const targets = [
  '/admin/dashboard',
  '/api/internal/users',
  '/api/secrets/config',
  '/wp-admin',
  '/phpmyadmin',
];

// In-memory state for simulation
let simulationInterval: ReturnType<typeof setInterval> | null = null;
let isSimulating = false;
const ipAttackCounts = new Map<string, number>();

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function generateEvent(session: { user: { id: string; name: string } }) {
  const eventType = randomFrom(eventTypes);
  const config = eventConfigs[eventType];
  const ip = randomIp();
  const threatScore = randomInt(config.scoreRange[0], config.scoreRange[1]);
  const count = randomInt(5, 200);

  const payload = eventType === 'sql_injection'
    ? randomFrom(sqlPayloads)
    : eventType === 'xss'
      ? randomFrom(xssPayloads)
      : eventType === 'malware_detection'
        ? randomFrom(malwareSigs)
        : eventType === 'phishing'
          ? randomFrom(phishingUrls)
          : eventType === 'unauthorized_access'
            ? randomFrom(targets)
            : '';

  const details = config.detailsTemplate
    .replace('{ip}', ip)
    .replace('{count}', String(count))
    .replace('{payload}', payload);

  // Create security log
  const log = await db.securityLog.create({
    data: {
      type: config.logType,
      ipAddress: ip,
      details,
      severity: config.severity,
      threatScore,
    },
  });

  // Optionally create alert
  let alert = null;
  if (config.createAlert) {
    const alertDesc = config.alertDescTemplate
      .replace('{ip}', ip)
      .replace('{count}', String(count))
      .replace('{payload}', payload);

    alert = await db.securityAlert.create({
      data: {
        title: config.alertTitle,
        description: alertDesc,
        severity: config.severity,
        status: 'New',
        sourceIp: ip,
        threatScore,
      },
    });
  }

  // Track IP attack counts for auto-blocking
  const currentCount = ipAttackCounts.get(ip) || 0;
  const newCount = currentCount + 1;
  ipAttackCounts.set(ip, newCount);

  let autoBlocked = false;
  if (newCount >= 5) {
    try {
      await db.blockedIP.upsert({
        where: { ipAddress: ip },
        update: {},
        create: {
          ipAddress: ip,
          reason: `Auto-blocked: ${newCount} attacks detected (last: ${eventType})`,
          severity: config.severity,
          autoBlocked: true,
        },
      });
      autoBlocked = true;
    } catch {
      // Already blocked
    }
  }

  // Create activity log
  await db.activityLog.create({
    data: {
      action: 'SIMULATION_EVENT',
      userId: session.user.id,
      details: `Simulation generated ${eventType} from ${ip} (score: ${threatScore})`,
    },
  });

  return {
    log,
    alert,
    eventType,
    ip,
    threatScore,
    severity: config.severity,
    autoBlocked,
  };
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('cybershield_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = getSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // RBAC: Only Admin and Analyst can access simulation engine
    if (session.user.role !== 'Admin' && session.user.role !== 'Analyst') {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    return NextResponse.json({ active: isSimulating });
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

    // RBAC: Only Admin and Analyst can trigger simulations
    if (session.user.role !== 'Admin' && session.user.role !== 'Analyst') {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const action = body.action;

    if (action === 'start') {
      if (isSimulating) {
        return NextResponse.json({ success: true, message: 'Simulation already running', active: true });
      }

      isSimulating = true;
      ipAttackCounts.clear();

      // Generate first event immediately
      const event = await generateEvent(session);

      // Set interval for 3-8 seconds
      const generateNext = async () => {
        const delay = randomInt(3000, 8000);
        simulationInterval = setTimeout(async () => {
          if (!isSimulating) return;
          try {
            await generateEvent(session);
          } catch {
            // Continue running even if one event fails
          }
          generateNext();
        }, delay);
      };
      generateNext();

      return NextResponse.json({ success: true, message: 'Simulation started', active: true, event });
    }

    if (action === 'stop') {
      isSimulating = false;
      if (simulationInterval) {
        clearTimeout(simulationInterval);
        simulationInterval = null;
      }
      ipAttackCounts.clear();
      return NextResponse.json({ success: true, message: 'Simulation stopped', active: false });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
