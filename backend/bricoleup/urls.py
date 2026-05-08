from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('app.api.urls')),
    path('api/', include('app.api.urls')),
    path('', include('app.urls')),
]
