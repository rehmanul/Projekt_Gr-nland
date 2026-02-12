import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { Mail, Loader2, CheckCircle2, AlertCircle, Sparkles, Lock } from "lucide-react";

export interface CampaignAuthUser {
  email: string;
  portalType: "cs" | "customer" | "agency";
  campaignId?: number;
  tenantId?: number;
}

interface AuthState {
  user: CampaignAuthUser | null;
  isLoading: boolean;
}

const AUTH_STORAGE_KEY = "campaign_auth";

export function getCampaignAuth(): AuthState {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { user: null, isLoading: false };
    }
  }
  return { user: null, isLoading: false };
}

export function setCampaignAuth(user: CampaignAuthUser | null) {
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, isLoading: false }));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function getCampaignAuthHeader(): Record<string, string> {
  return {};
}

export async function requireCampaignSession(
  portalType: CampaignAuthUser["portalType"],
): Promise<CampaignAuthUser | null> {
  try {
    const res = await fetch("/api/auth/session", { credentials: "include" });
    if (!res.ok) {
      setCampaignAuth(null);
      return null;
    }
    const data = await res.json();
    if (data?.user?.portalType !== portalType) {
      setCampaignAuth(null);
      return null;
    }
    setCampaignAuth(data.user);
    return data.user as CampaignAuthUser;
  } catch {
    setCampaignAuth(null);
    return null;
  }
}

const portalNames = {
  cs: "CS Dashboard",
  customer: "Customer Portal",
  agency: "Agency Portal",
};

const portalTaglines = {
  cs: "Restricted access for CS team members",
  customer: "Review and approve in minutes",
  agency: "Deliver standout drafts quickly",
};

function AuthShell({
  title,
  tagline,
  icon,
  children,
}: {
  title: string;
  tagline: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center aurora-bg relative overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -top-24 left-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl float-slow" />
      <div className="pointer-events-none absolute top-20 right-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl float-fast" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="gradient-border w-full max-w-md">
        <div className="gradient-inner glass rounded-3xl p-8 hover-glow">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              {icon}
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Secure Access
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            <p className="text-slate-600 mt-2">{tagline}</p>
          </div>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

export function CSLogin() {
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("Invalid credentials");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("Invalid credentials");

    try {
      const res = await fetch("/api/auth/cs-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.user) {
        setStatus("error");
        setMessage(data?.message || "Invalid credentials");
        return;
      }

      setCampaignAuth(data.user);
      const redirectPath = searchParams.get("redirect");
      setLocation(redirectPath || "/cs");
    } catch {
      setStatus("error");
      setMessage("Unable to log in. Please try again.");
    }
  };

  return (
    <AuthShell title={portalNames.cs} tagline={portalTaglines.cs} icon={<Lock className="w-8 h-8 text-white" />}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">CS Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl input-glass"
            placeholder="name@company.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl input-glass"
            placeholder="Enter your CS password"
            required
          />
        </div>

        {status === "error" && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-primary via-sky-500 to-accent shine shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 button-pop"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </AuthShell>
  );
}

export function MagicLinkRequest({ portalType }: { portalType: "customer" | "agency" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/auth/request-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, portalType }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus("success");
        setMessage(data?.message || "Login link sent. Check your inbox.");
      } else {
        setStatus("error");
        setMessage(data?.message || "Failed to send login link. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Failed to send login link. Please try again.");
    }
  };

  return (
    <AuthShell title={portalNames[portalType]} tagline={portalTaglines[portalType]} icon={<Mail className="w-8 h-8 text-white" />}>
      {status === "success" ? (
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <p className="text-emerald-700 font-medium">{message}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl input-glass"
              placeholder="you@example.com"
              required
            />
          </div>

          {status === "error" && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-primary via-sky-500 to-accent shine shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 button-pop"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Login Link"
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export function MagicLinkVerify({ portalType }: { portalType: "customer" | "agency" }) {
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      return;
    }

    fetch(`/api/auth/verify/${token}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCampaignAuth(data.user);
          setStatus("success");

          setTimeout(() => {
            const campaignId = searchParams.get("campaignId");
            if (campaignId) {
              setLocation(`/${portalType}/campaign/${campaignId}`);
            } else {
              setLocation(`/${portalType}`);
            }
          }, 1200);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [search, setLocation, portalType]);

  return (
    <AuthShell title={portalNames[portalType]} tagline={portalTaglines[portalType]} icon={<Mail className="w-8 h-8 text-white" />}>
      <div className="text-center">
        {status === "verifying" && (
          <>
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Verifying your login...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <p className="text-emerald-700 font-medium">Login successful. Redirecting...</p>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-700 font-medium">Invalid or expired link</p>
            <button
              onClick={() => setLocation(`/${portalType}/login`)}
              className="mt-4 px-6 py-2 rounded-xl text-white bg-gradient-to-r from-primary via-sky-500 to-accent button-pop"
            >
              Request New Link
            </button>
          </>
        )}
      </div>
    </AuthShell>
  );
}
