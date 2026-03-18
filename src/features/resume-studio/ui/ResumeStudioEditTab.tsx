import { memo, useEffect, useState } from 'react';

import type { ResumeStudioStepId } from '../types';
import { ResumeStudioButton } from './primitives';
import { ResumeStudioAchievementsStep } from './steps/ResumeStudioAchievementsStep';
import { ResumeStudioBasicsStep } from './steps/ResumeStudioBasicsStep';
import { ResumeStudioContactsStep } from './steps/ResumeStudioContactsStep';
import { ResumeStudioEducationStep } from './steps/ResumeStudioEducationStep';
import { ResumeStudioExperienceStep } from './steps/ResumeStudioExperienceStep';
import { ResumeStudioSkillsStep } from './steps/ResumeStudioSkillsStep';

interface ResumeStudioEditTabProps {
  currentStep: ResumeStudioStepId;
  isUploadingPhoto: boolean;
  onStepChange: (step: ResumeStudioStepId) => void;
  onUploadPhoto: (file: File) => Promise<void>;
}

const RESUME_STUDIO_STEP_DEFINITIONS: Array<{
  id: ResumeStudioStepId;
  label: string;
}> = [
  { id: 'basics', label: 'Basics' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'education', label: 'Education' },
];

interface ResumeStudioStepPanelProps {
  id: ResumeStudioStepId;
  isActive: boolean;
  isMounted: boolean;
  isUploadingPhoto: boolean;
  onUploadPhoto: (file: File) => Promise<void>;
}

const ResumeStudioStepPanel = memo(
  function ResumeStudioStepPanel({
    id,
    isActive,
    isMounted,
    isUploadingPhoto,
    onUploadPhoto,
  }: ResumeStudioStepPanelProps) {
    if (!isMounted) {
      return null;
    }

    return (
      <section
        data-testid={`resume-studio-step-panel-${id}`}
        hidden={!isActive}
      >
        {id === 'basics' ? (
          <ResumeStudioBasicsStep
            isUploadingPhoto={isUploadingPhoto}
            onUploadPhoto={onUploadPhoto}
          />
        ) : null}
        {id === 'contacts' ? <ResumeStudioContactsStep /> : null}
        {id === 'achievements' ? <ResumeStudioAchievementsStep /> : null}
        {id === 'experience' ? <ResumeStudioExperienceStep /> : null}
        {id === 'skills' ? <ResumeStudioSkillsStep /> : null}
        {id === 'education' ? <ResumeStudioEducationStep /> : null}
      </section>
    );
  },
  (previousProps, nextProps) => {
    if (
      previousProps.id !== nextProps.id ||
      previousProps.isActive !== nextProps.isActive ||
      previousProps.isMounted !== nextProps.isMounted
    ) {
      return false;
    }

    if (nextProps.id === 'basics') {
      return (
        previousProps.isUploadingPhoto === nextProps.isUploadingPhoto &&
        previousProps.onUploadPhoto === nextProps.onUploadPhoto
      );
    }

    return true;
  }
);

export function ResumeStudioEditTab({
  currentStep,
  isUploadingPhoto,
  onStepChange,
  onUploadPhoto,
}: ResumeStudioEditTabProps) {
  const [mountedSteps, setMountedSteps] = useState<ResumeStudioStepId[]>(() => [currentStep]);

  useEffect(() => {
    setMountedSteps((currentMountedSteps) =>
      currentMountedSteps.includes(currentStep)
        ? currentMountedSteps
        : [...currentMountedSteps, currentStep]
    );
  }, [currentStep]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {RESUME_STUDIO_STEP_DEFINITIONS.map((step) => (
          <ResumeStudioButton
            key={step.id}
            onClick={() => onStepChange(step.id)}
            variant={currentStep === step.id ? 'primary' : 'secondary'}
          >
            {step.label}
          </ResumeStudioButton>
        ))}
      </div>

      {RESUME_STUDIO_STEP_DEFINITIONS.map((step) => (
        <ResumeStudioStepPanel
          key={step.id}
          id={step.id}
          isActive={currentStep === step.id}
          isMounted={mountedSteps.includes(step.id)}
          isUploadingPhoto={isUploadingPhoto}
          onUploadPhoto={onUploadPhoto}
        />
      ))}
    </div>
  );
}
