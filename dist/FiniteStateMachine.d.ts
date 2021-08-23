import { Action } from './Action';
import { Context } from './Context';
import { StateMahchineDescriptor } from './StateMahchineDescriptor';
export declare class FiniteStateMachine<C extends Context<S>, S extends string | number, E extends string | number> {
    private _context;
    private actionQueue;
    private _stateMachineDescriptor;
    constructor(stateMachineDescriptor: StateMahchineDescriptor<C, S, E>, context: C);
    get context(): C;
    set context(context: C);
    dispatch(action: Action<E>): Promise<void>;
    private executeAction;
    private executeNextAction;
}
