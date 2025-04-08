import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('Live Q&amp;A Session Flow', () => {
  let presenterPage: Page;
  let sessionCode: string;
  let participantContext: BrowserContext;
  let participantPage: Page;

  test.beforeAll(async ({ browser }) => {
    // Create a page for the presenter
    presenterPage = await browser.newPage();
    await presenterPage.goto('/');

    // --- Create Session ---
    await presenterPage.click('text=Create Session');
    // Use getByLabel to find the input and fill it (auto-waits)
    await presenterPage.getByLabel('Your Name').fill('E2E Test Session');
    await presenterPage.click('button:has-text("Create")');

    // Wait for the presenter view to load by waiting for the session code element
    // Use getByText to find the element containing the session code
    const sessionCodeElement = presenterPage.getByText(/Session Code:/);
    await sessionCodeElement.waitFor({ state: 'visible' }); // Wait for the element

    // Extract the session code (which is the session.url property)
    const fullText = await sessionCodeElement.innerText(); // e.g., "Session Code: ABCDEF"
    sessionCode = fullText.split(': ')[1]; // Extract the code part
    expect(sessionCode).toMatch(/^[A-Za-z0-9]{6}$/); // Allow lowercase letters
    console.log(`Created session with code: ${sessionCode}`);

    // Create a new browser context for the participant
    participantContext = await browser.newContext();
    participantPage = await participantContext.newPage();
  });

  test.afterAll(async () => {
    await presenterPage.close();
    await participantPage.close();
    await participantContext.close(); // Close the participant's context
  });

  test('Participant joins, asks a question, and upvotes it', async () => {
    // --- Join Session as Participant ---
    await participantPage.goto('/');
    await participantPage.click('text=Join Session');
    // Use getByLabel for input fields (auto-waits)
    await participantPage.getByLabel('Session Code').fill(sessionCode);
    await participantPage.getByLabel('Your Name').fill('E2E Participant');
    await participantPage.click('button:has-text("Join")');

    // Wait for navigation to participant view by waiting for the AppBar title
    const appBarTitleLocator = participantPage.getByText('Q&A Session'); // Use getByText based on actual HTML
    await expect(appBarTitleLocator).toBeVisible(); // Wait for the AppBar title to be visible

    // --- Ask a Question ---
    const questionText = 'This is an E2E test question?';
    const participantName = 'E2E Participant';

    // Fill in name and question on the participant page
    await participantPage.getByLabel('Your Name').fill(participantName); // Fill name on this page too
    await participantPage.getByLabel('Your Question').fill(questionText);
    await participantPage.click('button:has-text("Submit Question")'); // Correct button text

    // Verify the question appears in the list for the participant
    // Target the Paper element *within the list* containing the question text
    const questionLocator = participantPage.locator('ul').locator('div.MuiPaper-root', { hasText: questionText });
    // Wait longer for the question to appear via WebSocket
    await expect(questionLocator).toBeVisible({ timeout: 15000 });

    // Verify the question appears for the presenter as well
    // Target the Paper element *within the list* containing the question text
    const presenterQuestionLocator = presenterPage.locator('ul').locator('div.MuiPaper-root', { hasText: questionText });
    // Wait longer for the question to appear via WebSocket
    await expect(presenterQuestionLocator).toBeVisible({ timeout: 15000 });


    // --- Upvote the Question ---
    // Find the upvote button (first IconButton within the question's Paper element)
    const upvoteButton = questionLocator.locator('button').first(); // Assuming ThumbUp is the first button
    await upvoteButton.click();

    // Verify the vote count increases for the participant (find the Typography next to the first button)
    const participantVoteCount = questionLocator.locator('button').first().locator('xpath=following-sibling::*[1]'); // Find element next to upvote button
    await expect(participantVoteCount).toHaveText('1');

    // Verify the vote count increases for the presenter (find the Chip with ThumbUpIcon)
    const presenterVoteChip = presenterQuestionLocator.locator('div.MuiChip-root:has(svg[data-testid="ThumbUpIcon"])');
    // Check the label within the Chip (which is inside a span)
    await expect(presenterVoteChip.locator('span.MuiChip-label')).toHaveText('1');

  });
});