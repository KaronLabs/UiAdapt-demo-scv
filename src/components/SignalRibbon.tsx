import type { AdaptiveState } from "../domain/types";

export function SignalRibbon({ state }: { state: AdaptiveState }) {
  const visualState = state === "PURCHASE_INTENT" ? "focus" : state.toLowerCase();
  return (
    <div className={`signal-ribbon signal-ribbon--${visualState}`} aria-hidden="true">
      <svg viewBox="0 0 1200 180" preserveAspectRatio="none">
        <path className="signal-line signal-line--explore" d="M0 92 C80 28 142 155 226 83 S372 36 454 102 S594 151 674 76 S817 34 898 97 S1050 152 1200 64" />
        <path className="signal-line signal-line--compare" d="M0 62 C138 62 166 121 304 121 S470 62 602 62 S767 121 906 121 S1064 62 1200 62" />
        <path className="signal-line signal-line--focus" d="M0 98 C260 98 342 98 486 98 C554 98 576 26 640 26 C704 26 726 98 794 98 C938 98 1020 98 1200 98" />
      </svg>
    </div>
  );
}
