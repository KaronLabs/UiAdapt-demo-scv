import type { PointerEvent } from "react";
import type { Product, BehaviorEventType } from "../domain/types";
import { ProductArt } from "./ProductArt";

interface ProductCardProps {
  product: Product;
  focused: boolean;
  compared: boolean;
  muted: boolean;
  onEvent: (type: BehaviorEventType, productId: Product["id"]) => void;
}

const currency = new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 });

const POINTER_VARS = ["--mx", "--my", "--px", "--py"] as const;

function writePointerVars(event: PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  const style = event.currentTarget.style;
  style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
  style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
  style.setProperty("--px", ((x - 0.5) * 2).toFixed(3));
  style.setProperty("--py", ((y - 0.5) * 2).toFixed(3));
}

function clearPointerVars(event: PointerEvent<HTMLElement>) {
  for (const name of POINTER_VARS) event.currentTarget.style.removeProperty(name);
}

export function ProductCard({ product, focused, compared, muted, onEvent }: ProductCardProps) {
  return (
    <article
      className={`product-card${focused ? " product-card--focused" : ""}${muted ? " product-card--muted" : ""}`}
      data-product-id={product.id}
      data-focused={focused}
      data-product-contract={JSON.stringify(product)}
      onPointerMove={writePointerVars}
      onPointerLeave={clearPointerVars}
    >
      <div className="product-card__visual">
        <span className="product-card__edition">Atelier wireless</span>
        <ProductArt productId={product.id} />
      </div>
      <div className="product-card__body">
        <div className="product-card__heading">
          <div>
            <h2>{product.name}</h2>
            <p>{product.tagline}</p>
          </div>
          <p className="product-card__price">
            <button type="button" className="text-action" onClick={() => onEvent("CHECK_PRICE", product.id)} aria-label={`${product.name} 가격 확인`}>
              {currency.format(product.price)}
            </button>
          </p>
        </div>
        <dl className="product-card__specs">
          <div><dt>배터리</dt><dd>{product.batteryHours}시간</dd></div>
          <div><dt>노이즈 제어</dt><dd>{product.anc}</dd></div>
          <div><dt>무게</dt><dd>{product.weightGrams}g</dd></div>
        </dl>
        <div className="product-card__proof">
          <button type="button" className="text-action" onClick={() => onEvent("CHECK_REVIEWS", product.id)} aria-label={`${product.name} 리뷰 확인`}>
            ★ {product.rating} · 리뷰 {product.reviews}
          </button>
          <button type="button" className="text-action" onClick={() => onEvent("CHECK_SHIPPING", product.id)} aria-label={`${product.name} 배송 확인`}>
            {product.shipping}
          </button>
          <span>재고 {product.inventory}</span>
        </div>
        <p className="product-card__detail">{product.detail}</p>
        <div className="color-row" aria-label={`${product.name} 색상 선택`}>
          {product.colors.map((color) => (
            <button key={color} type="button" className="color-chip" onClick={() => onEvent("SELECT_COLOR", product.id)} aria-label={`${product.name} ${color} 색상 선택`}>
              <span className={`swatch swatch--${color.toLowerCase()}`} />{color}
            </button>
          ))}
        </div>
        <div className="product-card__actions">
          <button type="button" className="button button--quiet" onClick={() => onEvent("OPEN_DETAILS", product.id)}>상세 보기</button>
          <button type="button" className={`button button--quiet${compared ? " is-active" : ""}`} onClick={() => onEvent(compared ? "REMOVE_COMPARE" : "ADD_COMPARE", product.id)} aria-pressed={compared}>
            {compared ? "비교에서 제거" : "비교에 추가"}
          </button>
          <button type="button" className="button button--primary" onClick={() => onEvent("ADD_TO_CART", product.id)}>장바구니 담기</button>
        </div>
      </div>
    </article>
  );
}
