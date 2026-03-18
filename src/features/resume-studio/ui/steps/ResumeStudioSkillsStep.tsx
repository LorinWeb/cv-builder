import { memo } from 'react';
import { X } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { createEmptyResumeStudioSkillDraft } from '../../draft-factories';
import { ListItemsEditor } from '../ListItemsEditor';
import { useResumeStudioFieldArrayStructuralSync } from '../draft-sync-context';
import { ResumeStudioInputField, ResumeStudioSectionCard } from '../form-fields';
import { ResumeStudioButton, ResumeStudioCard } from '../primitives';
import type { ResumeStudioDraft } from '../../types';

interface ResumeStudioSkillCategoryCardProps {
  index: number;
  removeSkill: (index?: number | number[]) => void;
}

const ResumeStudioSkillCategoryCard = memo(function ResumeStudioSkillCategoryCard({
  index,
  removeSkill,
}: ResumeStudioSkillCategoryCardProps) {
  return (
    <ResumeStudioCard className="relative">
      <ResumeStudioButton
        aria-label={`Remove skill category ${index + 1}`}
        onClick={() => removeSkill(index)}
        size="icon"
        variant="dangerSolid"
        className="absolute right-4 top-4"
      >
        <X className="h-3.5 w-3.5" />
      </ResumeStudioButton>

      <div className="pr-10">
        <ResumeStudioInputField
          hideLabel
          label="Category"
          name={`skills.${index}.name`}
          placeholder="Leadership and delivery"
        />
      </div>

      <div className="mt-4">
        <ListItemsEditor
          addLabel="Add keyword"
          emptyCopy="List the tools, domains, or strengths you want this category to cover."
          hideLabel
          itemLabel="keyword"
          label="Keywords"
          name={`skills.${index}.keywords`}
          placeholder="Roadmapping, mentoring, platform design, or incident response."
        />
      </div>
    </ResumeStudioCard>
  );
});

export function ResumeStudioSkillsStep() {
  const { control } = useFormContext<ResumeStudioDraft>();
  const { append, fields, remove } = useFieldArray({
    control,
    name: 'skills',
  });
  useResumeStudioFieldArrayStructuralSync(fields);

  return (
    <ResumeStudioSectionCard title="Skills">
      <div className="space-y-4">
        {fields.map((field, index) => (
          <ResumeStudioSkillCategoryCard
            key={field.id}
            index={index}
            removeSkill={(removeIndex) => remove(removeIndex)}
          />
        ))}
      </div>

      <ResumeStudioButton onClick={() => append(createEmptyResumeStudioSkillDraft())}>
        Add skill category
      </ResumeStudioButton>
    </ResumeStudioSectionCard>
  );
}
