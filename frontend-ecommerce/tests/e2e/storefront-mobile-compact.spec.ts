import { expect, test } from '@playwright/test'

test.describe('Storefront compact UI', () => {
  test('shows compact product cards in mobile category sections', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Este escenario aplica solo a mobile.')

    await page.goto('/')

    await expect(page.getByText(/producto\(s\) disponibles/i)).toBeVisible()
    await expect(page.getByTestId('category-mobile-grid').first()).toBeVisible()

    const compactCards = page.getByTestId('product-card-compact')
    await expect(compactCards.first()).toBeVisible()
    const compactCardCount = await compactCards.count()
    expect(compactCardCount).toBeGreaterThanOrEqual(3)

    const firstCardBox = await compactCards.first().boundingBox()
    expect(firstCardBox).not.toBeNull()
    expect(firstCardBox!.height).toBeLessThan(200)

    const firstCardTop = await compactCards.first().evaluate(
      (element) => element.getBoundingClientRect().top + window.scrollY,
    )
    await page.evaluate((targetY) => {
      window.scrollTo(0, Math.max(0, targetY - 120))
    }, firstCardTop)

    await page.screenshot({
      path: 'test-results/storefront-mobile-midpoint-target.png',
      fullPage: false,
    })

    await expect(page.getByRole('link', { name: /^ver$/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /ver detalle/i })).toHaveCount(0)

    await page.screenshot({
      path: 'test-results/storefront-mobile-compact.png',
      fullPage: true,
    })
  })

  test('compares card layout between mobile and desktop', async ({ page, isMobile }, testInfo) => {
    await page.goto('/')

    const visibleCompactCards = page.locator('[data-testid="product-card-compact"]:visible')
    const visibleDefaultCards = page.locator('[data-testid="product-card-default"]:visible')

    if (isMobile) {
      await expect(visibleCompactCards.first()).toBeVisible()
      await expect(visibleDefaultCards).toHaveCount(0)
      await expect(page.getByRole('link', { name: /^ver$/i }).first()).toBeVisible()
      await expect(page.getByRole('link', { name: /ver detalle/i })).toHaveCount(0)

      const compactBox = await visibleCompactCards.first().boundingBox()
      expect(compactBox).not.toBeNull()
      expect(compactBox!.height).toBeLessThan(200)
    } else {
      await expect(visibleDefaultCards.first()).toBeVisible()
      await expect(visibleCompactCards).toHaveCount(0)
      await expect(page.getByRole('link', { name: /ver detalle/i }).first()).toBeVisible()
      await expect(page.getByRole('link', { name: /^ver$/i })).toHaveCount(0)

      const defaultBox = await visibleDefaultCards.first().boundingBox()
      expect(defaultBox).not.toBeNull()
      expect(defaultBox!.height).toBeGreaterThan(260)
    }

    await page.screenshot({
      path: `test-results/storefront-layout-${testInfo.project.name}.png`,
      fullPage: true,
    })
  })
})
