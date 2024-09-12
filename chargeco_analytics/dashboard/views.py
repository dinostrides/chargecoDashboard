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
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

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

########################################################
####################### OVERVIEW #######################
########################################################

#this function returns the data to display the markers on the map of the overview page (lat, lon, color)
@csrf_exempt
@require_POST
def overviewMap(request):
    data = json.loads(request.body.decode('utf-8'))
    locationStatus = data.get("location_status") #either "all", "coming_soon", "in_operation", "no_charging_points"
    powerType = data.get("power_type") #either "all", "ac", "dc"

    #todo: use locationStatus and powerType to filter results then return it below as response

    # Load data for the page
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()

    # Filtering on locationStatus and powerType filters
    if powerType == "All":
        charger_data = charger_data
    elif powerType == "AC":
        charger_data = charger_data[charger_data['power_type'] == 'AC']
    elif powerType == "DC":
        charger_data = charger_data[charger_data['power_type'] == 'DC']

    if locationStatus == "All":
        charger_data = charger_data
    elif locationStatus == "in_operation":
        charger_data = charger_data[charger_data['In Operation'] == 'In Operation']
    elif locationStatus == "coming_soon":
        charger_data = charger_data[charger_data['In Operation'] == 'Coming Soon']
    elif locationStatus == "no_charging_points":
        charger_data = charger_data[pd.isna(charger_data['evCpId'])]
    

    # Determine marker color based on conditions
    charger_data['marker_color'] = charger_data.apply(lambda row: 'red' if pd.isna(row['evCpId']) else 'Orange' if "Coming Soon" in str(row['name']) else 'Green', axis=1)

    # Convert relevant data to JSON
    map_data_json = json.dumps({
        'lat': charger_data['latitude'].tolist(),
        'lon': charger_data['longitude'].tolist(),
        'color': charger_data['marker_color'].tolist(),
    })

    return JsonResponse(map_data_json, safe=False)

#this function returns the total locations and total charging points on overview page
@csrf_exempt
@require_POST
def overviewRightCards(request):
    data = json.loads(request.body.decode('utf-8'))
    locationStatus = data.get("location_status") #either "All", "coming_soon", "in_operation", "no_charging_points"
    powerType = data.get("power_type") #either "All", "AC", "DC"

    # Load data for the page
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    
    # Filtering on locationStatus and powerType filters
    if powerType == "All":
        charger_data = charger_data
    elif powerType == "AC":
        charger_data = charger_data[charger_data['power_type'] == "AC"]
    elif powerType == "DC":
        charger_data = charger_data[charger_data['power_type'] == "DC"]

    if locationStatus == "All":
        charger_data = charger_data
    elif locationStatus == "in_operation":
        charger_data = charger_data[charger_data['In Operation'] == "In Operation"]
    elif locationStatus == "coming_soon":
        charger_data = charger_data[charger_data['In Operation'] == "Coming Soon"]
    elif locationStatus == "no_charging_points":
        charger_data = charger_data[pd.isna(charger_data['evCpId'])]

    total_locations = str(len(charger_data['name'].unique()))
    total_active_points = str(len(charger_data['evCpId'].unique()))

    response = {
        "total_locations": total_locations,
        "total_charging_points": total_active_points
    }

    return JsonResponse(response, safe=False)

#this function returns the locations utilised, avg charging sessions per location, avg unique vehicles per location and avg utilisation
@csrf_exempt
@require_POST
def overviewLeftCards(request):
    data = json.loads(request.body.decode('utf-8'))
    startDate = data.get("start_date") #when date is logged it looks like this - 2023-08-24T05:52:25.000Z
    endDate = data.get("end_date")

    # Convert startDate and endDate to datetime objects
    startDate = pd.to_datetime(startDate, errors='coerce')
    endDate = pd.to_datetime(endDate, errors='coerce')
    startDate = startDate.strftime('%d/%m/%Y %H:%M')
    endDate = endDate.strftime('%d/%m/%Y %H:%M')

    # Load data for the page
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)
    inactive_chargers = data_loader.load_inactive_chargers()

    # Filter transactions based on startDate and endDate
    charging_transactions = charging_transactions[
        (charging_transactions['Start Date/Time'] >= startDate) &
        (charging_transactions['Start Date/Time'] <= endDate)
    ]

    # Load charts/data for the page
    locations_utilised = str(len(charging_transactions['Site Name'].unique()))

    total_chargers = charging_transactions['Station ID'].nunique()
    total_sessions = charging_transactions['Transaction ID'].nunique()
    avg_charging_sessions = f'{round(total_sessions/total_chargers)}'

    total_users = charging_transactions['User ID'].nunique()
    avg_unique_vehicles = f'{round(total_users/total_chargers)}'

    charger_utilisation = charts_generator.create_util_table(charging_transactions, min_date, max_date, inactive_chargers)
    avg_utilisation = str(round(sum(charger_utilisation['Utilisation Rate'])/len(charger_utilisation),1))

    response = {
        "locations_utilised": locations_utilised,
        "avg_charging_sessions_per_location": avg_charging_sessions,
        "avg_unique_vehicles_per_location": avg_unique_vehicles,
        "avg_utilisation": avg_utilisation,
    }    

    return JsonResponse(response, safe=False)

