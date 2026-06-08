'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

type Role    = 'user' | 'bot' | 'operator' | 'system';
type OpState = 'idle' | 'connecting' | 'connected' | 'ended';

interface Message {
  id: string;
  role: Role;
  text: string;
  time: string;
}

const QUICK_REPLIES = [
  { label: 'Add a vehicle',      icon: 'ti-truck' },
  { label: 'Live tracking',      icon: 'ti-map-pin' },
  { label: 'Geofences',          icon: 'ti-polygon' },
  { label: 'Assign a driver',    icon: 'ti-user-check' },
  { label: 'Run a report',       icon: 'ti-chart-bar' },
  { label: 'Maintenance alerts', icon: 'ti-tool' },
];

/* ── Operator personas ──────────────────────────────────────────────── */
const OPERATORS = [
  { name: 'Sarah K.',  title: 'Fleet Support Specialist', initials: 'SK', color: '#7c3aed' },
  { name: 'James M.',  title: 'Technical Support Lead',   initials: 'JM', color: '#0284c7' },
  { name: 'Amina R.',  title: 'Customer Success Manager', initials: 'AR', color: '#0d6e5e' },
];

/* ── Operator auto-replies ──────────────────────────────────────────── */
const OP_REPLIES: [RegExp, string][] = [
  [/vehicle|fleet|plate/i,       'I can help you with that! Could you share the vehicle plate number or ID so I can pull up its details?'],
  [/track|location|map|gps/i,    'I\'ll check the live tracking feed for you right now. Can you confirm the vehicle plate or the driver\'s name?'],
  [/device|sim|iot/i,            'Let me look into the device configuration. Could you share the device serial number or IMEI?'],
  [/driver|assign/i,             'Sure, I can assist with driver management. Which driver or vehicle are you working with?'],
  [/report|export|csv|pdf/i,     'I can guide you through generating that report. Which time period and vehicle scope do you need?'],
  [/maintenance|service/i,       'I\'ll review the maintenance schedule for you. Which vehicle or fleet group should I check?'],
  [/billing|plan|subscri/i,      'For billing queries I\'ll need to verify your account. Can you confirm your registered email address?'],
  [/urgent|critical|broken|down/i,'I\'m escalating this to our technical team right now. Please stay connected — someone will follow up within 5 minutes.'],
  [/thank|thanks/i,              'Happy to help! Is there anything else you need assistance with today?'],
  [/bye|end|done|close/i,        'Great talking with you! I\'ll be closing the session now. Have a great day!'],
];

function getOpReply(text: string): string {
  for (const [p, r] of OP_REPLIES) if (p.test(text)) return r;
  return 'Got it — let me look into that for you. Give me just a moment.';
}

/* ── AI knowledge base ─────────────────────────────────────────────── */
const KB: [RegExp, string][] = [
  [/\b(add|register|create|new)\b.*vehicle|\bvehicle\b.*\b(add|register|create)\b/i,
    'To add a vehicle go to **Fleet Management → Vehicles** and click **+ Add vehicle**. Fill in the plate, make, model, year and fuel type, then assign a customer. The vehicle appears on the live map once a GPS device is linked under **Devices IoT**.'],
  [/\b(live|real.?time|track|gps|location|where)\b/i,
    'Live tracking is on the **Live Map** page. Click any vehicle pin for speed, fuel and route history. You can also open a tracking modal directly from any vehicle row by clicking the **Track** button.'],
  [/\bgeofence|geo.?fence|\bzone|\bfence\b/i,
    'Geofences are virtual boundaries you draw on the map. Go to **Geofences**, click **New zone** and draw a circle or polygon. FleetOS fires an alert automatically whenever a vehicle enters or exits the zone.'],
  [/\bdriver|assign.*driver|driver.*assign|performance\b/i,
    'Drivers are managed under **Driver Performance**. Click **+ Add driver** to onboard, then use **Assign vehicle** on any driver row. The performance score updates in real time based on speed, idle time and trip data.'],
  [/\breport|export|analytic|csv|pdf/i,
    'Reports are under **Reports & Analytics**. You can export fleet summaries, trip logs, fuel consumption and driver scorecards as CSV or PDF. Use the date-range filter to narrow the period.'],
  [/\bmaintenance|service|overdue|schedule/i,
    'Maintenance is tracked under **Maintenance**. The system auto-flags **Overdue** and **Due soon** items based on odometer or date. Click **Schedule** to log a new service record and **Mark done** to close it.'],
  [/\bdevice|sim\b|iot|dongle|dashcam|tracker/i,
    'IoT devices and SIM cards are managed under **Devices IoT**. Register a GPS tracker, link it to a vehicle and monitor signal strength, battery and data usage. Go to the **Associations** tab to wire devices to vehicles.'],
  [/\bcustomer|client|onboard|tenant/i,
    'Customers are managed under **Customers**. Use the **Onboard customer** wizard to set up a company or individual in three steps, then assign vehicles to their account. The tree view shows parent companies and subsidiaries.'],
  [/\balert|notification|warning|alarm/i,
    'Alerts appear on the **Live Dashboard** and the **Alerts** page in real time. Critical alerts (geofence breach, speeding, low fuel) are highlighted in red. Click an alert row to acknowledge or dismiss it.'],
  [/\broute|optimiz|dispatch|waypoint/i,
    'Routes are planned under **Route Optimization**. Create a route with waypoints, assign a vehicle and driver, then track progress live. Completed routes are archived with distance and ETA data.'],
  [/\bfuel|consumption|refuel|tank/i,
    'Fuel levels are shown per vehicle on the dashboard and live map. Detailed consumption reports are under **Cost Savings → Fuel Analysis**, including cost-per-km and trend charts.'],
  [/\bunauthori|misuse|policy|violation/i,
    'Unauthorised usage events are logged under **Unauthorized Usage**. Each event has a severity level and can be resolved by a fleet manager. Use the search and status filter to triage open events.'],
  [/\bsubscri|plan|billing|upgrade/i,
    'Subscription and billing details are under **Subscription Management**. You can view your current plan, usage limits and upgrade options. Contact support to customise an enterprise plan.'],
  [/\bpassword|login|access|role|permission/i,
    'User roles and permissions are configured under **Auth & Security → RBAC**. Each role controls which modules a user can see and edit. Password policy is under **Password Policy**.'],
  [/\bhello|hi\b|hey\b|help\b|start\b|what can/i,
    'Hi there! I\'m the **FleetOS Pro** assistant. I can help you with vehicles, live tracking, geofences, drivers, maintenance, reports, devices and more. What would you like to know?'],
  [/\bthank|thanks|great|perfect|awesome/i,
    'Happy to help! Feel free to ask anything else about FleetOS Pro.'],
  [/\bbye|goodbye|close|exit/i,
    'Goodbye! The chat is here whenever you need it.'],
];

