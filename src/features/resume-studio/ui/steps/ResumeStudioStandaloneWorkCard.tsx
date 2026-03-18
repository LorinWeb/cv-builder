import { memo } from 'react';

import { ResumeStudioCard } from '../primitives';
import { ResumeStudioWorkRoleFields } from './ResumeStudioWorkRoleFields';

interface ResumeStudioStandaloneWorkCardProps {
  index: number;
  removeRole: (index?: number | number[]) => void;
}

export const ResumeStudioStandaloneWorkCard = memo(function ResumeStudioStandaloneWorkCard({
  index,
  removeRole,
}: ResumeStudioStandaloneWorkCardProps) {
  return (
    <ResumeStudioCard data-testid="resume-studio-work-role">
      <ResumeStudioWorkRoleFields
        basePath={`work.${index}`}
        includeWebsiteField
        onRemove={() => removeRole(index)}
      />
    </ResumeStudioCard>
  );
});
