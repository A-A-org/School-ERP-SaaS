from django.urls import path

from .views import (
    ClassRoomListView,
    ExamListView,
)


urlpatterns = [

    path(
        "classes/",
        ClassRoomListView.as_view(),
        name="classroom-list"
    ),

    path(
        "exams/",
        ExamListView.as_view(),
        name="exam-list"
    ),

]