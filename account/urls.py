from django.urls import path
from . import views

urlpatterns = [
    path('users/<int:user_id>/', views.update_user_role, name='update-user-role'),
    path('users/', views.user_list, name='user-list'),
]

