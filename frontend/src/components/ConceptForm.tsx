import React, { useState, useEffect } from 'react';
import { PodcastConcept, ExpertiseLevel, FormatStyle, PodcastConfig, isValidConceptForConfig } from '../types/podcast';
import { getPodcastConfig } from '../services/api';

interface ConceptFormProps {
  onSubmit: (concept: PodcastConcept) => void;
  isLoading: boolean;
}

// Define option mappings with user-friendly labels
const EXPERTISE_OPTIONS: { value: ExpertiseLevel; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner-Friendly', description: 'Basic concepts and simple explanations' },
  { value: 'intermediate', label: 'Intermediate', description: 'Balanced mix of basic and advanced concepts' },
  { value: 'expert', label: 'Expert', description: 'Advanced concepts and technical details' },
  { value: 'mixed', label: 'Mixed Levels', description: 'Varied complexity for diverse audience' }
];

const FORMAT_OPTIONS: { value: FormatStyle; label: string; description: string }[] = [
  { value: 'casual', label: 'Casual Conversation', description: 'Relaxed, natural dialogue' },
  { value: 'interview', label: 'Interview', description: 'Structured Q&A format' },
  { value: 'debate', label: 'Debate', description: 'Balanced discussion of different viewpoints' },
  { value: 'educational', label: 'Educational', description: 'Clear, instructional content' },
  { value: 'storytelling', label: 'Storytelling', description: 'Narrative-driven format' }
];

const DURATION_OPTIONS = [5, 10, 15, 20, 30];
const SPEAKER_OPTIONS = [2, 3, 4];

