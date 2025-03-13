"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SagaBuilder = void 0;
const SagaDescriptor_1 = require("./SagaDescriptor");
class SagaBuilder {
    constructor(initialState) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.steps = [];
        this.initialState = initialState;
    }
    addStep(step) {
        this.steps.push(step);
        return this;
    }
    build() {
        return SagaDescriptor_1.createSagaDescriptor(this.initialState, this.steps);
    }
}
exports.SagaBuilder = SagaBuilder;
