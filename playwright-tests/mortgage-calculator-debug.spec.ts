import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Mortgage Calculator - Expression Debugging', () => {
  test.beforeEach(async ({ page }) => {
    // Load the mortgage calculator form JSON
    const formPath = path.join(__dirname, '../public/mortgage-calculator.json');
    const formJson = JSON.parse(readFileSync(formPath, 'utf-8'));
    
    await page.goto('http://localhost:4200');
    
    // Wait for the app to load
    await page.waitForLoadState('domcontentloaded');
    
    // Set form JSON directly via app store or localStorage
    await page.evaluate((json) => {
      // Try multiple methods to set the form
      try {
        // Method 1: Set in localStorage (if app reads from there)
        localStorage.setItem('formJson', JSON.stringify(json));
        localStorage.setItem('generatedJson', JSON.stringify(json));
        
        // Method 2: Try to access app store directly (if exposed)
        if ((window as any).__APP_STORE__) {
          (window as any).__APP_STORE__.getState().setGeneratedJson(JSON.stringify(json), json);
        }
        
        // Method 3: Trigger custom event
        const event = new CustomEvent('importForm', { detail: json });
        window.dispatchEvent(event);
      } catch (e) {
        console.error('Error setting form:', e);
      }
    }, formJson);
    
    // Wait a bit for state to update
    await page.waitForTimeout(1000);
    
    // Try clicking import button if form didn't load
    const hasFormFields = await page.locator('input[id*="fullName"], input[id*="annualIncome"]').first().isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!hasFormFields) {
      // Try to open import modal
      const importButton = page.locator('button:has-text("Import"), button:has-text("Load JSON"), button[aria-label*="Import"]').first();
      if (await importButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await importButton.click();
        await page.waitForTimeout(500);
        
        // Fill textarea and submit
        const textarea = page.locator('textarea, textarea[placeholder*="JSON"]').first();
        if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) {
          await textarea.fill(JSON.stringify(formJson, null, 2));
          await page.waitForTimeout(300);
          
          // Click submit button - use force if dialog is blocking
          const submitButton = page.locator('button:has-text("Import"), button:has-text("Load"), button[type="submit"]').first();
          await submitButton.click({ force: true });
          await page.waitForTimeout(1000);
        }
      }
    }
    
    // Wait for form fields to appear
    await page.waitForSelector('input[id*="fullName"], input[id*="annualIncome"]', { timeout: 10000 });
  });

  test('should display calculated values when inputs are filled', async ({ page }) => {
    // Fill in the input fields one by one and wait for calculations
    console.log('Filling form fields...');
    
    await page.fill('input[id*="fullName"]', 'John Doe');
    await page.fill('input[id*="email"]', 'john@example.com');
    
    // Fill annual income and wait
    await page.fill('input[id*="annualIncome"]', '100000');
    await page.waitForTimeout(200);
    
    // Fill other income and wait
    await page.fill('input[id*="otherIncome"]', '10000');
    await page.waitForTimeout(200);
    
    // Fill monthly debt payments
    await page.fill('input[id*="monthlyDebtPayments"]', '500');
    await page.waitForTimeout(200);
    
    // Fill down payment
    await page.fill('input[id*="downPayment"]', '20000');
    await page.waitForTimeout(200);
    
    // Fill interest rate
    await page.fill('input[id*="interestRate"]', '3.5');
    await page.waitForTimeout(200);
    
    // Select loan term
    const selectLocator = page.locator('select[id*="loanTermYears"]').first();
    if (await selectLocator.isVisible({ timeout: 2000 }).catch(() => false)) {
      await selectLocator.selectOption('30');
      await page.waitForTimeout(200);
    }
    
    // Fill property tax
    await page.fill('input[id*="propertyTaxAnnual"]', '3000');
    await page.waitForTimeout(200);
    
    // Fill home insurance
    await page.fill('input[id*="homeInsuranceAnnual"]', '1200');
    await page.waitForTimeout(200);
    
    // Fill HOA
    await page.fill('input[id*="hoaAnnual"]', '0');
    
    // Wait for all expressions to evaluate (with debounce)
    await page.waitForTimeout(1000);
    
    // Check calculated values and log them
    const monthlyGrossIncomeInput = page.locator('input[id*="monthlyGrossIncome"]').first();
    const monthlyGrossIncome = await monthlyGrossIncomeInput.inputValue().catch(() => '');
    console.log('📊 Monthly Gross Income:', monthlyGrossIncome);
    
    const maxMonthlyPaymentInput = page.locator('input[id*="maxMonthlyPayment"]').first();
    const maxMonthlyPayment = await maxMonthlyPaymentInput.inputValue().catch(() => '');
    console.log('📊 Max Monthly Payment:', maxMonthlyPayment);
    
    const monthlyInterestRateInput = page.locator('input[id*="monthlyInterestRate"]').first();
    const monthlyInterestRate = await monthlyInterestRateInput.inputValue().catch(() => '');
    console.log('📊 Monthly Interest Rate:', monthlyInterestRate);
    
    const numberOfPaymentsInput = page.locator('input[id*="numberOfPayments"]').first();
    const numberOfPayments = await numberOfPaymentsInput.inputValue().catch(() => '');
    console.log('📊 Number of Payments:', numberOfPayments);
    
    const maxMortgageInput = page.locator('input[id*="maxMortgage"]').first();
    const maxMortgage = await maxMortgageInput.inputValue().catch(() => '');
    console.log('📊 Max Mortgage:', maxMortgage);
    
    const estimatedPropertyValueInput = page.locator('input[id*="estimatedPropertyValue"]').first();
    const estimatedPropertyValue = await estimatedPropertyValueInput.inputValue().catch(() => '');
    console.log('📊 Estimated Property Value:', estimatedPropertyValue);
    
    // Take screenshots for debugging
    await page.screenshot({ path: 'test-results/mortgage-calculator-filled.png', fullPage: true });
    
    // Log page HTML for debugging if values are empty
    if (!monthlyGrossIncome || monthlyGrossIncome === '') {
      const html = await page.content();
      console.log('Page HTML snippet (searching for monthlyGrossIncome):', html.substring(0, 5000));
    }
    
    // Assert that calculated values are not empty (they should have values)
    expect(monthlyGrossIncome).not.toBe('');
    expect(monthlyGrossIncome).not.toBe('0');
    expect(maxMonthlyPayment).not.toBe('');
    expect(monthlyInterestRate).not.toBe('');
    expect(numberOfPayments).not.toBe('');
  });

  test('should update calculated values when dependencies change', async ({ page }) => {
    // Fill initial values
    await page.fill('input[id*="annualIncome"]', '100000');
    await page.fill('input[id*="otherIncome"]', '10000');
    
    // Wait for calculation
    await page.waitForTimeout(300);
    
    // Get initial calculated value
    const initialMonthlyGross = await page.inputValue('input[id*="monthlyGrossIncome"]');
    console.log('Initial Monthly Gross Income:', initialMonthlyGross);
    
    // Change annual income
    await page.fill('input[id*="annualIncome"]', '150000');
    
    // Wait for recalculation
    await page.waitForTimeout(300);
    
    // Get updated calculated value
    const updatedMonthlyGross = await page.inputValue('input[id*="monthlyGrossIncome"]');
    console.log('Updated Monthly Gross Income:', updatedMonthlyGross);
    
    // Should be different
    expect(updatedMonthlyGross).not.toBe(initialMonthlyGross);
    
    await page.screenshot({ path: 'test-results/mortgage-calculator-updated.png', fullPage: true });
  });

  test('should handle expression evaluation errors gracefully', async ({ page }) => {
    // Fill with invalid values that might cause calculation issues
    await page.fill('input[id*="annualIncome"]', 'abc'); // Invalid number
    await page.fill('input[id*="interestRate"]', '0'); // Zero interest rate
    
    // Wait for evaluation
    await page.waitForTimeout(300);
    
    // Check that form doesn't crash
    const pageContent = await page.content();
    expect(pageContent).toContain('Mortgage Calculator');
    
    await page.screenshot({ path: 'test-results/mortgage-calculator-error-handling.png', fullPage: true });
  });
});

