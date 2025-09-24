function getURL(customId = null) {
  const base = import.meta.env.PROD ? ".." : import.meta.env.VITE_PROXY_CONTEXT;
  let url = new URL(`${base}/bpm/deploy/progress`, window.location.href)
    .toString()
    .replace(/\/\//g, "/")
    .replace(/^http/, "ws");
  
  if (customId) {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}customId=${encodeURIComponent(customId)}`;
  }
  
  return url;
}

class SocketProgress {
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

  init(customId = null) {

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

  getCurrentUserId() {
    // Get user ID from your application context If needed

  }

  handleOpen(event) {
    console.log("WebSocket connection established with custom ID:", this.customId);
    
    // Send initial message with custom ID for verification
    // userId: this.getCurrentUserId(), ( if needed )

    this.sendMessage({
      action: "REGISTER_CLIENT",
      customId: this.customId,
      timestamp: Date.now()
    });
    
    // Notify connection listeners
    this.connectionListeners.forEach(listener => listener(true));
  }

  handleMessage(event) {
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
        console.log("Client registered successfully with custom ID:", data.customId);
      }
      
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
      this.notifyErrorListeners("Failed to parse WebSocket message");
    }
  }

  sendMessage(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: "MSG",
        data: data
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  handleError(error) {
    console.error("WebSocket error:", error);
    this.notifyErrorListeners("WebSocket connection error");
    this.notifyConnectionListeners(false);
  }

  handleClose(event) {
    console.log("WebSocket connection closed:", event.code, event.reason);
    this.ws = null;
    this.notifyConnectionListeners(false);
  }

  // Notification methods
  notifyProgressListeners() {
    this.listeners.forEach((listener) => listener(this.progress));
  }

  notifyErrorListeners(error) {
    this.errorListeners.forEach((listener) => listener(error));
  }

  notifyCompletionListeners(completed) {
    this.completionListeners.forEach((listener) => listener(completed));
  }

  notifyConnectionListeners(connected) {
    this.connectionListeners.forEach((listener) => listener(connected));
  }

  // Subscription methods
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.unsubscribe(listener);
  }

  unsubscribe(listener) {
    this.listeners.delete(listener);
  }

  subscribeToErrors(listener) {
    this.errorListeners.add(listener);
    return () => this.unsubscribeFromErrors(listener);
  }

  unsubscribeFromErrors(listener) {
    this.errorListeners.delete(listener);
  }

  subscribeToCompletion(listener) {
    this.completionListeners.add(listener);
    return () => this.unsubscribeFromCompletion(listener);
  }

  unsubscribeFromCompletion(listener) {
    this.completionListeners.delete(listener);
  }

  subscribeToConnection(listener) {
    this.connectionListeners.add(listener);
    return () => this.unsubscribeFromConnection(listener);
  }

  unsubscribeFromConnection(listener) {
    this.connectionListeners.delete(listener);
  }

  // Getters
  getProgress() {
    return this.progress;
  }

  getSessionId() {
    return this.sessionId;
  }

  getCustomId() {
    return this.customId;
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export const wsProgress = new SocketProgress();