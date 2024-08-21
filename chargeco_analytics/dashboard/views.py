from django.contrib import messages
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from django.urls import reverse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.core.serializers.json import DjangoJSONEncoder
from django.core.cache import cache
from django.views import View
import pandas as pd
import json
import datetime
from .utils import data_loader
from .utils import charts_generator
import plotly.express as px
import plotly.io as pio

# import logging

# logger=logging.getLogger('django')

class LoginView(View):
    @method_decorator(require_GET)
    def get(self, request):
        response = render(request, "login.html")
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response

class LoginUserView(View):
    @method_decorator(require_POST)
    def post(self, request):
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('overview')
        else:
            return render(request, "login.html", {'error': 'Invalid username or password'})

class LogoutUserView(View):
    @method_decorator(require_http_methods(["GET", "POST"]))
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def get(self, request):
        logout(request)
        return redirect('login')

    def post(self, request):
        logout(request)
        return redirect('login')

@require_GET
@login_required
def overview(request):
    # Load data for the page
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)
    inactive_chargers = data_loader.load_inactive_chargers()
    
    # Load charts/data for the page
    locations_utilised = str(len(charging_transactions['Site Name'].unique()))

    total_chargers = charging_transactions['Station ID'].nunique()
    total_sessions = charging_transactions['Transaction ID'].nunique()
    avg_charging_sessions = f'{round(total_sessions/total_chargers)}'

    total_users = charging_transactions['User ID'].nunique()
    avg_unique_vehicles = f'{round(total_users/total_chargers)}'

    charger_utilisation = charts_generator.create_util_table(charging_transactions, min_date, max_date, inactive_chargers)
    avg_utilisation = str(round(sum(charger_utilisation['Utilisation Rate'])/len(charger_utilisation),1))

    total_active_locations = str(len(charger_data['name'].unique()))
    total_active_charging_points = str(len(charger_data['evCpId'].unique()))

    overview_map = charts_generator.create_plotly_map(charger_data)
    # Convert the map to JSON 
    map_json = pio.to_json(overview_map)


    # overview_map = charts_generator.create_map(charger_data)._repr_html_()

    # # Convert the map to JSON
    # map_json = overview_map._to_json()

    context = {
        'locations_utilised': locations_utilised, #str
        'avg_charging_sessions': avg_charging_sessions, #str
        'avg_unique_vehicles': avg_unique_vehicles, #str
        'avg_utilisation': avg_utilisation, #str 
        'charger_utilisation_df': charger_utilisation.to_html(index=False, classes="dataframe"), #str
        'total_active_locations': total_active_locations, #str
        'total_active_charging_points': total_active_charging_points, #str
        'map': map_json #JSON
        # 'map_json': json.dumps(map_json) # Pass the map as a JSON string
    }
    return render(request, "overview.html", context)

@require_GET
@login_required
def utilisation(request):
    # Cache key for the page
    cache_key = 'utilisation_page_data'
    cached_data = cache.get(cache_key)

    if cached_data:
        context = cached_data
    else:
        # Load data
        charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
        charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)
        
        # Calculate total number of charging sessions
        total_charging_sessions = charging_transactions['Transaction ID'].nunique()

        # Calculate the number of AC and DC charging sessions
        ac_sessions = charging_transactions[charging_transactions['power_type'] == 'AC']['Transaction ID'].nunique()
        dc_sessions = charging_transactions[charging_transactions['power_type'] == 'DC']['Transaction ID'].nunique()

        # Calculate the average duration (in minutes) per AC/DC session
        ac_avg_duration = charging_transactions[charging_transactions['power_type'] == 'AC']['totalDuration'].mean()
        dc_avg_duration = charging_transactions[charging_transactions['power_type'] == 'DC']['totalDuration'].mean()

        # Generate charts/maps
        utilisation_chart = charts_generator.util_hour_chart(charging_transactions)._repr_html_()
        utilisation_map = charts_generator.get_util_clustermap(charging_transactions)._repr_html_()
        util_dayNight = charts_generator.util_bar_chart(charging_transactions, x_variable='Day/Night', start_date=min_date, end_date=max_date)._repr_html_()
        util_weekdayWeekend = charts_generator.util_bar_chart(charging_transactions, x_variable='Weekend/Weekday', start_date=min_date, end_date=max_date)._repr_html_()

        context = {
            'utilisation_chart': utilisation_chart,
            'utilisation_map': utilisation_map,
            'total_charging_sessions': total_charging_sessions,
            'ac_sessions': ac_sessions,
            'dc_sessions': dc_sessions,
            'ac_avg_duration': ac_avg_duration,
            'dc_avg_duration': dc_avg_duration,
            'util_dayNight': util_dayNight,
            'util_weekdayWeekend': util_weekdayWeekend
        }

        # Cache the context data
        cache.set(cache_key, context, 60 * 15)  # Cache for 15 minutes
    return render(request, "utilisation.html", context)

