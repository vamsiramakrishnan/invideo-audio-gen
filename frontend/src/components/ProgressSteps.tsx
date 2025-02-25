import React from 'react';

interface ProgressStep {
  label: string;
  desc: string;
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
      <div className="max-w-3xl mx-auto backdrop-blur-lg bg-base-100/30 rounded-2xl p-6 shadow-xl border border-base-content/5">
        <ul className="steps steps-horizontal w-full">
          {steps.map((item, index) => (
            <li 
              key={item.label}
              className={`step ${currentStep >= index + 1 ? 'step-primary' : ''} transition-all duration-300 cursor-pointer`}
              onClick={() => {
                // Only allow going back to previous steps or current step
                if (currentStep >= index + 1) {
                  onStepClick(index + 1);
                }
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <span className={`hidden sm:inline font-medium ${currentStep >= index + 1 ? 'text-primary' : ''}`}>
                  {item.label}
                </span>
                <span className={`text-xs ${currentStep >= index + 1 ? 'text-primary/70' : 'text-base-content/60'} hidden sm:inline`}>
                  {item.desc}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProgressSteps; 