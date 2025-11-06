import React, { useEffect, useMemo, useState } from "react";
import { Upload, Save, RotateCcw, Monitor, Smartphone } from "lucide-react";
import logoConfigService, {
  LogoConfig,
} from "../../services/logoConfigService";

type LogoBlockConfig = {
  imageUrl: string;
  width: number;
  height: number;
  backgroundColor: string;
  borderRadius: string;
  padding: string;
  showBackground: boolean;
};

type LogoCustomizationPayload = {
  login: LogoBlockConfig;
  public: LogoBlockConfig;
};

interface LogoCustomizationProps {
  onSave?: (config: LogoCustomizationPayload) => void;
}

const DEFAULTS: LogoCustomizationPayload = {
  login: {
    imageUrl: "/logo_qualy.png",
    width: 160,
    height: 80,
    backgroundColor: "transparent",
    borderRadius: "rounded-lg",
    padding: "p-0",
    showBackground: false,
  },
  public: {
    imageUrl: "/logo_qualy.png",
    width: 160,
    height: 90,
    backgroundColor: "transparent",
    borderRadius: "rounded-xl",
    padding: "p-0",
    showBackground: false,
  },
};

export default function LogoCustomization({ onSave }: LogoCustomizationProps) {
  const [loginConfig, setLoginConfig] = useState<LogoBlockConfig>(
    DEFAULTS.login
  );
  const [publicConfig, setPublicConfig] = useState<LogoBlockConfig>(
    DEFAULTS.public
  );
  const [activeTab, setActiveTab] = useState<"login" | "public">("login");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop"
  );
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);

  const colorOptions = useMemo(
    () => [
      { name: "Azul", value: "blue-600", bg: "bg-blue-600" },
      { name: "Verde", value: "green-600", bg: "bg-green-600" },
      { name: "Roxo", value: "purple-600", bg: "bg-purple-600" },
      { name: "Vermelho", value: "red-600", bg: "bg-red-600" },
      { name: "Laranja", value: "orange-600", bg: "bg-orange-600" },
      { name: "Rosa", value: "pink-600", bg: "bg-pink-600" },
      { name: "Indigo", value: "indigo-600", bg: "bg-indigo-600" },
      { name: "Cinza", value: "gray-600", bg: "bg-gray-600" },
      {
        name: "Transparente",
        value: "transparent",
        bg: "bg-transparent border-2 border-gray-300",
      },
    ],
    []
  );

  const borderRadiusOptions = useMemo(
    () => [
      { name: "Sem bordas", value: "rounded-none" },
      { name: "Pequeno", value: "rounded" },
      { name: "Médio", value: "rounded-lg" },
      { name: "Grande", value: "rounded-xl" },
      { name: "Circular", value: "rounded-full" },
    ],
    []
  );

  const paddingOptions = useMemo(
    () => [
      { name: "Sem espaçamento", value: "p-0" },
      { name: "Pequeno", value: "p-2" },
      { name: "Médio", value: "p-4" },
      { name: "Grande", value: "p-6" },
      { name: "Extra Grande", value: "p-8" },
    ],
    []
  );

  const currentConfig = activeTab === "login" ? loginConfig : publicConfig;
  const setCurrentConfig =
    activeTab === "login" ? setLoginConfig : setPublicConfig;

  // util: normaliza resposta do backend para {login, public}
  function normalizeResponse(
    payload: LogoConfig[] | { login: LogoConfig; public: LogoConfig }
  ): LogoCustomizationPayload {
    if (Array.isArray(payload)) {
      const login = payload.find((c) => c.context === "login");
      const pub = payload.find((c) => c.context === "public");
      return {
        login: {
          imageUrl: login?.imageUrl ?? DEFAULTS.login.imageUrl,
          width: login?.width ?? DEFAULTS.login.width,
          height: login?.height ?? DEFAULTS.login.height,
          backgroundColor:
            login?.backgroundColor ?? DEFAULTS.login.backgroundColor,
          borderRadius: login?.borderRadius ?? DEFAULTS.login.borderRadius,
          padding: login?.padding ?? DEFAULTS.login.padding,
          showBackground:
            login?.showBackground ?? DEFAULTS.login.showBackground,
        },
        public: {
          imageUrl: pub?.imageUrl ?? DEFAULTS.public.imageUrl,
          width: pub?.width ?? DEFAULTS.public.width,
          height: pub?.height ?? DEFAULTS.public.height,
          backgroundColor:
            pub?.backgroundColor ?? DEFAULTS.public.backgroundColor,
          borderRadius: pub?.borderRadius ?? DEFAULTS.public.borderRadius,
          padding: pub?.padding ?? DEFAULTS.public.padding,
          showBackground: pub?.showBackground ?? DEFAULTS.public.showBackground,
        },
      };
    }
    return {
      login: {
        imageUrl: payload.login?.imageUrl ?? DEFAULTS.login.imageUrl,
        width: payload.login?.width ?? DEFAULTS.login.width,
        height: payload.login?.height ?? DEFAULTS.login.height,
        backgroundColor:
          payload.login?.backgroundColor ?? DEFAULTS.login.backgroundColor,
        borderRadius:
          payload.login?.borderRadius ?? DEFAULTS.login.borderRadius,
        padding: payload.login?.padding ?? DEFAULTS.login.padding,
        showBackground:
          payload.login?.showBackground ?? DEFAULTS.login.showBackground,
      },
      public: {
        imageUrl: payload.public?.imageUrl ?? DEFAULTS.public.imageUrl,
        width: payload.public?.width ?? DEFAULTS.public.width,
        height: payload.public?.height ?? DEFAULTS.public.height,
        backgroundColor:
          payload.public?.backgroundColor ?? DEFAULTS.public.backgroundColor,
        borderRadius:
          payload.public?.borderRadius ?? DEFAULTS.public.borderRadius,
        padding: payload.public?.padding ?? DEFAULTS.public.padding,
        showBackground:
          payload.public?.showBackground ?? DEFAULTS.public.showBackground,
      },
    };
  }

  // boot: backend → cache local → defaults
  useEffect(() => {
    (async () => {
      try {
        const res = await logoConfigService.getLogoConfigs(); // ✅ plural
        if (res.success && res.data) {
          const norm = normalizeResponse(res.data as any);
          setLoginConfig(norm.login);
          setPublicConfig(norm.public);
          localStorage.setItem("logoCustomization", JSON.stringify(norm));
          setBooting(false);
          return;
        }
      } catch (e) {
        console.warn("Falha ao buscar config no backend:", e);
      }

      const saved = localStorage.getItem("logoCustomization");
      if (saved) {
        try {
          const cfg = JSON.parse(saved) as LogoCustomizationPayload;
          setLoginConfig({ ...DEFAULTS.login, ...(cfg.login ?? {}) });
          setPublicConfig({ ...DEFAULTS.public, ...(cfg.public ?? {}) });
          setBooting(false);
          return;
        } catch {}
      }

      setLoginConfig(DEFAULTS.login);
      setPublicConfig(DEFAULTS.public);
      setBooting(false);
    })();
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setCurrentConfig((prev) => ({ ...prev, imageUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    const payload: LogoCustomizationPayload = {
      login: loginConfig,
      public: publicConfig,
    };

    try {
      const res = await logoConfigService.saveLogoConfigs({
        login: { context: "login", ...payload.login },
        public: { context: "public", ...payload.public },
      }); // ✅ plural

      if (!res.success) throw new Error(res.error || "Falha ao salvar");

      localStorage.setItem("logoCustomization", JSON.stringify(payload));
      onSave?.(payload);
      alert("✅ Configurações salvas!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("❌ Não foi possível salvar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (!confirm("Restaurar as configurações padrão desta aba?")) return;
    if (activeTab === "login") setLoginConfig(DEFAULTS.login);
    else setPublicConfig(DEFAULTS.public);
  };

  if (booting) {
    return (
      <div className="p-6">
        <div className="text-gray-600">Carregando configurações…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Personalização de Logo
          </h2>
          <p className="text-gray-600 mt-1">
            Configure a logo da tela de login e do link público
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Padrão</span>
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Salvando..." : "Salvar Configurações"}</span>
          </button>
        </div>
      </div>

      {/* tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("login")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "login"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🔐 Tela de Login
            </button>
            <button
              onClick={() => setActiveTab("public")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "public"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🌐 Link Público
            </button>
          </nav>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* form */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {activeTab === "login" ? "Tela de Login" : "Link Público"}
              </h3>

              {/* upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagem da Logo
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id={`logo-upload-${activeTab}`}
                  />
                  <label
                    htmlFor={`logo-upload-${activeTab}`}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Escolher Arquivo</span>
                  </label>
                  <input
                    type="url"
                    value={currentConfig.imageUrl}
                    onChange={(e) =>
                      setCurrentConfig((prev) => ({
                        ...prev,
                        imageUrl: e.target.value,
                      }))
                    }
                    placeholder="Ou cole uma URL"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* dimensões */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Largura (px)
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={240}
                    value={currentConfig.width}
                    onChange={(e) =>
                      setCurrentConfig((prev) => ({
                        ...prev,
                        width: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Altura (px)
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={240}
                    value={currentConfig.height}
                    onChange={(e) =>
                      setCurrentConfig((prev) => ({
                        ...prev,
                        height: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* fundo */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={currentConfig.showBackground}
                    onChange={(e) =>
                      setCurrentConfig((prev) => ({
                        ...prev,
                        showBackground: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Mostrar fundo colorido
                  </span>
                </label>
              </div>

              {currentConfig.showBackground && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cor de Fundo
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          onClick={() =>
                            setCurrentConfig((prev) => ({
                              ...prev,
                              backgroundColor: color.value,
                            }))
                          }
                          className={`flex items-center space-x-2 p-2 rounded-lg border-2 transition-colors ${
                            currentConfig.backgroundColor === color.value
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded ${color.bg}`} />
                          <span className="text-xs">{color.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bordas Arredondadas
                    </label>
                    <select
                      value={currentConfig.borderRadius}
                      onChange={(e) =>
                        setCurrentConfig((prev) => ({
                          ...prev,
                          borderRadius: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {borderRadiusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Espaçamento Interno
                    </label>
                    <select
                      value={currentConfig.padding}
                      onChange={(e) =>
                        setCurrentConfig((prev) => ({
                          ...prev,
                          padding: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {paddingOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* preview */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPreviewMode("desktop")}
                    className={`p-2 rounded-lg transition-colors ${
                      previewMode === "desktop"
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    title="Desktop"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewMode("mobile")}
                    className={`p-2 rounded-lg transition-colors ${
                      previewMode === "mobile"
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    title="Mobile"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div
                className={`bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-lg p-8 ${
                  previewMode === "mobile" ? "max-w-sm mx-auto" : ""
                }`}
              >
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div
                        className={`flex items-center justify-center ${
                          currentConfig.showBackground
                            ? `bg-${currentConfig.backgroundColor} ${currentConfig.borderRadius} ${currentConfig.padding}`
                            : ""
                        }`}
                        style={{
                          width: `${currentConfig.width}px`,
                          height: `${currentConfig.height}px`,
                        }}
                      >
                        {currentConfig.imageUrl ? (
                          <img
                            src={currentConfig.imageUrl}
                            alt="Logo Preview"
                            className="object-contain max-w-full max-h-full"
                            style={{
                              maxWidth: `${Math.max(
                                currentConfig.width - 16,
                                0
                              )}px`,
                              maxHeight: `${Math.max(
                                currentConfig.height - 16,
                                0
                              )}px`,
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-300 rounded" />
                        )}
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {activeTab === "login"
                        ? "Acesse sua conta"
                        : "Agendamento de Massagem"}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      {activeTab === "login"
                        ? "Digite suas credenciais para entrar"
                        : "Escolha seu horário disponível"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Configurações Atuais:
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    📐 <strong>Dimensões:</strong> {currentConfig.width}x
                    {currentConfig.height}px
                  </div>
                  <div>
                    🎨 <strong>Fundo:</strong>{" "}
                    {currentConfig.showBackground
                      ? currentConfig.backgroundColor
                      : "Transparente"}
                  </div>
                  <div>
                    🔲 <strong>Bordas:</strong> {currentConfig.borderRadius}
                  </div>
                  <div>
                    📏 <strong>Espaçamento:</strong> {currentConfig.padding}
                  </div>
                  <div>
                    🖼️ <strong>Imagem:</strong>{" "}
                    {currentConfig.imageUrl ? "Personalizada" : "Padrão"}
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">✅ Dica</h4>
                <ol className="text-sm text-green-800 space-y-1">
                  <li>1. Ajuste a logo como preferir</li>
                  <li>2. Veja o preview ao lado</li>
                  <li>
                    3. Clique em “Salvar Configurações” (persiste no backend)
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
