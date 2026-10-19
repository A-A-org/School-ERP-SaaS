from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


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

    path(
        'api/auth/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh'
    ),

    path(
        'api/attendance/',
        include('attendance.urls')
    ),

    path(
        'api/academics/',
        include('academics.urls')
    ),

]