@require_GET
@login_required
def by_station(request):
    # Load data
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)
    inactive_chargers = data_loader.load_inactive_chargers()

    # Get unique site names for the dropdown filter
    site_names = charging_transactions['Site Name'].unique()

    # Get the selected site name from the GET parameters
    selected_site_name = request.GET.get('site_name')

    # Filter the data based on the selected site name
    if selected_site_name:
        filtered_transactions = charging_transactions[charging_transactions['Site Name'] == selected_site_name]
    else:
        # filtered_transactions = pd.DataFrame()  # Create an empty DataFrame to avoid errors
        filtered_transactions = charging_transactions  # If no site is selected, show all data

    # Creat df for filtered transactions (['Charger ID', 'Utilisation Rate'])
    charger_utilisation = charts_generator.create_util_table(filtered_transactions, min_date, max_date, inactive_charger_dict=inactive_chargers)

    # Determining total chargers, avg. price and avg. utilisation rate
    if len(filtered_transactions) == 0:
        num_chargers = 0
        price = 'NA'
        avg_price = 0
        avg_util = 0
    else:
        num_chargers = filtered_transactions['Station ID'].nunique()
        prices = list(filtered_transactions['Rate'])
        avg_price = round(sum(prices)/len(prices), 2)
        avg_util = round(sum(charger_utilisation['Utilisation Rate'])/len(charger_utilisation), 2)

    # Generate charts/maps
    station_hour = charts_generator.station_hour_chart(filtered_transactions, start_date=min_date, end_date=max_date)._repr_html_()
    util_dayNight = charts_generator.util_bar_chart(filtered_transactions, x_variable='Day/Night', start_date=min_date, end_date=max_date)._repr_html_()
    util_weekdayWeekend = charts_generator.util_bar_chart(filtered_transactions, x_variable='Weekend/Weekday', start_date=min_date, end_date=max_date)._repr_html_()
    util_timeseries = charts_generator.util_timeseries_chart(filtered_transactions, start_date=min_date, end_date=max_date)._repr_html_()

    context = {
        'site_names': site_names,
        'num_chargers': num_chargers,
        'avg_price': avg_price,
        'avg_util': avg_util,
        'station_hour': station_hour,
        'util_dayNight': util_dayNight,
        'util_weekdayWeekend': util_weekdayWeekend,
        'util_timeseries': util_timeseries
    }

    return render(request, "by_station.html", context)

@require_GET
@login_required
def billing(request):
    # Load data
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)
    
    # Calculating average energy per month
    total_energy = sum(charger_charging['total_energy'])
    unique_months_count = len(charger_charging['month'].unique())
    average_energy_per_month = round(total_energy / unique_months_count)

    # Calculating average cost per month
    total_cost = sum(charger_charging['total_cost'])
    average_cost_per_month = total_cost / unique_months_count

    # Data Visualisations
    energy_expenditure_df = charts_generator.energy_expenditure_table(charger_charging)
    total_energy_cost = charts_generator.total_energy_cost_chart(charger_charging)._repr_html_()
    monthly_energy_consumption = charts_generator.monthly_energy_consumption_chart(charger_charging)._repr_html_()

    context = {
        'average_energy_per_month': average_energy_per_month,
        'average_cost_per_month': average_cost_per_month,
        'energy_expenditure_df': energy_expenditure_df.to_html(index=False, classes="dataframe"),
        'total_energy_cost': total_energy_cost,
        'monthly_energy_consumption': monthly_energy_consumption
    }
    return render(request, "billing.html", context)

@require_GET
@login_required
def pricing(request):
    # Load data
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)
    
    # Calculating average rate
    avg_price = round(sum(charging_transactions['Rate'])/len(charging_transactions), 2)
    
    # Calculating data visualisations
    payment_mode_donut = charts_generator.payment_mode_donut_chart(charging_transactions)._repr_html_()
    price_util_chart = charts_generator.get_util_price_chart(charging_transactions)._repr_html_()

    context = {
        'avg_price': avg_price,
        'payment_mode_donut': payment_mode_donut,
        'price_util_chart': price_util_chart
    }
    return render(request, "pricing.html", context)

@require_GET
@login_required
def users(request):
    # Load data
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)
    
    # User Breakdown
    num_public = len(set(charging_transactions[charging_transactions['User Type Cleaned'] == 'Public']['User ID'].dropna()))
    num_fleet = len(set(charging_transactions[charging_transactions['User Type Cleaned'] == 'Fleet']['User ID'].dropna()))
    num_member = len(set(charging_transactions[charging_transactions['User Type Cleaned'] == 'Member']['User ID'].dropna()))
    num_partner = len(set(charging_transactions[charging_transactions['User Type Cleaned'] == 'Partner']['User ID'].dropna()))
    num_total = len(set(charging_transactions['User ID'].dropna()))

    # Data Visualisations
    user_donut = charts_generator.user_donut_chart(charging_transactions)._repr_html_()
    fleet_donut = charts_generator.fleet_donut_chart(charging_transactions)._repr_html_()
    member_donut = charts_generator.member_donut_chart(charging_transactions)._repr_html_()
    partner_donut = charts_generator.partner_donut_chart(charging_transactions)._repr_html_()
    user_across_time_chart = charts_generator.user_across_time(charging_transactions)._repr_html_()


    context = {
        'num_public': num_public,
        'num_fleet': num_fleet,
        'num_member': num_member,
        'num_partner': num_partner,
        'num_total': num_total,
        'user_donut': user_donut,
        'fleet_donut': fleet_donut,
        'member_donut': member_donut,
        'partner_donut': partner_donut,
        'user_across_time_chart': user_across_time_chart
    }

    return render(request, "users.html", context)

