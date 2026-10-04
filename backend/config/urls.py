from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from core.views import (
    SchoolViewSet,
    UserViewSet,
    SchoolClassViewSet,
    StudentViewSet,
    EmployeeViewSet,
    FeeViewSet,
    AttendanceViewSet,
)

router = DefaultRouter()
router.register('schools', SchoolViewSet)
router.register('users', UserViewSet)
router.register('classes', SchoolClassViewSet)
router.register('students', StudentViewSet)
router.register('employees', EmployeeViewSet)
router.register('fees', FeeViewSet)
router.register('attendance', AttendanceViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include(router.urls)),
]