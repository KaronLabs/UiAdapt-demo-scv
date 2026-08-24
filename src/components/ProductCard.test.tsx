import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PRODUCTS } from "../domain/catalog";
import { ProductCard } from "./ProductCard";

function renderCard() {
  const { container } = render(
    <ProductCard product={PRODUCTS[0]} focused={false} compared={false} muted={false} onEvent={vi.fn()} />,
  );
  const card = container.querySelector(".product-card") as HTMLElement;
  vi.spyOn(card, "getBoundingClientRect").mockReturnValue({
    left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}),
  } as DOMRect);
  return card;
}

describe("ProductCard pointer variables", () => {
  it("writes normalized pointer position as CSS variables on pointermove", () => {
    const card = renderCard();
    fireEvent.pointerMove(card, { clientX: 150, clientY: 25 });
    expect(card.style.getPropertyValue("--mx")).toBe("75.0%");
    expect(card.style.getPropertyValue("--my")).toBe("25.0%");
    expect(card.style.getPropertyValue("--px")).toBe("0.500");
    expect(card.style.getPropertyValue("--py")).toBe("-0.500");
  });

  it("clears the variables on pointerleave", () => {
    const card = renderCard();
    fireEvent.pointerMove(card, { clientX: 20, clientY: 90 });
    fireEvent.pointerLeave(card);
    expect(card.style.getPropertyValue("--mx")).toBe("");
    expect(card.style.getPropertyValue("--py")).toBe("");
  });

  it("ignores pointermove when the card has no layout box", () => {
    const card = renderCard();
    (card.getBoundingClientRect as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => ({}),
    } as DOMRect);
    fireEvent.pointerMove(card, { clientX: 10, clientY: 10 });
    expect(card.style.getPropertyValue("--mx")).toBe("");
  });

  it("keeps the product contract untouched", () => {
    const card = renderCard();
    expect(JSON.parse(card.dataset.productContract ?? "null")).toEqual(PRODUCTS[0]);
  });
});
