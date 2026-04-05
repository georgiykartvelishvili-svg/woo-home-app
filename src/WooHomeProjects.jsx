import React, { useState, useMemo, useEffect, useRef, Fragment } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from "recharts";

// ============================================================
// WOO HOME — Воронка по реальным неделям 2026
// ============================================================

const TOTAL_DESIGNERS = 250;
const INITIAL_PROCESSED = 18;
const CONV = { touchToMeeting: 0.50, meetingToKP: 0.50, kpToDeal: 0.33 };

// Реальный календарь 2026 (Апрель–Декабрь), недели по ISO (Пн–Вс)
const CALENDAR = [
  { month: "Апрель", short: "Апр", deals: 2, weeks: [
    { label: "30.03 – 05.04" }, { label: "06.04 – 12.04" }, { label: "13.04 – 19.04" },
    { label: "20.04 – 26.04" }, { label: "27.04 – 03.05" },
  ]},
  { month: "Май", short: "Май", deals: 2, weeks: [
    { label: "04.05 – 10.05" }, { label: "11.05 – 17.05" },
    { label: "18.05 – 24.05" }, { label: "25.05 – 31.05" },
  ]},
  { month: "Июнь", short: "Июн", deals: 3, weeks: [
    { label: "01.06 – 07.06" }, { label: "08.06 – 14.06" },
    { label: "15.06 – 21.06" }, { label: "22.06 – 28.06" },
  ]},
  { month: "Июль", short: "Июл", deals: 3, weeks: [
    { label: "29.06 – 05.07" }, { label: "06.07 – 12.07" },
    { label: "13.07 – 19.07" }, { label: "20.07 – 26.07" }, { label: "27.07 – 02.08" },
  ]},
  { month: "Август", short: "Авг", deals: 4, weeks: [
    { label: "03.08 – 09.08" }, { label: "10.08 – 16.08" },
    { label: "17.08 – 23.08" }, { label: "24.08 – 30.08" },
  ]},
  { month: "Сентябрь", short: "Сен", deals: 4, weeks: [
    { label: "31.08 – 06.09" }, { label: "07.09 – 13.09" },
    { label: "14.09 – 20.09" }, { label: "21.09 – 27.09" },
  ]},
  { month: "Октябрь", short: "Окт", deals: 4, weeks: [
    { label: "28.09 – 04.10" }, { label: "05.10 – 11.10" },
    { label: "12.10 – 18.10" }, { label: "19.10 – 25.10" }, { label: "26.10 – 01.11" },
  ]},
  { month: "Ноябрь", short: "Ноя", deals: 4, weeks: [
    { label: "02.11 – 08.11" }, { label: "09.11 – 15.11" },
    { label: "16.11 – 22.11" }, { label: "23.11 – 29.11" },
  ]},
  { month: "Декабрь", short: "Дек", deals: 4, weeks: [
    { label: "30.11 – 06.12" }, { label: "07.12 – 13.12" },
    { label: "14.12 – 20.12" }, { label: "21.12 – 27.12" }, { label: "28.12 – 03.01" },
  ]},
];

const METRICS = [
  { key: "touches", label: "Касания", color: "#94a3b8", icon: "📞" },
  { key: "meetings", label: "Встречи", color: "#6366f1", icon: "🤝" },
  { key: "kp", label: "КП", color: "#3b82f6", icon: "📄" },
  { key: "deals", label: "Договоры", color: "#8b5cf6", icon: "✍️" },
  { key: "money", label: "Выручка ₽", color: "#10b981", icon: "💰", isMoney: true },
];

function buildMonthPlan(deals) {
  const kp = Math.round(deals / CONV.kpToDeal);
  const meetings = Math.round(kp / CONV.meetingToKP);
  const touches = Math.round(meetings / CONV.touchToMeeting);
  return { touches, meetings, kp, deals, money: deals * 3_000_000 };
}

const fmtMoney = (n) => {
  if (!n && n !== 0) return "—";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "М";
  if (Math.abs(n) >= 1000) return Math.round(n / 1000) + "К";
  return String(n);
};

const fmtVal = (n, isMoney) => {
  if (n === "" || n === undefined || n === null) return "—";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "—";
  return isMoney ? fmtMoney(num) : num;
};

function Deviation({ plan, fact }) {
  if (!fact && fact !== 0) return null;
  const f = typeof fact === "string" ? parseFloat(fact) : fact;
  if (isNaN(f) || !plan) return null;
  const diff = f - plan;
  const color = diff >= 0 ? "#16a34a" : "#ef4444";
  return <span style={{ fontSize: 10, fontWeight: 600, color, marginLeft: 2 }}>
    {diff > 0 ? "+" : ""}{diff}
  </span>;
}

// Инициализация: globalWeekIdx + metricKey
function initFacts() {
  const f = {};
  let idx = 0;
  CALENDAR.forEach(m => { m.weeks.forEach(() => { METRICS.forEach(mt => { f[`${idx}_${mt.key}`] = ""; }); idx++; }); });
  return f;
}

const emptyProject = () => ({
  id: Date.now() + Math.random(),
  name: "", designer: "", saleDate: "", designFee: "", projectSum: "", endDate: "",
});

const MONTHS_ALL = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
const ALL_MONTHS_LABELS = [...MONTHS_ALL, ...MONTHS_ALL.map(m => m + " '27")];

function dateToMonthIndex(dateStr) {
  if (!dateStr) return null;
  const [y, m] = dateStr.split("-").map(Number);
  if (y === 2026) return m - 1;
  if (y === 2027) return 12 + m - 1;
  return null;
}

