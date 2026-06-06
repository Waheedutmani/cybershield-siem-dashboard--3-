'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';
import {
  Bot,
  Send,
  X,
  Minus,
  Maximize2,
  Minimize2,
  ChevronDown,
  Shield,
  AlertTriangle,
  FileText,
  BarChart3,
  Lightbulb,
  Loader2,
  RotateCcw,
} from 'lucide-react';

// ===== Types =====
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Suggestion {
  icon: React.ElementType;
  label: string;
  prompt: string;
}

// ===== Role-based quick suggestions =====
const adminSuggestions: Suggestion[] = [
  { icon: AlertTriangle, label: 'Analyze Latest Alert', prompt: 'Analyze the latest critical alerts and provide threat assessment with recommended actions.' },
  { icon: Shield, label: 'Show Critical Threats', prompt: 'What are the most critical threats currently detected in the system? Provide severity analysis.' },
  { icon: FileText, label: 'Review Failed Logins', prompt: 'Review recent failed login attempts and identify potential brute-force attack patterns.' },
  { icon: BarChart3, label: 'Explain Threat Level', prompt: 'Explain the current threat level based on dashboard statistics and recent security events.' },
  { icon: Lightbulb, label: 'Security Actions', prompt: 'Recommend immediate security actions based on the current threat landscape.' },
];

const analystSuggestions: Suggestion[] = [
  { icon: AlertTriangle, label: 'Analyze Latest Alert', prompt: 'Analyze the latest alerts and provide a detailed threat assessment.' },
  { icon: FileText, label: 'Review Failed Logins', prompt: 'Review recent failed login attempts and identify suspicious patterns.' },
  { icon: BarChart3, label: 'Explain Threat Level', prompt: 'Explain the current threat level based on recent security events.' },
  { icon: Lightbulb, label: 'Investigation Tips', prompt: 'Provide tips for investigating the current security alerts more effectively.' },
];

const userSuggestions: Suggestion[] = [
  { icon: Shield, label: 'Security Status', prompt: 'What is my current security status? Are there any concerns I should be aware of?' },
  { icon: Lightbulb, label: 'Security Tips', prompt: 'Provide cybersecurity best practices to keep my account and data safe.' },
  { icon: AlertTriangle, label: 'Explain Alert', prompt: 'Can you explain what the security alerts mean and if I need to take action?' },
];

// ===== Welcome message by role =====
const welcomeMessages: Record<string, string> = {
  Admin: `**ARIA Online** — SOC Command Interface active.\n\nI have full visibility into your security operations. I can analyze threats, review alerts, assess attack patterns, and recommend strategic security actions.\n\nHow may I assist with your security operations?`,
  Analyst: `**ARIA Online** — Threat Analysis Mode active.\n\nI can help you investigate alerts, analyze log data, identify attack patterns, and provide triage recommendations.\n\nWhat would you like to investigate?`,
  User: `**ARIA Online** — Personal Security Mode active.\n\nI can help explain security alerts, provide safety guidance, and answer general cybersecurity questions.\n\nHow can I help you stay secure?`,
};

// ===== Panel size presets =====
type PanelSize = 'normal' | 'maximized';
const panelSizes: Record<PanelSize, string> = {
  normal: 'w-[400px] h-[560px]',
  maximized: 'w-[600px] h-[calc(100vh-120px)]',
};

