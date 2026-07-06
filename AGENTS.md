# AGENTS.md

## Project Mission

Build a production-grade digital platform for a small mathematics coaching institute teaching Classes IX, X, XI, and XII.

This is not only a public website. The product consists of:

1. Public institute website
2. Student portal
3. Admin dashboard
4. Student and enrolment management
5. Batch and timetable management
6. Study material management
7. Homework management
8. Test management
9. Question bank
10. Fee tracking
11. Announcements
12. Bulk Excel/CSV imports
13. Structured website content management
14. PWA support

The primary administrator may frequently use the application from a phone. Mobile usability is a core requirement.

---

## Core Working Principle

Do not attempt to build the entire application in one uncontrolled pass.

Work in explicit phases.

Before changing code:

1. Inspect the repository.
2. Read this file completely.
3. Read relevant files in `docs/`.
4. Check the current Git status.
5. Understand existing patterns before introducing new ones.
6. Check current official documentation when library behaviour, APIs, configuration, security guidance, or compatibility may have changed.

Prefer official documentation over tutorials and blog posts.

Do not rely on outdated implementation patterns when current official documentation exists.

Do not invent APIs from memory for fast-moving libraries.

---

## Initial Repository State

The repository may initially be empty except for this file.

If the repository is empty:

1. Verify Node.js and npm versions.
2. Confirm Node.js 22 is available.
3. Research current stable mutually compatible package versions.
4. Do not immediately scaffold the application.
5. Complete Phase 0 first.

---

## Phase 0 Is Mandatory

Before application implementation, create:

- `docs/PRODUCT_SCOPE.md`
- `docs/ARCHITECTURE.md`
- `docs/DATABASE_DESIGN.md`
- `docs/ROUTES_AND_PERMISSIONS.md`
- `docs/IMPLEMENTATION_PLAN.md`

Phase 0 must:

1. Analyse all requirements in this file.
2. Resolve entity relationships.
3. Identify security boundaries.
4. Identify feature dependencies.
5. Identify contradictions and ambiguities.
6. Identify architectural risks.
7. Define implementation phases.
8. Recommend exact project initialisation and dependency strategy.
9. Stop for human review.

Do not initialise the application or begin major implementation until Phase 0 has been reviewed and approved.

---

## Technology Direction

Use the latest stable mutually compatible versions of the selected technologies.

Do not pin versions from this file without checking current official documentation.

### Runtime and Package Manager

- Node.js 22
- npm

### Application

- Next.js 16.x
- App Router
- React
- TypeScript with strict mode

### UI

- Tailwind CSS
- shadcn/ui
- Lucide icons

### Database

- PostgreSQL hosted on Supabase
- Prisma ORM

### Authentication

- Supabase Auth
- Current official Supabase SSR approach for Next.js
- Cookie-based server authentication

Do not use:

- NextAuth
- Auth.js
- Clerk
- Firebase Auth

### Storage

- Supabase Storage

### Forms and Validation

- Zod
- React Hook Form where useful

### Data Tables

- TanStack Table

### Charts

- Recharts only where charts provide actual value

### Spreadsheet Import

- SheetJS for `.xlsx`
- CSV support

### PWA

- Serwist

### Monitoring

- Sentry after core functionality is stable

---

## Architecture

Build one full-stack Next.js application.

Do not create:

- Separate Express backend
- Separate frontend application
- Microservices
- Generic CMS
- Generic page builder
- Native mobile application

Use:

- Server Components by default
- Client Components only when browser interactivity requires them
- Server Actions for suitable authenticated mutations
- Route Handlers for APIs, uploads, imports, webhooks, and endpoints where they are the clearer abstraction
- Prisma for normal application database access
- Supabase Auth for identity
- Supabase Storage for files

Do not use Supabase database client APIs for ordinary business queries when Prisma is the intended data layer.

Keep these concepts separate:

- Authentication identity
- Application user
- Role
- Student profile
- Teacher profile
- Academic enrolment

Do not create a giant `User` model containing all domain data.

---

## Product Roles

Support:

- `ADMIN`
- `TEACHER`
- `STUDENT`

### Admin

Can manage:

- Academic sessions
- Students
- Enrolments
- Batches
- Timetables
- Study materials
- Homework
- Tests
- Question bank
- Fees
- Announcements
- Public website content
- Imports
- Student account activation
- Archive and restore operations
- Appropriate settings

