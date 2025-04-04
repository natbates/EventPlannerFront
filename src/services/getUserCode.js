import FingerprintJS from "@fingerprintjs/fingerprintjs";

export async function getFingerprint() {
    try {
        console.log("Fetching fingerprint...");
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        console.log("Fingerprint Data:", result);
        return result.visitorId; // Unique device fingerprint
    } catch (error) {
        console.error("Error fetching fingerprint:", error);
        return null;
    }
}
