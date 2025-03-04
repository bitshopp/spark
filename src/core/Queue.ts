export class Queue<E> {
  private elements: E[] = [];

  public enqueue(element: E) {
    this.elements.push(element);
  }

  public dequeue() {
    return this.elements.shift();
  }

  public isEmpty() {
    return this.elements.length === 0;
  }

  public peek() {
    return this.isEmpty() ? undefined : this.elements[0];
  }

  public length() {
    return this.elements.length;
  }

  public getElements(): E[] {
    return [...this.elements];
  }

  public setElements(elements: E[]): void {
    this.elements = [...elements];
  }

  public clear(): void {
    this.elements = [];
  }
}
