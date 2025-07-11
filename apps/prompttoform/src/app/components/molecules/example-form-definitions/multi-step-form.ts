export const multiStepForm = {
  app: {
    title: "Product Order Wizard",
    pages: [
      {
        id: "customer-info",
        title: "Customer Information",
        route: "/order/customer",
        layout: "vertical",
        nextPage: "product-selection",
        components: [
          {
            type: "text",
            id: "step1-intro",
            props: {
              content:
                "Please provide your contact information to get started with your order.",
            },
          },
          {
            type: "form",
            id: "customer-form",
            label: "Contact Information",
            children: [
              {
                type: "input",
                id: "fullName",
                label: "Full Name",
                props: {
                  placeholder: "John Doe",
                },
                validation: {
                  required: true,
                  minLength: 2,
                },
              },
              {
                type: "input",
                id: "email",
                label: "Email Address",
                props: {
                  inputType: "email",
                  placeholder: "john@example.com",
                  helperText:
                    "We'll send your order confirmation to this email",
                },
                validation: {
                  required: true,
                  pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                },
              },
              {
                type: "input",
                id: "phone",
                label: "Phone Number",
                props: {
                  inputType: "tel",
                  placeholder: "(555) 555-5555",
                },
                validation: {
                  pattern: "^\\+?[1-9]\\d{1,14}$",
                },
              },
              {
                type: "select",
                id: "customerType",
                label: "Customer Type",
                props: {
                  options: [
                    { label: "Individual", value: "individual" },
                    { label: "Business", value: "business" },
                  ],
                },
                validation: {
                  required: true,
                },
              },
              {
                type: "input",
                id: "companyName",
                label: "Company Name",
                props: {
                  placeholder: "Acme Inc.",
                },
                visibilityConditions: [
                  {
                    field: "customerType",
                    operator: "==",
                    value: "business",
                  },
                ],
                validation: {
                  required: true,
                  minLength: 2,
                },
              },
              {
                type: "input",
                id: "taxId",
                label: "Tax ID / VAT Number",
                props: {
                  placeholder: "12345678",
                },
                visibilityConditions: [
                  {
                    field: "customerType",
                    operator: "==",
                    value: "business",
                  },
                ],
                validation: {
                  required: true,
                  pattern: "^[A-Z0-9]{8,12}$",
                },
              },
            ],
          },
        ],
      },
      {
        id: "product-selection",
        title: "Product Selection",
        route: "/order/products",
        layout: "vertical",
        nextPage: "payment-info",
        components: [
          {
            type: "text",
            id: "step2-intro",
            props: {
              content: "Select the products you want to order.",
            },
          },
          {
            type: "form",
            id: "product-form",
            label: "Products",
            children: [
              {
                type: "select",
                id: "productCategory",
                label: "Product Category",
                props: {
                  options: [
                    { label: "Electronics", value: "electronics" },
                    { label: "Furniture", value: "furniture" },
                    { label: "Clothing", value: "clothing" },
                  ],
                },
                validation: {
                  required: true,
                },
              },
              {
                type: "select",
                id: "electronicsProduct",
                label: "Select Electronics",
                props: {
                  options: [
                    { label: "Smartphone", value: "smartphone" },
                    { label: "Laptop", value: "laptop" },
                    { label: "Tablet", value: "tablet" },
                    { label: "Smart Watch", value: "smartwatch" },
                  ],
                },
                visibilityConditions: [
                  {
                    field: "productCategory",
                    operator: "==",
                    value: "electronics",
                  },
                ],
                validation: {
                  required: true,
                },
              },
              {
                type: "select",
                id: "furnitureProduct",
                label: "Select Furniture",
                props: {
                  options: [
                    { label: "Sofa", value: "sofa" },
                    { label: "Dining Table", value: "dining_table" },
                    { label: "Bed Frame", value: "bed_frame" },
                    { label: "Office Desk", value: "office_desk" },
                  ],
                },
                visibilityConditions: [
                  {
                    field: "productCategory",
                    operator: "==",
                    value: "furniture",
                  },
                ],
                validation: {
                  required: true,
                },
              },
              {
                type: "select",
                id: "clothingProduct",
                label: "Select Clothing",
                props: {
                  options: [
                    { label: "T-Shirt", value: "tshirt" },
                    { label: "Jeans", value: "jeans" },
                    { label: "Jacket", value: "jacket" },
                    { label: "Dress", value: "dress" },
                  ],
                },
                visibilityConditions: [
                  {
                    field: "productCategory",
                    operator: "==",
                    value: "clothing",
                  },
                ],
                validation: {
                  required: true,
                },
              },
              {
                type: "input",
                id: "quantity",
                label: "Quantity",
                props: {
                  inputType: "number",
                  placeholder: "1",
                },
                validation: {
                  required: true,
                  min: 1,
                  max: 100,
                },
              },
            ],
          },
        ],
      },
      {
        id: "payment-info",
        title: "Payment Information",
        route: "/order/payment",
        layout: "vertical",
        components: [
          {
            type: "text",
            id: "step3-intro",
            props: {
              content:
                "Please provide your payment details to complete your order.",
            },
          },
          {
            type: "form",
            id: "payment-form",
            label: "Payment Details",
            children: [
              {
                type: "radio",
                id: "paymentMethod",
                label: "Payment Method",
                props: {
                  options: [
                    { label: "Credit Card", value: "credit_card" },
                    { label: "PayPal", value: "paypal" },
                    { label: "Bank Transfer", value: "bank_transfer" },
                  ],
                },
                validation: {
                  required: true,
                },
              },
              {
                type: "section",
                id: "credit-card-details",
                label: "Credit Card Details",
                visibilityConditions: [
                  {
                    field: "paymentMethod",
                    operator: "==",
                    value: "credit_card",
                  },
                ],
                children: [
                  {
                    type: "input",
                    id: "cardNumber",
                    label: "Card Number",
                    props: {
                      placeholder: "XXXX XXXX XXXX XXXX",
                    },
                    validation: {
                      required: true,
                      pattern: "^[0-9]{16}$",
                    },
                  },
                  {
                    type: "input",
                    id: "cardName",
                    label: "Name on Card",
                    props: {
                      placeholder: "John Doe",
                    },
                    validation: {
                      required: true,
                      minLength: 2,
                    },
                  },
                  {
                    type: "input",
                    id: "cardExpiry",
                    label: "Expiration Date",
                    props: {
                      placeholder: "MM/YY",
                    },
                    validation: {
                      required: true,
                      pattern: "^(0[1-9]|1[0-2])\\/([0-9]{2})$",
                    },
                  },
                  {
                    type: "input",
                    id: "cardCVV",
                    label: "CVV",
                    props: {
                      placeholder: "123",
                    },
                    validation: {
                      required: true,
                      pattern: "^[0-9]{3,4}$",
                    },
                  },
                ],
              },
              {
                type: "section",
                id: "paypal-details",
                label: "PayPal Details",
                visibilityConditions: [
                  {
                    field: "paymentMethod",
                    operator: "==",
                    value: "paypal",
                  },
                ],
                children: [
                  {
                    type: "input",
                    id: "paypalEmail",
                    label: "PayPal Email",
                    props: {
                      inputType: "email",
                      placeholder: "your-email@example.com",
                    },
                    validation: {
                      required: true,
                      pattern:
                        "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                    },
                  },
                ],
              },
              {
                type: "section",
                id: "bank-details",
                label: "Bank Details",
                visibilityConditions: [
                  {
                    field: "paymentMethod",
                    operator: "==",
                    value: "bank_transfer",
                  },
                ],
                children: [
                  {
                    type: "input",
                    id: "accountName",
                    label: "Account Holder Name",
                    props: {
                      placeholder: "John Doe",
                    },
                    validation: {
                      required: true,
                      minLength: 2,
                    },
                  },
                  {
                    type: "input",
                    id: "accountNumber",
                    label: "Account Number",
                    props: {
                      placeholder: "XXXXXXXX",
                    },
                    validation: {
                      required: true,
                      pattern: "^[A-Z0-9]{8,12}$",
                    },
                  },
                  {
                    type: "input",
                    id: "bankName",
                    label: "Bank Name",
                    props: {
                      placeholder: "Bank of Example",
                    },
                    validation: {
                      required: true,
                      minLength: 2,
                    },
                  },
                ],
              },
              {
                type: "checkbox",
                id: "termsAgreed",
                label: "I agree to the terms and conditions",
                validation: {
                  required: true,
                },
              },
            ],
          },
        ],
      },
    ],
  },
};
