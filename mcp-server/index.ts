import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { jwtVerify } from "jose";
import { createHash, randomUUID } from "crypto";
import { z } from "zod";
import type { Request, Response } from "express";

const PORT = parseInt(process.env.MCP_PORT ?? "3001", 10);

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
);

const connectionString =
  process.env.POSTGRES_PRISMA_URL ?? "postgres://postgres:postgres@localhost:54523/wm";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function authenticate(req: Request): Promise<string> {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }
  const token = authHeader.slice(7);

  // API key (wm_ prefix)
  if (token.startsWith("wm_")) {
    const keyHash = createHash("sha256").update(token).digest("hex");
    const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } });
    if (!apiKey) throw new Error("Invalid API key");
    await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
    return apiKey.userId;
  }

  // JWT
  const { payload } = await jwtVerify(token, JWT_SECRET);
  const userId = payload.userId as string | undefined;
  if (!userId) throw new Error("Invalid token payload");
  return userId;
}

function createServer(userId: string) {
  const server = new McpServer({
    name: "wealth-manager",
    version: "1.0.0",
  });

  server.registerTool(
    "get_accounts",
    { description: "List all financial accounts" },
    async () => {
      const accounts = await prisma.account.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
      return { content: [{ type: "text", text: JSON.stringify(accounts, null, 2) }] };
    }
  );

  server.registerTool(
    "get_transactions",
    {
      description: "List transactions with optional filters",
      inputSchema: {
        from: z.string().optional().describe("Start date (ISO 8601)"),
        to: z.string().optional().describe("End date (ISO 8601)"),
        accountId: z.string().optional().describe("Filter by account ID"),
        categoryId: z.string().optional().describe("Filter by category ID"),
        limit: z.number().optional().default(50).describe("Max results (default 50)"),
      },
    },
    async ({ from, to, accountId, categoryId, limit }) => {
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          ...(from || to
            ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
            : {}),
          ...(accountId ? { accountId } : {}),
          ...(categoryId ? { categoryId } : {}),
        },
        include: { account: true, category: true },
        orderBy: { date: "desc" },
        take: limit,
      });
      return { content: [{ type: "text", text: JSON.stringify(transactions, null, 2) }] };
    }
  );

  server.registerTool(
    "create_transaction",
    {
      description: "Create a new transaction",
      inputSchema: {
        amount: z.number().describe("Transaction amount"),
        date: z.string().describe("Transaction date (ISO 8601)"),
        description: z.string().optional().describe("Optional description"),
        accountId: z.string().describe("Account ID"),
        categoryId: z.string().describe("Category ID"),
      },
    },
    async ({ amount, date, description, accountId, categoryId }) => {
      const transaction = await prisma.transaction.create({
        data: { amount, date: new Date(date), description, accountId, categoryId, userId },
        include: { account: true, category: true },
      });
      return { content: [{ type: "text", text: JSON.stringify(transaction, null, 2) }] };
    }
  );

  server.registerTool(
    "get_categories",
    {
      description: "List all transaction categories",
      inputSchema: {
        type: z
          .enum(["income", "expense", "payable", "receivable"])
          .optional()
          .describe("Filter by type"),
      },
    },
    async ({ type }) => {
      const categories = await prisma.transactionCategory.findMany({
        where: { userId, ...(type ? { type } : {}) },
        orderBy: { name: "asc" },
      });
      return { content: [{ type: "text", text: JSON.stringify(categories, null, 2) }] };
    }
  );

  server.registerTool(
    "get_budgets",
    { description: "List all budgets" },
    async () => {
      const budgets = await prisma.budget.findMany({
        where: { userId },
        include: { account: true },
        orderBy: { createdAt: "desc" },
      });
      return { content: [{ type: "text", text: JSON.stringify(budgets, null, 2) }] };
    }
  );

  server.registerTool(
    "get_summary",
    {
      description: "Get financial summary for a given month",
      inputSchema: {
        year: z.number().describe("Year (e.g. 2026)"),
        month: z.number().min(1).max(12).describe("Month (1–12)"),
      },
    },
    async ({ year, month }) => {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      const transactions = await prisma.transaction.findMany({
        where: { userId, date: { gte: start, lte: end } },
        include: { category: true },
      });
      let totalIncome = 0;
      let totalExpense = 0;
      const byCategory: Record<string, number> = {};
      for (const t of transactions) {
        if (t.category.type === "income") totalIncome += t.amount;
        else if (t.category.type === "expense") totalExpense += t.amount;
        byCategory[t.category.name] = (byCategory[t.category.name] ?? 0) + t.amount;
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                period: `${year}-${String(month).padStart(2, "0")}`,
                totalIncome,
                totalExpense,
                net: totalIncome - totalExpense,
                transactionCount: transactions.length,
                byCategory,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_exchange_rates",
    { description: "List all exchange rates" },
    async () => {
      const rates = await prisma.exchangeRate.findMany({ where: { userId } });
      return { content: [{ type: "text", text: JSON.stringify(rates, null, 2) }] };
    }
  );

  return server;
}

const app = createMcpExpressApp({ host: "0.0.0.0" });

const sessions = new Map<string, StreamableHTTPServerTransport>();

async function handleMcp(req: Request, res: Response) {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  // Resume existing session (already authenticated)
  if (sessionId && sessions.has(sessionId)) {
    const transport = sessions.get(sessionId)!;
    await transport.handleRequest(req, res, req.body);
    return;
  }

  // New session — authenticate first
  let userId: string;
  try {
    userId = await authenticate(req);
  } catch (err) {
    res.status(401).json({ error: (err as Error).message });
    return;
  }

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (id) => {
      sessions.set(id, transport);
    },
  });

  transport.onclose = () => {
    const id = transport.sessionId;
    if (id) sessions.delete(id);
  };

  await createServer(userId).connect(transport);
  await transport.handleRequest(req, res, req.body);
}

app.post("/mcp", handleMcp);

app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({ error: "Invalid or missing session ID" });
    return;
  }
  await sessions.get(sessionId)!.handleRequest(req, res);
});

app.delete("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const transport = sessions.get(sessionId)!;
  await transport.handleRequest(req, res);
  sessions.delete(sessionId);
});

app.listen(PORT, () => {
  console.log(`MCP server running on http://localhost:${PORT}/mcp`);
});
