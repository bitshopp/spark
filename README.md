# SPARK - Finite State Machine (FSM) for TypeScript

Esta é uma implementação de uma máquina de estados finita (FSM) em TypeScript, projetada para gerenciar transições de estado em processos complexos. A FSM foi estruturada para ser flexível, extensível e reutilizável, servindo inclusive para orquestração de SAGA em ambientes distribuídos (ex.: microserviços).

## Descrição Geral

A FSM gerencia transições de estado a partir de um descritor que define:
- **Estados e Transições**: Cada estado possui eventos que disparam ações e definem o próximo estado.
- **Hooks de Transição**: Permite executar funções _beforeTransition_ e _afterTransition_ para adicionar lógicas customizadas antes e depois da transição.
- **Tratamento de Exceções e Retry**: Possui mecanismos para capturar erros, executar ações de compensação (rollback) e realizar retry em casos específicos.

Essa implementação é adequada para cenários onde é necessário coordenar processos distribuídos e implementar fluxos de compensação, como os encontrados em padrões SAGA.

## Estrutura do Projeto

```
/src
 ├── /core
 │     ├── FiniteStateMachine.ts      // Implementação principal da FSM
 │     ├── Queue.ts                   // Fila genérica para gerenciamento das ações
 │     ├── StateMachineException.ts   // Exceção específica da FSM
 │     ├── StateMachineDescriptor.ts  // Descritor (configuração) da FSM
 │     └── Types.ts                   // Tipos comuns (Action, Context, Hooks, etc.)
 └── SagasTest.ts                     // Testes unitários para a SAGA
 └── Test.ts                          // Testes unitários para a FSM
 └── index.ts                         // Ponto de entrada e re-exports dos módulos principais
```

## Funcionalidades

1. **Estados e Transições**: Permite definir estados e eventos para modelar processos e fluxos de trabalho.
2. **Execução em Fila**: As ações são enfileiradas e processadas de forma sequencial, garantindo consistência.
3. **Hooks e Retry**: Permite executar funções customizadas antes e depois das transições, com suporte a estratégias de retry.
4. **Tratamento de Exceções e Compensação**: Possui mecanismos para capturar erros e executar fluxos de compensação (rollback), essenciais para a implementação de SAGA.

## Uso

### Exemplo 1: Uso Simples da Máquina de Estados

1. **Defina seus Estados e Eventos**:  
   Crie enums para representar os estados e os eventos.

   ```typescript
   enum State {
     Initial = 'Initial',
     Intermediate = 'Intermediate',
     Final = 'Final'
   }

   enum Event {
     Start = 'Start',
     Proceed = 'Proceed'
   }
   ```

2. **Implemente o Contexto**:  
   Crie uma classe que implementa a interface `Context`.

   ```typescript
   import { Context } from './core/types';

   class SimpleContext implements Context<State> {
     state: State = State.Initial;
   }
   ```

3. **Configure a Máquina de Estados**:  
   Configure a FSM definindo os estados, eventos e transições.

   ```typescript
   import { FiniteStateMachine } from './core/FiniteStateMachine';

   const simpleStateMachine = new FiniteStateMachine<SimpleContext, State, Event>({
     initialState: State.Initial,
     states: {
       [State.Initial]: {
         [Event.Start]: {
           target: State.Intermediate,
           action: async (context, payload) => {
             console.log('Iniciando transição do estado Initial para Intermediate');
             // Lógica da transição...
           }
         }
       },
       [State.Intermediate]: {
         [Event.Proceed]: {
           target: State.Final,
           action: async (context, payload) => {
             console.log('Transição para o estado Final');
             // Lógica final...
           }
         }
       }
     }
   }, new SimpleContext());

   // Dispara o evento Start para iniciar a transição
   simpleStateMachine.dispatch({ type: Event.Start });
   ```

### Exemplo 2: Uso como SAGA com Compensação

Para cenários distribuídos, a FSM pode ser utilizada para implementar o padrão SAGA, onde cada passo (evento) representa uma operação e, em caso de erro, são disparadas ações de compensação.

