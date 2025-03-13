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
const SagaBuilder_1 = require("./core/SagaBuilder");
const StateMachineException_1 = require("./core/StateMachineException");
// // -------------------------------------------
// Exemplo de implementação do fluxo de reserva de voo
// -------------------------------------------
/**
  Transações SAGAS admitem os seguintes padrões de execução:
  
  01 - Sequência Linear de Transações (T1 → T2 → T3):
  02 - Transações com Compensações (T1 → T2 → C2):
  03 - Caminho Alternativo de Compensação (T1 falha → C1):
  04 - Interleaving de Transações (T1, T2 simultâneos → T3):
  05 - Contingência Pelo Resultado de Transações (fluxo condicional: T1 → T2 (sucesso) → T3; T1 → C1 (falha)):
  06 - Inclusão de Transações Adicionais (T1 → T2 → T3; se T3 falhar, adiciona T4):
  07 - Execução de Transações em Paralelo (T1 e T2 em paralelo, com compensações C1 e C2):
  08 - Rollback de Transações (T1 → T2; comando de rollback → retorno a T1 e reexecução):
  09 - Suspensão e Retomada (T1 suspenso → retomada posterior de T1):
  10 - Criação de Save-points (T1 → sp1 → T2 → sp2; rollback para sp1 se necessário):
  
  Nossa implementação suporta atualmente os tipos de fluxos: 01, 02, 03, 05, 06, 09.
 
  Fluxo de Transações:

   graph TD
  A[Start] -->|T1: CreateReservation| B{Resultado da Reserva?}
  B -- Sucesso --> C[ReservationCreated]
  B -- Falha --> D[ReservationFailed]
  C -->|T2: SendEmail| E{Envio de Email?}
  E -- Sucesso --> F[Email Enviado]
  E -- Falha --> G[C2: Compensação – EmailNotSent]
  F --> H[T3: UpdateInventory]
  G --> H[T3: UpdateInventory]
  H --> I[SeatReserved]
  I -->|T4: ProcessExtraPayment| J[PaymentFailed]
  J -->|T4a: AdditionalPayment| K[ReservationConfirmed]
 */
