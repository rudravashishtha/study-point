import "dotenv/config";
import { Role, AppUserStatus, ClassLevel } from "@prisma/client";
import { db as prisma } from "../src/lib/db";

async function main() {
  console.log("Seeding minimal test data...");

  // 1. AppUser (Admin)
  const adminAuthId = "test-admin-auth-id";
  const admin = await prisma.appUser.upsert({
    where: { supabaseAuthUserId: adminAuthId },
    update: {},
    create: {
      supabaseAuthUserId: adminAuthId,
      email: "admin@example.com",
      role: Role.ADMIN,
      status: AppUserStatus.ACTIVE,
      createdBy: "SEED",
    },
  });

  // 2. Curriculum
  const board = await prisma.board.upsert({
    where: { code: "CBSE" },
    update: {},
    create: { name: "CBSE", code: "CBSE", createdBy: admin.id },
  });

  const subject = await prisma.subject.upsert({
    where: { code: "MATH" },
    update: {},
    create: { name: "Mathematics", code: "MATH", createdBy: admin.id },
  });

  const track =
    (await prisma.curriculumTrack.findFirst()) ||
    (await prisma.curriculumTrack.create({
      data: {
        boardId: board.id,
        classLevel: ClassLevel.X,
        subjectId: subject.id,
        displayName: "CBSE Class 10 Math",
        createdBy: admin.id,
      },
    }));

  // 3. Academic Session
  const session = await prisma.academicSession.upsert({
    where: { name: "2026-2027" },
    update: {},
    create: {
      name: "2026-2027",
      startsOn: new Date("2026-04-01"),
      endsOn: new Date("2027-03-31"),
      isActive: true,
      createdBy: admin.id,
    },
  });

  // 4. Batch & Teacher
  const teacher =
    (await prisma.teacher.findFirst()) ||
    (await prisma.teacher.create({
      data: {
        displayName: "John Doe",
        email: "teacher@example.com",
        active: true,
      },
    }));

  const batch =
    (await prisma.batch.findFirst()) ||
    (await prisma.batch.create({
      data: {
        name: "Class 10 - Alpha",
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        isActive: true,
        capacity: 30,
      },
    }));

  // Teacher Assignment
  const existingAssignment = await prisma.teacherAssignment.findFirst({
    where: { teacherId: teacher.id, batchId: batch.id },
  });
  if (!existingAssignment) {
    await prisma.teacherAssignment.create({
      data: {
        teacherId: teacher.id,
        batchId: batch.id,
      },
    });
  }

  // 5. Student & Enrolment
  const student =
    (await prisma.student.findFirst()) ||
    (await prisma.student.create({
      data: {
        fullName: "Alice Smith",
        studentCode: "STU-2026-0001",
        accountStatus: "active",
      },
    }));

  const existingEnrolment = await prisma.enrolment.findFirst({
    where: { studentId: student.id, academicSessionId: session.id },
  });
  if (!existingEnrolment) {
    await prisma.enrolment.create({
      data: {
        studentId: student.id,
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        batchId: batch.id,
        joiningDate: new Date(),
        status: "active",
      },
    });
  }

  // 6. Homepage Sections
  const homepageSections = [
    { key: "hero", label: "Hero Section", order: 1, locked: true },
    { key: "why-choose-us", label: "Why Choose Us", order: 2, locked: false },
    { key: "courses", label: "Courses Offered", order: 3, locked: false },
    { key: "teacher-intro", label: "Teacher Introduction", order: 4, locked: false },
    { key: "performance-metrics", label: "Performance Metrics", order: 5, locked: false },
    { key: "methodology", label: "Teaching Methodology", order: 6, locked: false },
    { key: "testimonials", label: "Testimonials", order: 7, locked: false },
    { key: "gallery", label: "Photo Gallery", order: 8, locked: false },
    { key: "announcements", label: "Announcements", order: 9, locked: false },
    { key: "featured-resources", label: "Featured Resources", order: 10, locked: false },
    { key: "faq", label: "FAQ", order: 11, locked: false },
    { key: "contact", label: "Contact / Admission CTA", order: 12, locked: true },
  ];

  for (const section of homepageSections) {
    await prisma.homepageSection.upsert({
      where: { sectionKey: section.key },
      update: { displayOrder: section.order, locked: section.locked },
      create: {
        sectionKey: section.key,
        title: section.label,
        displayOrder: section.order,
        isVisible: true,
        locked: section.locked,
      },
    });
  }
  console.log(`Seeded ${homepageSections.length} homepage sections`);

  // 7. SiteSettings singleton
  const existingSettings = await prisma.siteSettings.findFirst();
  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: {
        instituteName: "Study Point",
        tagline: "Excellence in Mathematics",
        heroHeadline: "Mathematics Coaching for Classes IX–XII",
        heroSubheadline: "Concept → Practice → Doubt Resolution → Test → Improvement",
        heroCtaText: "Enquire Now",
        heroCtaTarget: "/admissions",
        admissionsOpen: true,
        resourcesEnabled: true,
        resourcesSearchEnabled: true,
        feeDisplayEnabled: true,
        createdBy: admin.id,
      },
    });
    console.log("Created SiteSettings singleton");
  }

  console.log("Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
