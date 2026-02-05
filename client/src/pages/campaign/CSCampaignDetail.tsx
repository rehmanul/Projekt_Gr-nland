import { useEffect, useState } from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, FileText, Download, Clock, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { getCampaignAuthHeader, requireCampaignSession } from '@/components/campaign/CampaignAuth';

interface CampaignAsset {
    id: number;
    assetType: 'asset' | 'draft';
    filename: string;
    uploadedAt: string;
    downloadUrl?: string;
}

interface CampaignActivity {
    id: number;
    action: string;
    actorType: string;
    actorEmail: string;
    createdAt: string;
}

interface Campaign {
    id: number;
    customerName: string;
    customerEmail: string;
    campaignType: string;
    status: string;
    assetDeadline: string;
    goLiveDate: string;
    assets: CampaignAsset[];
    activities: CampaignActivity[];
    isOverdue: boolean;
    daysUntilDeadline: number;
}

const statusLabels: Record<string, string> = {
    awaiting_assets: 'Awaiting Assets',
    assets_uploaded: 'Assets Uploaded',
    draft_in_progress: 'Draft in Progress',
    draft_submitted: 'Draft Submitted',
    customer_review: 'Customer Review',
    revision_requested: 'Revision Requested',
    approved: 'Approved',
    live: 'Live',
};

export default function CSCampaignDetail() {
    const [, setLocation] = useLocation();
    const [match, params] = useRoute('/cs/campaigns/:id');
    const id = params?.id;
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [markingLive, setMarkingLive] = useState(false);
    const [markLiveError, setMarkLiveError] = useState<string | null>(null);

    const loadCampaign = async () => {
        const res = await fetch(`/api/cs/campaigns/${id}`, {
            headers: getCampaignAuthHeader(),
            credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to load campaign');
        return res.json();
    };

    const handleDownload = async (asset: CampaignAsset) => {
        if (!asset.downloadUrl) return;
        const res = await fetch(asset.downloadUrl, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.url) {
            window.location.href = data.url;
        }
    };

    const handleMarkLive = async () => {
        if (!campaign) return;
        setMarkLiveError(null);
        setMarkingLive(true);
        try {
            const res = await fetch(`/api/cs/campaigns/${campaign.id}/mark-live`, {
                method: 'POST',
                headers: getCampaignAuthHeader(),
                credentials: 'include',
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                setMarkLiveError(data?.message || 'Failed to mark campaign live');
                return;
            }
            const updated = await loadCampaign();
            setCampaign(updated);
        } catch (err) {
            console.error('Mark live failed:', err);
            setMarkLiveError('Failed to mark campaign live');
        } finally {
            setMarkingLive(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        (async () => {
            const user = await requireCampaignSession('cs');
            if (!user) {
                setLocation('/cs/login');
                return;
            }
            try {
                const data = await loadCampaign();
                if (isMounted) setCampaign(data);
            } catch {
                // ignore
            } finally {
                if (isMounted) setLoading(false);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [id, setLocation]);

    useEffect(() => {
        if (!id) return;
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'subscribe', campaignId: Number(id) }));
        };

        ws.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data?.type === 'campaign_event' && data?.campaignId === Number(id)) {
                    const updated = await loadCampaign();
                    setCampaign(updated);
                }
            } catch {
                // ignore
            }
        };

        return () => {
            ws.close();
        };
    }, [id]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center aurora-bg">Loading...</div>;
    }

    if (!campaign) {
        return <div className="min-h-screen flex items-center justify-center aurora-bg">Campaign not found</div>;
    }

    const assets = campaign.assets.filter(a => a.assetType === 'asset');
    const drafts = campaign.assets.filter(a => a.assetType === 'draft');
    const canMarkLive = campaign.status === 'approved' && new Date(campaign.goLiveDate).getTime() <= Date.now();

    return (
        <div className="min-h-screen aurora-bg relative overflow-hidden">
            <div className="pointer-events-none absolute -top-24 left-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl float-slow" />
            <div className="pointer-events-none absolute top-20 right-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl float-fast" />

            <header className="bg-white/70 border-b border-white/40 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
                    <Link to="/cs" className="text-slate-600 hover:text-slate-900">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Campaign Detail</h1>
                        <p className="text-xs text-slate-500">Stay close to the timeline</p>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl shadow-lg p-6 hover-glow"
                >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{campaign.customerName}</h2>
                            <p className="text-slate-600">{campaign.customerEmail}</p>
                            <p className="text-sm text-slate-500">{campaign.campaignType}</p>
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
                            {canMarkLive && (
                                <button
                                    onClick={handleMarkLive}
                                    disabled={markingLive}
                                    className="px-4 py-2 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-emerald-500 to-lime-500 shadow-md button-pop disabled:opacity-60"
                                >
                                    {markingLive ? 'Marking Live...' : 'Mark Live'}
                                </button>
                            )}
                        </div>
                    </div>
                    {markLiveError && (
                        <p className="mt-3 text-sm text-red-600">{markLiveError}</p>
                    )}
                    <div className="flex flex-col md:flex-row gap-4 text-sm text-slate-600 mt-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Asset deadline: {new Date(campaign.assetDeadline).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Go-live: {new Date(campaign.goLiveDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </motion.div>

                {assets.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-2xl shadow-lg p-6 hover-glow"
                    >
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Customer Assets</h3>
                        <div className="space-y-2">
                            {assets.map((asset) => (
                                <div key={asset.id} className="flex items-center justify-between p-3 bg-white/70 rounded-lg hover-lift">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-slate-400" />
                                        <span>{asset.filename}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(asset)}
                                        className="flex items-center gap-1 text-primary hover:text-slate-900"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {drafts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-2xl shadow-lg p-6 hover-glow"
                    >
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Drafts</h3>
                        <div className="space-y-2">
                            {drafts.map((draft) => (
                                <div key={draft.id} className="flex items-center justify-between p-3 bg-white/70 rounded-lg hover-lift">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-slate-400" />
                                        <span>{draft.filename}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(draft)}
                                        className="flex items-center gap-1 text-primary hover:text-slate-900"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl shadow-lg p-6 hover-glow"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h3 className="text-lg font-semibold text-slate-900">Activity Timeline</h3>
                    </div>
                    <div className="space-y-4">
                        {campaign.activities.map((activity, i) => (
                            <div key={activity.id} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 bg-primary rounded-full" />
                                    {i < campaign.activities.length - 1 && (
                                        <div className="w-0.5 h-full bg-white/60 mt-1" />
                                    )}
                                </div>
                                <div className="flex-1 pb-4">
                                    <p className="text-slate-700 font-medium">
                                        {activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {activity.actorType} · {new Date(activity.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
