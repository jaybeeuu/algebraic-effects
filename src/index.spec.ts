import { describe, expect, it } from '@jest/globals';
import { AnyFunction, Executor, run } from './index.js'

type Effects = {
  echo: (message: string, value: number) => Promise<string>;
  log: (message: string) => void;
}

export const executor: Executor<[string], number, Effects> = async function* (
  effect,
  firstMessage
) {
  const message = yield* effect('echo', firstMessage, 1);
  yield* effect('log', message);
  return 1;
};

export const effects: Effects = {
  log: (message: string) => console.log(message),
  echo: (message: string, value: number): Promise<string> => Promise.resolve(`${message}: ${value}`)
};

describe("run", () => {
  it("Allows a function to be executed and returns the result.", () => {
    expect(run(executor)(effects)("log this")).resolves.toBe(1);
  });
});
