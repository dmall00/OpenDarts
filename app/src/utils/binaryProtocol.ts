export interface AutoScoreMessage {
    timestamp: number;
}

export const createBinaryMessageWithAdditionalData = (
    imageData: ArrayBuffer,
    autoScoreMessage: AutoScoreMessage
): ArrayBuffer => {
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
