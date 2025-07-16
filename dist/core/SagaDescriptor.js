"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSagaDescriptor = void 0;
function createSagaDescriptor(initialState, steps, beforeTransition, afterTransition, retry) {
    const states = {};
    steps.forEach((step) => {
        if (!states[step.from]) {
            states[step.from] = {};
        }
        states[step.from][step.event] = Object.assign({ target: step.to, action: step.action }, (step.compensations && {
            catch: step.compensations.map(comp => ({
                error: comp.error,
                target: comp.target,
                action: comp.action
            }))
        }));
    });
    return {
        initialState,
        beforeTransition,
        afterTransition,
        retry,
        states
    };
}
exports.createSagaDescriptor = createSagaDescriptor;
