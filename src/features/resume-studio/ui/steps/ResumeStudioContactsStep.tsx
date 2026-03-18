import { useFieldArray, useFormContext } from 'react-hook-form';

import { createEmptyResumeStudioProfileDraft } from '../../draft-factories';
import { ResumeStudioInputField, ResumeStudioSectionCard } from '../form-fields';
import { useResumeStudioFieldArrayStructuralSync } from '../draft-sync-context';
import { ResumeStudioButton, ResumeStudioCard } from '../primitives';
import type { ResumeStudioDraft } from '../../types';

export function ResumeStudioContactsStep() {
  const { control } = useFormContext<ResumeStudioDraft>();
  const { append, fields, remove } = useFieldArray({
    control,
    name: 'basics.profiles',
  });
  useResumeStudioFieldArrayStructuralSync(fields);

  return (
    <div className="space-y-4">
      <ResumeStudioSectionCard title="Contacts">
        <p className="m-0 text-sm leading-6 text-(--color-secondary)">
          Email and phone are stored locally and used for PDF output, but they stay off the public web page.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <ResumeStudioInputField
            label="Email"
            name="basics.email"
            placeholder="jane@example.com"
            type="email"
          />
          <ResumeStudioInputField
            label="Phone"
            name="basics.phone"
            placeholder="+44 7700 900000"
          />
          <ResumeStudioInputField
            label="City"
            name="basics.city"
            placeholder="London"
          />
          <ResumeStudioInputField
            label="Region"
            name="basics.region"
            placeholder="England"
          />
          <ResumeStudioInputField
            label="Country"
            name="basics.country"
            placeholder="United Kingdom"
          />
          <ResumeStudioInputField
            label="Country code"
            name="basics.countryCode"
            placeholder="UK"
          />
        </div>
      </ResumeStudioSectionCard>

      <ResumeStudioSectionCard title="Links">
        <div className="space-y-3">
          {fields.map((field, index) => (
            <ResumeStudioCard
              key={field.id}
              spacing="compact"
            >
              <div className="grid gap-3 md:grid-cols-3">
                <ResumeStudioInputField
                  label="Network"
                  name={`basics.profiles.${index}.network`}
                  placeholder="LinkedIn"
                />
                <ResumeStudioInputField
                  label="Username"
                  name={`basics.profiles.${index}.username`}
                  placeholder="/jane-doe"
                />
                <ResumeStudioInputField
                  label="URL"
                  name={`basics.profiles.${index}.url`}
                  placeholder="https://example.com/jane-doe"
                  type="url"
                />
              </div>
              <div className="mt-3 flex justify-end">
                <ResumeStudioButton
                  onClick={() => remove(index)}
                  size="compact"
                  variant="dangerOutline"
                >
                  Remove link
                </ResumeStudioButton>
              </div>
            </ResumeStudioCard>
          ))}
        </div>

        <ResumeStudioButton
          onClick={() => append(createEmptyResumeStudioProfileDraft())}
        >
          Add profile link
        </ResumeStudioButton>
      </ResumeStudioSectionCard>
    </div>
  );
}
