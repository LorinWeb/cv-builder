import { useFieldArray, useFormContext } from 'react-hook-form';

import {
  createEmptyResumeStudioProgressionGroupDraft,
  createEmptyResumeStudioStandaloneWorkDraft,
  isResumeStudioProgressionGroupDraft,
} from '../../work-draft';
import type { ResumeStudioDraft } from '../../types';
import { ResumeStudioSectionCard } from '../form-fields';
import { ResumeStudioProgressionGroupCard } from './ResumeStudioProgressionGroupCard';
import { ResumeStudioStandaloneWorkCard } from './ResumeStudioStandaloneWorkCard';

export function ResumeStudioExperienceStep() {
  const { control } = useFormContext<ResumeStudioDraft>();
  const { append, fields, remove } = useFieldArray({
    control,
    name: 'work',
  });

  return (
    <ResumeStudioSectionCard title="Experience">
      <div className="space-y-4">
        {fields.map((field, index) =>
          isResumeStudioProgressionGroupDraft(field) ? (
            <ResumeStudioProgressionGroupCard
              key={field.id}
              index={index}
              onRemove={() => remove(index)}
            />
          ) : (
            <ResumeStudioStandaloneWorkCard
              key={field.id}
              index={index}
              onRemove={() => remove(index)}
            />
          )
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => append(createEmptyResumeStudioStandaloneWorkDraft())}
          className="rounded-full border border-(--color-header-border) bg-white px-4 py-2 text-sm font-medium text-(--color-primary)"
        >
          Add role
        </button>
        <button
          type="button"
          onClick={() => append(createEmptyResumeStudioProgressionGroupDraft())}
          className="rounded-full border border-(--color-header-border) bg-white px-4 py-2 text-sm font-medium text-(--color-primary)"
        >
          Add company progression
        </button>
      </div>
    </ResumeStudioSectionCard>
  );
}
