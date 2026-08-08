from django.db import models
from django.contrib.auth.models import User
# Create your models here.
from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):

    ROLE_CHOICES = [
        ('USER', 'User'),
        ('ADMIN', 'Admin'),
        ('CONSULTANT', 'Consultant'),
        ('READER', 'Reader'),
    ]

    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)

    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        blank=True,
        null=True
    )

    phone_number = models.CharField(max_length=15)

    date_of_birth = models.DateField()

    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='USER'
    )

    def __str__(self):
        return self.user.username