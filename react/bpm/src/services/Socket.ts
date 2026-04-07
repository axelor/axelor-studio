function getURL(): string {
  const base = import.meta.env.PROD ? ".." : import.meta.env.VITE_PROXY_CONTEXT;
  return new URL(`${base}/websocket`, window.location.href)
    .toString()
    .replace(/\/\//g, "/")
    .replace(/^http/, "ws");
}

type SocketListener = (data: unknown) => void;
type SocketCallback = (...args: unknown[]) => void;

class Socket {
  #ws: WebSocket | null = null;
  #connecting: Promise<void> = Promise.resolve();
  #listeners: Record<string, Set<SocketListener>> = {};
  #callbacks: Record<string, SocketCallback[]> = {};

  async init(): Promise<void> {
    if (!this.#ws) {
      this.#ws = new WebSocket(getURL());
      this.#ws.onerror = () => {
        this.#ws = null;
      };
      this.#ws.onmessage = (event: MessageEvent) => {
        const msg = JSON.parse(event.data);
        if (msg?.channel) {
          const listeners = this.#listeners[msg.channel];
          listeners?.forEach((fn) => fn(msg.data));
        }
      };
      this.#ws.onclose = (event: CloseEvent) => {
        this.#notifyCallbacks("onclose", event);
        this.#ws = null;
      };
      this.#connecting = new Promise<void>((resolve) => {
        // safety: #ws is guaranteed non-null after connect()
        this.#ws!.onopen = (event: Event) => {
          this.#notifyCallbacks("onopen", event);
          resolve();
        };
      });
    }

    if (this.#ws?.readyState === WebSocket.OPEN) {
      return;
    }

    return this.#connecting;
  }

  async send(type: string, channel: string, data?: unknown): Promise<void> {
    await this.init();
    this.#ws?.send(JSON.stringify({ type: type, channel: channel, data: data }));
  }

  subscribe(
    channel: string,
    listener: SocketListener,
    callbacks: Record<string, SocketCallback> = {},
  ): () => void {
    const uncallbacks = Object.entries(callbacks ?? {}).map(([key, value]) =>
      this.#registerCallback(key, value),
    );

    const listenerSet = this.#listeners[channel] || (this.#listeners[channel] = new Set());

    listenerSet.add(listener);

    if (listenerSet.size === 1) {
      this.send("SUB", channel);
    }
    return () => {
      uncallbacks.forEach((uncallback) => uncallback());
      listenerSet.delete(listener);
      if (listenerSet.size === 0) {
        this.send("UNS", channel);
      }
    };
  }

  #notifyCallbacks(eventName: string, event: unknown): void {
    this.#callbacks[eventName]?.forEach((callback) => callback(event));
  }

  #registerCallback(eventName: string, callback: SocketCallback): () => void {
    let callbacks = this.#callbacks[eventName];
    if (callbacks == null) {
      callbacks = this.#callbacks[eventName] = [];
    }
    return this.#addCallback(callbacks, callback);
  }

  #addCallback(callbacks: SocketCallback[], callback: SocketCallback): () => void {
    const index = callbacks.length;
    callbacks.push(callback);
    return () => callbacks.splice(index, 1);
  }
}

const socket = new Socket();

export class SocketChannel {
  #channel: string;
  #callbacks: Record<string, SocketCallback>;

  constructor(channel: string, callbacks: Record<string, SocketCallback>) {
    this.#channel = channel;
    this.#callbacks = callbacks;
  }

  send(data: unknown): void {
    socket.send("MSG", this.#channel, data);
  }

  subscribe(listener: SocketListener): () => void {
    return socket.subscribe(this.#channel, listener, this.#callbacks);
  }
}
