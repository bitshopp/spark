export class StateMachineException implements Error {
  message: string
  name: string
  stack?: string
  constructor(message: string = 'State Machine Exception', stack?: string) {
    this.message = message
    this.name = 'StateMachineException'
    this.stack = stack
  }
}
