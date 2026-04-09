// Startup cleanup — only clear legacy keys, NOT active Supabase session tokens
(function clearStaleAuth() {
  try {
    // Only clear legacy custom keys, never sb-* (Supabase session tokens)
    ['sms-auth'].forEach(k => {
      try { localStorage.removeItem(k); } catch {}
      try { sessionStorage.removeItem(k); } catch {}
    });
  } catch (e) {
    console.error('[STARTUP] Storage cleanup error:', e);
  }
})();

// Then render React normally
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
