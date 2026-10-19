from rest_framework.generics import (
    ListAPIView,
    ListCreateAPIView,
    RetrieveAPIView,
    RetrieveUpdateDestroyAPIView,
)

from .models import User

from .serializers import (
    UserSerializer,
    TeacherSerializer,
)

from .permissions import (
    IsOwner,
    IsSchoolStaff,
    TeacherAccessPermission,
)


# ==========================
# All Users
# Owner only
# ==========================

class UserListView(ListAPIView):

    queryset = User.objects.all()

    serializer_class = UserSerializer

    permission_classes = [
        IsOwner
    ]


# ==========================
# Teachers
# ==========================

class TeacherListCreateView(
    ListCreateAPIView
):

    serializer_class = (
        TeacherSerializer
    )

    permission_classes = [
        TeacherAccessPermission
    ]


    def get_queryset(self):

        user = self.request.user


        queryset = (
            User.objects
            .filter(
                role="TEACHER"
            )
            .select_related(
                "school",
                "classroom"
            )
        )


        # Platform owner sees
        # teachers from all schools
        if user.role == "OWNER":

            return queryset


        # School users only see
        # teachers from their school
        if not user.school_id:

            return User.objects.none()


        return queryset.filter(
            school=user.school
        )


class TeacherDetailView(
    RetrieveUpdateDestroyAPIView
):

    serializer_class = (
        TeacherSerializer
    )

    permission_classes = [
        TeacherAccessPermission
    ]


    def get_queryset(self):

        user = self.request.user


        queryset = (
            User.objects
            .filter(
                role="TEACHER"
            )
            .select_related(
                "school",
                "classroom"
            )
        )


        if user.role == "OWNER":

            return queryset


        if not user.school_id:

            return User.objects.none()


        return queryset.filter(
            school=user.school
        )


# ==========================
# Current Logged-In User
# ==========================

class CurrentUserView(
    RetrieveAPIView
):

    serializer_class = (
        UserSerializer
    )

    permission_classes = [
        IsSchoolStaff
    ]


    def get_object(self):

        return self.request.user