const ConceptForm: React.FC<ConceptFormProps> = ({ onSubmit, isLoading }) => {
  const [topic, setTopic] = useState('');
  const [numSpeakers, setNumSpeakers] = useState(2);
  const [characterNames, setCharacterNames] = useState<string[]>(['', '']);
  const [expertiseLevel, setExpertiseLevel] = useState<ExpertiseLevel>('intermediate');
  const [duration, setDuration] = useState(15);
  const [formatStyle, setFormatStyle] = useState<FormatStyle>('casual');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [config, setConfig] = useState<PodcastConfig | null>(null);
  const [configError, setConfigError] = useState<string>('');

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setConfigError(''); // Reset error on load
        const podcastConfig = await getPodcastConfig();
        setConfig(podcastConfig);

        // Set initial values based on config, only if not already user-set (except for initial load)
        if (podcastConfig.speaker_options.length > 0) {
          const defaultSpeakers = podcastConfig.speaker_options.includes(2) ? 2 : podcastConfig.speaker_options[0];
          setNumSpeakers(defaultSpeakers);
          setCharacterNames(Array(defaultSpeakers).fill(''));
        }
        if (podcastConfig.expertise_levels.length > 0 && !podcastConfig.expertise_levels.includes(expertiseLevel)) {
          setExpertiseLevel(podcastConfig.expertise_levels[0]);
        } else if (podcastConfig.expertise_levels.length > 0 && expertiseLevel === 'intermediate') {
            setExpertiseLevel(podcastConfig.expertise_levels.includes('intermediate') ? 'intermediate' : podcastConfig.expertise_levels[0]);
        }

        if (podcastConfig.duration_options.length > 0 && !podcastConfig.duration_options.includes(duration)) {
          setDuration(podcastConfig.duration_options.includes(15) ? 15 : podcastConfig.duration_options[0]);
        } else if (podcastConfig.duration_options.length > 0 && duration === 15) {
            setDuration(podcastConfig.duration_options.includes(15) ? 15 : podcastConfig.duration_options[0]);
        }

        if (podcastConfig.format_styles.length > 0 && !podcastConfig.format_styles.includes(formatStyle)) {
          setFormatStyle(podcastConfig.format_styles[0]);
        } else if (podcastConfig.format_styles.length > 0 && formatStyle === 'casual') {
            setFormatStyle(podcastConfig.format_styles.includes('casual') ? 'casual' : podcastConfig.format_styles[0]);
        }
      } catch (error) {
        setConfigError('Failed to load podcast configuration. Please try again later.');
        console.error('Error loading podcast config:', error);
      }
    };

    loadConfig();
  }, []); // Only on mount

  const availableExpertiseOptions = config
    ? EXPERTISE_OPTIONS.filter(opt => config.expertise_levels.includes(opt.value))
    : EXPERTISE_OPTIONS;

  const availableFormatOptions = config
    ? FORMAT_OPTIONS.filter(opt => config.format_styles.includes(opt.value))
    : FORMAT_OPTIONS;

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!topic.trim()) {
      errors.topic = 'Podcast topic cannot be empty.';
    } else if (topic.trim().length < 5) {
        errors.topic = 'Topic should be at least 5 characters long.';
    }

    const trimmedNames = characterNames.map(name => name.trim());
    const hasEmptyNames = trimmedNames.some(name => !name);
    if (hasEmptyNames) {
      errors.characterNames = 'Please provide a name for each speaker.';
    }

    const uniqueNames = new Set(trimmedNames.filter(name => name)); // Only check non-empty for duplicates
    if (uniqueNames.size !== trimmedNames.filter(name => name).length) {
      errors.characterNames = 'Character names must be unique.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors(prev => ({ ...prev, form: '' })); // Clear general form error

    if (!validateForm() || !config) {
      return;
    }

    const concept: PodcastConcept = {
      topic: topic.trim(),
      num_speakers: numSpeakers,
      character_names: characterNames.map(name => name.trim()),
      expertise_level: expertiseLevel,
      duration_minutes: duration,
      format_style: formatStyle
    };

    if (!isValidConceptForConfig(concept, config)) {
      setFormErrors(prev => ({
        ...prev,
        form: 'Some selections are invalid based on configuration. Please review.'
      }));
      console.warn("Concept invalid against config:", concept, config);
      return;
    }

    onSubmit(concept);
  };

  const handleNumSpeakersChange = (value: number) => {
    setNumSpeakers(value);
    setCharacterNames(prev => {
      const currentNames = prev.filter(name => name.trim()); // Keep existing non-empty names
      const newArray = Array(value).fill('');
      for (let i = 0; i < Math.min(value, currentNames.length); i++) {
        newArray[i] = currentNames[i];
      }
      return newArray;
    });
    if (formErrors.characterNames) {
      setFormErrors(prev => ({ ...prev, characterNames: '' }));
    }
  };

  const renderError = (field: string) => formErrors[field] && (
    <label className="label pt-1">
      <span className="label-text-alt text-error font-medium flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {formErrors[field]}
      </span>
    </label>
  );

  if (configError) {
    return (
      <div className="card bg-base-100 shadow-xl border border-error/30 max-w-3xl mx-auto my-10">
        <div className="card-body items-center text-center p-10">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-error mb-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="card-title text-2xl text-error/90">Configuration Error</h2>
          <p className="text-base-content/80 my-2">{configError}</p>
          <div className="card-actions justify-end mt-4">
            <button
              className="btn btn-error btn-outline"
              onClick={() => window.location.reload()}
            >
              Retry Loading Config
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="card bg-transparent max-w-3xl mx-auto my-10">
        <div className="card-body items-center justify-center p-10 min-h-[400px]">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-base-content/70 mt-4">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-2xl border border-base-300/20 max-w-3xl mx-auto my-5 md:my-10 overflow-hidden relative group">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
         <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/5 rounded-full opacity-50 blur-3xl animate-pulse animation-delay-500 transition-all duration-1000 group-hover:scale-125"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-secondary/5 rounded-full opacity-40 blur-3xl animate-pulse transition-all duration-1000 group-hover:scale-110"></div>

      <div className="card-body p-6 md:p-10 relative z-10">
        <div className="flex items-start md:items-center gap-4 mb-8 md:mb-10 flex-col md:flex-row">
          <span className="p-3 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-xl shadow border border-base-content/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </span>
          <div>
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent mb-1">
              Craft Your Podcast Concept
            </h2>
            <p className="text-base-content/70 mt-1 text-sm md:text-base">Tell us about the podcast you want to create.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          {/* Topic */}
          <div className="form-control">
            <label className="label pb-1">
              <span className="label-text text-base font-semibold">Podcast Topic</span>
            </label>
            <input
              type="text"
              placeholder="e.g., The future of renewable energy in smart cities"
              className={`input input-lg input-bordered w-full bg-base-200/30 backdrop-blur-sm border-base-300/30 focus:border-primary focus:bg-base-200/50 placeholder:text-base-content/40 transition-all duration-300 ${formErrors.topic ? 'input-error border-error/50 focus:border-error' : 'border-base-300/30'}`}
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (formErrors.topic) setFormErrors(prev => ({ ...prev, topic: '' }));
              }}
            />
            {renderError('topic')}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            {/* Number of Speakers */}
            <div className="form-control">
              <label className="label pb-1">
                <span className="label-text text-base font-semibold">Number of Speakers</span>
              </label>
              <div className="join bg-base-200/40 backdrop-blur-sm p-1 rounded-lg border border-base-300/20 shadow-sm">
                {config.speaker_options.map(num => (
                  <button
                    key={num}
                    type="button"
                    className={`join-item btn flex-1 text-sm md:text-base font-medium border-transparent ${numSpeakers === num ? 'btn-active btn-primary text-primary-content' : 'btn-ghost hover:bg-base-content/10'}`}
                    onClick={() => handleNumSpeakersChange(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="form-control">
              <label className="label pb-1">
                <span className="label-text text-base font-semibold">Est. Duration</span>
              </label>
              <select
                className={`select select-bordered w-full bg-base-200/30 backdrop-blur-sm border-base-300/30 focus:border-primary focus:bg-base-200/50 transition-all duration-300`}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                {config.duration_options.map(mins => (
                  <option key={mins} value={mins}>{mins} minutes</option>
                ))}
              </select>
            </div>
          </div>

          {/* Character Names */}
          <div className="form-control">
            <label className="label pb-1">
              <span className="label-text text-base font-semibold">Speaker Names</span>
              <span className="label-text-alt text-base-content/60">Unique names for each speaker</span>
            </label>
            <div className={`grid grid-cols-1 ${numSpeakers > 1 ? 'sm:grid-cols-2' : ''} gap-4`}>
              {characterNames.map((name, index) => (
                <div key={index} className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-base-content/40 group-focus-within:text-primary transition-colors duration-200 font-medium">
                      <span className="opacity-80">{index + 1}.</span>
                  </div>
                  <input
                    type="text"
                    placeholder={`Speaker ${index + 1} Name`}
                    className={`input input-bordered w-full pl-9 bg-base-200/30 backdrop-blur-sm border-base-300/30 focus:border-primary focus:bg-base-200/50 placeholder:text-base-content/40 transition-all duration-300 ${formErrors.characterNames ? 'input-error border-error/50 focus:border-error' : 'border-base-300/30'}`}
                    value={name}
                    onChange={(e) => {
                      const newNames = [...characterNames];
                      newNames[index] = e.target.value;
                      setCharacterNames(newNames);
                      if (formErrors.characterNames) setFormErrors(prev => ({ ...prev, characterNames: '' }));
                    }}
                  />
                </div>
              ))}
            </div>
            {renderError('characterNames')}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            {/* Expertise Level */}
            <div className="form-control">
              <label className="label pb-1">
                <span className="label-text text-base font-semibold">Audience Expertise</span>
              </label>
              <select
                className="select select-bordered w-full bg-base-200/30 backdrop-blur-sm border-base-300/30 focus:border-primary focus:bg-base-200/50"
                value={expertiseLevel}
                onChange={(e) => setExpertiseLevel(e.target.value as ExpertiseLevel)}
              >
                {availableExpertiseOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label className="label pt-1">
                <span className="label-text-alt text-base-content/60 text-xs md:text-sm">
                  {availableExpertiseOptions.find(opt => opt.value === expertiseLevel)?.description}
                </span>
              </label>
            </div>

            {/* Format Style */}
            <div className="form-control">
              <label className="label pb-1">
                <span className="label-text text-base font-semibold">Podcast Format</span>
              </label>
              <select
                className="select select-bordered w-full bg-base-200/30 backdrop-blur-sm border-base-300/30 focus:border-primary focus:bg-base-200/50"
                value={formatStyle}
                onChange={(e) => setFormatStyle(e.target.value as FormatStyle)}
              >
                {availableFormatOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label className="label pt-1">
                <span className="label-text-alt text-base-content/60 text-xs md:text-sm">
                  {availableFormatOptions.find(opt => opt.value === formatStyle)?.description}
                </span>
              </label>
            </div>
          </div>

          {formErrors.form && (
             <div role="alert" className="alert alert-error bg-error/10 border-error/30 text-error text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{formErrors.form}</span>
            </div>
          )}

          <div className="card-actions justify-end mt-10 md:mt-12">
            <button
              type="submit"
              className={`btn btn-primary btn-lg gap-3 px-8 font-semibold tracking-wide shadow-lg transform hover:scale-[1.02] transition-transform duration-200 ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {!isLoading && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              {isLoading ? 'Generating Concept...' : 'Generate Podcast'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConceptForm;