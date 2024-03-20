import { describe, expect, it } from "@jest/globals";
import type { Executor } from "./index.js";
import { effector } from "./index.js";

type InnerEffects = {
  getSomething: (message: string) => string;
};

type OuterEffects = {
  getSomethingElse: (message: string, value: number) => Promise<string>;
  log: (message: string) => void;
} & InnerEffects;

export const inner: Executor<[string], string, InnerEffects> = async function* (
  effect,
  message,
) {
  return yield* effect("getSomething", message);
};

export const outer: Executor<[string], number, OuterEffects> = async function* (
  effect,
  firstMessage,
) {
  const message = yield* effect("getSomethingElse", firstMessage, 1);
  const result = yield* inner(effect, message);
  yield* effect("log", result);
  return 1;
};

export const effects: OuterEffects = {
  getSomethingElse: (message, value): Promise<string> =>
    Promise.resolve(`${message}: ${value}`),
  log: (message) => {
    // eslint-disable-next-line no-console
    console.log(message);
  },
  getSomething: (message) => message.split("").reverse().join(""),
};

describe("run", () => {
  it("Allows a function to be executed and returns the result.", async () => {
    await expect(effector(outer).with(effects)("log this")).resolves.toBe(1);
  });
});