### Teacher

Design the schema and permission model to support teachers.

The initial institute may have one teacher.

Do not assume the product can only ever have one teacher.

Do not build a large teacher-specific portal unless required.

### Student

Can access only authorised data relevant to the student, including:

- Dashboard
- Current class
- Current batch
- Timetable
- Study materials
- Homework
- Test schedules
- Fee status
- Announcements
- Live class links

There is no parent portal.

Do not create parent authentication.

---

## Authentication Rules

There is no public student registration.

Student lifecycle:

1. Admin manually creates or imports a student record.
2. Student exists without requiring an authentication account.
3. Admin reviews the student.
4. Admin explicitly activates the account.
5. A secure supported Supabase provisioning or invitation flow is used.
6. Student receives login instructions.
7. Student accesses only authorised data.

Requirements:

- Secure login
- Logout
- Password reset
- Protected routes
- Server-side session validation
- Role-based access control
- Ownership checks
- Secure admin-only operations

Never trust:

- Client-supplied roles
- Client-supplied ownership claims
- Hidden UI as an authorisation mechanism

Never expose:

- Service-role keys
- Database credentials
- Passwords
- Tokens
- Private storage credentials

Do not store plain-text passwords.

---

## Academic Sessions

Academic sessions are required.

Examples:

- 2026-27
- 2027-28

Support:

- Create session
- Set active session
- View historical sessions
- Switch admin context between sessions

Relevant academic records must belong to the correct session.

Do not duplicate permanent student identity data for every session.

Model permanent students separately from session-specific enrolments.

Historical records must remain intact.

---

## Student Domain

A permanent student profile and an academic enrolment are separate concepts.

### Student

Contains long-lived identity and institute information.

### Enrolment

Associates a student with:

- Academic session
- Class
- Batch
- Joining information
- Enrolment status

Former students should be represented through status and historical enrolments.

Do not build a duplicate former-student system.

### Student Management

Support:

- Student profiles
- Student identifiers
- Contact information
- Joining date
- Account activation status
- Current and historical enrolments
- Class allocation through enrolment
- Batch allocation
- Archive and restore
- Search and filters

Do not collect unnecessary personal information.

---

## Batch Management

Support:

- Batch name
- Class
- Academic session
- Teacher
- Schedule
- Capacity if configured
- Public visibility
- Active status
- Archive state

Admin must be able to:

- Create batches
- Edit batches
- Assign students
- Remove students from current allocation safely
- View batch students
- Filter batches
- Archive and restore batches

---

## Timetable and Schedule

Students must see their own relevant schedule.

Support:

- Batch
- Day
- Start time
- End time
- Optional room or location
- Optional live class link

The mobile student experience must make today's and upcoming classes obvious.

Do not build video conferencing.

External meeting links may be used.

Only authorised students should see restricted batch links.

---

## Public Website

Build a polished, trustworthy, mobile-first public website.

The primary audience is:

- Students
- Parents considering admission

The website must not look like a generic SaaS landing page.

It should feel appropriate for a respected local mathematics teacher and coaching institute.

### Required Public Areas

- Home
- About the Teacher
- Courses for Classes IX, X, XI, and XII
- Teaching Methodology
- Results and Achievements
- Student Testimonials
- Optional Gallery
- Batch Timings
- Fee Information
- Free Study Resources
- Public Announcements
- FAQ
- Contact
- Map and Directions
- WhatsApp contact

### Home

Include:

- Institute identity
- Clear mathematics coaching proposition
- Classes IX to XII
- Strong primary call to action
- WhatsApp contact
- Important institute highlights
- Current batch information
- Teacher introduction
- Teaching approach
- Useful resources
- Contact and location

### About the Teacher

Support:

- Teacher photograph
- Qualifications
- Experience
- Teaching philosophy
- Subjects and classes taught
- Personal introduction

### Courses

Support separate course information for:

- Class IX
- Class X
- Class XI
- Class XII

Each course should support:

- Description
- Board or curriculum
- Syllabus overview
- Batch information
- Teaching approach
- Fee information if enabled

### Teaching Methodology

Explain the institute learning process clearly.

Example:

Concept → Practice → Doubt Resolution → Test → Improvement

Make this editable through structured admin content.

