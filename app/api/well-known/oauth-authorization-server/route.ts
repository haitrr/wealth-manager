import { NextRequest } from "next/server";

export function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  return Response.json({
    issuer: origin,
    // No token_endpoint or registration_endpoint — we use API keys, not OAuth
  });
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
