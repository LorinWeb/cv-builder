import type {
  ResumeBasics,
  ResumeLocation,
  ResumeProfile,
  ResumeSourceBasics,
} from '../../data/types/resume';
import {
  RESUME_PDF_DOWNLOAD_HREF,
  RESUME_PDF_DOWNLOAD_LABEL,
} from './constants';
import type { PdfRenderTarget } from './types';

const CURRENT_RENDER_TARGET: PdfRenderTarget =
  typeof __RESUME_RENDER_TARGET__ === 'string' ? __RESUME_RENDER_TARGET__ : 'web';

const COUNTRY_LABELS = {
  UK: 'United Kingdom',
  US: 'United States',
} as const;

type ProfileContactItem = {
  href?: string;
  key: string;
  kind: 'email' | 'location' | 'phone' | 'profile';
  text: string;
};

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

function isSourceBasics(profileData: ResumeBasics | ResumeSourceBasics): profileData is ResumeSourceBasics {
  return 'email' in profileData || 'phone' in profileData;
}

export function getProfileContactItems(
  profileData: ResumeBasics | ResumeSourceBasics,
  target: PdfRenderTarget = CURRENT_RENDER_TARGET
) {
  const items: ProfileContactItem[] = [];

  if (target === 'pdf' && isSourceBasics(profileData)) {
    if (typeof profileData.email === 'string' && profileData.email.trim().length > 0) {
      items.push({
        href: `mailto:${profileData.email}`,
        key: 'email',
        kind: 'email',
        text: profileData.email,
      });
    }

    if (typeof profileData.phone === 'string' && profileData.phone.trim().length > 0) {
      items.push({
        href: `tel:${formatPhoneHref(profileData.phone)}`,
        key: 'phone',
        kind: 'phone',
        text: profileData.phone,
      });
    }
  }

  const location = formatLocation(profileData.location);

  if (location) {
    items.push({
      key: 'location',
      kind: 'location',
      text: location,
    });
  }

  for (const [index, profile] of (profileData.profiles || []).entries()) {
    items.push({
      href: profile.url,
      key: `profile-${index}`,
      kind: 'profile',
      text: formatProfileUrl(profile.url),
    });
  }

  return items;
}

export function usePdfDownload(target: PdfRenderTarget = CURRENT_RENDER_TARGET) {
  return {
    href: RESUME_PDF_DOWNLOAD_HREF,
    isAvailable: true,
    isPdfRenderTarget: target === 'pdf',
    label: RESUME_PDF_DOWNLOAD_LABEL,
  };
}
