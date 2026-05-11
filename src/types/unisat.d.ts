export {};

declare global {
  interface Window {
    unisat?: {
      requestAccounts: () => Promise<string[]>;
      getAccounts: () => Promise<string[]>;
      getBalance: () => Promise<number | { confirmed: number; unconfirmed: number; total: number }>;
      getNetwork?: () => Promise<string>;
      signPsbt: (
        psbt: string,
        options?: { autoFinalized?: boolean },
      ) => Promise<string>;
      pushPsbt: (psbt: string) => Promise<string>;
    };
  }
}
