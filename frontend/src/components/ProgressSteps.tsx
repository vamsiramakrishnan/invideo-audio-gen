import React from 'react';

interface ProgressStep {
  label: string;
  desc: string;
  icon?: React.ReactNode;
}

interface ProgressStepsProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  steps: ProgressStep[];
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({
  currentStep,
  onStepClick,
  steps
}) => {
  return (
    <div className="mb-16">
      <div className="max-w-5xl mx-auto bg-gradient-to-br from-base-100 to-base-200 rounded-3xl p-6 sm:p-8 shadow-2xl border border-primary/10 backdrop-blur-sm transition-all duration-500 hover:shadow-primary/5">
        <div className="w-full flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-2">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Progress
          </h2>
          <div className="badge badge-primary badge-outline p-3 font-medium animate-pulse-slow">
            Step {currentStep} of {steps.length}
          </div>
        </div>
        
        {/* Custom steps implementation to avoid DaisyUI's automatic numbering */}
        <div className="relative mb-8 sm:mb-10 px-0 sm:px-4">
          {/* Connector line */}
          <div className="absolute top-4 sm:top-6 left-0 right-0 h-0.5 bg-base-300 z-0"></div>
          
          {/* Steps */}
          <div className="flex justify-between relative z-10">
            {steps.map((item, index) => {
              const isActive = currentStep >= index + 1;
              const isCurrent = currentStep === index + 1;
              const isClickable = currentStep >= index + 1;
              const isPrevious = currentStep > index + 1;
              const isFuture = currentStep < index + 1;
              
              return (
                <div 
                  key={item.label}
                  className={`
                    flex flex-col items-center transition-all duration-500
                    ${isClickable ? 'cursor-pointer hover:opacity-90' : 'cursor-not-allowed opacity-60'}
                    relative
                  `}
                  onClick={() => {
                    // Only allow going back to previous steps or current step
                    if (isClickable) {
                      onStepClick(index + 1);
                    }
                  }}
                >
                  {/* Animated highlight for current step */}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 animate-pulse-slow pointer-events-none" />
                  )}

                  {/* Completed step marker */}
                  {isPrevious && (
                    <div className="absolute top-0 right-0 -mr-1 -mt-1 w-3 h-3 sm:w-4 sm:h-4 bg-success rounded-full border-2 border-base-100 shadow-md z-20 animate-fadeIn">
                      <span className="absolute inset-0 flex items-center justify-center text-[6px] sm:text-[8px] text-success-content">✓</span>
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center gap-1 sm:gap-2 relative z-10">
                    {/* Step number or icon */}
                    <div className={`
                      w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold
                      transition-all duration-500 shadow-lg
                      ${isActive 
                        ? isCurrent 
                          ? 'bg-gradient-to-br from-primary to-secondary text-primary-content ring-2 sm:ring-4 ring-primary/20 ring-offset-1 sm:ring-offset-2 ring-offset-base-100 scale-110' 
                          : 'bg-primary text-primary-content' 
                        : 'bg-base-300 text-base-content/70'
                      }
                      ${isFuture ? 'opacity-50' : 'opacity-100'}
                      transform hover:scale-105 hover:shadow-xl transition-transform
                    `}>
                      {/* Use icon if provided, otherwise use appropriate visual indicators */}
                      {item.icon || (
                        isPrevious ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className={isCurrent ? "animate-pulse" : ""}>{index + 1}</span>
                        )
                      )}
                    </div>
                    
                    {/* Step label */}
                    <span className={`
                      font-bold transition-all duration-300 text-xs sm:text-base text-center
                      ${isCurrent 
                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary sm:text-lg scale-110'
                        : isActive ? 'text-primary' : 'text-base-content/70'
                      }
                    `}>
                      {item.label}
                    </span>
                    
                    {/* Step description - hidden on mobile */}
                    <span className={`
                      text-xs transition-colors duration-300 max-w-[120px] sm:max-w-[140px] text-center
                      ${isActive ? 'text-primary/70' : 'text-base-content/50'} 
                      hidden sm:inline font-medium
                    `}>
                      {item.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress indicator with animated gradient */}
        <div className="w-full bg-base-300 rounded-full h-2 sm:h-3 overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-primary via-primary-focus to-secondary transition-all duration-700 ease-in-out relative overflow-hidden" 
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine"></div>
          </div>
        </div>
        
        {/* Step description text */}
        <div className="mt-4 text-center text-xs sm:text-sm text-base-content/70 font-medium">
          {steps[currentStep - 1]?.desc && (
            <p className="animate-fadeIn">
              {currentStep === steps.length ? 
                <span className="text-success">Completed: </span> : 
                <span className="text-primary">Current task: </span>
              }
              {steps[currentStep - 1].desc}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressSteps; 