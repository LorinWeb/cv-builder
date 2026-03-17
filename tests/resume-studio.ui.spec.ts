import { expect, test, type Locator, type Page } from '@playwright/test';
import type { AddressInfo } from 'node:net';
import { createServer, type InlineConfig, type ViteDevServer } from 'vite';

import { createAppViteConfig } from '../vite.config';
import {
  createTempProjectRoot,
  destroyTempProjectRoot,
  writeProjectFile,
} from './support/temp-project';

function contentEditable(locator: Locator, index = 0) {
  return locator.locator('[contenteditable="true"]').nth(index);
}

async function replaceEditorText(editor: Locator, text: string) {
  await editor.click();
  await editor.press('Control+A');
  await editor.press('Backspace');
  await editor.type(text);
}

async function replaceEditorParagraphs(editor: Locator, paragraphs: string[]) {
  await editor.click();
  await editor.press('Control+A');
  await editor.press('Backspace');

  for (const [index, paragraph] of paragraphs.entries()) {
    await editor.type(paragraph);

    if (index < paragraphs.length - 1) {
      await editor.press('Enter');
    }
  }
}

function autosaveStatus(page: Page) {
  return page.getByTestId('resume-studio-autosave-status');
}

test.describe.serial('Resume Studio dev flow', () => {
  let server: ViteDevServer | null = null;
  let devServerPort: number;
  let projectRoot: string;

  test.beforeAll(async () => {
    projectRoot = createTempProjectRoot('resume-studio-ui-');
    writeProjectFile(
      projectRoot,
      'src/data/resume.sample.json',
      JSON.stringify(
        {
          basics: {
            label: 'Template Engineer',
            name: 'John Doe',
            summary: 'Template summary',
          },
        },
        null,
        2
      )
    );

    const config: InlineConfig = {
      ...createAppViteConfig({
        command: 'serve',
        dataProjectRoot: projectRoot,
        enableResumePdf: false,
        enableResumeStudio: true,
        mode: 'development',
      }),
      configFile: false,
    };
    config.server = {
      ...config.server,
      port: 0,
    };

    server = await createServer(config);
    await server.listen();
    const address = server.httpServer?.address();

    if (!address || typeof address === 'string') {
      throw new Error('Could not resolve the Resume Studio test server port.');
    }

    devServerPort = (address as AddressInfo).port;
  });

  test.afterAll(async () => {
    await server?.close();
    destroyTempProjectRoot(projectRoot);
  });

  test('renders an instant iframe preview, autosaves edits, and manages versions', async ({
    page,
  }) => {
    test.setTimeout(60000);

    await page.goto(`http://127.0.0.1:${devServerPort}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('resume-studio-launcher')).toHaveText('Create your resume', {
      timeout: 15000,
    });

    await page.getByTestId('resume-studio-launcher').click();
    await expect(page.getByTestId('resume-studio-dialog')).toBeVisible();
    const previewFrame = page.frameLocator('[data-testid="resume-studio-preview-frame"]');
    await expect(previewFrame.getByTestId('profile-title')).toHaveText('Your Name', {
      timeout: 15000,
    });
    await expect(previewFrame.getByTestId('resume-studio-launcher')).toHaveCount(0);
    const previewViewport = page.getByTestId('resume-studio-preview-viewport');
    const previewShell = page.getByTestId('resume-studio-preview-shell');
    const viewportBox = await previewViewport.boundingBox();
    const shellBox = await previewShell.boundingBox();

    expect(viewportBox).not.toBeNull();
    expect(shellBox).not.toBeNull();
    expect(shellBox!.x).toBeGreaterThan(viewportBox!.x + 8);
    expect(shellBox!.y).toBeGreaterThan(viewportBox!.y + 8);
    expect(shellBox!.x + shellBox!.width).toBeLessThan(
      viewportBox!.x + viewportBox!.width - 8
    );
    expect(shellBox!.y + shellBox!.height).toBeLessThan(
      viewportBox!.y + viewportBox!.height - 8
    );

    await page.getByTestId('resume-studio-photo-input').setInputFiles({
      buffer: Buffer.alloc(512 * 1024, 97),
      mimeType: 'image/png',
      name: 'portrait.png',
    });
    await expect(page.getByTestId('resume-studio-photo-preview')).toHaveAttribute(
      'src',
      /\/static\/private\//
    );
    await page.getByTestId('resume-studio-remove-photo').click();
    await expect(page.getByTestId('resume-studio-photo-preview')).toHaveCount(0);
    await expect(autosaveStatus(page)).toHaveText('Draft saved locally and published.');

    await page.getByTestId('resume-studio-field-basics-name').fill('Jane Template');
    await page.getByLabel('Title').fill('Staff Engineer');
    const basicsSummaryEditor = page.getByTestId('resume-studio-field-basics-summary');
    const basicsSummaryInput = contentEditable(basicsSummaryEditor);
    const basicsSummaryToolbar = basicsSummaryEditor.getByRole('toolbar');

    await expect(basicsSummaryToolbar).toBeHidden();

    await basicsSummaryInput.click();
    await expect(basicsSummaryToolbar).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Bold' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create link' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Bulleted list' })).toBeVisible();
    await replaceEditorParagraphs(basicsSummaryInput, [
      'Product-minded **engineering** leader.',
      '- Guides execution',
    ]);
    const previewSummaryBody = previewFrame
      .getByTestId('resume-section-summary')
      .getByTestId('section-body');
    await expect(previewFrame.getByTestId('profile-title')).toHaveText('Jane Template');
    await expect(previewFrame.getByTestId('profile-subtitle')).toHaveText('Staff Engineer');
    await expect(previewSummaryBody.locator('strong')).toHaveText('engineering');
    await expect(previewSummaryBody.locator('ul li')).toHaveText(['Guides execution']);
    await expect(autosaveStatus(page)).toHaveText('Local changes pending…');
    await expect(autosaveStatus(page)).toHaveText('Draft saved locally. Publish when ready.');

    await expect(page.getByTestId('profile-title')).toHaveText('Jane Template');
    await expect(page.getByTestId('profile-subtitle')).toHaveText('Staff Engineer');
    const liveSummaryBody = page
      .getByTestId('resume-section-summary')
      .getByTestId('section-body');
    await expect(liveSummaryBody.locator('h1, h2, h3, h4, h5, h6')).toHaveCount(0);
    await expect(liveSummaryBody.locator('strong')).toHaveText('engineering');
    await expect(liveSummaryBody.locator('ul li')).toHaveText(['Guides execution']);
    await expect(page.getByTestId('resume-studio-launcher')).toHaveText('Edit resume');

    await page.getByRole('button', { name: 'Experience' }).click();
    await page.getByRole('button', { name: 'Add role' }).click();
    const standaloneRole = page.getByTestId('resume-studio-work-role').last();
    await page.getByLabel('Company', { exact: true }).fill('Acme Systems');
    await page.getByRole('textbox', { name: 'Role' }).fill('Principal Engineer');
    await page.getByLabel('Start date', { exact: true }).fill('2024-01-01');
    await replaceEditorText(contentEditable(standaloneRole), 'Owned **platform** reliability.');
    await standaloneRole.getByRole('button', { name: 'Add highlight' }).click();
    await expect(standaloneRole.locator('[contenteditable="true"]')).toHaveCount(2);
    await replaceEditorText(
      contentEditable(standaloneRole, 1),
      'Shipped [design system](https://example.com).'
    );
    await expect(
      previewFrame.locator('[data-testid="work-experience-item"] strong')
    ).toHaveText('platform');
    await expect(
      previewFrame
        .getByTestId('work-experience-highlights')
        .getByRole('link', { name: 'design system' })
    ).toBeVisible();
    await expect(autosaveStatus(page)).toHaveText('Draft saved locally. Publish when ready.');
    await expect(page.locator('[data-testid="work-experience-item"] strong')).toHaveText(
      'platform'
    );

    await page.getByRole('button', { name: 'Add company progression' }).click();
    const progressionGroup = page.getByTestId('resume-studio-work-group').last();
    await progressionGroup.getByLabel('Company', { exact: true }).fill('Grouped Systems');
    await progressionGroup
      .getByLabel('Website', { exact: true })
      .fill('https://example.com/grouped-systems');
    const progressionRole = progressionGroup.getByTestId('resume-studio-work-group-role').first();
    await progressionRole.getByRole('textbox', { name: 'Role' }).fill('Platform Lead');
    await progressionRole.getByLabel('Start date', { exact: true }).fill('2022-01-01');
    await replaceEditorText(contentEditable(progressionRole), 'Led **platform** modernization.');
    await progressionRole.getByRole('button', { name: 'Add highlight' }).click();
    await expect(progressionRole.locator('[contenteditable="true"]')).toHaveCount(2);
    await replaceEditorText(
      contentEditable(progressionRole, 1),
      'Shipped [trading platform](https://example.com/platform).'
    );
    await expect(
      previewFrame.getByTestId('work-progression-group').getByText('@')
    ).toBeVisible();
    await expect(
      previewFrame.getByTestId('work-progression-group').getByText('Grouped Systems')
    ).toBeVisible();
    await expect(
      previewFrame.getByTestId('work-progression-group').locator('strong')
    ).toHaveText('platform');
    await expect(
      previewFrame
        .getByTestId('work-progression-group')
        .getByRole('link', { name: 'trading platform' })
    ).toBeVisible();
    await expect(autosaveStatus(page)).toHaveText('Draft saved locally. Publish when ready.');

    await progressionGroup.getByRole('button', { name: 'Add role to progression' }).click();
    await expect(progressionGroup.getByTestId('resume-studio-work-group-role')).toHaveCount(2);
    const secondProgressionRole = progressionGroup
      .getByTestId('resume-studio-work-group-role')
      .nth(1);
    await secondProgressionRole.getByRole('textbox', { name: 'Role' }).fill('Senior Engineer');
    await secondProgressionRole.getByRole('button', { name: 'Remove role' }).click();
    await expect(progressionGroup.getByTestId('resume-studio-work-group-role')).toHaveCount(1);
    await expect(autosaveStatus(page)).toHaveText('Draft saved locally. Publish when ready.');
    await expect(
      page.getByTestId('work-progression-group').getByText('Grouped Systems')
    ).toBeVisible();

    await page.getByRole('button', { name: 'Achievements' }).click();
    await page.getByRole('button', { name: 'Add achievement' }).click();
    const achievementsStep = page.getByTestId('resume-studio-dialog');

    await replaceEditorText(
      contentEditable(achievementsStep),
      'Built **internal platforms** and [tooling](https://example.com).'
    );
    const previewAchievement = previewFrame.getByTestId('achievement-item');
    await expect(previewAchievement.locator('strong')).toHaveText('internal platforms');
    await expect(previewAchievement.getByRole('link', { name: 'tooling' })).toBeVisible();
    const liveAchievement = page.getByTestId('achievement-item');
    await expect(liveAchievement.locator('strong')).toHaveText('internal platforms');
    await expect(liveAchievement.locator('a')).toBeVisible();

    await page.getByRole('button', { name: 'Skills' }).click();
    await page.getByRole('button', { name: 'Add skill category' }).click();
    await page.getByPlaceholder('Leadership and delivery').fill('Core strengths');
    await page.getByRole('button', { name: 'Add keyword' }).click();
    const keywordFields = page.locator(
      '[data-testid="resume-studio-dialog"] [contenteditable="true"]'
    );
    await replaceEditorText(keywordFields.first(), '**Architecture** leadership');
    await page.getByRole('button', { name: 'Add keyword' }).click();
    const multilineKeyword = keywordFields.nth(1);
    await replaceEditorText(multilineKeyword, 'Systems thinking');
    const singleLineKeywordHeight = await multilineKeyword.evaluate(
      (element) => element.clientHeight
    );
    await replaceEditorParagraphs(multilineKeyword, [
      'Systems thinking',
      'Coaching',
      'Delivery leadership',
    ]);
    await expect
      .poll(() => multilineKeyword.evaluate((element) => element.clientHeight))
      .toBeGreaterThan(singleLineKeywordHeight);
    await page.getByRole('button', { name: 'Remove keyword 2' }).click();
    await expect(keywordFields).toHaveCount(1);
    await expect(previewFrame.getByTestId('skill-category-item').locator('strong')).toHaveText(
      'Architecture'
    );
    await expect(page.getByTestId('skill-category-item').locator('strong')).toHaveText(
      'Architecture'
    );
    await expect(autosaveStatus(page)).toHaveText('Draft saved locally. Publish when ready.');

    await page.getByRole('button', { name: 'Education' }).click();
    await page.getByRole('button', { name: 'Add education entry' }).click();
    await page.getByLabel('Institution').fill('Example University');
    await page.getByLabel('Area').fill('Computer Science');
    await page.getByLabel('Study type').fill("Bachelor's degree");
    await page.getByLabel('Start date').fill('2014-09-01');
    await page.getByRole('button', { name: 'Add course' }).click();
    await replaceEditorText(
      contentEditable(page.getByTestId('resume-studio-dialog')),
      'Distributed systems'
    );
    await expect(autosaveStatus(page)).toHaveText('Draft saved locally. Publish when ready.');

    await page.getByTestId('resume-studio-see-versions').click();
    await expect(page.getByTestId('resume-studio-versions')).toContainText(
      'Primary resume'
    );
    const primaryVersionItem = page.getByTestId('resume-studio-version-item-1');

    await expect(primaryVersionItem).toContainText('Published');
    await expect(primaryVersionItem).toContainText('Editing');
    await expect(primaryVersionItem).toContainText('Unpublished changes');
    await page.getByTestId('resume-studio-version-name').fill('Staff CV');
    await page.getByTestId('resume-studio-create-version').click();
    await expect(
      page.getByText('Staff CV created and opened for editing.')
    ).toBeVisible();

    await page.getByRole('button', { name: 'Basics' }).click();
    await page.getByLabel('Title').fill('Principal Engineer');
    await expect(previewFrame.getByTestId('profile-subtitle')).toHaveText(
      'Principal Engineer'
    );
    await expect(autosaveStatus(page)).toHaveText('Draft saved locally. Publish when ready.');
    await expect(page.getByTestId('profile-subtitle')).toHaveText('Principal Engineer');

    await page.getByTestId('resume-studio-see-versions').click();
    await page
      .getByTestId('resume-studio-version-item-1')
      .getByRole('button', { name: 'Edit version' })
      .click();
    await expect(previewFrame.getByTestId('profile-subtitle')).toHaveText('Staff Engineer');
    await expect(page.getByTestId('profile-subtitle')).toHaveText('Staff Engineer');
    await expect(
      previewFrame.getByTestId('work-progression-group').getByText('Grouped Systems')
    ).toBeVisible();
    await page.getByTestId('resume-studio-see-versions').click();
    await expect(page.getByTestId('resume-studio-version-item-1')).toContainText('Published');
    await expect(page.getByTestId('resume-studio-version-item-1')).toContainText('Editing');
    await expect(page.getByTestId('resume-studio-version-item-1')).toContainText(
      'Unpublished changes'
    );

    await page
      .getByTestId('resume-studio-version-item-2')
      .getByRole('button', { name: 'Edit version' })
      .click();
    await expect(previewFrame.getByTestId('profile-subtitle')).toHaveText(
      'Principal Engineer'
    );
    await expect(page.getByTestId('profile-subtitle')).toHaveText('Principal Engineer');
    await expect(page.getByTestId('work-progression-group').getByText('Grouped Systems')).toBeVisible();
    await page.getByTestId('resume-studio-see-versions').click();
    await expect(page.getByTestId('resume-studio-version-item-1')).toContainText('Published');
    await expect(page.getByTestId('resume-studio-version-item-2')).toContainText('Editing');
    await expect(page.getByTestId('resume-studio-version-item-2')).toContainText(
      'Unpublished changes'
    );

    await page.getByTestId('resume-studio-back-to-edit').click();
    await page.getByTestId('resume-studio-publish').click();
    await expect(page.getByText('Staff CV published to src/data/resume.private.json.')).toBeVisible();
    await expect(autosaveStatus(page)).toHaveText('Draft saved locally and published.');

    await page.getByTestId('resume-studio-see-versions').click();
    await expect(
      page
        .getByTestId('resume-studio-version-item-2')
        .getByRole('button', { name: 'Delete' })
    ).toHaveCount(0);
    await expect(page.getByTestId('resume-studio-version-item-2')).toContainText('Published');
    await expect(page.getByTestId('resume-studio-version-item-2')).toContainText('Editing');
    await page
      .getByTestId('resume-studio-version-item-1')
      .getByRole('button', { name: 'Delete' })
      .click();
    await expect(page.getByText('Primary resume deleted.')).toBeVisible();
    await expect(page.getByTestId('resume-studio-version-item-1')).toHaveCount(0);
    await page.getByTestId('resume-studio-back-to-edit').click();
    await expect(page.getByTestId('profile-subtitle')).toHaveText('Principal Engineer');
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByTestId('profile-subtitle')).toHaveText('Principal Engineer');
  });

  test('closing without publish reverts the page, and publishing keeps the selected version live', async ({
    page,
  }) => {
    await page.goto(`http://127.0.0.1:${devServerPort}`);
    await page.waitForLoadState('networkidle');

    await page.getByTestId('resume-studio-launcher').click();
    await expect(page.getByTestId('resume-studio-dialog')).toBeVisible();
    const publishedSubtitle = await page.getByLabel('Title').inputValue();

    await expect(page.getByTestId('profile-subtitle')).toHaveText(publishedSubtitle);

    await page.getByLabel('Title').fill('Architect Engineer');
    await expect(autosaveStatus(page)).toHaveText('Draft saved locally. Publish when ready.');
    await expect(page.getByTestId('profile-subtitle')).toHaveText('Architect Engineer');

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByTestId('resume-studio-dialog')).toHaveCount(0);
    await expect(page.getByTestId('profile-subtitle')).toHaveText(publishedSubtitle!);

    await page.getByTestId('resume-studio-launcher').click();
    await expect(page.getByTestId('resume-studio-dialog')).toBeVisible();
    await expect(page.getByLabel('Title')).toHaveValue('Architect Engineer');

    await page.getByTestId('resume-studio-publish').click();
    await expect(
      page.getByText(/published to src\/data\/resume\.private\.json\.$/)
    ).toBeVisible();
    await expect(autosaveStatus(page)).toHaveText('Draft saved locally and published.');

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByTestId('resume-studio-dialog')).toHaveCount(0);
    await expect(page.getByTestId('profile-subtitle')).toHaveText('Architect Engineer');
  });
});