export default function WooHomeProjects({ savedData, onDataChange }) {
  const [facts, setFacts] = useState(initFacts);
  const [view, setView] = useState("plan");
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [projects, setProjects] = useState([emptyProject()]);
  const isLoadedRef = useRef(false);

  // Загрузка данных из Firebase
  useEffect(() => {
    if (savedData && !isLoadedRef.current) {
      if (savedData.facts) setFacts(savedData.facts);
      if (savedData.projects) setProjects(savedData.projects);
      isLoadedRef.current = true;
    }
  }, [savedData]);

  // Сохранение данных в Firebase при изменениях
  useEffect(() => {
    if (!isLoadedRef.current) return;
    if (onDataChange) {
      onDataChange({ facts, projects });
    }
  }, [facts, projects]);

  const addProject = () => setProjects(prev => [...prev, emptyProject()]);
  const removeProject = (id) => setProjects(prev => prev.length > 1 ? prev.filter(p => p.id !== id) : prev);
  const updateProject = (id, field, value) => setProjects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));

  const updateFact = (weekIdx, key, value) => setFacts(prev => ({ ...prev, [`${weekIdx}_${key}`]: value }));
  const getFact = (weekIdx, key) => facts[`${weekIdx}_${key}`] || "";

  const data = useMemo(() => {
    let globalWeekIdx = 0;
    let designersRemaining = TOTAL_DESIGNERS - INITIAL_PROCESSED;

    return CALENDAR.map((cal, mi) => {
      const monthPlan = buildMonthPlan(cal.deals);
      const numWeeks = cal.weeks.length;

      // Недельный план (равномерное распределение)
      const wp = {};
      METRICS.forEach(mt => {
        wp[mt.key] = Math.round(monthPlan[mt.key] / numWeeks);
      });
      // Корректируем остаток в последнюю неделю
      const wpLast = {};
      METRICS.forEach(mt => {
        wpLast[mt.key] = monthPlan[mt.key] - wp[mt.key] * (numWeeks - 1);
      });

      const monthFact = {};
      const monthFactFilled = {};
      METRICS.forEach(mt => { monthFact[mt.key] = 0; monthFactFilled[mt.key] = false; });

      const weeks = cal.weeks.map((w, wi) => {
        const thisWp = wi === numWeeks - 1 ? wpLast : wp;
        const weekFacts = {};
        METRICS.forEach(mt => {
          const v = getFact(globalWeekIdx, mt.key);
          weekFacts[mt.key] = v;
          if (v !== "") {
            monthFact[mt.key] += parseFloat(v) || 0;
            monthFactFilled[mt.key] = true;
          }
        });

        const meetFact = parseFloat(weekFacts.meetings);
        if (!isNaN(meetFact) && meetFact > 0) {
          designersRemaining = Math.max(0, designersRemaining - meetFact);
        }

        const result = { weekIdx: globalWeekIdx, label: w.label, plan: thisWp, fact: weekFacts };
        globalWeekIdx++;
        return result;
      });

      if (!monthFactFilled.meetings) {
        designersRemaining = Math.max(0, designersRemaining - monthPlan.meetings);
      }

      return { ...cal, monthIdx: mi, plan: monthPlan, weeks, monthFact, monthFactFilled, designersRemaining };
    });
  }, [facts]);

  const totals = useMemo(() => {
    const t = { plan: {}, fact: {} };
    METRICS.forEach(mt => { t.plan[mt.key] = 0; t.fact[mt.key] = 0; });
    data.forEach(m => METRICS.forEach(mt => {
      t.plan[mt.key] += m.plan[mt.key];
      t.fact[mt.key] += m.monthFact[mt.key];
    }));
    return t;
  }, [data]);

  // Денежный поток из проектов
  const cashflow = useMemo(() => {
    const months = new Array(24).fill(null).map((_, i) => ({
      month: ALL_MONTHS_LABELS[i], designIncome: 0, projectIncome: 0, total: 0,
      names: { design: [], project: [] },
    }));
    projects.forEach(p => {
      const dFee = parseFloat(p.designFee) || 0;
      const pSum = parseFloat(p.projectSum) || 0;
      const sIdx = dateToMonthIndex(p.saleDate);
      const eIdx = dateToMonthIndex(p.endDate);
      const nm = p.name || "—";
      if (sIdx !== null && dFee > 0 && sIdx >= 0 && sIdx < 24) { months[sIdx].designIncome += dFee; months[sIdx].names.design.push(nm); }
      if (eIdx !== null && pSum > 0 && eIdx >= 0 && eIdx < 24) { months[eIdx].projectIncome += pSum; months[eIdx].names.project.push(nm); }
    });
    months.forEach(m => m.total = m.designIncome + m.projectIncome);
    let cumTotal = 0;
    return months.map(m => { cumTotal += m.total; return { ...m, cumTotal }; });
  }, [projects]);

  const projectTotals = useMemo(() => {
    const t = { designTotal: 0, projectTotal: 0, total: 0, count: 0 };
    projects.forEach(p => {
      const d = parseFloat(p.designFee) || 0;
      const s = parseFloat(p.projectSum) || 0;
      t.designTotal += d; t.projectTotal += s; t.total += d + s;
      if (p.name || d || s) t.count++;
    });
    return t;
  }, [projects]);

  const toggleMonth = (mi) => setExpandedMonth(prev => prev === mi ? null : mi);

  const projInputStyle = {
    padding: "8px 10px", border: "2px solid #e2e8f0", borderRadius: 8,
    fontSize: 13, outline: "none", transition: "border 0.2s", width: "100%", boxSizing: "border-box",
  };

  const inpStyle = (color) => ({
    width: 54, padding: "5px 4px", border: "2px solid #e2e8f0", borderRadius: 6,
    fontSize: 12, textAlign: "center", outline: "none", fontWeight: 600,
    color, transition: "border 0.2s", boxSizing: "border-box",
  });

  return (
    <div style={{ maxWidth: 1300, margin: "0 auto", padding: "24px 16px", fontFamily: "'Inter', -apple-system, sans-serif", background: "#f8fafc", minHeight: "100vh" }}>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>WOO Home — План-факт воронки</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Календарь 2026 · Конверсии: касание→встреча 50%, встреча→КП 50%, КП→договор 33%</p>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
        {METRICS.map(m => (
          <div key={m.key} style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderLeft: `4px solid ${m.color}` }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>{m.icon} {m.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
                {totals.fact[m.key] > 0 ? fmtVal(totals.fact[m.key], m.isMoney) : "—"}
              </span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>/ {fmtVal(totals.plan[m.key], m.isMoney)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Табы */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#fff", borderRadius: 10, padding: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", width: "fit-content" }}>
        {[
          { id: "plan", label: "План to be" },
          { id: "funnel", label: "Воронка по неделям" },
          { id: "projects", label: "Договоры" },
          { id: "cashflow", label: "План по деньгам" },
          { id: "designers", label: "База дизайнеров" },
          { id: "summary", label: "Сводка" },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
            background: view === t.id ? "#3b82f6" : "transparent", color: view === t.id ? "#fff" : "#64748b",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ======= ПЛАН TO BE ======= */}
      {view === "plan" && (
        <div>
          {/* Бизнес-модель */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Бизнес-модель WOO Home</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { l: "Средний чек", v: "3 000 000 ₽", c: "#3b82f6" },
                { l: "Маржинальность", v: "60%", c: "#10b981" },
                { l: "Себестоимость", v: "40% (1.2 млн)", c: "#ef4444" },
                { l: "Комиссия дизайнера", v: "10% (300 тыс)", c: "#f59e0b" },
                { l: "Цикл сделки", v: "24 месяца", c: "#8b5cf6" },
                { l: "Потенциал допродаж", v: "до 80%", c: "#06b6d4" },
                { l: "Мощность PM", v: "4–6 объектов", c: "#64748b" },
                { l: "Учёт выручки", v: "По поступлению ДС", c: "#94a3b8" },
              ].map((p, i) => (
                <div key={i} style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 8, borderLeft: `3px solid ${p.c}` }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{p.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>{p.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Рынок дизайнеров */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Рынок дизайнеров · Челябинск</h3>
            <div style={{ maxWidth: 500 }}>
              {[
                { l: "Всего дизайнеров", v: 250, w: 100, c: "#e2e8f0" },
                { l: "В телефонном справочнике", v: 110, w: 44, c: "#94a3b8" },
                { l: "Целевой АКБ (2+ проекта)", v: 72, w: 29, c: "#f59e0b" },
                { l: "Обработано на старте", v: 18, w: 7, c: "#3b82f6" },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                    <span style={{ color: "#64748b" }}>{item.l}</span>
                    <span style={{ fontWeight: 700, color: "#1e293b" }}>{item.v}</span>
                  </div>
                  <div style={{ height: 16, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${item.w}%`, background: item.c, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Конверсионная модель */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Конверсионная модель (обратный расчёт от договоров)</h3>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "16px 0", flexWrap: "wrap" }}>
              {[
                { label: "48 касаний", sub: "Звонки, сообщения", color: "#94a3b8" },
                { label: "×50%", arrow: true },
                { label: "24 встречи", sub: "Шоурум + производство", color: "#6366f1" },
                { label: "×50%", arrow: true },
                { label: "12 КП", sub: "Коммерч. предложения", color: "#3b82f6" },
                { label: "×33%", arrow: true },
                { label: "4 договора", sub: "Контракты подписаны", color: "#8b5cf6" },
                { label: "×3М", arrow: true },
                { label: "12 млн ₽", sub: "Выручка в месяц", color: "#10b981" },
              ].map((item, i) => item.arrow
                ? <div key={i} style={{ fontSize: 14, color: "#94a3b8", fontWeight: 700 }}>{item.label}</div>
                : <div key={i} style={{ background: item.color + "12", border: `2px solid ${item.color}`, borderRadius: 10, padding: "10px 14px", textAlign: "center", minWidth: 90 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: item.color }}>{item.label}</div>
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{item.sub}</div>
                  </div>
              )}
            </div>
            <div style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Цифры на крейсерской скорости (Авг–Дек 2026)</div>
          </div>

          {/* Помесячный план */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Помесячный план Апрель–Декабрь 2026</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "2px solid #e2e8f0", color: "#64748b", fontSize: 12 }}>Месяц</th>
                  <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: "2px solid #e2e8f0", color: "#94a3b8", fontSize: 12 }}>Касания</th>
                  <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: "2px solid #e2e8f0", color: "#6366f1", fontSize: 12 }}>Встречи</th>
                  <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: "2px solid #e2e8f0", color: "#3b82f6", fontSize: 12 }}>КП</th>
                  <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: "2px solid #e2e8f0", color: "#8b5cf6", fontSize: 12 }}>Договоры</th>
                  <th style={{ padding: "10px 8px", textAlign: "right", borderBottom: "2px solid #e2e8f0", color: "#10b981", fontSize: 12, fontWeight: 700 }}>Выручка</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "2px solid #e2e8f0", color: "#64748b", fontSize: 11 }}>Комментарий</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { m: "Апрель", d: 2, note: "1 PM, найм менеджера по дизайнерам" },
                  { m: "Май", d: 2, note: "Менеджер выходит, обучение" },
                  { m: "Июнь", d: 3, note: "Менеджер набрал темп" },
                  { m: "Июль", d: 3, note: "Выход 2-го PM" },
                  { m: "Август", d: 4, note: "Крейсерская скорость" },
                  { m: "Сентябрь", d: 4, note: "Крейсерская скорость" },
                  { m: "Октябрь", d: 4, note: "Крейсерская скорость" },
                  { m: "Ноябрь", d: 4, note: "Крейсерская скорость" },
                  { m: "Декабрь", d: 4, note: "Крейсерская скорость" },
                ].map((row, i) => {
                  const p = buildMonthPlan(row.d);
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "#334155", borderBottom: "1px solid #f1f5f9" }}>{row.m}</td>
                      <td style={{ padding: "8px", textAlign: "center", color: "#94a3b8", borderBottom: "1px solid #f1f5f9" }}>{p.touches}</td>
                      <td style={{ padding: "8px", textAlign: "center", color: "#6366f1", fontWeight: 600, borderBottom: "1px solid #f1f5f9" }}>{p.meetings}</td>
                      <td style={{ padding: "8px", textAlign: "center", color: "#3b82f6", fontWeight: 600, borderBottom: "1px solid #f1f5f9" }}>{p.kp}</td>
                      <td style={{ padding: "8px", textAlign: "center", color: "#8b5cf6", fontWeight: 700, borderBottom: "1px solid #f1f5f9" }}>{p.deals}</td>
                      <td style={{ padding: "8px", textAlign: "right", color: "#10b981", fontWeight: 700, borderBottom: "1px solid #f1f5f9" }}>{fmtMoney(p.money)}</td>
                      <td style={{ padding: "8px 12px", color: "#94a3b8", fontSize: 11, borderBottom: "1px solid #f1f5f9" }}>{row.note}</td>
                    </tr>
                  );
                })}
                <tr style={{ background: "#f0f9ff", fontWeight: 700 }}>
                  <td style={{ padding: "12px", borderTop: "2px solid #3b82f6", color: "#0f172a" }}>ИТОГО</td>
                  <td style={{ padding: "8px", textAlign: "center", borderTop: "2px solid #3b82f6", color: "#94a3b8" }}>{totals.plan.touches}</td>
                  <td style={{ padding: "8px", textAlign: "center", borderTop: "2px solid #3b82f6", color: "#6366f1" }}>{totals.plan.meetings}</td>
                  <td style={{ padding: "8px", textAlign: "center", borderTop: "2px solid #3b82f6", color: "#3b82f6" }}>{totals.plan.kp}</td>
                  <td style={{ padding: "8px", textAlign: "center", borderTop: "2px solid #3b82f6", color: "#8b5cf6" }}>{totals.plan.deals}</td>
                  <td style={{ padding: "8px", textAlign: "right", borderTop: "2px solid #3b82f6", color: "#10b981" }}>{fmtMoney(totals.plan.money)}</td>
                  <td style={{ padding: "8px", borderTop: "2px solid #3b82f6" }}></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Юнит-экономика */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Юнит-экономика 1 проекта</h3>
            <div style={{ maxWidth: 500 }}>
              {[
                { l: "Средний чек", v: 3_000_000, pct: 100, c: "#3b82f6" },
                { l: "Себестоимость (40%)", v: -1_200_000, pct: 40, c: "#ef4444" },
                { l: "Маржа (60%)", v: 1_800_000, pct: 60, c: "#10b981" },
                { l: "Комиссия дизайнера (10%)", v: -300_000, pct: 10, c: "#f59e0b" },
                { l: "Прибыль с проекта", v: 1_500_000, pct: 50, c: "#8b5cf6" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
                  <div style={{ width: 190, fontSize: 13, color: "#64748b" }}>{item.l}</div>
                  <div style={{ flex: 1, height: 20, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${item.pct}%`, background: item.c, borderRadius: 4 }} />
                  </div>
                  <div style={{ width: 90, textAlign: "right", fontSize: 13, fontWeight: 600, color: item.v < 0 ? "#ef4444" : "#1e293b" }}>
                    {fmtMoney(Math.abs(item.v))} ₽
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Финансовый итог года */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Финансовый итог 2026 (Апр–Дек)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { l: "Выручка", v: fmtMoney(totals.plan.money) + " ₽", c: "#10b981" },
                { l: "Маржа (60%)", v: fmtMoney(totals.plan.money * 0.6) + " ₽", c: "#3b82f6" },
                { l: "Агентские (10%)", v: "−" + fmtMoney(totals.plan.deals * 300_000) + " ₽", c: "#f59e0b" },
                { l: "Прибыль", v: fmtMoney(totals.plan.money * 0.6 - totals.plan.deals * 300_000) + " ₽", c: "#8b5cf6" },
              ].map((item, i) => (
                <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", borderLeft: `4px solid ${item.c}` }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{item.l}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>{item.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Команда */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>План найма</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[
                { period: "Апр–Июн", label: "Фаза 1", hires: "Менеджер по дизайнерам + ассистент", note: "3 проекта оплачивают 6 мес зарплат", c: "#3b82f6" },
                { period: "Июль", label: "Фаза 2", hires: "2-й PM + ассистент проектировщика", note: "При выполнении плана", c: "#8b5cf6" },
                { period: "Крейсер", label: "Целевой штат", hires: "1 менеджер, 1 асс, 2 PM, 2 асс", note: "4–6 объектов на пару PM+асс", c: "#10b981" },
              ].map((phase, i) => (
                <div key={i} style={{ padding: 16, borderRadius: 10, borderLeft: `4px solid ${phase.c}`, background: "#f8fafc" }}>
                  <div style={{ fontSize: 11, color: phase.c, fontWeight: 700 }}>{phase.period}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>{phase.label}</div>
                  <div style={{ fontSize: 12, color: "#334155", marginTop: 6 }}>{phase.hires}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{phase.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======= ВОРОНКА ======= */}
      {view === "funnel" && (
        <div>
          {/* Конверсия */}
          <div style={{ background: "#fff", borderRadius: 10, padding: "12px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, flexWrap: "wrap" }}>
              {[
                { l: "Касания", c: "#94a3b8" }, { l: "×50%→", arrow: true },
                { l: "Встречи", c: "#6366f1" }, { l: "×50%→", arrow: true },
                { l: "КП", c: "#3b82f6" }, { l: "×33%→", arrow: true },
                { l: "Договоры", c: "#8b5cf6" }, { l: "×3М→", arrow: true },
                { l: "Выручка", c: "#10b981" },
              ].map((x, i) => x.arrow
                ? <span key={i} style={{ color: "#94a3b8", fontWeight: 600 }}>{x.l}</span>
                : <span key={i} style={{ background: x.c + "18", color: x.c, fontWeight: 700, padding: "4px 10px", borderRadius: 6 }}>{x.l}</span>
              )}
            </div>
          </div>

          {/* Месяцы */}
          {data.map((month, mi) => {
            const isExpanded = expandedMonth === mi;
            return (
              <div key={mi} style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 6, overflow: "hidden" }}>

                {/* Заголовок месяца */}
                <div
                  onClick={() => toggleMonth(mi)}
                  style={{
                    display: "grid", gridTemplateColumns: "130px repeat(5, 1fr) 70px",
                    alignItems: "center", padding: "10px 14px", cursor: "pointer",
                    background: isExpanded ? "#f0f9ff" : "#fff",
                    borderBottom: isExpanded ? "2px solid #3b82f6" : "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#3b82f6", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>▶</span>
                    <div>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{month.month}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{month.weeks.length} нед.</div>
                    </div>
                  </div>

                  {METRICS.map(metric => {
                    const plan = month.plan[metric.key];
                    const fact = month.monthFactFilled[metric.key] ? month.monthFact[metric.key] : null;
                    return (
                      <div key={metric.key} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: "#94a3b8" }}>{metric.icon} {metric.label}</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: fact !== null ? metric.color : "#cbd5e1" }}>
                            {fact !== null ? fmtVal(fact, metric.isMoney) : "—"}
                          </span>
                          <span style={{ fontSize: 10, color: "#94a3b8" }}>/{fmtVal(plan, metric.isMoney)}</span>
                        </div>
                        {fact !== null && !metric.isMoney && <Deviation plan={plan} fact={fact} />}
                      </div>
                    );
                  })}

                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#94a3b8" }}>👥</div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: month.designersRemaining > 100 ? "#10b981" : month.designersRemaining > 50 ? "#f59e0b" : "#ef4444" }}>
                      {month.designersRemaining}
                    </span>
                  </div>
                </div>

                {/* Недели */}
                {isExpanded && (
                  <div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          <th style={{ padding: "6px 14px", textAlign: "left", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: 11, width: 130 }}>Неделя</th>
                          {METRICS.map(m => (
                            <th key={m.key} colSpan={2} style={{ padding: "6px 2px", textAlign: "center", borderBottom: "1px solid #e2e8f0", color: m.color, fontSize: 10 }}>
                              {m.icon} {m.label}
                            </th>
                          ))}
                        </tr>
                        <tr style={{ background: "#fafbfc" }}>
                          <th style={{ padding: "3px 14px", borderBottom: "1px solid #e2e8f0" }}></th>
                          {METRICS.map(m => (
                            <Fragment key={m.key}>
                              <th style={{ padding: "3px", textAlign: "center", borderBottom: "1px solid #e2e8f0", fontSize: 9, color: "#94a3b8" }}>план</th>
                              <th style={{ padding: "3px", textAlign: "center", borderBottom: "1px solid #e2e8f0", fontSize: 9, color: "#059669" }}>факт</th>
                            </Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {month.weeks.map((week, wi) => (
                          <tr key={wi} style={{ background: wi % 2 === 0 ? "#fff" : "#fafbfc" }}>
                            <td style={{ padding: "8px 14px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, color: "#334155", fontSize: 12, whiteSpace: "nowrap" }}>
                              {week.label}
                            </td>
                            {METRICS.map(metric => (
                              <Fragment key={metric.key}>
                                <td style={{ padding: "4px 2px", textAlign: "center", borderBottom: "1px solid #f1f5f9", color: "#b0b8c4", fontSize: 11 }}>
                                  {fmtVal(week.plan[metric.key], metric.isMoney)}
                                </td>
                                <td style={{ padding: "3px 1px", textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>
                                  <input
                                    type="number"
                                    value={week.fact[metric.key]}
                                    onChange={e => updateFact(week.weekIdx, metric.key, e.target.value)}
                                    placeholder="—"
                                    style={inpStyle(metric.color)}
                                    onFocus={e => e.target.style.borderColor = metric.color}
                                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                                  />
                                </td>
                              </Fragment>
                            ))}
                          </tr>
                        ))}
                        {/* Итого месяца */}
                        <tr style={{ background: "#f0f9ff", fontWeight: 700 }}>
                          <td style={{ padding: "8px 14px", borderTop: "2px solid #3b82f6", color: "#0f172a", fontSize: 12 }}>Итого {month.short}</td>
                          {METRICS.map(metric => (
                            <Fragment key={metric.key}>
                              <td style={{ padding: "4px", textAlign: "center", borderTop: "2px solid #3b82f6", color: "#64748b", fontSize: 11 }}>
                                {fmtVal(month.plan[metric.key], metric.isMoney)}
                              </td>
                              <td style={{ padding: "4px", textAlign: "center", borderTop: "2px solid #3b82f6", color: month.monthFactFilled[metric.key] ? metric.color : "#cbd5e1", fontWeight: 700, fontSize: 12 }}>
                                {month.monthFactFilled[metric.key] ? fmtVal(month.monthFact[metric.key], metric.isMoney) : "—"}
                                {month.monthFactFilled[metric.key] && !metric.isMoney && <Deviation plan={month.plan[metric.key]} fact={month.monthFact[metric.key]} />}
                              </td>
                            </Fragment>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {/* Общий итог */}
          <div style={{
            background: "#fff", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginTop: 6,
            display: "grid", gridTemplateColumns: "130px repeat(5, 1fr) 70px",
            alignItems: "center", padding: "12px 14px",
          }}>
            <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 14 }}>ИТОГО 2026</div>
            {METRICS.map(metric => (
              <div key={metric.key} style={{ textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: totals.fact[metric.key] > 0 ? metric.color : "#cbd5e1" }}>
                    {totals.fact[metric.key] > 0 ? fmtVal(totals.fact[metric.key], metric.isMoney) : "—"}
                  </span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>/{fmtVal(totals.plan[metric.key], metric.isMoney)}</span>
                </div>
              </div>
            ))}
            <div style={{ textAlign: "center", fontWeight: 700, color: data[data.length - 1].designersRemaining > 50 ? "#10b981" : "#ef4444" }}>
              {data[data.length - 1].designersRemaining}
            </div>
          </div>

          <div style={{ marginTop: 10, padding: 10, background: "#fefce8", borderRadius: 8, fontSize: 11, color: "#854d0e" }}>
            Кликните на месяц → раскроются реальные недели 2026 года с полями факта. Каждая факт-встреча минусует дизайнера из базы (старт: {TOTAL_DESIGNERS} − {INITIAL_PROCESSED} = {TOTAL_DESIGNERS - INITIAL_PROCESSED}).
          </div>
        </div>
      )}

      {/* ======= БАЗА ДИЗАЙНЕРОВ ======= */}
      {view === "designers" && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", margin: "0 0 16px" }}>Остаток базы дизайнеров</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Всего на рынке", value: TOTAL_DESIGNERS, color: "#3b82f6" },
                  { label: "Обработано на старте", value: INITIAL_PROCESSED, color: "#94a3b8" },
                  { label: "Встреч по плану (год)", value: totals.plan.meetings, color: "#6366f1" },
                  { label: "Останется к концу года", value: data[data.length - 1].designersRemaining, color: data[data.length - 1].designersRemaining > 50 ? "#10b981" : "#ef4444" },
                ].map((item, i) => (
                  <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{item.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {data.map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 30, fontSize: 12, fontWeight: 600, color: "#64748b" }}>{m.short}</div>
                  <div style={{ flex: 1, height: 22, background: "#f1f5f9", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 6, transition: "width 0.3s",
                      width: `${(m.designersRemaining / TOTAL_DESIGNERS) * 100}%`,
                      background: m.designersRemaining > 100 ? "#10b981" : m.designersRemaining > 50 ? "#f59e0b" : "#ef4444",
                    }} />
                  </div>
                  <div style={{ width: 30, fontSize: 13, fontWeight: 600, color: "#1e293b", textAlign: "right" }}>{m.designersRemaining}</div>
                  <div style={{ width: 80, fontSize: 11, color: m.monthFactFilled.meetings ? "#059669" : "#94a3b8" }}>
                    −{m.monthFactFilled.meetings ? m.monthFact.meetings : m.plan.meetings}
                    {m.monthFactFilled.meetings ? " (факт)" : " (план)"}
                  </div>
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={data.map(m => ({ month: m.short, "Осталось дизайнеров": m.designersRemaining }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, TOTAL_DESIGNERS]} />
                <Tooltip />
                <Area type="monotone" dataKey="Осталось дизайнеров" fill="#bfdbfe" stroke="#3b82f6" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ======= СВОДКА ======= */}
      {view === "summary" && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflowX: "auto" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", margin: "0 0 16px" }}>Сводная таблица</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "2px solid #e2e8f0", color: "#64748b" }}>Месяц</th>
                {METRICS.map(m => (
                  <th key={m.key} colSpan={2} style={{ padding: "10px 4px", textAlign: "center", borderBottom: "2px solid #e2e8f0", color: m.color, fontSize: 11 }}>
                    {m.icon} {m.label}
                  </th>
                ))}
                <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: "2px solid #e2e8f0", color: "#f59e0b", fontSize: 11 }}>👥 База</th>
              </tr>
              <tr>
                <th style={{ padding: "3px 12px", borderBottom: "1px solid #e2e8f0" }}></th>
                {METRICS.map(m => (
                  <Fragment key={m.key}>
                    <th style={{ padding: "3px", textAlign: "center", borderBottom: "1px solid #e2e8f0", fontSize: 9, color: "#94a3b8" }}>план</th>
                    <th style={{ padding: "3px", textAlign: "center", borderBottom: "1px solid #e2e8f0", fontSize: 9, color: "#059669" }}>факт</th>
                  </Fragment>
                ))}
                <th style={{ padding: "3px", borderBottom: "1px solid #e2e8f0" }}></th>
              </tr>
            </thead>
            <tbody>
              {data.map((m, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: "#334155", borderBottom: "1px solid #f1f5f9" }}>{m.month}</td>
                  {METRICS.map(metric => (
                    <Fragment key={metric.key}>
                      <td style={{ padding: "6px 4px", textAlign: "center", color: "#94a3b8", borderBottom: "1px solid #f1f5f9" }}>
                        {fmtVal(m.plan[metric.key], metric.isMoney)}
                      </td>
                      <td style={{ padding: "6px 4px", textAlign: "center", borderBottom: "1px solid #f1f5f9", fontWeight: 600, color: m.monthFactFilled[metric.key] ? metric.color : "#cbd5e1" }}>
                        {m.monthFactFilled[metric.key] ? fmtVal(m.monthFact[metric.key], metric.isMoney) : "—"}
                      </td>
                    </Fragment>
                  ))}
                  <td style={{ padding: "6px 8px", textAlign: "center", borderBottom: "1px solid #f1f5f9", fontWeight: 600, color: m.designersRemaining > 100 ? "#10b981" : m.designersRemaining > 50 ? "#f59e0b" : "#ef4444" }}>
                    {m.designersRemaining}
                  </td>
                </tr>
              ))}
              <tr style={{ background: "#f0f9ff", fontWeight: 700 }}>
                <td style={{ padding: "12px", borderTop: "2px solid #3b82f6", color: "#0f172a" }}>ИТОГО</td>
                {METRICS.map(metric => (
                  <Fragment key={metric.key}>
                    <td style={{ padding: "6px 4px", textAlign: "center", borderTop: "2px solid #3b82f6", color: "#64748b" }}>
                      {fmtVal(totals.plan[metric.key], metric.isMoney)}
                    </td>
                    <td style={{ padding: "6px 4px", textAlign: "center", borderTop: "2px solid #3b82f6", color: totals.fact[metric.key] > 0 ? metric.color : "#cbd5e1" }}>
                      {totals.fact[metric.key] > 0 ? fmtVal(totals.fact[metric.key], metric.isMoney) : "—"}
                    </td>
                  </Fragment>
                ))}
                <td style={{ padding: "6px 8px", textAlign: "center", borderTop: "2px solid #3b82f6", fontWeight: 700, color: "#f59e0b" }}>
                  {data[data.length - 1].designersRemaining}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ======= ДОГОВОРЫ (ПРОЕКТЫ) ======= */}
      {view === "projects" && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", margin: 0 }}>Реестр договоров</h3>
            <button onClick={addProject} style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "#3b82f6", color: "#fff", fontSize: 13, fontWeight: 600
            }}>+ Добавить договор</button>
          </div>

          {/* KPI проектов */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
            {[
              { icon: "📋", label: "Договоров", value: projectTotals.count, color: "#3b82f6" },
              { icon: "✏️", label: "За проектирование", value: fmtMoney(projectTotals.designTotal) + " ₽", color: "#f59e0b" },
              { icon: "🏠", label: "За проекты", value: fmtMoney(projectTotals.projectTotal) + " ₽", color: "#8b5cf6" },
              { icon: "💰", label: "Итого", value: fmtMoney(projectTotals.total) + " ₽", color: "#10b981" },
            ].map((kpi, i) => (
              <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 14px", borderLeft: `4px solid ${kpi.color}` }}>
                <div style={{ fontSize: 11, color: "#64748b" }}>{kpi.icon} {kpi.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 800 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "10px 8px", textAlign: "left", borderBottom: "2px solid #e2e8f0", color: "#64748b", fontSize: 12, width: "4%" }}>#</th>
                  <th style={{ padding: "10px 8px", textAlign: "left", borderBottom: "2px solid #e2e8f0", color: "#64748b", fontSize: 12, width: "18%" }}>Проект</th>
                  <th style={{ padding: "10px 8px", textAlign: "left", borderBottom: "2px solid #e2e8f0", color: "#6366f1", fontSize: 12, width: "14%" }}>Дизайнер</th>
                  <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: "2px solid #e2e8f0", color: "#64748b", fontSize: 12, width: "11%" }}>Дата продажи</th>
                  <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: "2px solid #e2e8f0", color: "#f59e0b", fontSize: 12, width: "13%" }}>Проектирование ₽</th>
                  <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: "2px solid #e2e8f0", color: "#64748b", fontSize: 12, width: "11%" }}>Дата заверш.</th>
                  <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: "2px solid #e2e8f0", color: "#8b5cf6", fontSize: 12, width: "14%" }}>Сумма проекта ₽</th>
                  <th style={{ padding: "10px 8px", width: "4%" }}></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p, idx) => (
                  <tr key={p.id} style={{ background: idx % 2 === 0 ? "#fff" : "#fafbfc" }}>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #f1f5f9", color: "#94a3b8", fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ padding: "6px 4px", borderBottom: "1px solid #f1f5f9" }}>
                      <input type="text" placeholder="ЖК Парковый..." value={p.name}
                        onChange={e => updateProject(p.id, "name", e.target.value)}
                        style={projInputStyle}
                        onFocus={e => e.target.style.borderColor = "#3b82f6"}
                        onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                    </td>
                    <td style={{ padding: "6px 4px", borderBottom: "1px solid #f1f5f9" }}>
                      <input type="text" placeholder="Иванова А." value={p.designer}
                        onChange={e => updateProject(p.id, "designer", e.target.value)}
                        style={projInputStyle}
                        onFocus={e => e.target.style.borderColor = "#6366f1"}
                        onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                    </td>
                    <td style={{ padding: "6px 4px", borderBottom: "1px solid #f1f5f9" }}>
                      <input type="month" value={p.saleDate}
                        onChange={e => updateProject(p.id, "saleDate", e.target.value)}
                        style={{ ...projInputStyle, textAlign: "center" }}
                        onFocus={e => e.target.style.borderColor = "#3b82f6"}
                        onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                    </td>
                    <td style={{ padding: "6px 4px", borderBottom: "1px solid #f1f5f9" }}>
                      <input type="number" placeholder="150000" value={p.designFee}
                        onChange={e => updateProject(p.id, "designFee", e.target.value)}
                        style={{ ...projInputStyle, textAlign: "right", color: "#f59e0b", fontWeight: 600 }}
                        onFocus={e => e.target.style.borderColor = "#f59e0b"}
                        onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                    </td>
                    <td style={{ padding: "6px 4px", borderBottom: "1px solid #f1f5f9" }}>
                      <input type="month" value={p.endDate}
                        onChange={e => updateProject(p.id, "endDate", e.target.value)}
                        style={{ ...projInputStyle, textAlign: "center" }}
                        onFocus={e => e.target.style.borderColor = "#8b5cf6"}
                        onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                    </td>
                    <td style={{ padding: "6px 4px", borderBottom: "1px solid #f1f5f9" }}>
                      <input type="number" placeholder="3000000" value={p.projectSum}
                        onChange={e => updateProject(p.id, "projectSum", e.target.value)}
                        style={{ ...projInputStyle, textAlign: "right", color: "#8b5cf6", fontWeight: 600 }}
                        onFocus={e => e.target.style.borderColor = "#8b5cf6"}
                        onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                    </td>
                    <td style={{ padding: "6px 4px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                      <button onClick={() => removeProject(p.id)} style={{
                        background: "none", border: "none", cursor: "pointer", color: "#ef4444",
                        fontSize: 16, padding: 4, opacity: 0.5
                      }}
                        onMouseEnter={e => e.target.style.opacity = 1}
                        onMouseLeave={e => e.target.style.opacity = 0.5}
                      >✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={addProject} style={{
            marginTop: 14, padding: "10px 20px", borderRadius: 8, border: "2px dashed #e2e8f0",
            cursor: "pointer", background: "transparent", color: "#94a3b8", fontSize: 13,
            fontWeight: 500, width: "100%"
          }}
            onMouseEnter={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.color = "#3b82f6"; }}
            onMouseLeave={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.color = "#94a3b8"; }}
          >+ Добавить договор</button>
        </div>
      )}

      {/* ======= ПЛАН ПО ДЕНЬГАМ ======= */}
      {view === "cashflow" && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflowX: "auto" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", margin: "0 0 4px" }}>Денежный поток по месяцам</h3>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 16px" }}>На основе договоров: проектирование → в месяц продажи, сумма проекта → в месяц завершения</p>

          {/* KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
            {[
              { icon: "✏️", label: "Проектирование", value: fmtMoney(projectTotals.designTotal) + " ₽", color: "#f59e0b" },
              { icon: "🏠", label: "Проекты", value: fmtMoney(projectTotals.projectTotal) + " ₽", color: "#8b5cf6" },
              { icon: "💰", label: "Итого", value: fmtMoney(projectTotals.total) + " ₽", color: "#10b981" },
            ].map((kpi, i) => (
              <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 14px", borderLeft: `4px solid ${kpi.color}` }}>
                <div style={{ fontSize: 11, color: "#64748b" }}>{kpi.icon} {kpi.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "2px solid #e2e8f0", color: "#64748b", minWidth: 80 }}>Месяц</th>
                <th style={{ padding: "10px 8px", textAlign: "right", borderBottom: "2px solid #e2e8f0", color: "#f59e0b" }}>Проектирование</th>
                <th style={{ padding: "10px 8px", textAlign: "right", borderBottom: "2px solid #e2e8f0", color: "#8b5cf6" }}>Проекты</th>
                <th style={{ padding: "10px 8px", textAlign: "right", borderBottom: "2px solid #e2e8f0", color: "#10b981", fontWeight: 700 }}>Итого</th>
                <th style={{ padding: "10px 8px", textAlign: "right", borderBottom: "2px solid #e2e8f0", color: "#0f172a", fontWeight: 700 }}>Нарастающим</th>
                <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "2px solid #e2e8f0", color: "#94a3b8" }}>Проекты</th>
              </tr>
            </thead>
            <tbody>
              {cashflow.map((m, i) => {
                const hasData = m.total > 0;
                return (
                  <tr key={i} style={{ background: hasData ? "#f0fdf4" : (i % 2 === 0 ? "#fff" : "#fafbfc"), opacity: i < 3 && !hasData ? 0.4 : 1 }}>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, color: hasData ? "#0f172a" : "#94a3b8" }}>
                      {i === 12 && <div style={{ fontSize: 10, color: "#3b82f6", fontWeight: 700 }}>2027</div>}
                      {m.month}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #f1f5f9", color: m.designIncome ? "#f59e0b" : "#e2e8f0", fontWeight: m.designIncome ? 600 : 400 }}>
                      {m.designIncome ? fmtMoney(m.designIncome) : "—"}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #f1f5f9", color: m.projectIncome ? "#8b5cf6" : "#e2e8f0", fontWeight: m.projectIncome ? 600 : 400 }}>
                      {m.projectIncome ? fmtMoney(m.projectIncome) : "—"}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #f1f5f9", color: m.total ? "#10b981" : "#e2e8f0", fontWeight: 700 }}>
                      {m.total ? fmtMoney(m.total) : "—"}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #f1f5f9", fontWeight: 700, color: m.cumTotal ? "#0f172a" : "#e2e8f0" }}>
                      {m.cumTotal ? fmtMoney(m.cumTotal) : "—"}
                    </td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", color: "#94a3b8", fontSize: 11 }}>
                      {[...m.names.design.map(n => "✏️ " + n), ...m.names.project.map(n => "🏠 " + n)].join(", ") || "—"}
                    </td>
                  </tr>
                );
              })}
              <tr style={{ background: "#f0f9ff", fontWeight: 700 }}>
                <td style={{ padding: "12px", borderTop: "2px solid #3b82f6", color: "#0f172a" }}>ИТОГО</td>
                <td style={{ padding: "8px", textAlign: "right", borderTop: "2px solid #3b82f6", color: "#f59e0b" }}>{fmtMoney(projectTotals.designTotal)}</td>
                <td style={{ padding: "8px", textAlign: "right", borderTop: "2px solid #3b82f6", color: "#8b5cf6" }}>{fmtMoney(projectTotals.projectTotal)}</td>
                <td style={{ padding: "8px", textAlign: "right", borderTop: "2px solid #3b82f6", color: "#10b981" }}>{fmtMoney(projectTotals.total)}</td>
                <td style={{ padding: "8px", textAlign: "right", borderTop: "2px solid #3b82f6", color: "#0f172a" }}>{fmtMoney(projectTotals.total)}</td>
                <td style={{ padding: "8px", borderTop: "2px solid #3b82f6" }}></td>
              </tr>
            </tbody>
          </table>

          {/* График */}
          {projectTotals.total > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: "0 0 12px" }}>Поступления по месяцам</h4>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cashflow.filter(m => m.total > 0 || m.designIncome > 0 || m.projectIncome > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1e6 ? (v/1e6).toFixed(0)+"М" : v >= 1000 ? (v/1000).toFixed(0)+"К" : v} />
                  <Tooltip formatter={v => v.toLocaleString("ru-RU") + " ₽"} />
                  <Legend />
                  <Bar dataKey="designIncome" name="Проектирование" fill="#f59e0b" radius={[4,4,0,0]} stackId="a" />
                  <Bar dataKey="projectIncome" name="Проекты" fill="#8b5cf6" radius={[4,4,0,0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
