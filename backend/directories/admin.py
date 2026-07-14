from django.contrib import admin
from .models import DirectoryItem


@admin.register(DirectoryItem)
class DirectoryItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'user', 'is_favorite', 'is_active', 'created_at']
    list_filter = ['type', 'is_favorite', 'is_active']
    search_fields = ['name', 'user__email']
