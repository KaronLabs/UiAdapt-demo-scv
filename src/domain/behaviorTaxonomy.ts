import type { BehaviorDimension, BehaviorEvent } from "./types";

const BEHAVIOR_EVENT_TYPES: ReadonlySet<BehaviorEvent["type"]> = new Set([
  "VIEW_PRODUCT",
  "OPEN_DETAILS",
  "CHECK_PRICE",
  "CHECK_REVIEWS",
  "SELECT_COLOR",
  "CHECK_SHIPPING",
  "ADD_COMPARE",
  "REMOVE_COMPARE",
  "ADD_TO_CART",
]);

export function isBehaviorEventType(value: unknown): value is BehaviorEvent["type"] {
  return typeof value === "string" && BEHAVIOR_EVENT_TYPES.has(value as BehaviorEvent["type"]);
}

export function classifyBehavior(event: Pick<BehaviorEvent, "type">): BehaviorDimension {
  switch (event.type) {
    case "VIEW_PRODUCT":
      return "BROWSE";
    case "OPEN_DETAILS":
      return "DETAIL";
    case "ADD_COMPARE":
    case "REMOVE_COMPARE":
      return "COMPARE";
    case "CHECK_PRICE":
    case "CHECK_REVIEWS":
    case "SELECT_COLOR":
    case "CHECK_SHIPPING":
      return "DECISION";
    case "ADD_TO_CART":
      return "CART_INTENT";
    default:
      throw new Error(`Unsupported behavior event type: ${event.type}`);
  }
}