#this function returns the chargerid and utilisation rate to be displayed in the overview page table
@csrf_exempt
@require_POST
def overviewTable(request):
    data = json.loads(request.body.decode('utf-8'))
    startDate = data.get("start_date")
    endDate = data.get("end_date")

    # Convert startDate and endDate to datetime objects
    startDate = pd.to_datetime(startDate, errors='coerce')
    endDate = pd.to_datetime(endDate, errors='coerce')
    startDate = startDate.strftime('%d/%m/%Y %H:%M')
    endDate = endDate.strftime('%d/%m/%Y %H:%M')

    # Load data for the page
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)
    inactive_chargers = data_loader.load_inactive_chargers()

    # Filter transactions based on startDate and endDate
    charging_transactions = charging_transactions[
        (charging_transactions['Start Date/Time'] >= startDate) &
        (charging_transactions['Start Date/Time'] <= endDate)
    ]

    # Use startDate and endDate to filter data, then return it below in response
    charger_utilisation = charts_generator.create_util_table(charging_transactions, min_date, max_date, inactive_chargers)
    
    # Rename the columns in the DataFrame
    charger_utilisation = charger_utilisation.rename(columns={
        'Charger ID': 'chargerId',
        'Utilisation Rate': 'utilizationRate'
    })
    
    # Convert DataFrame to a list of dictionaries
    charger_utilisation_dict = charger_utilisation.to_dict(orient='records')

    return JsonResponse(charger_utilisation_dict, safe=False)

###########################################################
####################### UTILISATION #######################
###########################################################

#this function returns the total charging sessions, ac/dc charging sessions, avg mins per ac/dc charging session
@csrf_exempt
@require_POST
def utilisationLeftCards(request):
    data = json.loads(request.body.decode('utf-8'))
    startDate = data.get("start_date") #when date is logged it looks like this - 2023-08-24T05:52:25.000Z
    endDate = data.get("end_date")
    address = data.get("address")
    charger = data.get("charger")

    # Convert startDate and endDate to datetime objects
    startDate = pd.to_datetime(startDate, errors='coerce')
    endDate = pd.to_datetime(endDate, errors='coerce')
    startDate = startDate.strftime('%d/%m/%Y %H:%M')
    endDate = endDate.strftime('%d/%m/%Y %H:%M')
    startDate = pd.to_datetime(startDate, errors='coerce')
    endDate = pd.to_datetime(endDate, errors='coerce')

    # Load data for the page
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)

    # Filter transactions based on startDate, endDate, address and charger
    charging_transactions = charging_transactions[
        (charging_transactions['Start Date/Time'] >= startDate) &
        (charging_transactions['Start Date/Time'] <= endDate)
    ]
    
    if address == "All":
        charging_transactions = charging_transactions
    else:
        charging_transactions = charging_transactions[charging_transactions['address'] == address]
    
    if charger == "All":
        charging_transactions = charging_transactions
    else:
        charging_transactions = charging_transactions[charging_transactions['evCpId'] == charger]
    
    # Calculate total number of charging sessions
    total_charging_sessions = charging_transactions['Transaction ID'].nunique()

    # Calculate the number of AC and DC charging sessions
    ac_sessions = charging_transactions[charging_transactions['power_type'] == 'AC']['Transaction ID'].nunique()
    dc_sessions = charging_transactions[charging_transactions['power_type'] == 'DC']['Transaction ID'].nunique()

    # Calculate the average duration (in minutes) per AC/DC session
    ac_avg_duration = charging_transactions[charging_transactions['power_type'] == 'AC']['totalDuration'].mean()
    dc_avg_duration = charging_transactions[charging_transactions['power_type'] == 'DC']['totalDuration'].mean()

 
    response = {
        "total_charging_sessions": total_charging_sessions,
        "ac_sessions": ac_sessions,
        "dc_sessions": dc_sessions,
        "ac_avg_duration": ac_avg_duration,
        "dc_avg_duration": dc_avg_duration
    }    

    return JsonResponse(response, safe=False)

