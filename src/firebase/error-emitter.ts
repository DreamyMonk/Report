// A simple event emitter for our app
// See: https://mmazzarolo.com/blog/2021-10-16-subscribing-to-events-in-react/
type EventCallback = (...args: any[]) => void;
type Events = Record<string, EventCallback[]>;

class EventEmitter {
  private events: Events = {};

  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return this;
  }

  off(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      return this;
    }
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
    return this;
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) {
      return this;
    }
    this.events[event].forEach((callback) => callback(...args));
    return this;
  }
}

export const errorEmitter = new EventEmitter();