Do not build a generic page builder.

### Results and Achievements

Support:

- Student name
- Optional photograph
- Class
- Academic session
- Mathematics score
- Achievement
- Short testimonial
- Display order
- Published state

Hide the public section gracefully when no published content exists.

### Gallery

The gallery is optional.

Support real institute images and hide the section when empty.

### Free Study Resources

Support public resources such as:

- PDFs
- Formula sheets
- Important questions
- Sample papers
- Previous-year papers
- Other resources

### Contact

Support:

- Phone
- WhatsApp
- Address
- Nearby landmark
- Map
- Directions
- Opening hours if configured

Use a configurable WhatsApp number and pre-filled enquiry message.

A full admission enquiry CRM is not required initially.

---

## Student Portal

Build a mobile-first student portal.

### Dashboard

Show relevant information such as:

- Next class
- Recent announcements
- Current homework
- Upcoming tests
- Recent study materials
- Fee status summary

Do not overload the dashboard.

### My Course and Batch

Show:

- Current class
- Batch
- Academic session
- Schedule

### Study Materials

Students should only see material relevant to:

- Their class
- Their batch where restricted
- Their academic session
- Public or explicitly assigned content

Support:

- Notes
- PDFs
- Formula sheets
- Important questions
- Sample papers
- Previous-year papers
- Solutions
- Answer keys

### Homework

Show:

- Title
- Description
- Assigned date
- Due date
- Attachment
- Status where applicable

Student homework submission is not required initially.

Design the data model so it can be added later without a major rewrite.

### Tests

Show:

- Upcoming tests
- Test type
- Date
- Syllabus
- Chapter
- Question paper when published

Test result and marks functionality should remain modular.

Do not invent a complex analytics system.

### Fee Status

Students can view:

- Fee plan
- Payment records
- Pending amount
- Payment history
- Digital receipts where available

Students cannot edit fee records.

### Announcements

Students see relevant announcements based on:

- All students
- Class
- Batch
- Academic session

---

## Study Material Management

Admin must be able to:

- Create material
- Upload files
- Categorise material
- Publish and unpublish material
- Restrict visibility
- Search and filter
- Archive and restore

Support classification by:

- Academic session
- Class
- Chapter
- Topic
- Batch where needed
- Resource type

Storage access must be designed securely.

Do not make all private student files permanently public.

---

## Homework Management

Support:

- Title
- Description
- Class
- Batch
- Academic session
- Chapter or topic where applicable
- Assigned date
- Due date
- File attachment
- Published state
- Archive state

Admin should be able to:

- Create
- Edit
- Publish
- Unpublish
- Search
- Filter
- Archive
- Restore

Student submission is not required initially.

---

## Test Management

Support:

- Test title
- Test type
- Academic session
- Class
- Batch
- Chapter
- Topic
- Test date
- Duration
- Maximum marks
- Syllabus description
- Question paper attachment
- Published state
- Archive state

Test types should include clean support for:

- Chapter Test
- Unit Test
- Full Syllabus Test

Do not build separate technical systems for each test type.

Online MCQ testing is not required initially.

Manual marks and result functionality should be architecturally possible but modular if not included in the first implementation.

---

## Question Bank

The question bank is a core module.

Support:

- Class
- Chapter
- Topic
- Question text
- Question type
- Difficulty
- Marks
- Answer or solution
- Optional image
- Optional source
- Academic relevance
- Archive state

Question types should be extensible.

Support mathematical content properly.

Design question content to support:

- Normal text
- Unicode mathematics
- LaTeX expressions

Use a maintained LaTeX rendering solution compatible with the selected stack.

Do not store only rendered HTML.

Store source content in a reusable form.

Admin must be able to:

- Create questions
- Edit questions
- Search questions
- Filter questions
- Bulk import questions
- Archive and restore questions

Search and filtering should include:

- Class
- Chapter
- Topic
- Difficulty
- Question type
- Marks
- Active or archived status

---

## Bulk Import System

Build a reusable import system.

Initial import types:

1. Students
2. Question bank

Supported formats:

- `.xlsx`
- `.csv`

### Import Workflow

#### Step 1: Download Template

Provide a template for each import type.

#### Step 2: Upload File

Validate:

- File type
- File size
- Required columns

#### Step 3: Parse

