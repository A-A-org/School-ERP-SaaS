from django.urls import path

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    UserListView,
    TeacherListCreateView,
    TeacherDetailView,
    CurrentUserView,
)


urlpatterns = [

    path(
        "users/",
        UserListView.as_view()
    ),

    path(
        "teachers/",
        TeacherListCreateView.as_view()
    ),

    path(
        "teachers/<int:pk>/",
        TeacherDetailView.as_view()
    ),

    path(
        "me/",
        CurrentUserView.as_view()
    ),

    path(
        "auth/login/",
        TokenObtainPairView.as_view()
    ),

    path(
        "auth/refresh/",
        TokenRefreshView.as_view()
    ),
]