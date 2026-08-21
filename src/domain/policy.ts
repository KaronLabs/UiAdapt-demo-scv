import type { AdaptiveState, PresentationPolicy, ProductId } from "./types";

export function derivePolicy(
  detectedState: AdaptiveState,
  adaptiveEnabled: boolean,
  focusedProductId: ProductId | null,
): PresentationPolicy {
  const appliedState = adaptiveEnabled ? detectedState : "EXPLORE";
  return {
    appliedState,
    showComparison: appliedState === "COMPARE",
    focusedProductId: appliedState === "PURCHASE_INTENT" ? focusedProductId : null,
  };
}
