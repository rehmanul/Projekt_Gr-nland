import { useState } from 'react';
import { ChevronDown, ChevronUp, X, Briefcase, MapPin, Clock, DollarSign, Building2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

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
        return `€${Math.floor(value / 1000)}k`;
    }
    return `€${value}`;
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

    const handleSalaryChange = (values: number[]) => {
        onChange({
            ...filters,
            salaryMin: values[0] === 0 ? undefined : values[0] * 1000,
            salaryMax: values[1] === 200 ? undefined : values[1] * 1000,
        });
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
            const min = filters.salaryMin ? formatSalary(filters.salaryMin) : '€0';
            const max = filters.salaryMax ? formatSalary(filters.salaryMax) : '€200k+';
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Advanced Filters</span>
                    {activeFilterCount > 0 && (
                        <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
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

            {/* Active Filter Chips */}
            {activeFilterCount > 0 && !isExpanded && (
                <div className="px-4 pb-3 flex flex-wrap gap-2">
                    {getActiveFilters().slice(0, 5).map((filter, i) => (
                        <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-full text-xs text-slate-600"
                        >
                            {filter.label}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    filter.onRemove();
                                }}
                                className="hover:text-red-500"
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

            {/* Expanded Panel */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-200"
                    >
                        <div className="p-4 space-y-6">
                            {/* Salary Range */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <DollarSign className="w-4 h-4" />
                                    Salary Range
                                </div>
                                <div className="px-2">
                                    <Slider
                                        defaultValue={[
                                            (filters.salaryMin || 0) / 1000,
                                            (filters.salaryMax || 200000) / 1000
                                        ]}
                                        max={200}
                                        step={5}
                                        onValueChange={handleSalaryChange}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                                        <span>{filters.salaryMin ? formatSalary(filters.salaryMin) : '€0'}</span>
                                        <span>{filters.salaryMax ? formatSalary(filters.salaryMax) : '€200k+'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Remote Type */}
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

                            {/* Posted Within */}
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

                            {/* Experience Level */}
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

                            {/* Industry / Category */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <Building2 className="w-4 h-4" />
                                    Industry
                                </div>
                                <Select
                                    value={filters.category || ''}
                                    onValueChange={(value) => onChange({ ...filters, category: value || undefined })}
                                >
                                    <SelectTrigger className="w-full md:w-64">
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

                            {/* Company Size */}
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

                            {/* Sort & Clear */}
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4 border-t border-slate-200">
                                <div className="flex items-center gap-3">
                                    <Label className="text-sm text-slate-600">Sort by:</Label>
                                    <Select
                                        value={filters.sortBy}
                                        onValueChange={(value) => onChange({ ...filters, sortBy: value })}
                                    >
                                        <SelectTrigger className="w-40">
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
                                        className="text-slate-500"
                                    >
                                        {filters.sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                                    </Button>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onClear}
                                    disabled={activeFilterCount === 0}
                                    className="text-red-500 border-red-200 hover:bg-red-50"
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Clear All
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
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