#this function returns the heatmap
@csrf_exempt
@require_POST
def utilisationClusterMap(request):
    data = json.loads(request.body.decode('utf-8'))
    startDate = data.get("start_date") #when date is logged it looks like this - 2023-08-24T05:52:25.000Z
    endDate = data.get("end_date")
    address = data.get("address")
    charger = data.get("charger")

    # Convert startDate and endDate to datetime objects
    startDate = pd.to_datetime(startDate, errors='coerce')
    endDate = pd.to_datetime(endDate, errors='coerce')
    startDate = startDate.strftime('%d/%m/%Y %H:%M')
    endDate = endDate.strftime('%d/%m/%Y %H:%M')
    startDate = pd.to_datetime(startDate, errors='coerce')
    endDate = pd.to_datetime(endDate, errors='coerce')

    # Load data for the page
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)

    # Filter transactions based on startDate, endDate, address and charger
    charging_transactions = charging_transactions[
        (charging_transactions['Start Date/Time'] >= startDate) &
        (charging_transactions['Start Date/Time'] <= endDate)
    ]
    
    if address == "All":
        charging_transactions = charging_transactions
    else:
        charging_transactions = charging_transactions[charging_transactions['address'] == address]
    
    if charger == "All":
        charging_transactions = charging_transactions
    else:
        charging_transactions = charging_transactions[charging_transactions['evCpId'] == charger]
    
    clustermap_markers_json_str = charts_generator.get_util_clustermap_json(charging_transactions)
    clustermap_markers_json = json.loads(clustermap_markers_json_str)

    response = {
        "clustermap_markers_json": clustermap_markers_json
    }    

    return JsonResponse(response, safe=False)

#this function returns the utilisation chart
@csrf_exempt
@require_POST
def utilisationUtilChart(request):
    data = json.loads(request.body.decode('utf-8'))
    startDate = data.get("start_date") #when date is logged it looks like this - 2023-08-24T05:52:25.000Z
    endDate = data.get("end_date")
    address = data.get("address")
    charger = data.get("charger")

    # Load cached data if available
    cache_key = "utilisation_util_chart"
    cached_data = cache.get(cache_key)
    if cached_data:
        return JsonResponse(cached_data, safe=False)

    # Convert startDate and endDate to datetime objects
    startDate = pd.to_datetime(startDate, errors='coerce')
    endDate = pd.to_datetime(endDate, errors='coerce')
    startDate = startDate.strftime('%d/%m/%Y %H:%M')
    endDate = endDate.strftime('%d/%m/%Y %H:%M')
    startDate = pd.to_datetime(startDate, errors='coerce')
    endDate = pd.to_datetime(endDate, errors='coerce')

    # Load data for the page
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)

    # Filter transactions based on startDate, endDate, address and charger
    charging_transactions = charging_transactions[
        (charging_transactions['Start Date/Time'] >= startDate) &
        (charging_transactions['Start Date/Time'] <= endDate)
    ]
    
    if address == "All":
        charging_transactions = charging_transactions
    else:
        charging_transactions = charging_transactions[charging_transactions['address'] == address]
    
    if charger == "All":
        charging_transactions = charging_transactions
    else:
        charging_transactions = charging_transactions[charging_transactions['evCpId'] == charger]
    
    # Generate the utilisation hourly chart data
    utilisation_hourly_chart_data_json_str = charts_generator.util_hour_chart_json(charging_transactions)
    utilisation_hourly_chart_data_json = json.loads(utilisation_hourly_chart_data_json_str)

    response = {
        'utilisation_hourly_chart_data_json': utilisation_hourly_chart_data_json
    }    

    # Cache the response data for future requests
    cache.set(cache_key, response, timeout=3000)

    return JsonResponse(response, safe=False)

#this function returns the day/night & weekend/weekday chart
@csrf_exempt
@require_POST
def utilisationBarChart(request):
    data = json.loads(request.body.decode('utf-8'))
    startDate = data.get("start_date") #when date is logged it looks like this - 2023-08-24T05:52:25.000Z
    endDate = data.get("end_date")
    address = data.get("address")
    charger = data.get("charger")

    # Load cached data if available
    cache_key = "utilisation_bar_chart"
    cached_data = cache.get(cache_key)
    if cached_data:
        return JsonResponse(cached_data, safe=False)

    # Convert startDate and endDate to datetime objects
    startDate = pd.to_datetime(startDate, errors='coerce')
    endDate = pd.to_datetime(endDate, errors='coerce')
    startDate = startDate.strftime('%d/%m/%Y %H:%M')
    endDate = endDate.strftime('%d/%m/%Y %H:%M')
    startDate = pd.to_datetime(startDate, errors='coerce')
    endDate = pd.to_datetime(endDate, errors='coerce')

    # Load data for the page
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)

    # Filter transactions based on startDate, endDate, address and charger
    charging_transactions = charging_transactions[
        (charging_transactions['Start Date/Time'] >= startDate) &
        (charging_transactions['Start Date/Time'] <= endDate)
    ]
    
    if address == "All":
        charging_transactions = charging_transactions
    else:
        charging_transactions = charging_transactions[charging_transactions['address'] == address]
    
    if charger == "All":
        charging_transactions = charging_transactions
    else:
        charging_transactions = charging_transactions[charging_transactions['evCpId'] == charger]
    

    util_dayNight_data_json_str = charts_generator.util_bar_chart_json(charging_transactions, x_variable='Day/Night', start_date=min_date, end_date=max_date)
    util_weekdayWeekend_data_json_str = charts_generator.util_bar_chart_json(charging_transactions, x_variable='Weekend/Weekday', start_date=min_date, end_date=max_date)

    util_dayNight_data_json = json.loads(util_dayNight_data_json_str)
    util_weekdayWeekend_data_json = json.loads(util_weekdayWeekend_data_json_str)

    response = {
        'util_dayNight_data_json': util_dayNight_data_json,
        'util_weekdayWeekend_data_json':util_weekdayWeekend_data_json
    }    

    # Cache the response data for future requests
    cache.set(cache_key, response, timeout=3000)

    return JsonResponse(response, safe=False)

