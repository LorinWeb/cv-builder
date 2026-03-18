import { useFieldArray, useFormContext } from 'react-hook-form';

import { createEmptyResumeStudioEducationDraft } from '../../draft-factories';
import { useResumeStudioFieldArrayStructuralSync } from '../draft-sync-context';
import { ListItemsEditor } from '../ListItemsEditor';
import { ResumeStudioInputField, ResumeStudioSectionCard } from '../form-fields';
import { ResumeStudioButton, ResumeStudioCard } from '../primitives';
import type { ResumeStudioDraft } from '../../types';

export function ResumeStudioEducationStep() {
  const { control } = useFormContext<ResumeStudioDraft>();
  const { append, fields, remove } = useFieldArray({
    control,
    name: 'education',
  });
  useResumeStudioFieldArrayStructuralSync(fields);

  return (
    <ResumeStudioSectionCard title="Education">
      <div className="space-y-4">
        {fields.map((field, index) => (
          <ResumeStudioCard
            key={field.id}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ResumeStudioInputField
                label="Institution"
                name={`education.${index}.institution`}
                placeholder="Example University"
              />
              <ResumeStudioInputField
                label="Area"
                name={`education.${index}.area`}
                placeholder="Computer Science"
              />
              <ResumeStudioInputField
                label="Study type"
                name={`education.${index}.studyType`}
                placeholder="Bachelor's degree"
              />
              <ResumeStudioInputField
                label="GPA"
                name={`education.${index}.gpa`}
                placeholder="Optional"
              />
              <ResumeStudioInputField
                label="Start date"
                name={`education.${index}.startDate`}
                placeholder="2014-09-01"
              />
              <ResumeStudioInputField
                label="End date"
                name={`education.${index}.endDate`}
                placeholder="2018-06-30"
              />
            </div>
            <div className="mt-4">
              <ListItemsEditor
                addLabel="Add course"
                emptyCopy="List optional standout modules or focus areas."
                itemLabel="course"
                label="Courses"
                name={`education.${index}.courses`}
                placeholder="Algorithms, distributed systems, HCI, or design research."
              />
            </div>
            <div className="mt-4 flex justify-end">
              <ResumeStudioButton
                onClick={() => remove(index)}
                size="compact"
                variant="dangerOutline"
              >
                Remove education
              </ResumeStudioButton>
            </div>
          </ResumeStudioCard>
        ))}
      </div>

      <ResumeStudioButton onClick={() => append(createEmptyResumeStudioEducationDraft())}>
        Add education entry
      </ResumeStudioButton>
    </ResumeStudioSectionCard>
  );
}