function getAiResponse(text: string): string {
  for (const [p, r] of KB) if (p.test(text)) return r;
  return 'I\'m not sure about that one. Try browsing the sidebar for the relevant module, or click **Connect with Operator** to speak with a live agent.';
}

function fmt(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

function now() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function ChatBot() {
  const [open,    setOpen]    = useState(false);
  const [msgs,    setMsgs]    = useState<Message[]>([{
    id: '0', role: 'bot',
    text: 'Hi! I\'m your **FleetOS Pro** assistant. Ask me anything about managing your fleet, or pick a quick topic below.',
    time: now(),
  }]);
  const [input,   setInput]   = useState('');
  const [typing,  setTyping]  = useState(false);
  const [unread,  setUnread]  = useState(0);
  const [opState, setOpState] = useState<OpState>('idle');
  const [operator] = useState(() => OPERATORS[Math.floor(Math.random() * OPERATORS.length)]);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 120); }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, typing]);

  const pushMsg = (role: Role, text: string) =>
    setMsgs(m => [...m, { id: Date.now() + role, role, text, time: now() }]);

  /* ── Connect to operator ──────────────────────────────────────────── */
  const connectOperator = useCallback(() => {
    if (opState !== 'idle') return;
    setOpState('connecting');
    pushMsg('system', `Connecting you to a live operator…`);
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      setOpState('connected');
      pushMsg('system', `${operator.name} has joined the chat.`);
      setTimeout(() => {
        pushMsg('operator',
          `Hi there! I'm **${operator.name}**, ${operator.title} at FleetOS. I can see your conversation history. How can I help you today?`);
        if (!open) setUnread(u => u + 1);
      }, 600);
    }, 2800);
  }, [opState, operator, open]);

  /* ── End operator session ────────────────────────────────────────── */
  const endSession = useCallback(() => {
    setOpState('ended');
    pushMsg('system', `${operator.name} has left the chat. You are now back with the AI assistant.`);
  }, [operator.name]);

  /* ── Send message ────────────────────────────────────────────────── */
  const send = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    setInput('');
    pushMsg('user', trimmed);
    setTyping(true);

    const delay = opState === 'connected'
      ? 1000 + Math.random() * 1200   // operator is slower / more human
      : 700  + Math.random() * 500;

    setTimeout(() => {
      setTyping(false);
      const response = opState === 'connected'
        ? getOpReply(trimmed)
        : getAiResponse(trimmed);
      const role: Role = opState === 'connected' ? 'operator' : 'bot';
      pushMsg(role, response);
      if (!open) setUnread(u => u + 1);
    }, delay);
  }, [typing, opState, open]);

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  /* ── Avatar chip ─────────────────────────────────────────────────── */
  function Avatar({ role }: { role: Role }) {
    if (role === 'operator') return (
      <div style={{
        width: 26, height: 26, borderRadius: 7, flexShrink: 0,
        background: operator.color, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff',
        letterSpacing: '-0.3px',
      }}>{operator.initials}</div>
    );
    return (
      <div style={{
        width: 26, height: 26, borderRadius: 7, flexShrink: 0,
        background: 'linear-gradient(135deg, #c4912a, #c4912a)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className="ti ti-robot" style={{ fontSize: 13, color: '#fff' }} />
      </div>
    );
  }

  /* ── Header status line ──────────────────────────────────────────── */
  function HeaderStatus() {
    if (opState === 'connecting') return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', flexShrink: 0, animation: 'chatPulse 1s ease-in-out infinite' }} />
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)' }}>Connecting to operator…</span>
      </div>
    );
    if (opState === 'connected') return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6ee7b7', flexShrink: 0 }} />
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)' }}>
          Live — {operator.name} · {operator.title}
        </span>
      </div>
    );
    if (opState === 'ended') return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6ee7b7', flexShrink: 0 }} />
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)' }}>Online · AI assistant</span>
      </div>
    );
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6ee7b7', flexShrink: 0 }} />
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)' }}>Online · Typically replies instantly</span>
      </div>
    );
  }

  return (
    <>
      {/* ── Floating toggle ─────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        title={open ? 'Close chat' : 'FleetOS Assistant'}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 48, height: 48, borderRadius: '50%',
          background: open ? 'var(--ink2)' : 'linear-gradient(135deg, #c4912a 0%, #c4912a 100%)',
          border: 'none', cursor: 'pointer', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 18px rgba(0,0,0,0.22)',
          transition: 'background 0.2s, transform 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
      >
        <i className={`ti ${open ? 'ti-x' : 'ti-message-chatbot'}`} style={{ fontSize: 20 }} />
        {!open && unread > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2, width: 16, height: 16,
            borderRadius: '50%', background: 'var(--red)', color: '#fff',
            fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center',
            justifyContent: 'center', border: '2px solid #fff',
          }}>{unread}</span>
        )}
      </button>

      {/* ── Chat panel ──────────────────────────────────────────────── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 82, right: 24, zIndex: 999,
          width: 340, maxHeight: 560,
          background: '#fff', borderRadius: 14,
          boxShadow: '0 8px 40px rgba(0,0,0,0.16), 0 1px 4px rgba(0,0,0,0.08)',
          border: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'chatSlideIn 0.18s cubic-bezier(0.34,1.36,0.64,1)',
        }}>
          <style>{`
            @keyframes chatSlideIn {
              from { opacity:0; transform:translateY(12px) scale(0.97); }
              to   { opacity:1; transform:translateY(0)    scale(1); }
            }
            @keyframes chatTyping {
              0%,80%,100% { transform:scale(0); opacity:0.4; }
              40%          { transform:scale(1); opacity:1; }
            }
            @keyframes chatPulse {
              0%,100% { opacity:1; } 50% { opacity:0.3; }
            }
          `}</style>

          {/* Header */}
          <div style={{
            background: opState === 'connected'
              ? `linear-gradient(135deg, ${operator.color}cc 0%, ${operator.color} 100%)`
              : 'linear-gradient(135deg, #c4912a 0%, #c4912a 100%)',
            padding: '12px 14px', flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 10,
            transition: 'background 0.4s',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              fontSize: opState === 'connected' ? 11 : undefined,
              fontWeight: opState === 'connected' ? 800 : undefined,
              color: '#fff', letterSpacing: opState === 'connected' ? '-0.3px' : undefined,
            }}>
              {opState === 'connected'
                ? operator.initials
                : <i className="ti ti-robot" style={{ fontSize: 17, color: '#fff' }} />
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                {opState === 'connected' ? operator.name : 'FleetOS Assistant'}
              </div>
              <HeaderStatus />
            </div>
            {/* End session button when operator is connected */}
            {opState === 'connected' && (
              <button onClick={endSession} title="End operator session" style={{
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 6, padding: '3px 9px', cursor: 'pointer', color: '#fff',
                fontSize: 10, fontWeight: 600, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
              }}>
                <i className="ti ti-phone-off" style={{ fontSize: 11 }} /> End
              </button>
            )}
            <button onClick={() => setOpen(false)} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6,
              width: 26, height: 26, cursor: 'pointer', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <i className="ti ti-minus" style={{ fontSize: 13 }} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 4px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {msgs.map(m => {
              /* System divider */
              if (m.role === 'system') return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '2px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 9, color: 'var(--ink3)', fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: '0.3px' }}>{m.text}</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
              );

              const isUser = m.role === 'user';
              const bubbleBg = isUser ? '#c4912a' : m.role === 'operator' ? (operator.color + '12') : 'var(--cream)';
              const bubbleColor = isUser ? '#fff' : 'var(--ink)';
              const bubbleBorder = isUser ? 'none' : `1px solid ${m.role === 'operator' ? operator.color + '30' : 'var(--border)'}`;

              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 7 }}>
                  {!isUser && <Avatar role={m.role} />}
                  <div style={{ maxWidth: '76%' }}>
                    {m.role === 'operator' && (
                      <div style={{ fontSize: 9, fontWeight: 700, color: operator.color, marginBottom: 3, letterSpacing: '0.2px' }}>
                        {operator.name}
                      </div>
                    )}
                    <div style={{
                      padding: '8px 11px', fontSize: 12, lineHeight: 1.55,
                      borderRadius: isUser ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                      background: bubbleBg, color: bubbleColor, border: bubbleBorder,
                    }} dangerouslySetInnerHTML={{ __html: fmt(m.text) }} />
                    <div style={{ fontSize: 9, color: 'var(--ink3)', marginTop: 3, textAlign: isUser ? 'right' : 'left' }}>
                      {m.time}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {typing && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
                <Avatar role={opState === 'connecting' || opState === 'connected' ? 'operator' : 'bot'} />
                <div style={{
                  padding: '10px 14px', borderRadius: '10px 10px 10px 2px',
                  background: 'var(--cream)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: '50%', background: 'var(--ink3)',
                      display: 'inline-block',
                      animation: `chatTyping 1.2s ${i * 0.2}s ease-in-out infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies — only in AI mode */}
          {opState === 'idle' || opState === 'ended' ? (
            <div style={{ padding: '6px 10px', display: 'flex', gap: 5, flexWrap: 'wrap', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              {QUICK_REPLIES.map(({ label, icon }) => (
                <button key={label} onClick={() => send(label)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                  background: 'rgba(196,145,42,0.12)', color: '#c4912a',
                  border: '1px solid rgba(13,110,94,0.18)', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background 0.12s',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(13,110,94,0.12)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(196,145,42,0.12)'}
                >
                  <i className={`ti ${icon}`} style={{ fontSize: 10 }} />{label}
                </button>
              ))}
            </div>
          ) : null}

          {/* Connect with operator banner — only in AI mode */}
          {(opState === 'idle' || opState === 'ended') && (
            <div style={{
              margin: '0 10px 8px', borderRadius: 8, overflow: 'hidden',
              border: '1px solid var(--border)', flexShrink: 0,
            }}>
              <button
                onClick={connectOperator}
                style={{
                  width: '100%', padding: '8px 12px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: opState === 'ended' ? 'var(--cream)' : '#fff',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(196,145,42,0.12)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = opState === 'ended' ? 'var(--cream)' : '#fff'}
              >
                {/* Operator avatars stack */}
                <div style={{ display: 'flex', flexShrink: 0 }}>
                  {OPERATORS.slice(0, 3).map((op, i) => (
                    <div key={op.initials} style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: op.color, border: '2px solid #fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, fontWeight: 800, color: '#fff',
                      marginLeft: i === 0 ? 0 : -8, zIndex: 3 - i,
                      position: 'relative',
                    }}>{op.initials}</div>
                  ))}
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>
                    {opState === 'ended' ? 'Reconnect with an operator' : 'Connect with an operator'}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--ink3)', marginTop: 1 }}>
                    Live support · Avg. wait &lt; 2 min
                  </div>
                </div>
                <div style={{
                  width: 26, height: 26, borderRadius: 6, background: '#c4912a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <i className="ti ti-headset" style={{ fontSize: 13, color: '#fff' }} />
                </div>
              </button>
            </div>
          )}

          {/* Input row */}
          <div style={{
            padding: '8px 10px', borderTop: '1px solid var(--border)',
            display: 'flex', gap: 7, alignItems: 'center', flexShrink: 0, background: '#fff',
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              disabled={opState === 'connecting'}
              placeholder={
                opState === 'connecting' ? 'Connecting to operator…' :
                opState === 'connected'  ? `Message ${operator.name}…` :
                'Ask anything about FleetOS…'
              }
              style={{
                flex: 1, border: '1px solid var(--border)', borderRadius: 8,
                padding: '7px 11px', fontSize: 12, color: 'var(--ink)',
                background: opState === 'connecting' ? 'var(--cream3)' : 'var(--cream)',
                fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || typing || opState === 'connecting'}
              style={{
                width: 34, height: 34, borderRadius: 8, border: 'none', flexShrink: 0,
                background: input.trim() && !typing && opState !== 'connecting' ? '#c4912a' : 'var(--cream3)',
                color:      input.trim() && !typing && opState !== 'connecting' ? '#fff' : 'var(--ink3)',
                cursor:     input.trim() && !typing && opState !== 'connecting' ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
            >
              <i className="ti ti-send" style={{ fontSize: 15 }} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
