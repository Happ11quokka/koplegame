'use client';

import { useState, useEffect } from 'react';
import { HintLevel, HintPayload, Language } from '@/types';
import { validateForPII, quickPIICheck } from '@/lib/validation/piiValidation';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface HintInputFormProps {
  level: HintLevel;
  eventId: string;
  eventCode: string;
  userId: string;
  h6CommonQuestion?: string;
  onComplete: () => void;
  onLevelChange: (level: HintLevel) => void;
}

export function HintInputForm({
  level,
  eventId,
  eventCode,
  userId,
  h6CommonQuestion,
  onComplete,
  onLevelChange,
}: HintInputFormProps) {
  const [formData, setFormData] = useState<HintPayload>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    loadExistingHint();
  }, [level, eventId, userId]);

  const loadExistingHint = async () => {
    if (!eventId || !userId) return;

    setIsLoading(true);
    try {
      const hintDocRef = doc(db, `events/${eventId}/participants/${userId}/hints`, level);
      const hintDoc = await getDoc(hintDocRef);

      if (hintDoc.exists()) {
        const hintData = hintDoc.data();
        setFormData(hintData.payload || {});
        setIsComplete(hintData.status === 'ok');
      } else {
        setFormData({});
        setIsComplete(false);
      }
    } catch (error) {
      console.error('Error loading hint:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateField = (field: string, value: string) => {
    if (!value) return null;

    const result = validateForPII(value, field);
    if (!result.isValid) {
      return `This field contains personal information: ${result.violations.map(v => v.type).join(', ')}`;
    }

    return null;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Real-time validation
    const error = validateField(field, value);
    setValidationErrors(prev => ({
      ...prev,
      [field]: error || ''
    }));
  };

  const saveHint = async (status: 'draft' | 'submitted' = 'draft') => {
    if (!eventId || !userId) return;

    setIsSaving(true);
    setError('');

    try {
      // Validate all fields
      const errors: Record<string, string> = {};
      let hasErrors = false;

      Object.entries(formData).forEach(([field, value]) => {
        if (typeof value === 'string' && value.trim()) {
          const error = validateField(field, value);
          if (error) {
            errors[field] = error;
            hasErrors = true;
          }
        }
      });

      if (hasErrors && status === 'submitted') {
        setValidationErrors(errors);
        setError('Please fix validation errors before submitting');
        return;
      }

      // Save to Firestore
      const hintDocRef = doc(db, `events/${eventId}/participants/${userId}/hints`, level);
      const hintData = {
        level,
        payload: formData,
        piiFlag: hasErrors,
        status: hasErrors ? 'flagged' : 'ok',
        participantId: userId,
        eventId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(hintDocRef, hintData);

      if (status === 'submitted') {
        // Update participant's submitted levels
        const participantDocRef = doc(db, `events/${eventId}/participants`, userId);
        const participantDoc = await getDoc(participantDocRef);

        if (participantDoc.exists()) {
          const participantData = participantDoc.data();
          const submittedLevels = participantData.submittedLevels || [];

          if (!submittedLevels.includes(level)) {
            submittedLevels.push(level);
            await setDoc(participantDocRef, {
              ...participantData,
              submittedLevels,
              updatedAt: serverTimestamp(),
            });
          }
        }

        setIsComplete(true);
      }
    } catch (error) {
      console.error('Error saving hint:', error);
      setError('Failed to save hint. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    const levels: HintLevel[] = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
    const currentIndex = levels.indexOf(level);

    if (currentIndex < levels.length - 1) {
      onLevelChange(levels[currentIndex + 1]);
    } else {
      onComplete();
    }
  };

  const renderFormFields = () => {
    switch (level) {
      case 'H1':
        return <H1Fields formData={formData} onChange={handleInputChange} errors={validationErrors} />;
      case 'H2':
        return <H2Fields formData={formData} onChange={handleInputChange} errors={validationErrors} />;
      case 'H3':
        return <H3Fields formData={formData} onChange={handleInputChange} errors={validationErrors} />;
      case 'H4':
        return <H4Fields formData={formData} onChange={handleInputChange} errors={validationErrors} />;
      case 'H5':
        return <H5Fields formData={formData} onChange={handleInputChange} errors={validationErrors} />;
      case 'H6':
        return (
          <H6Fields
            formData={formData}
            onChange={handleInputChange}
            errors={validationErrors}
            commonQuestion={h6CommonQuestion}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {getLevelTitle(level)}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {getLevelDescription(level)}
            </p>
          </div>
          {isComplete && (
            <CheckCircleIcon className="w-6 h-6 text-green-500" />
          )}
        </div>
      </div>

      {/* Form */}
      <div className="p-6">
        {renderFormFields()}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => saveHint('draft')}
            disabled={isSaving}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            onClick={() => saveHint('submitted')}
            disabled={isSaving || Object.values(validationErrors).some(error => !!error)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Submitting...' : isComplete ? 'Update' : 'Submit & Continue'}
          </button>

          {isComplete && (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              {level === 'H6' ? 'Complete' : 'Next Level'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getLevelTitle(level: HintLevel): string {
  const titles = {
    H1: 'H1: Preferences & Taste',
    H2: 'H2: Interests & Background',
    H3: 'H3: Language & Communication',
    H4: 'H4: Physical Appearance',
    H5: 'H5: Personal Items',
    H6: 'H6: Key Identifiers',
  };
  return titles[level];
}

function getLevelDescription(level: HintLevel): string {
  const descriptions = {
    H1: 'Share your general preferences and lifestyle choices',
    H2: 'Tell us about your interests, studies, and hobbies',
    H3: 'Describe your communication style and languages',
    H4: 'Provide clues about your appearance for today',
    H5: 'Share details about items you\'re carrying',
    H6: 'Give the final clues for identification',
  };
  return descriptions[level];
}

// Form field components
function H1Fields({ formData, onChange, errors }: any) {
  return (
    <div className="space-y-4">
      <InputField
        label="Favorite Music Genre"
        value={formData.musicGenre || ''}
        onChange={(value) => onChange('musicGenre', value)}
        placeholder="e.g., Pop, Jazz, K-pop, Hip-hop"
        error={errors.musicGenre}
      />

      <InputField
        label="Favorite Song (Optional)"
        value={formData.faveSong || ''}
        onChange={(value) => onChange('faveSong', value)}
        placeholder="e.g., Bohemian Rhapsody, Dynamite"
        error={errors.faveSong}
      />

      <SelectField
        label="Coffee or Tea?"
        value={formData.coffeeOrTea || ''}
        onChange={(value) => onChange('coffeeOrTea', value)}
        options={[
          { value: 'coffee', label: 'Coffee ☕' },
          { value: 'tea', label: 'Tea 🍵' },
          { value: 'both', label: 'Both' },
          { value: 'neither', label: 'Neither' },
        ]}
        error={errors.coffeeOrTea}
      />

      <SelectField
        label="Sweet or Salty?"
        value={formData.taste || ''}
        onChange={(value) => onChange('taste', value)}
        options={[
          { value: 'sweet', label: 'Sweet 🍰' },
          { value: 'salty', label: 'Salty 🍿' },
          { value: 'both', label: 'Both' },
          { value: 'neither', label: 'Neither' },
        ]}
        error={errors.taste}
      />

      <SelectField
        label="Morning or Evening Person?"
        value={formData.chronotype || ''}
        onChange={(value) => onChange('chronotype', value)}
        options={[
          { value: 'morning', label: 'Morning Person 🌅' },
          { value: 'evening', label: 'Evening Person 🌙' },
          { value: 'flexible', label: 'Flexible' },
        ]}
        error={errors.chronotype}
      />
    </div>
  );
}

function H2Fields({ formData, onChange, errors }: any) {
  return (
    <div className="space-y-4">
      <InputField
        label="Major or Field of Interest"
        value={formData.majorOrDomain || ''}
        onChange={(value) => onChange('majorOrDomain', value)}
        placeholder="e.g., Computer Science, Marketing, Art"
        error={errors.majorOrDomain}
      />

      <InputField
        label="Favorite Sports Team (Optional)"
        value={formData.sportsTeam || ''}
        onChange={(value) => onChange('sportsTeam', value)}
        placeholder="e.g., Lakers, Barcelona, Team name"
        error={errors.sportsTeam}
      />

      <SelectField
        label="Travel Style"
        value={formData.travelStyle || ''}
        onChange={(value) => onChange('travelStyle', value)}
        options={[
          { value: 'photo', label: 'Photography 📸' },
          { value: 'food', label: 'Food Explorer 🍜' },
          { value: 'hiking', label: 'Adventure/Hiking 🥾' },
          { value: 'history', label: 'History & Culture 🏛️' },
          { value: 'relaxation', label: 'Relaxation 🏖️' },
        ]}
        error={errors.travelStyle}
      />

      <TextAreaField
        label="Hobbies (comma separated)"
        value={formData.hobbies?.join(', ') || ''}
        onChange={(value) => onChange('hobbies', value.split(',').map(h => h.trim()).filter(h => h))}
        placeholder="e.g., Gaming, Cooking, Photography"
        error={errors.hobbies}
      />
    </div>
  );
}

function H3Fields({ formData, onChange, errors }: any) {
  const languageOptions = [
    { value: 'en', label: 'English 🇺🇸' },
    { value: 'ko', label: '한국어 🇰🇷' },
    { value: 'ja', label: '日本語 🇯🇵' },
    { value: 'zh', label: '中文 🇨🇳' },
    { value: 'es', label: 'Español 🇪🇸' },
    { value: 'fr', label: 'Français 🇫🇷' },
  ];

  return (
    <div className="space-y-4">
      <MultiSelectField
        label="Languages You Speak"
        value={formData.languages || []}
        onChange={(value) => onChange('languages', value)}
        options={languageOptions}
        error={errors.languages}
      />

      <InputField
        label="Language Level Note (Optional)"
        value={formData.languageNote || ''}
        onChange={(value) => onChange('languageNote', value)}
        placeholder="e.g., Korean beginner, Native English"
        error={errors.languageNote}
      />

      <InputField
        label="Favorite Emojis"
        value={formData.favEmojis?.join(' ') || ''}
        onChange={(value) => onChange('favEmojis', value.split(' ').filter(e => e))}
        placeholder="e.g., ✨ 🌊 🎵"
        error={errors.favEmojis}
      />

      <SelectField
        label="Communication Style"
        value={formData.communicationStyle || ''}
        onChange={(value) => onChange('communicationStyle', value)}
        options={[
          { value: 'formal', label: 'Formal' },
          { value: 'casual', label: 'Casual' },
          { value: 'mixed', label: 'Mixed' },
        ]}
        error={errors.communicationStyle}
      />
    </div>
  );
}

function H4Fields({ formData, onChange, errors }: any) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800">
          <strong>For today's event:</strong> Describe what you're wearing so others can spot you
        </p>
      </div>

      <InputField
        label="Top/Shirt Color"
        value={formData.topColor || ''}
        onChange={(value) => onChange('topColor', value)}
        placeholder="e.g., Blue, Navy, Black and white stripes"
        error={errors.topColor}
      />

      <div className="grid grid-cols-2 gap-4">
        <CheckboxField
          label="Wearing Glasses"
          checked={formData.glasses || false}
          onChange={(checked) => onChange('glasses', checked)}
        />

        <CheckboxField
          label="Wearing Hat/Cap"
          checked={formData.cap || false}
          onChange={(checked) => onChange('cap', checked)}
        />
      </div>

      <InputField
        label="Shoe Color"
        value={formData.shoesColor || ''}
        onChange={(value) => onChange('shoesColor', value)}
        placeholder="e.g., White sneakers, Black boots"
        error={errors.shoesColor}
      />

      <SelectField
        label="Bag Type"
        value={formData.bagType || ''}
        onChange={(value) => onChange('bagType', value)}
        options={[
          { value: 'backpack', label: 'Backpack 🎒' },
          { value: 'crossbody', label: 'Crossbody Bag 👜' },
          { value: 'tote', label: 'Tote Bag 👝' },
          { value: 'none', label: 'No Bag' },
        ]}
        error={errors.bagType}
      />

      <SelectField
        label="Height (Relative)"
        value={formData.height || ''}
        onChange={(value) => onChange('height', value)}
        options={[
          { value: 'short', label: 'Shorter side' },
          { value: 'average', label: 'Average height' },
          { value: 'tall', label: 'Taller side' },
        ]}
        error={errors.height}
      />
    </div>
  );
}

function H5Fields({ formData, onChange, errors }: any) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800">
          <strong>Personal items:</strong> Details others might notice when they get closer
        </p>
      </div>

      <InputField
        label="Phone Case Color/Pattern"
        value={formData.phoneCase || ''}
        onChange={(value) => onChange('phoneCase', value)}
        placeholder="e.g., Clear case, Purple, Floral pattern"
        error={errors.phoneCase}
      />

      <SelectField
        label="Wrist Accessories"
        value={formData.wristAccessory || ''}
        onChange={(value) => onChange('wristAccessory', value)}
        options={[
          { value: 'none', label: 'None' },
          { value: 'watch', label: 'Watch ⌚' },
          { value: 'bracelet', label: 'Bracelet' },
          { value: 'both', label: 'Both Watch & Bracelet' },
        ]}
        error={errors.wristAccessory}
      />

      <InputField
        label="Unique Accessory (Optional)"
        value={formData.uniqueAccessory || ''}
        onChange={(value) => onChange('uniqueAccessory', value)}
        placeholder="e.g., Star earrings, Blue hair tie, Keychain"
        error={errors.uniqueAccessory}
      />
    </div>
  );
}

function H6Fields({ formData, onChange, errors, commonQuestion }: any) {
  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-green-800">
          <strong>Final clues:</strong> These hints should make you identifiable
        </p>
      </div>

      <InputField
        label="Name Initials"
        value={formData.nameInitials || ''}
        onChange={(value) => onChange('nameInitials', value)}
        placeholder="e.g., J.S., A-, Kim-"
        error={errors.nameInitials}
        maxLength={5}
      />

      <InputField
        label="Origin Region"
        value={formData.originRegion || ''}
        onChange={(value) => onChange('originRegion', value)}
        placeholder="e.g., East Asia, Europe, South America"
        error={errors.originRegion}
      />

      <InputField
        label="Current City (General)"
        value={formData.currentCity || ''}
        onChange={(value) => onChange('currentCity', value)}
        placeholder="e.g., Seoul area, NYC, London"
        error={errors.currentCity}
      />

      {commonQuestion && (
        <InputField
          label={commonQuestion}
          value={formData.expectedSpot || ''}
          onChange={(value) => onChange('expectedSpot', value)}
          placeholder="Your answer to the event question"
          error={errors.expectedSpot}
        />
      )}
    </div>
  );
}

// Helper form components
function InputField({ label, value, onChange, placeholder, error, maxLength }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder, error }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, error }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
      >
        <option value="">Select an option</option>
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function MultiSelectField({ label, value, onChange, options, error }: any) {
  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v: string) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option: any) => (
          <label key={option.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              onChange={() => handleToggle(option.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function CheckboxField({ label, checked, onChange }: any) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}