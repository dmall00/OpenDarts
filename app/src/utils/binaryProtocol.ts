export interface AutoScoreMessage {
    timestamp: number;
    playerId: string;
    traceId?: string;
}

export const generateTraceId = (): string => {
    const now = new Date();
    const berlinTimeString = now.toLocaleString('sv-SE', {
        timeZone: 'Europe/Berlin',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
        hour12: false
    });
    // Format: YYYY-MM-DD HH:mm:ss.SSS
    const dateStr = berlinTimeString.replace(/[\s:]/g, '-').replace(/\./g, '-');
    return `${dateStr}-${Math.random().toString(36).substring(2, 15)}`;
};

export const createBinaryMessageWithAdditionalData = (
    imageData: ArrayBuffer,
    autoScoreMessage: AutoScoreMessage
): ArrayBuffer => {
    if (!autoScoreMessage.traceId) {
        autoScoreMessage.traceId = generateTraceId();
    }
    const autoScoreMessageJson = JSON.stringify(autoScoreMessage);
    const autoScoreMessageBytes = new TextEncoder().encode(autoScoreMessageJson);
    const messageLength = autoScoreMessageBytes.length;

    const totalLength = 4 + messageLength + imageData.byteLength;
    const buffer = new ArrayBuffer(totalLength);
    const view = new DataView(buffer);

    view.setUint32(0, messageLength, false);

    const uint8Array = new Uint8Array(buffer);
    uint8Array.set(autoScoreMessageBytes, 4);
    uint8Array.set(new Uint8Array(imageData), 4 + messageLength);

    return buffer;
};
