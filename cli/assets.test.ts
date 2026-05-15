import { describe, it, expect, vi, beforeEach } from "vitest";
import { assetsCommand, type CliDeps } from "./assets.js";

const ASSET = {
  id: "asset-1",
  name: "Apple",
  type: "stock",
  currency: "USD",
  currentValue: 15000,
  quantity: 10,
  ticker: "AAPL",
  lastPricedAt: "2026-05-14T00:00:00.000Z",
};

function makeDeps(overrides: Partial<CliDeps> & { sub?: string; args?: string[] } = {}): CliDeps {
  const { sub = "list", args: extraArgs = [], ...rest } = overrides;
  const positionals = ["assets", sub, ...extraArgs];

  return {
    http: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    } as unknown as CliDeps["http"],
    flag: vi.fn().mockReturnValue(undefined),
    positional: vi.fn((i: number) => positionals[i]),
    jsonOutput: false,
    printJson: vi.fn(),
    fmt: (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }),
    fmtDate: (iso: string) => iso.split("T")[0],
    ...rest,
  };
}

describe("assets list", () => {
  beforeEach(() => vi.spyOn(console, "log").mockImplementation(() => {}));

  it("prints markdown header and one bullet per asset", async () => {
    const d = makeDeps({ sub: "list" });
    vi.mocked(d.http.get).mockResolvedValue({ data: [ASSET] });

    await assetsCommand(d);

    expect(console.log).toHaveBeenCalledWith("## Assets (1)\n");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("`asset-1`")
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("**Apple**")
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("10 × AAPL")
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("priced 2026-05-14")
    );
  });

  it("defaults to list when no subcommand given", async () => {
    const d = makeDeps();
    d.positional = vi.fn((i: number) => (i === 0 ? "assets" : undefined));
    vi.mocked(d.http.get).mockResolvedValue({ data: [] });

    await assetsCommand(d);

    expect(console.log).toHaveBeenCalledWith("## Assets (0)\n");
  });

  it("calls printJson when jsonOutput is true", async () => {
    const d = makeDeps({ sub: "list", jsonOutput: true });
    vi.mocked(d.http.get).mockResolvedValue({ data: [ASSET] });

    await assetsCommand(d);

    expect(d.printJson).toHaveBeenCalledWith([ASSET]);
    expect(console.log).not.toHaveBeenCalled();
  });
});

describe("assets add", () => {
  beforeEach(() => vi.spyOn(console, "log").mockImplementation(() => {}));

  it("posts asset and prints markdown confirmation", async () => {
    const d = makeDeps({ sub: "add", args: ["Apple", "stock", "15000"] });
    vi.mocked(d.flag).mockImplementation((name) => {
      if (name === "ticker") return "AAPL";
      if (name === "quantity") return "10";
      return undefined;
    });
    vi.mocked(d.http.post).mockResolvedValue({ data: ASSET });

    await assetsCommand(d);

    expect(d.http.post).toHaveBeenCalledWith("/api/assets", expect.objectContaining({
      name: "Apple",
      type: "stock",
      currentValue: 15000,
      currency: "USD",
      ticker: "AAPL",
      quantity: 10,
    }));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("`asset-1`"));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("**Apple**"));
  });

  it("exits 1 when missing required positional args", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const d = makeDeps({ sub: "add", args: [] });

    await expect(assetsCommand(d)).rejects.toThrow("exit");
    expect(exit).toHaveBeenCalledWith(1);
  });

  it("defaults currency to USD", async () => {
    const d = makeDeps({ sub: "add", args: ["My House", "real_estate", "500000"] });
    vi.mocked(d.http.post).mockResolvedValue({ data: { ...ASSET, type: "real_estate", ticker: null, quantity: null } });

    await assetsCommand(d);

    expect(d.http.post).toHaveBeenCalledWith("/api/assets", expect.objectContaining({ currency: "USD" }));
  });
});

describe("assets update", () => {
  beforeEach(() => vi.spyOn(console, "log").mockImplementation(() => {}));

  it("fetches current asset, merges flags, and patches", async () => {
    const d = makeDeps({ sub: "update", args: ["asset-1"] });
    vi.mocked(d.flag).mockImplementation((name) => name === "name" ? "Apple Inc" : undefined);
    vi.mocked(d.http.get).mockResolvedValue({ data: ASSET });
    vi.mocked(d.http.patch).mockResolvedValue({ data: { ...ASSET, name: "Apple Inc" } });

    await assetsCommand(d);

    expect(d.http.get).toHaveBeenCalledWith("/api/assets/asset-1");
    expect(d.http.patch).toHaveBeenCalledWith("/api/assets/asset-1", expect.objectContaining({
      name: "Apple Inc",
      type: "stock",
      currentValue: 15000,
    }));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("**Apple Inc**"));
  });

  it("exits 1 when no fields provided", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const d = makeDeps({ sub: "update", args: ["asset-1"] });

    await expect(assetsCommand(d)).rejects.toThrow("exit");
    expect(exit).toHaveBeenCalledWith(1);
  });
});

describe("assets delete", () => {
  beforeEach(() => vi.spyOn(console, "log").mockImplementation(() => {}));

  it("sends DELETE and prints confirmation", async () => {
    const d = makeDeps({ sub: "delete", args: ["asset-1"] });
    vi.mocked(d.http.delete).mockResolvedValue({});

    await assetsCommand(d);

    expect(d.http.delete).toHaveBeenCalledWith("/api/assets/asset-1");
    expect(console.log).toHaveBeenCalledWith("Deleted asset `asset-1`.");
  });

  it("exits 1 when id is missing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const d = makeDeps({ sub: "delete", args: [] });

    await expect(assetsCommand(d)).rejects.toThrow("exit");
    expect(exit).toHaveBeenCalledWith(1);
  });
});

describe("assets refresh", () => {
  beforeEach(() => vi.spyOn(console, "log").mockImplementation(() => {}));

  it("posts to refresh-price endpoint and prints updated value", async () => {
    const d = makeDeps({ sub: "refresh", args: ["asset-1"] });
    vi.mocked(d.http.post).mockResolvedValue({ data: { ...ASSET, currentValue: 16500 } });

    await assetsCommand(d);

    expect(d.http.post).toHaveBeenCalledWith("/api/assets/asset-1/refresh-price");
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("16,500.00"));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("priced 2026-05-14"));
  });

  it("exits 1 when id is missing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const d = makeDeps({ sub: "refresh", args: [] });

    await expect(assetsCommand(d)).rejects.toThrow("exit");
    expect(exit).toHaveBeenCalledWith(1);
  });
});

describe("unknown subcommand", () => {
  it("exits 1 with error message", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const d = makeDeps({ sub: "frobnicate" });

    await expect(assetsCommand(d)).rejects.toThrow("exit");
    expect(exit).toHaveBeenCalledWith(1);
  });
});
