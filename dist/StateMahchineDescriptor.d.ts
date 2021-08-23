import { Action, Context } from '.';
import { contextPayloadFunction } from './contextPayloadFunction';
import { contextActionFunction } from './contextActionFunction';
import { FiniteStateMachine } from './FiniteStateMachine';
import { StateMachineException } from './StateMachineException';
export declare type StateMahchineDescriptor<C extends Context<S>, S extends string | number, E extends string | number> = {
    initialState: S;
    beforeTransition?: contextActionFunction<C, Action<E>, FiniteStateMachine<C, S, E>>;
    afterTransition?: contextActionFunction<C, Action<E>, FiniteStateMachine<C, S, E>>;
    retry?: {
        action: contextActionFunction<C, Action<E>, FiniteStateMachine<C, S, E>>;
    };
    states: {
        [Key in S]?: {
            [Key in E]?: {
                target: S;
                action: contextPayloadFunction<C, FiniteStateMachine<C, S, E>>;
                catch?: [
                    {
                        error: typeof StateMachineException;
                        action: contextPayloadFunction<C, FiniteStateMachine<C, S, E>>;
                        target: S;
                    }
                ];
            };
        };
    };
};