var FlightReservationState;
(function (FlightReservationState) {
    FlightReservationState["Start"] = "Start";
    FlightReservationState["ReservationCreated"] = "ReservationCreated";
    FlightReservationState["ReservationFailed"] = "ReservationFailed";
    FlightReservationState["EmailNotSent"] = "EmailNotSent";
    FlightReservationState["SeatReserved"] = "SeatReserved";
    FlightReservationState["PaymentFailed"] = "PaymentFailed";
    FlightReservationState["ReservationConfirmed"] = "ReservationConfirmed";
})(FlightReservationState || (FlightReservationState = {}));
var FlightReservationEvent;
(function (FlightReservationEvent) {
    FlightReservationEvent["CreateReservation"] = "CreateReservation";
    FlightReservationEvent["SendEmail"] = "SendEmail";
    FlightReservationEvent["UpdateInventory"] = "UpdateInventory";
    FlightReservationEvent["ProcessExtraPayment"] = "ProcessExtraPayment";
    FlightReservationEvent["ReattemptExtraPayment"] = "ReattemptExtraPayment";
    FlightReservationEvent["AdditionalPayment"] = "AdditionalPayment";
})(FlightReservationEvent || (FlightReservationEvent = {}));
// Contexto do fluxo de reserva de voo
class FlightReservationContext {
    constructor() {
        this.state = FlightReservationState.Start;
        this.emailSent = true;
        this.extraPaymentProcessed = false;
    }
}
// Definição dos passos usando o SagaBuilder
const sagaBuilder = new SagaBuilder_1.SagaBuilder(FlightReservationState.Start);
// ─────────────────────────────────────────────
// **Item 5 – Contingência pelo Resultado de Transações (T1)**
// Cria a reserva e, dependendo do resultado (simulado aqui com uma chance), direciona para
// ReservationCreated (sucesso) ou ReservationFailed (falha).
sagaBuilder.addStep({
    from: FlightReservationState.Start,
    event: FlightReservationEvent.CreateReservation,
    to: (result, ctx) => result
        ? FlightReservationState.ReservationCreated
        : FlightReservationState.ReservationFailed,
    action: (context, payload, fsm) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("T1: Creating reservation with payload:", payload);
        // Simula a criação da reserva (80% de chance de sucesso)
        const success = Math.random() > 0.2;
        context.reservationData = Object.assign(Object.assign({}, payload), { confirmed: success });
        return success;
    }),
});
// ─────────────────────────────────────────────
// **Item 3 – Caminho Alternativo de Compensação (T2)**
// Tenta enviar o e-mail. Se falhar, a compensação direciona para EmailNotSent.
sagaBuilder.addStep({
    from: FlightReservationState.ReservationCreated,
    event: FlightReservationEvent.SendEmail,
    to: FlightReservationState.SeatReserved,
    action: (context, payload, fsm) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("T2: Sending confirmation email...");
        // Simula falha no envio do e-mail
        throw new StateMachineException_1.StateMachineException("Email service not available");
    }),
    compensations: [
        {
            error: StateMachineException_1.StateMachineException,
            target: FlightReservationState.EmailNotSent,
            action: (context, payload, fsm) => __awaiter(void 0, void 0, void 0, function* () {
                console.log("C2: Email sending failed. Logging failure and moving to alternative path.");
                context.emailSent = false;
            }),
        },
    ],
});
// ─────────────────────────────────────────────
// **Item 9 – Suspensão e Retomada (T3)**
// Atualiza o inventário e, durante a execução, simula uma suspensão usando snapshot.
sagaBuilder.addStep({
    // Este passo é usado para o ramo de compensação (caso o e-mail falhe)
    from: FlightReservationState.EmailNotSent,
    event: FlightReservationEvent.UpdateInventory,
    to: FlightReservationState.SeatReserved,
    action: (context, payload, fsm) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("T3: Updating seat inventory...");
        // Simula a suspensão: captura o snapshot e aguarda um tempo
        const snapshot = fsm.getStateSnapshot();
        console.log("FSM suspended. Snapshot taken:", snapshot);
        yield new Promise((resolve) => setTimeout(resolve, 1000)); // pausa de 1s
        // Retoma a FSM a partir do snapshot
        fsm.loadStateSnapshot(snapshot);
        console.log("FSM resumed from snapshot.");
    }),
});
// Também adicionamos um passo para o fluxo normal (caso o e-mail tivesse sido enviado)
sagaBuilder.addStep({
    from: FlightReservationState.ReservationCreated,
    event: FlightReservationEvent.UpdateInventory,
    to: FlightReservationState.SeatReserved,
    action: (context, payload, fsm) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("T3: Updating seat inventory...");
    }),
});
// ─────────────────────────────────────────────
// **Item 6 – Inclusão de Transações Adicionais (T4)**
// Processa o pagamento extra. Se falhar, a compensação dispara uma transação adicional.
sagaBuilder.addStep({
    from: FlightReservationState.SeatReserved,
    event: FlightReservationEvent.ProcessExtraPayment,
    to: FlightReservationState.PaymentFailed,
    action: (context, payload, fsm) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("T4: Processing extra payment...", payload);
        // Simula falha no pagamento extra
        throw new StateMachineException_1.StateMachineException("Extra payment processing failed");
    }),
    compensations: [
        {
            error: StateMachineException_1.StateMachineException,
            target: FlightReservationState.PaymentFailed,
            action: (context, payload, fsm) => __awaiter(void 0, void 0, void 0, function* () {
                console.log("C4: Extra payment failed. Initiating additional payment transaction.");
                // Dispara a transação adicional (T4a)
                yield fsm.dispatch({
                    type: FlightReservationEvent.AdditionalPayment,
                    payload: { retry: true },
                });
            }),
        },
    ],
});
// Transação adicional T4a – processa o pagamento extra novamente
sagaBuilder.addStep({
    from: FlightReservationState.PaymentFailed,
    event: FlightReservationEvent.AdditionalPayment,
    to: FlightReservationState.ReservationConfirmed,
    action: (context, payload, fsm) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("T4a: Processing additional payment retry...", payload);
        // Simula sucesso na re-tentativa
        context.extraPaymentProcessed = true;
    }),
});
// Constrói o descriptor da saga
const flightReservationDescriptor = sagaBuilder.build();
// Cria o contexto e a FSM
const flightReservationContext = new FlightReservationContext();
const flightReservationFSM = new FiniteStateMachine_1.FiniteStateMachine(flightReservationDescriptor, flightReservationContext);
// Função para executar a saga
function runFlightReservationSaga() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // T1: Cria a reserva
            yield flightReservationFSM.dispatch({
                type: FlightReservationEvent.CreateReservation,
                payload: { flight: "XY123", date: "2025-03-01", destination: "New York" },
            });
            // Se T1 falhar, a FSM estará em ReservationFailed e encerramos a saga
            if (flightReservationFSM.context.state ===
                FlightReservationState.ReservationFailed) {
                console.log("Reservation failed. Saga terminated.");
                return;
            }
            // T2: Tenta enviar e-mail
            yield flightReservationFSM.dispatch({
                type: FlightReservationEvent.SendEmail,
                payload: {},
            });
            // T3: Atualiza inventário – o passo adequado (normal ou compensatório) será executado conforme o estado atual
            yield flightReservationFSM.dispatch({
                type: FlightReservationEvent.UpdateInventory,
                payload: {},
            });
            // T4: Processa o pagamento extra – se falhar, a compensação dispara T4a
            yield flightReservationFSM.dispatch({
                type: FlightReservationEvent.ProcessExtraPayment,
                payload: { extras: ["extra legroom", "priority boarding"] },
            });
            // T4a será disparado automaticamente se T4 falhar
        }
        catch (error) {
            console.error("Error in flight reservation saga:", error);
        }
        finally {
            console.log("Final State:", flightReservationFSM.context.state);
            console.log("Email Sent:", flightReservationFSM.context.emailSent);
            console.log("Extra Payment Processed:", flightReservationFSM.context.extraPaymentProcessed);
        }
    });
}
// Executa a saga
runFlightReservationSaga();
