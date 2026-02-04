import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { motion } from 'framer-motion';
import { Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

// Auth context for campaign portals
export interface CampaignAuthUser {
    email: string;
    portalType: 'cs' | 'customer' | 'agency';
    campaignId?: number;
    tenantId?: number;
}

interface AuthState {
    user: CampaignAuthUser | null;
    isLoading: boolean;
}

// Storage key for auth
const AUTH_STORAGE_KEY = 'campaign_auth';

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

export async function requireCampaignSession(portalType: CampaignAuthUser["portalType"]): Promise<CampaignAuthUser | null> {
    try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
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

// Magic Link Request Component
export function MagicLinkRequest({ portalType }: { portalType: 'cs' | 'customer' | 'agency' }) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const portalNames = {
        cs: 'CS Dashboard',
        customer: 'Customer Portal',
        agency: 'Agency Portal'
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const res = await fetch('/api/auth/request-magic-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, portalType }),
            });

            if (res.ok) {
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">{portalNames[portalType]}</h1>
                    <p className="text-gray-600 mt-2">Enter your email to receive a login link</p>
                </div>

                {status === 'success' ? (
                    <div className="text-center">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <p className="text-green-700 font-medium">Check your email for the login link!</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        {status === 'error' && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                <span>Failed to send magic link. Please try again.</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {status === 'loading' ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                'Send Magic Link'
                            )}
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    );
}

// Magic Link Verification Component
export function MagicLinkVerify({ portalType }: { portalType: 'cs' | 'customer' | 'agency' }) {
    const search = useSearch();
    const searchParams = new URLSearchParams(search);
    const [, setLocation] = useLocation();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStatus('error');
            return;
        }

        fetch(`/api/auth/verify/${token}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setCampaignAuth(data.user);
                    setStatus('success');

                    // Redirect to appropriate portal
                    setTimeout(() => {
                        const campaignId = searchParams.get('campaignId');
                        if (campaignId) {
                            setLocation(`/${portalType}/campaign/${campaignId}`);
                        } else {
                            setLocation(`/${portalType}`);
                        }
                    }, 1500);
                } else {
                    setStatus('error');
                }
            })
            .catch(() => setStatus('error'));
    }, [search, setLocation, portalType]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
            >
                {status === 'verifying' && (
                    <>
                        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Verifying your login...</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <p className="text-green-700 font-medium">Login successful! Redirecting...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <p className="text-red-700 font-medium">Invalid or expired link</p>
                        <button
                            onClick={() => setLocation(`/${portalType}/login`)}
                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Request New Link
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
}
