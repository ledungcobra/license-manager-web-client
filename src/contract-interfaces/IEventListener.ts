import EventEmitter from "events";

export interface IEventListener {
    listen(): EventEmitter

    removeListener(): void
}