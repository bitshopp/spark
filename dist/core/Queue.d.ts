export declare class Queue<E> {
    private elements;
    enqueue(element: E): void;
    dequeue(): E;
    isEmpty(): boolean;
    peek(): E;
    length(): number;
    getElements(): E[];
    setElements(elements: E[]): void;
    clear(): void;
}
