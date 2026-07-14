import "dotenv/config";
import { Role, AppUserStatus, ClassLevel } from '@prisma/client'
import { db as prisma } from '../src/lib/db'

async function main() {
  console.log('Seeding minimal test data...')
  
  // 1. AppUser (Admin)
  const adminAuthId = 'test-admin-auth-id'
  const admin = await prisma.appUser.upsert({
    where: { supabaseAuthUserId: adminAuthId },
    update: {},
    create: {
      supabaseAuthUserId: adminAuthId,
      email: 'admin@example.com',
      role: Role.ADMIN,
      status: AppUserStatus.ACTIVE,
      createdBy: 'SEED'
    },
  })

  // 2. Curriculum
  const board = await prisma.board.upsert({
    where: { code: 'CBSE' },
    update: {},
    create: { name: 'CBSE', code: 'CBSE', createdBy: admin.id }
  })
  
  const subject = await prisma.subject.upsert({
    where: { code: 'MATH' },
    update: {},
    create: { name: 'Mathematics', code: 'MATH', createdBy: admin.id }
  })

  const track = await prisma.curriculumTrack.findFirst() || await prisma.curriculumTrack.create({
    data: {
      boardId: board.id,
      classLevel: ClassLevel.X,
      subjectId: subject.id,
      displayName: 'CBSE Class 10 Math',
      createdBy: admin.id
    }
  })

  // 3. Academic Session
  const session = await prisma.academicSession.upsert({
    where: { name: '2026-2027' },
    update: {},
    create: {
      name: '2026-2027',
      startsOn: new Date('2026-04-01'),
      endsOn: new Date('2027-03-31'),
      isActive: true,
      createdBy: admin.id
    }
  })

  // 4. Batch & Teacher
  const teacher = await prisma.teacher.findFirst() || await prisma.teacher.create({
    data: {
      displayName: 'John Doe',
      email: 'teacher@example.com',
      active: true,
    }
  })

  const batch = await prisma.batch.findFirst() || await prisma.batch.create({
    data: {
      name: 'Class 10 - Alpha',
      academicSessionId: session.id,
      curriculumTrackId: track.id,
      isActive: true,
      capacity: 30,
    }
  })

  // Teacher Assignment
  await prisma.teacherAssignment.findFirst({ where: { teacherId: teacher.id, batchId: batch.id } }) || await prisma.teacherAssignment.create({
    data: {
      teacherId: teacher.id,
      batchId: batch.id,
    }
  })

  // 5. Student & Enrolment
  const student = await prisma.student.findFirst() || await prisma.student.create({
    data: {
      fullName: 'Alice Smith',
      studentCode: 'STU-2026-0001',
      accountStatus: 'active',
    }
  })

  await prisma.enrolment.findFirst({ where: { studentId: student.id, academicSessionId: session.id } }) || await prisma.enrolment.create({
    data: {
      studentId: student.id,
      academicSessionId: session.id,
      curriculumTrackId: track.id,
      batchId: batch.id,
      joiningDate: new Date(),
      status: 'active',
    }
  })

  console.log('Seeding complete!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
