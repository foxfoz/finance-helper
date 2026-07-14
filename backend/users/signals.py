from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User
from directories.models import DirectoryItem


DEFAULT_EXPENSE_CATEGORIES = [
    {'name': 'Продукты', 'color': '#22C55E', 'icon': '🛒'},
    {'name': 'Транспорт', 'color': '#3B82F6', 'icon': '🚌'},
    {'name': 'Жильё', 'color': '#F59E0B', 'icon': '🏠'},
    {'name': 'Развлечения', 'color': '#EC4899', 'icon': '🎬'},
    {'name': 'Здоровье', 'color': '#EF4444', 'icon': '💊'},
    {'name': 'Одежда', 'color': '#8B5CF6', 'icon': '👕'},
    {'name': 'Подписки', 'color': '#06B6D4', 'icon': '📱'},
    {'name': 'Прочее', 'color': '#6B7280', 'icon': '📦'},
]

DEFAULT_INCOME_CATEGORIES = [
    {'name': 'Зарплата', 'color': '#22C55E', 'icon': '💰'},
    {'name': 'Подработка', 'color': '#3B82F6', 'icon': '💵'},
    {'name': 'Инвестиции', 'color': '#F59E0B', 'icon': '📈'},
    {'name': 'Подарки', 'color': '#EC4899', 'icon': '🎁'},
    {'name': 'Прочее', 'color': '#6B7280', 'icon': '📦'},
]


@receiver(post_save, sender=User)
def create_default_categories(sender, instance, created, **kwargs):
    if not created:
        return

    for item in DEFAULT_EXPENSE_CATEGORIES:
        DirectoryItem.objects.get_or_create(
            user=instance,
            type='expense',
            name=item['name'],
            defaults={'color': item['color'], 'icon': item['icon']}
        )

    for item in DEFAULT_INCOME_CATEGORIES:
        DirectoryItem.objects.get_or_create(
            user=instance,
            type='income',
            name=item['name'],
            defaults={'color': item['color'], 'icon': item['icon']}
        )
