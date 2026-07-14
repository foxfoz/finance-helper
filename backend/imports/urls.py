from django.urls import path
from .views import CSVImportView

urlpatterns = [
    path('csv/', CSVImportView.as_view(), name='import-csv'),
]
