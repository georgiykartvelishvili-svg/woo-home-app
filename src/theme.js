export const THEME_STORAGE_KEY = "woo-home-theme";

export const THEMES = {
  light: {
    pageBg: "#f8fafc",
    cardBg: "#ffffff",
    mutedBg: "#f8fafc",
    rowEven: "#ffffff",
    rowOdd: "#fafbfc",
    text: "#0f172a",
    textSecondary: "#64748b",
    textMuted: "#94a3b8",
    textBody: "#334155",
    border: "#e2e8f0",
    rowLine: "#f1f5f9",
    shadow: "0 1px 3px rgba(0,0,0,0.06)",
    primary: "#3b82f6",
    onPrimary: "#ffffff",
    accentSoft: "#f0f9ff",
    expandedHeader: "#f0f9ff",
    closedRow: "#f0fdf4",
    closedText: "#16a34a",
    btnClosedBg: "#dcfce7",
    btnOpenBg: "#f1f5f9",
    empty: "#cbd5e1",
    planMuted: "#b0b8c4",
    factGreen: "#059669",
    good: "#16a34a",
    bad: "#ef4444",
    inputBg: "#ffffff",
    cashflowHighlight: "#f0fdf4",
    chartGrid: "#f1f5f9",
  },
  dark: {
    pageBg: "#0f172a",
    cardBg: "#1e293b",
    mutedBg: "#334155",
    rowEven: "#1e293b",
    rowOdd: "#172033",
    text: "#f1f5f9",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    textBody: "#cbd5e1",
    border: "#475569",
    rowLine: "#334155",
    shadow: "0 1px 3px rgba(0,0,0,0.35)",
    primary: "#3b82f6",
    onPrimary: "#ffffff",
    accentSoft: "#1e3a5f",
    expandedHeader: "#1e3a5f",
    closedRow: "#14532d33",
    closedText: "#4ade80",
    btnClosedBg: "#14532d",
    btnOpenBg: "#334155",
    empty: "#64748b",
    planMuted: "#64748b",
    factGreen: "#34d399",
    good: "#4ade80",
    bad: "#f87171",
    inputBg: "#0f172a",
    cashflowHighlight: "#14532d40",
    chartGrid: "#334155",
  },
};

export function readStoredTheme() {
  try {
    const s = localStorage.getItem(THEME_STORAGE_KEY);
    return s === "dark" || s === "light" ? s : "light";
  } catch {
    return "light";
  }
}
