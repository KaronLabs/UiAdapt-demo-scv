import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("adaptive storefront UI contract", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("renders the canonical products and keeps diagnostics collapsed", () => {
    const { container } = render(<App />);
    expect(screen.getByRole("link", { name: "Atelier Audio storefront 홈" })).toBeInTheDocument();
    expect(container.querySelector("header .powered-by")).toHaveTextContent("Powered by UIAdapt");
    expect(screen.getByRole("heading", { name: "Aurora One" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nova Pro" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Halo Air" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aurora One 가격 확인" })).toHaveTextContent("₩329,000");
    expect(screen.getByRole("button", { name: "Nova Pro 가격 확인" })).toHaveTextContent("₩279,000");
    expect(screen.getByRole("button", { name: "Halo Air 가격 확인" })).toHaveTextContent("₩199,000");
    expect(screen.getByText("Developer View").closest("details")).not.toHaveAttribute("open");
  });

  it("replays EXPLORE to COMPARE to FOCUS while preserving product data", () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Watch UIAdapt/i }));
    act(() => vi.advanceTimersByTime(7_000));
    expect(container.querySelector('[data-current="true"] strong')).toHaveTextContent("COMPARE");
    expect(container.querySelector(".product-grid")).toHaveAttribute("data-state", "COMPARE");
    act(() => vi.advanceTimersByTime(14_000));
    expect(container.querySelector('[data-current="true"] strong')).toHaveTextContent("FOCUS");
    expect(container.querySelector(".product-grid")).toHaveAttribute("data-state", "FOCUS");
    expect(screen.getByRole("button", { name: "Aurora One 가격 확인" })).toHaveTextContent("₩329,000");
  });

  it("detects FOCUS with Adaptive UI off but keeps EXPLORE presentation", () => {
    const { container } = render(<App />);
    const exploreDescription = container.querySelector(".storefront__heading > p")?.textContent;
    fireEvent.click(screen.getByRole("checkbox", { name: /Adaptive UI/i }));
    fireEvent.click(screen.getByRole("button", { name: /Watch UIAdapt/i }));
    act(() => vi.advanceTimersByTime(21_000));
    expect(container.querySelector('[data-current="true"] strong')).toHaveTextContent("FOCUS");
    expect(container.querySelector(".product-grid")).toHaveAttribute("data-state", "EXPLORE");
    expect(container.querySelector(".storefront__heading > p")).toHaveTextContent(exploreDescription ?? "");
    expect(screen.getByText("선택에 필요한 정보를 가까이 모았습니다.")).toBeInTheDocument();
  });

  it("does not remove the active product control during adaptation", () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Watch UIAdapt/i }));
    const priceButton = screen.getByRole("button", { name: "Aurora One 가격 확인" });
    priceButton.focus();
    expect(document.activeElement).toBe(priceButton);
    act(() => vi.advanceTimersByTime(7_000));
    expect(container.querySelector('[data-current="true"] strong')).toHaveTextContent("COMPARE");
    expect(document.activeElement).toBe(priceButton);
  });

  it("keeps comparison inside the stable demo stage and hides it in FOCUS", () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Watch UIAdapt/i }));
    act(() => vi.advanceTimersByTime(7_000));
    expect(container.querySelector(".demo-stage .comparison-panel.is-visible")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(14_000));
    expect(container.querySelector(".comparison-panel.is-visible")).not.toBeInTheDocument();
    expect(container.querySelector(".decision-support")).toBeInTheDocument();
  });

  it("stops the scripted replay when the user takes over", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Watch UIAdapt/i }));
    fireEvent.click(screen.getByRole("button", { name: "Aurora One 가격 확인" }));
    expect(screen.getByTestId("replay-status")).toHaveTextContent("직접 탐색을 시작해 데모 재생을 멈췄습니다.");
  });
});
