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
exports.EnumEvent = exports.EnumState = void 0;
const FiniteStateMachine_1 = require("./core/FiniteStateMachine");
const StateMachineException_1 = require("./core/StateMachineException");
var EnumState;
(function (EnumState) {
    EnumState["state1"] = "state1";
    EnumState["state2"] = "state2";
    EnumState["state3"] = "state3";
    EnumState["state4"] = "state4";
})(EnumState = exports.EnumState || (exports.EnumState = {}));
var EnumEvent;
(function (EnumEvent) {
    EnumEvent["event1"] = "event1";
    EnumEvent["event2"] = "event2";
    EnumEvent["event3"] = "event3";
})(EnumEvent = exports.EnumEvent || (exports.EnumEvent = {}));
class ClassContext {
    constructor() {
        this.state = EnumState.state1;
    }
}
class Exception1 extends StateMachineException_1.StateMachineException {
}
const stateMachine = new FiniteStateMachine_1.FiniteStateMachine({
    initialState: EnumState.state1,
    beforeTransition: (context) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`beforeTransition state: ${context.state}`);
    }),
    afterTransition: (context, actions) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`afterTransition state: ${context.state}`);
    }),
    retry: {
        action: (context, action) => __awaiter(void 0, void 0, void 0, function* () {
            console.log('retry');
        })
    },
    states: {
        [EnumState.state1]: {
            [EnumEvent.event1]: {
                target: EnumState.state2,
                action: (context, payload, stateMachine) => __awaiter(void 0, void 0, void 0, function* () {
                    try {
                        console.log('action state 1 event 1');
                        stateMachine.dispatch({ type: EnumEvent.event2, payload: { name: 'danillo' } });
                    }
                    catch (error) {
                        console.log(error);
                        throw new StateMachineException_1.StateMachineException();
                    }
                })
            }
        },
        [EnumState.state2]: {
            [EnumEvent.event2]: {
                target: EnumState.state3,
                catch: [
                    {
                        error: Exception1,
                        target: EnumState.state4,
                        action: (context, payload) => __awaiter(void 0, void 0, void 0, function* () {
                            console.log('rollback action 2 event 2');
                        })
                    }
                ],
                action: (context, payload) => __awaiter(void 0, void 0, void 0, function* () {
                    console.log('action state 2 event 2');
                    throw new Exception1();
                })
            }
        }
    }
}, new ClassContext());
stateMachine.dispatch({ type: EnumEvent.event1, payload: { name: 'danillo' } });
