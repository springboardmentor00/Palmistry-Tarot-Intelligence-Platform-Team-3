from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import UserProfile
from .serializers import UserProfileSerializer

@api_view(['PUT'])
def update_user_role(request, user_id):
    try:
        profile = UserProfile.objects.get(id=user_id)
    except UserProfile.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    role = request.data.get("role")

    if role:
        profile.role = role
        profile.save()

    serializer = UserProfileSerializer(profile)
    return Response(serializer.data)
@api_view(['GET'])
def user_list(request):
    users = UserProfile.objects.all()
    serializer = UserProfileSerializer(users, many=True)
    return Response(serializer.data)