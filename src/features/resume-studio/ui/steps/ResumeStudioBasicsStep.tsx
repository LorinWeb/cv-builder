import type { ChangeEvent } from 'react';
import { X } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import { TextEditor } from '../TextEditor';
import {
  ResumeStudioCheckboxField,
  ResumeStudioInputField,
  ResumeStudioSectionCard,
} from '../form-fields';
import { ResumeStudioButton } from '../primitives';
import type { ResumeStudioDraft } from '../../types';

interface ResumeStudioBasicsStepProps {
  isUploadingPhoto: boolean;
  onUploadPhoto: (file: File) => Promise<void>;
}

export function ResumeStudioBasicsStep({
  isUploadingPhoto,
  onUploadPhoto,
}: ResumeStudioBasicsStepProps) {
  const { setValue, watch } = useFormContext<ResumeStudioDraft>();
  const photoInputId = 'resume-studio-photo-input';
  const name = watch('basics.name');
  const photoSrc = watch('basics.photoSrc');
  const photoPreviewAlt = `${name?.trim() || 'Profile'} photo`;

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await onUploadPhoto(file);
    event.target.value = '';
  }

  function handleRemovePhoto() {
    setValue('basics.photoSrc', '', { shouldDirty: true, shouldTouch: true });
  }

  return (
    <div className="space-y-4">
      <ResumeStudioSectionCard title="Profile">
        <div className="grid gap-4 md:grid-cols-2">
          <ResumeStudioInputField
            label="Name"
            name="basics.name"
            placeholder="Jane Doe"
            testId="resume-studio-field-basics-name"
          />
          <ResumeStudioInputField
            label="Title"
            name="basics.label"
            placeholder="Staff Engineer"
          />
        </div>
        <TextEditor
          description="Markdown supported."
          label="Summary"
          minRows={5}
          name="basics.summary"
          placeholder="Explain your strengths, scope, and the kind of work you want next."
          testId="resume-studio-field-basics-summary"
        />
        <ResumeStudioCheckboxField
          className="mt-3"
          label="Alway show as first section"
          name="basics.summaryAlwaysFirstSection"
          testId="resume-studio-field-basics-summary-first-section"
        />
      </ResumeStudioSectionCard>

      <ResumeStudioSectionCard title="Portrait">
        <div className="rounded-3xl border border-dashed border-(--color-border-control) bg-(--color-surface-subtle) p-4">
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor={photoInputId}
              className="inline-flex cursor-pointer items-center rounded-full bg-(--color-fill-strong) px-4 py-2 text-sm font-medium text-white"
            >
              {isUploadingPhoto ? 'Uploading…' : 'Upload Photo'}
              <input
                data-testid="resume-studio-photo-input"
                className="sr-only"
                id={photoInputId}
                name="resume-studio-photo-file"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePhotoChange}
              />
            </label>
            {photoSrc ? (
              <div className="relative">
                <img
                  data-testid="resume-studio-photo-preview"
                  src={photoSrc}
                  alt={photoPreviewAlt}
                  className="h-14 w-14 rounded-2xl border border-(--color-border-thumbnail) object-cover object-center shadow-[0_12px_24px_-18px_rgba(11,37,31,0.45)]"
                />
                <ResumeStudioButton
                  aria-label="Remove portrait"
                  data-testid="resume-studio-remove-photo"
                  onClick={handleRemovePhoto}
                  size="icon"
                  variant="dangerSolid"
                  className="absolute -right-1 -top-1 h-5 w-5"
                >
                  <X className="h-3 w-3" />
                </ResumeStudioButton>
              </div>
            ) : null}
          </div>
        </div>
      </ResumeStudioSectionCard>
    </div>
  );
}
