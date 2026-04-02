import Page from './Layout/Page';
import EducationEntryItem from './ItemRenderers/EducationEntryItem';
import AchievementItem from './ItemRenderers/AchievementItem';
import SkillCategoryItem from './ItemRenderers/SkillCategoryItem';
import WorkExperienceItem from './ItemRenderers/WorkExperienceItem';
import ProfileSection from './ProfileSection';
import ResumeSection from './ResumeSection';
import { joinClassNames } from '../helpers/classNames';
import { ResumeMarkdown } from '../helpers/resume-markdown';
import useElementVisibility from '../hooks/useElementVisibility';
import useMediaQuery from '../hooks/useMediaQuery';
import { toAtsPdfResumeData } from '../features/pdf-download/presentation';
import type { ResumeRuntimeData, ResumeWorkItem } from '../data/types/resume';

const IS_PDF_RENDER_TARGET = __RESUME_RENDER_TARGET__ === 'pdf';

interface StructuredResumeProps {
  data: ResumeRuntimeData;
}

export function StructuredResume({ data }: StructuredResumeProps) {
  const presentationData = IS_PDF_RENDER_TARGET ? toAtsPdfResumeData(data) : data;
  const profileData = presentationData.basics;
  const profilePhoto = profileData.photo;
  const workData = presentationData.work || [];
  const skillsData = presentationData.skills || [];
  const educationData = presentationData.education || [];
  const impactData = profileData.impact || [];
  const summary = profileData.summary;
  const isBelowSmallViewport = useMediaQuery('(max-width: 640px)');
  const { isVisible: isStandalonePhotoVisible, ref: standalonePhotoRef } =
    useElementVisibility<HTMLImageElement>();
  const shouldRenderSummaryAsFirstSection =
    !!summary &&
    (IS_PDF_RENDER_TARGET || profileData.summaryAlwaysFirstSection || isBelowSmallViewport);
  const shouldRenderSummaryInSidebar =
    !!summary && !IS_PDF_RENDER_TARGET && !shouldRenderSummaryAsFirstSection;
  const hasSideColumn =
    !IS_PDF_RENDER_TARGET &&
    (shouldRenderSummaryInSidebar || skillsData.length > 0 || educationData.length > 0);
  const showDateDurations = !IS_PDF_RENDER_TARGET;

  function renderSummarySection() {
    if (!summary) {
      return null;
    }

    return (
      <ResumeSection title="Summary">
        <ResumeMarkdown markdown={summary} mode="block" />
      </ResumeSection>
    );
  }

  function renderAchievementsSection() {
    if (impactData.length === 0) {
      return null;
    }

    return (
      <ResumeSection items={impactData} title="Selected Achievements">
        {({ getItemClassName, items }) => (
          <ul className="mt-2 list-square pl-5 text-[1em] font-light">
            {items.map((item, index) => (
              <AchievementItem
                key={index}
                item={item}
                className={getItemClassName(item, index)}
              />
            ))}
          </ul>
        )}
      </ResumeSection>
    );
  }

  function renderWorkSection() {
    if (workData.length === 0) {
      return null;
    }

    return (
      <ResumeSection<ResumeWorkItem> items={workData} title="Professional Experience">
        {({ getItemClassName, items }) => (
          <>
            {items.map((item, index) => (
              <WorkExperienceItem
                key={index}
                item={item}
                className={getItemClassName(item, index)}
                showDuration={showDateDurations}
              />
            ))}
          </>
        )}
      </ResumeSection>
    );
  }

  function renderSkillsSection(className?: string) {
    if (skillsData.length === 0) {
      return null;
    }

    return (
      <ResumeSection className={className} items={skillsData} title="Skills">
        {({ getItemClassName, items }) => (
          <>
            {items.map((item, index) => (
              <SkillCategoryItem
                key={`${item.name}-${index}`}
                item={item}
                className={getItemClassName(item, index)}
              />
            ))}
          </>
        )}
      </ResumeSection>
    );
  }

  function renderEducationSection() {
    if (educationData.length === 0) {
      return null;
    }

    return (
      <ResumeSection items={educationData} title="Education">
        {({ getItemClassName, items }) => (
          <>
            {items.map((item, index) => (
              <EducationEntryItem
                key={`${item.institution}-${item.startDate}-${index}`}
                item={item}
                className={getItemClassName(item, index)}
                showDuration={showDateDurations}
              />
            ))}
          </>
        )}
      </ResumeSection>
    );
  }

  return (
    <>
      {profilePhoto ? (
        <div
          data-testid="profile-photo-standalone-frame"
          className="relative z-10 mx-auto my-12.5 flex w-[210mm] max-w-[calc(100%-32px)] justify-center px-[10mm] print:hidden"
        >
          <img
            ref={standalonePhotoRef}
            data-testid="profile-photo-standalone"
            data-visible={String(isStandalonePhotoVisible)}
            src={profilePhoto.src}
            alt={profilePhoto.alt ?? `${profileData.name} profile photo`}
            className={joinClassNames(
              'block h-44 w-44 rounded-full border border-(--color-border-photo) object-cover object-center shadow-[0_16px_32px_-24px_rgba(34,34,34,0.5)] transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
              isStandalonePhotoVisible
                ? 'scale-100 opacity-100 blur-0'
                : 'scale-95 opacity-0 blur-[2px]'
            )}
          />
        </div>
      ) : null}

      <Page data-testid="app">
        <Page.Header sticky>
          <ProfileSection profileData={profileData} />
        </Page.Header>

        <Page.Body>
          <Page.MainContent>
            {IS_PDF_RENDER_TARGET ? (
              <>
                {renderSummarySection()}
                {renderWorkSection()}
                {renderAchievementsSection()}
                {renderSkillsSection()}
                {renderEducationSection()}
              </>
            ) : (
              <>
                {shouldRenderSummaryAsFirstSection ? renderSummarySection() : null}
                {renderAchievementsSection()}
                {renderWorkSection()}
              </>
            )}
          </Page.MainContent>

          {!IS_PDF_RENDER_TARGET && hasSideColumn ? (
            <Page.Sidebar placement="right">
              {shouldRenderSummaryInSidebar ? renderSummarySection() : null}
              {renderSkillsSection('text-left')}
              {renderEducationSection()}
            </Page.Sidebar>
          ) : null}
        </Page.Body>
      </Page>
    </>
  );
}
