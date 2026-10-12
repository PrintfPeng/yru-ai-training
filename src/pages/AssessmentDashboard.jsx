import React, { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw, Users, Star, Smile, BarChart3, PieChart as PieIcon,
  MessageSquare, Wrench, ListPlus, PenLine, AlertCircle, Loader2, Inbox,
} from 'lucide-react';
import { assessmentsApi } from '../api';

// Shared slice/bar palette — pink → amber → yellow → cyan → violet → … , reused
// by both the bar chart and the pie so one aspect keeps one colour throughout.
const PALETTE = [
  '#ec4899', '#f59e0b', '#facc15', '#22d3ee', '#a78bfa',
  '#34d399', '#60a5fa', '#fb7185', '#f97316', '#2dd4bf',
];

// Thai 5-level Likert interpretation from an average already normalised to /5.
const satisfactionLabel = (avg) => {
  if (avg == null) return { text: '—', tone: 'text-slate-400 dark:text-yrugray-500' };
  if (avg >= 4.5) return { text: 'มากที่สุด', tone: 'text-emerald-600 dark:text-emerald-400' };
  if (avg >= 3.5) return { text: 'มาก',       tone: 'text-yrupink-600 dark:text-yrupink-400' };
  if (avg >= 2.5) return { text: 'ปานกลาง',   tone: 'text-amber-600 dark:text-amber-400' };
  if (avg >= 1.5) return { text: 'น้อย',       tone: 'text-orange-600 dark:text-orange-400' };
  return { text: 'น้อยที่สุด', tone: 'text-red-600 dark:text-red-400' };
};

// Icons cycled across the free-text answer cards so each "ข้อ N" reads distinctly.
const TEXT_ICONS = [MessageSquare, Wrench, ListPlus, PenLine];

