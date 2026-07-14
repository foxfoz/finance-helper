from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import datetime, timedelta
from calendar import monthrange

from transactions.models import Transaction
from directories.models import DirectoryItem
from funds.models import Fund


def get_period_bounds(period):
    today = timezone.localdate()
    if period == 'quarter':
        start = today.replace(day=1) - timedelta(days=90)
        end = today
    elif period == 'year':
        start = today.replace(day=1, month=1)
        end = today
    else:
        start = today.replace(day=1)
        end = today
    return start, end


def get_previous_period_bounds(period):
    today = timezone.localdate()
    if period == 'quarter':
        end = today - timedelta(days=90)
        start = end - timedelta(days=90)
    elif period == 'year':
        end = today.replace(day=1, month=1) - timedelta(days=1)
        start = end.replace(day=1, month=1)
    else:
        # предыдущий месяц
        first_day = today.replace(day=1)
        end = first_day - timedelta(days=1)
        start = end.replace(day=1)
    return start, end


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', 'month')
        start, end = get_period_bounds(period)

        transactions = Transaction.objects.filter(
            user=request.user,
            date__gte=start,
            date__lte=end
        )

        # Баланс
        income = float(transactions.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0)
        expense = float(transactions.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0)
        fund = float(transactions.filter(type='fund').aggregate(Sum('amount'))['amount__sum'] or 0)
        balance = income - expense - fund

        # Динамика vs предыдущий период
        prev_start, prev_end = get_previous_period_bounds(period)
        prev_transactions = Transaction.objects.filter(
            user=request.user,
            date__gte=prev_start,
            date__lte=prev_end
        )
        prev_income = float(prev_transactions.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0)
        prev_expense = float(prev_transactions.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0)
        prev_fund = float(prev_transactions.filter(type='fund').aggregate(Sum('amount'))['amount__sum'] or 0)
        prev_balance = prev_income - prev_expense - prev_fund

        balance_change = None
        if prev_balance != 0:
            balance_change = round(float((balance - prev_balance) / abs(prev_balance)) * 100, 2)

        # Структура расходов
        expense_structure = [
            {**item, 'total': float(item['total'])}
            for item in transactions.filter(type='expense')
            .values('directory_item__name', 'directory_item__color')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        ]

        # Динамика по дням (для месяца) или по месяцам (для года)
        if period == 'year':
            income_dynamic = [
                {**item, 'total': float(item['total'])}
                for item in transactions.filter(type='income')
                .values('date__month')
                .annotate(total=Sum('amount'))
                .order_by('date__month')
            ]
            expense_dynamic = [
                {**item, 'total': float(item['total'])}
                for item in transactions.filter(type='expense')
                .values('date__month')
                .annotate(total=Sum('amount'))
                .order_by('date__month')
            ]
        else:
            income_dynamic = [
                {**item, 'total': float(item['total'])}
                for item in transactions.filter(type='income')
                .values('date')
                .annotate(total=Sum('amount'))
                .order_by('date')
            ]
            expense_dynamic = [
                {**item, 'total': float(item['total'])}
                for item in transactions.filter(type='expense')
                .values('date')
                .annotate(total=Sum('amount'))
                .order_by('date')
            ]

        # Топ-5 статей расходов
        top_expenses = expense_structure[:5]

        # Прогресс фондов
        funds = Fund.objects.filter(user=request.user, is_active=True)
        funds_data = []
        for fund_obj in funds:
            funds_data.append({
                'id': fund_obj.id,
                'name': fund_obj.name,
                'target_amount': float(fund_obj.target_amount),
                'current_amount': float(fund_obj.current_amount),
                'progress_percent': fund_obj.progress_percent,
                'remaining_amount': float(fund_obj.remaining_amount),
            })

        return Response({
            'period': period,
            'start': start,
            'end': end,
            'income': income,
            'expense': expense,
            'fund': fund,
            'balance': balance,
            'previous_balance': prev_balance,
            'balance_change_percent': balance_change,
            'expense_structure': expense_structure,
            'income_dynamic': income_dynamic,
            'expense_dynamic': expense_dynamic,
            'top_expenses': top_expenses,
            'funds': funds_data,
        })


class AdviceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        start_month = today.replace(day=1)
        advice = []

        # Текущий месяц
        month_transactions = Transaction.objects.filter(
            user=request.user,
            date__gte=start_month,
            date__lte=today
        )
        month_income = float(month_transactions.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0)
        month_expense = float(month_transactions.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0)
        month_fund = float(month_transactions.filter(type='fund').aggregate(Sum('amount'))['amount__sum'] or 0)

        if month_income > 0 and month_expense > month_income:
            advice.append({
                'type': 'warning',
                'title': 'Отрицательный баланс',
                'text': f'В этом месяце расходы ({month_expense} ₽) превышают доходы ({month_income} ₽) на {month_expense - month_income} ₽.',
            })

        # Сравнение со средним за 3 месяца
        three_months_ago = today - timedelta(days=90)
        expense_by_item = DirectoryItem.objects.filter(
            user=request.user,
            type='expense',
            is_active=True
        )

        for item in expense_by_item:
            # Среднее за 3 предыдущих месяца
            prev_transactions = Transaction.objects.filter(
                user=request.user,
                type='expense',
                directory_item=item,
                date__gte=three_months_ago,
                date__lt=start_month
            )
            prev_total = float(prev_transactions.aggregate(Sum('amount'))['amount__sum'] or 0)
            prev_months = 3
            avg = prev_total / prev_months if prev_months > 0 else 0

            current_transactions = Transaction.objects.filter(
                user=request.user,
                type='expense',
                directory_item=item,
                date__gte=start_month,
                date__lte=today
            )
            current_total = float(current_transactions.aggregate(Sum('amount'))['amount__sum'] or 0)

            if avg > 0 and current_total > avg * 1.2:
                change = round((current_total - avg) / avg * 100)
                advice.append({
                    'type': 'info',
                    'title': 'Рост расходов',
                    'text': f'Расходы на «{item.name}» выросли на {change}% по сравнению со средним за 3 месяца.',
                })

            # Доля в доходе
            if month_income > 0 and item.name in ['Развлечения', 'Подписки', 'Одежда']:
                share = current_total / month_income * 100
                if share > 15:
                    advice.append({
                        'type': 'tip',
                        'title': 'Высокая доля расходов',
                        'text': f'Вы тратите {share:.1f}% дохода на «{item.name}» — это выше рекомендуемых 10–15%.',
                    })

        # Фонды
        funds = Fund.objects.filter(user=request.user, is_active=True)
        for fund_obj in funds:
            if fund_obj.target_date:
                months_left = (fund_obj.target_date.year - today.year) * 12 + (fund_obj.target_date.month - today.month)
                if months_left > 0:
                    required = float(fund_obj.remaining_amount) / months_left
                    advice.append({
                        'type': 'goal',
                        'title': f'Накопление на «{fund_obj.name}»',
                        'text': f'Чтобы достичь цели к {fund_obj.target_date}, нужно откладывать {required:.0f} ₽ в месяц.',
                    })

        # Повторяющиеся расходы
        recurring = float(month_transactions.filter(is_recurring=True, type='expense').aggregate(Sum('amount'))['amount__sum'] or 0)
        if recurring > 0:
            advice.append({
                'type': 'tip',
                'title': 'Повторяющиеся расходы',
                'text': f'В этом месяце повторяющиеся расходы (подписки, аренда) составляют {recurring} ₽ — проверьте, всеми ли пользуетесь.',
            })

        return Response({'advice': advice})
