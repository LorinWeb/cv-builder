import type { ComponentPropsWithoutRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Download, Link2, Mail, MapPin, Phone } from 'lucide-react';

import { usePageHeaderState } from './Layout/Page/pageHeaderState';
import { joinClassNames } from '../helpers/classNames';
import { getProfileContactItems, usePdfDownload } from '../features/pdf-download';
import type { ResumeBasics, ResumeSourceBasics } from '../data/types/resume';

const CONTACT_ICONS: Record<'email' | 'location' | 'phone' | 'profile', LucideIcon> = {
  email: Mail,
  location: MapPin,
  phone: Phone,
  profile: Link2,
};

interface ProfileSectionProps extends ComponentPropsWithoutRef<'div'> {
  profileData: ResumeBasics | ResumeSourceBasics;
}

function ProfileSection({
  profileData,
  className,
  ...props
}: ProfileSectionProps) {
  const { isStickyClone } = usePageHeaderState();
  const contactItems = getProfileContactItems(profileData);
  const { href, isAvailable, isPdfRenderTarget, label } = usePdfDownload();
  const photo = profileData.photo;
  const showCompactPhoto = !!photo && isStickyClone;

  return (
    <div
      data-testid="profile-section"
      data-collapse-progress={showCompactPhoto ? '1.000' : '0.000'}
      className={joinClassNames(
        'mb-0 flex flex-col items-center gap-4.5 border-b border-b-(--color-header-border) bg-white pb-4.5',
        className
      )}
      {...props}
    >
      <div
        data-testid="profile-top-row"
        className="flex w-full items-center"
      >
        {photo ? (
          <div
            aria-hidden="true"
            data-testid="profile-photo-compact"
            data-visible={String(showCompactPhoto)}
            className={joinClassNames(
              'shrink-0 overflow-hidden transition-[height,width,margin-right,opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none print:hidden',
              showCompactPhoto
                ? 'mr-4 mt-4 h-22.25 w-16.5 translate-x-0 opacity-100'
                : 'mr-0 h-0 w-0 -translate-x-2 opacity-0'
            )}
          >
            <img
              src={photo.src}
              alt=""
              className={joinClassNames(
                'block h-22.25 w-16.5 rounded-[14px] border border-[rgba(137,186,182,0.45)] object-cover object-center shadow-[0_12px_24px_-20px_rgba(34,34,34,0.5)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                showCompactPhoto ? 'scale-100' : 'scale-90'
              )}
            />
          </div>
        ) : null}

        <div
          data-testid="profile-intro"
          className="min-w-0 flex-1 text-left"
        >
          <h1
            data-testid="profile-title"
            className="text-(--color-primary) my-0"
          >
            {profileData.name}
          </h1>
          <p
            data-testid="profile-subtitle"
            className="m-0 text-[1.1rem] leading-normal text-(--color-secondary)"
          >
            {profileData.label}
          </p>
        </div>
      </div>

      <div className="min-w-0 w-full">
        <ul
          data-testid="profile-contacts"
          className="m-0 flex list-none flex-wrap justify-start gap-x-4.5 gap-y-2 pl-0 text-[0.8em]"
        >
          {contactItems.map((item) => {
            const Icon = CONTACT_ICONS[item.kind];

            return (
              <li
                key={item.key}
                data-testid={`profile-contact-${item.key}`}
                className="list-none text-(--color-secondary)"
              >
                {item.href ? (
                  <a
                    href={item.href}
                    className="inline-flex items-center gap-1.5 text-inherit no-underline"
                  >
                    <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0">{item.text}</span>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0">{item.text}</span>
                  </span>
                )}
              </li>
            );
          })}

          {isAvailable && !isPdfRenderTarget ? (
            <li
              data-testid="profile-download"
              className="list-none text-(--color-primary) print:hidden"
            >
              <a
                href={href}
                download
                className="inline-flex items-center gap-1.5 rounded-full border border-(--color-header-border) px-3 py-1 text-inherit no-underline transition-colors hover:bg-[rgba(137,186,182,0.08)]"
              >
                <Download
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0"
                />
                <span>{label}</span>
              </a>
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

export default ProfileSection;
