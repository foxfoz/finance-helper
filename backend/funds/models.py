from django.db import models
from django.conf import settings


class Fund(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='funds',
        verbose_name='Пользователь'
    )
    name = models.CharField('Название', max_length=100)
    target_amount = models.DecimalField('Целевая сумма', max_digits=12, decimal_places=2)
    current_amount = models.DecimalField('Текущая сумма', max_digits=12, decimal_places=2, default=0)
    target_date = models.DateField('Желаемая дата', null=True, blank=True)
    is_active = models.BooleanField('Активен', default=True)
    created_at = models.DateTimeField('Создан', auto_now_add=True)

    class Meta:
        verbose_name = 'Фонд'
        verbose_name_plural = 'Фонды'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def progress_percent(self):
        if self.target_amount == 0:
            return 100
        return min(100, round(float(self.current_amount) / float(self.target_amount) * 100, 2))

    @property
    def remaining_amount(self):
        return max(0, self.target_amount - self.current_amount)
