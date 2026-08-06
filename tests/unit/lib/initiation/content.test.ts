// ABOUTME: Initiationコンテンツの構造と検索契約を検証する。
// ABOUTME: 本文を差し替えても一意なstep IDとquestion/quest構成を保つ。
import { describe, expect, it } from "vitest";
import { findStep, initiationSteps } from "@/lib/initiation/content";

describe("initiation content", () => {
  it("has unique step ids", () => {
    const ids = initiationSteps.map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has at least one question and one quest", () => {
    expect(initiationSteps.some((step) => step.kind === "question")).toBe(true);
    expect(initiationSteps.some((step) => step.kind === "quest")).toBe(true);
  });

  it("finds a step by id", () => {
    expect(findStep(initiationSteps[0].id)).toBe(initiationSteps[0]);
    expect(findStep("no-such-step")).toBeUndefined();
  });
});
