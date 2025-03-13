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
const FiniteStateMachine_1 = require("./core/FiniteStateMachine");
const StateMachineException_1 = require("./core/StateMachineException");
/**
 * Estados que representam os passos do fluxo de reserva de voo.
 */
var FlightReservationState;
(function (FlightReservationState) {
    FlightReservationState["Start"] = "Start";
    FlightReservationState["ReservationCreated"] = "ReservationCreated";
    FlightReservationState["EmailNotSent"] = "EmailNotSent";
    FlightReservationState["SeatReserved"] = "SeatReserved";
    FlightReservationState["PaymentFailed"] = "PaymentFailed";
    FlightReservationState["ReservationConfirmed"] = "ReservationConfirmed"; // T5: Reserva finalizada com sucesso após re-tentativa do pagamento extra.
})(FlightReservationState || (FlightReservationState = {}));
/**
 * Eventos que disparam as transições no fluxo.
 */
var FlightReservationEvent;
(function (FlightReservationEvent) {
    FlightReservationEvent["CreateReservation"] = "CreateReservation";
    FlightReservationEvent["SendEmail"] = "SendEmail";
    FlightReservationEvent["UpdateInventory"] = "UpdateInventory";
    FlightReservationEvent["ProcessExtraPayment"] = "ProcessExtraPayment";
    FlightReservationEvent["ReattemptExtraPayment"] = "ReattemptExtraPayment"; // T5
})(FlightReservationEvent || (FlightReservationEvent = {}));
/**
 * Contexto do fluxo de reserva de voo.
 */
class FlightReservationContext {
    constructor() {
        this.state = FlightReservationState.Start;
        // Indicadores para registrar resultados parciais.
        this.emailSent = true; // Por padrão, assume que o e-mail foi enviado.
        this.extraPaymentProcessed = false;
    }
}
/**
 * Descritor da FSM para o fluxo de SAGA "Reserva de Voo".
 */
const flightReservationDescriptor = {
    initialState: FlightReservationState.Start,
    states: {
        // T1: Criação da reserva com sucesso.
        [FlightReservationState.Start]: {
            [FlightReservationEvent.CreateReservation]: {
                target: FlightReservationState.ReservationCreated,
                action: (context, payload, fsm) => __awaiter(void 0, void 0, void 0, function* () {
                    console.log("T1: Criando reserva de voo com os detalhes:", payload);
                    // Simula sucesso na criação da reserva (ex.: gravação na base de dados)
                })
            }
        },
        // T2: Tentativa de envio de e-mail que falha.
        [FlightReservationState.ReservationCreated]: {
            [FlightReservationEvent.SendEmail]: {
                target: FlightReservationState.EmailNotSent,
                action: (context, payload, fsm) => __awaiter(void 0, void 0, void 0, function* () {
                    console.log("T2: Tentando enviar e-mail de confirmação...");
                    // Simula falha no envio de e-mail.
                    throw new StateMachineException_1.StateMachineException("Falha ao enviar e-mail devido a problemas de conexão");
                }),
                catch: [
                    {
                        error: StateMachineException_1.StateMachineException,
                        target: FlightReservationState.EmailNotSent,
                        action: (context, payload, fsm) => __awaiter(void 0, void 0, void 0, function* () {
                            console.log("C2: Registro de falha no envio de e-mail. Reserva permanece válida.");
                            context.emailSent = false;
                        })
                    }
                ]
            }
        },
        // T3: Atualização do inventário de assentos com sucesso.
        [FlightReservationState.EmailNotSent]: {
            [FlightReservationEvent.UpdateInventory]: {
                target: FlightReservationState.SeatReserved,
                action: (context, payload, fsm) => __awaiter(void 0, void 0, void 0, function* () {
                    console.log("T3: Atualizando inventário de assentos disponíveis...");
                    // Simula sucesso na atualização do inventário.
                })
            }
        },
        // T4: Tentativa de processar pagamento extra que falha.
        [FlightReservationState.SeatReserved]: {
            [FlightReservationEvent.ProcessExtraPayment]: {
                target: FlightReservationState.PaymentFailed,
                action: (context, payload, fsm) => __awaiter(void 0, void 0, void 0, function* () {
                    console.log("T4: Processando pagamento extra para serviços adicionais...", payload);
                    // Simula falha no processamento do pagamento extra.
                    throw new StateMachineException_1.StateMachineException("Falha no processamento do pagamento extra pelo gateway");
                }),
                catch: [
                    {
                        error: StateMachineException_1.StateMachineException,
                        target: FlightReservationState.PaymentFailed,
                        action: (context, payload, fsm) => __awaiter(void 0, void 0, void 0, function* () {
                            console.log("C4: Registro de falha no pagamento extra. Revertendo alterações no estado do pagamento.");
                            context.extraPaymentProcessed = false;
                        })
                    }
                ]
            }
        },
        // T5: Re-tentativa do pagamento extra com sucesso.
        [FlightReservationState.PaymentFailed]: {
            [FlightReservationEvent.ReattemptExtraPayment]: {
                target: FlightReservationState.ReservationConfirmed,
                action: (context, payload, fsm) => __awaiter(void 0, void 0, void 0, function* () {
                    console.log("T5: Re-tentando o pagamento extra para serviços adicionais...");
                    // Simula sucesso na re-tentativa do pagamento extra.
                    context.extraPaymentProcessed = true;
                })
            }
        }
    }
};
/**
 * Instancia o contexto e a FSM para a reserva de voo.
 */
const flightReservationContext = new FlightReservationContext();
const flightReservationFSM = new FiniteStateMachine_1.FiniteStateMachine(flightReservationDescriptor, flightReservationContext);
/**
 * Função que executa o fluxo de SAGA para reserva de voo.
 */
function runFlightReservationSaga() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // T1: Cria a reserva.
            yield flightReservationFSM.dispatch({
                type: FlightReservationEvent.CreateReservation,
                payload: { flight: "XY123", date: "2025-03-01", destination: "New York" }
            });
            // T2: Tenta enviar a confirmação por e-mail (falha, aciona compensação C2).
            yield flightReservationFSM.dispatch({ type: FlightReservationEvent.SendEmail, payload: {} });
            // T3: Atualiza o inventário de assentos.
            yield flightReservationFSM.dispatch({ type: FlightReservationEvent.UpdateInventory, payload: {} });
            // T4: Processa o pagamento extra (falha, aciona compensação C4).
            yield flightReservationFSM.dispatch({
                type: FlightReservationEvent.ProcessExtraPayment,
                payload: { extras: ["extra legroom", "priority boarding"] }
            });
            // T5: Re-tenta o pagamento extra com sucesso.
            yield flightReservationFSM.dispatch({
                type: FlightReservationEvent.ReattemptExtraPayment,
                payload: { extras: ["extra legroom", "priority boarding"] }
            });
        }
        catch (error) {
            console.error("Erro no fluxo de reserva de voo:", error);
        }
        finally {
            console.log("Estado Final:", flightReservationFSM.context.state);
            console.log("E-mail enviado:", flightReservationFSM.context.emailSent);
            console.log("Pagamento extra processado:", flightReservationFSM.context.extraPaymentProcessed);
        }
    });
}
// Executa o fluxo da SAGA
runFlightReservationSaga();
