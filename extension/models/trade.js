export function createTrade() {
    return {
        id: crypto.randomUUID(),

        timestamp: new Date().toISOString(),

        url: "",

        title: "",

        screenshot: null,

        symbol: "",

        timeframe: "",

        notes: "",

        emotions: [],

        aiAnalysis: null
    };
}