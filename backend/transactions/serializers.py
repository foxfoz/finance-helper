from rest_framework import serializers
from .models import Transaction
from directories.models import DirectoryItem
from funds.models import Fund


class TransactionSerializer(serializers.ModelSerializer):
    directory_item_name = serializers.CharField(source='directory_item.name', read_only=True)
    fund_name = serializers.CharField(source='fund.name', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'type', 'directory_item', 'directory_item_name',
            'fund', 'fund_name', 'amount', 'date', 'comment',
            'is_recurring', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        request = self.context.get('request')
        user = request.user if request else None
        type_ = data.get('type')

        if type_ == 'fund':
            fund = data.get('fund')
            if not fund:
                raise serializers.ValidationError({'fund': 'Для пополнения фонда необходимо выбрать фонд.'})
            if fund.user != user:
                raise serializers.ValidationError({'fund': 'Фонд не найден.'})
            data['directory_item'] = None
        else:
            directory_item = data.get('directory_item')
            if not directory_item:
                raise serializers.ValidationError({'directory_item': 'Необходимо выбрать статью.'})
            if directory_item.user != user or directory_item.type != type_:
                raise serializers.ValidationError({'directory_item': 'Статья не найдена или не соответствует типу операции.'})
            data['fund'] = None

        return data


class TransactionSummarySerializer(serializers.Serializer):
    total_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_expense = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_fund = serializers.DecimalField(max_digits=12, decimal_places=2)
    balance = serializers.DecimalField(max_digits=12, decimal_places=2)
