from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from decimal import Decimal
from .models import Fund
from transactions.models import Transaction
from .serializers import FundSerializer


class FundListCreateView(generics.ListCreateAPIView):
    serializer_class = FundSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Fund.objects.filter(user=self.request.user, is_active=True)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FundDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FundSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Fund.objects.filter(user=self.request.user)


class FundDepositWithdrawView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            fund = Fund.objects.get(pk=pk, user=request.user)
        except Fund.DoesNotExist:
            return Response({'detail': 'Фонд не найден.'}, status=status.HTTP_404_NOT_FOUND)

        amount = request.data.get('amount')
        operation = request.data.get('operation', 'deposit')
        comment = request.data.get('comment', '')

        if not amount:
            return Response({'detail': 'Укажите сумму.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount = Decimal(str(amount))
        except Exception:
            return Response({'detail': 'Некорректная сумма.'}, status=status.HTTP_400_BAD_REQUEST)

        if operation == 'deposit':
            fund.current_amount += amount
            transaction_type = 'fund'
        elif operation == 'withdraw':
            if fund.current_amount < amount:
                return Response({'detail': 'Недостаточно средств в фонде.'}, status=status.HTTP_400_BAD_REQUEST)
            fund.current_amount -= amount
            transaction_type = 'fund'
            amount = -amount
        else:
            return Response({'detail': 'Некорректная операция.'}, status=status.HTTP_400_BAD_REQUEST)

        fund.save()

        Transaction.objects.create(
            user=request.user,
            type='fund',
            fund=fund,
            amount=abs(amount),
            date=request.data.get('date'),
            comment=comment,
        )

        serializer = FundSerializer(fund)
        return Response(serializer.data)
