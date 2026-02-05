import { useState } from 'react';
import { ChevronDown, ChevronUp, X, Briefcase, MapPin, Clock, DollarSign, Building2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface AdvancedFilters {
    salaryMin?: number;
    salaryMax?: number;
    remoteType: string[];
    experienceLevel: string[];
    postedWithin: string;
    companySize: string[];
    category?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
    filters: AdvancedFilters;
    onChange: (filters: AdvancedFilters) => void;
    onClear: () => void;
}

const REMOTE_OPTIONS = [
    { value: 'on-site', label: 'On-site' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'remote', label: 'Remote' },
];

const EXPERIENCE_OPTIONS = [
    { value: 'entry', label: 'Entry Level' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior' },
    { value: 'executive', label: 'Executive' },
];

const POSTED_OPTIONS = [
    { value: 'all', label: 'All time' },
    { value: 'today', label: 'Today' },
    { value: '7days', label: 'Past 7 days' },
    { value: '30days', label: 'Past 30 days' },
];

const COMPANY_SIZE_OPTIONS = [
    { value: '1-50', label: '1-50 employees' },
    { value: '51-200', label: '51-200' },
    { value: '201-1000', label: '201-1000' },
    { value: '1000+', label: '1000+' },
];

const CATEGORY_OPTIONS = [
    { value: '', label: 'All Industries' },
    { value: 'Technology', label: 'Technology' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Manufacturing', label: 'Manufacturing' },
    { value: 'Retail', label: 'Retail' },
    { value: 'Education', label: 'Education' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Other', label: 'Other' },
];

const SORT_OPTIONS = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'date', label: 'Date Posted' },
    { value: 'salary', label: 'Salary' },
];

function formatSalary(value: number): string {
    if (value >= 1000) {
        return `EUR ${Math.floor(value / 1000)}k`;
    }
    return `EUR ${value}`;
}

export function AdvancedFiltersPanel({ filters, onChange, onClear }: AdvancedFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleCheckboxChange = (field: 'remoteType' | 'experienceLevel' | 'companySize', value: string, checked: boolean) => {
        const current = filters[field];
        const updated = checked
            ? [...current, value]
            : current.filter(v => v !== value);
        onChange({ ...filters, [field]: updated });
    };

    const activeFilterCount = [
        filters.salaryMin || filters.salaryMax,
        filters.remoteType.length > 0,
        filters.experienceLevel.length > 0,
        filters.postedWithin !== 'all',
        filters.companySize.length > 0,
        filters.category,
    ].filter(Boolean).length;

    const getActiveFilters = () => {
        const active: { label: string; onRemove: () => void }[] = [];

        if (filters.salaryMin || filters.salaryMax) {
            const min = filters.salaryMin ? formatSalary(filters.salaryMin) : 'EUR 0';
            const max = filters.salaryMax ? formatSalary(filters.salaryMax) : 'EUR 200k+';
            active.push({
                label: `${min} - ${max}`,
                onRemove: () => onChange({ ...filters, salaryMin: undefined, salaryMax: undefined }),
            });
        }

        filters.remoteType.forEach(type => {
            const option = REMOTE_OPTIONS.find(o => o.value === type);
            if (option) {
                active.push({
                    label: option.label,
                    onRemove: () => handleCheckboxChange('remoteType', type, false),
                });
            }
        });

        filters.experienceLevel.forEach(level => {
            const option = EXPERIENCE_OPTIONS.find(o => o.value === level);
            if (option) {
                active.push({
                    label: option.label,
                    onRemove: () => handleCheckboxChange('experienceLevel', level, false),
                });
            }
        });

        if (filters.postedWithin !== 'all') {
            const option = POSTED_OPTIONS.find(o => o.value === filters.postedWithin);
            if (option) {
                active.push({
                    label: `Posted: ${option.label}`,
                    onRemove: () => onChange({ ...filters, postedWithin: 'all' }),
                });
            }
        }

        if (filters.category) {
            active.push({
                label: filters.category,
                onRemove: () => onChange({ ...filters, category: undefined }),
            });
        }

        return active;
    };

    return (
        <div className="glass rounded-2xl border border-white/60 shadow-sm hover-glow overflow-hidden text-slate-700">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/60 transition-colors"
                aria-expanded={isExpanded}
                aria-controls="advanced-filters-panel"
            >
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Advanced Filters</span>
                    {activeFilterCount > 0 && (
                        <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full badge-pulse">
                            {activeFilterCount}
                        </span>
                    )}
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-500" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                )}
            </button>

            {activeFilterCount > 0 && !isExpanded && (
                <div className="px-4 pb-3 flex flex-wrap gap-2">
                    {getActiveFilters().slice(0, 5).map((filter, i) => (
                        <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-white/70 rounded-full text-xs text-slate-600"
                        >
                            {filter.label}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    filter.onRemove();
                                }}
                                className="hover:text-red-500"
                                aria-label={`Remove filter ${filter.label}`}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    {getActiveFilters().length > 5 && (
                        <span className="text-xs text-slate-500">+{getActiveFilters().length - 5} more</span>
                    )}
                </div>
            )}

            <div
                id="advanced-filters-panel"
                className={`grid transition-all duration-300 ease-out border-t border-white/60 bg-white text-slate-700 ${
                    isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
                }`}
            >
                <div className="overflow-hidden">
                    <div className="p-4 space-y-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <DollarSign className="w-4 h-4" />
                                    Salary Range (EUR per year)
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-500">Min:</span>
                                        <select
                                            value={filters.salaryMin || ''}
                                            onChange={(e) => onChange({
                                                ...filters,
                                                salaryMin: e.target.value ? Number(e.target.value) : undefined
                                            })}
                                            className="px-3 py-2 text-sm rounded-lg input-glass"
                                        >
                                            <option value="">Any</option>
                                            <option value="20000">EUR 20k</option>
                                            <option value="30000">EUR 30k</option>
                                            <option value="40000">EUR 40k</option>
                                            <option value="50000">EUR 50k</option>
                                            <option value="60000">EUR 60k</option>
                                            <option value="80000">EUR 80k</option>
                                            <option value="100000">EUR 100k</option>
                                        </select>
                                    </div>
                                    <span className="text-slate-400">-</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-500">Max:</span>
                                        <select
                                            value={filters.salaryMax || ''}
                                            onChange={(e) => onChange({
                                                ...filters,
                                                salaryMax: e.target.value ? Number(e.target.value) : undefined
                                            })}
                                            className="px-3 py-2 text-sm rounded-lg input-glass"
                                        >
                                            <option value="">Any</option>
                                            <option value="30000">EUR 30k</option>
                                            <option value="40000">EUR 40k</option>
                                            <option value="50000">EUR 50k</option>
                                            <option value="60000">EUR 60k</option>
                                            <option value="80000">EUR 80k</option>
                                            <option value="100000">EUR 100k</option>
                                            <option value="150000">EUR 150k</option>
                                            <option value="200000">EUR 200k+</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <MapPin className="w-4 h-4" />
                                    Work Location
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    {REMOTE_OPTIONS.map(option => (
                                        <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                            <Checkbox
                                                checked={filters.remoteType.includes(option.value)}
                                                onCheckedChange={(checked) => handleCheckboxChange('remoteType', option.value, !!checked)}
                                            />
                                            <span className="text-sm text-slate-600">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <Clock className="w-4 h-4" />
                                    Date Posted
                                </div>
                                <RadioGroup
                                    value={filters.postedWithin}
                                    onValueChange={(value) => onChange({ ...filters, postedWithin: value })}
                                    className="flex flex-wrap gap-4"
                                >
                                    {POSTED_OPTIONS.map(option => (
                                        <div key={option.value} className="flex items-center gap-2">
                                            <RadioGroupItem value={option.value} id={`posted-${option.value}`} />
                                            <Label htmlFor={`posted-${option.value}`} className="text-sm text-slate-600 cursor-pointer">
                                                {option.label}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <Briefcase className="w-4 h-4" />
                                    Experience Level
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    {EXPERIENCE_OPTIONS.map(option => (
                                        <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                            <Checkbox
                                                checked={filters.experienceLevel.includes(option.value)}
                                                onCheckedChange={(checked) => handleCheckboxChange('experienceLevel', option.value, !!checked)}
                                            />
                                            <span className="text-sm text-slate-600">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <Building2 className="w-4 h-4" />
                                    Industry
                                </div>
                                <Select
                                    value={filters.category || ''}
                                    onValueChange={(value) => onChange({ ...filters, category: value || undefined })}
                                >
                                    <SelectTrigger className="w-full md:w-64 input-glass" aria-label="Industry">
                                        <SelectValue placeholder="All Industries" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORY_OPTIONS.map(option => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <Users className="w-4 h-4" />
                                    Company Size
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    {COMPANY_SIZE_OPTIONS.map(option => (
                                        <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                            <Checkbox
                                                checked={filters.companySize.includes(option.value)}
                                                onCheckedChange={(checked) => handleCheckboxChange('companySize', option.value, !!checked)}
                                            />
                                            <span className="text-sm text-slate-600">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4 border-t border-white/60">
                                <div className="flex items-center gap-3">
                                    <Label className="text-sm text-slate-600">Sort by:</Label>
                                    <Select
                                        value={filters.sortBy}
                                        onValueChange={(value) => onChange({ ...filters, sortBy: value })}
                                    >
                                        <SelectTrigger className="w-40 input-glass" aria-label="Sort by">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SORT_OPTIONS.map(option => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onChange({
                                            ...filters,
                                            sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'
                                        })}
                                        className="text-slate-500 button-pop"
                                        aria-label="Toggle sort order"
                                    >
                                        {filters.sortOrder === 'asc' ? 'Up' : 'Down'}
                                    </Button>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onClear}
                                    disabled={activeFilterCount === 0}
                                    className="text-red-500 border-red-200 hover:bg-red-50 button-pop"
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Clear All
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const defaultAdvancedFilters: AdvancedFilters = {
    salaryMin: undefined,
    salaryMax: undefined,
    remoteType: [],
    experienceLevel: [],
    postedWithin: 'all',
    companySize: [],
    category: undefined,
    sortBy: 'relevance',
    sortOrder: 'desc',
};
