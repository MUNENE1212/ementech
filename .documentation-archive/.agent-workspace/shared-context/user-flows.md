# DumuWaks 2.0 - User Flows & UI/UX Design

## Overview

This document details the key user journeys and interaction patterns for the User-Driven Pricing System and Intelligent Review System.

---

## Table of Contents

1. [Provider Pricing Setup Flows](#provider-pricing-setup-flows)
2. [Customer Booking & Browsing Flows](#customer-booking--browsing-flows)
3. [Review Collection Flows](#review-collection-flows)
4. [Admin & Analytics Flows](#admin--analytics-flows)

---

## Provider Pricing Setup Flows

### Flow 1: First-Time Provider Onboarding - Pricing Setup

**User:** New service provider
**Goal:** Set initial pricing for services
**Entry Point:** During provider registration

#### Step 1: Welcome to Pricing

**Screen:**
```
┌─────────────────────────────────────────┐
│  Set Your Pricing                       │
│  ═════════════════════                  │
│                                         │
│  You're in control of your prices.      │
│  Set rates that work for you.           │
│                                         │
│  We'll show you market rates to         │
│  help you decide.                       │
│                                         │
│  [Let's Get Started]                    │
└─────────────────────────────────────────┘
```

---

#### Step 2: Choose Pricing Strategy

**Screen:**
```
┌─────────────────────────────────────────┐
│  How would you like to price your       │
│  services?                              │
│                                         │
│  ○ Flat Rate                            │
│    Same price for each service          │
│    Example: "Haircut: KES 500"          │
│                                         │
│  ○ Hourly Rate                          │
│    Charge by time                       │
│    Example: "Massage: KES 3,000/hour"   │
│                                         │
│  ○ Tiered Pricing                       │
│    Different levels (Basic, Pro,        │
│    Premium)                              │
│    Example: "KES 400, 600, 800"         │
│                                         │
│  ○ Package Deals                        │
│    Bundle services together             │
│    Example: "10 sessions: KES 25,000"   │
│                                         │
│  ○ Hybrid                               │
│    Mix different models                 │
│                                         │
│  [Continue]  [Learn More]               │
└─────────────────────────────────────────┘
```

**Interaction:**
- Tap option → See example modal
- "Learn More" → Expand each option with pros/cons
- Selected strategy highlights

---

#### Step 3: Select Services to Price

**Screen:**
```
┌─────────────────────────────────────────┐
│  What services do you offer?            │
│                                         │
│  Selected: 0/5                          │
│                                         │
│  ☑ Men's Haircut                        │
│  ☐ Beard Trim                           │
│  ☐ Shave                                │
│  ☐ Hair Coloring                        │
│  ☐ Kids Haircut                         │
│                                         │
│  [+ Add Custom Service]                 │
│                                         │
│  [Continue]                             │
└─────────────────────────────────────────┘
```

**Interaction:**
- Multi-select from common services
- "Add Custom Service" → Text input modal

---

#### Step 4A: Set Flat Rate Pricing

**Screen:**
```
┌─────────────────────────────────────────┐
│  Set Your Price                         │
│  ═══════════════════                    │
│                                         │
│  Service: Men's Haircut                 │
│                                         │
│  Market Rate in Nairobi:                │
│  ┌─────────────────────────────────┐   │
│  │ Low: KES 300  │  Avg: KES 500  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  💡 Suggested: KES 500                  │
│  (Based on your location & experience)  │
│                                         │
│  Your Price:                            │
│  ┌─────────────────────────────────┐   │
│  │  KES 500                        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Description (optional):                │
│  ┌─────────────────────────────────┐   │
│  │ Includes wash, cut, and style   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [See Preview]  [Save Price]            │
└─────────────────────────────────────────┘
```

**Interaction:**
- Tap price field → Numeric keypad
- "See Preview" → Shows how customers will see it
- Validation: Must be between KES 100-50,000

---

#### Step 4B: Set Tiered Pricing

**Screen:**
```
┌─────────────────────────────────────────┐
│  Set Tiered Pricing                     │
│  ═══════════════════                    │
│                                         │
│  Service: Massage Therapy               │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ TIER 1: Basic                   │   │
│  │ Price: KES 2,500                │   │
│  │ Duration: 60 min                │   │
│  │ Includes: Swedish massage       │   │
│  │ [+ Add features]                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ TIER 2: Premium                 │   │
│  │ Price: KES 3,500                │   │
│  │ Duration: 90 min                │   │
│  │ Includes: Deep tissue + aromatherapy│
│  │ [★ Most Popular]                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [+ Add Another Tier]                   │
│                                         │
│  [See Preview]  [Save Tiers]            │
└─────────────────────────────────────────┘
```

**Interaction:**
- Edit each tier inline
- "Most Popular" badge → Highlights one tier
- Drag to reorder tiers

---

#### Step 5: Dynamic Pricing Options (Optional)

**Screen:**
```
┌─────────────────────────────────────────┐
│  Premium Pricing (Optional)             │
│  ═════════════════════════════          │
│                                         │
│  Charge extra for special circumstances │
│                                         │
│  Same-day rush service:                 │
│  ┌─────────────────────────────────┐   │
│  │  +20%                         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Weekend service:                       │
│  ┌─────────────────────────────────��   │
│  │  +15%                         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Emergency service:                     │
│  ┌─────────────────────────────────┐   │
│  │  +50%                         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Travel beyond 5km:                     │
│  ┌─────────────────────────────────┐   │
│  │  Flat KES 200                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Skip]  [Save Premium Options]         │
└─────────────────────────────────────────┘
```

**Interaction:**
- Toggle each option on/off
- Adjust percentages with slider or input
- Preview shows example calculation

---

#### Step 6: Review & Publish

**Screen:**
```
┌─────────────────────────────────────────┐
│  Review Your Pricing                    │
│  ═══════════════════                    │
│                                         │
│  This is how customers will see your    │
│  pricing:                               │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  John's Barbershop              │   │
│  │  ⭐ 4.7 (156 reviews)            │   │
│  │                                 │   │
│  │  Men's Haircut                  │   │
│  │  KES 500                        │   │
│  │  Includes wash, cut, style      │   │
│  │                                 │   │
│  │  Same-day: +20%  Weekend: +15%  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ✓ Competitive with market rates        │
│  ✓ Clear pricing for customers          │
│  ✓ Premium options enabled              │
│                                         │
│  [Edit]  [Publish Pricing]              │
└─────────────────────────────────────────┘
```

**Interaction:**
- "Publish Pricing" → Creates pricing records
- Success animation + celebration
- Option to add more services

---

### Flow 2: Update Existing Pricing

**User:** Existing provider
**Goal:** Change prices
**Entry Point:** Provider Dashboard → Settings → Pricing

#### Navigation:
```
Dashboard
  → Settings
  → Pricing
  → Men's Haircut
  → Edit Price
```

#### Edit Screen:
```
┌─────────────────────────────────────────┐
│  Edit Pricing: Men's Haircut            │
│                                         │
│  Current Price: KES 500                 │
│  New Price:                              │
│  ┌─────────────────────────────────┐   │
│  │  KES 600                        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Reason for change (required):          │
│  ┌─────────────────────────────────┐   │
│  │  Higher quality products        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ⚠️  This change will be logged.        │
│  Pending bookings will use old price.   │
│                                         │
│  [Cancel]  [Save Changes]               │
└─────────────────────────────────────────┘
```

**Interaction:**
- Require reason for audit trail
- Shows effective date (immediate vs scheduled)
- Bulk update option available

---

## Customer Booking & Browsing Flows

### Flow 3: Browse Providers with Pricing

**User:** Customer looking for service
**Goal:** Compare providers and prices
**Entry Point:** Home screen → Search

#### Step 1: Search & Filter

**Screen:**
```
┌─────────────────────────────────────────┐
│  Find: Barbers                         │
│  ┌─────────────────────────────────┐   │
│  │  🔍 Nairobi, Kenya            │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Filters:                               │
│  Price Range:                           │
│  ○ KES 0-500                            │
│  ● KES 500-1000                         │
│  ○ KES 1000+                            │
│                                         │
│  Sort by:                               │
│  ● Lowest Price                         │
│  ○ Highest Rated                        │
│  ○ Nearest                              │
│                                         │
│  Results: 15 barbers                    │
└─────────────────────────────────────────┘
```

---

#### Step 2: Provider List with Pricing

**Screen:**
```
┌─────────────────────────────────────────┐
│  Barbers in Nairobi                     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  [Photo]  John's Barbershop     │   │
│  │           ⭐ 4.7 (156)           │   │
│  │           📍 2.3 km away        │   │
│  │                                 │   │
│  │  Men's Haircut:  KES 500        │   │
│  │  Beard Trim:      KES 200        │   │
│  │                                 │   │
│  │  [View Profile]  [Book Now]     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  [Photo]  City Cuts             │   │
│  │           ⭐ 4.5 (89)            │   │
│  │           📍 1.8 km away        │   │
│  │                                 │   │
│  │  Men's Haircut:  KES 400        │   │
│  │  Shave:          KES 300        │   │
│  │                                 │   │
│  │  [View Profile]  [Book Now]     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Load more...                           │
└─────────────────────────────────────────┘
```

**Interaction:**
- Tap provider → Full profile
- "Book Now" → Opens booking modal
- Filter/sort updates list immediately

---

#### Step 3: Provider Profile with Detailed Pricing

**Screen:**
```
┌─────────────────────────────────────────┐
│  ← Back              [Share]  [Save]   │
│                                         │
│  [Large Photo]                          │
│                                         │
│  John's Barbershop                      │
│  ⭐⭐⭐⭐⭐ 4.7 (156 reviews)              │
│  📍 Westlands, Nairobi · 2.3 km         │
│                                         │
│  ────────────────────────────────────   │
│  Services & Pricing                     │
│  ────────────────────────────────────   │
│                                         │
│  Men's Haircut         KES 500          │
│  ─ Includes wash, cut, style            │
│                                         │
│  Beard Trim            KES 200          │
│  ─ Lineup and trim                       │
│                                         │
│  Full Shave            KES 300          │
│  ─ Hot towel shave                       │
│                                         │
│  Premium Package                        │
│  ─ Haircut + Beard + Shave              │
│  ─ KES 900 (Save KES 100!)              │
│                                         │
│  💡 Additional Fees:                    │
│  Same-day: +20%  Weekend: +15%          │
│                                         │
│  ────────────────────────────────────   │
│  [Book Appointment]                     │
└─────────────────────────────────────────┘
```

**Interaction:**
- Scroll to see all services
- Tap service → Description modal
- "Book Appointment" → Calendar/time selection

---

### Flow 4: Get Price Estimate

**User:** Customer before booking
**Goal:** Know total cost before confirming
**Entry Point:** Booking screen → "See Price Breakdown"

#### Price Estimate Screen:

```
┌─────────────────────────────────────────┐
│  Price Estimate                         │
│  ═════════════════                      │
│                                         │
│  Service: Men's Haircut                 │
│  Provider: John's Barbershop            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Date: Saturday, Jan 20        │   │
│  │  Time: 2:00 PM                 │   │
│  │  Location: Westlands            │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ────────────────────────────────────   │
│  Price Breakdown:                       │
│  ────────────────────────────────────   │
│                                         │
│  Base Price:           KES 500          │
│  Same-day rush:        +KES 100         │
│  Weekend premium:       +KES 75         │
│  New customer discount: -KES 50         │
│  ────────────────────────────────────   │
│  Total:                KES 625          │
│                                         │
│  ✓ Price locked for 24 hours            │
│                                         │
│  [Cancel]  [Confirm & Book]             │
└─────────────────────────────────────────┘
```

**Interaction:**
- Adjust date/time → Updates estimate in real-time
- Breakdown shows each fee clearly
- "Price locked" badge → Price won't change

---

## Review Collection Flows

### Flow 5: Review Request Delivery

**User:** Customer who just completed service
**Goal:** Get feedback at optimal time
**Entry Point:** Automated trigger after booking completion

#### Scenario 1: Push Notification (Best)

**Notification:**
```
🔔 DumuWaks

How was your experience with
John's Barbershop?

Tap to rate ⭐⭐⭐⭐⭐
────────────────────
This takes 30 seconds & helps others
find great service providers.
```

**Interaction:**
- Tap notification → Opens one-tap rating screen
- Swipe left → "Remind me later" / "Don't ask again"

---

#### Scenario 2: WhatsApp Message (Excellent for Kenya)

**Message:**
```
DumuWaks

Hi Muent! 👋

How was your haircut with John's
Barbershop yesterday?

⭐⭐⭐⭐⭐ Tap to rate:
https://dumuwaks.co.ke/r/abc123

This takes 30 seconds. Thanks for
helping others find great providers!

────────────────────
Reply STOP to opt out
```

**Interaction:**
- Tap link → Opens in-app or mobile web rating screen
- Reply "STOP" → Permanently opts out

---

#### Scenario 3: SMS (Fallback)

**Message:**
```
DumuWaks: How was your experience with
John's Barbershop? Rate here:
https://dumuwaks.co.ke/r/abc123

Takes 30s. Reply STOP to opt out
```

---

### Flow 6: One-Tap Rating (Critical UX)

**Screen:**
```
┌─────────────────────────────────────────┐
│  Rate Your Experience                   │
│  ═══════════════════                    │
│                                         │
│  How was your                           │
│  Men's Haircut                          │
│  with John's Barbershop?                │
│                                         │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐        │
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │        │
│  │ ○ │ │ ○ │ │ ● │ │ ○ │ │ ○ │        │
│  └───┘ └───┘ └───┘ └───┘ └───┘        │
│  Poor  Fair  Good  Great  Excellent     │
│                                         │
│  [Skip]                                │
└─────────────────────────────────────────┘
```

**Interaction:**
- Tap number → Immediately submits rating
- Shows brief "Thanks!" toast
- Optional: "Tell us more" (see next flow)
- "Skip" → Asks for reminder or opt-out

---

### Flow 7: Detailed Review (Optional)

**Screen:** (Only shown if they tap 4-5 stars OR tap "Tell us more")

```
┌─────────────────────────────────────────┐
│  Tell Us More (Optional)                │
│  ═══════════════════                    │
│                                         │
│  You rated: ⭐⭐⭐⭐⭐ Excellent          │
│                                         │
│  What did you like most?                │
│  ┌─────────────────────────────────┐   │
│  │  [Suggestions:]                  │   │
│  │  ✓ Professional service          │   │
│  │  ✓ Great haircut                 │   │
│  │  ✓ Clean shop                    │   │
│  │                                 │   │
│  │  Or type your own...             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Any suggestions for improvement?       │
│  ┌─────────────────────────────────┐   │
│  │  (Optional)                      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Add photos? (Optional)                 │
│  [+ Upload Photo]                       │
│                                         │
│  [Skip]  [Submit Review]                │
└─────────────────────────────────────────┘
```

**Interaction:**
- Auto-suggestions based on service type
- Photo upload optional (max 5)
- "Skip" → Submits with just rating
- "Submit" → Shows thank you + incentive

---

### Flow 8: Thank You + Incentive

**Screen:**
```
┌─────────────────────────────────────────┐
│           ✅ THANK YOU!                  │
│                                         │
│  Your review helps others find          │
│  great service providers.               │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  🎁 You earned:                 │   │
│  │                                 │   │
│  │  KES 100 OFF                    │   │
│  │  Your next booking!             │   │
│  │                                 │   │
│  │  Code: REVIEW100                │   │
│  │  Expires: Feb 18, 2026          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Copy Code]  [Use Now]                 │
│                                         │
│  View your review: [See Review]         │
└─────────────────────────────────────────┘
```

**Interaction:**
- "Copy Code" → Copies to clipboard
- "Use Now" → Opens booking search
- "See Review" → Shows public review page

---

### Flow 9: Decline / Opt-Out

**Screen:** (Triggered by "Skip" or negative response)

```
┌─────────────────────────────────────────┐
│  Not Right Now?                         │
│  ─────────────────────                  │
│                                         │
│  We understand! Would you like us to:   │
│                                         │
│  ○ Remind me tomorrow                   │
│  ○ Remind me in 3 days                 │
│  ○ Don't ask me for this booking        │
│  ○ Don't ask me for reviews anymore     │
│                                         │
│  [Confirm]                              │
└─────────────────────────────────────────┘
```

**Interaction:**
- Selection updates ReviewOptOut preferences
- "Don't ask anymore" → Permanently opts out
- Can re-enable in settings anytime

---

## Admin & Analytics Flows

### Flow 10: Admin Review Moderation

**User:** Admin / Moderator
**Goal:** Review flagged reviews
**Entry Point:** Admin Dashboard → Reviews → Flagged

#### Moderation Queue Screen:

```
┌─────────────────────────────────────────┐
│  Flagged Reviews (12 pending)           │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ⚠️  Flagged: Fake Review       │   │
│  │                                 │   │
│  │  Customer: Muent K.             │   │
│  │  Provider: John's Barbershop    │   │
│  │  Rating: ⭐ (1/5)               │   │
│  │                                 │   │
│  │  Comment: "Terrible service,    │   │
│  │  go to [competitor] instead"    │   │
│  │                                 │   │
│  │  Flag Reasons:                  │   │
│  │  ✓ Competitor mention           │   │
│  │                                 │   │
│  │  [Approve]  [Reject]  [Edit]    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ⚠️  Flagged: Profanity         │   │
│  │  ...                             │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Interaction:**
- "Approve" → Clears flags, publishes review
- "Reject" → Hides review, notifies provider
- "Edit" → Opens edit modal (redact profanity)

---

### Flow 11: A/B Test Campaign Setup

**User:** Admin / Growth team
**Goal:** Create review request A/B test
**Entry Point:** Admin Dashboard → Reviews → Campaigns → New Campaign

#### Campaign Setup Wizard:

**Step 1: Define Experiment**
```
┌─────────────────────────────────────────┐
│  What do you want to test?              │
│                                         │
│  ● Timing (when to send requests)       │
│  ○ Channel (push vs SMS vs WhatsApp)    │
│  ○ Message (short vs long copy)         │
│  ○ Incentive (discount vs no reward)    │
│                                         │
│  [Continue]                             │
└─────────────────────────────────────────┘
```

**Step 2: Configure Variants**
```
┌─────────────────────────────────────────┐
│  Variant A: 2 hours after service       │
│  ─────────────────────────────────────  │
│  Traffic allocation: [50%        ]      │
│                                         │
│  Variant B: Next morning 9 AM           │
│  ─────────────────────────────────────  │
│  Traffic allocation: [50%        ]      │
│                                         │
│  [Add Variant]  [Continue]              │
└─────────────────────────────────────────┘
```

**Step 3: Targeting**
```
┌─────────────────────────────────────────┐
│  Who should participate?                │
│                                         │
│  Service Categories:                    │
│  ☑ Barbers                              │
│  ☑ Massage Therapists                   │
│  ☐ Cleaners                             │
│                                         │
│  Sample Size:                            │
│  ┌─────────────────────────────────┐   │
│  │  1,000 participants             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Duration:                              │
│  ┌─────────────────────────────────┐   │
│  │  2 weeks                        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Launch Campaign]                      │
└─────────────────────────────────────────┘
```

**Step 4: Monitor Results**
```
┌─────────────────────────────────────────┐
│  Campaign: Timing Test                  │
│  Status: 🟢 Running                     │
│  Day 3 of 14                            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Variant A: 2 hours             │   │
│  │  Sent: 150  Responses: 52       │   │
│  │  Response rate: 34.7%            │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Variant B: Next morning         │   │
│  │  Sent: 150  Responses: 65       │   │
│  │  Response rate: 43.3% 🏆         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Winner: Variant B (+24.8% lift)        │
│  Confidence: 87% (Target: 95%)          │
│                                         │
│  [Pause]  [Stop Early]                  │
└─────────────────────────────────────────┘
```

---

## Key UX Principles Applied

### 1. Progressive Disclosure
- Show simple options first
- Reveal advanced features on demand
- Don't overwhelm with choices

### 2. Smart Defaults
- Suggest prices based on market data
- Pre-select most common options
- Remember user preferences

### 3. Immediate Feedback
- Show price changes in real-time
- Confirm actions instantly
- Clear validation errors

### 4. Friction Reduction
- One-tap rating (not 5 screens)
- Skip optional steps
- Save progress automatically

### 5. Transparency
- Show all fees upfront
- Explain why we ask for data
- Clear opt-out options

### 6. Incentivization
- Reward participation
- Make value clear
- Instant gratification

---

## Wireframe Files

For detailed visual wireframes, see:
- `/media/munen/muneneENT/ementech/ementech-website/.agent-workspace/artifacts/wireframes/`

Files included:
1. `provider-pricing-setup.pdf` - Full onboarding flow
2. `customer-browsing-experience.pdf` - Provider search & booking
3. `review-collection-flow.pdf` - Review request & submission
4. `admin-dashboard-analytics.pdf` - Admin interfaces

---

This completes the user flows and UI/UX design documentation.
