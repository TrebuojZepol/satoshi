import path from "node:path";
import { describe, expect, it } from "vitest";
import { hasBundledPostgresMigrations, POSTGRES_MIGRATIONS_FOLDER } from "./index";

describe("postgres migrations bundle", () => {
  it("exposes a stable migrations directory", () => {
    expect(POSTGRES_MIGRATIONS_FOLDER).toContain(`${path.sep}drizzle${path.sep}postgres`);
  });

  it("ships a journal so CI and production can migrate", () => {
    expect(hasBundledPostgresMigrations()).toBe(true);
  });
});
