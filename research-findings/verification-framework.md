# Verification & Trust Framework

**Project:** DumuWaks 2.0 Expansion Research
**Date:** January 18, 2026
**Purpose:** Define worker verification processes and trust-building features to ensure safety and quality on the DumuWaks platform

---

## Executive Summary

Trust is the **#1 barrier** to platform adoption. Customers fear theft, poor quality, and safety issues. Workers fear non-payment, false accusations, and dangerous situations.

**Solution:** A comprehensive, **category-specific verification framework** that balances safety, cost, and scalability. This framework implements **progressive verification** (basic for all workers, enhanced for high-risk categories) and uses **technology + human oversight** to maintain quality.

**Key Recommendation:** Allocate **KES 500-800 per worker** for verification costs (background checks, in-person vetting, reference calls). This investment pays for itself through higher customer trust, premium pricing, and reduced incidents.

---

## 1. Verification Principles

### **Core Principles**

1. **Safety First:** Customer and worker safety is non-negotiable
2. **Category-Specific:** Different categories require different verification levels
3. **Progressive Verification:** Start with basic checks, add enhanced verification over time
4. **Frictionless Onboarding:** Keep initial onboarding simple (10-15 minutes), add more checks later
5. **Privacy Protection:** Store data securely, share only necessary information
6. **Continuous Monitoring:** Ongoing checks, not one-time verification

### **Verification Hierarchy (4 Levels)**

| Level | Name | Categories | Checks Required | Cost per Worker |
|-------|------|------------|-----------------|-----------------|
| **Level 1** | **Basic** | Barbers, Photographers, Tutors, Gardeners | ID, phone, photo, basic quiz | KES 50-100 |
| **Level 2** | **Standard** | Mechanics, Electricians, Plumbers, Carpenters, Painters | Level 1 + portfolio/reference | KES 150-250 |
| **Level 3** | **Enhanced** | Home Cleaners, Personal Trainers, Hairdressers | Level 2 + background check | KES 350-500 |
| **Level 4** | **Premium** | Massage Therapists, Nannies, Elderly Caregivers | Level 3 + in-person vetting | KES 600-800 |

---

## 2. Identity Verification

### **2.1 Basic Identity Check (All Workers)**

