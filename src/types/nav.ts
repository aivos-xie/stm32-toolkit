import type { LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  category: "codegen" | "media" | "tools";
}
