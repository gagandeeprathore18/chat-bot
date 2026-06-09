export interface message {
    id: string;
    sender: 'user' | 'bot';
    text: string;
    timestamp: string;
    isFallback?: boolean;
    source?: string;
}
export interface conversation {
    id: string;
    messages: message[];
    createdAt: string;
    title: string;
    summary?: string;
}
