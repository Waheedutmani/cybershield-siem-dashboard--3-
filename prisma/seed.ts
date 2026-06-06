import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

async function seed() {
  console.log('Seeding database...');

  // Create default Admin user
  const adminEmail = 'admin@cybershield.io';
  const existingAdmin = await db.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await db.user.create({
      data: {
        email: adminEmail,
        name: 'SOC Admin',
        password: hashPassword('Admin@2024'),
        role: 'Admin',
        status: 'Active',
      },
    });
    console.log('Created Admin user: admin@cybershield.io / Admin@2024');
  } else {
    console.log('Admin user already exists');
  }

  // Create default Analyst user
  const analystEmail = 'analyst@cybershield.io';
  const existingAnalyst = await db.user.findUnique({ where: { email: analystEmail } });
  if (!existingAnalyst) {
    await db.user.create({
      data: {
        email: analystEmail,
        name: 'Jane Analyst',
        password: hashPassword('Analyst@2024'),
        role: 'Analyst',
        status: 'Active',
      },
    });
    console.log('Created Analyst user: analyst@cybershield.io / Analyst@2024');
  } else {
    console.log('Analyst user already exists');
  }

  // Create default regular User
  const userEmail = 'user@cybershield.io';
  const existingUser = await db.user.findUnique({ where: { email: userEmail } });
  if (!existingUser) {
    await db.user.create({
      data: {
        email: userEmail,
        name: 'John User',
        password: hashPassword('User@2024'),
        role: 'User',
        status: 'Active',
      },
    });
    console.log('Created User: user@cybershield.io / User@2024');
  } else {
    console.log('Regular user already exists');
  }

  // Seed some sample security logs
  const logCount = await db.securityLog.count();
  if (logCount === 0) {
    const sampleLogs = [
      { type: 'LOGIN_SUCCESS', ipAddress: '192.168.1.100', details: 'Admin login from internal network', severity: 'Low' },
      { type: 'LOGIN_FAILED', ipAddress: '45.33.32.156', details: 'Failed login attempt from external IP', severity: 'Medium' },
      { type: 'LOGIN_FAILED', ipAddress: '45.33.32.156', details: 'Failed login attempt from external IP (2nd)', severity: 'Medium' },
      { type: 'BRUTE_FORCE', ipAddress: '103.24.77.12', details: 'Brute force attack detected: 25 failed attempts in 2 minutes', severity: 'Critical' },
      { type: 'SQL_INJECTION', ipAddress: '185.220.101.34', details: 'SQL injection attempt: SELECT * FROM users WHERE 1=1', severity: 'Critical' },
      { type: 'XSS_ATTACK', ipAddress: '91.215.85.209', details: 'XSS attempt: <script>alert("XSS")</script>', severity: 'High' },
      { type: 'LOGIN_SUCCESS', ipAddress: '192.168.1.50', details: 'Analyst Jane logged in from VPN', severity: 'Low' },
      { type: 'LOGIN_FAILED', ipAddress: '78.128.113.5', details: 'Invalid credentials for root account', severity: 'High' },
      { type: 'BRUTE_FORCE', ipAddress: '23.94.168.72', details: 'SSH brute force from Tor exit node', severity: 'Critical' },
      { type: 'LOGIN_SUCCESS', ipAddress: '10.0.0.15', details: 'System service account login', severity: 'Low' },
      { type: 'SQL_INJECTION', ipAddress: '154.72.150.201', details: 'Malformed query detected: UNION SELECT null,null,null--', severity: 'High' },
      { type: 'LOGIN_FAILED', ipAddress: '172.16.0.99', details: 'Failed login for service account backup-bot', severity: 'Medium' },
      { type: 'XSS_ATTACK', ipAddress: '193.106.191.45', details: 'Reflected XSS in search parameter detected', severity: 'High' },
      { type: 'LOGIN_SUCCESS', ipAddress: '192.168.1.100', details: 'Admin session renewed', severity: 'Low' },
      { type: 'BRUTE_FORCE', ipAddress: '5.188.210.101', details: 'Dictionary attack on admin portal: 50 attempts', severity: 'Critical' },
    ];

    for (const log of sampleLogs) {
      await db.securityLog.create({ data: log });
    }
    console.log(`Seeded ${sampleLogs.length} sample security logs`);
  }

  // Seed some sample alerts
  const alertCount = await db.securityAlert.count();
  if (alertCount === 0) {
    const sampleAlerts = [
      { title: 'Brute Force Attack Detected', description: '25 failed login attempts from IP 103.24.77.12 in 2 minutes. Source is a known malicious IP.', severity: 'Critical', status: 'Investigating', sourceIp: '103.24.77.12' },
      { title: 'SQL Injection Attempt', description: 'Malicious SQL payload detected from 185.220.101.34 targeting the user authentication endpoint.', severity: 'Critical', status: 'New', sourceIp: '185.220.101.34' },
      { title: 'XSS Attack Blocked', description: 'Cross-site scripting attempt from 91.215.85.209 was blocked by WAF rules.', severity: 'High', status: 'New', sourceIp: '91.215.85.209' },
      { title: 'Suspicious Login Activity', description: 'Multiple failed login attempts for root account from external IP 78.128.113.5.', severity: 'High', status: 'Investigating', sourceIp: '78.128.113.5' },
      { title: 'Tor Exit Node Access', description: 'SSH brute force from Tor exit node IP 23.94.168.72 detected and blocked.', severity: 'High', status: 'Resolved', sourceIp: '23.94.168.72' },
      { title: 'Dictionary Attack', description: 'Dictionary-based password attack on admin portal from 5.188.210.101.', severity: 'Critical', status: 'New', sourceIp: '5.188.210.101' },
      { title: 'Unusual Login Time', description: 'Analyst account accessed at 03:42 AM from unusual geographic location.', severity: 'Medium', status: 'New', sourceIp: '203.0.113.42' },
      { title: 'Port Scan Detected', description: 'Network port scan from 45.33.32.156 scanning ports 22, 80, 443, 3306, 8080.', severity: 'Medium', status: 'Resolved', sourceIp: '45.33.32.156' },
    ];

    for (const alert of sampleAlerts) {
      await db.securityAlert.create({ data: alert });
    }
    console.log(`Seeded ${sampleAlerts.length} sample security alerts`);
  }

  console.log('Seeding complete!');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
