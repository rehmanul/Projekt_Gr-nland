import { useState, useEffect, useRef } from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Upload,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    Download,
    MessageSquare,
    Calendar,
    AlertTriangle,
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
    awaiting_assets: 'Waiting for your assets',
    assets_uploaded: 'Assets received - waiting for draft',
    draft_in_progress: 'Agency creating draft',
    draft_submitted: 'Draft ready for your review',
    customer_review: 'Pending your review',
    revision_requested: 'Changes requested',
    approved: 'Approved!',
    live: 'Campaign is Live!',
};

export default function CustomerPortal() {
    const [match, params] = useRoute('/customer/campaign/:id');
    const id = params?.id;
    const [, setLocation] = useLocation();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [feedback, setFeedback] = useState('');
    const startReviewAttemptRef = useRef<string | null>(null);

    const handleLogout = () => {
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
            .finally(() => {
                setCampaignAuth(null);
                setLocation('/customer/login');
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
        const res = await fetch(`/api/customer/campaign/${id}`, {
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
            const user = await requireCampaignSession('customer');
            if (!user) {
                setLocation('/customer/login');
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
        if (campaign.status !== 'draft_submitted') return;
        const attemptKey = `${campaign.id}:${campaign.status}`;
        if (startReviewAttemptRef.current === attemptKey) return;
        startReviewAttemptRef.current = attemptKey;

        (async () => {
            try {
                const res = await fetch(`/api/customer/campaign/${campaign.id}/start-review`, {
                    method: 'POST',
                    headers: getCampaignAuthHeader(),
                    credentials: 'include',
                });
                if (res.ok) {
                    const updated = await loadCampaign();
                    setCampaign(updated);
                }
            } catch (err) {
                console.error('Start review failed:', err);
            }
        })();
    }, [campaign, id]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('files', file));

        try {
            const res = await fetch(`/api/customer/campaign/${id}/assets`, {
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

    const handleApprove = async () => {
        try {
            const res = await fetch(`/api/customer/campaign/${id}/approve`, {
                method: 'POST',
                headers: { ...getCampaignAuthHeader(), 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            if (res.ok) {
                window.location.reload();
            }
        } catch (err) {
            console.error('Approve failed:', err);
        }
    };

    const handleRequestChanges = async () => {
        if (!feedback.trim()) return;

        try {
            const res = await fetch(`/api/customer/campaign/${id}/request-changes`, {
                method: 'POST',
                headers: { ...getCampaignAuthHeader(), 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ feedback }),
            });
            if (res.ok) {
                window.location.reload();
            }
        } catch (err) {
            console.error('Request changes failed:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
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
    const canUploadAssets = campaign.status === 'awaiting_assets';
    const canReviewDraft = ['draft_submitted', 'customer_review'].includes(campaign.status);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <ArrowLeft className="w-5 h-5 text-blue-600" />
                        <Link to="/customer" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            All Campaigns
                        </Link>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-gray-700">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg p-6 mb-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold text-gray-900">{campaign.campaignType}</h1>
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${campaign.status === 'approved' || campaign.status === 'live'
                            ? 'bg-green-100 text-green-800'
                            : campaign.status === 'revision_requested'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                            {statusLabels[campaign.status] || campaign.status}
                        </span>
                    </div>

                    {/* Deadline countdown */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Asset Deadline: {new Date(campaign.assetDeadline).toLocaleDateString()}</span>
                        </div>
                        {campaign.daysUntilDeadline > 0 && (
                            <span className={`font-medium ${campaign.daysUntilDeadline <= 3 ? 'text-orange-600' : 'text-gray-600'}`}>
                                ({campaign.daysUntilDeadline} days left)
                            </span>
                        )}
                        {campaign.daysUntilDeadline < 0 && (
                            <span className="text-red-600 font-medium flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" />
                                Overdue
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* Upload Assets Section */}
                {canUploadAssets && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 mb-6"
                    >
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-blue-600" />
                            Upload Your Brand Assets
                        </h2>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                className="hidden"
                                id="asset-upload"
                                disabled={uploading}
                            />
                            <label
                                htmlFor="asset-upload"
                                className="cursor-pointer flex flex-col items-center"
                            >
                                {uploading ? (
                                    <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
                                ) : (
                                    <>
                                        <Upload className="w-10 h-10 text-gray-400 mb-3" />
                                        <p className="text-gray-600 mb-1">Click to upload or drag and drop</p>
                                        <p className="text-sm text-gray-400">Images, PDFs, Videos (max 50MB each)</p>
                                    </>
                                )}
                            </label>
                        </div>
                    </motion.div>
                )}

                {/* Your Assets */}
                {customerAssets.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 mb-6"
                    >
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Uploaded Assets</h2>
                        <div className="space-y-2">
                            {customerAssets.map(asset => (
                                <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-700">{asset.filename}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-500">
                                            {new Date(asset.uploadedAt).toLocaleString()}
                                        </span>
                                        <button
                                            onClick={() => handleDownload(asset)}
                                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
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

                {/* Draft Review Section */}
                {drafts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 mb-6"
                    >
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Draft for Review</h2>
                        <div className="space-y-2 mb-6">
                            {drafts.map(draft => (
                                <div key={draft.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        <span className="text-gray-700">{draft.filename}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(draft)}
                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>
                                </div>
                            ))}
                        </div>

                        {canReviewDraft && (
                            <div className="flex gap-4">
                                <button
                                    onClick={handleApprove}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    Approve Draft
                                </button>
                                <button
                                    onClick={() => setShowFeedbackForm(true)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                    Request Changes
                                </button>
                            </div>
                        )}

                        {showFeedbackForm && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-4"
                            >
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Describe the changes you'd like..."
                                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                    rows={4}
                                />
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={handleRequestChanges}
                                        disabled={!feedback.trim()}
                                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                                    >
                                        Submit Feedback
                                    </button>
                                    <button
                                        onClick={() => setShowFeedbackForm(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* Activity Timeline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg p-6"
                >
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-600" />
                        Activity Timeline
                    </h2>
                    <div className="space-y-4">
                        {campaign.activities.map((activity, i) => (
                            <div key={activity.id} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 bg-blue-600 rounded-full" />
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
