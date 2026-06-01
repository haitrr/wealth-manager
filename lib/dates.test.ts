import { describe, it, expect } from "vitest";
import { parseDateParam, parsePeriodParam } from "./dates.js";

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

describe("parsePeriodParam", () => {
  it("returns null for null input", () => {
    expect(parsePeriodParam(null, "monthly")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parsePeriodParam("", "monthly")).toBeNull();
  });

  it("returns null for custom period", () => {
    expect(parsePeriodParam("2026-04", "custom")).toBeNull();
  });

  it("parses monthly param as day 15 of that month", () => {
    const result = parsePeriodParam("2026-04", "monthly");
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2026);
    expect(result!.getMonth()).toBe(3); // April = 3
    expect(result!.getDate()).toBe(15);
  });

  it("returns null for malformed monthly param", () => {
    expect(parsePeriodParam("2026-4", "monthly")).toBeNull();
    expect(parsePeriodParam("2026", "monthly")).toBeNull();
  });

  it("parses yearly param as July 1 of that year", () => {
    const result = parsePeriodParam("2026", "yearly");
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2026);
    expect(result!.getMonth()).toBe(6); // July = 6
    expect(result!.getDate()).toBe(1);
  });

  it("returns null for malformed yearly param", () => {
    expect(parsePeriodParam("26", "yearly")).toBeNull();
    expect(parsePeriodParam("2026-04", "yearly")).toBeNull();
  });
});
