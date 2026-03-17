import { useFieldArray, useFormContext } from 'react-hook-form';

import {
  createEmptyResumeStudioProgressionGroupDraft,
  createEmptyResumeStudioStandaloneWorkDraft,
  isResumeStudioProgressionGroupDraft,
} from '../../draft-factories';
import type { ResumeStudioDraft } from '../../types';
import { ResumeStudioSectionCard } from '../form-fields';
import { ResumeStudioButton } from '../primitives';
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
        <ResumeStudioButton
          onClick={() => append(createEmptyResumeStudioStandaloneWorkDraft())}
        >
          Add role
        </ResumeStudioButton>
        <ResumeStudioButton
          onClick={() => append(createEmptyResumeStudioProgressionGroupDraft())}
        >
          Add company progression
        </ResumeStudioButton>
      </div>
    </ResumeStudioSectionCard>
  );
}
