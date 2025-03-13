"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineException = void 0;
class StateMachineException {
    constructor(message = 'State Machine Exception', stack) {
        this.message = message;
        this.name = 'StateMachineException';
        this.stack = stack;
    }
}
exports.StateMachineException = StateMachineException;