###########################################################
####################### BY_STATION ########################
###########################################################

@csrf_exempt
@require_POST
def byStationCards(request):
    data = json.loads(request.body.decode('utf-8'))
    startDate = data.get("start_date")
    endDate = data.get("end_date")
    location = data.get("location")
    powerType = data.get("power_type")

    # Convert startDate and endDate to datetime objects
    startDate = pd.to_datetime(startDate, errors='coerce')
    endDate = pd.to_datetime(endDate, errors='coerce')
    startDate = startDate.strftime('%d/%m/%Y %H:%M')
    endDate = endDate.strftime('%d/%m/%Y %H:%M')

    # Generate a unique cache key based on filters
    cache_key = f"stationcards_{startDate}_{endDate}_{location}_{powerType}"

    # Load cached data if available
    cached_data = cache.get(cache_key)
    if cached_data:
        return JsonResponse(cached_data, safe=False)
    
    # Load data
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)
    inactive_chargers = data_loader.load_inactive_chargers()

    # Filter transactions based on startDate, endDate, location and powerType
    charging_transactions = charging_transactions[
        (charging_transactions['Start Date/Time'] >= startDate) &
        (charging_transactions['Start Date/Time'] <= endDate)
    ]
    selected_site_name = location
    if selected_site_name:
        filtered_transactions = charging_transactions[charging_transactions['Site Name'] == selected_site_name]
    else:
        filtered_transactions = charging_transactions  
    if powerType == "All":
        charger_data = charger_data
    elif powerType == "AC":
        charger_data = charger_data[charger_data['power_type'] == "AC"]
    elif powerType == "DC":
        charger_data = charger_data[charger_data['power_type'] == "DC"]

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

    response = {
        'num_chargers': num_chargers,
        'avg_price': avg_price,
        'avg_util': avg_util
    }    

    # Cache the response data for future requests
    cache.set(cache_key, response, timeout=3000)

    return JsonResponse(response, safe=False)

@csrf_exempt
@require_POST
def byStationHour(request):
    data = json.loads(request.body.decode('utf-8'))
    startDate = data.get("start_date")
    endDate = data.get("end_date")
    location = data.get("location")
    powerType = data.get("power_type")

    # Convert startDate and endDate to datetime objects
    startDate = pd.to_datetime(startDate, errors='coerce')
    endDate = pd.to_datetime(endDate, errors='coerce')
    startDate = startDate.strftime('%d/%m/%Y %H:%M')
    endDate = endDate.strftime('%d/%m/%Y %H:%M')

    # Generate a unique cache key based on filters
    cache_key = f"stationhour_{startDate}_{endDate}_{location}_{powerType}"

    # Load cached data if available
    cached_data = cache.get(cache_key)
    if cached_data:
        return JsonResponse(cached_data, safe=False)

    # Load data
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)

    # Filter transactions based on startDate, endDate, location and powerType
    charging_transactions = charging_transactions[
        (charging_transactions['Start Date/Time'] >= startDate) &
        (charging_transactions['Start Date/Time'] <= endDate)
    ]
    selected_site_name = location
    if selected_site_name:
        filtered_transactions = charging_transactions[charging_transactions['Site Name'] == selected_site_name]
    else:
        filtered_transactions = charging_transactions  
    if powerType == "All":
        charger_data = charger_data
    elif powerType == "AC":
        charger_data = charger_data[charger_data['power_type'] == "AC"]
    elif powerType == "DC":
        charger_data = charger_data[charger_data['power_type'] == "DC"]

    station_hour_str = charts_generator.station_hour_chart_json(filtered_transactions, start_date=min_date, end_date=max_date)
    station_hour = json.loads(station_hour_str)

    response = {
        'station_hour': station_hour
    }    

    # Cache the response data for future requests
    cache.set(cache_key, response, timeout=3000)

    return JsonResponse(response, safe=False)

