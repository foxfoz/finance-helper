from rest_framework import serializers
from .models import Fund
from datetime import date


class FundSerializer(serializers.ModelSerializer):
    progress_percent = serializers.ReadOnlyField()
    remaining_amount = serializers.ReadOnlyField()
    monthly_required = serializers.SerializerMethodField()
    estimated_date = serializers.SerializerMethodField()

    class Meta:
        model = Fund
        fields = [
            'id', 'name', 'target_amount', 'current_amount',
            'target_date', 'is_active', 'progress_percent',
            'remaining_amount', 'monthly_required', 'estimated_date',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_monthly_required(self, obj):
        if not obj.target_date or obj.target_date <= date.today():
            return None
        remaining = obj.remaining_amount
        months = (obj.target_date.year - date.today().year) * 12 + (obj.target_date.month - date.today().month)
        if months <= 0:
            return None
        return round(remaining / months, 2)

    def get_estimated_date(self, obj):
        # Упрощённый прогноз: если current_amount == 0, то None
        if obj.current_amount <= 0:
            return None
        # Здесь можно добавить более сложную логику на основе истории пополнений
        return None
