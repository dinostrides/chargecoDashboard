from django.urls import path

from . import views

urlpatterns = [
    path('', views.LoginView.as_view(), name='login'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('login_user/', views.LoginUserView.as_view(), name='login_user'),
    path('logout/', views.LogoutUserView.as_view(), name='logout'),
    path('overview/', views.overview, name='overview'),
    path('utilisation/', views.utilisation, name='utilisation'),
    path('by_station/', views.by_station, name='by_station'),
    path('billing/', views.billing, name='billing'),
    path('pricing/', views.pricing, name='pricing'),
    path('users/', views.users, name='users'),    
]