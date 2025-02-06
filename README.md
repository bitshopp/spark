# Finite State Machine (FSM) for TypeScript

Esta é uma implementação de uma máquina de estados finita (FSM) em TypeScript, projetada para gerenciar transições de estado em processos complexos, como orquestrações de SAGA em microserviços.

## Descrição Geral

Esta FSM é construída para flexibilidade e extensibilidade, permitindo que você facilmente adicione estados e transições, além de manipular exceções e implementar lógica de retry. O modelo é adequado para gerenciar processos distribuídos, incluindo transações que requerem lógica de compensação no padrão SAGA.

## Estrutura do Projeto

- **src/Action.ts**: Define o tipo `Action`, representando ações com tipo e payload.
- **src/ActionQueue.ts**: Implementa uma fila genérica para gerenciar a ordem de execução das ações.
- **src/Context.ts**: Define a interface do contexto com estado e dados adicionais.
- **src/FiniteStateMachine.ts**: Implementa a FSM principal, gerenciando transições e exceções entre estados.
- **src/StateMahchineDescriptor.ts**: Descreve a configuração inicial de estados e transições da FSM.
- **src/Teste.ts**: Exemplo de uso, demonstrando uma FSM simples com transições e captura de exceções.

## Funcionalidades

1. **Estados e Transições**: Define processos como estados e eventos que causam transições.
2. **Execução em Fila**: Ações são enfileiradas e processadas em sequência.
3. **Captura de Exceções**: Manuseia exceções durante as transições para ações de compensação ou retry.
4. **Personalização de Eventos**: Adiciona manipulação de transições com ações personalizadas antes e depois.

## Uso

### Exemplo 1: Uso Simples de Máquina de Estado

1. **Defina seus Estados e Eventos**: 
   Defina enums para representar estados e eventos.

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
   Crie uma classe de contexto que implementa a interface.

   ```typescript
   class SimpleContext implements Context<State> {
     state: State = State.Initial;
   }
   ```

3. **Configure a Máquina de Estados**:
   Utilize `FiniteStateMachine` para configurar estados e eventos.

   ```typescript
   const simpleStateMachine = new FiniteStateMachine<SimpleContext, State, Event>({
     initialState: State.Initial,
     states: {
       [State.Initial]: {
         [Event.Start]: {
           target: State.Intermediate,
           action: async (context, payload) => { /* lógica do evento */ }
         }
       },
       [State.Intermediate]: {
         [Event.Proceed]: {
           target: State.Final,
           action: async (context, payload) => { /* lógica para finalizar */ }
         }
       }
     }
   });

   simpleStateMachine.dispatch({ type: Event.Start });
   ```

### Exemplo 2: Uso como SAGA com Compensação

Para processos complexos, especialmente em ambientes de microserviços distribuídos, as SAGAs oferecem um padrão para gerenciar transações distribuídas e suas respectivas compensações.

1. **Defina Estados e Eventos para SAGA**:

   ```typescript
   enum OrderState {
     Pending = 'Pending',
     Created = 'Created',
     Approved = 'Approved',
     Cancelled = 'Cancelled',
     Compensation1 = 'CompensationStep1',
     Compensation2 = 'CompensationStep2'
   }

   enum OrderEvent {
     Create = 'Create',
     Approve = 'Approve',
     FailCompensation = 'FailCompensation'
   }
   ```

2. **Implemente o Contexto para a SAGA**:
   Similar ao exemplo simples, mas focado em processos de pedido.

   ```typescript
   class OrderContext implements Context<OrderState> {
     state: OrderState = OrderState.Pending;
     // outras propriedades do pedido
   }
   ```

3. **Configure a Máquina de Estados para Compensação Multi-passo**:

   ```typescript
   const orderStateMachine = new FiniteStateMachine<OrderContext, OrderState, OrderEvent>({
     initialState: OrderState.Pending,
     states: {
       [OrderState.Approved]: {
         [OrderEvent.FailCompensation]: {
           target: OrderState.Compensation1,
           action: async (context, payload) => { /* iniciar primeiro passo de compensação */ },
           catch: [
             {
               error: SomeException,
               target: OrderState.Compensation1,
               action: async (context, payload) => {
                 await executeCompensationStep1(context, payload);
               }
             }
           ]
         }
       },
       [OrderState.Compensation1]: {
         [OrderEvent.FailCompensation]: {
           target: OrderState.Compensation2,
           action: async (context, payload) => { /* segundo passo de compensação */ }
         }
       },
       [OrderState.Compensation2]: {
         [OrderEvent.FailCompensation]: {
           target: OrderState.Cancelled,
           action: async (context, payload) => { /* último passo de compensação */ }
         }
       }
     }
   });

   async function executeCompensationStep1(context: OrderContext, payload: any) {
     console.log('Executando primeiro passo de compensação');
     orderStateMachine.dispatch({ type: OrderEvent.FailCompensation });
   }
   ```

4. **Sub-máquinas de Estado para Processos Complexos**:

   ```typescript
   class CompensationSubMachine extends FiniteStateMachine<OrderContext, OrderState, OrderEvent> {
     constructor() {
       super({
         initialState: OrderState.Compensation1,
         states: {
           [OrderState.Compensation1]: {
             [OrderEvent.FailCompensation]: {
               target: OrderState.Compensation2,
               action: async (context, payload) => { /* ação de compensação */ }
             }
           },
           [OrderState.Compensation2]: {
             [OrderEvent.FailCompensation]: {
               target: OrderState.Cancelled,
               action: async (context, payload) => { /* finalizar compensação */ }
             }
           }
         }
       }, new OrderContext());
     }
   }
   ```

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests com melhorias e correções.

## Licença

Este projeto é distribuído sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.