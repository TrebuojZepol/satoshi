import { handleBitcoinRpcProxyRequest } from "@/lib/bitcoin/rpc-handler";

export async function POST(req: Request) {
  return handleBitcoinRpcProxyRequest(req);
}
