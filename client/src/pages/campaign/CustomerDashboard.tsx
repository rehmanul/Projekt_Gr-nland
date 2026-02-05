import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Calendar, Clock, LogOut, CheckCircle2, AlertTriangle, User } from 'lucide-react';
import { getCampaignAuthHeader, requireCampaignSession, setCampaignAuth } from '@/components/campaign/CampaignAuth';

interface Campaign {
    id: number;
    campaignType: string;
    status: string;
    assetDeadline: string;
    daysUntilDeadline: number;
    isOverdue: boolean;
}

const statusLabels: Record<string, string> = {
    awaiting_assets: 'Waiting for your assets',
    assets_uploaded: 'Assets received',
    draft_in_progress: 'Draft in Progress',
    draft_submitted: 'Draft ready',
    customer_review: 'Review pending',
    revision_requested: 'Changes requested',
    approved: 'Approved',
    live: 'Live',
};

export default function CustomerDashboard() {
    const [, setLocation] = useLocation();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    const handleLogout = () => {
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
            .finally(() => {
                setCampaignAuth(null);
                setLocation('/customer/login');
            });
    };

    const loadCampaigns = async () => {
        const res = await fetch('/api/customer/campaigns', {
            headers: getCampaignAuthHeader(),
            credentials: 'include',
        });
        if (!res.ok) {
            throw new Error('Failed to load campaigns');
        }
        return res.json();
    };

    useEffect(() => {
        let isMounted = true;
        (async () => {
            const user = await requireCampaignSession('customer');
            if (!user) {
                setLocation('/customer/login');
                return;
            }

            try {
                const data = await loadCampaigns();
                if (isMounted) setCampaigns(data);
            } catch {
                // ignore
            } finally {
                if (isMounted) setLoading(false);
            }
        })();

        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);

        ws.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data?.type === 'campaign_event') {
                    const updated = await loadCampaigns();
                    if (isMounted) setCampaigns(updated);
                }
            } catch {
                // ignore
            }
        };

        return () => {
            isMounted = false;
            ws.close();
        };
    }, [setLocation]);

    return (
        <div className="min-h-screen aurora-bg relative overflow-hidden">
            <div className="pointer-events-none absolute -top-24 left-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl float-slow" />
            <div className="pointer-events-none absolute top-20 right-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl float-fast" />

            <header className="bg-white/70 border-b border-white/40 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-sky-500 flex items-center justify-center shadow-md">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Customer Portal</h1>
                            <p className="text-xs text-slate-500">Track your campaign progress</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-slate-900">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="text-center text-slate-500">Loading campaigns...</div>
                ) : campaigns.length === 0 ? (
                    <div className="text-center text-slate-500">No campaigns found.</div>
                ) : (
                    <div className="grid gap-4">
                        {campaigns.map((campaign) => (
                            <motion.div
                                key={campaign.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass rounded-2xl shadow-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:shadow-xl transition hover-lift"
                            >
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">{campaign.campaignType}</h2>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Calendar className="w-4 h-4" />
                                        <span>Asset deadline: {new Date(campaign.assetDeadline).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                        {campaign.status === 'approved' || campaign.status === 'live' ? (
                                            <CheckCircle2 className="w-4 h-4" />
                                        ) : campaign.isOverdue ? (
                                            <AlertTriangle className="w-4 h-4" />
                                        ) : (
                                            <Clock className="w-4 h-4" />
                                        )}
                                        {statusLabels[campaign.status] || campaign.status}
                                    </span>
                                    {campaign.isOverdue && (
                                        <span className="text-xs text-red-600">Overdue</span>
                                    )}
                                </div>
                                <Link
                                    to={`/customer/campaign/${campaign.id}`}
                                    className="text-primary font-semibold"
                                >
                                    View
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
