export type Action<Event extends string | number> = {
  type: Event
  payload: any
}
