import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Plus,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Users,
    Building2,
    Calendar,
    Filter,
    Search,
    Bell,
    LogOut,
} from 'lucide-react';
import { setCampaignAuth, getCampaignAuthHeader, requireCampaignSession } from '@/components/campaign/CampaignAuth';

interface Campaign {
    id: number;
    customerName: string;
    customerEmail: string;
    campaignType: string;
    status: string;
    assetDeadline: string;
    goLiveDate: string;
    isOverdue: boolean;
    daysUntilDeadline: number;
    createdAt: string;
}

const statusColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    awaiting_assets: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock className="w-4 h-4" /> },
    assets_uploaded: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <CheckCircle2 className="w-4 h-4" /> },
    draft_in_progress: { bg: 'bg-purple-100', text: 'text-purple-800', icon: <Clock className="w-4 h-4" /> },
    draft_submitted: { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: <CheckCircle2 className="w-4 h-4" /> },
    customer_review: { bg: 'bg-orange-100', text: 'text-orange-800', icon: <Clock className="w-4 h-4" /> },
    revision_requested: { bg: 'bg-red-100', text: 'text-red-800', icon: <AlertTriangle className="w-4 h-4" /> },
    approved: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle2 className="w-4 h-4" /> },
    live: { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: <CheckCircle2 className="w-4 h-4" /> },
};

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

export default function CSDashboard() {
    const [, setLocation] = useLocation();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        let isMounted = true;
        const loadCampaigns = async () => {
            const res = await fetch('/api/cs/campaigns', {
                headers: getCampaignAuthHeader(),
                credentials: 'include',
            });
            if (!res.ok) {
                throw new Error('Failed to load campaigns');
            }
            return res.json();
        };

        (async () => {
            const user = await requireCampaignSession('cs');
            if (!user) {
                setLocation('/cs/login');
                return;
            }

            try {
                const data = await loadCampaigns();
                if (!isMounted) return;
                setCampaigns(data);
            } catch {
                if (!isMounted) return;
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
                // ignore parse errors
            }
        };

        return () => {
            isMounted = false;
            ws.close();
        };
    }, [setLocation]);

    const handleLogout = () => {
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
            .finally(() => {
                setCampaignAuth(null);
                setLocation('/cs/login');
            });
    };

    const filteredCampaigns = campaigns.filter(c => {
        if (filter !== 'all' && c.status !== filter) return false;
        if (filter === 'overdue' && !c.isOverdue) return false;
        if (search && !c.customerName.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const stats = {
        total: campaigns.length,
        overdue: campaigns.filter(c => c.isOverdue).length,
        pending: campaigns.filter(c => ['awaiting_assets', 'draft_in_progress', 'customer_review'].includes(c.status)).length,
        approved: campaigns.filter(c => c.status === 'approved' || c.status === 'live').length,
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <LayoutDashboard className="w-8 h-8 text-blue-600" />
                            <h1 className="text-xl font-bold text-gray-900">CS Dashboard</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="p-2 text-gray-500 hover:text-gray-700 relative">
                                <Bell className="w-5 h-5" />
                                {stats.overdue > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                        {stats.overdue}
                                    </span>
                                )}
                            </button>
                            <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-gray-700">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Campaigns', value: stats.total, icon: <LayoutDashboard />, color: 'blue' },
                        { label: 'Overdue', value: stats.overdue, icon: <AlertTriangle />, color: 'red' },
                        { label: 'Pending', value: stats.pending, icon: <Clock />, color: 'yellow' },
                        { label: 'Approved', value: stats.approved, icon: <CheckCircle2 />, color: 'green' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-xl p-6 shadow-sm"
                        >
                            <div className={`w-10 h-10 rounded-lg bg-${stat.color}-100 flex items-center justify-center mb-3`}>
                                <span className={`text-${stat.color}-600`}>{stat.icon}</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-sm text-gray-500">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Filters and Actions */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by customer name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="overdue">Overdue</option>
                            {Object.entries(statusLabels).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <Link
                            to="/cs/campaigns/new"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            New Campaign
                        </Link>
                    </div>
                </div>

                {/* Campaigns Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : filteredCampaigns.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No campaigns found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Go-Live</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredCampaigns.map((campaign) => {
                                        const statusStyle = statusColors[campaign.status] || statusColors.awaiting_assets;
                                        return (
                                            <motion.tr
                                                key={campaign.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{campaign.customerName}</div>
                                                    <div className="text-sm text-gray-500">{campaign.customerEmail}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-gray-700">{campaign.campaignType}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                                                        {statusStyle.icon}
                                                        {statusLabels[campaign.status] || campaign.status}
                                                    </span>
                                                    {campaign.isOverdue && (
                                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                            Overdue
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-700">
                                                        {new Date(campaign.assetDeadline).toLocaleDateString()}
                                                    </div>
                                                    <div className={`text-xs ${campaign.daysUntilDeadline < 0 ? 'text-red-500' : campaign.daysUntilDeadline <= 3 ? 'text-orange-500' : 'text-gray-500'}`}>
                                                        {campaign.daysUntilDeadline < 0
                                                            ? `${Math.abs(campaign.daysUntilDeadline)} days overdue`
                                                            : `${campaign.daysUntilDeadline} days left`}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {new Date(campaign.goLiveDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link
                                                        to={`/cs/campaigns/${campaign.id}`}
                                                        className="text-blue-600 hover:text-blue-800 font-medium"
                                                    >
                                                        View
                                                    </Link>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
