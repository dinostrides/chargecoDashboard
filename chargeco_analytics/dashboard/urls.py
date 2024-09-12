from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('login/', views.login),
    path('overviewMap/', views.overviewMap),
    path('overviewRightCards/', views.overviewRightCards),
    path('overviewLeftCards/', views.overviewLeftCards),
    path('overviewTable/', views.overviewTable),
    path('utilisationLeftCards/', views.utilisationLeftCards),
    path('utilisationClusterMap/',views.utilisationClusterMap),
    path('utilisationUtilChart/', views.utilisationUtilChart),
    path('utilisationBarChart/', views.utilisationBarChart),
    path('byStationCards/', views.byStationCards),
    path('byStationHour/', views.byStationHour),
    path('byStationTimeSeriesChart/', views.byStationTimeSeriesChart),
    path('byStationUtilBarChart/', views.byStationUtilBarChart),
    path('pricingCards/', views.pricingCards),
    path('pricingPaymentModeChart/', views.pricingPaymentModeChart),
    path('pricingUtilisationPriceChart/', views.pricingUtilisationPriceChart),
    path('billingTable/', views.billingTable),
    path('billingRevenueChart/', views.billingRevenueChart),
    path('billingEnergyChart/', views.billingEnergyChart),
    path('usersDonutCharts/', views.usersDonutCharts),
    path('usersCards/', views.usersCards),
    path('billingCards/', views.billingCards),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]