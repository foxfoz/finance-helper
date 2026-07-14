from django.contrib import admin
from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['date', 'type', 'amount', 'directory_item', 'fund', 'user', 'comment']
    list_filter = ['type', 'date']
    search_fields = ['comment', 'user__email']
    date_hierarchy = 'date'
