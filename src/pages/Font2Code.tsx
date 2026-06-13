import { useState, useRef, useCallback } from "react";
import { Upload, Trash2 } from "lucide-react";
import CodePreview from "../components/CodePreview";
import { useT } from "../i18n/LanguageContext";

export default function Font2Code() {
  const t = useT();
  const [font, setFont] = useState<ArrayBuffer | null>(null);
  const [fontName, setFontName] = useState("");
  const [size, setSize] = useState(16);
  const [charset, setCharset] = useState("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=[]{}|;:',.<>?/ ");
  const [code, setCode] = useState("");
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setFontName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setFont(e.target?.result as ArrayBuffer);
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleGenerate = async () => {
    if (!font) return;
    setGenerating(true);

    try {
      const opentype = await import("opentype.js");
      opentype.parse(font);
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = size * 2;
      canvas.height = size * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const chars = [...new Set(charset.split(""))].join("");
      let result = "// Font: " + fontName + ", Size: " + size + "px\n";
      result += "// Characters: " + chars.length + "\n\n";

      const charWidths: number[] = [];
      const charData: string[] = [];

      for (const ch of chars) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff";
        ctx.font = size + "px sans-serif";
        ctx.textBaseline = "top";
        ctx.fillText(ch, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            if (pixels[idx] > 128) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        const charW = Math.max(maxX - minX + 1, 1);
        const charH = Math.max(maxY - minY + 1, 1);
        charWidths.push(charW);

        const bytesPerRow = Math.ceil(charW / 8);
        let charStr = "  // '" + ch + "' (" + charW + "x" + charH + ")\n  {";
        for (let y = minY; y <= maxY; y++) {
          for (let b = 0; b < bytesPerRow; b++) {
            let byte = 0;
            for (let bit = 0; bit < 8; bit++) {
              const x = minX + b * 8 + bit;
              if (x <= maxX) {
                const idx = (y * canvas.width + x) * 4;
                if (pixels[idx] > 128) byte = (byte << 1) | 1;
                else byte = byte << 1;
              } else {
                byte = byte << 1;
              }
            }
            charStr += "0x" + byte.toString(16).padStart(2, "0") + ", ";
          }
        }
        charStr += "}";
        charData.push(charStr);
      }

      result += "const uint8_t font_widths[" + chars.length + "] = {\n  " + charWidths.join(", ") + "\n};\n\n";
      result += "const uint8_t font_data[" + chars.length + "][" + Math.ceil(size / 8) * size + "] = {\n" + charData.join(",\n") + "\n};";

      setCode(result);
    } catch (err) {
      setCode("// Error parsing font: " + (err as Error).message);
    }
    setGenerating(false);
  };

  return (
    <div className="flex h-full">
      <div className="w-80 flex-shrink-0 border-r overflow-y-auto p-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
        <h2 className="text-lg font-semibold mb-4">{t("font.title")}</h2>

        <div
          onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer mb-4 transition-colors hover:opacity-80"
          style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
        >
          <Upload size={24} className="mx-auto mb-2" />
          <p className="text-xs">{t("font.drop")}</p>
          {fontName && <p className="text-xs mt-1" style={{ color: "var(--accent)" }}>{fontName}</p>}
          <input ref={fileRef} type="file" accept=".ttf,.otf" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>

        {font && (
          <button onClick={() => { setFont(null); setFontName(""); setCode(""); }}
            className="w-full flex items-center justify-center gap-1 py-1.5 rounded text-xs mb-4"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
            <Trash2 size={12} /> {t("font.clear")}
          </button>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("font.size")}</label>
            <input type="number" value={size} onChange={(e) => setSize(Number(e.target.value))}
              className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("font.charset")}</label>
            <textarea value={charset} onChange={(e) => setCharset(e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded border text-sm resize-none" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
          </div>

          <button onClick={handleGenerate} disabled={!font || generating}
            className="w-full py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff" }}>
            {generating ? t("font.generating") : t("font.generate")}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <canvas ref={canvasRef} className="hidden" />
        {code ? (
          <CodePreview code={code} filename="font_data.h" />
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ color: "var(--text-secondary)" }}>
            {t("font.placeholder")}
          </div>
        )}
      </div>
    </div>
  );
}
