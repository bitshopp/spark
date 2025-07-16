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
// 1. Estados da máquina
var RetryState;
(function (RetryState) {
    RetryState["Start"] = "Start";
    RetryState["Success"] = "Success";
    RetryState["Failed"] = "Failed";
})(RetryState || (RetryState = {}));
// 2. Eventos que podem ocorrer
var RetryEvent;
(function (RetryEvent) {
    RetryEvent["Process"] = "Process";
    RetryEvent["GiveUp"] = "GiveUp";
})(RetryEvent || (RetryEvent = {}));
// 3. Contexto para armazenar o estado e o número de tentativas
class RetryContext {
    constructor() {
        this.state = RetryState.Start;
        this.processAttempts = 0;
        this.maxAttempts = 3; // Permitir 3 tentativas no total
    }
}
// 4. Exceção customizada para clareza no log
class ProcessingException extends StateMachineException_1.StateMachineException {
}
// 5. Descritor da Máquina de Estados com a lógica de retry
const retryDescriptor = {
    initialState: RetryState.Start,
    retry: {
        action: (context, action, fsm, error) => __awaiter(void 0, void 0, void 0, function* () {
            console.log(`[RETRY] Tentativa ${context.processAttempts} falhou. Erro: "${error.message}"`);
            // Verifica se ainda pode tentar novamente
            if (context.processAttempts < context.maxAttempts) {
                console.log('[RETRY] Tentando novamente em 1 segundo...');
                yield new Promise((resolve) => setTimeout(resolve, 1000)); // Simula um backoff
                // Re-despacha a mesma ação que falhou para uma nova tentativa
                yield fsm.dispatch(action);
            }
            else {
                console.log(`[RETRY] Número máximo de tentativas (${context.maxAttempts}) atingido. Desistindo.`);
                // Dispara um evento para mover a FSM para um estado de falha definitivo
                yield fsm.dispatch({ type: RetryEvent.GiveUp });
            }
        }),
    },
    states: {
        [RetryState.Start]: {
            // Este evento inicia um processo que pode falhar
            [RetryEvent.Process]: {
                target: RetryState.Success,
                action: (context) => __awaiter(void 0, void 0, void 0, function* () {
                    context.processAttempts++;
                    console.log(`[ACTION] Executando processamento... (tentativa ${context.processAttempts})`);
                    // Simula uma falha nas primeiras tentativas
                    if (context.processAttempts < context.maxAttempts) {
                        throw new ProcessingException(`Falha simulada na tentativa ${context.processAttempts}`);
                    }
                    // Na última tentativa, o processamento é bem-sucedido
                    console.log('[ACTION] Processamento concluído com sucesso!');
                }),
            },
            // Este evento é disparado pela lógica de retry quando as tentativas se esgotam
            [RetryEvent.GiveUp]: {
                target: RetryState.Failed,
                action: () => __awaiter(void 0, void 0, void 0, function* () {
                    console.log('[ACTION] Movendo para o estado de Falha após esgotar as tentativas.');
                }),
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
function runRetrySuccessExample() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('--- Iniciando Exemplo de Sucesso com Retry ---');
        const context = new RetryContext();
        context.maxAttempts = 3;
        const fsm = new FiniteStateMachine_1.FiniteStateMachine(retryDescriptor, context);
        console.log('Disparando evento inicial para começar o processo...');
        yield fsm.dispatch({ type: RetryEvent.Process });
        // Aguarda a conclusão de todas as ações assíncronas
        yield new Promise((resolve) => setTimeout(resolve, 3500));
        console.log('\n--- Resultado Final (Sucesso) ---');
        console.log(`Estado final da máquina: ${fsm.context.state}`);
        console.log(`Total de tentativas de processamento: ${fsm.context.processAttempts}`);
        console.log('---------------------------\n');
    });
}
// 7. Função para executar o cenário de falha do retry
function runRetryFailureExample() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('--- Iniciando Exemplo de Falha com Retry ---');
        const context = new RetryContext();
        context.maxAttempts = 2; // Menos tentativas do que o necessário para ter sucesso
        const fsm = new FiniteStateMachine_1.FiniteStateMachine(retryDescriptor, context);
        console.log('Disparando evento inicial para começar o processo...');
        yield fsm.dispatch({ type: RetryEvent.Process });
        // Aguarda a conclusão de todas as ações assíncronas
        yield new Promise((resolve) => setTimeout(resolve, 3500));
        console.log('\n--- Resultado Final (Falha) ---');
        console.log(`Estado final da máquina: ${fsm.context.state}`);
        console.log(`Total de tentativas de processamento: ${fsm.context.processAttempts}`);
        console.log('---------------------------\n');
    });
}
// Executa ambos os exemplos
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield runRetrySuccessExample();
    yield runRetryFailureExample();
}))();
