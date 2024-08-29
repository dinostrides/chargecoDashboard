from django.urls import path

from . import views

urlpatterns = [
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
    path('pricingPaymentModeChart/', views.pricingPaymentModeChart)
]