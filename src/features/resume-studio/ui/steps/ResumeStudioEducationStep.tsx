import { useFieldArray, useFormContext } from 'react-hook-form';

import { ListItemsEditor } from '../ListItemsEditor';
import { ResumeStudioInputField, ResumeStudioSectionCard } from '../form-fields';
import type { ResumeStudioDraft } from '../../types';

export function ResumeStudioEducationStep() {
  const { control } = useFormContext<ResumeStudioDraft>();
  const { append, fields, remove } = useFieldArray({
    control,
    name: 'education',
  });

  return (
    <ResumeStudioSectionCard title="Education">
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="rounded-3xl border border-[rgba(74,127,122,0.14)] bg-[rgba(242,246,241,0.76)] p-4"
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
              <button
                type="button"
                onClick={() => remove(index)}
                className="rounded-full border border-[rgba(155,44,44,0.2)] px-3 py-1.5 text-xs font-medium text-[#9b2c2c]"
              >
                Remove education
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          append({
            area: '',
            courses: [],
            endDate: '',
            gpa: '',
            institution: '',
            startDate: '',
            studyType: '',
          })
        }
        className="rounded-full border border-(--color-header-border) bg-white px-4 py-2 text-sm font-medium text-(--color-primary)"
      >
        Add education entry
      </button>
    </ResumeStudioSectionCard>
  );
}