@csrf_exempt
@require_POST
def byStationTimeSeriesChart(request):
    data = json.loads(request.body.decode('utf-8'))
    startDate = data.get("start_date")
    endDate = data.get("end_date")
    location = data.get("location")
    powerType = data.get("power_type")

    # Convert startDate and endDate to datetime objects
    startDate = pd.to_datetime(startDate, errors='coerce')
    endDate = pd.to_datetime(endDate, errors='coerce')
    startDate = startDate.strftime('%d/%m/%Y %H:%M')
    endDate = endDate.strftime('%d/%m/%Y %H:%M')

    # Generate a unique cache key based on filters
    cache_key = f"stationtimeseries_{startDate}_{endDate}_{location}_{powerType}"

    # Load cached data if available
    cached_data = cache.get(cache_key)
    if cached_data:
        return JsonResponse(cached_data, safe=False)

    # Load data
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)

    # Filter transactions based on startDate, endDate, location and powerType
    charging_transactions = charging_transactions[
        (charging_transactions['Start Date/Time'] >= startDate) &
        (charging_transactions['Start Date/Time'] <= endDate)
    ]
    selected_site_name = location
    if selected_site_name:
        filtered_transactions = charging_transactions[charging_transactions['Site Name'] == selected_site_name]
    else:
        filtered_transactions = charging_transactions  
    if powerType == "All":
        charger_data = charger_data
    elif powerType == "AC":
        charger_data = charger_data[charger_data['power_type'] == "AC"]
    elif powerType == "DC":
        charger_data = charger_data[charger_data['power_type'] == "DC"]
    util_timeseries_str = charts_generator.util_timeseries_chart_json(filtered_transactions, start_date=min_date, end_date=max_date)
    util_timeseries = json.loads(util_timeseries_str)
    
    response = {
        'util_timeseries': util_timeseries
    }    

     # Cache the response data for future requests
    cache.set(cache_key, response, timeout=3000)

    return JsonResponse(response, safe=False)

@csrf_exempt
@require_POST
def byStationUtilBarChart(request):
    data = json.loads(request.body.decode('utf-8'))
    startDate = data.get("start_date")
    endDate = data.get("end_date")
    location = data.get("location")
    powerType = data.get("power_type")

    # Convert startDate and endDate to datetime objects
    startDate = pd.to_datetime(startDate, errors='coerce')
    endDate = pd.to_datetime(endDate, errors='coerce')
    startDate = startDate.strftime('%d/%m/%Y %H:%M')
    endDate = endDate.strftime('%d/%m/%Y %H:%M')

    # Generate a unique cache key based on filters
    cache_key = f"stationbarchart_{startDate}_{endDate}_{location}_{powerType}"

    # Load cached data if available
    cached_data = cache.get(cache_key)
    if cached_data:
        return JsonResponse(cached_data, safe=False)

    # Load data
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)

    # Filter transactions based on startDate, endDate, location and powerType
    charging_transactions = charging_transactions[
        (charging_transactions['Start Date/Time'] >= startDate) &
        (charging_transactions['Start Date/Time'] <= endDate)
    ]
    selected_site_name = location
    if selected_site_name:
        filtered_transactions = charging_transactions[charging_transactions['Site Name'] == selected_site_name]
    else:
        filtered_transactions = charging_transactions  
    if powerType == "All":
        charger_data = charger_data
    elif powerType == "AC":
        charger_data = charger_data[charger_data['power_type'] == "AC"]
    elif powerType == "DC":
        charger_data = charger_data[charger_data['power_type'] == "DC"]

    util_dayNight_str = charts_generator.util_bar_chart_json(filtered_transactions, x_variable='Day/Night', start_date=min_date, end_date=max_date)
    util_weekdayWeekend_str = charts_generator.util_bar_chart_json(filtered_transactions, x_variable='Weekend/Weekday', start_date=min_date, end_date=max_date)

    util_dayNight = json.loads(util_dayNight_str)
    util_weekdayWeekend = json.loads(util_weekdayWeekend_str)
    
    response = {
        'util_dayNight': util_dayNight,
        'util_weekdayWeekend': util_weekdayWeekend
    }    

    # # Cache the response data for future requests
    cache.set(cache_key, response, timeout=3000)

    return JsonResponse(response, safe=False)

###########################################################
######################### BILLING #########################
###########################################################

