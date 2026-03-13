import Page from './Layout/Page';
import AchievementItem from './ItemRenderers/AchievementItem';
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

function App({ data }: AppProps) {
  const profileData = data.basics;
  const workData = data.work || [];
  const skillsData = data.skills || [];
  const educationData = data.education || [];
  const educationNoteData = data.educationNote;
  const impactData = profileData.impact || [];
  const hasSideColumn =
    skillsData.length > 0 || educationData.length > 0 || !!educationNoteData;

  return (
    <Page data-testid="app">
      <Page.Header>
        <ProfileSection profileData={profileData} />
      </Page.Header>

      <Page.Body>
        <Page.MainContent>
          <ResumeSection title="Professional Summary">
            {profileData.summary}
          </ResumeSection>

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
            <ResumeSection<ResumeWorkItem>
              items={workData}
              title="Professional Experience"
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
  );
}

export default App;
