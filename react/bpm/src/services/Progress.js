function getURL() {
  const base = import.meta.env.PROD ? ".." : import.meta.env.VITE_PROXY_CONTEXT;
  return new URL(`${base}/bpm/deploy/progress`, window.location.href)
    .toString()
    .replace(/\/\//g, "/")
    .replace(/^http/, "ws");
}

class SocketProgress {
  constructor() {
    this.ws = null;
    this.progress = 0;
    this.listeners = new Set();
  }

  init() {
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.ws = new WebSocket(getURL());
      this.ws.addEventListener("message", this.handleMessage.bind(this));
      this.ws.addEventListener("error", this.handleError.bind(this));
      this.ws.addEventListener("close", this.handleClose.bind(this));
    }
  }

  handleMessage(event) {
    try {
      const data = JSON.parse(event.data || "{}");
      const { percentage } = data?.data || {};
      if (percentage !== this.progress) {
        this.progress = percentage;
        this.notifyListeners();
      }
    } catch (error) {
      console.error(error);
    }
  }

  handleError(error) {
    console.error(error);
  }

  handleClose() {
    this.ws = null;
  }

  notifyListeners() {
    this.listeners.forEach((listener) => listener(this.progress));
  }

  subscribe(listener) {
    this.listeners.add(listener);
  }

  unsubscribe(listener) {
    this.listeners.delete(listener);
  }
}

export const wsProgress = new SocketProgress();
