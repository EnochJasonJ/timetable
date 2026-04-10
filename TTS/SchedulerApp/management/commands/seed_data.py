"""
Seed the database with realistic college timetable data.
Based on the uploaded sample timetable: II Year AIML, Sem 4.

Designed so every section fills ALL available periods (no empty slots).

Usage:
    python manage.py seed_data
    python manage.py seed_data --flush  # Clear all data first
"""
import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from SchedulerApp.models import (
    Department, Program, AcademicYear, Room, TimeSlot,
    Faculty, Subject, Section, CourseOffering, UserProfile,
)


class Command(BaseCommand):
    help = 'Seed the database with realistic sample college data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush', action='store_true',
            help='Delete all existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['flush']:
            self.stdout.write('Flushing existing data...')
            CourseOffering.objects.all().delete()
            Section.objects.all().delete()
            Subject.objects.all().delete()
            Faculty.objects.all().delete()
            TimeSlot.objects.all().delete()
            Room.objects.all().delete()
            AcademicYear.objects.all().delete()
            Program.objects.all().delete()
            Department.objects.all().delete()
            UserProfile.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Data flushed.'))

        self._seed_departments()
        self._seed_programs()
        self._seed_academic_years()
        self._seed_rooms()
        self._seed_time_slots()
        self._seed_faculty()
        self._seed_subjects()
        self._seed_sections()
        self._seed_course_offerings()
        self._seed_users()

        self.stdout.write(self.style.SUCCESS('\n✅ Seed data loaded successfully!'))
        self.stdout.write(self.style.SUCCESS('   Login credentials:'))
        self.stdout.write(self.style.SUCCESS('   • admin / admin123 (Super Admin)'))
        self.stdout.write(self.style.SUCCESS('   • hod_cse / hod123 (HOD)'))
        self.stdout.write(self.style.SUCCESS('   • faculty1 / faculty123 (Faculty)'))
        self.stdout.write(self.style.SUCCESS('   • student1 / student123 (Student)'))

    def _seed_departments(self):
        self.stdout.write('  Creating departments...')
        depts = [
            ('CSE', 'Computer Science & Engineering'),
            ('ECE', 'Electronics & Communication Engineering'),
            ('EEE', 'Electrical & Electronics Engineering'),
            ('ME', 'Mechanical Engineering'),
            ('CE', 'Civil Engineering'),
        ]
        for code, name in depts:
            Department.objects.get_or_create(code=code, defaults={'name': name})

    def _seed_programs(self):
        self.stdout.write('  Creating programs...')
        cse = Department.objects.get(code='CSE')
        ece = Department.objects.get(code='ECE')
        programs = [
            (cse, 'AIML', 'Artificial Intelligence & Machine Learning', 4),
            (cse, 'CSE', 'Computer Science & Engineering', 4),
            (cse, 'DS', 'Data Science', 4),
            (ece, 'ECE', 'Electronics & Communication Engineering', 4),
        ]
        for dept, code, name, dur in programs:
            Program.objects.get_or_create(
                code=code, defaults={'department': dept, 'name': name, 'duration_years': dur}
            )

    def _seed_academic_years(self):
        self.stdout.write('  Creating academic years...')
        AcademicYear.objects.get_or_create(
            label='2025-2026',
            defaults={
                'start_date': datetime.date(2025, 6, 15),
                'end_date': datetime.date(2026, 5, 31),
                'is_current': True,
            }
        )
        AcademicYear.objects.get_or_create(
            label='2024-2025',
            defaults={
                'start_date': datetime.date(2024, 6, 15),
                'end_date': datetime.date(2025, 5, 31),
                'is_current': False,
            }
        )

    def _seed_rooms(self):
        self.stdout.write('  Creating rooms...')
        rooms = [
            ('A101', 'Lecture Hall 1', 'Block A', 60, 'CLASSROOM'),
            ('A102', 'Lecture Hall 2', 'Block A', 60, 'CLASSROOM'),
            ('A103', 'Lecture Hall 3', 'Block A', 60, 'CLASSROOM'),
            ('A104', 'Lecture Hall 6', 'Block A', 60, 'CLASSROOM'),
            ('A201', 'Lecture Hall 4', 'Block A', 80, 'CLASSROOM'),
            ('A202', 'Lecture Hall 5', 'Block A', 80, 'CLASSROOM'),
            ('B101', 'Seminar Hall 1', 'Block B', 120, 'SEMINAR'),
            ('LAB-1', 'CS Lab 1', 'Block C', 40, 'LAB'),
            ('LAB-2', 'CS Lab 2', 'Block C', 40, 'LAB'),
            ('LAB-3', 'ML Lab', 'Block C', 40, 'LAB'),
            ('LAB-4', 'DS Lab', 'Block C', 40, 'LAB'),
        ]
        for num, name, bldg, cap, rtype in rooms:
            Room.objects.get_or_create(
                number=num,
                defaults={'name': name, 'building': bldg,
                          'seating_capacity': cap, 'room_type': rtype}
            )

    def _seed_time_slots(self):
        self.stdout.write('  Creating time slots...')
        slots = [
            # (slot_num, start, end, slot_type, label)
            (1, '08:45', '09:40', 'REGULAR', 'Period 1'),
            (2, '09:40', '10:35', 'REGULAR', 'Period 2'),
            (3, '10:35', '10:50', 'BREAK', 'Morning Break'),
            (4, '10:50', '11:45', 'REGULAR', 'Period 3'),
            (5, '11:45', '12:30', 'REGULAR', 'Period 4'),
            (6, '12:30', '13:10', 'LUNCH', 'Lunch Break'),
            (7, '13:10', '14:00', 'REGULAR', 'Period 5'),
            (8, '14:00', '14:45', 'REGULAR', 'Period 6'),
            (9, '14:45', '15:35', 'REGULAR', 'Period 7'),
        ]
        days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
        for day in days:
            for snum, start, end, stype, label in slots:
                sh, sm = map(int, start.split(':'))
                eh, em = map(int, end.split(':'))
                TimeSlot.objects.get_or_create(
                    day=day, slot_number=snum,
                    defaults={
                        'start_time': datetime.time(sh, sm),
                        'end_time': datetime.time(eh, em),
                        'slot_type': stype,
                        'label': label,
                    }
                )

    def _seed_faculty(self):
        self.stdout.write('  Creating faculty members...')
        cse = Department.objects.get(code='CSE')
        ece = Department.objects.get(code='ECE')
        faculty_data = [
            ('CSE001', 'M', 'Karthikeyan', 'Dr. MK', cse, 'PROF'),
            ('CSE002', 'R', 'Abirami', 'RA', cse, 'ASSOC_PROF'),
            ('CSE003', 'S', 'Priya', 'SP', cse, 'ASST_PROF'),
            ('CSE004', 'K', 'Venkatesh', 'KV', cse, 'ASST_PROF'),
            ('CSE005', 'A', 'Lakshmi', 'AL', cse, 'ASST_PROF'),
            ('CSE006', 'P', 'Ramesh', 'PR', cse, 'ASST_PROF'),
            ('CSE007', 'N', 'Deepa', 'ND', cse, 'ASST_PROF'),
            ('CSE008', 'B', 'Santhosh', 'BS', cse, 'ASST_PROF'),
            ('CSE009', 'R', 'Kumar', 'RK', cse, 'ASSOC_PROF'),
            ('CSE010', 'G', 'Sundari', 'GS', cse, 'ASST_PROF'),
            ('CSE011', 'D', 'Mohan', 'DM', cse, 'ASST_PROF'),
            ('CSE012', 'V', 'Saranya', 'VS', cse, 'ASST_PROF'),
            ('ECE001', 'T', 'Rajesh', 'TR', ece, 'ASSOC_PROF'),
            ('ECE002', 'L', 'Meena', 'LM', ece, 'ASST_PROF'),
        ]
        for fid, fn, ln, init, dept, des in faculty_data:
            Faculty.objects.get_or_create(
                faculty_id=fid,
                defaults={
                    'first_name': fn, 'last_name': ln,
                    'initials': init, 'department': dept,
                    'designation': des,
                    'email': f'{fid.lower()}@college.edu',
                }
            )

    def _seed_subjects(self):
        self.stdout.write('  Creating subjects...')
        subjects = [
            # (code, name, short_name, type, credits, weekly_hours, max_students, lab_dur)
            # ── II Year AIML Sem 4 ──
            ('MA3452', 'Probability and Statistics', 'P&S', 'THEORY', 4, 5, 60, 1),
            ('CS3452', 'Operating Systems', 'OS', 'THEORY', 3, 4, 60, 1),
            ('CS3491', 'Machine Learning', 'ML', 'THEORY', 3, 5, 60, 1),
            ('CS3492', 'Database Management Systems', 'DBMS', 'THEORY', 3, 4, 60, 1),
            ('CW3551', 'Full Stack Development', 'FSD', 'THEORY', 3, 4, 60, 1),
            ('GE3451', 'Environmental Science', 'EVS', 'COMMON', 2, 2, 60, 1),
            ('CS3481', 'Machine Learning Lab', 'ML Lab', 'LAB', 1, 3, 40, 3),
            ('CS3482', 'DBMS Lab', 'DBMS Lab', 'LAB', 1, 3, 40, 3),
            ('CW3552', 'Full Stack Development Lab', 'FSD Lab', 'LAB', 2, 3, 40, 3),
            # Activity / Institutional Hours (AIML)
            ('AC3401', 'Library Hour', 'LIB', 'COMMON', 0, 1, 60, 1),
            ('AC3402', 'Aptitude Training', 'APTI', 'COMMON', 0, 1, 60, 1),
            ('AC3403', 'Tutor Ward Meeting', 'TWH', 'COMMON', 0, 1, 60, 1),
            ('AC3404', 'Soft Skills', 'SS', 'COMMON', 0, 2, 60, 1),
            ('AC3405', 'Project with Design Thinking', 'PDT', 'COMMON', 0, 3, 60, 1),
            ('AC3406', 'Center of Excellence', 'COE', 'COMMON', 0, 1, 60, 1),
            ('AC3407', 'Universal Human Values', 'UHV', 'COMMON', 0, 2, 60, 1),
            # ── III Year CSE Sem 5 ──
            ('CS3301', 'Data Structures', 'DSA', 'THEORY', 3, 5, 60, 1),
            ('CS3302', 'Computer Networks', 'CN', 'THEORY', 3, 4, 60, 1),
            ('CS3303', 'Compiler Design', 'CD', 'THEORY', 3, 4, 60, 1),
            ('PE3001', 'Cloud Computing', 'CC', 'ELECTIVE', 3, 3, 60, 1),
            ('CS3401', 'Data Science', 'DS', 'THEORY', 3, 4, 60, 1),
            ('CS3402', 'Data Science Lab', 'DS Lab', 'LAB', 1, 3, 40, 3),
            ('CS3501', 'Software Engineering', 'SE', 'THEORY', 3, 4, 60, 1),
            ('CS3502', 'Software Engineering Lab', 'SE Lab', 'LAB', 1, 3, 40, 3),
            # Activity / Institutional Hours (CSE)
            ('AC3501', 'Placement Training', 'PT', 'COMMON', 0, 3, 60, 1),
            ('AC3502', 'Project Work', 'PW', 'COMMON', 0, 5, 60, 1),
            ('AC3503', 'Technical Seminar', 'TS', 'COMMON', 0, 2, 60, 1),
            ('AC3504', 'Library Hour', 'LIB', 'COMMON', 0, 2, 60, 1),
            # ── I Year ECE Sem 1 ──
            ('MA1101', 'Engineering Mathematics I', 'Maths I', 'THEORY', 4, 5, 60, 1),
            ('PH1101', 'Engineering Physics', 'Physics', 'THEORY', 3, 5, 60, 1),
            ('CY1101', 'Engineering Chemistry', 'Chemistry', 'THEORY', 3, 5, 60, 1),
            ('GE1101', 'Problem Solving & Python', 'Python', 'THEORY', 3, 5, 60, 1),
            ('EC1101', 'Basic Electrical Engineering', 'BEE', 'THEORY', 3, 5, 60, 1),
            ('GE1102', 'Heritage of Tamil', 'Tamil', 'COMMON', 1, 2, 60, 1),
            ('PH1102', 'Physics Lab', 'Phy Lab', 'LAB', 1, 3, 40, 3),
            ('GE1103', 'Python Lab', 'Py Lab', 'LAB', 1, 3, 40, 3),
            # Activity / Institutional Hours (ECE)
            ('AC1101', 'Engineering Graphics', 'EG', 'THEORY', 2, 3, 60, 1),
            ('AC1102', 'Sports / Yoga', 'Sports', 'COMMON', 0, 3, 60, 1),
            ('AC1103', 'Library Hour', 'LIB', 'COMMON', 0, 2, 60, 1),
            ('AC1104', 'Soft Skills', 'SS', 'COMMON', 0, 1, 60, 1),
        ]
        for code, name, sn, stype, cr, wh, ms, ld in subjects:
            Subject.objects.get_or_create(
                code=code,
                defaults={
                    'name': name, 'short_name': sn,
                    'subject_type': stype, 'credits': cr,
                    'weekly_hours': wh, 'max_students': ms,
                    'lab_duration_slots': ld,
                }
            )

    def _seed_sections(self):
        self.stdout.write('  Creating sections...')
        ay = AcademicYear.objects.get(label='2025-2026')
        cse = Department.objects.get(code='CSE')
        ece = Department.objects.get(code='ECE')
        aiml = Program.objects.get(code='AIML')
        cse_prog = Program.objects.get(code='CSE')
        ece_prog = Program.objects.get(code='ECE')

        sections = [
            ('A', 2, 4, cse, aiml, ay, 60),
            ('B', 2, 4, cse, aiml, ay, 60),
            ('A', 3, 5, cse, cse_prog, ay, 55),
            ('B', 3, 5, cse, cse_prog, ay, 55),
            ('A', 1, 1, ece, ece_prog, ay, 60),
        ]
        for name, yr, sem, dept, prog, acy, str_ in sections:
            Section.objects.get_or_create(
                name=name, year_of_study=yr, semester=sem,
                program=prog, academic_year=acy,
                defaults={'department': dept, 'strength': str_}
            )

    def _seed_course_offerings(self):
        """Create course offerings ensuring total weekly slot-hours = 42
        (7 regular slots × 6 days) for each section.
        """
        self.stdout.write('  Creating course offerings...')
        ay = AcademicYear.objects.get(label='2025-2026')
        aiml = Program.objects.get(code='AIML')
        cse_prog = Program.objects.get(code='CSE')
        ece_prog = Program.objects.get(code='ECE')

        def create_offerings(section, offering_list):
            for subj_code, fac_ids in offering_list:
                subj = Subject.objects.get(code=subj_code)
                offering, _ = CourseOffering.objects.get_or_create(
                    subject=subj, section=section
                )
                for fid in fac_ids:
                    fac = Faculty.objects.get(faculty_id=fid)
                    offering.faculty.add(fac)

        # ── II Year AIML Sem 4 — Section A ──
        # Theory: P&S(5) + OS(4) + ML(5) + DBMS(4) + FSD(4) + EVS(2) = 24
        # Lab: ML Lab(3) + DBMS Lab(3) + FSD Lab(3) = 9
        # Activity: LIB(1)+APTI(1)+TWH(1)+SS(2)+PDT(3)+COE(1)+UHV(2) = 11? Wait, 24+9=33. 42-33=9 Activity needed!
        # Activity hours total: 1+1+1+2+3+1 = 9. Total 42 ✓
        sec_aiml_a = Section.objects.get(
            name='A', year_of_study=2, semester=4,
            program=aiml, academic_year=ay
        )
        create_offerings(sec_aiml_a, [
            ('MA3452', ['CSE001']),             # P&S
            ('CS3452', ['CSE003']),             # OS
            ('CS3491', ['CSE005']),             # ML
            ('CS3492', ['CSE006']),             # DBMS
            ('CW3551', ['CSE008']),             # FSD
            ('GE3451', ['CSE010']),             # EVS
            ('CS3481', ['CSE005', 'CSE009']),   # ML Lab
            ('CS3482', ['CSE006', 'CSE007']),   # DBMS Lab
            ('CW3552', ['CSE008', 'CSE011']),   # FSD Lab
            ('AC3401', ['CSE010']),             # Library
            ('AC3402', ['CSE002']),             # Aptitude
            ('AC3403', ['CSE002']),             # TWH
            ('AC3404', ['CSE008']),             # SS
            ('AC3405', ['CSE010']),             # PDT
            ('AC3406', ['CSE011']),             # COE
            # ('AC3407', ['CSE001']),             # UHV (not used, keeps total to 42)
        ])

        # ── II Year AIML Sem 4 — Section B ──
        sec_aiml_b = Section.objects.get(
            name='B', year_of_study=2, semester=4,
            program=aiml, academic_year=ay
        )
        create_offerings(sec_aiml_b, [
            ('MA3452', ['CSE002']),              # P&S
            ('CS3452', ['CSE004']),              # OS
            ('CS3491', ['CSE009']),              # ML
            ('CS3492', ['CSE007']),              # DBMS
            ('CW3551', ['CSE011']),             # FSD
            ('GE3451', ['CSE010']),             # EVS
            ('CS3481', ['CSE009', 'CSE012']),   # ML Lab
            ('CS3482', ['CSE007', 'CSE012']),   # DBMS Lab
            ('CW3552', ['CSE011']),             # FSD Lab
            ('AC3401', ['CSE010']),             # Library
            ('AC3402', ['CSE002']),             # Aptitude
            ('AC3403', ['CSE002']),             # TWH
            ('AC3404', ['CSE008']),             # SS
            ('AC3405', ['CSE010']),             # PDT
            ('AC3406', ['CSE011']),             # COE
        ])

        # ── III Year CSE Sem 5 — Section A ──
        # Theory: DSA(5) + CN(4) + CD(4) + CC(3) + DS(4) + SE(4) = 24
        # Lab: DS Lab(3) + SE Lab(3) = 6
        # Activity: PT(3) + PW(5) + TS(2) + LIB(2) = 12. Total = 42 ✓
        sec_cse_a = Section.objects.get(
            name='A', year_of_study=3, semester=5,
            program=cse_prog, academic_year=ay
        )
        create_offerings(sec_cse_a, [
            ('CS3301', ['CSE001']),              # DSA
            ('CS3302', ['CSE004']),              # CN
            ('CS3303', ['CSE006']),              # CD
            ('PE3001', ['CSE008']),              # CC
            ('CS3401', ['CSE005']),              # DS
            ('CS3501', ['CSE009']),              # SE
            ('CS3402', ['CSE005', 'CSE012']),   # DS Lab
            ('CS3502', ['CSE009', 'CSE012']),   # SE Lab
            ('AC3501', ['CSE002']),             # PT
            ('AC3502', ['CSE001']),             # PW
            ('AC3503', ['CSE010']),             # TS
            ('AC3504', ['CSE002']),             # LIB
        ])

        # ── III Year CSE Sem 5 — Section B ──
        sec_cse_b = Section.objects.get(
            name='B', year_of_study=3, semester=5,
            program=cse_prog, academic_year=ay
        )
        create_offerings(sec_cse_b, [
            ('CS3301', ['CSE003']),              # DSA
            ('CS3302', ['CSE004']),              # CN
            ('CS3303', ['CSE006']),              # CD
            ('PE3001', ['CSE011']),              # CC
            ('CS3401', ['CSE009']),              # DS
            ('CS3501', ['CSE009']),              # SE
            ('CS3402', ['CSE009', 'CSE012']),   # DS Lab
            ('CS3502', ['CSE009', 'CSE012']),   # SE Lab
            ('AC3501', ['CSE002']),             # PT
            ('AC3502', ['CSE001']),             # PW
            ('AC3503', ['CSE010']),             # TS
            ('AC3504', ['CSE002']),             # LIB
        ])

        # ── I Year ECE Sem 1 — Section A ──
        # Theory: Maths I(5) + Physics(5) + Chemistry(5) + Python(5) + BEE(5) + Tamil(2) = 27
        # Lab: Phy Lab(3) + Py Lab(3) = 6
        # Activity: EG(3) + Sports(3) + LIB(2) + SS(1) = 9. Total = 42 ✓
        sec_ece = Section.objects.get(
            name='A', year_of_study=1, semester=1,
            program=ece_prog, academic_year=ay
        )
        create_offerings(sec_ece, [
            ('MA1101', ['CSE002']),              # Maths I
            ('PH1101', ['ECE001']),              # Physics
            ('CY1101', ['ECE002']),              # Chemistry
            ('GE1101', ['CSE010']),              # Python
            ('EC1101', ['ECE001']),              # BEE
            ('GE1102', ['CSE010']),              # Tamil
            ('PH1102', ['ECE001']),              # Physics Lab
            ('GE1103', ['CSE010']),              # Python Lab
            ('AC1101', ['ECE002']),              # Engineering Graphics
            ('AC1102', ['ECE001']),              # Sports
            ('AC1103', ['ECE001']),              # Library
            ('AC1104', ['ECE002']),              # Soft Skills
        ])

        self.stdout.write(self.style.SUCCESS('  Course offerings configured (42 slot-hours per section)'))

    def _seed_users(self):
        self.stdout.write('  Creating user accounts...')
        cse = Department.objects.get(code='CSE')
        ay = AcademicYear.objects.get(label='2025-2026')
        aiml = Program.objects.get(code='AIML')

        # Super Admin
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={'first_name': 'System', 'last_name': 'Admin', 'is_staff': True, 'is_superuser': True}
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
        UserProfile.objects.get_or_create(
            user=admin_user,
            defaults={'role': 'SUPER_ADMIN', 'department': cse}
        )

        # HOD
        hod_user, created = User.objects.get_or_create(
            username='hod_cse',
            defaults={'first_name': 'M', 'last_name': 'Karthikeyan', 'is_staff': True}
        )
        if created:
            hod_user.set_password('hod123')
            hod_user.save()
        fac = Faculty.objects.filter(faculty_id='CSE001').first()
        UserProfile.objects.get_or_create(
            user=hod_user,
            defaults={'role': 'HOD', 'department': cse, 'faculty_profile': fac}
        )

        # Faculty
        fac_user, created = User.objects.get_or_create(
            username='faculty1',
            defaults={'first_name': 'S', 'last_name': 'Priya'}
        )
        if created:
            fac_user.set_password('faculty123')
            fac_user.save()
        fac2 = Faculty.objects.filter(faculty_id='CSE003').first()
        UserProfile.objects.get_or_create(
            user=fac_user,
            defaults={'role': 'FACULTY', 'department': cse, 'faculty_profile': fac2}
        )

        # Student
        stu_user, created = User.objects.get_or_create(
            username='student1',
            defaults={'first_name': 'Rahul', 'last_name': 'Kumar'}
        )
        if created:
            stu_user.set_password('student123')
            stu_user.save()
        sec = Section.objects.filter(
            name='A', year_of_study=2, semester=4,
            program=aiml, academic_year=ay
        ).first()
        UserProfile.objects.get_or_create(
            user=stu_user,
            defaults={'role': 'STUDENT', 'department': cse, 'section': sec}
        )
