import React, { useState, useEffect } from 'react';
import { PodcastConcept, ExpertiseLevel, FormatStyle, PodcastConfig, isValidConceptForConfig } from '../types/podcast';
import { getPodcastConfig } from '../services/api';

interface ConceptFormProps {
  onSubmit: (concept: PodcastConcept) => void;
  isLoading: boolean;
}

// Define option mappings with user-friendly labels
const EXPERTISE_OPTIONS: { value: ExpertiseLevel; label: string; description: string }[] = [
  {
    value: 'beginner',
    label: 'Beginner-Friendly',
    description: 'Basic concepts and simple explanations'
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Balanced mix of basic and advanced concepts'
  },
  {
    value: 'expert',
    label: 'Expert',
    description: 'Advanced concepts and technical details'
  },
  {
    value: 'mixed',
    label: 'Mixed Levels',
    description: 'Varied complexity for diverse audience'
  }
];

const FORMAT_OPTIONS: { value: FormatStyle; label: string; description: string }[] = [
  {
    value: 'casual',
    label: 'Casual Conversation',
    description: 'Relaxed, natural dialogue'
  },
  {
    value: 'interview',
    label: 'Interview',
    description: 'Structured Q&A format'
  },
  {
    value: 'debate',
    label: 'Debate',
    description: 'Balanced discussion of different viewpoints'
  },
  {
    value: 'educational',
    label: 'Educational',
    description: 'Clear, instructional content'
  },
  {
    value: 'storytelling',
    label: 'Storytelling',
    description: 'Narrative-driven format'
  }
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
        const podcastConfig = await getPodcastConfig();
        setConfig(podcastConfig);
        
        // Set initial values based on config
        if (podcastConfig.speaker_options.length > 0) {
          setNumSpeakers(podcastConfig.speaker_options[0]);
          setCharacterNames(Array(podcastConfig.speaker_options[0]).fill(''));
        }
        if (podcastConfig.expertise_levels.length > 0) {
          setExpertiseLevel(podcastConfig.expertise_levels[0]);
        }
        if (podcastConfig.duration_options.length > 0) {
          setDuration(podcastConfig.duration_options[0]);
        }
        if (podcastConfig.format_styles.length > 0) {
          setFormatStyle(podcastConfig.format_styles[0]);
        }
      } catch (error) {
        setConfigError('Failed to load podcast configuration. Please try again later.');
        console.error('Error loading podcast config:', error);
      }
    };

    loadConfig();
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!topic.trim()) {
      errors.topic = 'Topic is required';
    }

    const hasEmptyNames = characterNames.some(name => !name.trim());
    if (hasEmptyNames) {
      errors.characterNames = 'All character names are required';
    }

    const hasDuplicateNames = new Set(characterNames).size !== characterNames.length;
    if (hasDuplicateNames) {
      errors.characterNames = 'Character names must be unique';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !config) {
      return;
    }

    const concept: PodcastConcept = {
      topic,
      num_speakers: numSpeakers,
      character_names: characterNames,
      expertise_level: expertiseLevel,
      duration_minutes: duration,
      format_style: formatStyle
    };

    // Validate against config before submitting
    if (!isValidConceptForConfig(concept, config)) {
      setFormErrors(prev => ({
        ...prev,
        form: 'Invalid form values. Please check your selections match the available options.'
      }));
      return;
    }

    onSubmit(concept);
  };

  const handleNumSpeakersChange = (value: number) => {
    setNumSpeakers(value);
    setCharacterNames(prev => {
      if (value > prev.length) {
        return [...prev, ...Array(value - prev.length).fill('')];
      }
      return prev.slice(0, value);
    });
    if (formErrors.characterNames) {
      setFormErrors(prev => ({ ...prev, characterNames: '' }));
    }
  };

  if (configError) {
    return (
      <div className="card bg-base-100/50 shadow-2xl backdrop-blur-lg border border-base-content/5 p-8">
        <div className="text-error text-center">
          <p>{configError}</p>
          <button 
            className="btn btn-error mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="card bg-base-100/50 shadow-2xl backdrop-blur-lg border border-base-content/5 p-8">
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100/50 shadow-2xl backdrop-blur-lg border border-base-content/5">
      <div className="card-body p-8">
        <div className="flex items-center gap-4 mb-8">
          <span className="p-3 bg-primary/10 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </span>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Create Your Podcast Concept
            </h2>
            <p className="text-base-content/60 mt-1">Define the foundation of your podcast</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-base font-medium">Topic</span>
            </label>
            <input
              type="text"
              placeholder="What's your podcast about?"
              className={`
                input input-bordered w-full bg-base-200/50 backdrop-blur-sm
                border-base-content/20 focus:border-primary
                placeholder:text-base-content/40
                ${formErrors.topic ? 'input-error' : ''}
              `}
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (formErrors.topic) {
                  setFormErrors(prev => ({ ...prev, topic: '' }));
                }
              }}
            />
            {formErrors.topic && (
              <label className="label">
                <span className="label-text-alt text-error font-medium">{formErrors.topic}</span>
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-base font-medium">Number of Speakers</span>
              </label>
              <div className="join bg-base-200/50 backdrop-blur-sm p-1 rounded-lg">
                {config.speaker_options.map(num => (
                  <input
                    key={num}
                    type="radio"
                    name="speakers"
                    className="join-item btn btn-sm font-medium"
                    aria-label={num.toString()}
                    checked={numSpeakers === num}
                    onChange={() => handleNumSpeakersChange(num)}
                  />
                ))}
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-base font-medium">Duration (minutes)</span>
              </label>
              <select
                className="select select-bordered w-full bg-base-200/50 backdrop-blur-sm border-base-content/20"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                {config.duration_options.map(mins => (
                  <option key={mins} value={mins}>{mins} minutes</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-base font-medium">Character Names</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {characterNames.map((name, index) => (
                <div key={index} className="relative group">
                  <input
                    type="text"
                    placeholder={`Speaker ${index + 1}`}
                    className={`
                      input input-bordered w-full pr-12
                      bg-base-200/50 backdrop-blur-sm
                      border-base-content/20 focus:border-primary
                      placeholder:text-base-content/40
                      ${formErrors.characterNames ? 'input-error' : ''}
                    `}
                    value={name}
                    onChange={(e) => {
                      const newNames = [...characterNames];
                      newNames[index] = e.target.value;
                      setCharacterNames(newNames);
                      if (formErrors.characterNames) {
                        setFormErrors(prev => ({ ...prev, characterNames: '' }));
                      }
                    }}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <span className="text-base-content/40 text-sm font-medium group-focus-within:text-primary transition-colors duration-200">
                      #{index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {formErrors.characterNames && (
              <label className="label">
                <span className="label-text-alt text-error font-medium">{formErrors.characterNames}</span>
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-base font-medium">Expertise Level</span>
              </label>
              <select
                className="select select-bordered w-full bg-base-200/50 backdrop-blur-sm border-base-content/20"
                value={expertiseLevel}
                onChange={(e) => setExpertiseLevel(e.target.value as ExpertiseLevel)}
              >
                {EXPERTISE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label className="label">
                <span className="label-text-alt text-base-content/60 text-sm">
                  {EXPERTISE_OPTIONS.find(opt => opt.value === expertiseLevel)?.description}
                </span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-base font-medium">Format Style</span>
              </label>
              <select
                className="select select-bordered w-full bg-base-200/50 backdrop-blur-sm border-base-content/20"
                value={formatStyle}
                onChange={(e) => setFormatStyle(e.target.value as FormatStyle)}
              >
                {FORMAT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label className="label">
                <span className="label-text-alt text-base-content/60 text-sm">
                  {FORMAT_OPTIONS.find(opt => opt.value === formatStyle)?.description}
                </span>
              </label>
            </div>
          </div>

          <div className="card-actions justify-end mt-12">
            <button
              type="submit"
              className={`
                btn btn-primary btn-lg gap-3 px-8 font-medium tracking-wide
                ${isLoading ? 'loading' : ''}
              `}
              disabled={isLoading}
            >
              {!isLoading && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
              )}
              {isLoading ? 'Generating...' : 'Generate Transcript'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConceptForm;