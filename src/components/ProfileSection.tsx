import type { ComponentPropsWithoutRef } from 'react';

import { joinClassNames } from '../helpers/print';
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

function ProfileSection({ profileData, className, ...props }: ProfileSectionProps) {
  const profiles = profileData.profiles || [];
  const location = formatLocation(profileData.location);
  const photo = profileData.photo;

  return (
    <div
      data-testid="profile-section"
      className={joinClassNames(
        'mb-0 flex flex-col items-center gap-4.5 border-b border-b-(--color-header-border) pb-4.5',
        className
      )}
      {...props}
    >
      {photo ? (
        <img
          data-testid="profile-photo"
          src={photo.src}
          alt={photo.alt ?? `${profileData.name} profile photo`}
          className="block h-39 w-29 rounded-[18px] border border-[rgba(137,186,182,0.45)] object-cover object-center shadow-[0_16px_32px_-24px_rgba(34,34,34,0.5)]"
        />
      ) : null}

      <div className="min-w-0 w-full">
        <h1
          className="text-(--color-primary)"
          style={{ lineHeight: 1.2, marginBottom: '6px' }}
        >
          {profileData.name}
        </h1>
        <p className="m-0 text-[1.1rem] leading-normal text-(--color-secondary)">
          {profileData.label}
        </p>
        <ul className="m-0 mt-3.5 flex list-none flex-wrap justify-between gap-x-4.5 gap-y-2 pl-0 text-[0.8em]">
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
