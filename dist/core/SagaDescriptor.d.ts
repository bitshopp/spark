import { FiniteStateMachine } from './FiniteStateMachine';
import { StateMachineDescriptor } from './StateMachineDescriptor';
import { Action, Context, SagaStep, TransitionHook } from './Types';
export declare function createSagaDescriptor<C extends Context<S>, S extends string | number, E extends string | number>(initialState: S, steps: SagaStep<C, S, E>[], beforeTransition?: TransitionHook<C, Action<E>, FiniteStateMachine<C, S, E>>, afterTransition?: TransitionHook<C, Action<E>, FiniteStateMachine<C, S, E>>, retry?: {
    action: TransitionHook<C, Action<E>, FiniteStateMachine<C, S, E>>;
}): StateMachineDescriptor<C, S, E>;