1. **Defina Estados e Eventos para a SAGA**:

   ```typescript
   enum OrderState {
     Pending = 'Pending',
     Created = 'Created',
     Approved = 'Approved',
     Cancelled = 'Cancelled',
     CompensationStep1 = 'CompensationStep1',
     CompensationStep2 = 'CompensationStep2'
   }

   enum OrderEvent {
     Create = 'Create',
     Approve = 'Approve',
     FailCompensation = 'FailCompensation'
   }
   ```

2. **Implemente o Contexto da SAGA**:

   ```typescript
   import { Context } from './core/types';

   class OrderContext implements Context<OrderState> {
     state: OrderState = OrderState.Pending;
     // Outras propriedades do pedido podem ser adicionadas aqui
   }
   ```

3. **Configure a FSM para Gerenciar o Fluxo SAGA com Compensação**:

   ```typescript
   import { FiniteStateMachine } from './core/FiniteStateMachine';
   import { StateMachineException } from './core/StateMachineException';

   const orderStateMachine = new FiniteStateMachine<OrderContext, OrderState, OrderEvent>({
     initialState: OrderState.Pending,
     states: {
       [OrderState.Pending]: {
         [OrderEvent.Create]: {
           target: OrderState.Created,
           action: async (context, payload, fsm) => {
             console.log('Criando o pedido');
             // Lógica de criação do pedido
           }
         }
       },
       [OrderState.Created]: {
         [OrderEvent.Approve]: {
           target: OrderState.Approved,
           action: async (context, payload, fsm) => {
             console.log('Aprovando o pedido');
             // Simulação de erro para acionar compensação
             throw new StateMachineException('Erro ao aprovar o pedido');
           },
           catch: [
             {
               error: StateMachineException,
               target: OrderState.CompensationStep1,
               action: async (context, payload, fsm) => {
                 console.log('Executando compensação do passo 1');
                 // Lógica de compensação para reverter a operação de aprovação
               }
             }
           ]
         }
       },
       [OrderState.CompensationStep1]: {
         [OrderEvent.FailCompensation]: {
           target: OrderState.CompensationStep2,
           action: async (context, payload, fsm) => {
             console.log('Executando compensação do passo 2');
             // Lógica adicional de compensação
           }
         }
       },
       [OrderState.CompensationStep2]: {
         [OrderEvent.FailCompensation]: {
           target: OrderState.Cancelled,
           action: async (context, payload, fsm) => {
             console.log('Pedido cancelado após compensações');
             // Finaliza a compensação
           }
         }
       }
     }
   }, new OrderContext());

   // Exemplo de fluxo SAGA:
   async function runOrderSaga() {
     try {
       await orderStateMachine.dispatch({ type: OrderEvent.Create, payload: {} });
       await orderStateMachine.dispatch({ type: OrderEvent.Approve, payload: {} });
       // Se o passo de aprovação falhar, a compensação será iniciada automaticamente
       // Você pode, opcionalmente, disparar eventos adicionais de compensação:
       await orderStateMachine.dispatch({ type: OrderEvent.FailCompensation, payload: {} });
     } catch (error) {
       console.error('Erro no fluxo da SAGA:', error);
     }
   }

   runOrderSaga();
   ```

4. **Sub-máquinas de Estado para Fluxos Complexos**:

   Para fluxos mais complexos, é possível definir sub-máquinas de estado que orquestram partes específicas do fluxo, como a compensação. Essa modularidade melhora a manutenção e a clareza do código.

   ```typescript
   class CompensationSubMachine extends FiniteStateMachine<OrderContext, OrderState, OrderEvent> {
     constructor() {
       super({
         initialState: OrderState.CompensationStep1,
         states: {
           [OrderState.CompensationStep1]: {
             [OrderEvent.FailCompensation]: {
               target: OrderState.CompensationStep2,
               action: async (context, payload, fsm) => {
                 console.log('Submáquina: Compensação do passo 1');
               }
             }
           },
           [OrderState.CompensationStep2]: {
             [OrderEvent.FailCompensation]: {
               target: OrderState.Cancelled,
               action: async (context, payload, fsm) => {
                 console.log('Submáquina: Finalizando compensação');
               }
             }
           }
         }
       }, new OrderContext());
     }
   }
   ```

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests com melhorias, correções e novas funcionalidades.

## Licença

Este projeto é distribuído sob a licença MIT. Consulte o arquivo LICENSE para mais detalhes.

