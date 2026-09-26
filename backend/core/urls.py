from django.urls import path
from . import views

urlpatterns = [
    path("auth/login", views.login),
    path("me", views.me),
    path("stats", views.stats),
    path("categories", views.categories),
    path("workers", views.workers),
    path("bookings", views.bookings),
    path("bookings/<int:booking_id>", views.update_booking),
    path("bookings/<int:booking_id>/rate", views.rate_booking),
]
