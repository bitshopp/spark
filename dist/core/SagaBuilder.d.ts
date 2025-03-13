import { StateMachineDescriptor } from './StateMachineDescriptor';
import { Context, SagaStep } from './Types';
export declare class SagaBuilder<C extends Context<S>, S extends string | number, E extends string | number> {
    private initialState;
    private steps;
    constructor(initialState: S);
    addStep<R = void>(step: SagaStep<C, S, E, R>): this;
    build(): StateMachineDescriptor<C, S, E>;
}
