from django.contrib import admin
from .models import Fund


@admin.register(Fund)
class FundAdmin(admin.ModelAdmin):
    list_display = ['name', 'target_amount', 'current_amount', 'target_date', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'user__email']
