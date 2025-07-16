"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = void 0;
class Queue {
    constructor() {
        this.elements = [];
    }
    enqueue(element) {
        this.elements.push(element);
    }
    dequeue() {
        return this.elements.shift();
    }
    isEmpty() {
        return this.elements.length === 0;
    }
    peek() {
        return this.isEmpty() ? undefined : this.elements[0];
    }
    length() {
        return this.elements.length;
    }
    getElements() {
        return [...this.elements];
    }
    setElements(elements) {
        this.elements = [...elements];
    }
    clear() {
        this.elements = [];
    }
}
exports.Queue = Queue;
