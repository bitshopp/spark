export declare class StateMachineException implements Error {
    message: string;
    name: string;
    stack?: string;
    constructor(message?: string, stack?: string);
}
