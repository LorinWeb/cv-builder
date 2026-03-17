import { ResumeStudioCard } from '../primitives';
import { ResumeStudioWorkRoleFields } from './ResumeStudioWorkRoleFields';

interface ResumeStudioStandaloneWorkCardProps {
  index: number;
  onRemove: () => void;
}

export function ResumeStudioStandaloneWorkCard({
  index,
  onRemove,
}: ResumeStudioStandaloneWorkCardProps) {
  return (
    <ResumeStudioCard data-testid="resume-studio-work-role">
      <ResumeStudioWorkRoleFields
        basePath={`work.${index}`}
        includeWebsiteField
        onRemove={onRemove}
      />
    </ResumeStudioCard>
  );
}
