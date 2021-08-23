export interface Context<State> {
    state: State;
    [key: string]: any;
}
