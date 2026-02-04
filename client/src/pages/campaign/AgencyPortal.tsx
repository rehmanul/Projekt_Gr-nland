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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">Campaign not found</p>
            </div>
        );
    }

    const customerAssets = campaign.assets.filter(a => a.assetType === 'asset');
    const drafts = campaign.assets.filter(a => a.assetType === 'draft');
    const canUploadDraft = ['assets_uploaded', 'draft_in_progress', 'revision_requested'].includes(campaign.status);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-purple-600" />
                        <h1 className="text-xl font-bold text-gray-900">Agency Portal</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/agency" className="text-purple-600 hover:text-purple-800">All Campaigns</Link>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-500 hover:text-gray-700"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Campaign Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg p-6 mb-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{campaign.customerName}</h2>
                            <p className="text-gray-600">{campaign.campaignType}</p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${campaign.status === 'revision_requested'
                            ? 'bg-red-100 text-red-800'
                            : campaign.status === 'approved' || campaign.status === 'live'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                            {statusLabels[campaign.status] || campaign.status}
                        </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
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

                {/* Customer Feedback Alert */}
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

                {/* Customer Assets */}
                {customerAssets.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 mb-6"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-600" />
                            Customer Brand Assets
                        </h3>
                        <div className="space-y-2">
                            {customerAssets.map(asset => (
                                <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-700">{asset.filename}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(asset)}
                                        className="flex items-center gap-1 text-purple-600 hover:text-purple-800"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Upload Draft Section */}
                {canUploadDraft && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 mb-6"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-purple-600" />
                            Upload Draft for Review
                        </h3>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-500 transition-colors">
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
                                    <div className="animate-spin w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full" />
                                ) : (
                                    <>
                                        <Upload className="w-10 h-10 text-gray-400 mb-3" />
                                        <p className="text-gray-600 mb-1">Click to upload draft for customer review</p>
                                        <p className="text-sm text-gray-400">Images, PDFs, Videos (max 50MB each)</p>
                                    </>
                                )}
                            </label>
                        </div>
                    </motion.div>
                )}

                {/* Your Submitted Drafts */}
                {drafts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 mb-6"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Submitted Drafts</h3>
                        <div className="space-y-2">
                            {drafts.map(draft => (
                                <div key={draft.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-purple-600" />
                                        <span className="text-gray-700">{draft.filename}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-500">
                                            {new Date(draft.uploadedAt).toLocaleString()}
                                        </span>
                                        <button
                                            onClick={() => handleDownload(draft)}
                                            className="flex items-center gap-1 text-purple-600 hover:text-purple-800"
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

                {/* Activity Timeline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg p-6"
                >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-600" />
                        Activity Timeline
                    </h3>
                    <div className="space-y-4">
                        {campaign.activities.map((activity, i) => (
                            <div key={activity.id} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 bg-purple-600 rounded-full" />
                                    {i < campaign.activities.length - 1 && (
                                        <div className="w-0.5 h-full bg-gray-200 mt-1" />
                                    )}
                                </div>
                                <div className="flex-1 pb-4">
                                    <p className="text-gray-700 font-medium">
                                        {activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {activity.actorType} • {new Date(activity.createdAt).toLocaleString()}
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
