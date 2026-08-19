import type { ProductId } from "../domain/types";

const toneByProduct: Record<ProductId, { shell: string; metal: string; glow: string }> = {
  "aurora-one": { shell: "#202a30", metal: "#c7aa7a", glow: "#8bb9d6" },
  "nova-pro": { shell: "#354149", metal: "#b8c3c8", glow: "#a9c5d5" },
  "halo-air": { shell: "#e5dfd1", metal: "#9c745f", glow: "#e4a78d" },
};

export function ProductArt({ productId }: { productId: ProductId }) {
  const tone = toneByProduct[productId];
  const compact = productId === "halo-air";
  const angular = productId === "nova-pro";

  return (
    <svg className="product-art" viewBox="0 0 320 300" aria-hidden="true">
      <defs>
        <radialGradient id={`${productId}-halo`} cx="50%" cy="48%" r="52%">
          <stop offset="0%" stopColor={tone.glow} stopOpacity=".42" />
          <stop offset="100%" stopColor={tone.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${productId}-shell`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={tone.shell} />
          <stop offset="72%" stopColor="#11191d" />
          <stop offset="100%" stopColor={tone.metal} />
        </linearGradient>
      </defs>
      <ellipse cx="160" cy="152" rx="143" ry="136" fill={`url(#${productId}-halo)`} />
      <path
        d={compact ? "M91 150 C87 53 231 53 228 151" : angular ? "M78 154 C72 42 247 42 242 154" : "M82 154 C75 38 245 38 238 154"}
        fill="none"
        stroke={`url(#${productId}-shell)`}
        strokeWidth={compact ? 19 : 25}
        strokeLinecap="round"
      />
      <path d="M92 145 C102 128 111 123 126 122" fill="none" stroke={tone.metal} strokeWidth="8" strokeLinecap="round" />
      <path d="M228 145 C218 128 209 123 194 122" fill="none" stroke={tone.metal} strokeWidth="8" strokeLinecap="round" />
      <g transform={angular ? "rotate(-4 96 192)" : ""}>
        <rect x="55" y="137" width={compact ? 72 : 84} height={compact ? 112 : 126} rx={angular ? 24 : 38} fill={`url(#${productId}-shell)`} />
        <rect x="68" y="151" width={compact ? 47 : 58} height={compact ? 84 : 96} rx="26" fill="#0f171b" opacity=".9" />
        <path d="M76 169 C90 158 103 158 118 169" fill="none" stroke={tone.glow} strokeWidth="3" opacity=".75" />
      </g>
      <g transform={angular ? "rotate(4 224 192)" : ""}>
        <rect x={compact ? 193 : 181} y="137" width={compact ? 72 : 84} height={compact ? 112 : 126} rx={angular ? 24 : 38} fill={`url(#${productId}-shell)`} />
        <rect x={compact ? 206 : 194} y="151" width={compact ? 47 : 58} height={compact ? 84 : 96} rx="26" fill="#0f171b" opacity=".9" />
        <path d="M202 169 C216 158 229 158 244 169" fill="none" stroke={tone.glow} strokeWidth="3" opacity=".75" />
      </g>
      <ellipse cx="160" cy="274" rx="94" ry="10" fill="#172126" opacity=".13" />
    </svg>
  );
}
