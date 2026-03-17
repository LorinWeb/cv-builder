import { ResumeStudioTextListEditor } from '../ResumeStudioTextListEditor';

export function ResumeStudioAchievementsStep() {
  return (
    <ResumeStudioTextListEditor
      addLabel="Add achievement"
      emptyCopy="Add the proof points you want to highlight above the experience section."
      label="Selected achievements"
      name="impact"
      placeholder="Led a platform migration, improved reliability, or shipped a critical product milestone."
    />
  );
}
