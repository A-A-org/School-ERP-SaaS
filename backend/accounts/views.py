from rest_framework.generics import ListAPIView, RetrieveAPIView

from .models import User
from .serializers import UserSerializer
from .permissions import (
    IsOwner,
    IsSchoolStaff,
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

class TeacherListView(ListAPIView):

    serializer_class = UserSerializer

    permission_classes = [
        IsSchoolStaff
    ]


    def get_queryset(self):

        user = self.request.user


        # Platform owner sees
        # teachers from all schools
        if user.role == "OWNER":

            return User.objects.filter(
                role="TEACHER"
            )


        # Other school users see
        # teachers from their own school
        return User.objects.filter(
            role="TEACHER",
            school=user.school
        )

# ==========================
# Current Logged-In User
# ==========================

class CurrentUserView(RetrieveAPIView):

    serializer_class = UserSerializer

    permission_classes = [
        IsSchoolStaff
    ]

    def get_object(self):
        return self.request.user