import React, { useState, Children, useRef, useLayoutEffect, HTMLAttributes, ReactNode } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { BorderBeam } from './BorderBeam';

interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  stepCircleContainerClassName?: string;
  stepContainerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  backButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  nextButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  backButtonText?: string;
  nextButtonText?: string;
  disableStepIndicators?: boolean;
  renderStepIndicator?: (props: {
    step: number;
    currentStep: number;
    onStepClick: (clicked: number) => void;
  }) => ReactNode;
}

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  stepCircleContainerClassName = '',
  stepContainerClassName = '',
  contentClassName = '',
  footerClassName = '',
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  disableStepIndicators = false,
  renderStepIndicator,
  ...rest
}: StepperProps) {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [direction, setDirection] = useState<number>(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) {
      onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  return (
    <div
      className="flex min-h-full flex-1 flex-col items-center justify-center p-4 w-full"
      {...rest}
    >
      <div
        className={`mx-auto w-full max-w-4xl rounded-[40px] shadow-xl bg-white border border-[#a53860]/20 relative overflow-hidden ${stepCircleContainerClassName}`}
      >
        <BorderBeam colorFrom="#450920" colorTo="#a53860" size={250} duration={8} borderWidth={2} borderRadius={40} />
        <div className={`${stepContainerClassName} flex w-full items-center justify-between p-8 md:p-12 relative`}>
          {/* Background Connector Line */}
          <div className="absolute top-1/2 left-[10%] right-[10%] h-[2px] bg-[#f9dbbd] -translate-y-1/2 z-0 hidden md:block" />

          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            const isNotLastStep = index < totalSteps - 1;
            return (
              <React.Fragment key={stepNumber}>
                <div className="relative z-10">
                  {renderStepIndicator ? (
                    renderStepIndicator({
                      step: stepNumber,
                      currentStep,
                      onStepClick: clicked => {
                        setDirection(clicked > currentStep ? 1 : -1);
                        updateStep(clicked);
                      }
                    })
                  ) : (
                    <StepIndicator
                      step={stepNumber}
                      disableStepIndicators={disableStepIndicators}
                      currentStep={currentStep}
                      onClickStep={clicked => {
                        setDirection(clicked > currentStep ? 1 : -1);
                        updateStep(clicked);
                      }}
                    />
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          className={`space-y-2 px-8 md:px-16 ${contentClassName}`}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {!isCompleted && (
          <div className={`px-8 md:px-16 pb-12 ${footerClassName}`}>
            <div className={`mt-10 flex ${currentStep !== 1 ? 'justify-between' : 'justify-end'}`}>
              {currentStep !== 1 && (
                <button
                  onClick={handleBack}
                  className={`duration-350 rounded-full px-6 py-2.5 transition font-semibold ${
                    currentStep === 1
                      ? 'pointer-events-none opacity-50 text-[#a53860]/50'
                      : 'text-[#a53860] hover:text-[#450920] bg-[#f9dbbd]/30 hover:bg-[#f9dbbd]/60'
                  }`}
                  {...backButtonProps}
                >
                  {backButtonText}
                </button>
              )}
              <button
                onClick={isLastStep ? handleComplete : handleNext}
                className="duration-350 flex items-center justify-center rounded-full bg-[#450920] py-2.5 px-8 font-semibold tracking-tight text-white transition hover:bg-[#290a11] active:bg-[#1d070c] shadow-md hover:shadow-lg"
                {...nextButtonProps}
              >
                {isLastStep ? 'Complete' : nextButtonText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StepContentWrapperProps {
  isCompleted: boolean;
  currentStep: number;
  direction: number;
  children: ReactNode;
  className?: string;
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
  className = ''
}: StepContentWrapperProps) {
  const [parentHeight, setParentHeight] = useState<number>(0);

  return (
    <motion.div
      style={{ position: 'relative', overflow: 'hidden' }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={{ type: 'spring', duration: 0.4 }}
      className={className}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <SlideTransition key={currentStep} direction={direction} onHeightReady={h => setParentHeight(h)}>
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface SlideTransitionProps {
  children: ReactNode;
  direction: number;
  onHeightReady: (height: number) => void;
}

function SlideTransition({ children, direction, onHeightReady }: SlideTransitionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      onHeightReady(containerRef.current.offsetHeight);
    }
  }, [children, onHeightReady]);

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4 }}
      style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
    >
      {children}
    </motion.div>
  );
}

const stepVariants: Variants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? '-100%' : '100%',
    opacity: 0
  }),
  center: {
    x: '0%',
    opacity: 1
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? '50%' : '-50%',
    opacity: 0
  })
};

interface StepProps {
  children: ReactNode;
}

export function Step({ children }: StepProps) {
  return <div className="py-4">{children}</div>;
}

interface StepIndicatorProps {
  step: number;
  currentStep: number;
  onClickStep: (clicked: number) => void;
  disableStepIndicators?: boolean;
}

function StepIndicator({ step, currentStep, onClickStep, disableStepIndicators = false }: StepIndicatorProps) {
  const status = currentStep === step ? 'active' : currentStep < step ? 'inactive' : 'complete';

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) {
      onClickStep(step);
    }
  };

  return (
    <motion.div
      onClick={handleClick}
      className={`relative outline-none focus:outline-none ${disableStepIndicators ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
      animate={status}
      initial={false}
    >
      <motion.div
        variants={{
          inactive: { scale: 1, backgroundColor: '#fffbfa', color: '#a53860' },
          active: { scale: 1.1, backgroundColor: '#450920', color: '#f9dbbd' },
          complete: { scale: 1, backgroundColor: '#a53860', color: '#fffbfa' }
        }}
        transition={{ duration: 0.3 }}
        className="flex h-12 w-12 items-center justify-center rounded-full font-semibold border-2 border-[#a53860]/20 shadow-md"
      >
        {status === 'complete' ? (
          <CheckIcon className="h-6 w-6" />
        ) : (
          <span className="text-lg">{step}</span>
        )}
      </motion.div>
    </motion.div>
  );
}

interface CheckIconProps extends React.SVGProps<SVGSVGElement> {}

function CheckIcon(props: CheckIconProps) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          delay: 0.1,
          type: 'tween',
          ease: 'easeOut',
          duration: 0.3
        }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
