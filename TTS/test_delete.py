import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Scheduler.settings')
django.setup()

from SchedulerApp.models import Program

try:
    p = Program.objects.first()
    if p:
        print(f"Trying to delete: {p}")
        p.delete()
        print("Success!")
    else:
        print("No programs found.")
except Exception as e:
    print(f"Error: {e}")
