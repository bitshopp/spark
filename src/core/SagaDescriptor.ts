import { StateMachineDescriptor } from "./StateMachineDescriptor";
import { Context, SagaStep } from "./Types";

export function createSagaDescriptor<C extends Context<S>, S extends string | number, E extends string | number>(
    initialState: S,
    steps: SagaStep<C, S, E>[]
  ): StateMachineDescriptor<C, S, E> {
    const states: any = {};
  
    steps.forEach((step) => {
      if (!states[step.from]) {
        states[step.from] = {};
      }
  
      states[step.from][step.event] = {
        target: step.to,
        action: step.action,
        ...(step.compensations && {
          catch: step.compensations.map(comp => ({
            error: comp.error,
            target: comp.target,
            action: comp.action
          }))
        })
      };
    });
  
    return {
      initialState,
      states
    };
  }