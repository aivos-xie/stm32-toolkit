import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { analyzeCode, getRuleDescription } from "../src/lib/codecheck.js";
import type { FileEntry } from "../src/lib/codecheck.js";

function getStagedFiles(): string[] {
  try {
    const output = execSync("git diff --cached --name-only --diff-filter=ACM", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return output
      .split("\n")
      .map((l) => l.trim())
      .filter((f) => f.endsWith(".c") || f.endsWith(".h"));
  } catch {
    return [];
  }
}

function main() {
  const stagedFiles = getStagedFiles();
  if (stagedFiles.length === 0) {
    process.exit(0);
  }

  const files: FileEntry[] = stagedFiles.map((name) => ({
    name,
    content: readFileSync(name, "utf-8"),
  }));

  const issues = analyzeCode(files);

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");

  console.log("");
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║         HAL Code Checker - Pre-commit        ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log("");
  console.log(`  Files checked: ${files.length}`);
  console.log(`  Errors: ${errors.length}  Warnings: ${warnings.length}  Info: ${infos.length}`);
  console.log("");

  if (issues.length === 0) {
    console.log("  ✅ All clean — no issues found.");
    console.log("");
    process.exit(0);
  }

  for (const issue of issues) {
    const icon =
      issue.severity === "error" ? "❌" :
      issue.severity === "warning" ? "⚠️ " : "ℹ️ ";
    const tag = issue.severity.toUpperCase().padEnd(7);
    console.log(`  ${icon} ${tag} ${issue.file}:${issue.line}`);
    console.log(`         [${getRuleDescription(issue.rule)}]`);
    console.log(`         ${issue.message}`);
    console.log("");
  }

  if (errors.length > 0) {
    console.log("  ❌ Commit blocked: fix errors above first.");
    console.log("     To skip: git commit --no-verify");
    console.log("");
    process.exit(1);
  }

  console.log("  ⚠️  Warnings/info only — commit allowed.");
  console.log("");
  process.exit(0);
}

main();
