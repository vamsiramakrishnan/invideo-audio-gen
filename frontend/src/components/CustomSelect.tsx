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
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  onChange,
  options,
  description,
  allowCustom,
  customValue,
  onCustomChange
}) => (
  <div className="form-control">
    <label className="label">
      <span className="label-text text-base font-medium">{label}</span>
    </label>
    <div className="relative group">
      <select
        className={`
          select w-full pl-4 pr-10 py-3 appearance-none
          bg-base-200/50 backdrop-blur-sm
          border border-base-content/20 rounded-lg
          text-base-content/80 font-medium
          hover:border-primary/30 focus:border-primary
          focus:ring-2 focus:ring-primary/20
          transition-all duration-200
          cursor-pointer
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
          w-4 h-4 rounded-full
          bg-base-content/5 group-hover:bg-primary/10
          transition-colors duration-200
          flex items-center justify-center
        `}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`
              h-3 w-3 transform
              text-base-content/40 group-hover:text-primary
              transition-colors duration-200
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
        absolute inset-0 rounded-lg
        bg-primary/5 opacity-0
        group-hover:opacity-100
        transition-opacity duration-200
        pointer-events-none
      `} />
    </div>
    {allowCustom && value === 'Custom' && onCustomChange && (
      <input
        type="text"
        className="input input-bordered mt-2"
        value={customValue}
        onChange={(e) => onCustomChange(e.target.value)}
        placeholder={`Enter custom ${label.toLowerCase()}`}
      />
    )}
    {description && (
      <label className="label">
        <span className="label-text-alt text-base-content/60 text-sm">{description}</span>
      </label>
    )}
  </div>
); 