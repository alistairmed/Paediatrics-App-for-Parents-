import React, { useState } from 'react';

export interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  totalCount: number;
  filteredCount: number;
  placeholder?: string;
  categories?: { value: string; label: string }[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  onClearAll?: () => void;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  totalCount,
  filteredCount,
  placeholder = 'Search by keyword, title, notes...',
  categories,
  selectedCategory,
  onCategoryChange,
  onClearAll,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Quick Preset Helper
  const applyPreset = (preset: 'all' | 'today' | '7days' | '30days' | 'thisYear') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'all') {
      onStartDateChange('');
      onEndDateChange('');
    } else if (preset === 'today') {
      onStartDateChange(todayStr);
      onEndDateChange(todayStr);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      onStartDateChange(past.toISOString().split('T')[0]);
      onEndDateChange(todayStr);
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      onStartDateChange(past.toISOString().split('T')[0]);
      onEndDateChange(todayStr);
    } else if (preset === 'thisYear') {
      const yearStart = `${today.getFullYear()}-01-01`;
      onStartDateChange(yearStart);
      onEndDateChange(todayStr);
    }
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() || startDate || endDate || (selectedCategory && selectedCategory !== 'all')
  );

  const handleClear = () => {
    onSearchChange('');
    onStartDateChange('');
    onEndDateChange('');
    if (onCategoryChange) onCategoryChange('all');
    if (onClearAll) onClearAll();
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-6 border-2 border-slate-100 shadow-xl space-y-4 animate-in fade-in">
      {/* Top Search Input & Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Keyword Search Input */}
        <div className="relative flex-1 w-full">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-60">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100 rounded-2xl text-slate-800 font-bold text-sm transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-black transition-colors"
              title="Clear search text"
            >
              ✕
            </button>
          )}
        </div>

        {/* Date Filter Toggle Button */}
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border-2 ${
            startDate || endDate
              ? 'bg-violet-600 border-violet-600 text-white shadow-md'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span>📅</span>
          <span>{startDate || endDate ? 'Date Filtered' : 'Date Range'}</span>
          {startDate || endDate ? (
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
          ) : null}
        </button>

        {/* Clear All Button (When active) */}
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="px-4 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border-2 border-rose-100 rounded-2xl font-black text-xs uppercase tracking-wider transition-all"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Category Pills (If categories provided) */}
      {categories && categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0 mr-1">
            Category:
          </span>
          {categories.map((cat) => {
            const isSelected = (selectedCategory || 'all') === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => onCategoryChange && onCategoryChange(cat.value)}
                className={`px-4 py-1.5 rounded-full font-black text-xs transition-all shrink-0 ${
                  isSelected
                    ? 'bg-violet-600 text-white shadow-sm scale-105'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Collapsible Date Range Controls & Presets */}
      {showDatePicker && (
        <div className="pt-3 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2">
          {/* Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">
              Presets:
            </span>
            <button
              onClick={() => applyPreset('all')}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold text-xs transition-colors"
            >
              All Time
            </button>
            <button
              onClick={() => applyPreset('today')}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold text-xs transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => applyPreset('7days')}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold text-xs transition-colors"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => applyPreset('30days')}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold text-xs transition-colors"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => applyPreset('thisYear')}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold text-xs transition-colors"
            >
              This Year
            </button>
          </div>

          {/* Explicit Start and End Date inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-violet-500 rounded-xl font-bold text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-violet-500 rounded-xl font-bold text-xs text-slate-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Badges & Count Feedback */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-bold border-t border-slate-100/80">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Results:
          </span>
          <span className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full font-black text-xs">
            Showing {filteredCount} of {totalCount} {totalCount === 1 ? 'entry' : 'entries'}
          </span>

          {/* Active Filter Badges */}
          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
              <span>Text: &quot;{searchQuery}&quot;</span>
              <button
                onClick={() => onSearchChange('')}
                className="hover:text-rose-600 font-black"
              >
                ✕
              </button>
            </span>
          )}

          {startDate && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
              <span>From: {startDate}</span>
              <button
                onClick={() => onStartDateChange('')}
                className="hover:text-rose-600 font-black"
              >
                ✕
              </button>
            </span>
          )}

          {endDate && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
              <span>To: {endDate}</span>
              <button
                onClick={() => onEndDateChange('')}
                className="hover:text-rose-600 font-black"
              >
                ✕
              </button>
            </span>
          )}
        </div>

        {filteredCount === 0 && totalCount > 0 && (
          <p className="text-rose-500 italic text-xs font-bold">
            No entries match your search criteria.
          </p>
        )}
      </div>
    </div>
  );
};
