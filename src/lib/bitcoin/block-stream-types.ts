export type BlockStreamPayload = {
  height: number;
  nextBlockInMs: number;
  progress: number;
  blockTimeMs: number;
  serverTimeMs: number;
  source: "mock" | "rpc";
  error?: string;
};
