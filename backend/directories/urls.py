from django.urls import path
from .views import DirectoryItemListCreateView, DirectoryItemDetailView

urlpatterns = [
    path('', DirectoryItemListCreateView.as_view(), name='directory-list'),
    path('<int:pk>/', DirectoryItemDetailView.as_view(), name='directory-detail'),
]
