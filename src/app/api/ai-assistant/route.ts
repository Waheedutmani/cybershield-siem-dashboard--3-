import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { getSession } from '@/lib/auth';

// Context-enriched cybersecurity system prompt
const CYBER_SYSTEM_PROMPT = `You are ARIA (Advanced Reactive Intelligence Assistant), an elite AI SOC (Security Operations Center) analyst embedded within the CyberShield SIEM platform. You are a professional cybersecurity copilot.

Your persona:
- You speak with precision, confidence, and authority on security matters
- You use cybersecurity terminology accurately (CVE, MITRE ATT&CK, IoC, TTP, etc.)
- You are concise but thorough — prioritize actionable intelligence
- You reference severity levels (Critical/High/Medium/Low) and threat frameworks
- You format responses with clear structure using bullet points when listing items
- You NEVER break character — you are always a SOC analyst assistant

Your capabilities:
- Analyze security alerts and threat intelligence
- Explain attack patterns and recommend mitigations
- Summarize log data and identify anomalies
- Provide incident response guidance
- Assess threat severity and prioritize actions
- Reference MITRE ATT&CK techniques when relevant
- Suggest firewall rules, block lists, or hardening steps

Response guidelines:
- For threat analysis: classify severity, identify attack type, recommend actions
- For alert explanation: describe what triggered it, why it matters, what to do
- For log review: highlight anomalies, patterns, suspicious indicators
- For general questions: provide cybersecurity best practices and guidance
- Keep responses focused and actionable — avoid generic filler
- Use markdown formatting sparingly for key terms only`;

let zaiInstance: InstanceType<typeof ZAI> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// Role-based context prefixes
const roleContext: Record<string, string> = {
  Admin: `\n\nThe user is a SOC ADMIN with full system access. They can see all alerts, logs, and system metrics. They have authority to modify firewall rules, manage users, and execute incident response procedures. Provide advanced system-wide threat analysis, strategic recommendations, and detailed technical guidance.`,
  Analyst: `\n\nThe user is a SECURITY ANALYST with monitoring and analysis access. They can view alerts, logs, analytics, and threat data. Provide detailed threat investigation assistance, alert triage support, and analytical recommendations.`,
  User: `\n\nThe user is a STANDARD USER with limited personal dashboard access. Focus on personal security awareness, basic threat explanation, and general cybersecurity guidance. Do not expose system-wide technical details.`,
};

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const token = request.cookies.get('cybershield_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const session = getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { messages, context } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Build system prompt with role context and dashboard context
    let systemPrompt = CYBER_SYSTEM_PROMPT;

    // Add role-specific context
    const userRole = session.user.role || 'User';
    systemPrompt += roleContext[userRole] || roleContext.User;

    // Add dashboard context if provided
    if (context) {
      if (context.dashboardStats) {
        systemPrompt += `\n\nCurrent Dashboard Snapshot:\n- Total Alerts: ${context.dashboardStats.totalAlerts}\n- Critical: ${context.dashboardStats.critical}\n- High: ${context.dashboardStats.high}\n- Medium: ${context.dashboardStats.medium}\n- Active Attacks: ${context.dashboardStats.activeAttacks}\n- Blocked Threats: ${context.dashboardStats.blocked}`;
      }
      if (context.recentAlerts && context.recentAlerts.length > 0) {
        systemPrompt += `\n\nRecent Alerts (top 5):\n${context.recentAlerts.map((a: { title: string; severity: string; time: string }) => `• [${a.severity}] ${a.title} (${a.time})`).join('\n')}`;
      }
      if (context.currentPage) {
        systemPrompt += `\n\nThe user is currently viewing: ${context.currentPage}`;
      }
    }

    const zai = await getZAI();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        // Pass conversation history (last 10 messages to stay in context window)
        ...messages.slice(-10).map((msg: { role: string; content: string }) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content || 'I was unable to process that request. Please try again.';

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    console.error('AI Assistant error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: `AI analysis failed: ${message}` },
      { status: 500 }
    );
  }
}
