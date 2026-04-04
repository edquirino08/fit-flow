import { describe, expect, it } from "vitest";
import {
  computePhaseLoads,
  defaultPhasesConfig,
  repsForPhase,
  setsForPhase,
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

  it("keeps work load exact (no plate rounding on final)", () => {
    const cfg = defaultPhasesConfig({
      aq1: { enabled: false },
      aq2: { enabled: false },
      aj1: { enabled: false },
      aj2: { enabled: false },
      work: { enabled: true },
    });
    const loads = computePhaseLoads(9, cfg);
    expect(loads.find((l) => l.id === "work")?.kg).toBe(9);
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

  it("includes reps from defaults and custom overrides", () => {
    const base = defaultPhasesConfig();
    expect(repsForPhase("aq1", base)).toBe("15");
    expect(repsForPhase("work", base)).toBe("6-10");
    const custom = defaultPhasesConfig({
      aq1: { enabled: true, reps: "12" },
    });
    expect(repsForPhase("aq1", custom)).toBe("12");
    const loads = computePhaseLoads(20, custom);
    expect(loads.find((l) => l.id === "aq1")?.reps).toBe("12");
  });

  it("includes sets from defaults and custom overrides", () => {
    const base = defaultPhasesConfig();
    expect(setsForPhase("aq1", base)).toBe(1);
    expect(setsForPhase("work", base)).toBe(1);
    const custom = defaultPhasesConfig({
      aq1: { enabled: true, sets: 2 },
      work: { enabled: true, sets: 4 },
    });
    expect(setsForPhase("aq1", custom)).toBe(2);
    expect(setsForPhase("work", custom)).toBe(4);
    const loads = computePhaseLoads(20, custom);
    expect(loads.find((l) => l.id === "aq1")?.sets).toBe(2);
    expect(loads.find((l) => l.id === "work")?.sets).toBe(4);
  });
});