export function AIAssistant() {
  const { user } = useAuthStore();
  const { currentPage, theme } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [panelSize, setPanelSize] = useState<PanelSize>('normal');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const userRole = user?.role || 'User';
  const suggestions = userRole === 'Admin' ? adminSuggestions : userRole === 'Analyst' ? analystSuggestions : userSuggestions;

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  // Greeting on first open
  useEffect(() => {
    if (isOpen && !hasGreeted && messages.length === 0) {
      setHasGreeted(true);
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessages[userRole] || welcomeMessages.User,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, hasGreeted, messages.length, userRole]);

  // Fetch dashboard context for AI
  const fetchContext = useCallback(async () => {
    try {
      const [dashRes, alertsRes] = await Promise.all([
        fetch('/api/dashboard').then(r => r.json()).catch(() => null),
        fetch('/api/alerts?limit=5').then(r => r.json()).catch(() => null),
      ]);

      const context: Record<string, unknown> = {
        currentPage: `${currentPage.charAt(0).toUpperCase() + currentPage.slice(1)} page`,
      };

      if (dashRes?.stats) {
        context.dashboardStats = {
          totalAlerts: dashRes.stats.totalAlerts ?? dashRes.stats.alerts ?? 0,
          critical: dashRes.stats.critical ?? 0,
          high: dashRes.stats.high ?? 0,
          medium: dashRes.stats.medium ?? 0,
          activeAttacks: dashRes.stats.activeAttacks ?? dashRes.stats.attacks ?? 0,
          blocked: dashRes.stats.blocked ?? dashRes.stats.blockedThreats ?? 0,
        };
      }

      if (alertsRes?.alerts) {
        context.recentAlerts = (Array.isArray(alertsRes.alerts) ? alertsRes.alerts.slice(0, 5) : []).map(
          (a: { title?: string; severity?: string; timestamp?: string; time?: string; type?: string }) => ({
            title: a.title || a.type || 'Unknown Alert',
            severity: a.severity || 'Medium',
            time: a.timestamp || a.time || 'Unknown',
          })
        );
      }

      return context;
    } catch {
      return { currentPage };
    }
  }, [currentPage]);

  // Send message to AI
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Fetch context on every send to keep AI aware
      const context = await fetchContext();

      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          context,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `**ARIA Error**: ${err instanceof Error ? err.message : 'Failed to process request'}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
      abortRef.current = null;
    }
  }, [isTyping, messages, fetchContext]);

  // Handle suggestion click
  const handleSuggestion = useCallback((prompt: string) => {
    sendMessage(prompt);
  }, [sendMessage]);

  // Handle form submit
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  }, [sendMessage, input]);

  // Handle keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }, [sendMessage, input]);

  // Clear conversation
  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setHasGreeted(false);
    setIsTyping(false);
  }, []);

  // Format message content (basic markdown bold/italic)
  const formatContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="ai-code-inline">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* ===== Floating AI Button ===== */}
      <button
        onClick={() => { setIsOpen(true); setIsMinimized(false); }}
        className={cn(
          'fixed bottom-6 right-6 z-50 ai-float-btn group',
          'w-14 h-14 rounded-full flex items-center justify-center',
          'bg-gradient-to-br from-neon-blue via-neon-purple to-neon-blue',
          'shadow-[0_0_20px_rgba(0,212,255,0.3),0_0_40px_rgba(0,212,255,0.1)]',
          'hover:shadow-[0_0_30px_rgba(0,212,255,0.5),0_0_60px_rgba(0,212,255,0.2)]',
          'transition-all duration-300 hover:scale-110 active:scale-95',
          'border border-neon-blue/30',
          isOpen && 'scale-0 opacity-0 pointer-events-none'
        )}
        aria-label="Open AI Assistant"
      >
        <Bot className="w-7 h-7 text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all" />
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full animate-ai-ping bg-neon-blue/20" />
      </button>

      {/* ===== AI Chat Panel ===== */}
      {isOpen && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 ai-panel-enter',
            panelSizes[panelSize],
            'rounded-2xl overflow-hidden flex flex-col',
            'ai-panel-glass ai-panel-border ai-panel-3d',
            isMinimized && 'ai-panel-minimized !h-auto !w-[400px]',
            'transition-all duration-300'
          )}
        >
          {/* ===== Header ===== */}
          <div
            className="ai-panel-header flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(168,85,247,0.08))' }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center ai-icon-glow">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-neon-green border-2 border-cyber-dark">
                  <span className="absolute inset-0 rounded-full bg-neon-green animate-ping opacity-75" />
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-wide">ARIA <span className="text-neon-blue">AI</span></h3>
                <p className="text-[10px] text-muted-foreground tracking-wider">SOC INTELLIGENCE ASSISTANT</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {!isMinimized && (
                <>
                  <button
                    onClick={clearChat}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                    title="Clear conversation"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPanelSize(panelSize === 'normal' ? 'maximized' : 'normal')}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                    title={panelSize === 'normal' ? 'Maximize' : 'Minimize to normal'}
                  >
                    {panelSize === 'normal' ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                  </button>
                </>
              )}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <ChevronDown className="w-4 h-4 rotate-180" /> : <Minus className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-neon-red hover:bg-neon-red/10 transition-all"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ===== Chat Body ===== */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto ai-messages-container p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center border border-neon-blue/20">
                      <Bot className="w-8 h-8 text-neon-blue/60" />
                    </div>
                    <p className="text-sm text-muted-foreground">ARIA is ready to assist</p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'ai-message-enter flex gap-3',
                      msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 mt-1">
                      {msg.role === 'assistant' ? (
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center ai-icon-glow-sm">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[11px] font-bold text-foreground border border-cyber-border">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>

                    {/* Message bubble */}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-neon-blue/15 border border-neon-blue/20 text-foreground rounded-br-sm'
                          : 'bg-white/5 border border-cyber-border text-foreground/90 rounded-bl-sm'
                      )}
                    >
                      <div
                        dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                      />
                      <p className="text-[9px] text-muted-foreground/60 mt-1.5">
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="ai-message-enter flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center ai-icon-glow-sm">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="bg-white/5 border border-cyber-border rounded-xl rounded-bl-sm px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 text-neon-blue animate-spin" />
                        <span className="text-xs text-muted-foreground">ARIA is analyzing...</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        <span className="ai-typing-dot w-1.5 h-1.5 rounded-full bg-neon-blue" style={{ animationDelay: '0ms' }} />
                        <span className="ai-typing-dot w-1.5 h-1.5 rounded-full bg-neon-blue" style={{ animationDelay: '150ms' }} />
                        <span className="ai-typing-dot w-1.5 h-1.5 rounded-full bg-neon-blue" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestions (show only when no messages or after greeting) */}
              {messages.length <= 1 && !isTyping && (
                <div className="px-4 pb-2 flex-shrink-0">
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((sug, i) => {
                      const Icon = sug.icon;
                      return (
                        <button
                          key={i}
                          onClick={() => handleSuggestion(sug.prompt)}
                          className="ai-suggestion-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground border border-cyber-border/50 hover:border-neon-blue/30 hover:bg-neon-blue/5 transition-all"
                        >
                          <Icon className="w-3 h-3 text-neon-blue/60" />
                          <span>{sug.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Input area */}
              <div className="p-3 border-t border-cyber-border/50 flex-shrink-0" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <form onSubmit={handleSubmit} className="relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask ARIA about security threats..."
                    rows={1}
                    className={cn(
                      'w-full resize-none rounded-xl pl-4 pr-12 py-2.5',
                      'bg-white/5 border border-cyber-border/50 text-sm text-foreground placeholder:text-muted-foreground/50',
                      'focus:outline-none focus:border-neon-blue/40 focus:ring-1 focus:ring-neon-blue/20',
                      'transition-all duration-200',
                      'min-h-[40px] max-h-[100px]'
                    )}
                    style={{ scrollbarWidth: 'thin' }}
                    disabled={isTyping}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className={cn(
                      'absolute right-2 top-1/2 -translate-y-1/2',
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      'bg-gradient-to-r from-neon-blue to-neon-purple',
                      'text-white transition-all duration-200',
                      'hover:shadow-[0_0_12px_rgba(0,212,255,0.4)]',
                      'active:scale-90',
                      (!input.trim() || isTyping) && 'opacity-30 cursor-not-allowed hover:shadow-none'
                    )}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <div className="flex items-center justify-between mt-1.5 px-1">
                  <p className="text-[9px] text-muted-foreground/40 tracking-wider">
                    ARIA AI SOC Assistant v2.0
                  </p>
                  <p className="text-[9px] text-muted-foreground/40">
                    Role: <span className="text-neon-blue/60">{userRole}</span>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
