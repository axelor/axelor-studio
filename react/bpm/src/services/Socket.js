function getURL() {
  const base = import.meta.env.PROD ? ".." : import.meta.env.VITE_PROXY_CONTEXT;
  return new URL(`${base}/websocket`, window.location.href)
    .toString()
    .replace(/\/\//g, "/")
    .replace(/^http/, "ws");
}

export class Socket {
  #ws = null;
  #connecting = Promise.resolve();
  #listeners = {};
  #callbacks = {};

  async init() {
    if (!this.#ws) {
      this.#ws = new WebSocket(getURL());
      this.#ws.onerror = () => {
        this.#ws = null;
      };
      this.#ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg?.channel) {
          const listeners = this.#listeners[msg.channel];
          listeners.forEach((fn) => fn(msg.data));
        }
      };
      this.#ws.onclose = (event) => {
        this.#notifyCallbacks("onclose", event);
        this.#ws = null;
      };
      this.#connecting = new Promise((resolve) => {
        this.#ws.onopen = (event) => {
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

  async send(type, channel, data) {
    await this.init();
    this.#ws?.send(
      JSON.stringify({ type: type, channel: channel, data: data })
    );
  }

  subscribe(channel, listener, callbacks = {}) {
    const uncallbacks = Object.entries(callbacks ?? {}).map(([key, value]) =>
      this.#registerCallback(key, value)
    );

    const listenerSet =
      this.#listeners[channel] || (this.#listeners[channel] = new Set());

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

  #notifyCallbacks(eventName, event) {
    this.#callbacks[eventName]?.forEach((callback) => callback(event));
  }

  #registerCallback(eventName, callback) {
    let callbacks = this.#callbacks[eventName];
    if (callbacks == null) {
      callbacks = this.#callbacks[eventName] = [];
    }
    return this.#addCallback(callbacks, callback);
  }

  #addCallback(callbacks, callback) {
    const index = callbacks.length;
    callbacks.push(callback);
    return () => callbacks.splice(index, 1);
  }
}

export const socket = new Socket();

export class SocketChannel {
  #channel;
  #callbacks = {};

  constructor(channel, callbacks) {
    this.#channel = channel;
    this.#callbacks = callbacks;
  }

  send(data) {
    socket.send("MSG", this.#channel, data);
  }

  subscribe(listener) {
    return socket.subscribe(this.#channel, listener, this.#callbacks);
  }
}
