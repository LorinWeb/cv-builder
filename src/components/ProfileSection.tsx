import type { ComponentPropsWithoutRef } from 'react';

import { usePageHeaderState } from './Layout/Page/pageHeaderState';
import { joinClassNames } from '../helpers/classNames';
import type {
  ResumeBasics,
  ResumeLocation,
  ResumeProfile,
} from '../data/types/resume';

const COUNTRY_LABELS = {
  UK: 'United Kingdom',
  US: 'United States',
} as const;

interface ProfileSectionProps extends ComponentPropsWithoutRef<'div'> {
  profileData: ResumeBasics;
}

function formatLocation(location: ResumeLocation = {}) {
  const country =
    location.country ||
    (location.countryCode
      ? COUNTRY_LABELS[location.countryCode as keyof typeof COUNTRY_LABELS] ||
        location.countryCode
      : undefined);

  return [location.city, country].filter(Boolean).join(', ');
}

function formatProfileUrl(url: ResumeProfile['url']) {
  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.host}${parsedUrl.pathname}`.replace(/\/$/, '');
  } catch {
    return url;
  }
}

function formatPhoneHref(phoneNumber = '') {
  return phoneNumber.replace(/[^\d+]/g, '');
}

function ProfileSection({
  profileData,
  className,
  ...props
}: ProfileSectionProps) {
  const { isStickyClone } = usePageHeaderState();
  const profiles = profileData.profiles || [];
  const location = formatLocation(profileData.location);
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
            className="text-(--color-primary)"
            style={{ lineHeight: 1.2, marginBottom: '6px' }}
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
          className="m-0 flex list-none flex-wrap justify-between gap-x-4.5 gap-y-2 pl-0 text-[0.8em]"
        >
          <li className="list-none leading-[1.4] text-(--color-secondary)">
            <a href={`mailto:${profileData.email}`} className="text-inherit no-underline">
              {profileData.email}
            </a>
          </li>
          <li className="list-none leading-[1.4] text-(--color-secondary)">
            <a href={`tel:${formatPhoneHref(profileData.phone)}`} className="text-inherit no-underline">
              {profileData.phone}
            </a>
          </li>
          {location && (
            <li className="list-none leading-[1.4] text-(--color-secondary)">{location}</li>
          )}
          {profiles.map((profile) => (
            <li key={profile.url} className="list-none leading-[1.4] text-(--color-secondary)">
              <a href={profile.url} className="text-inherit no-underline">
                {formatProfileUrl(profile.url)}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ProfileSection;
