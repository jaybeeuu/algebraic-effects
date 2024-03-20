// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyParams = any[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...params: AnyParams) => any;

export type EffectRegistryBase = { [key: string]: AnyFunction };

export type EffectRequestBase<
  Type extends number | string | symbol,
  Params extends AnyParams,
> = {
  type: Type;
  params: Params;
};

export type EffectRequest<Effects extends EffectRegistryBase> = {
  [Type in keyof Effects]: EffectRequestBase<Type, Parameters<Effects[Type]>>;
}[keyof Effects];

export type EffectResults<Effects extends EffectRegistryBase> = Awaited<
  ReturnType<Effects[string]>
>;

export type Effect<Effects extends EffectRegistryBase> = <
  Type extends keyof Effects,
>(
  type: Type,
  ...params: Parameters<Effects[Type]>
) => AsyncGenerator<
  EffectRequestBase<Type, Parameters<Effects[Type]>>,
  Awaited<ReturnType<Effects[Type]>>,
  ReturnType<Effects[Type]>
>;

export type ExecutorResult<
  Result,
  Effects extends EffectRegistryBase,
> = AsyncGenerator<EffectRequest<Effects>, Result, EffectResults<Effects>>;

export type Executor<
  Params extends AnyParams,
  Result,
  Effects extends EffectRegistryBase,
> = (
  effect: Effect<Effects>,
  ...params: Params
) => ExecutorResult<Result, Effects>;

export const effect = <Effects extends EffectRegistryBase>(): Effect<Effects> =>
  async function* <Type extends keyof Effects>(
    type: Type,
    ...params: Parameters<Effects[Type]>
  ): AsyncGenerator<
    EffectRequestBase<Type, Parameters<Effects[Type]>>,
    Awaited<ReturnType<Effects[Type]>>,
    ReturnType<Effects[Type]>
  > {
    const result = yield { type, params };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/await-thenable
    return await result;
  };

interface Effector<
  Params extends AnyParams,
  Result,
  Effects extends EffectRegistryBase,
> {
  with: (effect: Effects) => (...executorParams: Params) => Promise<Result>;
}

export const effector = <
  Params extends AnyParams,
  Result,
  Effects extends EffectRegistryBase,
>(
  executor: Executor<Params, Result, Effects>,
): Effector<Params, Result, Effects> => ({
  with:
    (effects: Effects) =>
    async (...executorParams: Params): Promise<Result> => {
      const iterator = executor(effect<Effects>(), ...executorParams);
      let yielded: IteratorResult<EffectRequest<Effects>, Result>;
      let effectResult: unknown = undefined;


      while (true) {
        // @ts-expect-error We know that effectResult is the right thing to pass back to the iterator, but typescript isn't as smart as us.
        yielded = await iterator.next(effectResult);

        if (yielded.done) {
          break;
        }

        const { type, params } = yielded.value;

        effectResult = await effects[type](...params);
      }

      return yielded.value;
    },
});
