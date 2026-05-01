import type { EventBus, JudgmentEvent } from '@reaatech/llm-judge-types';

type EventHandler = (payload: unknown) => void;

export class InMemoryEventBus implements EventBus {
  private listeners = new Map<string, Set<EventHandler>>();

  emit<T extends JudgmentEvent['type']>(
    event: T,
    payload: Omit<Extract<JudgmentEvent, { type: T }>, 'type'>,
  ): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      handler(payload);
    }
  }

  on<T extends JudgmentEvent['type']>(
    event: T,
    handler: (payload: Omit<Extract<JudgmentEvent, { type: T }>, 'type'>) => void,
  ): void {
    let handlers = this.listeners.get(event);
    if (!handlers) {
      handlers = new Set();
      this.listeners.set(event, handlers);
    }
    handlers.add(handler as EventHandler);
  }

  off<T extends JudgmentEvent['type']>(
    event: T,
    handler: (payload: Omit<Extract<JudgmentEvent, { type: T }>, 'type'>) => void,
  ): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    handlers.delete(handler as EventHandler);
    if (handlers.size === 0) {
      this.listeners.delete(event);
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
