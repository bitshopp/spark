import { FiniteStateMachine } from "./core/FiniteStateMachine";
import { SagaBuilder } from "./core/SagaBuilder";
import { StateMachineException } from "./core/StateMachineException";
import { Context } from "./core/Types";

enum FlightReservationState {
    Start = 'Start',
    ReservationCreated = 'ReservationCreated',
    ReservationFailed = 'ReservationFailed',
    EmailNotSent = 'EmailNotSent',
    SeatReserved = 'SeatReserved',
    PaymentFailed = 'PaymentFailed',
    ReservationConfirmed = 'ReservationConfirmed'
  }
  
  enum FlightReservationEvent {
    CreateReservation = 'CreateReservation',
    SendEmail = 'SendEmail',
    UpdateInventory = 'UpdateInventory',
    ProcessExtraPayment = 'ProcessExtraPayment',
    ReattemptExtraPayment = 'ReattemptExtraPayment',
    AdditionalPayment = 'AdditionalPayment'
  }
  
  // Contexto do fluxo de reserva de voo
  
  class FlightReservationContext implements Context<FlightReservationState> {
    state: FlightReservationState = FlightReservationState.Start;
    emailSent: boolean = true;
    extraPaymentProcessed: boolean = false;
    reservationData?: any;
  }
  
  // Definição dos passos usando o SagaBuilder
  
  const sagaBuilder = new SagaBuilder<FlightReservationContext, FlightReservationState, FlightReservationEvent>(
    FlightReservationState.Start
  );
  
  // ─────────────────────────────────────────────
  // **Item 5 – Contingência pelo Resultado de Transações (T1)**
  // Cria a reserva e, dependendo do resultado (simulado aqui com uma chance), direciona para
  // ReservationCreated (sucesso) ou ReservationFailed (falha).

  sagaBuilder.addStep<boolean>({
    from: FlightReservationState.Start,
    event: FlightReservationEvent.CreateReservation,
    to: (result, ctx) =>
    result ? FlightReservationState.ReservationCreated : FlightReservationState.ReservationFailed,
    action: async (context, payload, fsm) => {
    console.log("T1: Creating reservation with payload:", payload);
    // Simula a criação da reserva (80% de chance de sucesso)
    const success = Math.random() > 0.2;
    context.reservationData = { ...payload, confirmed: success };
    return success;
    }
  });
  
  // ─────────────────────────────────────────────
  // **Item 3 – Caminho Alternativo de Compensação (T2)**
  // Tenta enviar o e-mail. Se falhar, a compensação direciona para EmailNotSent.
  sagaBuilder.addStep({
    from: FlightReservationState.ReservationCreated,
    event: FlightReservationEvent.SendEmail,
    to: FlightReservationState.SeatReserved, // fluxo normal se o e-mail fosse enviado com sucesso
    action: async (context, payload, fsm) => {
      console.log("T2: Sending confirmation email...");
      // Simula falha no envio do e-mail
      throw new StateMachineException("Email service not available");
    },
    compensations: [
      {
        error: StateMachineException,
        target: FlightReservationState.EmailNotSent, // caminho alternativo
        action: async (context, payload, fsm) => {
          console.log("C2: Email sending failed. Logging failure and moving to alternative path.");
          context.emailSent = false;
        }
      }
    ]
  });
  
  // ─────────────────────────────────────────────
  // **Item 9 – Suspensão e Retomada (T3)**
  // Atualiza o inventário e, durante a execução, simula uma suspensão usando snapshot.
  sagaBuilder.addStep({
    // Este passo é usado para o ramo de compensação (caso o e-mail falhe)
    from: FlightReservationState.EmailNotSent,
    event: FlightReservationEvent.UpdateInventory,
    to: FlightReservationState.SeatReserved,
    action: async (context, payload, fsm) => {
      console.log("T3: Updating seat inventory...");
      // Simula a suspensão: captura o snapshot e aguarda um tempo
      const snapshot = fsm.getStateSnapshot();
      console.log("FSM suspended. Snapshot taken:", snapshot);
      await new Promise(resolve => setTimeout(resolve, 1000)); // pausa de 1s
      // Retoma a FSM a partir do snapshot
      fsm.loadStateSnapshot(snapshot);
      console.log("FSM resumed from snapshot.");
    }
  });
  
  // Também adicionamos um passo para o fluxo normal (caso o e-mail tivesse sido enviado)
  sagaBuilder.addStep({
    from: FlightReservationState.ReservationCreated,
    event: FlightReservationEvent.UpdateInventory,
    to: FlightReservationState.SeatReserved,
    action: async (context, payload, fsm) => {
      console.log("T3: Updating seat inventory...");
    }
  });
  
  // ─────────────────────────────────────────────
  // **Item 6 – Inclusão de Transações Adicionais (T4)**
  // Processa o pagamento extra. Se falhar, a compensação dispara uma transação adicional.
  sagaBuilder.addStep({
    from: FlightReservationState.SeatReserved,
    event: FlightReservationEvent.ProcessExtraPayment,
    to: FlightReservationState.PaymentFailed,
    action: async (context, payload, fsm) => {
      console.log("T4: Processing extra payment...", payload);
      // Simula falha no pagamento extra
      throw new StateMachineException("Extra payment processing failed");
    },
    compensations: [
      {
        error: StateMachineException,
        target: FlightReservationState.PaymentFailed,
        action: async (context, payload, fsm) => {
          console.log("C4: Extra payment failed. Initiating additional payment transaction.");
          // Dispara a transação adicional (T4a)
          await fsm.dispatch({
            type: FlightReservationEvent.AdditionalPayment,
            payload: { retry: true }
          });
        }
      }
    ]
  });
  
  // Transação adicional T4a – processa o pagamento extra novamente
  sagaBuilder.addStep({
    from: FlightReservationState.PaymentFailed,
    event: FlightReservationEvent.AdditionalPayment,
    to: FlightReservationState.ReservationConfirmed,
    action: async (context, payload, fsm) => {
      console.log("T4a: Processing additional payment retry...", payload);
      // Simula sucesso na re-tentativa
      context.extraPaymentProcessed = true;
    }
  });
  
  // Constrói o descriptor da saga
  const flightReservationDescriptor = sagaBuilder.build();
  
  // Cria o contexto e a FSM
  const flightReservationContext = new FlightReservationContext();
  const flightReservationFSM = new FiniteStateMachine<
    FlightReservationContext,
    FlightReservationState,
    FlightReservationEvent
  >(flightReservationDescriptor, flightReservationContext);
  
  // Função para executar a saga
  async function runFlightReservationSaga() {
    try {
      // T1: Cria a reserva
      await flightReservationFSM.dispatch({
        type: FlightReservationEvent.CreateReservation,
        payload: { flight: "XY123", date: "2025-03-01", destination: "New York" }
      });
      // Se T1 falhar, a FSM estará em ReservationFailed e encerramos a saga
      if (flightReservationFSM.context.state === FlightReservationState.ReservationFailed) {
        console.log("Reservation failed. Saga terminated.");
        return;
      }
  
      // T2: Tenta enviar e-mail
      await flightReservationFSM.dispatch({
        type: FlightReservationEvent.SendEmail,
        payload: {}
      });
  
      // T3: Atualiza inventário – o passo adequado (normal ou compensatório) será executado conforme o estado atual
      await flightReservationFSM.dispatch({
        type: FlightReservationEvent.UpdateInventory,
        payload: {}
      });
  
      // T4: Processa o pagamento extra – se falhar, a compensação dispara T4a
      await flightReservationFSM.dispatch({
        type: FlightReservationEvent.ProcessExtraPayment,
        payload: { extras: ["extra legroom", "priority boarding"] }
      });
  
      // T4a será disparado automaticamente se T4 falhar
    } catch (error) {
      console.error("Error in flight reservation saga:", error);
    } finally {
      console.log("Final State:", flightReservationFSM.context.state);
      console.log("Email Sent:", flightReservationFSM.context.emailSent);
      console.log("Extra Payment Processed:", flightReservationFSM.context.extraPaymentProcessed);
    }
  }
  
  // Executa a saga
  runFlightReservationSaga();