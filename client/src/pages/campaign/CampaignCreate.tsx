import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, PlusCircle } from 'lucide-react';
import { getCampaignAuthHeader, requireCampaignSession } from '@/components/campaign/CampaignAuth';

interface Agency {
    id: number;
    name: string;
    email: string;
    contactName?: string | null;
}

export default function CampaignCreate() {
    const [, setLocation] = useLocation();
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        customerName: '',
        customerEmail: '',
        campaignType: '',
        agencyId: '',
        assetDeadline: '',
        goLiveDate: '',
    });

    const [newAgency, setNewAgency] = useState({
        name: '',
        email: '',
        contactName: '',
    });

    const loadAgencies = async () => {
        const res = await fetch('/api/cs/agencies', {
            headers: getCampaignAuthHeader(),
            credentials: 'include',
        });
        if (!res.ok) {
            throw new Error('Failed to load agencies');
        }
        return res.json();
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
                const data = await loadAgencies();
                if (isMounted) setAgencies(data);
            } catch {
                // ignore
            } finally {
                if (isMounted) setLoading(false);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [setLocation]);

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleCreateAgency = async () => {
        setError(null);
        if (!newAgency.name || !newAgency.email) {
            setError('Agency name and email are required.');
            return;
        }
        try {
            const res = await fetch('/api/cs/agencies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getCampaignAuthHeader() },
                credentials: 'include',
                body: JSON.stringify(newAgency),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data?.message || 'Failed to create agency');
                return;
            }
            const agency = await res.json();
            setAgencies((prev) => [...prev, agency]);
            setForm((prev) => ({ ...prev, agencyId: String(agency.id) }));
            setNewAgency({ name: '', email: '', contactName: '' });
        } catch {
            setError('Failed to create agency');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const payload = {
                customerName: form.customerName,
                customerEmail: form.customerEmail,
                campaignType: form.campaignType,
                agencyId: Number(form.agencyId),
                assetDeadline: form.assetDeadline,
                goLiveDate: form.goLiveDate,
            };

            const res = await fetch('/api/cs/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getCampaignAuthHeader() },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data?.message || 'Failed to create campaign');
                setSubmitting(false);
                return;
            }

            const campaign = await res.json();
            setLocation(`/cs/campaigns/${campaign.id}`);
        } catch {
            setError('Failed to create campaign');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/cs" className="text-gray-600 hover:text-gray-800">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900">Create Campaign</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="text-center text-gray-500">Loading...</div>
                ) : (
                    <div className="grid gap-6">
                        <motion.form
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onSubmit={handleSubmit}
                            className="bg-white rounded-2xl shadow-lg p-6 space-y-6"
                        >
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Campaign Details</h2>
                                <p className="text-sm text-gray-500">Create a new campaign for a customer.</p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                                    <input
                                        type="text"
                                        value={form.customerName}
                                        onChange={(e) => handleChange('customerName', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                                    <input
                                        type="email"
                                        value={form.customerEmail}
                                        onChange={(e) => handleChange('customerEmail', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Type</label>
                                    <input
                                        type="text"
                                        value={form.campaignType}
                                        onChange={(e) => handleChange('campaignType', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Agency</label>
                                    <select
                                        value={form.agencyId}
                                        onChange={(e) => handleChange('agencyId', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        required
                                    >
                                        <option value="">Select an agency</option>
                                        {agencies.map((agency) => (
                                            <option key={agency.id} value={agency.id}>
                                                {agency.name} ({agency.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Asset Deadline</label>
                                    <input
                                        type="date"
                                        value={form.assetDeadline}
                                        onChange={(e) => handleChange('assetDeadline', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Go-live Date</label>
                                    <input
                                        type="date"
                                        value={form.goLiveDate}
                                        onChange={(e) => handleChange('goLiveDate', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                                >
                                    <Save className="w-4 h-4" />
                                    {submitting ? 'Creating...' : 'Create Campaign'}
                                </button>
                            </div>
                        </motion.form>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-lg p-6 space-y-4"
                        >
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Add New Agency</h2>
                                <p className="text-sm text-gray-500">Create an agency if it is not listed above.</p>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                                <input
                                    type="text"
                                    placeholder="Agency name"
                                    value={newAgency.name}
                                    onChange={(e) => setNewAgency((prev) => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                                <input
                                    type="email"
                                    placeholder="Agency email"
                                    value={newAgency.email}
                                    onChange={(e) => setNewAgency((prev) => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                                <input
                                    type="text"
                                    placeholder="Contact name (optional)"
                                    value={newAgency.contactName}
                                    onChange={(e) => setNewAgency((prev) => ({ ...prev, contactName: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleCreateAgency}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                            >
                                <PlusCircle className="w-4 h-4" />
                                Add Agency
                            </button>
                        </motion.div>
                    </div>
                )}
            </main>
        </div>
    );
}

