import { HashRouter, Routes, Route, NavLink } from "react-router-dom";
import {
  Cpu, Image, Video, Type, Usb, Bluetooth,
  FileCode2, Puzzle, Package, Code2, ShieldCheck
} from "lucide-react";
import { useT, useLang } from "./i18n/LanguageContext";
import ProjectScaffold from "./pages/ProjectScaffold";
import PeripheralGen from "./pages/PeripheralGen";
import Image2Code from "./pages/Image2Code";
import Video2Code from "./pages/Video2Code";
import Font2Code from "./pages/Font2Code";
import SerialMonitor from "./pages/SerialMonitor";
import BleMonitor from "./pages/BleMonitor";
import DriverGen from "./pages/DriverGen";
import MiddlewareTemplates from "./pages/MiddlewareTemplates";
import CodeSnippets from "./pages/CodeSnippets";
import CodeChecker from "./pages/CodeChecker";

const navItems = [
  { id: "scaffold", labelKey: "nav.scaffold", icon: Package, category: "codegen" },
  { id: "peripheral", labelKey: "nav.peripheral", icon: Cpu, category: "codegen" },
  { id: "driver", labelKey: "nav.driver", icon: FileCode2, category: "codegen" },
  { id: "middleware", labelKey: "nav.middleware", icon: Puzzle, category: "codegen" },
  { id: "snippets", labelKey: "nav.snippets", icon: Code2, category: "codegen" },
  { id: "image", labelKey: "nav.image", icon: Image, category: "media" },
  { id: "video", labelKey: "nav.video", icon: Video, category: "media" },
  { id: "font", labelKey: "nav.font", icon: Type, category: "media" },
  { id: "serial", labelKey: "nav.serial", icon: Usb, category: "tools" },
  { id: "ble", labelKey: "nav.ble", icon: Bluetooth, category: "tools" },
  { id: "checker", labelKey: "nav.checker", icon: ShieldCheck, category: "tools" },
];

const categories = [
  { key: "codegen", labelKey: "nav.codegen" },
  { key: "media", labelKey: "nav.media" },
  { key: "tools", labelKey: "nav.tools" },
];

export default function App() {
  const t = useT();
  const { lang, toggleLang } = useLang();

  return (
    <HashRouter>
      <div className="flex h-screen overflow-hidden">
        <aside className="w-56 flex-shrink-0 flex flex-col border-r" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
          <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border-color)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu size={22} style={{ color: "var(--accent)" }} />
                <span className="font-semibold text-base">{t("app.title")}</span>
              </div>
              <button
                onClick={toggleLang}
                className="px-2 py-0.5 rounded text-xs font-medium transition-colors hover:opacity-80"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                title={t("lang.switch")}
              >
                {lang === "en" ? "中" : "EN"}
              </button>
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{t("app.subtitle")}</div>
          </div>

          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {categories.map((cat) => (
              <div key={cat.key} className="mb-3">
                <div className="px-2 py-1 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  {t(cat.labelKey)}
                </div>
                {navItems.filter((n) => n.category === cat.key).map((item) => (
                  <NavLink
                    key={item.id}
                    to={"/" + item.id}
                    className={({ isActive }) =>
                      "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors " +
                      (isActive ? "font-medium" : "")
                    }
                    style={({ isActive }) => ({
                      background: isActive ? "var(--bg-tertiary)" : "transparent",
                      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                    })}
                  >
                    <item.icon size={16} />
                    {t(item.labelKey)}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <div className="px-3 py-3 border-t text-xs" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:underline" style={{ color: "var(--text-secondary)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              {t("app.github")}
            </a>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden" style={{ background: "var(--bg-primary)" }}>
          <Routes>
            <Route path="/" element={<ProjectScaffold />} />
            <Route path="/scaffold" element={<ProjectScaffold />} />
            <Route path="/peripheral" element={<PeripheralGen />} />
            <Route path="/driver" element={<DriverGen />} />
            <Route path="/middleware" element={<MiddlewareTemplates />} />
            <Route path="/snippets" element={<CodeSnippets />} />
            <Route path="/image" element={<Image2Code />} />
            <Route path="/video" element={<Video2Code />} />
            <Route path="/font" element={<Font2Code />} />
            <Route path="/serial" element={<SerialMonitor />} />
            <Route path="/ble" element={<BleMonitor />} />
            <Route path="/checker" element={<CodeChecker />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
