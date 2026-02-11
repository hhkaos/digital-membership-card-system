import { useEffect, useState } from "react";
import {
  generateKeypair,
  exportPrivateKey,
  exportPublicKey,
  importPrivateKey,
  isValidPEMFormat,
} from "../utils/crypto";
import { useI18n } from "../i18n";
import InfoTooltip from "./InfoTooltip";

export function KeyManagement({
  privateKey,
  publicKey,
  privateKeyPEM: initialPrivateKeyPEM,
  publicKeyPEM: initialPublicKeyPEM,
  onKeysChange,
}) {
  const { t } = useI18n();
  const [wizardStep, setWizardStep] = useState(privateKey ? "loaded" : "choose");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [importError, setImportError] = useState("");
  const [privateKeyPEM, setPrivateKeyPEM] = useState(initialPrivateKeyPEM || "");
  const [publicKeyPEM, setPublicKeyPEM] = useState(initialPublicKeyPEM || "");
  const [copyFeedback, setCopyFeedback] = useState("");

  useEffect(() => {
    setWizardStep(privateKey ? "loaded" : "choose");
  }, [privateKey]);

  useEffect(() => {
    setPrivateKeyPEM(initialPrivateKeyPEM || "");
  }, [initialPrivateKeyPEM]);

  useEffect(() => {
    setPublicKeyPEM(initialPublicKeyPEM || "");
  }, [initialPublicKeyPEM]);

  const handleGenerateKeypair = async () => {
    setGenerating(true);
    setImportError("");

    try {
      const { privateKey: privKey, publicKey: pubKey } = await generateKeypair();
      const privPEM = await exportPrivateKey(privKey);
      const pubPEM = await exportPublicKey(pubKey);

      setPrivateKeyPEM(privPEM);
      setPublicKeyPEM(pubPEM);
      onKeysChange(privKey, pubKey, privPEM, pubPEM);
    } catch (error) {
      setImportError(`${t("keys.errors.generateFailed")}: ${error.message}`);
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
      setImportError(t("keys.errors.invalidPem"));
      return;
    }

    try {
      const privKey = await importPrivateKey(pem);
      const { publicKey: pubKey } = await generateKeypair();

      setImportError("");
      onKeysChange(privKey, null, pem, "");
    } catch (error) {
      setImportError(`${t("keys.errors.importFailed")}: ${error.message}`);
    }
  };

  const handleChangeKey = () => {
    onKeysChange(null, null, "", "");
    setPrivateKeyPEM("");
    setPublicKeyPEM("");
    setShowPrivateKey(false);
    setImportError("");
    setWizardStep("choose");
  };

  const copyToClipboard = async (text, feedbackKey) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(feedbackKey);
      setTimeout(() => setCopyFeedback(""), 2000);
    } catch {
      setCopyFeedback("error");
      setTimeout(() => setCopyFeedback(""), 2000);
    }
  };

  // LOADED STATE
  if (wizardStep === "loaded" && privateKey) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h2 className="text-xl font-semibold text-green-800 m-0">
              ✅ {t("keys.status.loaded")}
            </h2>
            <button
              type="button"
              onClick={handleChangeKey}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold text-sm cursor-pointer border-none min-h-[44px]"
            >
              {t("keys.actions.changeKey")}
            </button>
          </div>

          {/* Private Key (masked) */}
          <div className="mb-5">
            <label className="block font-semibold mb-2 text-gray-800 text-sm">
              {t("keys.labels.privateKeySecret")}
              <InfoTooltip content={t("keys.securityWarnings.item1")} />
            </label>
            <div className="flex gap-2">
              <input
                type={showPrivateKey ? "text" : "password"}
                value={privateKeyPEM}
                readOnly
                className="flex-1 p-3 bg-yellow-50 border border-yellow-300 rounded-lg font-mono text-xs min-w-0"
                onClick={(e) => showPrivateKey && e.target.select()}
              />
              <button
                type="button"
                onClick={() => setShowPrivateKey(!showPrivateKey)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm cursor-pointer border-none shrink-0 min-h-[44px]"
              >
                {showPrivateKey ? t("keys.actions.hideKey") : t("keys.actions.showKey")}
              </button>
            </div>
          </div>

          {/* Copy buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => copyToClipboard(publicKeyPEM, "publicKey")}
              className="flex-1 px-4 py-3 bg-[#30414B] text-white rounded-lg hover:bg-[#52717B] font-semibold text-sm cursor-pointer border-none min-h-[44px] min-w-[160px]"
            >
              {copyFeedback === "publicKey" ? "✓ " : "📋 "}
              {t("keys.actions.copyPublicKey")}
            </button>
            <button
              type="button"
              onClick={() => copyToClipboard(JSON.stringify(publicKeyPEM), "configJson")}
              className="flex-1 px-4 py-3 bg-[#30414B] text-white rounded-lg hover:bg-[#52717B] font-semibold text-sm cursor-pointer border-none min-h-[44px] min-w-[160px]"
            >
              {copyFeedback === "configJson" ? "✓ " : "📋 "}
              {t("keys.actions.copyForConfig")}
            </button>
          </div>

          {copyFeedback === "error" && (
            <p className="mt-3 text-red-700 text-sm">{t("keys.errors.generateFailed")}</p>
          )}
        </div>
      </div>
    );
  }

  // CHOOSE STEP
  if (wizardStep === "choose") {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-gray-500 mb-4">
          {t("keys.wizard.stepOf", { current: "1", total: "2" })}
        </p>

        <h2 className="text-2xl font-semibold text-[#30414B] mb-6 text-center">
          {t("keys.wizard.chooseTitle")}
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={handleGenerateKeypair}
            disabled={generating}
            className="p-6 bg-white border-2 border-gray-300 rounded-lg hover:border-[#30414B] hover:shadow-md text-left cursor-pointer transition-all min-h-[44px]"
          >
            <div className="text-3xl mb-2">🔑</div>
            <h3 className="text-lg font-semibold text-[#30414B] mb-2">
              {t("keys.generate.title")}
            </h3>
            <p className="text-gray-600 text-sm m-0">
              {t("keys.generate.description")}
            </p>
            {generating && (
              <p className="text-[#30414B] font-semibold text-sm mt-3">
                {t("keys.generate.generating")}
              </p>
            )}
          </button>

          <button
            type="button"
            onClick={() => setWizardStep("import")}
            className="p-6 bg-white border-2 border-gray-300 rounded-lg hover:border-[#30414B] hover:shadow-md text-left cursor-pointer transition-all min-h-[44px]"
          >
            <div className="text-3xl mb-2">📥</div>
            <h3 className="text-lg font-semibold text-[#30414B] mb-2">
              {t("keys.import.title")}
            </h3>
            <p className="text-gray-600 text-sm m-0">
              {t("keys.import.description")}
            </p>
          </button>
        </div>

        {importError && (
          <div className="mt-4 text-red-700 text-sm">{importError}</div>
        )}
      </div>
    );
  }

  // IMPORT STEP
  if (wizardStep === "import") {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-gray-500 mb-4">
          {t("keys.wizard.stepOf", { current: "2", total: "2" })}
        </p>

        <button
          type="button"
          onClick={() => {
            setWizardStep("choose");
            setImportError("");
            setPrivateKeyPEM("");
          }}
          className="mb-4 text-[#30414B] hover:underline cursor-pointer bg-transparent border-none text-sm font-semibold"
        >
          ← {t("common.back")}
        </button>

        <div className="bg-white p-6 rounded-lg border border-gray-300">
          <h2 className="text-xl font-semibold text-[#30414B] mb-2">
            {t("keys.import.title")}
          </h2>
          <p className="mb-4 text-gray-600 text-sm">{t("keys.import.description")}</p>

          <label className="block font-semibold mb-2 text-gray-800 text-sm">
            {t("keys.labels.privateKeyPem")}
          </label>
          <textarea
            value={privateKeyPEM}
            onChange={handleImportPrivateKey}
            placeholder={t("keys.import.placeholder")}
            className="w-full min-h-[150px] p-3 font-mono text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#30414B]/30 focus:border-[#30414B] box-border"
          />

          {importError && (
            <div className="mt-2 text-red-700 text-sm">{importError}</div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
