from django.contrib.auth.models import User
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import CATEGORIES, Booking, Profile, compute_price

DEMO_OTP = "123456"
PROFILE_FIELDS = ["id", "role", "name", "phone", "location", "category", "skills", "experience_years",
                  "hourly_rate", "daily_rate", "bio", "available", "verified", "rating_avg", "rating_count"]
EDITABLE = ["name", "location", "category", "skills", "experience_years", "hourly_rate", "daily_rate",
            "bio", "available"]
INT_FIELDS = {"experience_years", "hourly_rate", "daily_rate"}
BOOL_FIELDS = {"available"}


def err(msg, code=400):
    return Response({"error": msg}, status=code)


def num(v, default=0):
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return default


def profile_dict(p):
    return {f: getattr(p, f) for f in PROFILE_FIELDS}


def worker_dict(w):
    d = profile_dict(w)
    d["eta_minutes"] = w.eta_minutes
    return d


def booking_dict(b):
    return {
        "id": b.id, "category": b.category, "booking_type": b.booking_type, "hours": b.hours, "days": b.days,
        "repeat_daily": b.repeat_daily,
        "scheduled_at": b.scheduled_at.isoformat() if b.scheduled_at else None,
        "address": b.address, "status": b.status, "price": b.price, "payment_method": b.payment_method,
        "checked_in_at": b.checked_in_at.isoformat() if b.checked_in_at else None,
        "checked_out_at": b.checked_out_at.isoformat() if b.checked_out_at else None,
        "rating": b.rating, "review": b.review, "created_at": b.created_at.isoformat(),
        "customer": {"id": b.customer.id, "name": b.customer.name, "phone": b.customer.phone,
                     "location": b.customer.location},
        "worker": {"id": b.worker.id, "name": b.worker.name, "category": b.worker.category,
                   "rating_avg": b.worker.rating_avg, "rating_count": b.worker.rating_count,
                   "hourly_rate": b.worker.hourly_rate, "daily_rate": b.worker.daily_rate},
    }


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def login(request):
    d = request.data
    phone = (d.get("phone") or "").strip()
    if len(phone) < 8:
        return err("Enter a valid mobile number")
    if str(d.get("otp")) != DEMO_OTP:
        return err("Invalid OTP (demo OTP is 123456)")
    user = User.objects.filter(username=phone).first()
    if not user:
        role = d.get("role")
        if role not in ("customer", "worker"):
            return err("Choose a role")
        name = (d.get("name") or "").strip()
        user = User.objects.create_user(username=phone)
        Profile.objects.create(
            user=user, role=role, name=name, phone=phone,
            category=d.get("category", "") if role == "worker" else "",
            hourly_rate=40 if role == "worker" else 0, daily_rate=250 if role == "worker" else 0,
        )
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "profile": profile_dict(user.profile)})


@api_view(["GET", "PUT"])
def me(request):
    p = request.user.profile
    if request.method == "PUT":
        for f in EDITABLE:
            if f in request.data:
                v = request.data[f]
                if f in INT_FIELDS:
                    setattr(p, f, num(v))
                elif f in BOOL_FIELDS:
                    setattr(p, f, bool(v))
                else:
                    setattr(p, f, str(v))
        p.save()
    return Response(profile_dict(p))


@api_view(["GET"])
def stats(request):
    p = request.user.profile
    if p.role == "worker":
        qs = Booking.objects.filter(worker=p)
        completed = qs.filter(status="completed")
        return Response({
            "earnings": sum(b.price for b in completed),
            "jobs_completed": completed.count(),
            "active": qs.filter(status__in=["accepted", "in_progress"]).count(),
            "rating_avg": round(p.rating_avg, 1),
        })
    qs = Booking.objects.filter(customer=p)
    return Response({
        "total_bookings": qs.count(),
        "active": qs.filter(status__in=["pending", "accepted", "in_progress"]).count(),
        "completed": qs.filter(status="completed").count(),
    })


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def categories(request):
    return Response(CATEGORIES)


@api_view(["GET"])
def workers(request):
    cat = request.query_params.get("category")
    qs = Profile.objects.filter(role="worker")
    if cat:
        qs = qs.filter(category=cat)
    qs = qs.order_by("-available", "-rating_avg")
    return Response([worker_dict(w) for w in qs])


@api_view(["GET", "POST"])
def bookings(request):
    p = request.user.profile
    if request.method == "POST":
        if p.role != "customer":
            return err("Only customers can create bookings", 403)
        d = request.data
        worker = Profile.objects.filter(pk=d.get("worker_id"), role="worker").first()
        if not worker:
            return err("Worker not found")
        booking_type = d.get("booking_type", "hourly")
        if booking_type not in dict(dict.fromkeys(["hourly", "daily", "multi_day", "emergency"])):
            pass
        hours, days = num(d.get("hours")), num(d.get("days"))
        scheduled_at = parse_datetime(d.get("scheduled_at")) if d.get("scheduled_at") else None
        price = compute_price(worker, booking_type, hours, days)
        b = Booking.objects.create(
            customer=p, worker=worker, category=worker.category, booking_type=booking_type,
            hours=hours, days=days, repeat_daily=bool(d.get("repeat_daily")), scheduled_at=scheduled_at,
            address=d.get("address", p.location), price=price, payment_method=d.get("payment_method", "cash"),
        )
        return Response(booking_dict(b), status=201)
    if p.role == "worker":
        qs = Booking.objects.filter(worker=p)
    else:
        qs = Booking.objects.filter(customer=p)
    return Response([booking_dict(b) for b in qs])


@api_view(["PATCH"])
def update_booking(request, booking_id):
    p = request.user.profile
    b = Booking.objects.filter(pk=booking_id).first()
    if not b or (p.role == "worker" and b.worker_id != p.id) or (p.role == "customer" and b.customer_id != p.id):
        return err("Booking not found", 404)
    st = request.data.get("status")
    if not st:
        return err("status is required")
    now = timezone.now()
    if p.role == "worker":
        if st == "accepted" and b.status == "pending":
            b.status = "accepted"
        elif st == "rejected" and b.status == "pending":
            b.status = "rejected"
        elif st == "in_progress" and b.status == "accepted":
            b.status = "in_progress"
            b.checked_in_at = now
        elif st == "completed" and b.status == "in_progress":
            b.status = "completed"
            b.checked_out_at = now
        else:
            return err("Invalid status change")
    else:  # customer
        if st == "cancelled" and b.status in ("pending", "accepted"):
            b.status = "cancelled"
        else:
            return err("Invalid status change")
    b.save()
    return Response(booking_dict(b))


@api_view(["POST"])
def rate_booking(request, booking_id):
    p = request.user.profile
    b = Booking.objects.filter(pk=booking_id, customer=p, status="completed").first()
    if not b:
        return err("Booking not found", 404)
    if b.rating:
        return err("Already rated")
    stars = num(request.data.get("rating"))
    if not 1 <= stars <= 5:
        return err("Rating must be 1-5")
    b.rating = stars
    b.review = request.data.get("review", "")[:300]
    b.save()
    w = b.worker
    total = w.rating_avg * w.rating_count + stars
    w.rating_count += 1
    w.rating_avg = round(total / w.rating_count, 2)
    w.save()
    return Response(booking_dict(b))
