from django.urls import path

from .views import (
    ClassRoomListCreateView,
    ClassRoomDetailView,
    ExamListView,
)


urlpatterns = [

    path(
        "classes/",
        ClassRoomListCreateView.as_view(),
        name="classroom-list-create"
    ),

    path(
        "classes/<int:pk>/",
        ClassRoomDetailView.as_view(),
        name="classroom-detail"
    ),

    path(
        "exams/",
        ExamListView.as_view(),
        name="exam-list"
    ),

]