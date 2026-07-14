from django.urls import path
from .views import DashboardView, AdviceView

urlpatterns = [
    path('dashboard/', DashboardView.as_view(), name='analytics-dashboard'),
    path('advice/', AdviceView.as_view(), name='analytics-advice'),
]
