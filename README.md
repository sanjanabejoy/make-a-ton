# make-a-ton

#  SubscriptIQ
### From Spreadsheet Chaos to Intelligent Subscription Management.

**SubscriptIQ** is an intelligent subscription management and revenue operations platform that helps businesses migrate from manual Excel workflows to automated subscription billing, payment tracking, and revenue intelligence.

> Manage subscriptions. Automate billing. Understand your revenue.

---

##  About the Project

Many subscription-based businesses still rely on spreadsheets to manage customers, subscriptions, renewals, invoices, and payments.

This leads to missed renewals, duplicate invoices, payment tracking difficulties, and inaccurate revenue reports.

**SubscriptIQ solves this problem** by bringing the entire subscription lifecycle into one unified platform, with intelligent automation and seamless Excel/CSV migration.

Our goal is not just to manage subscriptions but to help businesses make smarter revenue decisions.

---

##  Key Features

### 1.  Authentication & Role-Based Access
- Secure user registration and login.
- Password validation and reset.
- Three roles: Admin, Staff, and Customer.
- Role-based permissions and protected customer data.
- Only Admins can create staff accounts.

### 2.  Product & Plan Management
- Create and manage products.
- Configure product types, sales prices, and cost prices.
- Support product variants with additional pricing.
- Create daily, weekly, monthly, and yearly plans.
- Configure minimum quantities and availability periods.
- Support configurable pause, renewal, and closure rules.

### 3.  Quotation Management
- Reusable quotation templates.
- Create quotations with product and plan details.
- Configure quotation validity periods.
- Convert confirmed quotations into subscriptions.

### 4.  Subscription Management
- Complete subscription lifecycle:
  `Draft → Quotation → Confirmed → Active → Closed`
- Unique subscription identification.
- Customer and plan association.
- Start and expiry date management.
- Subscription history and timeline.
- Pause, renew, and early closure capabilities.

### 5.  Automated Recurring Billing
- Automatically generate invoices from subscriptions.
- Daily, weekly, monthly, and yearly billing support.
- Automatic product, tax, and total calculations.
- Duplicate invoice prevention.
- Invoice confirmation, cancellation, sending, and printing.

### 6.  Smart Discount Management
- Fixed-amount and percentage discounts.
- Minimum purchase and quantity conditions.
- Validity periods and usage limits.
- Product-specific and subscription-wide discounts.
- Automatic discount application during billing.

### 7.  Payment Management
- Record payments against invoices.
- Track payment methods, dates, amounts, and notes.
- Monitor paid, outstanding, and overdue invoices.
- Payment history and follow-up tracking.

### 8. Revenue Analytics Dashboard
- Active subscription metrics.
- Monthly Recurring Revenue (MRR).
- Revenue collected.
- Outstanding payments.
- Overdue invoice tracking.
- Plan-wise revenue insights.
- Upcoming renewals.

---

##  Unique & Innovative Features

### 1.  Smart Migration Centre
**From Excel to SubscriptIQ — without manually rebuilding business records.**

Businesses can migrate their existing subscription workflows into SubscriptIQ.

- Upload Excel (`.xlsx`, `.xls`) and CSV files.
- Support multiple related business data files.
- Intelligent column mapping suggestions.
- Automatic data validation.
- Duplicate record detection.
- Missing field and invalid data detection.
- Migration preview before importing.
- Batch data import.
- Migration progress tracking.
- Error reports and retry support.
- Migration history and audit trail.

### 2.  Revenue Intelligence Assistant
An intelligent assistant that helps businesses understand their subscription data.

Example queries:
- Which customers have overdue invoices?
- What is our current recurring revenue?
- Which plans generate the most revenue?
- Which subscriptions are at risk?
- How much revenue is still outstanding?

Provides data-driven insights based on actual business records.

### 3.  Smart Payment Recovery
- Detect failed and overdue payments.
- Automated payment reminder workflows.
- Configurable reminder schedules.
- Payment attempt history.
- Recovered revenue tracking.

