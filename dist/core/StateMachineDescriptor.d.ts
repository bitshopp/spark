import { FiniteStateMachine } from './FiniteStateMachine';
import { StateMachineException } from './StateMachineException';
import { Action, Context, RetryActionHook, StateAction, TransitionHook } from './Types';
export declare type StateMachineDescriptor<C extends Context<S>, S extends string | number, E extends string | number> = {
    initialState: S;
    beforeTransition?: TransitionHook<C, Action<E>, FiniteStateMachine<C, S, E>>;
    afterTransition?: TransitionHook<C, Action<E>, FiniteStateMachine<C, S, E>>;
    retry?: {
        action: RetryActionHook<C, Action<E>, FiniteStateMachine<C, S, E>>;
    };
    states: {
        [Key in S]?: {
            [Key in E]?: {
                target: S;
                action: StateAction<C, FiniteStateMachine<C, S, E>>;
                catch?: Array<{
                    error: typeof StateMachineException;
                    action: StateAction<C, FiniteStateMachine<C, S, E>>;
                    target: S;
                }>;
            };
        };
    };
};
