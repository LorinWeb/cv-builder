import { ListItemsEditor } from '../ListItemsEditor';
import { ResumeStudioSectionCard } from '../form-fields';

export function ResumeStudioAchievementsStep() {
  return (
    <ResumeStudioSectionCard title="Selected achievements">
      <ListItemsEditor
        addLabel="Add achievement"
        emptyCopy="Add the proof points you want to highlight above the experience section."
        hideLabel
        itemLabel="achievement"
        label="Selected achievements"
        name="impact"
        placeholder="Led a platform migration, improved reliability, or shipped a critical product milestone."
      />
    </ResumeStudioSectionCard>
  );
}