### 4.  Customer Churn Risk Monitor
Identify subscriptions that may require attention using:
- Repeated payment failures.
- Overdue invoices.
- Upcoming subscription expiry.
- Previous cancellation or pause history.

Provides explainable risk levels and recommended staff actions.

### 5.  Subscription Timeline
A complete chronological history of subscription activities:
- Subscription creation.
- Quotation confirmation.
- Activation.
- Invoice generation.
- Payment receipt.
- Pausing and resuming.
- Renewal and closure.

### 6.  What-if Revenue Simulator
Experiment with hypothetical business scenarios:
- Increasing plan prices.
- Adding new customers.
- Offering discounts.
- Simulating customer cancellations.

Understand potential revenue impact without changing actual business records.

---

##  User Workspaces

| Admin | Staff | Customer |
|---|---|---|
| Full system access | Limited access | Own account only |
| Manage products and plans | Manage customers | View subscriptions |
| Manage staff | Manage quotations | View invoices |
| Configure taxes and discounts | Track invoices | View payments |
| View analytics | Record payments | Manage requests |
| Manage migrations | Follow up overdue payments | Manage profile |

---

##  Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Nuxt 3, Vue 3, TypeScript |
| Styling | Tailwind CSS |
| Backend | Node.js, NestJS |
| Database | PostgreSQL |
| ORM | Prisma |
| Background Jobs | Redis, BullMQ |
| Data Migration | SheetJS, CSV parsing |
| Charts | Apache ECharts |
| Version Control | Git, GitHub |

*The final implementation stack may be adjusted based on the team's development decisions.*

---

##  System Architecture

```text
             SUBSCRIPT IQ
                   |
        +----------+----------+
        |                     |
   Frontend UI            Backend API
   (Nuxt / Vue)            (Node.js)
        |                     |
        |          +----------+----------+
        |          |          |          |
        |       Auth       Billing    Migration
        |       Module     Engine      Engine
        |          |          |          |
        |          +----------+----------+
        |                     |
        |                PostgreSQL
        |                     |
        |              Background Jobs
        |                Redis / BullMQ
        |
   Admin / Staff / Customer
```

---

##  Core Workflow

```text
Customer Registration
         |
         v
Product Selection
         |
         v
Plan Selection
         |
         v
Quotation Creation
         |
         v
Subscription Confirmation
         |
         v
Subscription Activation
         |
         v
Automated Recurring Billing
         |
         v
Invoice Generation
         |
         v
Payment Collection
         |
         v
Revenue Analytics
```

### Excel Migration Workflow

```text
Upload Excel / CSV
        |
        v
File Analysis
        |
        v
Column Mapping
        |
        v
Data Validation
        |
        v
Migration Preview
        |
        v
Admin Confirmation
        |
        v
Batch Data Import
        |
        v
Migration Report
```

---

## 👨‍💻 Team

Built by a team of three passionate developers.

| Member | Responsibility |
|---|---|
| Sebin  | Frontend Development & UI/UX |
|  Vishnuraj VM | Backend Development, 
| Nimisha   |  Database & Billing |
| Sanjana Bejoy| Data Migration, Intelligence & Analytics |

---

## 🎯 Project Goals

- Eliminate spreadsheet-based subscription management.
- Automate recurring billing and invoicing.
- Improve payment visibility and recovery.
- Simplify business data migration.
- Provide actionable revenue insights.
- Deliver a scalable and reliable subscription platform.

---

## 🔮 Future Enhancements

- Direct migration from third-party subscription platforms.
- Payment gateway integrations.
- Advanced revenue forecasting.
- Automated customer communication.
- Multi-company support.
- Advanced financial reporting.
- More intelligent churn prediction.

---

##  Contributing

Contributions, suggestions, and feedback are welcome!

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push your branch.
5. Open a Pull Request.

---

## 📌 Project Status

🚧 **Under Development**

Built as a hackathon project with a vision to make subscription management smarter, simpler, and more accessible.

---

<p align="center">
  <b>SubscriptIQ</b><br>
  Every Subscription. Every Payment. One Intelligent Platform. 🚀
</p>