const AssessmentDashboard = ({ activity, title }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noAssessment, setNoAssessment] = useState(false);
  const [tick, setTick] = useState(0);

  const activityId = activity?.id;
  const headingTitle = title || activity?.title;

  // Resolve the activity's assessment via /assessments/by-activity/:id (an
  // activity can have several — listForActivity sorts DESC, so [0] is newest),
  // then pull that assessment's response summary. Two hops keep this component
  // driven by the activity alone.
  useEffect(() => {
    if (!activityId) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNoAssessment(false);
    assessmentsApi.listForActivity(activityId)
      .then((rows) => {
        const first = Array.isArray(rows) && rows.length ? rows[0] : null;
        if (!first) {
          if (!cancelled) { setNoAssessment(true); setData(null); }
          return null;
        }
        return assessmentsApi.getSummary(first.id);
      })
      .then((d) => { if (d && !cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e?.message || 'โหลดข้อมูลไม่สำเร็จ'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activityId, tick]);

  // Per-aspect bars = every matrix row + every numeric 1-5 choice question.
  // avg is normalised to /5 so matrices/scales of different maxima share one
  // axis and match the overall average.
  const aspects = useMemo(() => {
    if (!data) return [];
    const fromMatrices = (data.matrices || []).flatMap((m) =>
      m.rows
        .filter((r) => r.avg != null)
        .map((r) => ({ label: r.label, value: +(r.avg / m.scaleMax * 5).toFixed(2) })),
    );
    const fromScales = (data.scales || [])
      .filter((s) => s.avg != null)
      .map((s) => ({ label: s.label, value: +(s.avg / s.scaleMax * 5).toFixed(2) }));
    return [...fromMatrices, ...fromScales];
  }, [data]);

  // First choice question drives the pie ("most-interesting activity").
  const pie = useMemo(() => {
    const c = data?.choices?.find((q) => q.total > 0);
    if (!c) return null;
    return { label: c.label, slices: c.options.filter((o) => o.count > 0), total: c.total };
  }, [data]);

  const texts = useMemo(() => (data?.texts || []), [data]);

  // Older backends return only { response_count, matrices } with no
  // overall_avg — fall back to a count-weighted mean of the matrix rows,
  // normalised to /5, so the stat cards still fill in.
  const overall = useMemo(() => {
    if (data?.overall_avg != null) return data.overall_avg;
    let sum = 0, n = 0;
    (data?.matrices || []).forEach((m) => m.rows.forEach((r) => {
      if (r.avg != null && r.count) { sum += (r.avg / (m.scaleMax || 5)) * 5 * r.count; n += r.count; }
    }));
    return n ? +(sum / n).toFixed(2) : null;
  }, [data]);
  const sat = satisfactionLabel(overall);

  if (loading) {
    return (
      <div className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-16 flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-yrupink-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-10 flex flex-col items-center text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <p className="font-semibold text-slate-800 dark:text-yrugray-100 mb-1">โหลดแดชบอร์ดไม่สำเร็จ</p>
        <p className="text-sm text-slate-600 dark:text-yrugray-400 mb-4">{error}</p>
        <button
          onClick={() => setTick((n) => n + 1)}
          className="px-4 py-2 bg-slate-100 dark:bg-yrugray-800 hover:bg-slate-200 dark:hover:bg-yrugray-700 text-sm font-medium rounded-lg text-slate-800 dark:text-yrugray-200"
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  if (noAssessment) {
    return (
      <div className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-12 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-yrugray-800 flex items-center justify-center mb-4">
          <Inbox className="w-7 h-7 text-slate-400 dark:text-yrugray-500" />
        </div>
        <p className="font-semibold text-slate-800 dark:text-yrugray-100 mb-1">ยังไม่มีแบบประเมิน</p>
        <p className="text-sm text-slate-600 dark:text-yrugray-400">
          สร้างแบบประเมินในแท็บ “แบบประเมิน + ใบรับรอง” ก่อน แล้วผลสรุปจะแสดงที่นี่
        </p>
      </div>
    );
  }

  const count = data?.response_count || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">แดชบอร์ดสรุปผล</h3>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Real-time
          </span>
          {headingTitle && <span className="text-sm text-slate-500 dark:text-yrugray-400 hidden md:inline">· {headingTitle}</span>}
        </div>
        <button
          onClick={() => setTick((n) => n + 1)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 dark:border-yrugray-700 text-slate-700 dark:text-yrugray-200 hover:bg-slate-100 dark:hover:bg-yrugray-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          รีเฟรช
        </button>
      </div>

      {count === 0 ? (
        <div className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-yrugray-800 flex items-center justify-center mb-4">
            <Inbox className="w-7 h-7 text-slate-400 dark:text-yrugray-500" />
          </div>
          <p className="font-semibold text-slate-800 dark:text-yrugray-100 mb-1">ยังไม่มีผู้ตอบแบบสอบถาม</p>
          <p className="text-sm text-slate-600 dark:text-yrugray-400">แดชบอร์ดจะแสดงผลทันทีที่มีผู้ส่งแบบประเมินเข้ามา</p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard accent="#ec4899" icon={<Users className="w-5 h-5" />} label="ผู้ตอบแบบสอบถาม">
              <p className="text-4xl font-extrabold text-slate-900 dark:text-white leading-none">{count.toLocaleString('th-TH')}</p>
              <p className="text-sm text-slate-500 dark:text-yrugray-400 mt-1">คน</p>
            </StatCard>
            <StatCard accent="#a78bfa" icon={<Star className="w-5 h-5" />} label="คะแนนเฉลี่ยภาพรวม">
              <p className="text-4xl font-extrabold text-slate-900 dark:text-white leading-none tabular-nums">
                {overall != null ? overall.toFixed(2) : '—'}
              </p>
              <p className="text-sm text-slate-500 dark:text-yrugray-400 mt-1">จาก 5.00 คะแนน</p>
            </StatCard>
            <StatCard accent="#34d399" icon={<Smile className="w-5 h-5" />} label="ระดับความพึงพอใจ">
              <p className={`text-3xl font-extrabold leading-tight ${sat.tone}`}>{sat.text}</p>
            </StatCard>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel icon={<BarChart3 className="w-5 h-5 text-yrupink-500" />} title="คะแนนเฉลี่ยรายด้าน">
              {aspects.length ? <BarChart aspects={aspects} /> : <EmptyHint text="ไม่มีคำถามแบบตารางให้คะแนน" />}
            </Panel>
            <Panel icon={<PieIcon className="w-5 h-5 text-yrupink-500" />} title={pie?.label || 'กิจกรรมที่ผู้เข้าอบรมสนใจมากที่สุด'}>
              {pie ? <PieChart slices={pie.slices} total={pie.total} /> : <EmptyHint text="ไม่มีคำถามแบบเลือกตอบ" />}
            </Panel>
          </div>

          {/* Free-text answers */}
          {texts.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {texts.map((t, i) => {
                const Icon = TEXT_ICONS[i % TEXT_ICONS.length];
                const color = PALETTE[i % PALETTE.length];
                return (
                  <Panel
                    key={t.field_id}
                    accent={color}
                    icon={<Icon className="w-5 h-5" style={{ color }} />}
                    title={t.label}
                    subtitle={`ข้อ ${i + 1} · ${t.answers.length} คำตอบ`}
                  >
                    <TextList answers={t.answers} color={color} />
                  </Panel>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ---------------- building blocks ---------------- */

const StatCard = ({ accent, icon, label, children }) => (
  <div className="relative bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-5 shadow-sm overflow-hidden">
    <span className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
    <div className="flex items-center gap-2 mb-3 text-slate-600 dark:text-yrugray-300">
      <span className="p-1.5 rounded-lg" style={{ background: `${accent}1a`, color: accent }}>{icon}</span>
      <span className="text-sm font-semibold">{label}</span>
    </div>
    {children}
  </div>
);

const Panel = ({ icon, title, subtitle, accent, children }) => (
  <section className="bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl p-5 flex flex-col">
    <div className="flex items-start gap-2 mb-4">
      <span className="mt-0.5 w-1 h-5 rounded-full shrink-0" style={{ background: accent || '#ec4899' }} />
      {icon}
      <div className="min-w-0">
        <h4 className="font-semibold text-slate-800 dark:text-yrugray-100 leading-snug">{title}</h4>
        {subtitle && <p className="text-xs text-slate-500 dark:text-yrugray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="flex-1">{children}</div>
  </section>
);

const EmptyHint = ({ text }) => (
  <div className="h-40 flex items-center justify-center text-sm text-slate-400 dark:text-yrugray-500">{text}</div>
);

// Vertical SVG bar chart on a fixed 0–5 axis. Values are already /5-normalised.
const BarChart = ({ aspects }) => {
  const W = 480, H = 300, padL = 34, padB = 64, padT = 12, padR = 8;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const max = 5;
  const n = aspects.length;
  const gap = 0.35;
  const band = plotW / n;
  const barW = band * (1 - gap);

  const yFor = (v) => padT + plotH - (v / max) * plotH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="คะแนนเฉลี่ยรายด้าน">
      {/* gridlines + y labels 0..5 */}
      {Array.from({ length: max + 1 }, (_, i) => i).map((i) => {
        const y = yFor(i);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y}
              className="stroke-slate-200 dark:stroke-yrugray-800" strokeWidth="1" />
            <text x={padL - 6} y={y + 3} textAnchor="end"
              className="fill-slate-400 dark:fill-yrugray-500" fontSize="10">{i}</text>
          </g>
        );
      })}
      {aspects.map((a, i) => {
        const x = padL + band * i + (band - barW) / 2;
        const y = yFor(a.value);
        const color = PALETTE[i % PALETTE.length];
        const h = padT + plotH - y;
        return (
          <g key={i}>
            <title>{a.label}: {a.value.toFixed(2)}</title>
            <rect x={x} y={y} width={barW} height={Math.max(h, 0)} rx="5" fill={color} />
            <text x={x + barW / 2} y={y - 5} textAnchor="middle"
              className="fill-slate-600 dark:fill-yrugray-300" fontSize="11" fontWeight="600">
              {a.value.toFixed(2)}
            </text>
            {wrapLabel(a.label).map((line, li) => (
              <text key={li} x={x + barW / 2} y={H - padB + 14 + li * 12} textAnchor="middle"
                className="fill-slate-500 dark:fill-yrugray-400" fontSize="10">{line}</text>
            ))}
          </g>
        );
      })}
    </svg>
  );
};

// Break a long Thai/mixed label into up to 2 short lines for the x-axis.
const wrapLabel = (label) => {
  const s = String(label || '');
  if (s.length <= 10) return [s];
  const words = s.split(/\s+/);
  if (words.length > 1) {
    const mid = Math.ceil(words.length / 2);
    const a = words.slice(0, mid).join(' ');
    const b = words.slice(mid).join(' ');
    return [a.slice(0, 14), (b.length > 14 ? b.slice(0, 13) + '…' : b)];
  }
  return [s.slice(0, 10), s.length > 20 ? s.slice(10, 19) + '…' : s.slice(10, 20)];
};

// Donut-less pie with a legend. Slices follow PALETTE in count order.
const PieChart = ({ slices, total }) => {
  const R = 95, C = 110;
  let acc = 0;
  const arcs = slices.map((s, i) => {
    const frac = s.count / total;
    const start = acc * 2 * Math.PI;
    acc += frac;
    const end = acc * 2 * Math.PI;
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = C + R * Math.sin(start), y1 = C - R * Math.cos(start);
    const x2 = C + R * Math.sin(end),   y2 = C - R * Math.cos(end);
    // A single 100% slice can't be drawn as an arc (start == end) — use a full circle.
    const d = slices.length === 1
      ? `M ${C} ${C - R} A ${R} ${R} 0 1 1 ${C - 0.01} ${C - R} Z`
      : `M ${C} ${C} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
    return { d, color: PALETTE[i % PALETTE.length], ...s, pct: Math.round(frac * 100) };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <svg viewBox="0 0 220 220" className="w-44 h-44 shrink-0" role="img" aria-label="สัดส่วนคำตอบ">
        {arcs.map((a, i) => (
          <path key={i} d={a.d} fill={a.color} stroke="white" strokeWidth="1.5"
            className="dark:stroke-yrugray-900">
            <title>{a.label}: {a.count} ({a.pct}%)</title>
          </path>
        ))}
      </svg>
      <ul className="space-y-2 w-full">
        {arcs.map((a, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: a.color }} />
            <span className="text-slate-700 dark:text-yrugray-200 flex-1 min-w-0 truncate">{a.label}</span>
            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{a.count} คน</span>
            <span className="text-xs text-slate-400 dark:text-yrugray-500 tabular-nums w-10 text-right">{a.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const TextList = ({ answers, color }) => {
  if (!answers.length) {
    return <div className="h-40 flex items-center justify-center text-sm text-slate-400 dark:text-yrugray-500">ยังไม่มีคำตอบ</div>;
  }
  return (
    <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
      {answers.map((a, i) => (
        <li key={i}
          className="text-sm text-slate-700 dark:text-yrugray-200 bg-slate-50 dark:bg-yrugray-800/60 rounded-lg px-3 py-2 border-l-2 whitespace-pre-line break-words"
          style={{ borderColor: color }}>
          {a}
        </li>
      ))}
    </ul>
  );
};

export default AssessmentDashboard;
