export type RewardCatalogItem = {
  id: string;
  name: string;
  points: number;
  type: "digital" | "physical";
  maxStock: number;
  redeemedCount: number;
  active: boolean;
  description?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export const DEFAULT_REWARDS: Omit<RewardCatalogItem, "createdAt" | "updatedAt">[] = [
  { id: "gemini_pro_3m", name: "Gemini Pro 3 tháng", points: 2500, type: "digital", maxStock: 3, redeemedCount: 0, active: true },
  { id: "gemini_pro_1m", name: "Gemini Pro 1 tháng", points: 2000, type: "digital", maxStock: 10, redeemedCount: 0, active: true },
  { id: "canva_pro_1m", name: "Canva Pro 1 tháng", points: 1500, type: "digital", maxStock: 10, redeemedCount: 0, active: true },
  { id: "digital_random", name: "Bộ quà tặng Digital ngẫu nhiên", points: 1200, type: "digital", maxStock: 100, redeemedCount: 0, active: true },
  { id: "phys_combo", name: "Bộ quà tặng: bút, móc khóa Google", points: 650, type: "physical", maxStock: 100, redeemedCount: 0, active: true },
  { id: "phys_keychain", name: "Móc khóa Google", points: 350, type: "physical", maxStock: 100, redeemedCount: 0, active: true },
  { id: "phys_pen", name: "Bút bi Google", points: 350, type: "physical", maxStock: 100, redeemedCount: 0, active: true },
];

export function serializeReward(id: string, data: FirebaseFirestore.DocumentData): RewardCatalogItem {
  return {
    id,
    name: String(data.name || ""),
    points: Number(data.points || 0),
    type: data.type === "physical" ? "physical" : "digital",
    maxStock: Math.max(0, Number(data.maxStock ?? 0)),
    redeemedCount: Math.max(0, Number(data.redeemedCount ?? 0)),
    active: data.active !== false,
    description: data.description ? String(data.description) : undefined,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
  };
}