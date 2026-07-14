from rest_framework import generics, permissions
from .models import DirectoryItem
from .serializers import DirectoryItemSerializer


class DirectoryItemListCreateView(generics.ListCreateAPIView):
    serializer_class = DirectoryItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = DirectoryItem.objects.filter(user=self.request.user)
        type_ = self.request.query_params.get('type')
        if type_:
            queryset = queryset.filter(type=type_)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DirectoryItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DirectoryItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DirectoryItem.objects.filter(user=self.request.user)
