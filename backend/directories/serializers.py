from rest_framework import serializers
from .models import DirectoryItem


class DirectoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = DirectoryItem
        fields = ['id', 'type', 'name', 'color', 'icon', 'is_favorite', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_type(self, value):
        if value not in ['income', 'expense']:
            raise serializers.ValidationError('Тип должен быть income или expense.')
        return value

    def validate(self, data):
        user = self.context['request'].user
        name = data.get('name')
        type_ = data.get('type')
        instance = getattr(self, 'instance', None)

        queryset = DirectoryItem.objects.filter(user=user, type=type_, name=name)
        if instance:
            queryset = queryset.exclude(pk=instance.pk)

        if queryset.exists():
            raise serializers.ValidationError({'name': 'Статья с таким названием уже существует.'})

        return data
