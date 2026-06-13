import { useState, useRef, useCallback } from "react";
import { Upload, Trash2 } from "lucide-react";
import CodePreview from "../components/CodePreview";
import { useT } from "../i18n/LanguageContext";

type ColorFormat = "MONO" | "GRAY" | "RGB565" | "RGB888";

export default function Image2Code() {
  const t = useT();
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [format, setFormat] = useState<ColorFormat>("RGB565");
  const [width, setWidth] = useState(128);
  const [height, setHeight] = useState(64);
  const [threshold, setThreshold] = useState(128);
  const [invert, setInvert] = useState(false);
  const [code, setCode] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setPreviewUrl(img.src);
        setWidth(img.width);
        setHeight(img.height);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }, [handleFile]);

  const handleGenerate = () => {
    if (!image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(image, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    let result = "";
    if (format === "MONO") {
      result = "const uint8_t bitmap[" + (width * height / 8) + "] = {\n  ";
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x += 8) {
          let byte = 0;
          for (let b = 0; b < 8; b++) {
            const idx = (y * width + (x + b)) * 4;
            const gray = (pixels[idx] * 0.299 + pixels[idx + 1] * 0.587 + pixels[idx + 2] * 0.114);
            let bit = gray < threshold ? 0 : 1;
            if (invert) bit = 1 - bit;
            byte = (byte << 1) | bit;
          }
          result += "0x" + byte.toString(16).padStart(2, "0") + ", ";
        }
        result += "\n  ";
      }
      result += "\n};";
    } else if (format === "GRAY") {
      result = "const uint8_t bitmap[" + (width * height) + "] = {\n  ";
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          let gray = Math.round(pixels[idx] * 0.299 + pixels[idx + 1] * 0.587 + pixels[idx + 2] * 0.114);
          if (invert) gray = 255 - gray;
          result += "0x" + gray.toString(16).padStart(2, "0") + ", ";
        }
        result += "\n  ";
      }
      result += "\n};";
    } else if (format === "RGB565") {
      result = "const uint16_t bitmap[" + (width * height) + "] = {\n  ";
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          let r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
          if (invert) { r = 255 - r; g = 255 - g; b = 255 - b; }
          const rgb565 = ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3);
          result += "0x" + rgb565.toString(16).padStart(4, "0") + ", ";
        }
        result += "\n  ";
      }
      result += "\n};";
    } else if (format === "RGB888") {
      result = "const uint8_t bitmap[" + (width * height * 3) + "] = {\n  ";
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          let r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
          if (invert) { r = 255 - r; g = 255 - g; b = 255 - b; }
          result += "0x" + r.toString(16).padStart(2, "0") + ", 0x" + g.toString(16).padStart(2, "0") + ", 0x" + b.toString(16).padStart(2, "0") + ", ";
        }
        result += "\n  ";
      }
      result += "\n};";
    }
    setCode(result);
  };

  return (
    <div className="flex h-full">
      <div className="w-80 flex-shrink-0 border-r overflow-y-auto p-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
        <h2 className="text-lg font-semibold mb-4">{t("image.title")}</h2>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer mb-4 transition-colors hover:opacity-80"
          style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="max-w-full max-h-32 mx-auto rounded" />
          ) : (
            <>
              <Upload size={24} className="mx-auto mb-2" />
              <p className="text-xs">{t("image.drop")}</p>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>

        {image && (
          <button onClick={() => { setImage(null); setPreviewUrl(""); setCode(""); }}
            className="w-full flex items-center justify-center gap-1 py-1.5 rounded text-xs mb-4"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
            <Trash2 size={12} /> {t("image.clear")}
          </button>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("image.format")}</label>
            <select value={format} onChange={(e) => setFormat(e.target.value as ColorFormat)}
              className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
              <option value="MONO">{t("image.format.mono")}</option>
              <option value="GRAY">{t("image.format.gray")}</option>
              <option value="RGB565">{t("image.format.rgb565")}</option>
              <option value="RGB888">{t("image.format.rgb888")}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("image.width")}</label>
              <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("image.height")}</label>
              <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full px-3 py-2 rounded border text-sm" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
            </div>
          </div>

          {format === "MONO" && (
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{t("image.threshold")}: {threshold}</label>
              <input type="range" min={0} max={255} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full" />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} />
            {t("image.invert")}
          </label>

          <button onClick={handleGenerate} disabled={!image}
            className="w-full py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff" }}>
            {t("image.generate")}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <canvas ref={canvasRef} className="hidden" />
        {code ? (
          <CodePreview code={code} filename="bitmap.h" />
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ color: "var(--text-secondary)" }}>
            {t("image.placeholder")}
          </div>
        )}
      </div>
    </div>
  );
}
