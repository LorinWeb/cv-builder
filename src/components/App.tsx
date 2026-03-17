import Page from './Layout/Page';
import { AmbientDesignLayer } from './AmbientDesignLayer';
import EducationEntryItem from './ItemRenderers/EducationEntryItem';
import AchievementItem from './ItemRenderers/AchievementItem';
import SkillCategoryItem from './ItemRenderers/SkillCategoryItem';
import WorkExperienceItem from './ItemRenderers/WorkExperienceItem';
import ProfileSection from './ProfileSection';
import ResumeSection from './ResumeSection';
import { joinClassNames } from '../helpers/classNames';
import { ResumeMarkdown } from '../helpers/resume-markdown';
import { ResumeStudioLauncher } from '../features/resume-studio';
import useElementVisibility from '../hooks/useElementVisibility';
import type { ResumeRuntimeData, ResumeWorkItem } from '../data/types/resume';

interface AppProps {
  data: ResumeRuntimeData;
  isResumeStudioPreview?: boolean;
}

function App({ data, isResumeStudioPreview = false }: AppProps) {
  const profileData = data.basics;
  const profilePhoto = profileData.photo;
  const workData = data.work || [];
  const skillsData = data.skills || [];
  const educationData = data.education || [];
  const impactData = profileData.impact || [];
  const summary = profileData.summary;
  const { isVisible: isStandalonePhotoVisible, ref: standalonePhotoRef } =
    useElementVisibility<HTMLImageElement>();
  const hasSideColumn =
    !!summary || skillsData.length > 0 || educationData.length > 0;

  return (
    <>
      {!isResumeStudioPreview ? <AmbientDesignLayer /> : null}
      {!isResumeStudioPreview ? <ResumeStudioLauncher /> : null}

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
              'block h-44 w-44 rounded-full border border-[rgba(137,186,182,0.45)] object-cover object-center shadow-[0_16px_32px_-24px_rgba(34,34,34,0.5)] transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
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

            {impactData.length > 0 && (
              <ResumeSection items={impactData} title="Selected Achievements">
                {({ getItemClassName, items }) => (
                  <ul className="mt-2 list-square pl-5 text-[1em] font-light leading-[1.35]">
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
            )}

            {workData.length > 0 && (
              <ResumeSection<ResumeWorkItem> items={workData} title="Professional Experience">
                {({ getItemClassName, items }) => (
                  <>
                    {items.map((item, index) => (
                      <WorkExperienceItem
                        key={index}
                        item={item}
                        className={getItemClassName(item, index)}
                      />
                    ))}
                  </>
                )}
              </ResumeSection>
            )}
          </Page.MainContent>

          {hasSideColumn && (
            <Page.Sidebar placement="right">
              {summary ? (
                <ResumeSection title="Summary">
                  <ResumeMarkdown markdown={summary} mode="block" />
                </ResumeSection>
              ) : null}

              {skillsData.length > 0 && (
                <ResumeSection className="text-left" items={skillsData} title="Skills">
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
              )}

              {educationData.length > 0 && (
                <ResumeSection items={educationData} title="Education">
                  {({ getItemClassName, items }) => (
                    <>
                      {items.map((item, index) => (
                        <EducationEntryItem
                          key={`${item.institution}-${item.startDate}-${index}`}
                          item={item}
                          className={getItemClassName(item, index)}
                        />
                      ))}
                    </>
                  )}
                </ResumeSection>
              )}
            </Page.Sidebar>
          )}
        </Page.Body>
      </Page>
    </>
  );
}

export default App;
