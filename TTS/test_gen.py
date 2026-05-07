import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Scheduler.settings')
django.setup()

from SchedulerApp.models import Section, CourseOffering
from SchedulerApp.services import TimetableGenerator

# Find AIML section
aiml_section = Section.objects.filter(program__code__icontains='AIML').first()
# Or any section that isn't CSE A
if not aiml_section:
    aiml_section = Section.objects.first()

print(f"Testing generation for section: {aiml_section}")
offerings = CourseOffering.objects.filter(section=aiml_section)
print(f"Offerings: {offerings.count()}")

try:
    generator = TimetableGenerator([aiml_section], 5)
    schedule = generator.generate()
    if schedule:
        print("Schedule generated successfully.")
        results = generator.save_results()
        print(f"Results saved: {results}")
    else:
        print("Generator returned None.")
except Exception as e:
    import traceback
    traceback.print_exc()

