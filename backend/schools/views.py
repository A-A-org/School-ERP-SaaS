from rest_framework import generics
from .models import School
from .serializers import SchoolSerializer
from accounts.permissions import IsSchoolStaff


class SchoolListCreateView(generics.ListCreateAPIView):

    serializer_class = SchoolSerializer

    permission_classes = [IsSchoolStaff]


    def get_queryset(self):

        user = self.request.user

        # Platform Owner can see all schools
        if user.role == "OWNER":
            return School.objects.all()

        # Other users can only see their assigned school
        return School.objects.filter(
            id=user.school.id
        )


class SchoolDetailView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = SchoolSerializer

    permission_classes = [IsSchoolStaff]


    def get_queryset(self):

        user = self.request.user

        # Platform Owner can manage all schools
        if user.role == "OWNER":
            return School.objects.all()

        # School users can only access their own school
        return School.objects.filter(
            id=user.school.id
        )