Parse spreadsheet rows safely.

Do not write to the database yet.

#### Step 4: Map Columns

If practical, support mapping uploaded spreadsheet columns to expected fields.

At minimum, exact templates must work reliably.

#### Step 5: Validate

Validate every row.

Show:

- Valid rows
- Warnings
- Errors

Errors must identify:

- Row number
- Column
- Problem
- Expected value where useful

Examples:

- Batch does not exist
- Invalid class
- Required question text missing
- Duplicate record
- Invalid date

#### Step 6: Preview

Display the import in a mobile-responsive data table.

Allow filtering by:

- Valid
- Invalid
- Warning

Do not import automatically.

#### Step 7: Confirm

Only after explicit confirmation should records be written.

Use transactions where atomicity is required.

Use efficient bulk operations where safe.

Avoid one database request per row for large imports.

#### Step 8: Results

Show:

- Total rows
- Imported rows
- Skipped rows
- Failed rows

Allow downloading an error report.

---

## Import History

Create an import job system.

Track:

- Import ID
- Import type
- Original filename
- Imported by
- Started time
- Completed time
- Status
- Total rows
- Successful rows
- Failed rows
- Skipped rows
- Error summary

Statuses may include:

- Pending
- Validating
- Ready
- Processing
- Completed
- Completed With Errors
- Failed

Do not implement one-click import rollback initially.

Do not automatically activate student accounts after student import.

---

## Student Account Activation

Imported or manually created students may exist without authentication accounts.

Admin must be able to:

- Filter students without active accounts
- Select one or more students
- Activate accounts intentionally

The activation flow must:

- Avoid duplicate authentication accounts
- Handle partial failures safely
- Record audit events
- Provide clear success and failure feedback

Do not expose passwords in logs.

Do not store plain-text passwords.

Use a secure Supabase-supported invitation or account provisioning flow.

---

## Fee Management

Build lightweight fee tracking, not accounting software.

### Fee Plans

Support:

- Monthly
- Quarterly
- Yearly
- Custom instalment plan

A fee plan should support appropriate:

- Name
- Amount
- Frequency or structure
- Academic session
- Class or batch association where useful

### Student Fee Assignment

Associate students or enrolments with a fee plan.

### Payments

Track:

- Amount
- Payment date
- Payment method
- Reference
- Notes
- Recorded by

### Pending Fees

Calculate pending amounts correctly.

Do not store values that should always be derived unless there is a strong reason.

### Digital Receipts

Generate a printable receipt view.

PDF generation may be added if implementation remains maintainable.

### Not Required Initially

- Automatic WhatsApp fee reminders
- SMS fee reminders
- Online payment gateway

Design the system so these can be added later without building them now.

---

## Announcements

Support announcement audiences:

- Public
- All students
- Specific class
- Specific batch

Support:

- Title
- Content
- Publish date
- Expiry date where useful
- Priority
- Published state

Do not build:

- Full chat system
- Individual messaging system

---

## Admin Dashboard

The admin experience must be mobile-first.

Required dashboard areas:

- Overview
- Students
- Batches
- Academic sessions
- Timetable
- Study materials
- Homework
- Tests
- Question bank
- Fees
- Announcements
- Website content
- Gallery
- Imports
- Audit activity
- Settings

The dashboard overview should show useful operational information, not vanity metrics.

Possible widgets:

- Active students
- Current batches
- Upcoming tests
- Current homework
- Pending fees
- Recent imports
- Recent administrative activity

---

## Search and Filtering

Search and filtering are core application requirements.

Every meaningful admin listing must support relevant filters.

### Students

Support:

- Name
- Student ID
- Class
- Batch
- Academic session
- Account status
- Active or archived state

### Questions

Support:

- Class
- Chapter
- Topic
- Type
- Difficulty
- Marks
- Archive state

### Materials

Support:

- Class
- Chapter
- Type
- Academic session
- Published state
- Archive state

### Fees

Support:

- Student
- Class
- Batch
- Academic session
- Payment status

Use URL search parameters for admin list state where appropriate so filters are:

- Shareable
- Refresh-safe
- Back-button friendly

Debounce search where appropriate.

Do not load entire large datasets into the browser just to filter them.

---

## Website Content Management

Build structured content management.

Do not build a generic CMS.

Admin should be able to manage:

