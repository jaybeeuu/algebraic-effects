export type AnyFunction = (...params: any[]) => any;

export type EffectRequestBase<Type extends number | String | symbol, Params extends any[]> = {
  type: Type,
  params: Params
};

export type EffectRequest<Effects extends Record<string, AnyFunction>> = {
  [Type in keyof Effects]: EffectRequestBase<Type, Parameters<Effects[Type]>>
}[keyof Effects];

export type EffectResults<Effects extends Record<string, AnyFunction>> = Awaited<ReturnType<Effects[string]>>;

export type ExecutorResult<Result, Effects extends Record<string, AnyFunction>> = AsyncGenerator<
  EffectRequest<Effects>,
  Result,
  EffectResults<Effects>
>;

export type Effect<Effects extends Record<string, AnyFunction>> = <Type extends keyof Effects>(
  type: Type,
  ...params: Parameters<Effects[Type]>
) => AsyncGenerator<EffectRequestBase<Type, Parameters<Effects[Type]>>, Awaited<ReturnType<Effects[Type]>>, ReturnType<Effects[Type]>>;

export type Executor<Params extends any[], Result, Effects extends Record<string, AnyFunction>> = (
  effect: Effect<Effects>,
  ...params: Params
) => ExecutorResult<Result, Effects>;

export const effect = <Effects extends Record<string, AnyFunction>>(): Effect<Effects> => async function* <Type extends keyof Effects>(
  type: Type,
  ...params: Parameters<Effects[Type]>
): AsyncGenerator<EffectRequestBase<Type, Parameters<Effects[Type]>>, Awaited<ReturnType<Effects[Type]>>, ReturnType<Effects[Type]>> {
  const result = yield { type, params }
  return await result;
}

export const run = <Params extends any[], Result, Effects extends Record<string, AnyFunction>>(
  executor: Executor<Params, Result, Effects>
): (effects: Effects) => (...params: Params) => Promise<Result> => (
  effects
) => async (
  ...params
) => {
      const iterator = executor(effect<Effects>(), ...params);
      let yielded: IteratorResult<EffectRequest<Effects>, Result>;
      let effectResult: unknown = undefined;

      while (true) {
        // @ts-expect-error
        yielded = await iterator.next(effectResult);

        if (yielded.done) {
          break;
        }

        const { type, params } = yielded.value;

        effectResult = await effects[type](...params);
      }

      return yielded.value;
    };