import { FiniteStateMachine } from './core/FiniteStateMachine';
import { StateMachineException } from './core/StateMachineException';
import { Context } from './core/Types';

/**
 * Estados que representam os passos do fluxo de reserva de voo.
 */
enum FlightReservationState {
  Start = 'Start',
  ReservationCreated = 'ReservationCreated',    // T1: Reserva criada com sucesso.
  EmailNotSent = 'EmailNotSent',                // T2: Falha no envio do e-mail (compensação C2).
  SeatReserved = 'SeatReserved',                // T3: Inventário de assentos atualizado.
  PaymentFailed = 'PaymentFailed',              // T4: Falha no processamento do pagamento extra (compensação C4).
  ReservationConfirmed = 'ReservationConfirmed' // T5: Reserva finalizada com sucesso após re-tentativa do pagamento extra.
}

/**
 * Eventos que disparam as transições no fluxo.
 */
enum FlightReservationEvent {
  CreateReservation = 'CreateReservation',       // T1
  SendEmail = 'SendEmail',                       // T2
  UpdateInventory = 'UpdateInventory',           // T3
  ProcessExtraPayment = 'ProcessExtraPayment',   // T4
  ReattemptExtraPayment = 'ReattemptExtraPayment'  // T5
}

/**
 * Contexto do fluxo de reserva de voo.
 */
class FlightReservationContext implements Context<FlightReservationState> {
  state: FlightReservationState = FlightReservationState.Start;
  // Indicadores para registrar resultados parciais.
  emailSent: boolean = true;          // Por padrão, assume que o e-mail foi enviado.
  extraPaymentProcessed: boolean = false;
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
        action: async (
          context: FlightReservationContext,
          payload: any,
          fsm: FiniteStateMachine<FlightReservationContext, FlightReservationState, FlightReservationEvent>
        ) => {
          console.log("T1: Criando reserva de voo com os detalhes:", payload);
          // Simula sucesso na criação da reserva (ex.: gravação na base de dados)
        }
      }
    },
    // T2: Tentativa de envio de e-mail que falha.
    [FlightReservationState.ReservationCreated]: {
      [FlightReservationEvent.SendEmail]: {
        target: FlightReservationState.EmailNotSent, // A transição será para EmailNotSent via compensação.
        action: async (
          context: FlightReservationContext,
          payload: any,
          fsm: FiniteStateMachine<FlightReservationContext, FlightReservationState, FlightReservationEvent>
        ) => {
          console.log("T2: Tentando enviar e-mail de confirmação...");
          // Simula falha no envio de e-mail.
          throw new StateMachineException("Falha ao enviar e-mail devido a problemas de conexão");
        },
        catch: [
          {
            error: StateMachineException,
            target: FlightReservationState.EmailNotSent,
            action: async (
              context: FlightReservationContext,
              payload: any,
              fsm: FiniteStateMachine<FlightReservationContext, FlightReservationState, FlightReservationEvent>
            ) => {
              console.log("C2: Registro de falha no envio de e-mail. Reserva permanece válida.");
              context.emailSent = false;
            }
          }
        ]
      }
    },
    // T3: Atualização do inventário de assentos com sucesso.
    [FlightReservationState.EmailNotSent]: {
      [FlightReservationEvent.UpdateInventory]: {
        target: FlightReservationState.SeatReserved,
        action: async (
          context: FlightReservationContext,
          payload: any,
          fsm: FiniteStateMachine<FlightReservationContext, FlightReservationState, FlightReservationEvent>
        ) => {
          console.log("T3: Atualizando inventário de assentos disponíveis...");
          // Simula sucesso na atualização do inventário.
        }
      }
    },
    // T4: Tentativa de processar pagamento extra que falha.
    [FlightReservationState.SeatReserved]: {
      [FlightReservationEvent.ProcessExtraPayment]: {
        target: FlightReservationState.PaymentFailed,
        action: async (
          context: FlightReservationContext,
          payload: any,
          fsm: FiniteStateMachine<FlightReservationContext, FlightReservationState, FlightReservationEvent>
        ) => {
          console.log("T4: Processando pagamento extra para serviços adicionais...", payload);
          // Simula falha no processamento do pagamento extra.
          throw new StateMachineException("Falha no processamento do pagamento extra pelo gateway");
        },
        catch: [
          {
            error: StateMachineException,
            target: FlightReservationState.PaymentFailed,
            action: async (
              context: FlightReservationContext,
              payload: any,
              fsm: FiniteStateMachine<FlightReservationContext, FlightReservationState, FlightReservationEvent>
            ) => {
              console.log("C4: Registro de falha no pagamento extra. Revertendo alterações no estado do pagamento.");
              context.extraPaymentProcessed = false;
            }
          }
        ]
      }
    },
    // T5: Re-tentativa do pagamento extra com sucesso.
    [FlightReservationState.PaymentFailed]: {
      [FlightReservationEvent.ReattemptExtraPayment]: {
        target: FlightReservationState.ReservationConfirmed,
        action: async (
          context: FlightReservationContext,
          payload: any,
          fsm: FiniteStateMachine<FlightReservationContext, FlightReservationState, FlightReservationEvent>
        ) => {
          console.log("T5: Re-tentando o pagamento extra para serviços adicionais...");
          // Simula sucesso na re-tentativa do pagamento extra.
          context.extraPaymentProcessed = true;
        }
      }
    }
  }
};

/**
 * Instancia o contexto e a FSM para a reserva de voo.
 */
const flightReservationContext = new FlightReservationContext();
const flightReservationFSM = new FiniteStateMachine<
  FlightReservationContext,
  FlightReservationState,
  FlightReservationEvent
>(flightReservationDescriptor, flightReservationContext);

/**
 * Função que executa o fluxo de SAGA para reserva de voo.
 */
async function runFlightReservationSaga() {
  try {
    // T1: Cria a reserva.
    await flightReservationFSM.dispatch({
      type: FlightReservationEvent.CreateReservation,
      payload: { flight: "XY123", date: "2025-03-01", destination: "New York" }
    });
    
    // T2: Tenta enviar a confirmação por e-mail (falha, aciona compensação C2).
    await flightReservationFSM.dispatch({ type: FlightReservationEvent.SendEmail, payload: {} });
    
    // T3: Atualiza o inventário de assentos.
    await flightReservationFSM.dispatch({ type: FlightReservationEvent.UpdateInventory, payload: {} });
    
    // T4: Processa o pagamento extra (falha, aciona compensação C4).
    await flightReservationFSM.dispatch({
      type: FlightReservationEvent.ProcessExtraPayment,
      payload: { extras: ["extra legroom", "priority boarding"] }
    });
    
    // T5: Re-tenta o pagamento extra com sucesso.
    await flightReservationFSM.dispatch({
      type: FlightReservationEvent.ReattemptExtraPayment,
      payload: { extras: ["extra legroom", "priority boarding"] }
    });
  } catch (error) {
    console.error("Erro no fluxo de reserva de voo:", error);
  } finally {
    console.log("Estado Final:", flightReservationFSM.context.state);
    console.log("E-mail enviado:", flightReservationFSM.context.emailSent);
    console.log("Pagamento extra processado:", flightReservationFSM.context.extraPaymentProcessed);
  }
}

// Executa o fluxo da SAGA
runFlightReservationSaga();
