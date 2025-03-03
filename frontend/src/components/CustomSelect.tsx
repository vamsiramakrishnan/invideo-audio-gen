import React from 'react';

interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
}

interface CustomSelectProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
  description?: string;
  allowCustom?: boolean;
  customValue?: string;
  onCustomChange?: (value: string) => void;
  error?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  onChange,
  options,
  description,
  allowCustom,
  customValue,
  onCustomChange,
  error
}) => (
  <div className="form-control w-full">
    <label className="label">
      <span className={`label-text font-medium text-base ${error ? 'text-error' : 'text-base-content/90'} flex items-center gap-1`}>
        {label}
        {error && (
          <div className="tooltip tooltip-right" data-tip={error}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </span>
      {value !== undefined && typeof value !== 'object' && (
        <span className="label-text-alt bg-base-200 px-2 py-1 rounded-md text-primary font-medium text-sm shadow-sm">
          {options.find(opt => opt.value === value)?.label || value}
        </span>
      )}
    </label>
    <div className="relative group">
      <select
        className={`
          select w-full appearance-none
          bg-base-100 
          border-2 ${error ? 'border-error/50' : 'border-base-content/10'} rounded-xl
          text-base-content/90 font-medium
          ${error 
            ? 'focus:border-error focus:ring-error/20' 
            : 'hover:border-primary/30 focus:border-primary/50 focus:ring-primary/10'
          }
          focus:outline-none focus:ring-2
          transition-all duration-300
          cursor-pointer
          h-12
          shadow-sm hover:shadow
        `}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Custom arrow indicator */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <div className={`
          w-6 h-6 rounded-full
          ${error 
            ? 'bg-error/10' 
            : 'bg-base-content/5 group-hover:bg-primary/10 group-focus-within:bg-primary/20'
          }
          transition-colors duration-300
          flex items-center justify-center
          shadow-sm
        `}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`
              h-3.5 w-3.5 transform
              ${error 
                ? 'text-error' 
                : 'text-base-content/40 group-hover:text-primary group-focus-within:text-primary'
              }
              transition-colors duration-300
            `}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Selection highlight effect */}
      <div className={`
        absolute inset-0 rounded-xl
        ${error ? 'bg-error/5' : 'bg-primary/5'} opacity-0
        group-hover:opacity-100 group-focus-within:opacity-100
        transition-opacity duration-300
        pointer-events-none
      `} />
      
      {/* Error indicator */}
      {error && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2">
          <div className="tooltip tooltip-left" data-tip={error}>
            <div className="text-error animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
    {allowCustom && value === 'Custom' && onCustomChange && (
      <div className="mt-3 relative">
        <input
          type="text"
          className={`
            input input-bordered w-full bg-base-100
            ${error ? 'input-error border-error/50' : 'border-base-content/10 focus:border-primary/50'}
            focus:outline-none focus:ring-2 focus:ring-primary/10
            transition-all duration-300
            rounded-xl h-12
            shadow-sm
          `}
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder={`Enter custom ${label.toLowerCase()}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/30">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
      </div>
    )}
    {description && !error && (
      <label className="label mt-1">
        <span className="label-text-alt text-base-content/60 text-xs flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {description}
        </span>
      </label>
    )}
    {error && (
      <label className="label pt-1">
        <span className="label-text-alt text-error text-xs flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </span>
      </label>
    )}
  </div>
); 