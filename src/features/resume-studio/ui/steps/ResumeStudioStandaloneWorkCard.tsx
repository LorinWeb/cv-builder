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
    <div
      data-testid="resume-studio-work-role"
      className="rounded-3xl border border-[rgba(74,127,122,0.14)] bg-[rgba(242,246,241,0.76)] p-4"
    >
      <ResumeStudioWorkRoleFields
        basePath={`work.${index}`}
        includeWebsiteField
        onRemove={onRemove}
      />
    </div>
  );
}
