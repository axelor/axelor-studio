function getURL(customId: string | null = null): string {
  const base = import.meta.env.PROD ? ".." : import.meta.env.VITE_PROXY_CONTEXT;
  let url = new URL(`${base}/bpm/deploy/progress`, window.location.href)
    .toString()
    .replace(/\/\//g, "/")
    .replace(/^http/, "ws");

  if (customId) {
    const separator = url.includes("?") ? "&" : "?";
    url += `${separator}customId=${encodeURIComponent(customId)}`;
  }

  return url;
}

type ProgressListener = (progress: number) => void;
type ErrorListener = (error: string) => void;
type CompletionListener = (completed: boolean) => void;
type ConnectionListener = (connected: boolean) => void;

class SocketProgress {
  private ws: WebSocket | null;
  private progress: number;
  private sessionId: string | null;
  private customId: string | null;
  private listeners: Set<ProgressListener>;
  private errorListeners: Set<ErrorListener>;
  private completionListeners: Set<CompletionListener>;
  private connectionListeners: Set<ConnectionListener>;

  constructor() {
    this.ws = null;
    this.progress = 0;
    this.sessionId = null;
    this.customId = null;
    this.listeners = new Set();
    this.errorListeners = new Set();
    this.completionListeners = new Set();
    this.connectionListeners = new Set();
  }

  init(customId: string | null = null): this {
    if (this.customId !== customId && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
      this.ws = null;
    }

    this.customId = customId;

    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.ws = new WebSocket(getURL(customId));
      this.ws.addEventListener("open", this.handleOpen.bind(this));
      this.ws.addEventListener("message", this.handleMessage.bind(this));
      this.ws.addEventListener("error", this.handleError.bind(this));
      this.ws.addEventListener("close", this.handleClose.bind(this));
    }
    return this;
  }

  getCurrentUserId(): void {
    // Get user ID from your application context If needed
  }

  handleOpen(_event: Event): void {
    console.debug("[Progress] WebSocket connection established with custom ID:", this.customId);

    // Send initial message with custom ID for verification
    // userId: this.getCurrentUserId(), ( if needed )

    this.sendMessage({
      action: "REGISTER_CLIENT",
      customId: this.customId,
      timestamp: Date.now(),
    });

    // Notify connection listeners
    this.connectionListeners.forEach((listener) => listener(true));
  }

  handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data || "{}");
      const data = message?.data || {};

      // Store session ID when first received
      if (data.sessionId && !this.sessionId) {
        this.sessionId = data.sessionId;
      }

      // Handle progress updates
      if (data.percentage !== undefined && data.percentage !== this.progress) {
        this.progress = data.percentage;
        this.notifyProgressListeners();
      }

      // Handle completion
      if (data.completed) {
        this.progress = 100;
        this.notifyProgressListeners();
        this.notifyCompletionListeners(true);
      }

      // Handle errors
      if (data.error) {
        this.notifyErrorListeners(data.error);
      }

      // Handle registration confirmation
      if (data.registered) {
        console.debug("[Progress] Client registered successfully with custom ID:", data.customId);
      }
    } catch (error) {
      console.error("[Progress] Error parsing WebSocket message:", error);
      this.notifyErrorListeners("Failed to parse WebSocket message");
    }
  }

  sendMessage(data: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: "MSG",
        data: data,
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  handleError(_error: Event): void {
    console.error("[Progress] WebSocket error:", _error);
    this.notifyErrorListeners("WebSocket connection error");
    this.notifyConnectionListeners(false);
  }

  handleClose(event: CloseEvent): void {
    console.debug("[Progress] WebSocket connection closed:", event.code, event.reason);
    this.ws = null;
    this.notifyConnectionListeners(false);
  }

  // Notification methods
  notifyProgressListeners(): void {
    this.listeners.forEach((listener) => listener(this.progress));
  }

  notifyErrorListeners(error: string): void {
    this.errorListeners.forEach((listener) => listener(error));
  }

  notifyCompletionListeners(completed: boolean): void {
    this.completionListeners.forEach((listener) => listener(completed));
  }

  notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach((listener) => listener(connected));
  }

  // Subscription methods
  subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    return () => this.unsubscribe(listener);
  }

  unsubscribe(listener: ProgressListener): void {
    this.listeners.delete(listener);
  }

  subscribeToErrors(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => this.unsubscribeFromErrors(listener);
  }

  unsubscribeFromErrors(listener: ErrorListener): void {
    this.errorListeners.delete(listener);
  }

  subscribeToCompletion(listener: CompletionListener): () => void {
    this.completionListeners.add(listener);
    return () => this.unsubscribeFromCompletion(listener);
  }

  unsubscribeFromCompletion(listener: CompletionListener): void {
    this.completionListeners.delete(listener);
  }

  subscribeToConnection(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    return () => this.unsubscribeFromConnection(listener);
  }

  unsubscribeFromConnection(listener: ConnectionListener): void {
    this.connectionListeners.delete(listener);
  }

  // Getters
  getProgress(): number {
    return this.progress;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  getCustomId(): string | null {
    return this.customId;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.progress = 0;
    this.sessionId = null;
    this.customId = null;
  }
}

export const wsProgress = new SocketProgress();
