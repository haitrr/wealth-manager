import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createHash, randomUUID } from "crypto";
import { jwtVerify } from "jose";
import { z } from "zod";
import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/db";

export const dynamic = "force-dynamic";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
);

const sessions = new Map<string, WebStandardStreamableHTTPServerTransport>();

async function authenticate(req: Request): Promise<string> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Missing or invalid Authorization header");
  const token = authHeader.slice(7);

  if (token.startsWith("wm_")) {
    const keyHash = createHash("sha256").update(token).digest("hex");
    const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } });
    if (!apiKey) throw new Error("Invalid API key");
    await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
    return apiKey.userId;
  }

  const { payload } = await jwtVerify(token, JWT_SECRET);
  const userId = payload.userId as string | undefined;
  if (!userId) throw new Error("Invalid token payload");
  return userId;
}

function buildServer(userId: string) {
  const server = new McpServer({ name: "wealth-manager", version: "1.0.0" });

  server.registerTool("get_accounts", { description: "List all financial accounts" }, async () => {
    const accounts = await prisma.account.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
    return { content: [{ type: "text", text: JSON.stringify(accounts, null, 2) }] };
  });

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
          ...(from || to ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
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
        type: z.enum(["income", "expense"]).optional().describe("Filter by type"),
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

  server.registerTool("get_budgets", { description: "List all budgets" }, async () => {
    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { account: true },
      orderBy: { createdAt: "desc" },
    });
    return { content: [{ type: "text", text: JSON.stringify(budgets, null, 2) }] };
  });

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
        content: [{ type: "text", text: JSON.stringify({ period: `${year}-${String(month).padStart(2, "0")}`, totalIncome, totalExpense, net: totalIncome - totalExpense, transactionCount: transactions.length, byCategory }, null, 2) }],
      };
    }
  );

  server.registerTool("get_exchange_rates", { description: "List all exchange rates" }, async () => {
    const rates = await prisma.exchangeRate.findMany({ where: { userId } });
    return { content: [{ type: "text", text: JSON.stringify(rates, null, 2) }] };
  });

  return server;
}

async function handle(req: NextRequest): Promise<Response> {
  const sessionId = req.headers.get("mcp-session-id") ?? undefined;

  if (sessionId && sessions.has(sessionId)) {
    return sessions.get(sessionId)!.handleRequest(req);
  }

  let userId: string;
  try {
    userId = await authenticate(req);
  } catch (err) {
    const origin = new URL(req.url).origin;
    return Response.json({ error: (err as Error).message }, {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`,
      },
    });
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (id) => { sessions.set(id, transport); },
  });

  transport.onclose = () => {
    const id = transport.sessionId;
    if (id) sessions.delete(id);
  };

  await buildServer(userId).connect(transport);
  return transport.handleRequest(req);
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, mcp-session-id",
    },
  });
}

export { handle as GET, handle as POST, handle as DELETE };
