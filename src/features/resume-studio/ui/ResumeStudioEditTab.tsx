import type { ReactElement } from 'react';

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

type ResumeStudioStepDefinition = {
  id: ResumeStudioStepId;
  label: string;
  render: (
    props: Pick<ResumeStudioEditTabProps, 'isUploadingPhoto' | 'onUploadPhoto'>
  ) => ReactElement;
};

const RESUME_STUDIO_STEP_DEFINITIONS: ResumeStudioStepDefinition[] = [
  {
    id: 'basics',
    label: 'Basics',
    render: ({ isUploadingPhoto, onUploadPhoto }) => (
      <ResumeStudioBasicsStep
        isUploadingPhoto={isUploadingPhoto}
        onUploadPhoto={onUploadPhoto}
      />
    ),
  },
  {
    id: 'contacts',
    label: 'Contacts',
    render: () => <ResumeStudioContactsStep />,
  },
  {
    id: 'achievements',
    label: 'Achievements',
    render: () => <ResumeStudioAchievementsStep />,
  },
  {
    id: 'experience',
    label: 'Experience',
    render: () => <ResumeStudioExperienceStep />,
  },
  {
    id: 'skills',
    label: 'Skills',
    render: () => <ResumeStudioSkillsStep />,
  },
  {
    id: 'education',
    label: 'Education',
    render: () => <ResumeStudioEducationStep />,
  },
];

export function ResumeStudioEditTab({
  currentStep,
  isUploadingPhoto,
  onStepChange,
  onUploadPhoto,
}: ResumeStudioEditTabProps) {
  const currentStepDefinition =
    RESUME_STUDIO_STEP_DEFINITIONS.find((step) => step.id === currentStep) ||
    RESUME_STUDIO_STEP_DEFINITIONS[0];

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

      {currentStepDefinition.render({
        isUploadingPhoto,
        onUploadPhoto,
      })}
    </div>
  );
}
