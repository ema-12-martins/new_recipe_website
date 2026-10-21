import { describe, expect, it } from "vitest";

import en from "@/i18n/messages/en.json";
import pt from "@/i18n/messages/pt.json";

type Messages = { [key: string]: string | Messages };

function keyPaths(messages: Messages, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [path] : [path, ...keyPaths(value, path)];
  });
}

function leaves(messages: Messages, prefix = ""): [string, string][] {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [[path, value] as [string, string]] : leaves(value, path);
  });
}

describe("pt/en message files", () => {
  it("have exactly the same nested key set", () => {
    expect(keyPaths(pt).sort()).toEqual(keyPaths(en).sort());
  });

  it.each([
    ["pt", pt],
    ["en", en],
  ] as const)("%s has no empty message strings", (_locale, messages) => {
    const empty = leaves(messages).filter(([, value]) => value.trim() === "");
    expect(empty).toEqual([]);
  });

  it("detects a missing key (guard self-test)", () => {
    const broken: Messages = { common: { appName: "x" } };
    expect(keyPaths(broken)).not.toEqual(keyPaths(en));
  });
});
