import { useState, useEffect, useRef } from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import { motion } from 'framer-motion';
import {
    Building2,
    Upload,
    Download,
    FileText,
    Clock,
    CheckCircle2,
    AlertTriangle,
    MessageSquare,
    LogOut,
    Calendar,
} from 'lucide-react';
import { getCampaignAuthHeader, requireCampaignSession, setCampaignAuth } from '@/components/campaign/CampaignAuth';

interface Campaign {
    id: number;
    customerName: string;
    campaignType: string;
    status: string;
    assetDeadline: string;
    goLiveDate: string;
    customerFeedback: string | null;
    daysUntilDeadline: number;
    isOverdue: boolean;
    assets: CampaignAsset[];
    activities: CampaignActivity[];
}

interface CampaignAsset {
    id: number;
    assetType: 'asset' | 'draft';
    filename: string;
    uploadedAt: string;
    uploadedBy: string;
    downloadUrl?: string;
}

interface CampaignActivity {
    id: number;
    action: string;
    actorType: string;
    actorEmail: string;
    details: Record<string, any>;
    createdAt: string;
}

const statusLabels: Record<string, string> = {
    awaiting_assets: 'Awaiting Assets',
    assets_uploaded: 'Assets Ready - Create Draft',
    draft_in_progress: 'Draft in Progress',
    draft_submitted: 'Draft Submitted',
    customer_review: 'Customer Reviewing',
    revision_requested: 'Revision Requested',
    approved: 'Approved',
    live: 'Live',
};

