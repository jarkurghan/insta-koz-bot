let waiting = false;
let pendingCode: string | null = null;

export function beginCheckpointWait(): void {
    waiting = true;
    pendingCode = null;
}

export function endCheckpointWait(): void {
    waiting = false;
    pendingCode = null;
}

export function offerCheckpointCode(text: string): boolean {
    if (!waiting) return false;
    const code = text.replace(/\s+/g, "");
    if (!/^\d{4,8}$/.test(code)) return false;
    pendingCode = code;
    return true;
}

export function pullCheckpointCode(): string | null {
    const code = pendingCode;
    pendingCode = null;
    return code;
}