**Documents Required:**
1. **National ID** (Kenya) or **Passport** (foreign workers)
2. **Selfie with ID** (to prove ID belongs to worker)
3. **Phone Number** (registered in worker's name)
4. **KRA PIN** (for tax compliance, optional initially)

**Technology Used:**
- **OCR (Optical Character Recognition):** Auto-extract data from ID
- **Facial Recognition:** Match selfie to ID photo (95%+ accuracy)
- **Phone Verification:** SMS OTP (one-time password) verification
- **Document Liveness Detection:** Prevent fake IDs (photos of photos)

**Process Flow:**
1. Worker downloads app, clicks "Join as Worker"
2. Worker uploads photo of National ID (front and back)
3. Worker takes selfie holding ID
4. Worker enters phone number, receives SMS OTP
5. System verifies ID authenticity, matches face to ID
6. **Result:** Worker passes to next step (2-5 minutes total)

**Cost:** KES 20-40 per worker (via verification APIs like Onfido, Smile Identity, or local Kenyan providers)

**What Prevents:**
- Fake identities
- Using someone else's ID
- Minors (under 18) lying about age

---

### **2.2 Enhanced Identity Check (High-Risk Categories)**

**Additional Checks for Level 3 & 4 Categories:**

1. **Address Verification:**
   - Worker uploads utility bill or rental agreement with current address
   - System validates address (geolocation, third-party databases)
   - **Purpose:** If worker commits crime, police can locate them

2. **Next of Kin Information:**
   - Worker provides 2 emergency contacts (name, phone, relationship)
   - System verifies by calling contacts
   - **Purpose:** Emergency situations, tracing worker if they disappear

3. **Biometric Fingerprint (Future):**
   - Partner with registration agencies for fingerprint capture
   - Store encrypted fingerprint hash
   - **Purpose:** Ultimate identity verification (hard to fake)

**Cost:** KES 100-150 per worker

**What Prevents:**
- Workers using fake addresses
- Workers disappearing after incidents
- Identity theft (someone pretending to be verified worker)

---

## 3. Background Checks

### **3.1 Criminal Background Check**

**Categories Required:** Level 3 & 4 (Cleaners, Nannies, Massage Therapists, Trainers)

**Process:**

**Option A: Government Database Check**
- Partner with **Directorate of Criminal Investigations (DCI)** or **Certified Background Check Companies** in Kenya
- Check against:
  - Criminal records database
  - Sex offender registry (if available)
  - Terrorism watch lists
- **Cost:** KES 300-500 per check
- **Turnaround:** 3-7 business days
- **Accuracy:** 80-90% (government databases may be incomplete)

**Option B: Private Background Check Companies**
- Kenyan companies like:
  - **Metropol Corporation**
  - **Creditinfo Kenya**
  - **Elimu Consulting**
- **Cost:** KES 500-1,000 per check
- **Turnaround:** 2-5 business days
- **Accuracy:** 70-85% (depends on data sources)

**Option C: Community Reference Checks (Low-Cost Alternative)**
- Call 3-5 references provided by worker:
  - Current/former employers
  - Community leaders (chief, assistant chief, religious leader)
  - Long-term residents of worker's neighborhood
- Ask specific questions:
  - "Has this person ever been accused of theft?"
  - "Have they ever been violent?"
  - "Would you trust them in your home?"
- **Cost:** KES 50-100 per check (staff time to call)
- **Turnaround:** 1-2 business days
- **Accuracy:** 60-75% (references may lie or be biased)

**Recommendation for DumuWaks:**
- **Phase 1 (Months 1-6):** Use Option C (Community References) for all Level 3 workers
- **Phase 2 (Months 7-12):** Use Option B (Private Checks) for Level 4 workers (massage, nannies)
- **Phase 3 (Months 13+):** Use Option A (Government Checks) for all workers as costs decrease

---

### **3.2 Financial Background Check**

**Purpose:** Identify workers with severe financial problems (theft risk)

**Categories Required:** Level 3 & 4 (workers with access to homes/valuables)

**Checks:**
1. **CRB (Credit Reference Bureau) Check:**
   - Check if worker has defaulted on loans
   - **What we're looking for:** Severe financial distress (not just late payments)
   - **Threshold:** Flag workers who owe >KES 100,000 AND have >3 loan defaults
   - **Cost:** KES 100-200 per check (via CRB agencies like Metropol, TransUnion)

2. **M-Pesa Transaction History (Optional):**
   - Worker shares last 3 months of M-Pesa statements
   - **What we're looking for:** Regular income, not gambling, not suspicious transactions
   - **Privacy Concern:** Workers may refuse (make optional, not mandatory)
   - **Cost:** Free (worker provides)

**Use of Results:**
- **Pass:** Worker has no severe financial red flags
- **Conditional:** Worker has some financial stress → require higher security deposits or insurance
- **Fail:** Worker has severe financial problems (e.g., KES 500K+ debt, multiple defaults) → **reject or require enhanced verification**

**Ethical Considerations:**
- Financial problems shouldn't automatically disqualify workers (many low-income workers have debt)
- Use financial checks as **risk indicators**, not automatic rejections
- Combine with other verification (references, background checks) to make fair decision

---

## 4. Skill Verification

### **4.1 Portfolio Review (Creative/Visual Services)**

**Categories:** Barbers, Hairdressers, Photographers, Makeup Artists, Event Decorators

**Process:**
1. Worker uploads **10-20 photos** of their best work
2. System may use **AI image analysis** to verify:
   - Photos are not stolen from internet (reverse image search)
   - Photos show consistent quality
   - Photos show different clients (not just 1 person repeatedly)
3. Human reviewer (DumuWaks staff) scores portfolio:
   - **Pass:** Good quality, variety of styles, professional presentation
   - **Conditional:** Average quality, need improvement in some areas
   - **Fail:** Poor quality, insufficient photos, obvious fakes

**Cost:** KES 50-100 per worker (human reviewer time)

**Alternative: Video Portfolio**
- Worker uploads 1-2 minute video showing their work process
- More authentic than photos (harder to fake)
- Builds trust (customers can see worker's personality)

**Example (Barber Portfolio):**
- 5 photos of different haircut styles (fade, buzz cut, line up, etc.)
- 2-3 before/after photos
- 1 photo of clean workspace/equipment
- **Result:** Customer sees "This barber is skilled"

---

### **4.2 Practical Skill Test (Skilled Trades)**

**Categories:** Mechanics, Electricians, Plumbers, Carpenters

**Process:**

**Option A: Video Assessment (Low-Cost)**
- Worker submits **2-3 minute videos** demonstrating specific skills:
  - **Mechanic:** Video showing how to change brake pads, change oil, diagnose engine problem
  - **Electrician:** Video showing how to install a socket, test for continuity
  - **Plumber:** Video showing how to fix a leak, install a faucet
- DumuWaks staff or **expert reviewers** (experienced mechanics/electricians) score videos
- **Pass/Fail** based on technical correctness, safety practices, tool handling
- **Cost:** KES 100-200 per worker (reviewer fees)

**Option B: In-Person Assessment (High-Cost, High-Accuracy)**
- Worker comes to DumuWaks office or partner location
- Performs practical test (e.g., mechanic fixes actual brake problem on test vehicle)
- Assessed by certified expert
- **Cost:** KES 500-1,000 per worker (facility rental, expert time, test materials)
- **Accuracy:** 95%+ (very reliable)

**Option C: Third-Party Certification (Best for Scalability)**
- Partner with **TVET institutions** (Technical and Vocational Education and Training)
- Partner with **trade associations** (e.g., Kenya National Federation of Jua Kali Associations)
- Accept **trade certificates** as proof of skill:
  - National Industrial Training Authority (NITA) certificates
  - Kenya Technical Training College (KTTC) certificates
  - Trade test certificates (Grade 1, 2, 3)
- **Cost:** KES 50-100 per worker (verification with issuing institution)
- **Accuracy:** 80-90% (certificates can be faked, need to verify with issuer)

**Recommendation for DumuWaks:**
- **Phase 1:** Use Option A (Video Assessment) for all skilled trades
- **Phase 2:** Use Option C (Third-Party Certification) for workers with certificates (skip video assessment)
- **Phase 3:** Use Option B (In-Person Assessment) only for workers with customer complaints or poor reviews (re-verification)

---

### **4.3 Knowledge Quiz (All Categories)**

**Purpose:** Test basic knowledge, safety awareness, customer service

**Format:** 10-20 multiple-choice questions, taken on worker's phone

**Examples by Category:**

**Barber Quiz:**
1. What is the first step before cutting a customer's hair?
   a) Spray with water
   b) Sanitize tools
   c) Ask what style they want
   d) Check for scalp infections
   *(Correct: b) Sanitize tools)*

