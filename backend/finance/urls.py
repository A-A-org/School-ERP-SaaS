from django.urls import path

from .views import (
    FeeListCreateView,
    FeeDetailView,

    PaymentListCreateView,
    PaymentDetailView,

    GenerateFeeView,
    GenerateMonthlyFeesView,

    SalaryListCreateView,
    SalaryDetailView,

    SalaryPaymentListCreateView,
    SalaryPaymentDetailView,

    GenerateMonthlySalariesView,
)


urlpatterns = [

    # ==========================
    # Fees
    # ==========================

    path(
        "fees/",
        FeeListCreateView.as_view(),
        name="fee-list"
    ),

    path(
        "fees/<int:pk>/",
        FeeDetailView.as_view(),
        name="fee-detail"
    ),

    # ==========================
    # Payments
    # ==========================

    path(
        "payments/",
        PaymentListCreateView.as_view(),
        name="payment-list"
    ),

    path(
        "payments/<int:pk>/",
        PaymentDetailView.as_view(),
        name="payment-detail"
    ),

    # ==========================
    # Generate Fee
    # ==========================

    path(
        "generate-fee/",
        GenerateFeeView.as_view(),
        name="generate-fee"
    ),

# ==========================
# Generate Monthly Fees
# ==========================

path(
    "generate-monthly-fees/",
    GenerateMonthlyFeesView.as_view(),
    name="generate-monthly-fees"
),

# ==========================
# Salaries
# ==========================

path(
    "salaries/",
    SalaryListCreateView.as_view(),
    name="salary-list"
),

path(
    "salaries/<int:pk>/",
    SalaryDetailView.as_view(),
    name="salary-detail"
),

# ==========================
# Salary Payments
# ==========================

path(
    "salary-payments/",
    SalaryPaymentListCreateView.as_view(),
    name="salary-payment-list"
),

path(
    "salary-payments/<int:pk>/",
    SalaryPaymentDetailView.as_view(),
    name="salary-payment-detail"
),

path(
    "generate-monthly-salaries/",
    GenerateMonthlySalariesView.as_view(),
    name="generate-monthly-salaries"
),

]