- Institute details
- Teacher profile
- Homepage content
- Course content
- Teaching methodology
- Results
- Testimonials
- Gallery
- Public resources
- Batch visibility
- Fee information
- FAQ
- Contact information
- WhatsApp settings
- Map and location information

Use typed structured models.

---

## Archive Instead of Delete

Do not permanently delete normal business records from the UI.

Support archive and restore for:

- Students
- Batches
- Tests
- Study materials
- Questions where appropriate
- Homework where appropriate

Archived records:

- Remain in the database
- Do not appear in normal active lists by default
- Are available through filters
- Preserve historical relationships
- Are restorable

Permanent deletion should not be exposed as a normal admin action.

Design this consistently.

---

## Auditability

Relevant entities should include appropriate metadata such as:

- `createdAt`
- `updatedAt`
- `createdBy`
- `updatedBy`

Where useful:

- `archivedAt`
- `archivedBy`

Do not add audit fields mechanically where they make no sense.

Create an audit log for important administrative actions such as:

- Student account activation
- Fee record changes
- Bulk imports
- Archive and restore operations
- Role changes
- Important content changes

Do not log:

- Passwords
- Tokens
- Secrets
- Sensitive authentication material

---

## Mobile-First Requirements

The application must work exceptionally well on phones.

This is especially important for:

- Admin student search
- Quick administrative actions
- Fee recording
- Uploading resources
- Viewing student details
- Student dashboard
- Homework
- Timetable
- Study materials

Requirements:

- No desktop-only interactions
- No hover-only actions
- Tables must have responsive mobile alternatives
- Important actions must be thumb-accessible
- Forms must work with mobile keyboards
- Dialogs must not overflow small screens
- File upload must work from phones
- Navigation must remain simple

Test important flows at mobile viewport sizes.

---

## PWA

Make the application installable as a PWA.

Support:

- Manifest
- App icons
- Installability
- Appropriate caching strategy
- Offline fallback page

Do not cache private student data carelessly.

Do not create offline mutation queues initially.

Authentication and private-data caching must be handled conservatively.

---

## Database Design Principles

Use relational modelling properly.

Expected core domains include concepts similar to:

- User
- Role
- Student
- Teacher
- AcademicSession
- Enrolment
- ClassLevel
- Batch
- BatchSchedule
- StudyMaterial
- Homework
- Test
- Chapter
- Topic
- Question
- FeePlan
- StudentFeeAssignment
- Payment
- Announcement
- Result
- Testimonial
- GalleryItem
- FAQ
- SiteSettings
- ImportJob
- ImportError
- AuditLog

These names are guidance, not a requirement to copy blindly.

Before implementing the schema:

1. Analyse the domain.
2. Identify cardinality.
3. Avoid duplicated data.
4. Decide which values should be enums.
5. Decide which entities need archive support.
6. Decide which entities need academic-session scoping.
7. Document important constraints.
8. Add useful indexes.
9. Add unique constraints where business rules require them.

Do not:

- Create a giant `User` table containing all student and teacher domain fields
- Use JSON columns as a substitute for proper relational modelling

Use JSON only when the data is genuinely flexible.

---

## Security Requirements

Treat security as a core requirement.

Implement:

- Server-side authorisation
- Role checks
- Ownership checks
- Input validation
- Secure file handling
- File type validation
- File size limits
- Protected private resources
- Safe error responses
- Rate limiting for abuse-sensitive public endpoints where appropriate
- Secure environment variable handling
- CSRF-aware mutation design
- Safe redirect handling

Never expose:

- Supabase service-role key
- Database credentials
- Internal errors
- Stack traces in production
- Private storage URLs without appropriate controls

Do not rely on hidden buttons for permissions.

Every protected operation must enforce permissions on the server.

---

## File Storage Requirements

Design storage buckets and paths intentionally.

Consider separation between:

- Public website assets
- Public study resources
- Private student resources
- Question images
- Homework files
- Test papers

Validate uploads.

Generate unique storage paths.

Do not trust original filenames as storage identifiers.

Store useful metadata in the database.

Handle replacement and archival without silently breaking references.

---

## Accessibility

Meet practical WCAG accessibility standards.

Requirements:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Proper labels
- Accessible dialogs
- Adequate contrast
- Meaningful error messages
- Correct heading hierarchy
- Reduced-motion consideration

