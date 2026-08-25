import { ProductArt } from "../components/ProductArt";
import { PRODUCTS } from "../domain/catalog";
import type { AdaptiveState, Product, ProductId } from "../domain/types";
import { STAGE_PRESENTATION } from "./stageReplay";
import { useStageController } from "./useStageController";

const currency = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

function ProductCard({ product, adaptive, state, focusedProductId }: {
  product: Product;
  adaptive: boolean;
  state: AdaptiveState;
  focusedProductId: ProductId | null;
}) {
  const compare = adaptive && state === "COMPARE" && product.id !== "halo-air";
  const focused = adaptive && state === "PURCHASE_INTENT" && product.id === focusedProductId;

  return (
    <article
      className={`stage-product-card${focused ? " stage-product-card--focused" : ""}`}
      data-product-id={product.id}
      data-product-price={product.price}
    >
      {compare && <span className="stage-chip stage-chip--compare">비교 중</span>}
      {focused && <span className="stage-chip stage-chip--focused">재구성됨</span>}
      <div className="stage-product-art"><ProductArt productId={product.id} /></div>
      <div className="stage-product-copy">
        <h3>{product.name}</h3>
        <strong>{currency.format(product.price)}</strong>
        <p>{product.tagline}</p>
      </div>
    </article>
  );
}

function ProductCards({ adaptive, state, focusedProductId = null }: {
  adaptive: boolean;
  state: AdaptiveState;
  focusedProductId?: ProductId | null;
}) {
  return (
    <div className="stage-product-grid">
      {PRODUCTS.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          adaptive={adaptive}
          state={state}
          focusedProductId={focusedProductId}
        />
      ))}
    </div>
  );
}

function StaticPanel() {
  return (
    <article className="stage-panel stage-panel--off">
      <header className="stage-panel-head">
        <h2>적용 전 · Adaptive OFF</h2>
        <span className="stage-mono">presentation: EXPLORE 고정</span>
      </header>
      <div className="stage-state-slot stage-state-slot--empty">
        <strong>적용 안 함 · 대기</strong>
        <span className="stage-mono">policy: suppressed</span>
      </div>
      <ProductCards adaptive={false} state="EXPLORE" />
    </article>
  );
}

function ExploreView() {
  return (
    <div className="stage-state-view stage-state-view--empty" data-stage-state-view="EXPLORE">
      <strong>신호 수집 중</strong>
      <span className="stage-mono">evidence 6 / 15</span>
    </div>
  );
}

function CompareView() {
  const aurora = PRODUCTS[0];
  const nova = PRODUCTS[1];
  return (
    <div className="stage-state-view stage-compare" data-stage-state-view="COMPARE">
      <div className="stage-compare-row stage-compare-row--head"><span>기준</span><b>{aurora.name}</b><b>{nova.name}</b></div>
      <div className="stage-compare-row"><span>가격</span><b>{currency.format(aurora.price)}</b><b>{currency.format(nova.price)}</b></div>
      <div className="stage-compare-row"><span>배터리</span><b>{aurora.batteryHours}시간</b><b>{nova.batteryHours}시간</b></div>
      <div className="stage-compare-row"><span>노이즈 제어</span><b>{aurora.anc}</b><b>{nova.anc}</b></div>
      <div className="stage-compare-row"><span>배송</span><b>{aurora.shipping}</b><b>{nova.shipping}</b></div>
    </div>
  );
}

function PurchaseView({ focusedProductId }: { focusedProductId: ProductId | null }) {
  const product = PRODUCTS.find(({ id }) => id === focusedProductId);
  if (!product) return null;
  return (
    <div className="stage-state-view stage-decision" data-stage-state-view="PURCHASE_INTENT">
      <div className="stage-decision-tiles">
        <div><span>가격</span><b>{currency.format(product.price)}</b></div>
        <div><span>배송</span><b>{product.shipping}</b></div>
        <div><span>재고</span><b>{product.inventory}개</b></div>
        <div><span>색상</span><b>{product.colors.join(" · ")}</b></div>
      </div>
      <button className="stage-buy" type="button">장바구니에 담기</button>
    </div>
  );
}