@csrf_exempt
@require_POST
def billingCards(request):
    data = json.loads(request.body.decode('utf-8'))
    powerType = data.get("power_type")
    price = data.get("price")
    charger = data.get("charger")

    # Load data
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()

    # Filter charger_data based on powerType, price, and charger
    if powerType == "All":
        charger_data = charger_data
    elif powerType == "AC":
        charger_data = charger_data[charger_data['power_type'] == "AC"]
    elif powerType == "DC":
        charger_data = charger_data[charger_data['power_type'] == "DC"]
    if price != "All":
        charger_data = charger_data[charger_data['price'] == price]
    if charger == "All":
        charger_data = charger_data
    else:
        charger_data = charger_data[charger_data['evCpId'] == charger]

    # Calculating average energy per month
    total_energy = sum(charger_charging['total_energy'])
    unique_months_count = len(charger_charging['month'].unique())
    average_energy_per_month = round(total_energy / unique_months_count)

    # Calculating average cost per month
    total_cost = sum(charger_charging['total_cost'])
    average_cost_per_month = total_cost / unique_months_count

    
    response = {
        'average_energy_per_month': average_energy_per_month,
        'average_cost_per_month': average_cost_per_month
    }    

    return JsonResponse(response, safe=False)

@csrf_exempt
@require_POST
def billingTable(request):
    data = json.loads(request.body.decode('utf-8'))
    powerType = data.get("power_type")
    price = data.get("price")
    charger = data.get("charger")

    # Load data
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()

    # Filter charger_data based on powerType, price, and charger
    if powerType == "All":
        charger_data = charger_data
    elif powerType == "AC":
        charger_data = charger_data[charger_data['power_type'] == "AC"]
    elif powerType == "DC":
        charger_data = charger_data[charger_data['power_type'] == "DC"]
    if price != "All":
        charger_data = charger_data[charger_data['price'] == price]
    if charger == "All":
        charger_data = charger_data
    else:
        charger_data = charger_data[charger_data['evCpId'] == charger]

    energy_expenditure_df_str = charts_generator.energy_expenditure_table_json(charger_charging)
    energy_expenditure_df = json.loads(energy_expenditure_df_str)
    
    response = {
        'energy_expenditure_df': energy_expenditure_df
    }    

    return JsonResponse(response, safe=False)

@csrf_exempt
@require_POST
def billingRevenueChart(request):
    data = json.loads(request.body.decode('utf-8'))
    powerType = data.get("power_type")
    price = data.get("price")
    charger = data.get("charger")

    # Load data
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()

    # Filter charger_data based on powerType, price, and charger
    if powerType == "All":
        charger_data = charger_data
    elif powerType == "AC":
        charger_data = charger_data[charger_data['power_type'] == "AC"]
    elif powerType == "DC":
        charger_data = charger_data[charger_data['power_type'] == "DC"]
    if price != "All":
        charger_data = charger_data[charger_data['price'] == price]
    if charger == "All":
        charger_data = charger_data
    else:
        charger_data = charger_data[charger_data['evCpId'] == charger]

    total_energy_cost_str = charts_generator.total_energy_cost_chart_json(charger_charging)
    total_energy_cost = json.loads(total_energy_cost_str)
    
    response = {
        'total_energy_cost': total_energy_cost
    }

    return JsonResponse(response, safe=False)

@csrf_exempt
@require_POST
def billingEnergyChart(request):
    data = json.loads(request.body.decode('utf-8'))
    powerType = data.get("power_type")
    price = data.get("price")
    charger = data.get("charger")

    # Load data
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()

    # Filter charger_data based on powerType, price, and charger
    if powerType == "All":
        charger_data = charger_data
    elif powerType == "AC":
        charger_data = charger_data[charger_data['power_type'] == "AC"]
    elif powerType == "DC":
        charger_data = charger_data[charger_data['power_type'] == "DC"]
    if price != "All":
        charger_data = charger_data[charger_data['price'] == price]
    if charger == "All":
        charger_data = charger_data
    else:
        charger_data = charger_data[charger_data['evCpId'] == charger]

    total_monthly_charger_str = charts_generator.monthly_energy_consumption_chart_json(charger_charging)
    total_monthly_charger = json.loads(total_monthly_charger_str)
    
    response = {    
        'total_monthly_charger': total_monthly_charger
    }    

    return JsonResponse(response, safe=False)

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

###########################################################
######################### PRICING #########################
###########################################################

