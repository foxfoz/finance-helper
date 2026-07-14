from django.db import models
from django.conf import settings

from directories.models import DirectoryItem
from funds.models import Fund


class Transaction(models.Model):
    TYPE_CHOICES = [
        ('income', 'Доход'),
        ('expense', 'Расход'),
        ('fund', 'Пополнение фонда'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='transactions',
        verbose_name='Пользователь'
    )
    type = models.CharField('Тип', max_length=10, choices=TYPE_CHOICES)
    directory_item = models.ForeignKey(
        DirectoryItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions',
        verbose_name='Статья'
    )
    fund = models.ForeignKey(
        Fund,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='transactions',
        verbose_name='Фонд'
    )
    amount = models.DecimalField('Сумма', max_digits=12, decimal_places=2)
    date = models.DateField('Дата')
    comment = models.CharField('Комментарий', max_length=255, blank=True)
    is_recurring = models.BooleanField('Повторяющийся', default=False)
    created_at = models.DateTimeField('Создана', auto_now_add=True)

    class Meta:
        verbose_name = 'Операция'
        verbose_name_plural = 'Операции'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.get_type_display()} {self.amount} от {self.date}"
