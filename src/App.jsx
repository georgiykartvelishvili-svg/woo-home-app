import { useState, useEffect, useCallback, useRef } from "react";
import { loginWithGoogle, logout, onAuthChange, saveCalculatorData, loadCalculatorData, subscribeToData } from "./firebase.js";
import WooHomeProjects from "./WooHomeProjects.jsx";

const ALLOW_ALL = true;
const ALLOWED_EMAILS = ["dishagazatov@gmail.com"];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appData, setAppData] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const saveTimer = useRef(null);

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

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Верхняя панель */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 16px", background: "#fff", borderBottom: "1px solid #e2e8f0",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🏠</span>
          <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>WOO Home</span>
          {saveStatus && <span style={{ fontSize: 12, color: "#10b981", marginLeft: 8 }}>{saveStatus}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>{user.email}</span>
          <button onClick={logout} style={{
            padding: "6px 14px", borderRadius: 6, border: "1px solid #e2e8f0",
            cursor: "pointer", background: "#fff", fontSize: 12, color: "#64748b"
          }}>Выйти</button>
        </div>
      </div>

      {/* Основной контент */}
      <WooHomeProjects savedData={appData} onDataChange={handleDataChange} />
    </div>
  );
}