export default function AgencyPortalCampaign() {
    const [match, params] = useRoute('/agency/campaign/:id');
    const id = params?.id;
    const [, setLocation] = useLocation();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const startDraftAttemptRef = useRef<string | null>(null);

    const handleLogout = () => {
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
            .finally(() => {
                setCampaignAuth(null);
                setLocation('/agency/login');
            });
    };

    const handleDownload = async (asset: CampaignAsset) => {
        if (!asset.downloadUrl) return;
        try {
            const res = await fetch(asset.downloadUrl, { credentials: 'include' });
            if (!res.ok) return;
            const data = await res.json();
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error('Download failed:', err);
        }
    };

    const loadCampaign = async () => {
        const res = await fetch(`/api/agency/campaign/${id}`, {
            headers: getCampaignAuthHeader(),
            credentials: 'include',
        });
        if (!res.ok) {
            throw new Error('Failed to load campaign');
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
                const data = await loadCampaign();
                if (!isMounted) return;
                setCampaign(data);
            } catch {
                if (!isMounted) return;
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
                // ignore parse errors
            }
        };

        return () => {
            ws.close();
        };
    }, [id]);

    useEffect(() => {
        if (!campaign || !id) return;
        if (!['assets_uploaded', 'revision_requested'].includes(campaign.status)) return;
        const attemptKey = `${campaign.id}:${campaign.status}`;
        if (startDraftAttemptRef.current === attemptKey) return;
        startDraftAttemptRef.current = attemptKey;

        (async () => {
            try {
                const res = await fetch(`/api/agency/campaign/${campaign.id}/start-draft`, {
                    method: 'POST',
                    headers: getCampaignAuthHeader(),
                    credentials: 'include',
                });
                if (res.ok) {
                    const updated = await loadCampaign();
                    setCampaign(updated);
                }
            } catch (err) {
                console.error('Start draft failed:', err);
            }
        })();
    }, [campaign, id]);

    const handleDraftUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('files', file));

        try {
            const res = await fetch(`/api/agency/campaign/${id}/draft`, {
                method: 'POST',
                headers: getCampaignAuthHeader(),
                credentials: 'include',
                body: formData,
            });
            if (res.ok) {
                window.location.reload();
            }
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center aurora-bg">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="min-h-screen flex items-center justify-center aurora-bg">
                <p className="text-slate-500">Campaign not found</p>
            </div>
        );
    }

    const customerAssets = campaign.assets.filter(a => a.assetType === 'asset');
    const drafts = campaign.assets.filter(a => a.assetType === 'draft');
    const canUploadDraft = ['assets_uploaded', 'draft_in_progress', 'revision_requested'].includes(campaign.status);

    return (
        <div className="min-h-screen aurora-bg relative overflow-hidden">
            <div className="pointer-events-none absolute -top-24 left-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl float-slow" />
            <div className="pointer-events-none absolute top-20 right-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl float-fast" />

            <header className="bg-white/70 border-b border-white/40 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-sky-500 flex items-center justify-center shadow-md">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Agency Portal</h1>
                            <p className="text-xs text-slate-500">Create drafts and iterate fast</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/agency" className="text-primary hover:text-slate-900">All Campaigns</Link>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-500 hover:text-slate-900" aria-label="Log out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl shadow-lg p-6 hover-glow mb-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{campaign.customerName}</h2>
                            <p className="text-slate-600">{campaign.campaignType}</p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${campaign.status === 'revision_requested'
                            ? 'bg-red-100 text-red-800'
                            : campaign.status === 'approved' || campaign.status === 'live'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-primary/10 text-primary'
                            }`}>
                            {statusLabels[campaign.status] || campaign.status}
                        </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Go-live: {new Date(campaign.goLiveDate).toLocaleDateString()}</span>
                        </div>
                        {campaign.isOverdue && (
                            <span className="text-red-600 font-medium flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" />
                                Campaign Overdue
                            </span>
                        )}
                    </div>
                </motion.div>

                {campaign.status === 'revision_requested' && campaign.customerFeedback && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6"
                    >
                        <div className="flex items-start gap-3">
                            <MessageSquare className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-red-900 mb-2">Customer Feedback</h3>
                                <p className="text-red-800">{campaign.customerFeedback}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {customerAssets.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-2xl shadow-lg p-6 hover-glow mb-6"
                    >
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            Customer Brand Assets
                        </h3>
                        <div className="space-y-2">
                            {customerAssets.map(asset => (
                                <div key={asset.id} className="flex items-center justify-between p-3 bg-white/70 rounded-lg hover-lift">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-slate-400" />
                                        <span className="text-slate-700">{asset.filename}</span>
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

                {canUploadDraft && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-2xl shadow-lg p-6 hover-glow mb-6"
                    >
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-primary" />
                            Upload Draft for Review
                        </h3>
                        <div className="border-2 border-dashed border-white/80 rounded-xl p-8 text-center hover:border-primary/60 transition-colors">
                            <input
                                type="file"
                                multiple
                                onChange={handleDraftUpload}
                                className="hidden"
                                id="draft-upload"
                                disabled={uploading}
                            />
                            <label
                                htmlFor="draft-upload"
                                className="cursor-pointer flex flex-col items-center"
                            >
                                {uploading ? (
                                    <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
                                ) : (
                                    <>
                                        <Upload className="w-10 h-10 text-slate-400 mb-3" />
                                        <p className="text-slate-600 mb-1">Click to upload draft for customer review</p>
                                        <p className="text-sm text-slate-400">Images, PDFs, Videos (max 50MB each)</p>
                                    </>
                                )}
                            </label>
                        </div>
                    </motion.div>
                )}

                {drafts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-2xl shadow-lg p-6 hover-glow mb-6"
                    >
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Submitted Drafts</h3>
                        <div className="space-y-2">
                            {drafts.map(draft => (
                                <div key={draft.id} className="flex items-center justify-between p-3 bg-primary/10 rounded-lg hover-lift">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                        <span className="text-slate-700">{draft.filename}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-slate-500">
                                            {new Date(draft.uploadedAt).toLocaleString()}
                                        </span>
                                        <button
                                            onClick={() => handleDownload(draft)}
                                            className="flex items-center gap-1 text-primary hover:text-slate-900"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl shadow-lg p-6 hover-glow"
                >
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-slate-600" />
                        Activity Timeline
                    </h3>
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
                                        {activity.actorType} - {new Date(activity.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
