import { describe, expect, it } from "vitest";
import {
  computePhaseLoads,
  defaultPhasesConfig,
  roundToStep,
} from "./index.js";

describe("roundToStep", () => {
  it("rounds to 2.5", () => {
    expect(roundToStep(7.3, 2.5)).toBe(7.5);
    expect(roundToStep(20, 2.5)).toBe(20);
  });
});

describe("computePhaseLoads", () => {
  it("matches spreadsheet-style progression for 20 kg final", () => {
    const loads = computePhaseLoads(20, defaultPhasesConfig());
    const byId = Object.fromEntries(loads.map((l) => [l.id, l.kg]));
    expect(byId.aq1).toBe(7.5);
    expect(byId.aq2).toBe(10);
    expect(byId.aj1).toBe(12.5);
    expect(byId.aj2).toBe(17.5);
    expect(byId.work).toBe(20);
  });

  it("returns null kg when final missing", () => {
    const loads = computePhaseLoads(null, defaultPhasesConfig());
    expect(loads.every((l) => l.kg === null)).toBe(true);
  });

  it("skips disabled phases", () => {
    const cfg = defaultPhasesConfig({
      aq1: { enabled: false },
      aq2: { enabled: false },
    });
    const loads = computePhaseLoads(100, cfg);
    const aq1 = loads.find((l) => l.id === "aq1");
    expect(aq1?.enabled).toBe(false);
    expect(aq1?.kg).toBe(null);
  });
});
