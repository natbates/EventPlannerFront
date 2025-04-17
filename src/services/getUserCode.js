import FingerprintJS from "@fingerprintjs/fingerprintjs";

export async function getFingerprint() {
    try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        return result.visitorId; // Unique device fingerprint
    } catch (error) {
        console.error("Error fetching fingerprint:", error);
        return null;
    }
}
