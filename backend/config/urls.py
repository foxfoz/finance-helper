from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/directories/', include('directories.urls')),
    path('api/transactions/', include('transactions.urls')),
    path('api/funds/', include('funds.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/imports/', include('imports.urls')),
]

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# SPA catch-all: serve React index.html for all non-API routes
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]
