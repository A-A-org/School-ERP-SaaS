from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView


urlpatterns = [

    path('admin/', admin.site.urls),

    path(
        'api/accounts/',
        include('accounts.urls')
    ),

    path(
        'api/schools/',
        include('schools.urls')
    ),

    path(
        'api/students/',
        include('students.urls')
    ),

    path(
        'api/auth/login/',
        TokenObtainPairView.as_view(),
        name='token_obtain_pair'
    ),
]