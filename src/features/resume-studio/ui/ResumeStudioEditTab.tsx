import { RESUME_STUDIO_STEP_ORDER } from '../constants';
import type { ResumeStudioStepId, ResumeStudioWarning } from '../types';
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
  warnings: ResumeStudioWarning[];
}

const STEP_LABELS: Record<ResumeStudioStepId, string> = {
  achievements: 'Achievements',
  basics: 'Basics',
  contacts: 'Contacts',
  education: 'Education',
  experience: 'Experience',
  skills: 'Skills',
};

export function ResumeStudioEditTab({
  currentStep,
  isUploadingPhoto,
  onStepChange,
  onUploadPhoto,
  warnings,
}: ResumeStudioEditTabProps) {
  const workWarning = warnings.find((warning) => warning.step === 'experience');

  function renderCurrentStep() {
    switch (currentStep) {
      case 'basics':
        return (
          <ResumeStudioBasicsStep
            isUploadingPhoto={isUploadingPhoto}
            onUploadPhoto={onUploadPhoto}
          />
        );
      case 'contacts':
        return <ResumeStudioContactsStep />;
      case 'achievements':
        return <ResumeStudioAchievementsStep />;
      case 'experience':
        return (
          <ResumeStudioExperienceStep
            isReadOnly={Boolean(workWarning)}
            warningMessage={workWarning?.message}
          />
        );
      case 'skills':
        return <ResumeStudioSkillsStep />;
      case 'education':
        return <ResumeStudioEducationStep />;
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {RESUME_STUDIO_STEP_ORDER.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onStepChange(step)}
            className={
              currentStep === step
                ? 'rounded-full bg-(--color-primary) px-4 py-2 text-sm font-medium text-white'
                : 'rounded-full border border-(--color-header-border) bg-white px-4 py-2 text-sm font-medium text-(--color-primary)'
            }
          >
            {STEP_LABELS[step]}
          </button>
        ))}
      </div>

      {renderCurrentStep()}
    </div>
  );
}
