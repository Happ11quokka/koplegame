'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FilterState, HintLevel, Language, Round } from '@/types';
import {
  XMarkIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  show: boolean;
  onClose: () => void;
  activeRound: Round | null;
}

export function FilterPanel({
  filters,
  onFilterChange,
  show,
  onClose,
  activeRound
}: FilterPanelProps) {
  const visibleLevels = activeRound?.visibleLevels || [];

  const handleFilterUpdate = (key: keyof FilterState, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  const toggleArrayFilter = (key: 'levels' | 'languages' | 'interests' | 'appearance', value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];

    handleFilterUpdate(key, newArray);
  };

  const clearFilters = () => {
    onFilterChange({
      levels: [],
      languages: [],
      interests: [],
      appearance: [],
      searchQuery: ''
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.levels.length > 0 ||
      filters.languages.length > 0 ||
      filters.interests.length > 0 ||
      filters.appearance.length > 0 ||
      filters.searchQuery.length > 0
    );
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Hints
        </label>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => handleFilterUpdate('searchQuery', e.target.value)}
            placeholder="Search across all hints..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Hint Levels */}
      {visibleLevels.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hint Levels
          </label>
          <div className="space-y-2">
            {visibleLevels.map((level) => (
              <label key={level} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.levels.includes(level)}
                  onChange={() => toggleArrayFilter('levels', level)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{level}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Languages
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { code: 'en', label: 'English 🇺🇸' },
            { code: 'ko', label: '한국어 🇰🇷' },
            { code: 'ja', label: '日本語 🇯🇵' },
            { code: 'zh', label: '中文 🇨🇳' },
            { code: 'es', label: 'Español 🇪🇸' },
            { code: 'fr', label: 'Français 🇫🇷' },
          ].map((lang) => (
            <label key={lang.code} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.languages.includes(lang.code)}
                onChange={() => toggleArrayFilter('languages', lang.code)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-xs text-gray-700">{lang.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Common Interests
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            'Music', 'Sports', 'Travel', 'Food', 'Gaming', 'Art',
            'Technology', 'Photography', 'Dancing', 'Movies'
          ].map((interest) => (
            <button
              key={interest}
              onClick={() => toggleArrayFilter('interests', interest.toLowerCase())}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                filters.interests.includes(interest.toLowerCase())
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Appearance
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            'Glasses', 'Hat', 'Backpack', 'Tote Bag', 'Watch',
            'Blue', 'Red', 'Black', 'White', 'Green'
          ].map((item) => (
            <button
              key={item}
              onClick={() => toggleArrayFilter('appearance', item.toLowerCase())}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                filters.appearance.includes(item.toLowerCase())
                  ? 'bg-green-100 border-green-300 text-green-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters() && (
        <button
          onClick={clearFilters}
          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Filter Panel */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
          {hasActiveFilters() && (
            <span className="ml-auto inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {filters.levels.length + filters.languages.length + filters.interests.length + filters.appearance.length + (filters.searchQuery ? 1 : 0)}
            </span>
          )}
        </div>
        <FilterContent />
      </div>

      {/* Mobile Filter Modal */}
      <Transition.Root show={show} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                      <div className="px-4 py-6 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="text-lg font-semibold text-gray-900">
                            Filters
                          </Dialog.Title>
                          <button
                            type="button"
                            className="rounded-md text-gray-400 hover:text-gray-500"
                            onClick={onClose}
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 px-4 py-6">
                        <FilterContent />
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}