Do not sacrifice accessibility for visual effects.

---

## Performance

Optimise intentionally.

Use:

- Server Components
- Pagination
- Database filtering
- Proper indexes
- Optimised images
- Lazy loading where useful
- Minimal client JavaScript
- Appropriate caching

Do not prematurely optimise.

Do not fetch large datasets unnecessarily.

Do not use global state for server data without a strong reason.

---

## UI and Design Direction

### Public Website

Should feel:

- Trustworthy
- Academic
- Modern
- Warm
- Mathematics-focused
- Local and personal

Avoid:

- Generic SaaS appearance
- Excessive gradients
- Excessive glassmorphism
- Giant meaningless hero sections
- Fake statistics
- Stock-photo-heavy design
- Unnecessary animations

### Admin Dashboard

Should feel:

- Calm
- Efficient
- Dense enough to be useful
- Easy on mobile
- Consistent

### Student Portal

Should feel:

- Simple
- Focused
- Encouraging
- Easy to scan

Create a coherent design system.

Use consistent:

- Typography
- Spacing
- Radius
- Form patterns
- Empty states
- Loading states
- Error states
- Confirmation flows

---

## Error Handling

Every feature must handle:

- Loading
- Empty
- Error
- Success
- Permission denied
- Archived state where relevant

Forms must:

- Show field-level errors
- Preserve entered values after validation failure
- Prevent accidental duplicate submissions
- Show useful success feedback

Do not use browser alerts for production interactions.

---

## Testing

Set up a practical testing strategy.

### Unit Tests

Prioritise critical domain logic such as:

- Fee calculations
- Import validation
- Permission helpers
- Data transformation

### Integration Tests

Cover important server operations.

### End-to-End Tests

Cover critical flows such as:

1. Admin login
2. Create academic session
3. Create batch
4. Create student
5. Assign student to batch
6. Import students
7. Import question bank
8. Activate student account
9. Upload study material
10. Student login
11. Student views authorised material
12. Record fee payment
13. Student views fee status
14. Archive and restore a record

Use maintained tools compatible with the current stack.

Do not create meaningless tests merely to increase coverage.

---

## Code Quality Rules

Use:

- TypeScript strict mode
- Clear module boundaries
- Feature-oriented organisation where useful
- Reusable domain services where logic is non-trivial
- Shared validation schemas where appropriate
- Consistent error handling
- Consistent naming

Do not:

- Use `any` casually
- Create giant components
- Put database queries directly throughout UI components
- Duplicate validation logic
- Duplicate permission logic
- Create unnecessary abstractions
- Create a generic repository pattern just for ceremony
- Add comments that merely restate code
- Leave dead code
- Leave undocumented placeholder TODOs

Prefer readable code over clever code.

Do not add comments in code unless they explain non-obvious reasoning or are explicitly requested.

---

## Environment Setup

Create:

- `.env.example`

Never commit real secrets.

Document all required variables.

Expected categories include:

- Application URL
- Supabase URL
- Supabase public key
- Supabase server-only credentials where truly required
- Database connection URLs
- Sentry configuration when enabled

Explain which variables are:

- Public
- Server-only
- Required locally
- Required in production

---

## Local Development Documentation

The final README must include:

1. Prerequisites
2. Installation
3. Environment setup
4. Supabase setup
5. Database migration
6. Seed process
7. Running locally
8. Running tests
9. Production build
10. Deployment
11. Initial admin creation
12. Storage setup

Provide a seed script for useful development data.

Do not seed fake production users automatically.

---

## Git and Development Process

Initialise Git if the folder is not already a repository.

Create a strong `.gitignore`.

Make logical commits at stable milestones if Git operations are available and appropriate.

Do not commit:

- `.env`
- Secrets
- Generated build output
- Uploaded files
- Temporary import files

Before major changes:

1. Understand the existing implementation.
2. Check for uncommitted work.
3. Avoid destructive rewrites.
4. Preserve working functionality.

Do not revert user changes that are unrelated to the current task.

---

## Implementation Phases

### Phase 0: Research and Planning

- Research current official docs
- Analyse requirements
- Create planning documents
- Recommend project initialisation
- Stop for human review

### Phase 1: Foundation

