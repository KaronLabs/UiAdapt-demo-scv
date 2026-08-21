import type { BehaviorDimension, BehaviorEvent } from "./types";

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
