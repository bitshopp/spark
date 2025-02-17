import { createSagaDescriptor } from "./SagaDescriptor";
import { StateMachineDescriptor } from "./StateMachineDescriptor";
import { Context, SagaStep } from "./Types";

export class SagaBuilder<C extends Context<S>, S extends string | number, E extends string | number> {
    private initialState: S;
    private steps: SagaStep<C, S, E, any>[] = [];
  
    constructor(initialState: S) {
      this.initialState = initialState;
    }
  
    addStep<R = void>(step: SagaStep<C, S, E, R>): this {
      this.steps.push(step);
      return this;
    }
  
    build(): StateMachineDescriptor<C, S, E> {
      return createSagaDescriptor(this.initialState, this.steps);
    }
  }
  