from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from .models import Transaction
from .serializers import TransactionSerializer, TransactionSummarySerializer


class TransactionListCreateView(generics.ListCreateAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Transaction.objects.filter(user=self.request.user)

        type_ = self.request.query_params.get('type')
        if type_:
            queryset = queryset.filter(type=type_)

        directory_item = self.request.query_params.get('directory_item')
        if directory_item:
            queryset = queryset.filter(directory_item_id=directory_item)

        fund = self.request.query_params.get('fund')
        if fund:
            queryset = queryset.filter(fund_id=fund)

        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)

        return queryset.select_related('directory_item', 'fund')

    def perform_create(self, serializer):
        transaction = serializer.save(user=self.request.user)
        if transaction.type == 'fund' and transaction.fund:
            transaction.fund.current_amount += transaction.amount
            transaction.fund.save()


class TransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_type = old_instance.type
        old_amount = old_instance.amount
        old_fund = old_instance.fund

        new_instance = serializer.save()

        # Корректировка фонда при изменении
        if old_type == 'fund' and old_fund:
            old_fund.current_amount -= old_amount
            old_fund.save()

        if new_instance.type == 'fund' and new_instance.fund:
            new_instance.fund.current_amount += new_instance.amount
            new_instance.fund.save()

    def perform_destroy(self, instance):
        if instance.type == 'fund' and instance.fund:
            instance.fund.current_amount -= instance.amount
            instance.fund.save()
        instance.delete()


class TransactionSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        queryset = Transaction.objects.filter(user=request.user)
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)

        income = queryset.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0
        expense = queryset.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0
        fund = queryset.filter(type='fund').aggregate(Sum('amount'))['amount__sum'] or 0

        data = {
            'total_income': income,
            'total_expense': expense,
            'total_fund': fund,
            'balance': income - expense - fund,
        }
        serializer = TransactionSummarySerializer(data)
        return Response(serializer.data)
