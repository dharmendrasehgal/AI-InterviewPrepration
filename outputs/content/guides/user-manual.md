# User Manual — Interview Preparation Platform
## Complete Product Guide with Screen Reference

> **Document version:** 1.1.0-alpha.1  
> **Last updated:** 2026-06-03  
> **Audience:** Candidates, Experts, Administrators  
> **Update policy:** This manual is updated with every phase implementation. Phase badges mark when each screen was introduced.

| Badge | Meaning |
|-------|---------|
| `[P1]` | Available in Phase 1 (v1.0.0 GA) |
| `[P2]` | Arriving in Phase 2 (v1.1.0, Q4 2026) |
| `[P3]` | Planned for Phase 3 (v1.2.0, Q1 2027) |

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Getting Started — Registration & Login](#2-getting-started)
3. [Candidate Guide](#3-candidate-guide)
   - 3.1 Dashboard
   - 3.2 Question Bank
   - 3.3 AI Mock Interview — Setup
   - 3.4 AI Mock Interview — Consent
   - 3.5 AI Mock Interview — Recording
   - 3.6 Score Report
   - 3.7 Feedback Archive
4. [Expert Guide](#4-expert-guide) `[P2]`
   - 4.1 Expert Registration & Approval
   - 4.2 Expert Dashboard
   - 4.3 Managing Availability
   - 4.4 Conducting Live Sessions
   - 4.5 Submitting Rubric Evaluations
5. [Marketplace & Booking — Candidate](#5-marketplace--booking)  `[P2]`
   - 5.1 Browse Experts
   - 5.2 Expert Profile
   - 5.3 Booking a Session
   - 5.4 Live Session Room
6. [Industry Playbooks](#6-industry-playbooks)  `[P2]`
7. [Admin Guide](#7-admin-guide)
   - 7.1 Expert Approval Queue
8. [Account & Settings](#8-account--settings)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Platform Overview

The Interview Preparation Platform helps job seekers practice interviews and connect with verified expert mentors. It combines AI-powered mock sessions with a human expert marketplace.

```
┌─────────────────────────────────────────────────────────────────────┐
│                  INTERVIEW PREPARATION PLATFORM                      │
│                       platform.com                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│          Ace Your Next Interview                                     │
│                                                                      │
│   Practice AI-powered mock interviews, get scored instantly,        │
│   and track your improvement over time — all in one platform.       │
│                                                                      │
│         ┌─────────────────────┐  ┌─────────────────────┐           │
│         │  Get started free   │  │       Sign in        │           │
│         └─────────────────────┘  └─────────────────────┘           │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│   Everything you need to prepare                                     │
│                                                                      │
│  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ │
│  │ 🤖                │ │ 📚                │ │ 📊                │ │
│  │ AI Mock           │ │ Question Bank     │ │ Score Reports     │ │
│  │ Interviews        │ │                   │ │                   │ │
│  │                   │ │ Browse thousands  │ │ Per-question      │ │
│  │ Practice with     │ │ of behavioral,    │ │ breakdowns:       │ │
│  │ an AI interviewer │ │ technical, and    │ │ speech rate,      │ │
│  │ that gives        │ │ situational       │ │ filler words,     │ │
│  │ instant feedback  │ │ questions         │ │ keyword match     │ │
│  └───────────────────┘ └───────────────────┘ └───────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```
*Landing page — `platform.com`*   `[P1]`

---

## 2. Getting Started

### 2.1 Create an Account  `[P1]`

Navigate to **platform.com/register**.

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Create an account                                   │
│  Fill in your details to get started for free.      │
│                                                      │
│  Full name                                           │
│  ┌────────────────────────────────────────────────┐ │
│  │ Jane Smith                                     │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Email                                               │
│  ┌────────────────────────────────────────────────┐ │
│  │ you@example.com                                │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Password                                            │
│  ┌────────────────────────────────────────────────┐ │
│  │ At least 8 characters                          │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  I am a…                                             │
│  ┌────────────────────────────────────────────────┐ │
│  │ ▼ Candidate — practicing for interviews        │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │              Create account                    │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│       Already have an account?  Sign in             │
└──────────────────────────────────────────────────────┘
```
*Registration screen — `/register`*

**Fields:**
| Field | Requirement |
|-------|-------------|
| Full name | Required, 1–100 characters |
| Email | Valid email address |
| Password | Minimum 8 characters, at least one uppercase letter and one number |
| Role | `Candidate` (practicing) or `Expert` (conducting sessions) |

**After registration (development / local environment):** Your account is auto-verified and immediately active. In production, check your email for a verification link.

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Check your email                                    │
│  We sent a confirmation link to                      │
│  jane@example.com.                                   │
│  Click it to activate your account and start.        │
│                                                      │
│       Already confirmed?  Sign in                   │
└──────────────────────────────────────────────────────┘
```
*Email confirmation screen (production only)*

---

### 2.2 Sign In  `[P1]`

Navigate to **platform.com/login**.

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Sign in to your account                            │
│                                                      │
│  Email                                               │
│  ┌────────────────────────────────────────────────┐ │
│  │ you@example.com                                │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Password                                            │
│  ┌────────────────────────────────────────────────┐ │
│  │ ••••••••                                       │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │                  Sign in                       │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│       Don't have an account?  Register              │
└──────────────────────────────────────────────────────┘
```
*Login screen — `/login`*

> **Security note:** Your access token is stored in memory only, never in browser storage. If you close the tab, you will need to sign in again. This is by design and protects your account from token theft.

---

## 3. Candidate Guide

### 3.1 Dashboard  `[P1]`

After signing in as a **candidate**, you land on your personal dashboard at `/dashboard`.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Dashboard                          ┌──────────────────────────────┐│
│                                     │  Start AI Mock Interview    │ ││
│                                     └──────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │ Total Sessions  │  │  Average Score  │  │     Best Score      │ │
│  │                 │  │                 │  │                     │ │
│  │       12        │  │       74        │  │        91           │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │
│                                                                      │
│  Recent Sessions                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Date          Type    Score    Report                         │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ Jun 2, 2026   [AI]    [74]     View                          │  │
│  │ May 28, 2026  [AI]    [91]     View                          │  │
│  │ May 20, 2026  [AI]    [68]     View                          │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```
*Candidate dashboard — `/dashboard`*

**Dashboard stats:**
- **Total Sessions** — count of all completed mock sessions
- **Average Score** — mean Clarity Score across all scored sessions
- **Best Score** — highest Clarity Score achieved

**Score badge colours:**

| Colour | Score range | Meaning |
|--------|-------------|---------|
| Green | 70–100 | Strong performance |
| Yellow | 50–69 | Room for improvement |
| Red | 0–49 | Needs significant work |

**Empty state (first visit):**

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                           🎤                                         │
│                      No sessions yet                                 │
│           Start your first AI mock interview to see                  │
│                    your scores here.                                 │
│                                                                      │
│              ┌──────────────────────────────────┐                   │
│              │      Start your first session    │                   │
│              └──────────────────────────────────┘                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Question Bank  `[P1]`

Browse the full library at `/questions`. Filter by type, level, industry, and tags.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Question Bank                                                       │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 🔍  Search questions…                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Filters:  [Type ▼]  [Level ▼]  [Industry ▼]                       │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Tell me about a time you had to meet a tight deadline.       │  │
│  │ [Behavioral]  [Mid]  [General]                    [Bookmark] │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ How would you design a URL shortener?                        │  │
│  │ [Technical]   [Senior]  [Software Eng]            [Bookmark] │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ Describe a conflict with a colleague and how you resolved it.│  │
│  │ [Situational] [Entry]  [General]                  [Bookmark] │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│                      [Load more]                                     │
└─────────────────────────────────────────────────────────────────────┘
```
*Question bank — `/questions`*

**Filter options:**

| Filter | Options |
|--------|---------|
| Type | Behavioral, Technical, Situational, Role-Specific |
| Level | Entry, Mid, Senior, Executive |
| Industry | General, Software Engineering, Medical/Residency |

Click **Bookmark** to save a question to your personal bookmark list. Access bookmarks from the navigation menu under **My Questions**.

---

### 3.3 AI Mock Interview — Setup  `[P1]`

Click **Start AI Mock Interview** from your dashboard or navigate to `/mock-session`.

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Start an AI Mock Interview                          │
│  Choose your track, level, and number of questions,  │
│  then begin when ready.                              │
│                                                      │
│  Track                                               │
│  ┌────────────────────────────────────────────────┐ │
│  │ ▼ General Career                               │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Level                                               │
│  ┌────────────────────────────────────────────────┐ │
│  │ ▼ Mid                                          │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Number of questions                                 │
│  ┌────────────────────────────────────────────────┐ │
│  │ ▼ 5 questions (~15 min)                        │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │              Start Session                     │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```
*Session setup — `/mock-session`*

**Track options:**

| Track | Best for |
|-------|---------|
| General Career | Any role — communication, situational, behavioural questions |
| Software Engineering | Engineering roles — system design, algorithms, coding culture |
| Medical / Residency | Medical school / residency applicants — MMI, case, ethical scenarios |

**Session duration guide:**

| Questions | Approx. time |
|-----------|-------------|
| 3 | ~10 minutes |
| 5 | ~15 minutes |
| 7 | ~20 minutes |
| 10 | ~30 minutes |

---

### 3.4 AI Mock Interview — Consent  `[P1]`

Before the session begins, you must consent to recording.

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│         Recording Consent Required                   │
│                                                      │
│  This session will record your audio and video       │
│  responses. Recordings are used only to generate     │
│  your AI score report and are auto-deleted after     │
│  90 days.                                            │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ ☐  I have read and agree to the recording     │ │
│  │    consent terms                               │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │  Decline         │  │  Accept & Continue       │ │
│  └──────────────────┘  └──────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```
*Consent dialog — shown automatically before session starts*

**Important:** Consent is logged with a timestamp and stored securely. Declining returns you to the dashboard.

After accepting, the platform checks your camera and microphone:

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              ◌  (spinning)                           │
│                                                      │
│       Checking camera and microphone…                │
│                                                      │
└──────────────────────────────────────────────────────┘
```
*Camera check screen*

**If camera access is denied by your browser:** Click the camera icon in your browser's address bar and allow microphone and camera access, then refresh.

---

### 3.5 AI Mock Interview — Recording  `[P1]`

Each question appears on a card. Read it carefully, then record your answer.

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  Question 2 of 5                      ● Recording — 01:23           │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │  Tell me about a time you disagreed with your manager      │   │
│  │  and how you handled the situation.                         │   │
│  │                                                             │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │ Tip: Use the STAR method — describe the Situation,  │   │   │
│  │  │ Task, Action, and Result.                           │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  │                                                             │   │
│  │  [Framework: STAR]                                          │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────┘   │   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   Stop & Submit                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```
*Session in progress — recording state — `/mock-session/[sessionId]`*

**Before recording starts:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  Question 1 of 5                                                     │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Walk me through your most challenging project and what     │   │
│  │  you learned from it.                                       │   │
│  │                                                             │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │ Tip: Use the STAR method — describe the Situation,  │   │   │
│  │  │ Task, Action, and Result.                           │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  │                                                             │   │
│  │  Ready to record when you are.                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   Start Recording                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```
*Session in progress — ready to record*

**Recording tips:**
- Speak clearly at a natural pace (target: 120–160 words per minute)
- Avoid filler words: "um", "uh", "like", "you know"
- Use the STAR method for behavioural questions
- Aim for 60–120 seconds per answer
- Click **Stop & Submit** when you finish your answer — the next question loads automatically

**After the last question:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                          ✅                                          │
│                                                                      │
│                   Session complete!                                  │
│                                                                      │
│      Generating your score report… redirecting shortly.             │
│                           ◌                                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```
*Session complete — auto-redirects to score report in ~2 seconds*

---

### 3.6 Score Report  `[P1]`

Your score report is generated by AI within ~45 seconds. While it processes:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Score Report                                                        │
│                                                                      │
│       Generating your score report…                                 │
│                                                                      │
│  ████████████████████████████░░░░░░░░░░  (skeleton loading)        │
│  ████████████████████░░░░░░░░░░░░░░░░░░                            │
│  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```
*Score report loading — auto-refreshes every 5 seconds*

**Score report — fully loaded:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  Score Report                                                        │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  OVERALL CLARITY SCORE                      │  │
│  │                                                              │  │
│  │                         74                                  │  │
│  │                      out of 100                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Session Summary                                             │  │
│  │                                                              │  │
│  │     148 WPM           12 filler words        82% keywords   │  │
│  │    Avg WPM           Total filler words      Avg relevance  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Per-Question Breakdown                                              │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Question 1                               [Clarity 81] ▼     │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ Clarity Score       ████████████████████░░░░  81 / 100      │  │
│  │                                                              │  │
│  │    155 WPM             8 filler words          87% keywords  │  │
│  │                                                              │  │
│  │  ℹ Tip: Your pacing is excellent. Reduce filler words       │  │
│  │    like "um" — try pausing silently instead.                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Question 2                               [Clarity 68] ▶     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Question 3                               [Clarity 74] ▶     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────┐                                       │
│  │  Back to Feedback Archive│                                       │
│  └──────────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────────┘
```
*Score report — fully loaded — `/feedback/[sessionId]`*

**Metrics explained:**

| Metric | What it measures | Target range |
|--------|-----------------|--------------|
| Clarity Score | Composite AI score (0–100) | 70+ = strong |
| WPM | Words per minute speech rate | 120–160 WPM |
| Filler words | Count of "um", "uh", "like", "you know" per response | < 5 per answer |
| Keyword relevance | % of expected topic keywords found in your answer | 75%+ |

**Score badge colours:**

| Colour | Range | Meaning |
|--------|-------|---------|
| Green | 70–100 | Strong — ready for interviews |
| Yellow | 50–69 | Progressing — keep practising |
| Red | 0–49 | Needs work — review improvement tips |

Click any question row to expand its detail, including the AI-generated improvement tip.

---

### 3.7 Feedback Archive  `[P1]`

View all your past sessions at `/feedback`.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Feedback Archive                                                    │
│                                                                      │
│  Filters:  [All types ▼]  [All scores ▼]  [Date ▼]                │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Jun 2, 2026   General Career · Mid    [AI]    [74]  View   │  │
│  │  May 28, 2026  Software Eng · Senior   [AI]    [91]  View   │  │
│  │  May 20, 2026  General Career · Entry  [AI]    [68]  View   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```
*Feedback archive — `/feedback`*

> **Phase 2 addition:** Live session results and expert rubric evaluations will also appear here, alongside AI sessions, each clearly labelled with a `[Live]` badge.

---

## 4. Expert Guide  `[P2]`

> **Status:** Phase 2 — arriving Q4 2026 (v1.1.0)

### 4.1 Expert Registration & Approval  `[P2]`

Register at `/register` and select **Expert — conducting mock interviews**. After account creation, complete your expert profile.

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Complete Your Expert Profile                        │
│  Your profile is reviewed by our team before         │
│  going live in the marketplace.                      │
│                                                      │
│  Professional headline                               │
│  ┌────────────────────────────────────────────────┐ │
│  │ Senior Software Engineer @ Google, 8 years     │ │
│  └────────────────────────────────────────────────┘ │
│  (10–150 characters)                                 │
│                                                      │
│  Bio                                                 │
│  ┌────────────────────────────────────────────────┐ │
│  │ I help engineers land FAANG roles through      │ │
│  │ realistic system design and behavioural        │ │
│  │ mock interviews…                               │ │
│  └────────────────────────────────────────────────┘ │
│  (50–2000 characters)                                │
│                                                      │
│  Specialisation track                                │
│  ┌────────────────────────────────────────────────┐ │
│  │ ▼ Software Engineering                         │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Industry                                            │
│  ┌────────────────────────────────────────────────┐ │
│  │ ▼ Software Engineering                         │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Years of experience                                 │
│  ┌────────────────────────────────────────────────┐ │
│  │ 8                                              │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Session rate (USD per 50-min session)               │
│  ┌────────────────────────────────────────────────┐ │
│  │ $75                                            │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │           Submit for Review                    │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```
*Expert profile application — `/experts/apply`*

**Approval timeline:** Your profile is reviewed within 2–5 business days. You will receive an email when approved or if additional information is needed.

**Approval states:**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Application Status                                 │
│                                                     │
│  ○──────────────●──────────────○                   │
│  Submitted    Under Review   Approved               │
│                                                     │
│  Your application is under review.                  │
│  You will be notified by email when approved.       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 4.2 Expert Dashboard  `[P1/P2]`

**Phase 1 (current):** The Expert Dashboard shows a Coming Soon state for live session features.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Expert Dashboard                                                    │
│  Conduct live mock interviews and help candidates prepare.           │
│                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌────────────┐  │
│  │ Question Bank       │  │ Live Sessions       │  │ Candidate  │  │
│  │                     │  │                     │  │ Reviews    │  │
│  │ Browse and filter   │  │ Scheduling and live │  │            │  │
│  │ the full question   │  │ session management  │  │ View and   │  │
│  │ library to prepare  │  │ are coming in       │  │ submit     │  │
│  │ for sessions.       │  │ Phase 2.            │  │ feedback   │  │
│  │                     │  │                     │  │ (Phase 2)  │  │
│  │ [Browse Questions]  │  │   [Coming Soon]     │  │[Coming Soon│  │
│  └─────────────────────┘  └─────────────────────┘  └────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  🚀  Expert features are expanding in Phase 2               │  │
│  │  Live session scheduling, candidate progress tracking,       │  │
│  │  earnings dashboard, and feedback templates will be          │  │
│  │  available in the next release.                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```
*Expert dashboard (Phase 1) — `/dashboard`*

**Phase 2 Expert Dashboard (Q4 2026):**

```
┌─────────────────────────────────────────────────────────────────────┐
│  Expert Dashboard                       [Manage Availability]        │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │ Sessions Today  │  │  This Month     │  │   Avg Rating        │ │
│  │       2         │  │      14         │  │   ★ 4.8 / 5.0      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │
│                                                                      │
│  Upcoming Sessions                                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Today, 2:00 PM      Jane Smith     [Software Eng · Senior]  │  │
│  │                                     [Start Session]          │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  Today, 4:30 PM      Raj Kumar      [General Career · Mid]   │  │
│  │                                     [Start Session]          │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  Tomorrow, 10:00 AM  Li Wei         [Medical · Entry]        │  │
│  │                                     [Prepare]                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Pending Rubric Reviews                                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Jane Smith   Jun 2, 2026   [Submit Rubric →]               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```
*Expert dashboard (Phase 2) — `/dashboard`*

---

### 4.3 Managing Availability  `[P2]`

Set the times you are available for sessions at `/experts/me/availability`.

```
┌─────────────────────────────────────────────────────────────────────┐
│  My Availability                          [Add New Slot]             │
│                                                                      │
│  ◀  June 2026  ▶                                                    │
│                                                                      │
│  Mon   Tue   Wed   Thu   Fri   Sat   Sun                            │
│   1     2     3     4     5     6     7                              │
│         ●           ●                                                │
│   8     9    10    11    12    13    14                              │
│   ●           ●           ●                                          │
│                                                                      │
│  ● = slot available    ■ = slot booked                               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Add New Availability Slot                                   │  │
│  │                                                              │  │
│  │  Start date & time:  ┌──────────────┐                       │  │
│  │                      │ 2026-06-15   │                       │  │
│  │                      │ 14:00        │                       │  │
│  │                      └──────────────┘                       │  │
│  │  End date & time:    ┌──────────────┐                       │  │
│  │                      │ 2026-06-15   │                       │  │
│  │                      │ 15:00        │                       │  │
│  │                      └──────────────┘                       │  │
│  │                     (minimum 50 minutes)                     │  │
│  │                                                              │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │                    Add Slot                          │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```
*Availability management — `/experts/me/availability`*

**Rules:**
- Slots must be at least 50 minutes long
- Slots cannot overlap with existing slots
- You cannot delete a slot that is already booked

---

### 4.4 Conducting Live Sessions  `[P2]`

At session time, click **Start Session** from your dashboard. The live session room opens in your browser.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Live Session — Jane Smith                     ● Live  00:23:41      │
│                                                                      │
│  ┌──────────────────────────┐  ┌──────────────────────────────────┐ │
│  │                          │  │                                  │ │
│  │   [Expert Video Feed]    │  │      [Candidate Video Feed]      │ │
│  │                          │  │                                  │ │
│  │       (You)              │  │          Jane Smith              │ │
│  │                          │  │                                  │ │
│  └──────────────────────────┘  └──────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Session Notes (private)                                     │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ Strong STAR structure on Q1. Pace too fast on Q2…      │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │ 🎤 Mute  │  │ 📷 Cam   │  │ 💬 Chat  │  │  ■ End Session      │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```
*Live session room — `/sessions/live/[sessionId]`  (Expert view)*

**Expert controls:**

| Control | Action |
|---------|--------|
| Mute | Toggle your microphone on/off |
| Cam | Toggle your camera on/off |
| Chat | Open side chat panel |
| End Session | End the call and proceed to rubric submission |

---

### 4.5 Submitting Rubric Evaluations  `[P2]`

After ending a session, you are prompted to submit a rubric evaluation within 24 hours.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Submit Rubric Evaluation                                            │
│  Session with Jane Smith — Jun 2, 2026                               │
│                                                                      │
│  Rate the candidate 1–5 on each dimension.                           │
│                                                                      │
│  Communication Clarity                                               │
│  ○ 1  ○ 2  ○ 3  ● 4  ○ 5                                           │
│                                                                      │
│  Technical Depth                                                     │
│  ○ 1  ○ 2  ○ 3  ○ 4  ● 5                                           │
│                                                                      │
│  Structured Thinking                                                 │
│  ○ 1  ○ 2  ● 3  ○ 4  ○ 5                                           │
│                                                                      │
│  Confidence                                                          │
│  ○ 1  ○ 2  ○ 3  ● 4  ○ 5                                           │
│                                                                      │
│  Overall Score (computed automatically): 4.0 / 5.0                  │
│                                                                      │
│  Feedback for candidate (required — min 20 characters)               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Jane demonstrated excellent system design instincts. The      │ │
│  │ trade-off discussion on Q2 was particularly strong. Work on   │ │
│  │ conciseness — some answers ran long. Recommend practicing     │ │
│  │ the 90-second rule per answer.                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Private notes for yourself (optional — not shown to candidate)      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Follow up on distributed systems gaps in next session.        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                   Submit Evaluation                            │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```
*Rubric evaluation form — `/rubric/[sessionId]/submit`*

**Rubric dimensions:**

| Dimension | What to assess |
|-----------|---------------|
| Communication Clarity | How clearly and concisely the candidate expressed their ideas |
| Technical Depth | Accuracy and depth of technical knowledge demonstrated |
| Structured Thinking | Use of frameworks (STAR, problem decomposition, trade-off analysis) |
| Confidence | Composure, eye contact, tone, and assertiveness |

> The `overall_score` is computed automatically as the average of the four dimensions and cannot be edited directly.

---

## 5. Marketplace & Booking — Candidate  `[P2]`

### 5.1 Browse Experts  `[P2]`

Discover verified experts at `/experts`.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Expert Marketplace                                                  │
│                                                                      │
│  Track: [All ▼]   Industry: [All ▼]   Max rate: [$100 ▼]          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  🧑‍💻  Alex Chen                                              │  │
│  │  Senior SWE @ Google · 8 yrs experience                     │  │
│  │  [Software Engineering]   $75 / 50 min                       │  │
│  │  ★ 4.9  (42 sessions)                  [View Profile →]     │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  👩‍⚕️  Dr. Priya Sharma                                       │  │
│  │  Chief Resident, Internal Medicine · 6 yrs experience        │  │
│  │  [Medical / Residency]    $60 / 50 min                       │  │
│  │  ★ 5.0  (18 sessions)                  [View Profile →]     │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  👨‍💼  Marcus Johnson                                          │  │
│  │  Career Coach, ex-McKinsey · 12 yrs experience               │  │
│  │  [General Career]         $90 / 50 min                       │  │
│  │  ★ 4.7  (89 sessions)                  [View Profile →]     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│                         [Load more]                                  │
└─────────────────────────────────────────────────────────────────────┘
```
*Expert marketplace — `/experts`*

---

### 5.2 Expert Profile  `[P2]`

View a full expert profile at `/experts/[id]`.

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Back to Marketplace                                               │
│                                                                      │
│  🧑‍💻  Alex Chen                                  [$75 / 50 min]     │
│  Senior SWE @ Google · Software Engineering · 8 years experience    │
│  ★ 4.9   42 sessions completed                                      │
│                                                                      │
│  About                                                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  I specialise in helping engineers land roles at top-tier    │  │
│  │  tech companies. My sessions focus on system design,         │  │
│  │  behavioral interviews, and coding walk-through technique.   │  │
│  │  I have personally interviewed 200+ candidates at Google.    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Available Sessions                                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Mon Jun 9    2:00 PM – 3:00 PM    [Book this slot]         │  │
│  │  Mon Jun 9    4:00 PM – 5:00 PM    [Book this slot]         │  │
│  │  Wed Jun 11   10:00 AM – 11:00 AM  [Book this slot]         │  │
│  │  Thu Jun 12   1:00 PM – 2:00 PM    [Book this slot]         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```
*Expert profile page — `/experts/[id]`*

---

### 5.3 Booking a Session  `[P2]`

Click **Book this slot** to proceed to the booking confirmation screen.

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Confirm Your Booking                                │
│                                                      │
│  Expert:    Alex Chen                               │
│  Date:      Monday, June 9, 2026                    │
│  Time:      2:00 PM – 3:00 PM (your timezone)       │
│  Duration:  50 minutes                              │
│  Rate:      $75                                     │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │  ✓  Add to Google Calendar                    │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌──────────────────┐  ┌────────────────────────┐   │
│  │   Cancel         │  │   Confirm Booking      │   │
│  └──────────────────┘  └────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```
*Booking confirmation — `/book/[expertId]`*

**After confirming:** Both you and the expert receive an email confirmation. The session appears in your **My Bookings** dashboard panel. You will receive reminder emails 24 hours and 30 minutes before the session.

**Cancellation policy:** Cancel at least 24 hours before the session to avoid a late-cancellation flag on your account.

---

### 5.4 Live Session Room — Candidate View  `[P2]`

At session time, join from your dashboard or the emailed link.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Live Session — Alex Chen                      ● Live  00:08:17      │
│                                                                      │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐ │
│  │                              │  │                              │ │
│  │    [Expert Video Feed]       │  │    [Your Video Feed]         │ │
│  │                              │  │                              │ │
│  │        Alex Chen             │  │           You                │ │
│  │                              │  │                              │ │
│  └──────────────────────────────┘  └──────────────────────────────┘ │
│                                                                      │
│  ● Recording                                                         │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                          │
│  │ 🎤 Mute  │  │ 📷 Cam   │  │ 💬 Chat  │                          │
│  └──────────┘  └──────────┘  └──────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
```
*Live session room — candidate view — `/sessions/live/[sessionId]`*

> **Before joining:** You must give recording consent (same flow as AI sessions). The recording indicator shows while your session is being recorded.

---

## 6. Industry Playbooks  `[P2]`

Structured preparation guides at `/playbooks`.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Industry Playbooks                                                  │
│                                                                      │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐ │
│  │  💼  General Career          │  │  💻  Software Engineering    │ │
│  │                              │  │                              │ │
│  │  Interview fundamentals,     │  │  System design, algorithms,  │ │
│  │  STAR method, negotiation,   │  │  behavioural at tech         │ │
│  │  and universal frameworks.   │  │  companies, coding culture.  │ │
│  │                              │  │                              │ │
│  │  [Open Playbook →]           │  │  [Open Playbook →]           │ │
│  └──────────────────────────────┘  └──────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────┐                                   │
│  │  🏥  Medical / Residency     │                                   │
│  │                              │                                   │
│  │  MMI stations, ethical       │                                   │
│  │  scenarios, and clinical     │                                   │
│  │  case structure.             │                                   │
│  │                              │                                   │
│  │  [Open Playbook →]           │                                   │
│  └──────────────────────────────┘                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```
*Playbooks index — `/playbooks`*

**Inside a playbook:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  Software Engineering Interview Playbook                v3           │
│                                                                      │
│  ┌────────────────────┐  ┌──────────────────────────────────────┐  │
│  │ Contents           │  │  1. Interview Process Overview       │  │
│  │                    │  │                                      │  │
│  │ ▸ Interview Process│  │  Tech interviews at top companies    │  │
│  │ ▸ System Design    │  │  typically follow 5–6 rounds…        │  │
│  │ ▸ Coding Rounds    │  │                                      │  │
│  │ ▸ Behavioural Q&A  │  │  ┌──────────────────────────────┐   │  │
│  │ ▸ Offer Negotiation│  │  │  Practice questions          │   │  │
│  │                    │  │  │  • Describe your interview   │   │  │
│  │                    │  │  │    process experience        │   │  │
│  │                    │  │  │  • What do you look for…    │   │  │
│  │                    │  │  └──────────────────────────────┘   │  │
│  └────────────────────┘  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```
*Playbook reader — `/playbooks/software_engineering`*

---

## 7. Admin Guide

### 7.1 Expert Approval Queue  `[P1/P2]`

> Admin panel is partially available in Phase 1 for user management. Expert approval queue launches in Phase 2.

Access the admin panel at `/admin`. Only users with `role: admin` can see this section.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Admin — Expert Applications                                         │
│                                                                      │
│  Pending review: 3                                                   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Alex Chen          Software Eng     Applied: Jun 1, 2026   │  │
│  │  "Senior SWE @ Google, 8 years"                              │  │
│  │                              [View Profile] [Approve] [Reject]│  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  Dr. Priya Sharma   Medical          Applied: Jun 2, 2026   │  │
│  │  "Chief Resident, Internal Medicine, 6 years"                │  │
│  │                              [View Profile] [Approve] [Reject]│  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```
*Admin expert approval queue — `/admin/experts`*

**Approve:** Sets `experts.status = 'approved'` and upgrades `users.role` to `'expert'`. The expert receives an approval email and their profile goes live in the marketplace immediately.

**Suspend:** Sets `experts.status = 'suspended'` and reverts `users.role` to `'candidate'`. The profile is hidden from the marketplace.

---

## 8. Account & Settings

### Navigation Bar  `[P1]`

```
┌─────────────────────────────────────────────────────────────────────┐
│  Interview Prep   Dashboard  Questions  Sessions  Playbooks  [P2]   │
│                                                          [Account ▼]│
└─────────────────────────────────────────────────────────────────────┘
```

**Account menu options:**
- Profile & Settings
- My Bookings `[P2]`
- Feedback Archive
- Sign out

### Signing Out  `[P1]`

Click **Account → Sign out** in the navigation bar. Your session is immediately invalidated on the server and the refresh cookie is cleared. You are returned to the login screen.

> **Important:** Because access tokens are stored in memory only, closing the browser tab also effectively ends your session. Re-opening the app will silently refresh your session using the HttpOnly cookie if it has not expired (30-day lifetime).

---

## 9. Troubleshooting

### Camera & Microphone Issues

**Problem:** "Checking camera and microphone…" hangs and never advances.

**Solution:**
1. Check that your browser has camera and microphone permission for `platform.com`
2. In Chrome: click the padlock icon → Site settings → Camera and Microphone → Allow
3. Refresh the page and try again
4. If the issue persists, try a different browser (Chrome 110+ or Firefox 110+ recommended)

---

### Score Report Not Loading

**Problem:** Score report shows "Generating your score report…" for more than 5 minutes.

**Solution:**
1. The report auto-refreshes every 5 seconds — wait up to 60 seconds after a 5-question session
2. If the spinner persists past 5 minutes, there may be a temporary AI service delay
3. Navigate to Feedback Archive → click the session row — the report will load when ready
4. If still unavailable after 30 minutes, contact `support@platform.com` with your session ID (visible in the URL)

---

### Booking Slot Not Available Anymore

**Problem:** A slot showed as available but booking fails with "Slot is not available".

**Solution:** Another candidate booked the slot in the same moment. Return to the expert's profile and select a different available slot.

---

### Live Session Not Connecting  `[P2]`

**Problem:** Video call shows "Connecting…" and does not establish a connection.

**Checklist:**
1. Ensure you are on a supported browser: Chrome 110+, Firefox 110+, Edge 110+
2. Disable any VPN that may block WebRTC traffic
3. Check that your corporate firewall allows UDP port 3478 (STUN) and the TURN server URL shown in the error
4. Try switching from Wi-Fi to a wired connection
5. If both parties are behind strict NATs, the platform uses a TURN relay — connection may take up to 10 seconds longer than usual

---

### Session Consent Declined / Not Recorded

**Problem:** The consent dialog reappears even after accepting.

**Solution:** Consent is stored on the server linked to your session ID. If you see the dialog again, it may mean the consent API call failed. Check your internet connection and accept again. If the issue persists, start a new session.

---

*For support: `support@platform.com` | Documentation: `platform.com/help`*  
*Manual version: 1.1.0-alpha.1 | Updated: 2026-06-03*

---

## Appendix A — Screen Reference Map

```
platform.com/
│
├── /                        Landing page                    [P1]
├── /register                Create account                  [P1]
├── /login                   Sign in                         [P1]
│
├── /dashboard               Candidate or Expert dashboard   [P1/P2]
│
├── /questions               Question bank browse            [P1]
│
├── /mock-session            AI session setup                [P1]
│   └── /[sessionId]         AI session room                 [P1]
│
├── /feedback                Feedback archive                [P1]
│   └── /[sessionId]         Score report detail             [P1]
│
├── /experts                 Expert marketplace              [P2]
│   ├── /apply               Expert profile application      [P2]
│   ├── /me                  Expert self-profile             [P2]
│   ├── /me/availability     Manage availability slots       [P2]
│   └── /[id]                Public expert profile           [P2]
│
├── /book/[expertId]         Booking confirmation            [P2]
│
├── /sessions/live/[id]      Live session room               [P2]
│
├── /playbooks               Playbook index                  [P2]
│   └── /[track]             Playbook reader                 [P2]
│
├── /account/bookings        My bookings list                [P2]
│
└── /admin                   Admin panel                     [P1/P2]
    └── /experts             Expert approval queue           [P2]
```

---

## Appendix B — API Endpoint Quick Reference

> For full API documentation see [outputs/content/api-docs/api-overview.md](../api-docs/api-overview.md)

| Action | Method | Endpoint | Phase |
|--------|--------|----------|-------|
| Register | POST | `/api/v1/auth/register` | P1 |
| Login | POST | `/api/v1/auth/login` | P1 |
| Refresh token | POST | `/api/v1/auth/refresh` | P1 |
| Logout | POST | `/api/v1/auth/logout` | P1 |
| List questions | GET | `/api/v1/questions` | P1 |
| Search questions | GET | `/api/v1/questions/search` | P1 |
| Bookmark question | POST | `/api/v1/questions/:id/bookmark` | P1 |
| Create mock session | POST | `/api/v1/mock-sessions` | P1 |
| Get score report | GET | `/api/v1/mock-sessions/:id/score` | P1 |
| List sessions archive | GET | `/api/v1/feedback` | P1 |
| Apply as expert | POST | `/api/v1/experts` | P2 |
| Browse experts | GET | `/api/v1/experts` | P2 |
| Add availability slot | POST | `/api/v1/experts/:id/availability` | P2 |
| Create booking | POST | `/api/v1/bookings` | P2 |
| Cancel booking | POST | `/api/v1/bookings/:id/cancel` | P2 |
| Start live session | POST | `/api/v1/live-sessions/:id/start` | P2 |
| Submit rubric | POST | `/api/v1/rubric/:sessionId` | P2 |
| List playbooks | GET | `/api/v1/playbooks` | P2 |
| Get playbook | GET | `/api/v1/playbooks/:track` | P2 |
| Approve expert | POST | `/api/v1/experts/:id/approve` | P2 |
