from django.urls import path
from .views import FundListCreateView, FundDetailView, FundDepositWithdrawView

urlpatterns = [
    path('', FundListCreateView.as_view(), name='fund-list'),
    path('<int:pk>/', FundDetailView.as_view(), name='fund-detail'),
    path('<int:pk>/deposit/', FundDepositWithdrawView.as_view(), name='fund-deposit'),
]
