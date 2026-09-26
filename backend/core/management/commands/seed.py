from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from core.models import Booking, Profile


def make(phone, **kw):
    user, _ = User.objects.get_or_create(username=phone)
    p, _ = Profile.objects.update_or_create(user=user, defaults=dict(phone=phone, **kw))
    return p


class Command(BaseCommand):
    help = "Load demo customers, workers and bookings"

    def handle(self, *args, **options):
        Booking.objects.all().delete()
        cust1 = make("0511111111", role="customer", name="Faisal Al-Otaibi", location="Riyadh")
        make("0511111112", role="customer", name="Noura Al-Harbi", location="Jeddah")

        w1 = make("0522222221", role="worker", name="Imran Sheikh", category="Electrician",
                  skills="wiring, breaker panels, lighting", experience_years=6, hourly_rate=45, daily_rate=280,
                  location="Riyadh", available=True, verified=True, rating_avg=4.8, rating_count=32,
                  bio="Licensed electrician, 6 years in residential and commercial wiring.")
        w2 = make("0522222222", role="worker", name="Prakash Nair", category="Plumber",
                  skills="pipe fitting, leak repair, water heaters", experience_years=8, hourly_rate=40,
                  daily_rate=260, location="Riyadh", available=True, verified=True, rating_avg=4.6, rating_count=51,
                  bio="Full-service plumber, quick response for leaks and installations.")
        w3 = make("0522222223", role="worker", name="Ahmed Zaki", category="Electrician",
                  skills="AC wiring, generators", experience_years=3, hourly_rate=35, daily_rate=220,
                  location="Riyadh", available=False, verified=False, rating_avg=4.1, rating_count=9,
                  bio="Electrician for homes and small offices.")
        w4 = make("0522222224", role="worker", name="Jomar Cruz", category="Carpenter",
                  skills="furniture, cabinets, doors", experience_years=10, hourly_rate=50, daily_rate=320,
                  location="Jeddah", available=True, verified=True, rating_avg=4.9, rating_count=64,
                  bio="Custom furniture and carpentry, 10 years experience.")
        make("0522222225", role="worker", name="Michael Santos", category="Painter",
             skills="interior painting, wall texture", experience_years=5, hourly_rate=30, daily_rate=200,
             location="Riyadh", available=True, verified=True, rating_avg=4.4, rating_count=21,
             bio="Fast, neat interior and exterior painting.")
        make("0522222226", role="worker", name="Yusuf Demir", category="AC Technician",
             skills="AC repair, installation, gas refill", experience_years=7, hourly_rate=42, daily_rate=270,
             location="Riyadh", available=True, verified=True, rating_avg=4.7, rating_count=40,
             bio="AC servicing and installation, same-day availability.")

        Booking.objects.create(customer=cust1, worker=w2, category="Plumber", booking_type="hourly", hours=2,
                               address="Al Olaya, Riyadh", status="completed", price=80, payment_method="mada",
                               rating=5, review="Fixed the leak quickly, very professional.")
        Booking.objects.create(customer=cust1, worker=w1, category="Electrician", booking_type="daily", days=1,
                               address="Al Olaya, Riyadh", status="in_progress", price=280,
                               payment_method="cash")
        Booking.objects.create(customer=cust1, worker=w4, category="Carpenter", booking_type="hourly", hours=3,
                               address="Al Olaya, Riyadh", status="pending", price=150, payment_method="wallet")
        w2.rating_avg, w2.rating_count = 4.6, 51
        w2.save()
        self.stdout.write(self.style.SUCCESS("Demo data loaded."))
        self.stdout.write("Customer login: 0511111111 (OTP 123456)")
        self.stdout.write("Worker login:   0522222221 (OTP 123456)")
