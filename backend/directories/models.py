from django.db import models
from django.conf import settings


class DirectoryItem(models.Model):
    TYPE_CHOICES = [
        ('income', 'Доход'),
        ('expense', 'Расход'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='directory_items',
        verbose_name='Пользователь'
    )
    type = models.CharField('Тип', max_length=10, choices=TYPE_CHOICES)
    name = models.CharField('Название', max_length=100)
    color = models.CharField('Цвет', max_length=7, default='#3B82F6')
    icon = models.CharField('Иконка', max_length=50, blank=True, default='')
    is_favorite = models.BooleanField('Избранное', default=False)
    is_active = models.BooleanField('Активна', default=True)
    created_at = models.DateTimeField('Создана', auto_now_add=True)

    class Meta:
        verbose_name = 'Статья'
        verbose_name_plural = 'Статьи'
        unique_together = ['user', 'type', 'name']
        ordering = ['-is_favorite', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"
