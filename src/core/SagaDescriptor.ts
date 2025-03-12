import { FiniteStateMachine } from './FiniteStateMachine';
import { StateMachineDescriptor } from './StateMachineDescriptor';
import { Action, Context, SagaStep, TransitionHook } from './Types';

export function createSagaDescriptor<
  C extends Context<S>,
  S extends string | number,
  E extends string | number,
>(
  initialState: S,
  steps: SagaStep<C, S, E>[],
  beforeTransition?: TransitionHook<C, Action<E>, FiniteStateMachine<C, S, E>>,
  afterTransition?: TransitionHook<C, Action<E>, FiniteStateMachine<C, S, E>>,
  retry?: {
    action: TransitionHook<C, Action<E>, FiniteStateMachine<C, S, E>>;
  },
): StateMachineDescriptor<C, S, E> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const states: any = {};

  for (const step of steps) {
    if (!states[step.from]) {
      states[step.from] = {};
    }

    states[step.from][step.event] = {
      target: step.to,
      action: step.action,
      ...(step.compensations && {
        catch: step.compensations.map((comp) => ({
          error: comp.error,
          target: comp.target,
          action: comp.action,
        })),
      }),
    };
  }

  return {
    initialState,
    beforeTransition,
    afterTransition,
    retry,
    states,
  };
}