import { Queue } from './Queue';
import { StateMachineDescriptor } from './StateMachineDescriptor';
import { StateMachineException } from './StateMachineException';
import { Context } from './Types';
export class FiniteStateMachine<
  C extends Context<S>,
  S extends string | number,
  E extends string | number,
> {
  private _context: C;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private actionQueue: Queue<{ type: E; payload?: any }> = new Queue();
  private _stateMachineDescriptor: StateMachineDescriptor<C, S, E>;

  constructor(
    stateMachineDescriptor: StateMachineDescriptor<C, S, E>,
    context: C,
  ) {
    this._stateMachineDescriptor = stateMachineDescriptor;
    this._context = context;
    if (!this._context.state) {
      this._context.state = this._stateMachineDescriptor.initialState;
    }
  }

  get context(): C {
    return this._context;
  }

  set context(context: C) {
    this._context = context;
  }

  async dispatch(action: { type: E; payload?: unknown }) {
    this.actionQueue.enqueue(action);
    if (this.actionQueue.length() >= 2) {
      return;
    }
    await this.executeAction(this.actionQueue.peek()!);
  }

  async abort(action: { type: E; payload?: unknown }) {
    this.actionQueue.clear();
    await this.dispatch(action);
  }

  private async executeAction(action: { type: E; payload?: unknown }) {
    const stateDef = this._stateMachineDescriptor.states[this._context.state];
    if (!stateDef) {
      this.executeNextAction();
      return;
    }
    const event = stateDef[action.type];
    if (!event) {
      this.executeNextAction();
      return;
    }

    try {
      if (this._stateMachineDescriptor.beforeTransition) {
        await this._stateMachineDescriptor.beforeTransition(
          this._context,
          action,
          this,
        );
      }
      // Executa a ação e captura o resultado
      const result = await event.action(this._context, action.payload, this);
      // Se o target for uma função, determina o estado dinamicamente
      const nextState =
        typeof event.target === 'function'
          ? (event.target as (result: unknown, context: C) => S)(
              result,
              this._context,
            )
          : event.target;

      this._context.state = nextState;

      if (this._stateMachineDescriptor.afterTransition) {
        await this._stateMachineDescriptor.afterTransition(
          this._context,
          action,
          this,
        );
      }
    } catch (error) {
      let handled = false;
      if (event.catch) {
        for (const catchBlock of event.catch) {
          if (error instanceof catchBlock.error) {
            handled = true;
            if (this._stateMachineDescriptor.beforeTransition) {
              await this._stateMachineDescriptor.beforeTransition(
                this._context,
                action,
                this,
              );
            }
            await catchBlock.action(this._context, action.payload, this);
            this._context.state = catchBlock.target;
            if (this._stateMachineDescriptor.afterTransition) {
              await this._stateMachineDescriptor.afterTransition(
                this._context,
                action,
                this,
              );
            }
            break;
          }
        }
      }
      if (!handled) {
        const { retry } = this._stateMachineDescriptor;
        if (retry && error instanceof StateMachineException) {
          retry.action(this._context, action, this, error);
        }
      }
    } finally {
      this.executeNextAction();
    }
  }

  private executeNextAction() {
    this.actionQueue.dequeue();
    if (!this.actionQueue.isEmpty()) {
      this.executeAction(this.actionQueue.peek()!);
    }
  }

  // Métodos para suspensão e retomada (Item 9)
  public getStateSnapshot(): unknown {
    return {
      context: this._context,
      queue: this.actionQueue.getElements(),
    };
  }
  // eslin-disable-next-line @typescript-eslint/no-explicit-any
  public loadStateSnapshot(snapshot: any): void {
    this._context = snapshot.context;
    this.actionQueue.setElements(snapshot.queue);
  }
}
