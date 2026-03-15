import { useLayoutEffect, useState } from 'react';

import Page from './Layout/Page';
import type { StickyConfig } from './Layout/sticky';
import AchievementItem from './ItemRenderers/AchievementItem';
import { AmbientDesignLayer } from './AmbientDesignLayer';
import EducationEntryItem from './ItemRenderers/EducationEntryItem';
import EducationNoteItem from './ItemRenderers/EducationNoteItem';
import SkillCategoryItem from './ItemRenderers/SkillCategoryItem';
import WorkExperienceItem from './ItemRenderers/WorkExperienceItem';
import ProfileSection from './ProfileSection';
import ResumeSection from './ResumeSection';
import { getPrintClassNames, joinClassNames } from '../helpers/print';
import type { ResumeData, ResumeWorkItem } from '../data/types/resume';

interface AppProps {
  data: ResumeData;
}

function useObservedElementHeight<TElement extends HTMLElement>() {
  const [element, setElement] = useState<TElement | null>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    if (!element) {
      setHeight(0);
      return;
    }

    const updateHeight = () => {
      const nextHeight = element.getBoundingClientRect().height;

      setHeight((currentHeight) =>
        currentHeight === nextHeight ? currentHeight : nextHeight
      );
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(element);

    const handleResize = () => {
      updateHeight();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [element]);

  return {
    height,
    ref: setElement as (element: TElement | null) => void,
  };
}

function App({ data }: AppProps) {
  const profileData = data.basics;
  const workData = data.work || [];
  const skillsData = data.skills || [];
  const educationData = data.education || [];
  const educationNoteData = data.educationNote;
  const impactData = profileData.impact || [];
  const { height: headerHeight, ref: headerRef } =
    useObservedElementHeight<HTMLElement>();
  const hasSideColumn =
    skillsData.length > 0 || educationData.length > 0 || !!educationNoteData;
  const titleSticky: StickyConfig = {
    offset: headerHeight,
    position: 'top',
  };

  return (
    <>
      <AmbientDesignLayer />

      <Page data-testid="app">
        <Page.Header ref={headerRef} sticky>
          <ProfileSection profileData={profileData} />
        </Page.Header>

        <Page.Body>
          <Page.MainContent>
            <ResumeSection title="Professional Summary" titleSticky={titleSticky}>
              {profileData.summary}
            </ResumeSection>

            {impactData.length > 0 && (
              <ResumeSection
                items={impactData}
                title="Selected Achievements"
                titleSticky={titleSticky}
              >
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
              <ResumeSection<ResumeWorkItem>
                items={workData}
                title="Professional Experience"
                titleSticky={titleSticky}
              >
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
              {skillsData.length > 0 && (
                <ResumeSection
                  className="text-left"
                  items={skillsData}
                  title="Skills"
                  titleSticky={titleSticky}
                >
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

              {(educationData.length > 0 || educationNoteData) && (
                <ResumeSection
                  items={educationData}
                  title="Education"
                  titleSticky={titleSticky}
                >
                  {({ getItemClassName, items }) => (
                    <>
                      {items.map((item, index) => (
                        <EducationEntryItem
                          key={`${item.institution}-${item.startDate}-${index}`}
                          item={item}
                          className={getItemClassName(item, index)}
                        />
                      ))}
                      {educationNoteData ? (
                        <EducationNoteItem
                          item={educationNoteData}
                          className={joinClassNames(
                            'mt-5',
                            getPrintClassNames(educationNoteData)
                          )}
                        />
                      ) : null}
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
