export type Action<Event extends string | number> = {
    type: Event;
    payload?: any;
  };
  
  export interface Context<State> {
    state: State;
    [key: string]: any;
  }
  
  export type TransitionHook<C, A, M> = (context: C, action: A, fsm: M) => Promise<void>;
  
  export type StateAction<C, M> = (context: C, payload: any, fsm: M) => Promise<void>;
  