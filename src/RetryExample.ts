import { FiniteStateMachine } from './core/FiniteStateMachine';
import { StateMachineDescriptor } from './core/StateMachineDescriptor';
import { StateMachineException } from './core/StateMachineException';
import { Context } from './core/Types';

// 1. Estados da máquina
enum RetryState {
  Start = 'Start',
  Success = 'Success',
  Failed = 'Failed',
}

// 2. Eventos que podem ocorrer
enum RetryEvent {
  Process = 'Process',
  GiveUp = 'GiveUp', // Evento para mover para o estado de falha
}

// 3. Contexto para armazenar o estado e o número de tentativas
class RetryContext implements Context<RetryState> {
  state: RetryState = RetryState.Start;
  processAttempts = 0;
  maxAttempts = 3; // Permitir 3 tentativas no total
}

// 4. Exceção customizada para clareza no log
class ProcessingException extends StateMachineException {}

// 5. Descritor da Máquina de Estados com a lógica de retry
const retryDescriptor: StateMachineDescriptor<
  RetryContext,
  RetryState,
  RetryEvent
> = {
  initialState: RetryState.Start,
  retry: {
    action: async (context, action, fsm, error) => {
      console.log(
        `[RETRY] Tentativa ${context.processAttempts} falhou. Erro: "${error.message}"`,
      );

      // Verifica se ainda pode tentar novamente
      if (context.processAttempts < context.maxAttempts) {
        console.log('[RETRY] Tentando novamente em 1 segundo...');
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simula um backoff
        // Re-despacha a mesma ação que falhou para uma nova tentativa
        await fsm.dispatch(action);
      } else {
        console.log(
          `[RETRY] Número máximo de tentativas (${context.maxAttempts}) atingido. Desistindo.`,
        );
        // Dispara um evento para mover a FSM para um estado de falha definitivo
        await fsm.dispatch({ type: RetryEvent.GiveUp });
      }
    },
  },
  states: {
    [RetryState.Start]: {
      // Este evento inicia um processo que pode falhar
      [RetryEvent.Process]: {
        target: RetryState.Success, // O objetivo é chegar aqui
        action: async (context) => {
          context.processAttempts++;
          console.log(
            `[ACTION] Executando processamento... (tentativa ${context.processAttempts})`,
          );

          // Simula uma falha nas primeiras tentativas
          if (context.processAttempts < context.maxAttempts) {
            throw new ProcessingException(
              `Falha simulada na tentativa ${context.processAttempts}`,
            );
          }

          // Na última tentativa, o processamento é bem-sucedido
          console.log('[ACTION] Processamento concluído com sucesso!');
        },
      },
      // Este evento é disparado pela lógica de retry quando as tentativas se esgotam
      [RetryEvent.GiveUp]: {
        target: RetryState.Failed,
        action: async () => {
          console.log(
            '[ACTION] Movendo para o estado de Falha após esgotar as tentativas.',
          );
        },
      },
    },
    [RetryState.Success]: {
      // Estado final de sucesso, sem novas transições
    },
    [RetryState.Failed]: {
      // Estado final de falha, sem novas transições
    },
  },
};

// 6. Função para executar o cenário de sucesso do retry
async function runRetrySuccessExample() {
  console.log('--- Iniciando Exemplo de Sucesso com Retry ---');
  const context = new RetryContext();
  context.maxAttempts = 3;
  const fsm = new FiniteStateMachine(retryDescriptor, context);

  console.log('Disparando evento inicial para começar o processo...');
  await fsm.dispatch({ type: RetryEvent.Process });

  // Aguarda a conclusão de todas as ações assíncronas
  await new Promise((resolve) => setTimeout(resolve, 3500));

  console.log('\n--- Resultado Final (Sucesso) ---');
  console.log(`Estado final da máquina: ${fsm.context.state}`);
  console.log(
    `Total de tentativas de processamento: ${fsm.context.processAttempts}`,
  );
  console.log('---------------------------\n');
}

// 7. Função para executar o cenário de falha do retry
async function runRetryFailureExample() {
  console.log('--- Iniciando Exemplo de Falha com Retry ---');
  const context = new RetryContext();
  context.maxAttempts = 2; // Menos tentativas do que o necessário para ter sucesso
  const fsm = new FiniteStateMachine(retryDescriptor, context);

  console.log('Disparando evento inicial para começar o processo...');
  await fsm.dispatch({ type: RetryEvent.Process });

  // Aguarda a conclusão de todas as ações assíncronas
  await new Promise((resolve) => setTimeout(resolve, 3500));

  console.log('\n--- Resultado Final (Falha) ---');
  console.log(`Estado final da máquina: ${fsm.context.state}`);
  console.log(
    `Total de tentativas de processamento: ${fsm.context.processAttempts}`,
  );
  console.log('---------------------------\n');
}

// Executa ambos os exemplos
(async () => {
  await runRetrySuccessExample();
  await runRetryFailureExample();
})(); 