# Calculates average price
@csrf_exempt
@require_POST
def pricingCards(request):
    data = json.loads(request.body.decode('utf-8'))
    startDate = data.get("start_date") #when date is logged it looks like this - 2023-08-24T05:52:25.000Z
    endDate = data.get("end_date")
    powerType = data.get("power_type")

    # Convert startDate and endDate to datetime objects
    startDate = pd.to_datetime(startDate, errors='coerce')
    endDate = pd.to_datetime(endDate, errors='coerce')
    startDate = startDate.strftime('%d/%m/%Y %H:%M')
    endDate = endDate.strftime('%d/%m/%Y %H:%M')

    # Load data for the page
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)

    # Filter charger_data based on startDate, endDate, and powerType
    charging_transactions = charging_transactions[
        (charging_transactions['Start Date/Time'] >= startDate) &
        (charging_transactions['Start Date/Time'] <= endDate)
    ]
    if powerType == "All":
        charging_transactions = charging_transactions
    elif powerType == "AC":
        charging_transactions = charging_transactions[charging_transactions['power_type'] == "AC"]
    elif powerType == "DC":
        charging_transactions = charging_transactions[charging_transactions['power_type'] == "DC"]

    # Calculating average rate
    avg_price = round(sum(charging_transactions['Rate'])/len(charging_transactions), 2)
 
    response = {
        'avg_price': avg_price
    }    

    return JsonResponse(response, safe=False)

# Returns payment mode chart points (JSON)
@csrf_exempt
@require_POST
def pricingPaymentModeChart(request):
    data = json.loads(request.body.decode('utf-8'))
    startDate = data.get("start_date") #when date is logged it looks like this - 2023-08-24T05:52:25.000Z
    endDate = data.get("end_date")
    powerType = data.get("power_type")

    # Convert startDate and endDate to datetime objects
    startDate = pd.to_datetime(startDate, errors='coerce')
    endDate = pd.to_datetime(endDate, errors='coerce')
    startDate = startDate.strftime('%d/%m/%Y %H:%M')
    endDate = endDate.strftime('%d/%m/%Y %H:%M')

    # Load data for the page
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)

    # Filter charger_data based on startDate, endDate, and powerType
    charging_transactions = charging_transactions[
        (charging_transactions['Start Date/Time'] >= startDate) &
        (charging_transactions['Start Date/Time'] <= endDate)
    ]
    if powerType == "All":
        charging_transactions = charging_transactions
    elif powerType == "AC":
        charging_transactions = charging_transactions[charging_transactions['power_type'] == "AC"]
    elif powerType == "DC":
        charging_transactions = charging_transactions[charging_transactions['power_type'] == "DC"]

    # Payment mode data points
    payment_mode_donut_str = charts_generator.payment_mode_donut_chart_json(charging_transactions)
    payment_mode_donut = json.loads(payment_mode_donut_str)

    response = {
        'payment_mode_donut': payment_mode_donut
    }    

    return JsonResponse(response, safe=False)

# Returns utilisation price chart points (JSON)
@csrf_exempt
@require_POST
def pricingUtilisationPriceChart(request):
    data = json.loads(request.body.decode('utf-8'))
    startDate = data.get("start_date") #when date is logged it looks like this - 2023-08-24T05:52:25.000Z
    endDate = data.get("end_date")
    powerType = data.get("power_type")

    # Convert startDate and endDate to datetime objects
    startDate = pd.to_datetime(startDate, errors='coerce')
    endDate = pd.to_datetime(endDate, errors='coerce')
    startDate = startDate.strftime('%d/%m/%Y %H:%M')
    endDate = endDate.strftime('%d/%m/%Y %H:%M')

    # Load data for the page
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)

    # Filter charger_data based on startDate, endDate, and powerType
    charging_transactions = charging_transactions[
        (charging_transactions['Start Date/Time'] >= startDate) &
        (charging_transactions['Start Date/Time'] <= endDate)
    ]
    if powerType == "All":
        charging_transactions = charging_transactions
    elif powerType == "AC":
        charging_transactions = charging_transactions[charging_transactions['power_type'] == "AC"]
    elif powerType == "DC":
        charging_transactions = charging_transactions[charging_transactions['power_type'] == "DC"]

    # Payment mode data points
    util_price_chart_str = charts_generator.get_util_price_chart_json(charging_transactions)
    util_price_chart = json.loads(util_price_chart_str)

    response = {
        'util_price_chart': util_price_chart
    }    

    return JsonResponse(response, safe=False)

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

###########################################################
########################## USERS ##########################
###########################################################