2. If you accidentally cut a customer while shaving, what should you do?
   a) Hide it and continue
   b) Apply antiseptic and inform customer
   c) Blame the customer for moving
   d) Finish quickly and rush them out
   *(Correct: b) Apply antiseptic and inform customer)*

**Home Cleaner Quiz:**
1. What should you do if you break something in a customer's home?
   a) Hide it and hope they don't notice
   b) Offer to pay for it
   c) Inform DumuWaks support immediately
   d) Clean it up and say nothing
   *(Correct: c) Inform DumuWaks support immediately)*

2. Which cleaning products should never be mixed?
   a) Soap and water
   b) Bleach and ammonia
   c) Detergent and vinegar
   d) Glass cleaner and paper towels
   *(Correct: b) Bleach and ammonia - creates toxic gas)*

**Mechanic Quiz:**
1. What is the first thing to check before working under a vehicle?
   a) Oil level
   b) Tire pressure
   c) The vehicle is securely supported on jack stands
   d) Engine temperature
   *(Correct: c) The vehicle is securely supported)*

**Passing Score:** 70% (7/10 correct)

**If Worker Fails:**
- Allow 1 retry after 24 hours (to study)
- Provide correct answers after quiz (educational)
- If fails twice, **reject or require in-person training**

**Cost:** KES 20-50 per worker (quiz platform costs, minimal)

