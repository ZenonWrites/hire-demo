import random

from django.contrib.auth.models import User
from django.db import models

CATEGORIES = ["Electrician", "Plumber", "Carpenter", "AC Technician", "Painter",
              "Mason", "General Helper", "Driver", "Cleaner"]

BOOKING_TYPES = [("hourly", "Hourly"), ("daily", "Daily"), ("multi_day", "Multi-day"), ("emergency", "Emergency")]

STATUS = [
    ("pending", "Pending"), ("accepted", "Accepted"), ("rejected", "Rejected"),
    ("in_progress", "In progress"), ("completed", "Completed"), ("cancelled", "Cancelled"),
]


class Profile(models.Model):
    ROLES = [("customer", "Customer"), ("worker", "Worker")]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=10, choices=ROLES)
    name = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=80, blank=True)
    # worker fields
    category = models.CharField(max_length=40, blank=True)
    skills = models.CharField(max_length=300, blank=True)
    experience_years = models.IntegerField(default=0)
    hourly_rate = models.IntegerField(default=0)
    daily_rate = models.IntegerField(default=0)
    bio = models.CharField(max_length=300, blank=True)
    available = models.BooleanField(default=True)
    verified = models.BooleanField(default=False)
    rating_avg = models.FloatField(default=0)
    rating_count = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.role}: {self.name or self.phone}"

    @property
    def eta_minutes(self):
        random.seed(self.id or 0)
        return 5 + random.randint(0, 6) * 4


class Booking(models.Model):
    customer = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="bookings_as_customer")
    worker = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="bookings_as_worker")
    category = models.CharField(max_length=40)
    booking_type = models.CharField(max_length=12, choices=BOOKING_TYPES, default="hourly")
    hours = models.IntegerField(default=0)
    days = models.IntegerField(default=0)
    repeat_daily = models.BooleanField(default=False)
    scheduled_at = models.DateTimeField(null=True, blank=True)  # null = "Book now"
    address = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=15, choices=STATUS, default="pending")
    price = models.IntegerField(default=0)
    payment_method = models.CharField(max_length=20, default="cash")
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_out_at = models.DateTimeField(null=True, blank=True)
    rating = models.IntegerField(null=True, blank=True)
    review = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


def compute_price(worker, booking_type, hours, days):
    if booking_type == "hourly":
        return max(hours, 1) * worker.hourly_rate
    if booking_type == "emergency":
        return int(max(hours, 2) * worker.hourly_rate * 1.5)
    # daily or multi_day
    return max(days, 1) * worker.daily_rate