@csrf_exempt
@require_POST
def usersCards(request):
    data = json.loads(request.body.decode('utf-8'))
    startDate = data.get("start_date") #when date is logged it looks like this - 2023-08-24T05:52:25.000Z
    endDate = data.get("end_date")
    address = data.get("address")
    charger = data.get("charger")

    # Convert startDate and endDate to datetime objects
    startDate = pd.to_datetime(startDate, errors='coerce')
    endDate = pd.to_datetime(endDate, errors='coerce')
    startDate = startDate.strftime('%d/%m/%Y %H:%M')
    endDate = endDate.strftime('%d/%m/%Y %H:%M')

    # Load data for the page
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)

    # Filter charger_data based on startDate, address, and charger
    charging_transactions = charging_transactions[
        (charging_transactions['Start Date/Time'] >= startDate) &
        (charging_transactions['Start Date/Time'] <= endDate)
    ]
    if address == "All":
        charging_transactions = charging_transactions
    else:
        charging_transactions = charging_transactions[charging_transactions['address'] == address]
    if charger == "All":
        charging_transactions = charging_transactions
    else:
        charging_transactions = charging_transactions[charging_transactions['evCpId'] == charger]
    
    # User Breakdown
    num_public = len(set(charging_transactions[charging_transactions['User Type Cleaned'] == 'Public']['User ID'].dropna()))
    num_fleet = len(set(charging_transactions[charging_transactions['User Type Cleaned'] == 'Fleet']['User ID'].dropna()))
    num_member = len(set(charging_transactions[charging_transactions['User Type Cleaned'] == 'Member']['User ID'].dropna()))
    num_partner = len(set(charging_transactions[charging_transactions['User Type Cleaned'] == 'Partner']['User ID'].dropna()))
    num_total = len(set(charging_transactions['User ID'].dropna()))

    response = {
        'num_public': num_public,
        'num_fleet': num_fleet,
        'num_member': num_member,
        'num_partner': num_partner,
        'num_total': num_total
    }

    return JsonResponse(response, safe=False)

@csrf_exempt
@require_POST
def usersDonutCharts(request):
    data = json.loads(request.body.decode('utf-8'))
    startDate = data.get("start_date") #when date is logged it looks like this - 2023-08-24T05:52:25.000Z
    endDate = data.get("end_date")
    address = data.get("address")
    charger = data.get("charger")

    # Load data for the page
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)

    # Filter charger_data based on startDate, address, and charger
    charging_transactions = charging_transactions[
        (charging_transactions['Start Date/Time'] >= startDate) &
        (charging_transactions['Start Date/Time'] <= endDate)
    ]
    if address == "All":
        charging_transactions = charging_transactions
    else:
        charging_transactions = charging_transactions[charging_transactions['address'] == address]
    if charger == "All":
        charging_transactions = charging_transactions
    else:
        charging_transactions = charging_transactions[charging_transactions['evCpId'] == charger]

    user_donut_str = charts_generator.user_donut_chart_json(charging_transactions)
    fleet_donut_str = charts_generator.fleet_donut_chart_json(charging_transactions)
    member_donut_str = charts_generator.member_donut_chart_json(charging_transactions)
    partner_donut_str = charts_generator.partner_donut_chart_json(charging_transactions)
    user_across_time_chart_str = charts_generator.user_across_time_json(charging_transactions)

    user_donut = json.loads(user_donut_str)
    fleet_donut = json.loads(fleet_donut_str)
    member_donut = json.loads(member_donut_str)
    partner_donut = json.loads(partner_donut_str)
    user_across_time_chart = json.loads(user_across_time_chart_str)

    response = {
        'user_donut': user_donut,
        'fleet_donut': fleet_donut,
        'member_donut': member_donut,
        'partner_donut': partner_donut,
        'user_across_time_chart': user_across_time_chart
    }

    return JsonResponse(response, safe=False)

@csrf_exempt
@require_POST
def usersUserChart(request):
    data = json.loads(request.body.decode('utf-8'))
    startDate = data.get("start_date") #when date is logged it looks like this - 2023-08-24T05:52:25.000Z
    endDate = data.get("end_date")
    address = data.get("address")
    charger = data.get("charger")

    # Convert startDate and endDate to datetime objects
    startDate = pd.to_datetime(startDate, errors='coerce')
    endDate = pd.to_datetime(endDate, errors='coerce')
    startDate = startDate.strftime('%d/%m/%Y %H:%M')
    endDate = endDate.strftime('%d/%m/%Y %H:%M')

    # Load data for the page
    charger_data, unique_chargers, charger_charging = data_loader.load_charger_details()
    charging_transactions, max_date, min_date = data_loader.load_real_transactions(charger_data)

    # Filter charger_data based on startDate, address, and charger
    charging_transactions = charging_transactions[
        (charging_transactions['Start Date/Time'] >= startDate) &
        (charging_transactions['Start Date/Time'] <= endDate)
    ]
    if address == "All":
        charging_transactions = charging_transactions
    else:
        charging_transactions = charging_transactions[charging_transactions['address'] == address]
    if charger == "All":
        charging_transactions = charging_transactions
    else:
        charging_transactions = charging_transactions[charging_transactions['evCpId'] == charger]

    user_across_time_chart = charts_generator.user_across_time_json(charging_transactions)

    response = {
        'user_across_time_chart': user_across_time_chart
    }

    return JsonResponse(response, safe=False)

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