---

## 5. Reference Checks

### **5.1 Professional References (All Categories)**

**Number Required:** 2-3 references

**Who Counts as Valid Reference:**
- Current or former **customers** (for workers with existing client base)
- Current or former **employers** (for workers who worked for companies)
- **Community leaders** (chief, assistant chief, religious leader)
- **Long-term residents** of worker's neighborhood (5+ years)

**Who Does NOT Count:**
- Family members
- Friends/roommates
- Co-workers (can be biased)

**Process:**
1. Worker provides reference name, phone number, relationship
2. DumuWaks staff calls references (can be automated with pre-recorded questions)
3. Ask 5-7 standardized questions:
   - How long have you known this worker?
   - In what capacity?
   - Would you trust this worker in your home? (Yes/No)
   - Have you ever seen them act dishonestly or violently? (Yes/No)
   - Would you recommend them to a friend? (Yes/No/Unsure)
4. Score each reference (Pass/Fail based on answers)
5. **Require 2/3 references to pass**

**Cost:** KES 30-80 per worker (staff time to call, or KES 10-20 if using automated SMS/IVR surveys)

**Red Flags (Automatic Fail):**
- Reference says "No, I would not trust this worker"
- Reference mentions theft, violence, or serious misconduct
- Reference is unwilling to answer or hangs up

---

### **5.2 Community Verification (For Workers Without References)**

**Target:** New workers (youth just entering workforce, workers from rural areas)

**Process:**
1. Worker provides name and location of **community leader** (chief, assistant chief, village elder, religious leader)
2. DumuWaks staff visits community leader (in-person or phone call)
3. Leader confirms:
   - Worker lives in that community
   - Worker is known in community
   - No history of criminal behavior
   - Leader is willing to vouch for worker

**Cost:** KES 100-200 per worker (travel costs for in-person visits)

**Alternative:** Use **digital community verification** (cheaper):
- Worker posts in community WhatsApp group: "I'm joining DumuWaks platform, who can vouch for me?"
- 3-5 community members respond with endorsement
- DumuWaks staff follows up with 2-3 respondents
- **Cost:** KES 20-50 per worker (staff time)

---

## 6. In-Person Vetting (Premium Categories Only)

### **6.1 When In-Person Vetting is Required**

**Categories:** Level 4 only (Massage Therapists, Nannies, Elderly Caregivers)

**Why Required:** These workers have intimate, unsupervised access to vulnerable people (children, elderly, clients in vulnerable states). The risk is too high for remote verification only.

---

### **6.2 In-Person Vetting Process**

**Location Options:**
1. **DumuWaks Office:** Worker travels to our office (cost: KES 100-300 travel reimbursement)
2. **Partner Location:** Partner with TVET colleges, community centers (cost: KES 50-150 per worker for venue use)
3. **Mobile Vetting:** DumuWaks staff travels to worker's location (cost: KES 300-500 per worker for staff time + transport)

**Duration:** 30-60 minutes per worker

**What Happens During In-Person Vetting:**

**Part 1: Document Verification (10 minutes)**
- Verify original National ID (not just photo)
- Verify original certificates (trade certificates, training certificates)
- Take live photo (for profile)
- Collect fingerprints (if biometric system available)

