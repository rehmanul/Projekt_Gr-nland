import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Building2, Calendar, Clock, LogOut, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getCampaignAuthHeader, requireCampaignSession, setCampaignAuth } from '@/components/campaign/CampaignAuth';

interface Campaign {
    id: number;
    customerName: string;
    campaignType: string;
    status: string;
    assetDeadline: string;
    goLiveDate: string;
    isOverdue: boolean;
    daysUntilDeadline: number;
}

const statusLabels: Record<string, string> = {
    awaiting_assets: 'Awaiting Assets',
    assets_uploaded: 'Assets Ready',
    draft_in_progress: 'Draft in Progress',
    draft_submitted: 'Draft Submitted',
    customer_review: 'Customer Reviewing',
    revision_requested: 'Revision Requested',
    approved: 'Approved',
    live: 'Live',
};

export default function AgencyDashboard() {
    const [, setLocation] = useLocation();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    const handleLogout = () => {
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
            .finally(() => {
                setCampaignAuth(null);
                setLocation('/agency/login');
            });
    };

    const loadCampaigns = async () => {
        const res = await fetch('/api/agency/campaigns', {
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
            const user = await requireCampaignSession('agency');
            if (!user) {
                setLocation('/agency/login');
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
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-purple-600" />
                        <h1 className="text-xl font-bold text-gray-900">Agency Dashboard</h1>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-gray-700">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="text-center text-gray-500">Loading campaigns...</div>
                ) : campaigns.length === 0 ? (
                    <div className="text-center text-gray-500">No campaigns assigned yet.</div>
                ) : (
                    <div className="grid gap-4">
                        {campaigns.map((campaign) => (
                            <motion.div
                                key={campaign.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                            >
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">{campaign.customerName}</h2>
                                    <p className="text-sm text-gray-500">{campaign.campaignType}</p>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>Go-live: {new Date(campaign.goLiveDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
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
                                    to={`/agency/campaign/${campaign.id}`}
                                    className="text-purple-600 hover:text-purple-800 font-medium"
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
