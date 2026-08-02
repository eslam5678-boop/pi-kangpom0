export type VisualAnimationPreset = "royal" | "factory" | "button" | "card" | "market";

export interface VisualAnimationConfig {
  preset?: VisualAnimationPreset;
  intensity?: "subtle" | "strong";
  extraClassName?: string;
}

const presetClassMap: Record<VisualAnimationPreset, string> = {
  royal: "animate-golden-glow",
  factory: "pharaonic-factory-shell animate-factory-smoke",
  button: "animate-button-pulse",
  card: "animate-card-breathe",
  market: "animate-card-breathe",
};

export function getVisualAnimationClass(config: VisualAnimationConfig = {}) {
  const { preset = "card", intensity = "subtle", extraClassName } = config;
  const intensityClass = intensity === "strong" ? "motion-safe:scale-[1.01]" : "";
  return [presetClassMap[preset], intensityClass, extraClassName].filter(Boolean).join(" ");
}

export function getVisualAnimationStyle(config: VisualAnimationConfig = {}) {
  const { preset = "card", intensity = "subtle" } = config;

  if (preset === "factory") {
    return {
      animationDuration: intensity === "strong" ? "3.2s" : "4.2s",
      opacity: intensity === "strong" ? 0.96 : 0.88,
    };
  }

  if (preset === "royal") {
    return {
      animationDuration: intensity === "strong" ? "2.4s" : "3.2s",
      boxShadow: "0 0 18px rgba(255, 199, 76, 0.24)",
    };
  }

  return {
    animationDuration: intensity === "strong" ? "2.6s" : "3.4s",
    opacity: intensity === "strong" ? 0.95 : 0.9,
  };
}
