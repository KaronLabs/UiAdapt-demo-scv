import { useEffect, useMemo, useRef } from "react";
import VanillaTilt from "vanilla-tilt";
import { PRODUCTS } from "./domain/catalog";
import { derivePolicy } from "./domain/runtime";
import type { AdaptiveState, ProductId } from "./domain/types";
import { ProductCard } from "./components/ProductCard";
import { SignalRibbon } from "./components/SignalRibbon";
import { useAdaptiveRuntime } from "./hooks/useAdaptiveRuntime";

const stateCopy: Record<AdaptiveState, { label: string; title: string; description: string }> = {
  EXPLORE: {
    label: "탐색이 분산되어 있습니다",
    title: "가능성을 넓게 보여드립니다.",
    description: "여러 제품을 살펴볼 수 있도록 특징과 선택지를 같은 비중으로 배치합니다.",
  },
  COMPARE: {
    label: "반복 비교 행동이 감지되었습니다",
    title: "차이점을 나란히 보여드립니다.",
    description: "가격, 배송, 배터리와 노이즈 제어처럼 판단에 필요한 차이를 먼저 정렬합니다.",
  },
  PURCHASE_INTENT: {
    label: "결정에 가까운 행동이 누적되었습니다",
    title: "선택에 필요한 정보를 가까이 모았습니다.",
    description: "반복해서 확인한 결정 정보와 구매 의도 동작을 한 흐름으로 강화합니다.",
  },
};

const stateOrder: AdaptiveState[] = ["EXPLORE", "COMPARE", "PURCHASE_INTENT"];
const stateMission: Record<AdaptiveState, string> = {
  EXPLORE: "발견",
  COMPARE: "비교",
  PURCHASE_INTENT: "결정지원",
};