function AdaptivePanel({ state, policyLabel, focusedProductId }: {
  state: AdaptiveState;
  policyLabel: string;
  focusedProductId: ProductId | null;
}) {
  return (
    <article className="stage-panel stage-panel--on">
      <header className="stage-panel-head">
        <h2>적용 후 · Adaptive ON</h2>
        <span className="stage-mono">{policyLabel}</span>
      </header>
      <div className="stage-state-slot">
        <ExploreView />
        <CompareView />
        <PurchaseView focusedProductId={focusedProductId} />
      </div>
      <ProductCards adaptive state={state} focusedProductId={focusedProductId} />
    </article>
  );
}

export default function StageApp() {
  const controller = useStageController();
  const state = controller.snapshot.appliedState;
  const presentation = STAGE_PRESENTATION[state];
  const requestFullscreen = () => {
    document.getElementById("stage-root")?.requestFullscreen().catch(() => undefined);
  };

  return (
    <main
      id="stage-root"
      data-state={state}
      data-playback={controller.playback}
      data-elapsed-ms={controller.elapsedMs}
      data-domain-sequence-no={controller.snapshot.sequenceNo}
      data-domain-event-count={controller.snapshot.distribution.eventCount}
      data-domain-window-size={controller.snapshot.distribution.windowSize}
      data-domain-change-score={controller.snapshot.distribution.changeScore}
      data-domain-focused-product-id={controller.snapshot.focusedProductId ?? ""}
      data-demo-complete={controller.playback === "COMPLETED"}
    >
      <header className="stage-chrome">
        <strong>UIAdapt · 심사 무대 · R12</strong>
        <span>특허 출원 기반 적응형 UI 인프라</span>
        <em className="stage-live"><i /><b className="stage-mono">LIVE {presentation.timer} / 00:27</b></em>
      </header>

      <section className="stage-kpis" aria-label="적응 상태 지표">
        <div className="stage-kpi"><div><span>행동 신호</span><b className="stage-mono">{presentation.signalAt}</b></div><strong>{presentation.signal}</strong></div>
        <div className="stage-kpi"><div><span>상태</span><b className="stage-mono">{state}</b></div><strong>{presentation.stateLabel}</strong></div>
        <div className="stage-kpi"><div><span>근거</span><b className="stage-mono">최근 20 이벤트</b></div><strong>{presentation.evidence}</strong></div>
        <div className="stage-kpi"><div><span>변화 점수</span><b className="stage-mono">진입 ≥ 0.30</b></div><strong>{presentation.changeScore}</strong></div>
        <div className="stage-kpi"><div><span>재구성 횟수</span><b className="stage-mono">누적</b></div><strong>{presentation.reconstructionCount}</strong></div>
      </section>

      <section className="stage-comparison" aria-label="Adaptive 적용 전후 비교">
        <StaticPanel />
        <div className="stage-seam" aria-hidden="true"><i /></div>
        <AdaptivePanel
          state={state}
          policyLabel={presentation.policyLabel}
          focusedProductId={controller.snapshot.focusedProductId}
        />
      </section>

      <footer className="stage-rail">
        <div className="stage-pipeline">
          <b className="stage-mono">Behavior → State → Policy → Interface</b>
          <div><span>행동</span><i>→</i><span>상태</span><i>→</i><span>정책</span><i>→</i><span>화면</span></div>
        </div>
        <div className="stage-controls">
          <button type="button" onClick={controller.play}>▶ 27초 데모</button>
          <button type="button" onClick={controller.pause}>일시정지</button>
          <button type="button" onClick={controller.reset}>처음부터</button>
          <button type="button" onClick={requestFullscreen}>전체화면</button>
        </div>
        <p>결정론적 리플레이 · 테스트 데이터 · 상품 ID/가격 불변</p>
      </footer>
    </main>
  );
}
