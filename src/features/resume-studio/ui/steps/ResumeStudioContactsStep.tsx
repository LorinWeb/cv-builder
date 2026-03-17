import { useFieldArray, useFormContext } from 'react-hook-form';

import { ResumeStudioInputField, ResumeStudioSectionCard } from '../form-fields';
import type { ResumeStudioDraft } from '../../types';

export function ResumeStudioContactsStep() {
  const { control } = useFormContext<ResumeStudioDraft>();
  const { append, fields, remove } = useFieldArray({
    control,
    name: 'basics.profiles',
  });

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
            <div
              key={field.id}
              className="rounded-2xl border border-[rgba(74,127,122,0.14)] bg-[rgba(242,246,241,0.76)] p-3.5"
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
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="rounded-full border border-[rgba(155,44,44,0.2)] px-3 py-1.5 text-xs font-medium text-[#9b2c2c]"
                >
                  Remove link
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => append({ network: '', url: '', username: '' })}
          className="rounded-full border border-(--color-header-border) bg-white px-4 py-2 text-sm font-medium text-(--color-primary)"
        >
          Add profile link
        </button>
      </ResumeStudioSectionCard>
    </div>
  );
}