function App() {
  const {
    state,
    startReplay,
    pauseReplay,
    resumeReplay,
    stopReplay,
    reset,
    recordUserEvent,
    setAdaptiveEnabled,
  } = useAdaptiveRuntime();
  const detectedCopy = stateCopy[state.detectedState];
  const presentationCopy = stateCopy[state.appliedState];

  const cartCount = state.events.filter((event) => event.type === "ADD_TO_CART").length;
  const comparisonIds = useMemo(() => {
    if (state.compareTray.length >= 2) return state.compareTray.slice(0, 2);
    const active = PRODUCTS
      .filter((product) => state.features.interactionsByProduct[product.id] > 0)
      .sort(
        (a, b) =>
          state.features.interactionsByProduct[b.id] - state.features.interactionsByProduct[a.id],
      )
      .map((product) => product.id);
    return [...new Set([...active, "aurora-one", "nova-pro"])] as ProductId[];
  }, [state.compareTray, state.features.interactionsByProduct]);

  const comparisonProducts = comparisonIds
    .slice(0, 2)
    .map((id) => PRODUCTS.find((product) => product.id === id)!)
    .filter(Boolean);
  const policy = derivePolicy(state.detectedState, state.adaptiveEnabled, state.focusedProductId);
  const showComparison = policy.showComparison;
  const focusedId = policy.focusedProductId;
  const focusedProduct = focusedId ? PRODUCTS.find((product) => product.id === focusedId) : null;
  const replayIsActive = state.replayStatus === "RUNNING" || state.replayStatus === "PAUSED";
  const demoStageRef = useRef<HTMLElement>(null);
  const hasScrolledToStageRef = useRef(false);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = consoleRef.current;
    if (!node || typeof window.matchMedia !== "function") return;
    const prefers = (query: string) => window.matchMedia(query).matches;
    if (prefers("(prefers-reduced-motion: reduce)") || prefers("(pointer: coarse)")) return;
    VanillaTilt.init(node, { max: 4, speed: 900, perspective: 1200, glare: true, "max-glare": 0.12 });
    return () => {
      (node as HTMLDivElement & { vanillaTilt?: { destroy: () => void } }).vanillaTilt?.destroy();
      node.querySelectorAll(".js-tilt-glare").forEach((glare) => glare.remove());
    };
  }, []);

  useEffect(() => {
    if (state.replayStatus === "IDLE") {
      hasScrolledToStageRef.current = false;
      return;
    }
    if (state.replayStatus !== "RUNNING" || hasScrolledToStageRef.current) return;
    hasScrolledToStageRef.current = true;
    const stage = demoStageRef.current;
    if (!stage || typeof stage.scrollIntoView !== "function") return;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    stage.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }, [state.replayStatus]);

  return (
    <div className={`app app--${state.appliedState.toLowerCase()}`} data-replay={state.replayStatus}>
      <header className="site-header">
        <a className="brand" href="#main-content" aria-label="UIAdapt 홈">
          <span className="brand__mark" aria-hidden="true"><i /><i /><i /></span>
          <span className="brand__lockup"><strong>UIAdapt</strong><small>Adaptive UI Infrastructure · R11</small></span>
        </a>
        <p className="header-story">Behavior-aware presentation layer</p>
        <div className="header-tools">
          <label className="adaptive-toggle">
            <span>Adaptive UI</span>
            <input
              type="checkbox"
              checked={state.adaptiveEnabled}
              onChange={(event) => setAdaptiveEnabled(event.target.checked)}
            />
            <span className="toggle-track" aria-hidden="true"><span /></span>
            <strong>{state.adaptiveEnabled ? "ON" : "OFF"}</strong>
          </label>
        </div>
      </header>

      <main id="main-content">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__copy">
            <p className="eyebrow">특허 출원 기반 적응형 UI 인프라</p>
            <h1 id="hero-title" aria-label="같은 상품을, 더 나은 판단으로.">같은 상품을,<br /><span>더 나은 판단으로.</span></h1>
            <p className="hero__lead">
              추천은 WHAT을 결정합니다. UIAdapt는 HOW를 조율합니다.
            </p>
            <div className="product-invariants" data-testid="product-invariants" aria-label="데모 불변식">
              <span>Same catalog</span><i aria-hidden="true" />
              <span>Same behavior</span><i aria-hidden="true" />
              <strong>Different presentation</strong>
            </div>
          </div>
          <div className="hero__console" aria-label="UIAdapt 데모 제어" ref={consoleRef}>
            <div className="causal-system">
              <SignalRibbon state={state.appliedState} />
              <div className="causal-trace" data-testid="causal-trace" aria-label="Behavior → State → Policy → Interface">
                <div><span>01</span><strong>Behavior</strong><small>관찰 행동</small></div>
                <b aria-hidden="true">→</b>
                <div><span>02</span><strong>State</strong><small>{state.detectedState}</small></div>
                <b aria-hidden="true">→</b>
                <div><span>03</span><strong>Policy</strong><small>{state.adaptiveEnabled ? "Applied" : "Suppressed"}</small></div>
                <b aria-hidden="true">→</b>
                <div><span>04</span><strong>Interface</strong><small>{state.appliedState}</small></div>
              </div>
            </div>
            <div className="replay-controls">
              <button type="button" className="button button--watch" onClick={startReplay} data-testid="live-demo-cta">
                <span aria-hidden="true">▶</span> 27초 라이브 데모
              </button>
              {state.replayStatus === "RUNNING" ? (
                <button type="button" className="icon-button" onClick={pauseReplay}>Pause</button>
              ) : state.replayStatus === "PAUSED" ? (
                <button type="button" className="icon-button" onClick={resumeReplay}>Resume</button>
              ) : null}
              <button type="button" className="icon-button" onClick={stopReplay} disabled={!replayIsActive}>Stop</button>
              <button type="button" className="icon-button" onClick={reset}>Reset</button>
            </div>
            <p className="replay-status" data-testid="replay-status">
              {state.replayStatus === "IDLE" && "직접 둘러보거나 27초 데모를 재생해 보세요."}
              {state.replayStatus === "RUNNING" && "동일한 행동 시퀀스를 재생하고 있습니다."}
              {state.replayStatus === "PAUSED" && "데모가 일시 정지되었습니다."}
              {state.replayStatus === "STOPPED" && "현재 상태에서 데모를 멈췄습니다."}
              {state.replayStatus === "STOPPED_MANUAL_TAKEOVER" && "직접 탐색을 시작해 데모 재생을 멈췄습니다."}
              {state.replayStatus === "COMPLETED" && "데모가 끝났습니다. 같은 상품, 달라진 표현을 확인해 보세요."}
            </p>
          </div>
        </section>

        <section className="state-stage" aria-label="현재 적응 상태">
          <div className="state-path" data-testid="state-path">
            {stateOrder.map((item, index) => (
              <div key={item} data-current={state.detectedState === item} className={`state-step${state.detectedState === item ? " is-current" : ""}${stateOrder.indexOf(state.detectedState) > index ? " is-past" : ""}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{item}</strong><em>{stateMission[item]}</em></div>
              </div>
            ))}
          </div>
          <div className="state-message">
            <span className="state-message__dot" aria-hidden="true" />
            <div><strong>{detectedCopy.label}</strong><span>{state.adaptiveEnabled ? "화면 정책 적용 중" : "화면 정책 적용 안 함"}</span></div>
          </div>
        </section>

        <section className="demo-stage" ref={demoStageRef} aria-labelledby="storefront-title">
          <div className="demo-stage__header">
            <div>
              <p className="eyebrow">샘플 상점 · Atelier Audio</p>
              <span className="demo-stage__label">동일한 상품과 행동으로 검증하는 적응형 상점 무대</span>
            </div>
            <button type="button" className="cart-button" aria-label={`장바구니, 상품 ${cartCount}개`}>
              Bag <span key={cartCount}>{cartCount}</span>
            </button>
          </div>

          <div className="demo-stage__adaptive-surface">
            {showComparison && <section className="comparison-panel is-visible" aria-label="비교 지원">
              <div className="comparison-panel__intro">
                <p className="eyebrow">Comparison support</p>
                <h2>차이만 빠르게 들여다보기</h2>
                <p>원래 상품 정보는 그대로 두고, 반복해서 확인한 항목을 한 기준선 위에 놓았습니다.</p>
              </div>
              <div className="comparison-table" role="table" aria-label="선택 상품 비교">
                <div role="row" className="comparison-row comparison-row--head">
                  <span role="columnheader">기준</span>
                  {comparisonProducts.map((product) => <strong role="columnheader" key={product.id}>{product.name}</strong>)}
                </div>
                {[
                  ["가격", ...comparisonProducts.map((p) => `₩${p.price.toLocaleString("ko-KR")}`)],
                  ["배터리", ...comparisonProducts.map((p) => `${p.batteryHours}시간`)],
                  ["노이즈 제어", ...comparisonProducts.map((p) => p.anc)],
                  ["배송", ...comparisonProducts.map((p) => p.shipping)],
                ].map(([label, ...values]) => (
                  <div role="row" className="comparison-row" key={label}>
                    <span role="rowheader">{label}</span>
                    {values.map((value, index) => <span role="cell" key={`${label}-${index}`}>{value}</span>)}
                  </div>
                ))}
              </div>
            </section>}

            {state.appliedState === "PURCHASE_INTENT" && focusedProduct && <section className="decision-support" aria-label="집중 상품 결정 지원">
              <div className="decision-support__intro">
                <p className="eyebrow">Decision support · {focusedProduct.name}</p>
                <h2>선택에 필요한 정보를 한 흐름에 모았습니다.</h2>
                <p>상품은 그대로입니다. 지금 확인한 정보의 순서와 강조만 조율했습니다.</p>
              </div>
              <div className="decision-support__proof">
                <div><span>가격</span><strong>₩{focusedProduct.price.toLocaleString("ko-KR")}</strong></div>
                <div><span>배송</span><strong>{focusedProduct.shipping}</strong></div>
                <div><span>재고</span><strong>{focusedProduct.inventory}개</strong></div>
                <div><span>색상</span><strong>{focusedProduct.colors.join(" · ")}</strong></div>
                <button type="button" className="button button--primary" onClick={() => recordUserEvent("ADD_TO_CART", focusedProduct.id)}>장바구니에 담기</button>
              </div>
            </section>}
          </div>

          <section className="storefront" aria-labelledby="storefront-title">
            <div className="storefront__heading">
              <div>
                <p className="eyebrow">Curated wireless listening</p>
                <h2 id="storefront-title">당신의 리듬을 위한 세 가지 조율</h2>
              </div>
              <p>{presentationCopy.description}</p>
            </div>
            <div className="product-grid" data-state={state.appliedState}>
              {PRODUCTS.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  focused={focusedId === product.id}
                  compared={state.compareTray.includes(product.id)}
                  muted={Boolean(focusedId && focusedId !== product.id)}
                  onEvent={recordUserEvent}
                />
              ))}
            </div>
          </section>
        </section>

        <section className="explainers" aria-label="UIAdapt 설명">
          <details className="why-panel">
            <summary>
              <span><small>Why did the UI change?</small><strong>{detectedCopy.title}</strong></span>
              <span className="summary-action">근거 보기</span>
            </summary>
            <div className="why-grid">
              <div><span>Detected state</span><strong>{state.detectedState}</strong></div>
              <div><span>Change score</span><strong>{state.distribution.changeScore.toFixed(3)}</strong></div>
              <div><span>Evidence</span><strong>{state.distribution.eventCount} / 15</strong></div>
              <div><span>Candidate</span><strong>{state.candidateState}</strong></div>
              <div><span>Persistence</span><strong>{state.candidatePersistence} / 3</strong></div>
              <div><span>Last transition</span><strong>{state.lastTransition ? `${state.lastTransition.fromState} → ${state.lastTransition.toState}` : "None"}</strong></div>
              <div><span>Applied state</span><strong>{state.adaptiveEnabled ? state.appliedState : "EXPLORE (suppressed)"}</strong></div>
              <div><span>Telemetry</span><strong>{state.telemetryStatus}</strong></div>
            </div>
            {!state.adaptiveEnabled && <p className="suppressed-note">상태는 감지했지만 적응형 화면 적용은 꺼져 있습니다.</p>}
          </details>

          <details className="developer-view">
            <summary><span>Developer View</span><small>Demo-only explanatory policy</small></summary>
            <div className="developer-grid">
              <div><span>Session</span><strong>{state.sessionId.slice(0, 8)}</strong></div>
              <div><span>Session epoch</span><strong>{state.sessionEpoch}</strong></div>
              <div><span>Events</span><strong data-testid="event-count">{state.events.length}</strong></div>
              <div><span>Evidence window</span><strong>{state.distribution.windowSize} / 20</strong></div>
              <div><span>Minimum evidence</span><strong>15</strong></div>
              <div><span>Raw change score</span><strong>{state.distribution.changeScore.toFixed(3)}</strong></div>
              <div><span>Candidate / persistence</span><strong>{state.candidateState} · {state.candidatePersistence} / 3</strong></div>
              <div><span>Detected / applied</span><strong>{state.detectedState} / {state.appliedState}</strong></div>
              <div><span>Telemetry</span><strong>{state.telemetryStatus}</strong></div>
              <div><span>Replay</span><strong>{state.replayStatus}</strong></div>
            </div>
            <div className="distribution-readout" data-testid="distribution-readout">
              <div><span>Reference</span><strong>B {state.distribution.reference.BROWSE.toFixed(2)} · D {state.distribution.reference.DETAIL.toFixed(2)} · C {state.distribution.reference.COMPARE.toFixed(2)} · Dec {state.distribution.reference.DECISION.toFixed(2)} · Cart {state.distribution.reference.CART_INTENT.toFixed(2)}</strong></div>
              <div><span>Current</span><strong>B {state.distribution.current.BROWSE.toFixed(2)} · D {state.distribution.current.DETAIL.toFixed(2)} · C {state.distribution.current.COMPARE.toFixed(2)} · Dec {state.distribution.current.DECISION.toFixed(2)} · Cart {state.distribution.current.CART_INTENT.toFixed(2)}</strong></div>
            </div>
            <ol className="event-ledger" aria-label="최근 행동 이벤트">
              {state.events.slice(-6).reverse().map((event) => (
                <li key={event.id}><span>{event.atMs / 1000}s</span><strong>{event.type}</strong><em>{event.productId}</em></li>
              ))}
              {state.events.length === 0 && <li className="event-ledger__empty">아직 관찰된 행동이 없습니다.</li>}
            </ol>
          </details>
        </section>
      </main>

      <footer>
        <span>UIAdapt · Adaptive UI Infrastructure</span>
        <p>실제 결제는 수행되지 않습니다. 모든 상품과 행동 데이터는 이 데모 안에만 존재합니다.</p>
      </footer>

      <div key={state.detectedState} className={`transition-toast${state.detectedState !== "EXPLORE" ? " is-visible" : ""}`} role="status" aria-live="polite">
        <span>{state.detectedState}</span><strong>{detectedCopy.label}</strong>
      </div>
    </div>
  );
}

export default App;
