import csv
import io
from decimal import Decimal, InvalidOperation
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from transactions.models import Transaction
from directories.models import DirectoryItem


class CSVImportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'Файл не предоставлен.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded = file.read().decode('utf-8-sig')
        except UnicodeDecodeError:
            try:
                file.seek(0)
                decoded = file.read().decode('cp1251')
            except Exception:
                return Response({'detail': 'Не удалось распознать кодировку файла.'}, status=status.HTTP_400_BAD_REQUEST)

        reader = csv.DictReader(io.StringIO(decoded), delimiter=';')
        if not reader.fieldnames:
            return Response({'detail': 'Не удалось определить колонки CSV.'}, status=status.HTTP_400_BAD_REQUEST)

        # Приведение названий колонок к нижнему регистру
        fieldnames = [f.lower().strip() for f in reader.fieldnames]

        # Определение маппинга колонок
        date_fields = ['дата', 'date', 'operation_date', 'дата операции']
        amount_fields = ['сумма', 'amount', 'сумма операции', 'amount_rub']
        desc_fields = ['описание', 'description', 'назначение', 'назначение платежа', 'details']
        category_fields = ['категория', 'category', 'тип', 'type']

        date_col = self._find_field(fieldnames, date_fields)
        amount_col = self._find_field(fieldnames, amount_fields)
        desc_col = self._find_field(fieldnames, desc_fields)
        category_col = self._find_field(fieldnames, category_fields)

        if not date_col or not amount_col:
            return Response({
                'detail': 'В файле не найдены обязательные колонки: дата и сумма.'
            }, status=status.HTTP_400_BAD_REQUEST)

        imported = []
        errors = []

        user_categories = {item.name.lower(): item for item in DirectoryItem.objects.filter(user=request.user)}

        for idx, row in enumerate(reader, start=2):
            try:
                row = {k.lower().strip(): v for k, v in row.items()}
                raw_date = row.get(date_col, '').strip()
                raw_amount = row.get(amount_col, '').replace(' ', '').replace(',', '.').strip()
                description = row.get(desc_col, '').strip() if desc_col else ''
                category_name = row.get(category_col, '').strip() if category_col else ''

                # Парсинг даты
                date_obj = None
                for fmt in ['%d.%m.%Y', '%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y']:
                    try:
                        date_obj = datetime.strptime(raw_date, fmt).date()
                        break
                    except ValueError:
                        continue
                if not date_obj:
                    errors.append({'row': idx, 'error': f'Не удалось распознать дату: {raw_date}'})
                    continue

                # Парсинг суммы
                try:
                    amount = Decimal(raw_amount)
                except InvalidOperation:
                    errors.append({'row': idx, 'error': f'Не удалось распознать сумму: {raw_amount}'})
                    continue

                # Определение типа и статьи
                # В банковских выписках расходы часто идут со знаком минус
                transaction_type = 'income'
                if amount < 0:
                    transaction_type = 'expense'
                    amount = abs(amount)

                directory_item = None
                if category_name:
                    directory_item = user_categories.get(category_name.lower())

                if not directory_item:
                    default_name = 'Прочее'
                    directory_item = user_categories.get(default_name.lower())
                    if not directory_item:
                        directory_item, _ = DirectoryItem.objects.get_or_create(
                            user=request.user,
                            type=transaction_type,
                            name='Прочее',
                            defaults={'color': '#6B7280', 'icon': '📦'}
                        )
                        user_categories['прочее'] = directory_item

                transaction = Transaction.objects.create(
                    user=request.user,
                    type=transaction_type,
                    directory_item=directory_item,
                    amount=amount,
                    date=date_obj,
                    comment=description,
                )
                imported.append({
                    'id': transaction.id,
                    'date': transaction.date,
                    'amount': str(transaction.amount),
                    'type': transaction.type,
                    'category': directory_item.name,
                })

            except Exception as e:
                errors.append({'row': idx, 'error': str(e)})

        return Response({
            'imported_count': len(imported),
            'errors_count': len(errors),
            'errors': errors[:10],
            'sample': imported[:5],
        })

    def _find_field(self, fieldnames, candidates):
        for candidate in candidates:
            if candidate in fieldnames:
                return candidate
        return None
