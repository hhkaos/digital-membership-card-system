import React, { useState } from "react";
import {
    generateKeypair,
    exportPrivateKey,
    exportPublicKey,
    importPrivateKey,
    isValidPEMFormat,
    getKeyFingerprint,
} from "../utils/crypto";

const styles = {
    container: {
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
    },
    section: {
        marginBottom: "30px",
        padding: "20px",
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
    },
    heading: {
        color: "#30414B",
        marginBottom: "16px",
    },
    button: {
        backgroundColor: "#30414B",
        color: "white",
        padding: "12px 24px",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "16px",
        fontWeight: "600",
    },
    buttonDisabled: {
        backgroundColor: "#ccc",
        cursor: "not-allowed",
    },
    textarea: {
        width: "100%",
        minHeight: "150px",
        padding: "12px",
        fontFamily: "monospace",
        fontSize: "12px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        marginTop: "8px",
        boxSizing: "border-box",
    },
    warning: {
        backgroundColor: "#ffebee",
        border: "2px solid #f44336",
        borderRadius: "6px",
        padding: "16px",
        marginTop: "16px",
    },
    warningTitle: {
        color: "#d32f2f",
        fontWeight: "bold",
        marginBottom: "8px",
    },
    warningList: {
        color: "#c62828",
        paddingLeft: "20px",
        margin: "8px 0",
    },
    status: {
        display: "inline-flex",
        alignItems: "center",
        padding: "8px 16px",
        borderRadius: "20px",
        fontSize: "14px",
        fontWeight: "600",
        marginTop: "12px",
    },
    statusLoaded: {
        backgroundColor: "#e8f5e9",
        color: "#2e7d32",
    },
    statusUnloaded: {
        backgroundColor: "#fff3e0",
        color: "#e65100",
    },
    label: {
        display: "block",
        fontWeight: "600",
        marginBottom: "8px",
        color: "#333",
    },
    error: {
        color: "#d32f2f",
        marginTop: "8px",
        fontSize: "14px",
    },
};

export function KeyManagement({ privateKey, publicKey, onKeysChange }) {
    const [generating, setGenerating] = useState(false);
    const [importError, setImportError] = useState("");
    const [privateKeyPEM, setPrivateKeyPEM] = useState("");
    const [publicKeyPEM, setPublicKeyPEM] = useState("");

    const handleGenerateKeypair = async () => {
        setGenerating(true);
        setImportError("");

        try {
            const { privateKey: privKey, publicKey: pubKey } =
                await generateKeypair();
            const privPEM = await exportPrivateKey(privKey);
            const pubPEM = await exportPublicKey(pubKey);

            setPrivateKeyPEM(privPEM);
            setPublicKeyPEM(pubPEM);
            onKeysChange(privKey, pubKey, privPEM, pubPEM);
        } catch (error) {
            setImportError("Failed to generate keypair: " + error.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleImportPrivateKey = async (e) => {
        const pem = e.target.value;
        setPrivateKeyPEM(pem);
        setImportError("");

        if (!pem.trim()) {
            onKeysChange(null, null, "", "");
            setPublicKeyPEM("");
            return;
        }

        if (!isValidPEMFormat(pem)) {
            setImportError(
                'Invalid PEM format. Private key must start with "-----BEGIN PRIVATE KEY-----"',
            );
            return;
        }

        try {
            const privKey = await importPrivateKey(pem);
            const { publicKey: pubKey } = await generateKeypair(); // Generate temp to get public
            // Note: In production, derive public key from private key properly
            // For now, user will need to paste public key or regenerate

            setImportError("");
            onKeysChange(privKey, null, pem, "");
        } catch (error) {
            setImportError("Failed to import private key: " + error.message);
        }
    };

    const keyLoaded = privateKey !== null;
    const fingerprint = publicKeyPEM ? getKeyFingerprint(publicKeyPEM) : "";

    return (
        <div style={styles.container}>
            <h1 style={styles.heading}>Key Management</h1>

            {/* Key Status */}
            <div
                style={{
                    ...styles.status,
                    ...(keyLoaded
                        ? styles.statusLoaded
                        : styles.statusUnloaded),
                }}
            >
                {keyLoaded ? "✅ Key loaded" : "⚠️ No key loaded"}
                {fingerprint && ` - Fingerprint: ${fingerprint}`}
            </div>

            {/* Generate New Keypair */}
            <div style={styles.section}>
                <h2 style={styles.heading}>Generate New Keypair</h2>
                <p>
                    Create a new Ed25519 keypair for signing membership cards.
                </p>
                <button
                    onClick={handleGenerateKeypair}
                    disabled={generating}
                    style={{
                        ...styles.button,
                        ...(generating ? styles.buttonDisabled : {}),
                    }}
                >
                    {generating ? "Generating..." : "Generate New Keypair"}
                </button>

                {importError && <div style={styles.error}>{importError}</div>}

                {privateKeyPEM && (
                    <>
                        <div style={styles.warning}>
                            <div style={styles.warningTitle}>
                                🔒 SECURITY WARNINGS
                            </div>
                            <ul style={styles.warningList}>
                                <li>
                                    Store private key securely (password manager
                                    recommended)
                                </li>
                                <li>
                                    NEVER commit private key to Git repository
                                </li>
                                <li>
                                    Losing this key means regenerating ALL
                                    member cards
                                </li>
                            </ul>
                        </div>

                        <div style={{ marginTop: "16px" }}>
                            <label style={styles.label}>
                                Private Key (KEEP SECRET)
                            </label>
                            <textarea
                                value={privateKeyPEM}
                                readOnly
                                style={{
                                    ...styles.textarea,
                                    backgroundColor: "#fff8f0",
                                }}
                                onClick={(e) => e.target.select()}
                            />
                        </div>

                        <div style={{ marginTop: "16px" }}>
                            <label style={styles.label}>
                                Public Key (PEM format)
                            </label>
                            <textarea
                                value={publicKeyPEM}
                                readOnly
                                style={styles.textarea}
                                onClick={(e) => e.target.select()}
                            />
                        </div>

                        <div style={{ marginTop: "16px" }}>
                            <label style={styles.label}>
                                Public Key for config.json (copy this → verification/src/config.json)
                            </label>
                            <textarea
                                value={JSON.stringify(publicKeyPEM)}
                                readOnly
                                style={{
                                    ...styles.textarea,
                                    backgroundColor: "#f0f8ff",
                                    minHeight: "80px"
                                }}
                                onClick={(e) => e.target.select()}
                            />
                            <p style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>
                                ℹ️ This is the JSON-escaped format. Copy and paste as the value for "publicKey" in your verification config.json
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Import Existing Private Key */}
            <div style={styles.section}>
                <h2 style={styles.heading}>Import Existing Private Key</h2>
                <p>
                    Paste your private key in PEM format to use for card
                    generation.
                </p>

                <label style={styles.label}>Private Key (PEM format)</label>
                <textarea
                    value={privateKeyPEM}
                    onChange={handleImportPrivateKey}
                    placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                    style={styles.textarea}
                />

                {importError && <div style={styles.error}>{importError}</div>}

                <div style={styles.warning}>
                    <div style={styles.warningTitle}>🔒 SECURITY NOTE</div>
                    <p style={{ margin: "8px 0", color: "#c62828" }}>
                        Private key is stored ONLY in memory and will be cleared
                        when you close/refresh this page. Never stored in
                        browser storage.
                    </p>
                </div>
            </div>
        </div>
    );
}
