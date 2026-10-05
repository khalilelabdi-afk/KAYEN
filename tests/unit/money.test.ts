import { describe, it, expect } from "vitest";
import { formatMoney, applyBps, savingsPercent, parseMoneyInput, toMoneyInput } from "@/lib/money";

describe("money", () => {
  it("formate en euros français", () => {
    expect(formatMoney(1890).replace(/ | /g, " ")).toBe("18,90 €");
    expect(formatMoney(123456).replace(/ | /g, " ")).toBe("1 234,56 €");
  });
  it("applique un taux en points de base avec arrondi", () => {
    expect(applyBps(1000, 2000)).toBe(200);
    expect(applyBps(1190, 500)).toBe(60);
    expect(applyBps(1, 550)).toBe(0);
  });
  it("calcule le pourcentage d'économie", () => {
    expect(savingsPercent(1290, 1190)).toBe(8);
    expect(savingsPercent(1290, 1290)).toBe(0);
    expect(savingsPercent(0, 10)).toBe(0);
  });
  it("convertit les saisies", () => {
    expect(parseMoneyInput("18,90")).toBe(1890);
    expect(parseMoneyInput("18.9")).toBe(1890);
    expect(parseMoneyInput("abc")).toBeNull();
    expect(toMoneyInput(1890)).toBe("18.90");
  });
});
