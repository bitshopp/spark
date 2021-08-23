"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiniteStateMachine = void 0;
const ActionQueue_1 = require("./ActionQueue");
const StateMachineException_1 = require("./StateMachineException");
class FiniteStateMachine {
    constructor(stateMachineDescriptor, context) {
        this.actionQueue = new ActionQueue_1.Queue();
        this._stateMachineDescriptor = stateMachineDescriptor;
        this._context = context;
        if (!this._context.state)
            this._context.state = this._stateMachineDescriptor.initialState;
    }
    get context() {
        return this._context;
    }
    set context(context) {
        this._context = context;
    }
    dispatch(action) {
        return __awaiter(this, void 0, void 0, function* () {
            this.actionQueue.enqueue(action);
            if (this.actionQueue.length() >= 2)
                return;
            yield this.executeAction(this.actionQueue.peek());
        });
    }
    executeAction(action) {
        return __awaiter(this, void 0, void 0, function* () {
            const state = this._stateMachineDescriptor.states[this._context.state];
            if (!state) {
                this.executeNextAction();
                return;
            }
            const event = state[action.type];
            if (!event) {
                this.executeNextAction();
                return;
            }
            try {
                if (this._stateMachineDescriptor.beforeTransition) {
                    yield this._stateMachineDescriptor.beforeTransition(this._context, action, this);
                }
                yield event.action(this.context, action.payload, this);
                this._context.state = event.target;
                if (this._stateMachineDescriptor.afterTransition) {
                    yield this._stateMachineDescriptor.afterTransition(this._context, action, this);
                }
            }
            catch (err) {
                const { retry } = this._stateMachineDescriptor;
                let found = false;
                if (event.catch) {
                    for (const catchObject of event.catch) {
                        if (err instanceof catchObject.error) {
                            if (this._stateMachineDescriptor.beforeTransition) {
                                yield this._stateMachineDescriptor.beforeTransition(this._context, action, this);
                            }
                            yield catchObject.action(this.context, action.payload, this);
                            this._context.state = catchObject.target;
                            if (this._stateMachineDescriptor.afterTransition) {
                                yield this._stateMachineDescriptor.afterTransition(this._context, action, this);
                            }
                            found = true;
                            break;
                        }
                    }
                }
                if (!found && retry && err instanceof StateMachineException_1.StateMachineException) {
                    retry.action(this._context, action, this);
                }
            }
            finally {
                this.executeNextAction();
            }
        });
    }
    executeNextAction() {
        this.actionQueue.dequeue();
        if (!this.actionQueue.isEmpty())
            this.executeAction(this.actionQueue.peek());
    }
}
exports.FiniteStateMachine = FiniteStateMachine;
