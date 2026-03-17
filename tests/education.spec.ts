import { expect, test } from '@playwright/test';

test('renders education courses when they are present', async ({ page }) => {
  await page.goto('/');

  const educationEntry = page.getByTestId('education-entry-item').first();

  await expect(educationEntry.getByTestId('education-courses')).toBeVisible();
  await expect(educationEntry.getByTestId('education-course-item')).toHaveText([
    'Algorithms, data structures, and software engineering fundamentals',
  ]);
});