**Part 2: Interview (20-30 minutes)**
- Ask behavioral questions:
  - "Tell me about a time you had an angry customer. How did you handle it?"
  - "What would you do if a child got hurt while in your care?" (nannies)
  - "A customer makes you uncomfortable. What do you do?" (massage therapists)
- Assess:
  - Communication skills
  - Professionalism
  - Judgment and decision-making
  - Trustworthiness (gut feeling from experienced interviewer)

**Part 3: Practical Skills Test (20 minutes)**
- **Massage Therapists:** Perform massage on staff member, demonstrate technique
- **Nannies:** Interact with child (staff member's child), demonstrate safety awareness
- **Elderly Caregivers:** Demonstrate how to assist someone walking, feeding, etc.

**Scoring:** Pass/Fail based on:
- Document authenticity (100% required)
- Interview responses (70% passing score)
- Practical skills (demonstrate basic competence)

**Cost:** KES 500-800 per worker (staff time, venue, materials)

---

## 7. Ongoing Monitoring & Re-Verification

### **7.1 Continuous Quality Monitoring**

**Methods:**

**A. Customer Reviews (Ongoing)**
- After each job, customer rates worker (1-5 stars) and leaves review
- **System flags:**
  - Workers with average rating <3.5 stars
  - Workers with 3+ negative reviews in a month
  - Workers with specific complaint keywords (theft, violence, harassment)
- **Action:** Workers flagged for re-verification or removal

**B. Random Video Calls (Spot Checks)**
- DumuWaks staff randomly video-calls workers (1-2% of workforce per month)
- Verify worker is who they claim to be (not someone else using account)
- Ask about recent jobs (confirm they actually performed the work)
- **Cost:** KES 20-50 per call (minimal)

**C. Mystery Shoppers (Periodic)**
- Hire mystery shoppers to book services and evaluate workers
- Focus on high-risk categories (cleaners, nannies, massage)
- **Cost:** KES 800-1,500 per mystery shop (service fee + staff time)
- **Frequency:** 5-10 mystery shops per month per category

**D. GPS Location Tracking (For Mobile Workers)**
- For workers who travel to customers (barbers, cleaners, mechanics)
- Track GPS during job to verify:
  - Worker arrived at customer location
  - Worker stayed for reasonable duration (not 5 minutes for 1-hour job)
- **Privacy:** Workers can disable GPS outside of jobs (only track during active jobs)

---

### **7.2 Re-Verification Schedule**

**When Workers Must Re-Verify:**

| Trigger | Action |
|---------|--------|
| **Annual Re-Verification** | All workers re-verify every 12 months (update ID, new photos, confirm still active) |
| **Customer Complaints** | After 3+ serious complaints, worker must pass enhanced verification |
| **Long Inactivity** | If worker inactive for 6+ months, must re-verify before reactivating |
| **Change in Personal Info** | If worker changes phone number, address, or name, must verify new info |
| **Criminal Incident** | If worker is arrested or charged with crime, immediate suspension until investigation complete |

**Cost of Annual Re-Verification:** KES 50-150 per worker (much cheaper than initial verification, as many checks don't need to be repeated)

---

## 8. Trust-Building Features

### **8.1 Worker Profiles (Transparency)**

**What Customers See:**

**Essential Information (All Workers):**
- ✅ Profile photo (verified, recent)
- ✅ Full name (first name + last initial for privacy: "James O.")
- ✅ Age (or age range: 25-30)
- ✅ Location (neighborhood: "Kasarani, Nairobi")
- ✅ Years of experience
- ✅ Average rating (X.XX / 5.00)
- ✅ Number of reviews (e.g., "47 reviews")
- ✅ Verification badge (✓ "Verified ID, Background Checked")

**Extended Information (Optional but Recommended):**
- ✅ Bio (1-2 sentences about themselves)
- ✅ Skills/expertise (e.g., "Specializes in: Hair Tattoos, Kids' Haircuts")
- ✅ Languages spoken (English, Swahili, Sheng, etc.)
- ✅ Portfolio photos (for barbers, hairdressers, photographers)
- ✅ Video introduction (30-60 second "Hi, I'm James, a barber with 6 years experience...")
- ✅ Availability calendar (shows which days/times they're free)
- ✅ Response rate (e.g., "Responds to 90% of requests within 1 hour")

**Hidden from Customers (Privacy Protection):**
- ❌ Full ID number
- ❌ Exact address (only neighborhood shown)
- ❌ Phone number (communication through app only)
- ❌ Financial information
- ❌ Criminal history (only show "Passed Background Check" badge)

---

### **8.2 Video Profiles (Premium Feature)**

**Why Video Profiles Build Trust:**
- Customers can **see and hear** the worker (much more trustworthy than photos)
- Workers can showcase personality, communication skills
- Harder to fake than photos

**Format:**
- 30-60 second video
- Worker introduces themselves: "Hi, I'm Mary, a home cleaner with 9 years experience. I specialize in deep cleaning and organizing. I'm trustworthy, hardworking, and I treat every home like my own."
- Shows work environment (e.g., barber shop, cleaning supplies)

**Implementation:**
- **Phase 1:** Optional (workers can upload if they want)
- **Phase 2:** Encouraged (workers with video get priority in search results)
- **Phase 3:** Mandatory for Level 3 & 4 categories (cleaners, nannies, massage)

**Cost:** Free (worker records video on their phone)

---

### **8.3 Review System**

**Types of Reviews:**

**Star Rating (1-5 stars)**
- Overall rating
- Sub-ratings (optional):
  - Quality of work (1-5 stars)
  - Punctuality (1-5 stars)
  - Communication (1-5 stars)
  - Professionalism (1-5 stars)

**Written Review**
- Customer writes 1-2 sentences about experience
- Examples:
  - "James did an amazing job! Best haircut I've had in years."
  - "Mary was thorough and polite. My house has never been this clean."
  - "The mechanic was honest and didn't overcharge. Highly recommend."

**Photo Review (Optional)**
- Customer can upload before/after photos (especially useful for barbers, cleaners)
- Builds trust for future customers

**Video Review (Optional)**
- Customer records 15-second video testimonial
- **Very powerful** for building trust (hard to fake)

**Review Moderation:**
- Workers can flag unfair reviews
- DumuWaks staff reviews flagged reviews
- Reviews removed if: contain hate speech, false claims, personal attacks, or are clearly fake
- **Negative reviews are NOT removed just because worker is unhappy** (customers need honest feedback)

**Response to Reviews:**
- Workers can respond to reviews (publicly)
- Example: Customer says "Arrived 30 minutes late"
- Worker responds: "I apologize for the delay. There was heavy traffic on Thika Road. I'm working on better time management."

---

### **8.4 Badges & Certifications**

**Types of Badges:**

**Verification Badges:**
- ✓ "ID Verified" (All workers)
- ✓ "Background Checked" (Level 3 & 4)
- ✓ "Skills Verified" (Workers who passed practical tests)
- ✓ "In-Person Vetted" (Level 4 only)

**Experience Badges:**
- ⭐ "Top Rated" (Workers with 4.8+ rating and 50+ reviews)
- ⭐ "Rising Star" (New workers with 4.5+ rating and 10+ reviews)
- ⭐ "100+ Jobs Completed" (Milestone badge)

**Specialty Badges:**
- ✂️ "Kids' Haircuts Specialist" (Barbers)
- ✂️ "Hair Tattoo Artist" (Barbers)
- 🧹 "Deep Cleaning Expert" (Cleaners)
- 🔧 "Motorcycle Engine Specialist" (Mechanics)
- 💆 "Prenatal Massage Certified" (Massage therapists)

**Safety Badges:**
- 🛡️ "COVID-19 Vaccinated" (If worker provides proof)
- 🛡️ "Trained in First Aid" (For nannies, elderly care)

**How Badges Appear:**
- Displayed on worker profile
- Appear in search results (customers can filter by badges)
- **Marketing:** "Only workers with ✓ 'Background Checked' badge can access home cleaning jobs"

---

### **8.5 Guarantee & Insurance**

**Types of Protections:**

**DumuWaks Quality Guarantee:**
- "If you're not satisfied with the service, we'll:
  a) Send a different worker to re-do the job for FREE, OR
  b) Refund your money (100% money-back guarantee)"
- **Conditions:** Customer must report issue within 24 hours, provide photos or evidence
- **Cost:** Built into pricing (absorbs some refund costs, but builds trust)

**Theft & Damage Protection:**
- If worker steals or damages customer property, DumuWaks compensates customer up to:
  - KES 10,000 per incident (Level 3 workers: cleaners, trainers)
  - KES 30,000 per incident (Level 4 workers: nannies, massage)
- **Process:** Customer files claim, provides police report or evidence, DumuWaks investigates
- **Deduclible:** Customer pays KES 1,000 deductible (prevents false claims)
- **Worker Repayment:** Worker is charged for the claim amount (deducted from future earnings or deported to collections)

**Insurance Partnership:**
- Partner with Kenyan insurance companies (APA, Jubilee, Britam) for:
  - Workers' accident insurance (if worker gets injured on job)
  - Public liability insurance (if worker accidentally injures customer or damages property)
- **Cost:** KES 50-150 per worker per month (can be passed to workers as KES 500-1,500 annual fee)
- **Benefit:** Huge trust signal ("All workers are insured")

---

## 9. Implementation Timeline & Budget

### **Phase 1: MVP Verification (Months 1-3)**

**What We Build:**
- Basic ID verification (OCR + facial recognition)
- Phone verification (SMS OTP)
- Photo upload for profile
- Basic quiz (10 questions)
- 2 reference checks (automated phone calls)

**Technology Needed:**
- ID verification API (Onfido, Smile Identity, or local Kenyan provider)
- SMS OTP API (Africa's Talking, Twilio)
- Simple quiz platform (Typeform, Google Forms, or custom)
- Reference calling software (human staff or automated IVR)

**Cost per Worker:**
- ID verification: KES 40
- Phone verification: KES 5
- Quiz: KES 20
- Reference checks: KES 50
- **Total:** KES 115 per worker

**Target:** Onboard 500-1,000 workers in Phase 1
**Total Verification Budget:** KES 57,500 - 115,000

---

### **Phase 2: Enhanced Verification (Months 4-9)**

**What We Add:**
- Background checks (for Level 3 & 4 workers)
- Portfolio review (for barbers, hairdressers)
- Video assessments (for mechanics, electricians, plumbers)
- Community verification (for workers without references)

**Additional Cost per Worker:**
- Background check: KES 400 (for Level 3 & 4 only)
- Portfolio review: KES 70 (for creative categories)
- Video assessment: KES 150 (for skilled trades)
- Community verification: KES 100 (for workers without references)

**Total Cost per Worker (Phase 2):**
- Level 1 (Barbers): KES 115 + KES 70 = **KES 185**
- Level 2 (Mechanics): KES 115 + KES 150 = **KES 265**
- Level 3 (Cleaners): KES 115 + KES 400 = **KES 515**
- Level 4 (Nannies, Massage): KES 515 + KES 600 (in-person vetting) = **KES 1,115**

**Target:** Onboard 3,000-5,000 workers in Phase 2
**Total Verification Budget:** KES 945,000 - 1,575,000

---

### **Phase 3: Premium Verification (Months 10-18)**

**What We Add:**
- In-person vetting (for all Level 4 workers)
- Biometric fingerprinting (pilot with 500 workers)
- Insurance partnership (optional add-on for workers)
- Annual re-verification (for workers who joined in Phase 1)

**Additional Cost per Worker:**
- In-person vetting: KES 700 (for Level 4)
- Biometrics: KES 200 (pilot)
- Insurance: KES 100/month (paid by worker or DumuWaks)

**Total Verification Budget (Phase 3):** KES 2,000,000 - 3,500,000

---

## 10. Key Metrics & KPIs

**Verification Success Metrics:**

| Metric | Target (Phase 1) | Target (Phase 2) | Target (Phase 3) |
|--------|------------------|------------------|------------------|
| **Worker Application → Verified Conversion** | 60% | 70% | 75% |
| **Time to Verify (Average)** | 2-3 days | 5-7 days (background checks take time) | 7-10 days (in-person vetting) |
| **Verification Cost per Worker** | KES 115 | KES 265-515 | KES 500-1,115 |
| **Worker Churn (First 3 Months)** | <30% | <20% | <15% |
| **Customer Incidents (Theft, Violence)** | <1% of bookings | <0.5% of bookings | <0.1% of bookings |
| **Customer Satisfaction (NPS)** | +40 | +50 | +60 |

**Trust Metric:**
- **% of Customers Who Say "Verification is Important Reason They Chose DumuWaks"**
  - Target: 60%+ in customer surveys

---

## 11. Privacy & Data Security

### **Data Collection Principles**

1. **Minimize Data Collection:** Only collect data necessary for verification
2. **Informed Consent:** Workers must explicitly consent to each type of check
3. **Data Security:** Encrypt all sensitive data (ID numbers, background checks)
4. **Data Retention:** Delete data after worker leaves platform (except legal requirements)
5. **Data Access:** Only authorized DumuWaks staff can access verification data
6. **Third-Party Sharing:** Never share worker data with third parties (except background check agencies, and only with worker consent)

### **GDPR/Compliance Considerations**

- **Data Protection Act (Kenya, 2019):** Comply with Kenyan data protection laws
- **Worker Rights:** Workers can request to see their data, correct errors, or delete their account
- **Consent Management:** Clear opt-in for each type of verification (workers can refuse certain checks, but may not get access to certain categories)

---

## 12. Summary & Recommendations

### **Key Recommendations:**

1. **Start with Basic Verification (Phase 1):** ID + phone + quiz + references = KES 115 per worker. Keep it simple, iterate based on data.

2. **Category-Specific Verification:** Don't over-verify low-risk categories (barbers don't need criminal background checks). Focus resources on high-risk categories (cleaners, nannies, massage).

3. **Invest in Background Checks (Phase 2):** For Level 3 & 4 workers, this is non-negotiable. Customers will not trust cleaners or nannies without background checks. Cost (KES 400) is worth it.

4. **Use Technology to Scale:** Automated ID verification, SMS quizzes, and reference calling software keep costs low. Use human vetting (in-person) only for highest-risk categories.

5. **Build Trust Through Transparency:** Show customer reviews, ratings, and verification badges prominently. Video profiles are a game-changer for trust.

6. **Offer Insurance (Phase 3):** Partner with insurance companies to offer theft/damage protection. This is a massive competitive advantage vs Lynx/Jumia (neither offers this).

7. **Monitor Quality Continuously:** Don't just verify once and forget. Ongoing monitoring (reviews, mystery shoppers, re-verification) catches bad actors before they cause major incidents.

### **Budget Allocation (Year 1):**

| Item | Workers | Cost per Worker | Total |
|------|---------|-----------------|-------|
| **Phase 1 (Months 1-3)** | 1,000 | KES 115 | KES 115,000 |
| **Phase 2 (Months 4-9)** | 4,000 | KES 265-515 | KES 1,560,000 |
| **Phase 3 (Months 10-12)** | 2,000 | KES 500-1,115 | KES 1,630,000 |
| **Total Year 1** | **7,000 workers** | **Average KES 470** | **KES 3,305,000** |

**% of Platform Revenue:** If Year 1 revenue is KES 24.3M (from Category Prioritization document), verification costs (KES 3.3M) represent **13.6% of revenue**. This is acceptable and necessary for building trust.

---

**Last Updated:** January 18, 2026
**Next Review:** After Phase 1 (3 months), evaluate verification effectiveness and adjust
