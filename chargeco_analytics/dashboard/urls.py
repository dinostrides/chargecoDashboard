from django.urls import path

from . import views

urlpatterns = [
    path('overviewMap/', views.overviewMap),
    path('overviewRightCards/', views.overviewRightCards),
    path('overviewLeftCards/', views.overviewLeftCards),
    path('overviewTable/', views.overviewTable),
]