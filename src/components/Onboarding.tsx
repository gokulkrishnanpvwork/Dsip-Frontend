
import React, { useState } from 'react';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Capital Flow",
    description: "Your monthly savings move to the 'Money Park'. This keeps your capital safe while it waits for the perfect deployment time.",
    image: "https://picsum.photos/seed/capital/400/300"
  },
  {
    title: "Daily Execution",
    description: "Unlike monthly SIPs, we break your investment into daily partitions. This maximizes 'Red Day' opportunities and averages your cost effectively.",
    image: "https://picsum.photos/seed/daily/400/300"
  },
  {
    title: "You Execute, We Calculate",
    description: "Every morning, we recommend the exact amount to invest based on partition progress and market moves. One click to confirm.",
    image: "https://picsum.photos/seed/execute/400/300"
  }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8">
      <div className="flex-1">
        <div className="mb-8 rounded-2xl overflow-hidden shadow-md">
          <img src={steps[currentStep].image} alt="step" className="w-full h-48 object-cover" />
        </div>
        <div className="flex gap-2 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= currentStep ? 'bg-sky-500' : 'bg-slate-200'}`} />
          ))}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{steps[currentStep].title}</h2>
        <p className="text-slate-600 leading-relaxed text-lg">{steps[currentStep].description}</p>
      </div>
      
      <button 
        onClick={next}
        className="w-full bg-sky-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-sky-200 hover:bg-sky-600 transition-colors"
      >
        {currentStep === steps.length - 1 ? "Let's Start" : "Next"}
      </button>
    </div>
  );
};

export default Onboarding;
