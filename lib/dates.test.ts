import { describe, it, expect } from "vitest";
import { parseDateParam } from "./dates.js";

describe("parseDateParam", () => {
  it("passes through a UTC ISO string unchanged", () => {
    const input = "2026-05-15T00:00:00.000Z";
    expect(parseDateParam(input, "Asia/Ho_Chi_Minh").toISOString()).toBe(input);
  });

  it("passes through a positive-offset ISO string unchanged", () => {
    const input = "2026-05-15T07:00:00+07:00";
    expect(parseDateParam(input, "UTC").toISOString()).toBe(new Date(input).toISOString());
  });

  it("passes through a negative-offset ISO string unchanged", () => {
    const input = "2026-05-15T20:00:00-05:00";
    expect(parseDateParam(input, "UTC").toISOString()).toBe(new Date(input).toISOString());
  });

  it("interprets a bare date in the given timezone — UTC+7", () => {
    // midnight May 15 in Ho Chi Minh = 2026-05-14T17:00:00.000Z
    const result = parseDateParam("2026-05-15", "Asia/Ho_Chi_Minh");
    expect(result.toISOString()).toBe("2026-05-14T17:00:00.000Z");
  });

  it("interprets a bare date in UTC when timezone is UTC", () => {
    const result = parseDateParam("2026-05-15", "UTC");
    expect(result.toISOString()).toBe("2026-05-15T00:00:00.000Z");
  });

  it("interprets a bare datetime string in the given timezone", () => {
    // 08:30 in Ho Chi Minh (UTC+7) = 01:30 UTC
    const result = parseDateParam("2026-05-15T08:30:00", "Asia/Ho_Chi_Minh");
    expect(result.toISOString()).toBe("2026-05-15T01:30:00.000Z");
  });

  it("interprets a bare date in a negative-offset timezone — EDT/EST (UTC-4 or UTC-5)", () => {
    // In May, New York is on EDT (UTC-4): midnight May 15 = 2026-05-15T04:00:00.000Z
    // In winter (UTC-5): midnight May 15 = 2026-05-15T05:00:00.000Z
    const result = parseDateParam("2026-05-15", "America/New_York");
    // Accept either UTC-4 (EDT) or UTC-5 (EST)
    const iso = result.toISOString();
    expect(["2026-05-15T04:00:00.000Z", "2026-05-15T05:00:00.000Z"]).toContain(iso);
  });
});
