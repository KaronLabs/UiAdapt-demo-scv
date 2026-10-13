import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import App from "./App";

describe("adaptive storefront UI contract", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("shows DISABLED on first render and sends no telemetry through replay and reset in static mode", () => {
    vi.stubEnv("VITE_UIADAPT_TELEMETRY_MODE", "disabled");
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200 }));
    vi.stubGlobal("fetch", fetchImpl);
    render(<App />);

    const status = () => screen.getAllByText("Telemetry").at(-1)?.nextElementSibling;
    expect(status()).toHaveTextContent("DISABLED");
    fireEvent.click(screen.getByTestId("live-demo-cta"));
    act(() => vi.advanceTimersByTime(19_000));
    expect(screen.getByTestId("event-count")).toHaveTextContent("38");
    expect(status()).toHaveTextContent("DISABLED");
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(status()).toHaveTextContent("DISABLED");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("renders the canonical products and keeps diagnostics collapsed", () => {
    const { container } = render(<App />);
    expect(screen.getByRole("link", { name: "UIAdapt 홈" })).toBeInTheDocument();
    expect(container.querySelector(".site-header .brand__lockup small")).toHaveTextContent(/^Adaptive UI Infrastructure · R11$/);
    expect(container.querySelector(".site-header .cart-button")).not.toBeInTheDocument();
    expect(container.querySelector(".demo-stage .cart-button")).toBeInTheDocument();
    expect(container.querySelector(".demo-stage__header")).toHaveTextContent("샘플 상점 · Atelier Audio");
    expect(screen.getByRole("heading", { name: "Aurora One" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nova Pro" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Halo Air" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aurora One 가격 확인" })).toHaveTextContent("₩329,000");
    expect(screen.getByRole("button", { name: "Nova Pro 가격 확인" })).toHaveTextContent("₩279,000");
    expect(screen.getByRole("button", { name: "Halo Air 가격 확인" })).toHaveTextContent("₩199,000");
    expect(screen.getByText("Developer View").closest("details")).not.toHaveAttribute("open");
  });

  it("presents the patent-pending investor thesis and causal contract", () => {
    render(<App />);
    expect(screen.getByText("특허 출원 기반 적응형 UI 인프라")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "같은 상품을, 더 나은 판단으로." })).toBeInTheDocument();
    expect(screen.getByText("추천은 WHAT을 결정합니다. UIAdapt는 HOW를 조율합니다.")).toBeInTheDocument();
    expect(screen.getByTestId("product-invariants")).toHaveTextContent(
      "Same catalogSame behaviorDifferent presentation",
    );
    expect(screen.getByTestId("causal-trace")).toHaveAccessibleName(
      "Behavior → State → Policy → Interface",
    );
  });

  it("starts the canonical replay from the investor-stage CTA", () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("live-demo-cta"));
    expect(screen.getByTestId("replay-status")).toHaveTextContent("동일한 행동 시퀀스를 재생하고 있습니다.");
  });

  it("exposes distribution evidence and telemetry status in Developer View", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Developer View"));
    expect(screen.getByText("Evidence window").nextElementSibling).toHaveTextContent("0 / 20");
    expect(screen.getByText("Minimum evidence").nextElementSibling).toHaveTextContent("15");
    expect(screen.getByText("Raw change score").nextElementSibling).toHaveTextContent("0.000");
    expect(screen.getByTestId("distribution-readout")).toHaveTextContent("Reference");
    expect(screen.getByTestId("distribution-readout")).toHaveTextContent("Current");
    expect(screen.getByText("Detected / applied").nextElementSibling).toHaveTextContent("EXPLORE / EXPLORE");
    expect(screen.getAllByText("Telemetry").at(-1)?.nextElementSibling).toHaveTextContent("HEALTHY");
  });

  it("keeps local transitions independent from telemetry fetch failures", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503 })));
    const { container } = render(<App />);
    fireEvent.click(screen.getByTestId("live-demo-cta"));
    await act(async () => {
      vi.advanceTimersByTime(19_000);
    });
    expect(container.querySelector('[data-current="true"] strong')).toHaveTextContent("PURCHASE_INTENT");
    expect(container.querySelector(".product-grid")).toHaveAttribute("data-state", "PURCHASE_INTENT");
  });

  it("replays EXPLORE to COMPARE to PURCHASE_INTENT while preserving product data", () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByTestId("live-demo-cta"));
    act(() => vi.advanceTimersByTime(11_000));
    expect(container.querySelector('[data-current="true"] strong')).toHaveTextContent("COMPARE");
    expect(container.querySelector(".product-grid")).toHaveAttribute("data-state", "COMPARE");
    act(() => vi.advanceTimersByTime(8_000));
    expect(container.querySelector('[data-current="true"] strong')).toHaveTextContent("PURCHASE_INTENT");
    expect(container.querySelector(".product-grid")).toHaveAttribute("data-state", "PURCHASE_INTENT");
    expect(screen.getByRole("button", { name: "Aurora One 가격 확인" })).toHaveTextContent("₩329,000");
  });

  it("detects PURCHASE_INTENT with Adaptive UI off but keeps EXPLORE presentation", () => {
    const { container } = render(<App />);
    const exploreDescription = container.querySelector(".storefront__heading > p")?.textContent;
    fireEvent.click(screen.getByRole("checkbox", { name: /Adaptive UI/i }));
    fireEvent.click(screen.getByTestId("live-demo-cta"));
    act(() => vi.advanceTimersByTime(21_000));
    expect(container.querySelector('[data-current="true"] strong')).toHaveTextContent("PURCHASE_INTENT");
    expect(container.querySelector(".product-grid")).toHaveAttribute("data-state", "EXPLORE");
    expect(container.querySelector(".storefront__heading > p")).toHaveTextContent(exploreDescription ?? "");
    expect(screen.getByText("선택에 필요한 정보를 가까이 모았습니다.")).toBeInTheDocument();
  });

  it("does not remove the active product control during adaptation", () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByTestId("live-demo-cta"));
    const priceButton = screen.getByRole("button", { name: "Aurora One 가격 확인" });
    priceButton.focus();
    expect(document.activeElement).toBe(priceButton);
    act(() => vi.advanceTimersByTime(11_000));
    expect(container.querySelector('[data-current="true"] strong')).toHaveTextContent("COMPARE");
    expect(document.activeElement).toBe(priceButton);
  });

  it("keeps comparison inside the stable demo stage and hides it in PURCHASE_INTENT", () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByTestId("live-demo-cta"));
    act(() => vi.advanceTimersByTime(11_000));
    expect(container.querySelector(".demo-stage .comparison-panel.is-visible")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(8_000));
    expect(container.querySelector(".comparison-panel.is-visible")).not.toBeInTheDocument();
    expect(container.querySelector(".decision-support")).toBeInTheDocument();
  });

  it("stops the scripted replay when the user takes over", () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("live-demo-cta"));
    fireEvent.click(screen.getByRole("button", { name: "Aurora One 가격 확인" }));
    expect(screen.getByTestId("replay-status")).toHaveTextContent("직접 탐색을 시작해 데모 재생을 멈췄습니다.");
  });

  it("exposes the replay status on the app root for the visual layer", () => {
    const { container } = render(<App />);
    const root = container.querySelector(".app");
    expect(root).toHaveAttribute("data-replay", "IDLE");
    fireEvent.click(screen.getByTestId("live-demo-cta"));
    expect(root).toHaveAttribute("data-replay", "RUNNING");
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(root).toHaveAttribute("data-replay", "PAUSED");
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(root).toHaveAttribute("data-replay", "IDLE");
  });

  it("remounts the bag badge when the cart count changes so its pop animation replays", () => {
    const { container } = render(<App />);
    const before = container.querySelector(".demo-stage .cart-button span");
    expect(before).toHaveTextContent("0");
    fireEvent.click(screen.getAllByRole("button", { name: "장바구니 담기" })[0]);
    const after = container.querySelector(".demo-stage .cart-button span");
    expect(after).toHaveTextContent("1");
    expect(after).not.toBe(before);
  });

  it("does not initialise console tilt when reduced motion is preferred", () => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })));
    const { container } = render(<App />);
    expect(container.querySelector(".hero__console .js-tilt-glare")).not.toBeInTheDocument();
  });

  it("initialises console tilt with glare for fine pointers without reduced motion", () => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: false,
      media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })));
    const { container } = render(<App />);
    expect(container.querySelector(".hero__console .js-tilt-glare")).toBeInTheDocument();
  });

  it("keeps a single console glare node across StrictMode effect double-invocation", () => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: false,
      media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })));
    const { container } = render(<StrictMode><App /></StrictMode>);
    expect(container.querySelectorAll(".hero__console .js-tilt-glare")).toHaveLength(1);
  });
});
