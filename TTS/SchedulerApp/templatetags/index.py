from django import template

register = template.Library()


@register.filter
def dict_key(d, k):
    """Returns the given key from a dictionary."""
    try:
        return d[k]
    except (KeyError, TypeError):
        return ''


@register.simple_tag
def timetable_cell(grid, day, slot_number):
    """
    Returns cell data for a timetable grid at the given day and slot.
    Usage: {% timetable_cell grid "MON" 1 as cell %}
    """
    try:
        return grid.get(day, {}).get(int(slot_number), None)
    except (TypeError, ValueError):
        return None


@register.filter
def get_item(dictionary, key):
    """Get an item from a dict by key."""
    if dictionary is None:
        return None
    return dictionary.get(key)


@register.filter
def subject_type_class(subject_type):
    """Return CSS class for subject type badge."""
    classes = {
        'THEORY': 'badge-theory',
        'LAB': 'badge-lab',
        'ELECTIVE': 'badge-elective',
        'COMMON': 'badge-common',
    }
    return classes.get(subject_type, 'badge-theory')


@register.filter
def status_class(status):
    """Return CSS class for timetable status badge."""
    classes = {
        'DRAFT': 'badge-draft',
        'PUBLISHED': 'badge-published',
        'ARCHIVED': 'badge-archived',
    }
    return classes.get(status, '')


@register.filter
def percentage(value):
    """Format a decimal as percentage."""
    try:
        return f'{float(value) * 100:.1f}%'
    except (TypeError, ValueError):
        return '0%'


@register.tag
def active(parser, token):
    """Mark nav link as active if URL matches."""
    args = token.split_contents()
    if len(args) < 2:
        raise template.TemplateSyntaxError(
            f'{args[0]} tag requires at least one argument'
        )
    return NavSelectedNode(args[1:])


class NavSelectedNode(template.Node):
    def __init__(self, patterns):
        self.patterns = patterns

    def render(self, context):
        path = context['request'].path
        for p in self.patterns:
            try:
                pValue = template.Variable(p).resolve(context)
                if path == pValue:
                    return 'active'
            except template.VariableDoesNotExist:
                pass
        return ''