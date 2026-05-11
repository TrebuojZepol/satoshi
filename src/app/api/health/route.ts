import { NextResponse } from "next/server";
import { getBitcoinChainMode } from "@/lib/server/bitvault-env";
import { isRpcProxyAuthConfigured } from "@/lib/server/rpc-proxy-auth";
import { hasBundledPostgresMigrations, isPostgresDriver } from "@/db";

export async function GET() {
  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    bitcoinMode: getBitcoinChainMode(),
    databaseDriver: isPostgresDriver() ? "postgres" : "sqlite",
    databaseUrlConfigured: Boolean(process.env["DATABASE_URL"]?.trim()),
    postgresMigrationsBundled: hasBundledPostgresMigrations(),
    rpcProxyAuth: isRpcProxyAuthConfigured() ? "required" : "off",
  });
}
