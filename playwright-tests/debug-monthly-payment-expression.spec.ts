import { test, expect } from '@playwright/test';

test.describe('Monthly Payment Expression Debugging', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // Look for the Import JSON button
    const importButton = page.locator('button:has-text("Import JSON")').first();
    await expect(importButton).toBeVisible();
    
    // Click the Import JSON button
    await importButton.click();
    
    // Wait for the modal to appear
    await page.waitForSelector('textarea', { timeout: 5000 });
    
    // Load the mortgage calculator JSON from the user's query
    const formJson = {
      "app": {
        "title": "Hypotheek Berekenaar",
        "pages": [
          {
            "id": "calculator",
            "title": "Hypotheek Calculator",
            "route": "/",
            "layout": "horizontal",
            "components": [
              {
                "id": "formColumn",
                "type": "section",
                "label": "Invoer",
                "props": {
                  "className": "w-1/2 pr-4"
                },
                "children": [
                  {
                    "id": "personalInfo",
                    "type": "form",
                    "label": "Persoonlijke en financiële gegevens",
                    "children": [
                      {
                        "id": "annualIncome",
                        "type": "input",
                        "label": "Jaarinkomen (bruto, €)",
                        "props": {
                          "inputType": "number",
                          "placeholder": "Bijv. 45000"
                        },
                        "validation": {
                          "required": true
                        }
                      },
                      {
                        "id": "monthlyNetDebt",
                        "type": "input",
                        "label": "Maandelijkse netto schulden (€)",
                        "props": {
                          "inputType": "number",
                          "placeholder": "Bijv. 200"
                        },
                        "validation": {
                          "required": true
                        }
                      },
                      {
                        "id": "interestRate",
                        "type": "input",
                        "label": "Rente (%)",
                        "props": {
                          "inputType": "number",
                          "placeholder": "Bijv. 3.5"
                        },
                        "validation": {
                          "required": true
                        }
                      },
                      {
                        "id": "termYears",
                        "type": "input",
                        "label": "Looptijd (jaar)",
                        "props": {
                          "inputType": "number",
                          "placeholder": "Bijv. 30"
                        },
                        "validation": {
                          "required": true
                        }
                      },
                      {
                        "id": "downPayment",
                        "type": "input",
                        "label": "Aanbetaling (€)",
                        "props": {
                          "inputType": "number",
                          "placeholder": "Bijv. 20000"
                        },
                        "validation": {
                          "required": true
                        }
                      }
                    ]
                  }
                ]
              },
              {
                "id": "resultColumn",
                "type": "section",
                "label": "Resultaat",
                "props": {
                  "className": "w-1/2 pl-4"
                },
                "children": [
                  {
                    "id": "maxMortgage",
                    "type": "input",
                    "label": "Maximale hypotheek (€)",
                    "props": {
                      "inputType": "number",
                      "readOnly": true,
                      "expression": {
                        "expression": "round((annualIncome.value/12 - monthlyNetDebt.value) * 12 * termYears.value * 0.28)",
                        "mode": "value",
                        "dependencies": [
                          "annualIncome",
                          "monthlyNetDebt",
                          "termYears"
                        ],
                        "evaluateOnChange": true,
                        "debounceMs": 100
                      }
                    }
                  },
                  {
                    "id": "monthlyPayment",
                    "type": "input",
                    "label": "Geschatte maandelijkse betaling (€)",
                    "props": {
                      "inputType": "number",
                      "readOnly": true,
                      "expression": {
                        "expression": "round((maxMortgage.value * (interestRate.value/100/12) ) / (1 - pow(1 + interestRate.value/100/12, - (termYears.value * 12))))",
                        "mode": "value",
                        "dependencies": [
                          "maxMortgage",
                          "interestRate",
                          "termYears"
                        ],
                        "evaluateOnChange": true,
                        "debounceMs": 100
                      }
                    }
                  },
                  {
                    "id": "loanToValue",
                    "type": "input",
                    "label": "LTV (%)",
                    "props": {
                      "inputType": "number",
                      "readOnly": true,
                      "expression": {
                        "expression": "round((maxMortgage.value / (maxMortgage.value + downPayment.value)) * 100)",
                        "mode": "value",
                        "dependencies": [
                          "maxMortgage",
                          "downPayment"
                        ],
                        "evaluateOnChange": true,
                        "debounceMs": 100
                      }
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    };
    
    // Fill in the JSON textarea
    const textarea = page.locator(
      'textarea[placeholder*="Paste your JSON form definition here"]'
    );
    await textarea.fill(JSON.stringify(formJson, null, 2));
    
    // Click the Import Form button
    const modalImportButton = page.locator('button:has-text("Import Form")');
    await expect(modalImportButton).toBeEnabled();
    await modalImportButton.click();
    
    // Wait for the form to load
    await page.waitForSelector('input[id*="annualIncome"]', { timeout: 10000 });
  });

  test('should calculate monthlyPayment when maxMortgage is calculated', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('monthlyPayment') || msg.text().includes('maxMortgage')) {
        console.log(`[Browser Console ${msg.type()}]:`, msg.text());
      }
    });
    
    // Fill in required fields
    console.log('Filling annualIncome...');
    await page.fill('input[id*="annualIncome"]', '45000');
    await page.waitForTimeout(300);
    
    console.log('Filling monthlyNetDebt...');
    await page.fill('input[id*="monthlyNetDebt"]', '200');
    await page.waitForTimeout(300);
    
    console.log('Filling termYears...');
    await page.fill('input[id*="termYears"]', '30');
    await page.waitForTimeout(300);
    
    console.log('Filling interestRate...');
    await page.fill('input[id*="interestRate"]', '3.5');
    await page.waitForTimeout(300);
    
    console.log('Filling downPayment...');
    await page.fill('input[id*="downPayment"]', '20000');
    
    // Wait for all expressions to evaluate
    await page.waitForTimeout(1500);
    
    // Check maxMortgage value
    const maxMortgageInput = page.locator('input[id*="maxMortgage"]').first();
    const maxMortgageValue = await maxMortgageInput.inputValue().catch(() => '');
    console.log('📊 maxMortgage value:', maxMortgageValue);
    
    // Check monthlyPayment value
    const monthlyPaymentInput = page.locator('input[id*="monthlyPayment"]').first();
    const monthlyPaymentValue = await monthlyPaymentInput.inputValue().catch(() => '');
    console.log('📊 monthlyPayment value:', monthlyPaymentValue);
    
    // Check loanToValue
    const loanToValueInput = page.locator('input[id*="loanToValue"]').first();
    const loanToValue = await loanToValueInput.inputValue().catch(() => '');
    console.log('📊 loanToValue:', loanToValue);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'screenshots/debug-monthly-payment-expression.png', 
      fullPage: true 
    });
    
    // Log all input values for debugging
    const allInputs = await page.locator('input[type="number"]').all();
    console.log('\n=== All Input Values ===');
    for (const input of allInputs) {
      const id = await input.getAttribute('id');
      const value = await input.inputValue().catch(() => '');
      const readOnly = await input.getAttribute('readonly');
      console.log(`  ${id}: ${value} ${readOnly ? '(readonly)' : ''}`);
    }
    
    // Assertions
    expect(maxMortgageValue).not.toBe('');
    expect(maxMortgageValue).not.toBe('0');
    
    // This is the key assertion - monthlyPayment should be calculated
    expect(monthlyPaymentValue).not.toBe('');
    expect(monthlyPaymentValue).not.toBe('0');
    
    // Verify the calculation makes sense
    if (maxMortgageValue && monthlyPaymentValue) {
      const maxMortgageNum = parseFloat(maxMortgageValue);
      const monthlyPaymentNum = parseFloat(monthlyPaymentValue);
      console.log(`\nCalculation check: maxMortgage=${maxMortgageNum}, monthlyPayment=${monthlyPaymentNum}`);
      
      // Monthly payment should be a reasonable fraction of maxMortgage
      // For a 30-year loan at 3.5%, monthly payment should be roughly 0.45% of principal
      const expectedRatio = 0.0045; // approximate
      const actualRatio = monthlyPaymentNum / maxMortgageNum;
      console.log(`Expected ratio ~${expectedRatio}, actual ratio: ${actualRatio}`);
      
      // Allow some variance but should be in reasonable range
      expect(actualRatio).toBeGreaterThan(0.003);
      expect(actualRatio).toBeLessThan(0.01);
    }
  });
});

