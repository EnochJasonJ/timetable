from celery import shared_task
from django.core.cache import cache
from .models import Section
from .services import TimetableGenerator

@shared_task
def run_generation_task(section_ids, max_gens, task_id):
    sections = list(Section.objects.filter(id__in=section_ids))
    if not sections:
        return
        
    generator = TimetableGenerator(sections, int(max_gens), task_id=task_id)
    try:
        schedule = generator.generate()
        if schedule:
            generator.save_results()
    finally:
        state = cache.get(task_id)
        if state:
            state['running'] = False
            cache.set(task_id, state, timeout=3600)
