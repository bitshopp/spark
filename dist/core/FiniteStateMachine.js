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
const Queue_1 = require("./Queue");
const StateMachineException_1 = require("./StateMachineException");
class FiniteStateMachine {
    constructor(stateMachineDescriptor, context) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.actionQueue = new Queue_1.Queue();
        this._stateMachineDescriptor = stateMachineDescriptor;
        this._context = context;
        if (!this._context.state) {
            this._context.state = this._stateMachineDescriptor.initialState;
        }
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
            if (this.actionQueue.length() >= 2) {
                return;
            }
            yield this.executeAction(this.actionQueue.peek());
        });
    }
    abort(action) {
        return __awaiter(this, void 0, void 0, function* () {
            this.actionQueue.clear();
            yield this.dispatch(action);
        });
    }
    executeAction(action) {
        return __awaiter(this, void 0, void 0, function* () {
            const stateDef = this._stateMachineDescriptor.states[this._context.state];
            if (!stateDef) {
                this.executeNextAction();
                return;
            }
            const event = stateDef[action.type];
            if (!event) {
                this.executeNextAction();
                return;
            }
            try {
                if (this._stateMachineDescriptor.beforeTransition) {
                    yield this._stateMachineDescriptor.beforeTransition(this._context, action, this);
                }
                // Executa a ação e captura o resultado
                const result = yield event.action(this._context, action.payload, this);
                // Se o target for uma função, determina o estado dinamicamente
                const nextState = typeof event.target === 'function'
                    ? event.target(result, this._context)
                    : event.target;
                this._context.state = nextState;
                if (this._stateMachineDescriptor.afterTransition) {
                    yield this._stateMachineDescriptor.afterTransition(this._context, action, this);
                }
            }
            catch (error) {
                let handled = false;
                if (event.catch) {
                    for (const catchBlock of event.catch) {
                        if (error instanceof catchBlock.error) {
                            handled = true;
                            if (this._stateMachineDescriptor.beforeTransition) {
                                yield this._stateMachineDescriptor.beforeTransition(this._context, action, this);
                            }
                            yield catchBlock.action(this._context, action.payload, this);
                            this._context.state = catchBlock.target;
                            if (this._stateMachineDescriptor.afterTransition) {
                                yield this._stateMachineDescriptor.afterTransition(this._context, action, this);
                            }
                            break;
                        }
                    }
                }
                if (!handled) {
                    const { retry } = this._stateMachineDescriptor;
                    if (retry && error instanceof StateMachineException_1.StateMachineException) {
                        retry.action(this._context, action, this, error);
                    }
                }
            }
            finally {
                this.executeNextAction();
            }
        });
    }
    executeNextAction() {
        this.actionQueue.dequeue();
        if (!this.actionQueue.isEmpty()) {
            this.executeAction(this.actionQueue.peek());
        }
    }
    // Métodos para suspensão e retomada (Item 9)
    getStateSnapshot() {
        return {
            context: this._context,
            queue: this.actionQueue.getElements(),
        };
    }
    // eslin-disable-next-line @typescript-eslint/no-explicit-any
    loadStateSnapshot(snapshot) {
        this._context = snapshot.context;
        this.actionQueue.setElements(snapshot.queue);
    }
}
exports.FiniteStateMachine = FiniteStateMachine;
