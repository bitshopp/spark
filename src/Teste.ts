import { FiniteStateMachine } from "./core/FiniteStateMachine"
import { StateMachineException } from "./core/StateMachineException"
import { Context } from "./core/Types"

export enum EnumState {
  state1 = 'state1',
  state2 = 'state2',
  state3 = 'state3',
  state4 = 'state4'
}

export enum EnumEvent {
  event1 = 'event1',
  event2 = 'event2',
  event3 = 'event3'
}

class ClassContext implements Context<EnumState> {
  state: EnumState = EnumState.state1
}

class Exception1 extends StateMachineException {}
const stateMachine = new FiniteStateMachine<ClassContext, EnumState, EnumEvent>(
  {
    initialState: EnumState.state1,
    beforeTransition: async context => {
      console.log(`beforeTransition state: ${context.state}`)
    },
    afterTransition: async (context, actions) => {
      console.log(`afterTransition state: ${context.state}`)
    },
    retry: {
      action: async (context, action) => {
        console.log('retry')
      }
    },
    states: {
      [EnumState.state1]: {
        [EnumEvent.event1]: {
          target: EnumState.state2,
          action: async (context, payload, stateMachine) => {
            try {
              console.log('action state 1 event 1')
              stateMachine.dispatch({ type: EnumEvent.event2, payload: { name: 'danillo' } })
            } catch (error) {
              console.log(error)
              throw new StateMachineException()
            }
          }
        }
      },
      [EnumState.state2]: {
        [EnumEvent.event2]: {
          target: EnumState.state3,
          catch: [
            {
              error: Exception1,
              target: EnumState.state4,
              action: async (context, payload) => {
                console.log('rollback action 2 event 2')
              }
            }
          ],
          action: async (context, payload) => {
            
              console.log('action state 2 event 2')
              throw new Exception1()
            
          }
        }
      }
    }
  },
  new ClassContext()
)

stateMachine.dispatch({ type: EnumEvent.event1, payload: { name: 'danillo' } })