- Initialise project
- Configure TypeScript
- Configure UI foundation
- Configure linting and formatting
- Environment validation
- Base layouts
- Error handling foundation

### Phase 2: Data and Authentication

- Final database design
- Prisma setup
- Supabase setup
- Authentication
- Roles
- Permissions
- Academic sessions
- Audit foundation

### Phase 3: Admin Foundation

- Admin shell
- Responsive navigation
- Dashboard
- Search and filtering patterns
- Archive patterns
- Reusable tables and mobile list views

### Phase 4: Core Institute Management

- Students
- Enrolments
- Batches
- Timetable
- Account activation

### Phase 5: Academic Content

- Chapters
- Topics
- Study materials
- Homework
- Tests
- Question bank
- LaTeX rendering

### Phase 6: Bulk Imports

- Import architecture
- Templates
- Student import
- Question import
- Validation
- Preview
- Error reports
- Import history

### Phase 7: Fees and Announcements

- Fee plans
- Student fee assignments
- Payments
- Pending fee calculations
- Receipts
- Announcements

### Phase 8: Student Portal

- Dashboard
- Timetable
- Materials
- Homework
- Tests
- Fees
- Announcements
- Live class links

### Phase 9: Public Website

- Home
- Teacher profile
- Courses
- Methodology
- Results
- Testimonials
- Gallery
- Resources
- FAQ
- Contact
- WhatsApp

### Phase 10: PWA and Production Hardening

- PWA
- Accessibility review
- Security review
- Performance review
- Error handling review
- Tests
- Sentry
- Production build
- Deployment documentation

---

## Validation Gate After Every Phase

At the end of every phase:

1. Run linting.
2. Run type checking.
3. Run relevant tests.
4. Run a production build.
5. Fix all errors.
6. Review security implications.
7. Review mobile behaviour.
8. Update documentation.
9. Summarise:
   - What was implemented
   - Important decisions
   - Files changed
   - Tests performed
   - Known limitations
   - What the next phase will do

Do not continue while the project is knowingly broken.

---

## Parallel Work Rules

Parallelise only work that is genuinely independent.

Safe examples after architecture is stable:

- Public website visual work and isolated admin UI work
- Independent test-writing tasks
- Documentation updates
- Separate feature modules with already-defined interfaces

Do not parallelise:

- Initial database schema design
- Authentication architecture
- Permission model design
- Shared import architecture
- Cross-cutting refactors
- Multiple tasks that edit the same central files

Before delegating parallel work:

1. Define ownership boundaries.
2. Define expected outputs.
3. Define files or modules each task may touch.
4. Ensure shared contracts are already stable.
5. Review and integrate each result carefully.

---

## Decision-Making Rules

When requirements are ambiguous:

1. Check this file.
2. Check existing product documentation.
3. Check architecture documentation.
4. Prefer the simplest design that supports future growth.
5. Do not invent major product features.
6. Ask for clarification only when the decision significantly changes:
   - Product behaviour
   - Security
   - Data model
   - Cost
   - External services
   - User experience

For small implementation details, make a sensible decision and document it.

---

## Product Non-Goals

Do not build:

- Parent portal
- Attendance system
- Native mobile app
- Custom video conferencing
- Full accounting software
- Full CRM
- Individual chat system
- Online payment gateway initially
- Automatic WhatsApp or SMS system initially
- Complex student performance analytics
- AI-generated insights
- AI progress reports
- Full online examination platform initially
- Generic CMS
- Generic page builder
- Multi-branch management initially

Do not expand scope without approval.

---

## First Task in an Empty Repository

When the repository contains only this file, execute Phase 0 only.

1. Read this file completely.
2. Inspect the environment.
3. Verify Node.js 22 and npm.
4. Research current official documentation for the selected stack.
5. Analyse all requirements.
6. Identify contradictions, missing dependencies, security risks, and unnecessary complexity.
7. Create:
   - `docs/PRODUCT_SCOPE.md`
   - `docs/ARCHITECTURE.md`
   - `docs/DATABASE_DESIGN.md`
   - `docs/ROUTES_AND_PERMISSIONS.md`
   - `docs/IMPLEMENTATION_PLAN.md`
8. Recommend the exact project initialisation command and dependency strategy.
9. Present a concise Phase 0 summary.
10. Stop and wait for approval.

Do not initialise the application.

Do not begin Phase 1.
