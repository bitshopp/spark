import { FiniteStateMachine } from "./FiniteStateMachine";
import { StateMachineException } from "./StateMachineException";

export type Action<Event extends string | number> = {
    type: Event;
    payload?: any;
  };
  
  export interface Context<State> {
    state: State;
    [key: string]: any;
  }
  
  export type TransitionHook<C, A, M> = (context: C, action: A, fsm: M) => Promise<void>;
  
//   export type StateAction<C, M> = (context: C, payload: any, fsm: M) => Promise<void>;

export type StateAction<C, M, R = any> = (context: C, payload: any, fsm: M) => Promise<R>;

  interface Compensation<C extends Context<S>, S extends string | number, E extends string | number> {
    error: typeof StateMachineException;
    target: S;
    action: StateAction<C, FiniteStateMachine<C, S, E>>;
    condition?: (error: any, context: C) => boolean;
  }
  
  export interface SagaStep<C extends Context<S>, S extends string | number, E extends string | number, R = void> {
    from: S;
    event: E;
    to: S | ((result: R, context: C) => S);
    action: StateAction<C, FiniteStateMachine<C, S, E>, R>;
    compensations?: Compensation<C, S, E>[];
  }
  
  