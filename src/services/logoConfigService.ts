// 🗄️ SERVIÇO DE CONFIGURAÇÃO DE LOGO (persistência no backend)

export interface LogoConfig {
  id?: number | string;
  context: "login" | "public";
  imageUrl: string;
  width: number;
  height: number;
  backgroundColor: string; // tailwind token ou hex
  borderRadius: string; // ex.: 'rounded-lg'
  padding: string; // ex.: 'p-4'
  showBackground: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LogoConfigResponse {
  success: boolean;
  data?: LogoConfig[] | { login: LogoConfig; public: LogoConfig };
  error?: string;
  message?: string;
}

function normalizeBaseUrl(u: string): string {
  if (!u) return "";
  return u.endsWith("/") ? u.slice(0, -1) : u;
}

function joinUrl(base: string, endpoint: string): string {
  const e = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${normalizeBaseUrl(base)}${e}`;
}

async function parseJsonSafe(res: Response) {
  const txt = await res.text();
  if (!txt) return { ok: false, data: null, raw: "", status: res.status };
  try {
    return { ok: true, data: JSON.parse(txt), raw: txt, status: res.status };
  } catch {
    return { ok: false, data: null, raw: txt, status: res.status };
  }
}

class LogoConfigService {
  private baseUrl: string;

  constructor() {
    // use o mesmo base da sua API PHP
    this.baseUrl =
      (import.meta.env.VITE_API_BASE_URL as string) ??
      "https://qualycorpore.chztech.com.br/api";
  }

  private authHeaders(): HeadersInit {
    const token = localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // ---- GET /branding/index.php --------------------------------------------
  async getLogoConfigs(): Promise<LogoConfigResponse> {
    try {
      const url = joinUrl(this.baseUrl, "/branding/index.php");
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...this.authHeaders(),
        },
        credentials: "include",
        mode: "cors",
      });

      const parsed = await parseJsonSafe(res);
      if (!parsed.ok) {
        return {
          success: false,
          error: `Resposta não-JSON (${parsed.status})`,
          message: parsed.raw,
        };
      }

      const body = parsed.data;
      // backend pode responder { success, data } ou já só o array
      if (res.ok && (body?.success ?? true)) {
        const payload = body?.data ?? body;
        // Aceitar dois formatos:
        // 1) [{context:'login'...}, {context:'public'...}]
        // 2) { login: {...}, public: {...} }
        if (Array.isArray(payload)) {
          return { success: true, data: payload as LogoConfig[] };
        }
        return {
          success: true,
          data: payload as { login: LogoConfig; public: LogoConfig },
        };
      }

      return {
        success: false,
        error: body?.error || body?.message || `Erro HTTP ${parsed.status}`,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || "Falha de rede" };
    }
  }

  // ---- POST /branding/save.php --------------------------------------------
  async saveLogoConfigs(configs: {
    login: LogoConfig;
    public: LogoConfig;
  }): Promise<LogoConfigResponse> {
    try {
      const url = joinUrl(this.baseUrl, "/branding/save.php");

      // o backend pode esperar um array ou um objeto
      // aqui enviaremos um objeto com chaves login/public
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.authHeaders(),
        },
        credentials: "include",
        mode: "cors",
        body: JSON.stringify({
          login: { ...configs.login, context: "login" },
          public: { ...configs.public, context: "public" },
        }),
      });

      const parsed = await parseJsonSafe(res);
      if (!parsed.ok) {
        return {
          success: false,
          error: `Resposta não-JSON (${parsed.status})`,
          message: parsed.raw,
        };
      }

      const body = parsed.data;
      if (res.ok && (body?.success ?? true)) {
        return {
          success: true,
          data: body?.data ?? { login: configs.login, public: configs.public },
          message: body?.message,
        };
      }

      return {
        success: false,
        error: body?.error || body?.message || "Falha ao salvar",
      };
    } catch (err: any) {
      return { success: false, error: err?.message || "Falha de rede" };
    }
  }

  // ---- POST /branding/reset.php -------------------------------------------
  async resetToDefault(): Promise<LogoConfigResponse> {
    try {
      const url = joinUrl(this.baseUrl, "/branding/reset.php");
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.authHeaders(),
        },
        credentials: "include",
        mode: "cors",
        body: JSON.stringify({}), // caso precise de payload
      });

      const parsed = await parseJsonSafe(res);
      if (!parsed.ok) {
        return {
          success: false,
          error: `Resposta não-JSON (${parsed.status})`,
          message: parsed.raw,
        };
      }

      const body = parsed.data;
      if (res.ok && (body?.success ?? true)) {
        return { success: true, data: body?.data, message: body?.message };
      }
      return {
        success: false,
        error: body?.error || body?.message || "Falha ao resetar",
      };
    } catch (err: any) {
      return { success: false, error: err?.message || "Falha de rede" };
    }
  }

  // ---- GET /branding/history.php ------------------------------------------
  async getConfigHistory(): Promise<LogoConfigResponse> {
    try {
      const url = joinUrl(this.baseUrl, "/branding/history.php");
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...this.authHeaders(),
        },
        credentials: "include",
        mode: "cors",
      });

      const parsed = await parseJsonSafe(res);
      if (!parsed.ok) {
        return {
          success: false,
          error: `Resposta não-JSON (${parsed.status})`,
          message: parsed.raw,
        };
      }

      const body = parsed.data;
      if (res.ok && (body?.success ?? true)) {
        return { success: true, data: body?.data, message: body?.message };
      }
      return {
        success: false,
        error: body?.error || body?.message || "Falha ao buscar histórico",
      };
    } catch (err: any) {
      return { success: false, error: err?.message || "Falha de rede" };
    }
  }

  // ---- teste simples -------------------------------------------------------
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const url = joinUrl(this.baseUrl, "/branding/index.php");
      const res = await fetch(url, {
        method: "GET",
        headers: { ...this.authHeaders() },
      });
      if (res.ok) return { success: true, message: "OK" };
      return { success: false, message: `HTTP ${res.status}` };
    } catch (e: any) {
      return { success: false, message: e?.message || "Falha de rede" };
    }
  }
}

// 🎯 INSTÂNCIA SINGLETON
export const logoConfigService = new LogoConfigService();

// 🔧 HOOK para usar no React
import * as React from "react";

export const useLogoConfig = () => {
  const [configs, setConfigs] = React.useState<{
    login: LogoConfig;
    public: LogoConfig;
  } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const coerceArrayToObject = (arr: LogoConfig[]) => {
    const login = arr.find((c) => c.context === "login");
    const pub = arr.find((c) => c.context === "public");
    if (login && pub) return { login, public: pub };
    return null;
  };

  const loadConfigs = async () => {
    setLoading(true);
    setError(null);
    const res = await logoConfigService.getLogoConfigs();
    if (res.success) {
      if (Array.isArray(res.data)) {
        const obj = coerceArrayToObject(res.data as LogoConfig[]);
        if (obj) setConfigs(obj);
      } else if (
        res.data &&
        (res.data as any).login &&
        (res.data as any).public
      ) {
        setConfigs(res.data as { login: LogoConfig; public: LogoConfig });
      }
    } else {
      setError(res.error || "Erro ao carregar configurações");
    }
    setLoading(false);
  };

  const saveConfigs = async (newConfigs: {
    login: LogoConfig;
    public: LogoConfig;
  }) => {
    setLoading(true);
    setError(null);
    const res = await logoConfigService.saveLogoConfigs(newConfigs);
    if (res.success) {
      setConfigs(newConfigs);
      setLoading(false);
      return { success: true as const };
    }
    setError(res.error || "Erro ao salvar configurações");
    setLoading(false);
    return { success: false as const, error: res.error };
  };

  const resetConfigs = async () => {
    setLoading(true);
    setError(null);
    const res = await logoConfigService.resetToDefault();
    if (res.success) {
      await loadConfigs();
      setLoading(false);
      return { success: true as const };
    }
    setError(res.error || "Erro ao resetar configurações");
    setLoading(false);
    return { success: false as const, error: res.error };
  };

  return { configs, loading, error, loadConfigs, saveConfigs, resetConfigs };
};

export default logoConfigService;
