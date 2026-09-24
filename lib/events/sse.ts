type SSEListener = (event: string, data: any) => void;

const listeners = new Set<SSEListener>();

export function subscribeAdminEvents(listener: SSEListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function broadcastAdminEvent(event: string, data: any) {
  listeners.forEach((listener) => {
    try {
      listener(event, data);
    } catch (err) {
      console.error('Error in SSE listener:', err);
    }
  });
}
