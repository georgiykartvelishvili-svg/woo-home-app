import { useState, useEffect, useCallback, useRef } from "react";
import { loginWithGoogle, logout, onAuthChange, saveCalculatorData, loadCalculatorData, subscribeToData } from "./firebase.js";
import WooHomeProjects from "./WooHomeProjects.jsx";
import { THEMES, readStoredTheme, THEME_STORAGE_KEY } from "./theme.js";

const ALLOW_ALL = true;
const ALLOWED_EMAILS = ["dishagazatov@gmail.com"];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appData, setAppData] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [themeMode, setThemeMode] = useState(readStoredTheme);
  const saveTimer = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch { /* ignore */ }
  }, [themeMode]);

  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Load data on login
  useEffect(() => {
    if (!user) return;
    let unsubscribe;
    (async () => {
      const saved = await loadCalculatorData();
      if (saved) setAppData(saved);
      unsubscribe = subscribeToData((data) => {
        setAppData(data);
      });
    })();
    return () => unsubscribe && unsubscribe();
  }, [user]);

  // Auto-save with debounce
  const handleDataChange = useCallback((newData) => {
    setAppData(newData);
    setSaveStatus("Сохраняю...");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await saveCalculatorData(newData);
      setSaveStatus("Сохранено ✓");
      setTimeout(() => setSaveStatus(""), 2000);
    }, 2000);
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏠</div>
          <div style={{ color: "#64748b" }}>Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", height: "100vh",
        fontFamily: "'Inter', sans-serif", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}>
        <div style={{
          background: "#fff", borderRadius: 20, padding: "48px 40px", textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)", maxWidth: 400
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏠</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>WOO Home</h1>
          <p style={{ color: "#64748b", marginBottom: 24, fontSize: 14 }}>Умный дом · Челябинск</p>
          <button onClick={loginWithGoogle} style={{
            padding: "14px 32px", borderRadius: 12, border: "none", cursor: "pointer",
            background: "#3b82f6", color: "#fff", fontSize: 16, fontWeight: 600,
            boxShadow: "0 4px 12px rgba(59,130,246,0.4)", transition: "transform 0.2s"
          }}
            onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
            onMouseLeave={e => e.target.style.transform = "scale(1)"}
          >
            Войти через Google
          </button>
        </div>
      </div>
    );
  }

  const isAllowed = ALLOW_ALL || ALLOWED_EMAILS.includes(user.email);
  if (!isAllowed) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
          <h2 style={{ color: "#0f172a", marginBottom: 8 }}>Доступ закрыт</h2>
          <p style={{ color: "#64748b", marginBottom: 16 }}>{user.email} не в списке</p>
          <button onClick={logout} style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid #e2e8f0", cursor: "pointer", background: "#fff" }}>Выйти</button>
        </div>
      </div>
    );
  }

  const shell = THEMES[themeMode];

  return (
    <div style={{
      minHeight: "100vh", background: shell.pageBg, colorScheme: themeMode,
      fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column",
    }}>
      {/* Верхняя панель */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 16px", background: shell.cardBg, borderBottom: `1px solid ${shell.border}`,
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🏠</span>
          <span style={{ fontWeight: 700, color: shell.text, fontSize: 15 }}>WOO Home</span>
          {saveStatus && <span style={{ fontSize: 12, color: "#22c55e", marginLeft: 8 }}>{saveStatus}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: shell.textSecondary }}>{user.email}</span>
          <button
            type="button"
            onClick={() => setThemeMode(themeMode === "light" ? "dark" : "light")}
            title={themeMode === "light" ? "Тёмная тема" : "Светлая тема"}
            aria-label={themeMode === "light" ? "Включить тёмную тему" : "Включить светлую тему"}
            style={{
              width: 36, height: 32, padding: 0, borderRadius: 8,
              border: `1px solid ${shell.border}`, background: shell.pageBg,
              cursor: "pointer", fontSize: 17, lineHeight: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {themeMode === "light" ? "🌙" : "☀️"}
          </button>
          <button onClick={logout} style={{
            padding: "6px 14px", borderRadius: 6, border: `1px solid ${shell.border}`,
            cursor: "pointer", background: shell.cardBg, fontSize: 12, color: shell.textSecondary,
          }}>Выйти</button>
        </div>
      </div>

      {/* Основной контент */}
      <WooHomeProjects savedData={appData} onDataChange={handleDataChange} themeMode={themeMode} />
    </div>
  );
}
