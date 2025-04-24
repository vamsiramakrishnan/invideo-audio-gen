type MessageHandler = (data: any) => void;

class WebSocketService {
    private socket: WebSocket | null = null;
    private messageHandlers: Map<string, MessageHandler[]> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000; // Start with 1 second delay

    constructor() {
        this.connect();
    }

    private connect() {
        this.socket = new WebSocket('ws://localhost:8000/api/ws');

        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'error') {
                    const handlers = this.messageHandlers.get('error') || [];
                    handlers.forEach(handler => handler(data.payload));
                } else {
                    const handlers = this.messageHandlers.get(data.type) || [];
                    handlers.forEach(handler => handler(data.payload));
                }
            } catch (error) {
                console.error('Error processing WebSocket message:', error);
                const handlers = this.messageHandlers.get('error') || [];
                handlers.forEach(handler => handler('Error processing server response'));
            }
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket disconnected:', event.reason);
            this.handleReconnect();
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            const handlers = this.messageHandlers.get('error') || [];
            handlers.forEach(handler => handler('Connection error occurred'));
        };
    }

    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
                console.log(`Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
                this.connect();
                this.reconnectAttempts++;
                this.reconnectDelay *= 2; // Exponential backoff
            }, this.reconnectDelay);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    public on(type: string, handler: MessageHandler) {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, []);
        }
        this.messageHandlers.get(type)?.push(handler);
    }

    public off(type: string, handler: MessageHandler) {
        const handlers = this.messageHandlers.get(type);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }

    public send(type: string, payload: any) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type, payload }));
        } else {
            console.error('WebSocket is not connected');
        }
    }

    public generateTranscript(conceptData: any) {
        this.send('generate_transcript', conceptData);
    }

    public editTranscript(transcriptData: any) {
        this.send('edit_transcript', transcriptData);
    }

    public generateAudio(audioData: any) {
        try {
            // Validate that required fields exist
            if (!audioData || !audioData.transcript || !audioData.voiceMappings) {
                throw new Error("Missing required fields for audio generation");
            }
            
            // Ensure voiceMappings is not empty
            if (Object.keys(audioData.voiceMappings).length === 0) {
                throw new Error("No voice mappings provided");
            }
            
            // Check that each voice mapping has required properties
            Object.entries(audioData.voiceMappings).forEach(([speaker, mapping]: [string, any]) => {
                if (!mapping.voice || !mapping.config) {
                    throw new Error(`Invalid voice mapping for speaker: ${speaker}`);
                }
            });
            
            this.send('generate_audio', audioData);
        } catch (error) {
            console.error("Error preparing audio generation:", error);
            // Notify any error handlers
            const handlers = this.messageHandlers.get('error') || [];
            handlers.forEach(handler => handler(error instanceof Error ? error.message : String(error)));
            throw error;
        }
    }
}

// Create a singleton instance
const wsService = new WebSocketService();
export default wsService;
