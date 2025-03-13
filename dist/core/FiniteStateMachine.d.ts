import { StateMachineDescriptor } from './StateMachineDescriptor';
import { Context } from './Types';
export declare class FiniteStateMachine<C extends Context<S>, S extends string | number, E extends string | number> {
    private _context;
    private actionQueue;
    private _stateMachineDescriptor;
    constructor(stateMachineDescriptor: StateMachineDescriptor<C, S, E>, context: C);
    get context(): C;
    set context(context: C);
    dispatch(action: {
        type: E;
        payload?: unknown;
    }): Promise<void>;
    abort(action: {
        type: E;
        payload?: unknown;
    }): Promise<void>;
    private executeAction;
    private executeNextAction;
    getStateSnapshot(): unknown;
    loadStateSnapshot(snapshot: any): void;
}
