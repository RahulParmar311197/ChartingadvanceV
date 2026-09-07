import { describe, expect, it } from "vitest";
import { evaluateAlert } from "./alerts";

describe("evaluateAlert", () => {
  const base = {
    id: "a1",
    userId: "u1",
    symbolId: "NASDAQ:AAPL",
    type: "price" as const,
    enabled: true,
    cooldownSeconds: 60,
  };

  it("fires threshold alerts", () => {
    expect(evaluateAlert({ ...base, operator: "gte", threshold: 100 }, 101, 1000)).toEqual({
      ruleId: "a1", firedAt: 1000, value: 101, deliveryId: "a1:1000",
    });
  });

  it("evaluates crossing operators from the previous value", () => {
    expect(evaluateAlert({ ...base, operator: "crosses_above", threshold: 100 }, 101, 1000, 99)).toBeTruthy();
    expect(evaluateAlert({ ...base, operator: "crosses_above", threshold: 100 }, 101, 1000, 101)).toBeNull();
  });

  it("does not fire disabled or cooldown-blocked rules", () => {
    expect(evaluateAlert({ ...base, enabled: false, operator: "gt", threshold: 1 }, 2, 1000)).toBeNull();
    expect(evaluateAlert({ ...base, operator: "gt", threshold: 1 }, 2, 1000, undefined, 950)).toBeNull();
  });

  it("returns null for invalid values", () => {
    expect(evaluateAlert({ ...base, operator: "gt", threshold: 1 }, Number.NaN, 1000)).toBeNull();
  });
});
