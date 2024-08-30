import pandas as pd
import numpy as np
import datetime
import random
import re
import json
import plotly.express as px
import plotly.io as pio
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import folium
from folium import Marker
from folium.plugins import MarkerCluster, HeatMap
from django.core.cache import cache
from .data_loader import load_charger_details, load_dummy_charger_transactions, load_real_transactions, load_inactive_chargers
from jinja2 import Template

CACHE_TIMEOUT = 60 * 60 * 24  # Cache timeout in seconds (e.g., 1 day)

# Custom Marker Class for Folium
class MarkerWithProps(Marker):
    _template = Template(u"""
        {% macro script(this, kwargs) %}
        var {{this.get_name()}} = L.marker(
            [{{this.location[0]}}, {{this.location[1]}}],
            {
                icon: new L.Icon.Default(),
                {%- if this.draggable %}
                draggable: true,
                autoPan: true,
                {%- endif %}
                {%- if this.props %}
                props : {{ this.props }} 
                {%- endif %}
            }
        ).addTo({{this._parent.get_name()}});
        {% endmacro %}
    """)
    def __init__(self, location, popup=None, tooltip=None, icon=None,
                draggable=False, props=None):
        super(MarkerWithProps, self).__init__(location=location, popup=popup, tooltip=tooltip, icon=icon, draggable=draggable)
        self.props = json.loads(json.dumps(props))

# Load data once and cache
charger_data, unique_chargers, charger_charging = load_charger_details()
charging_dummy = load_dummy_charger_transactions(charger_data)
charging_transactions, max_date, min_date = load_real_transactions(charger_data)

# Charger Map
def create_map(df):
    CENTER = [1.3765401823882508, 103.85805501383963]
    map_obj = folium.Map(location=CENTER, zoom_start=11, tiles="cartodb positron")

    for index, row in df.iterrows():
        loc = (row['latitude'], row['longitude'])
        marker_color = ''
        if str(row['evCpId']) == 'nan':
            marker_color = 'red'
        elif "Coming Soon" in str(row['name']):
            marker_color = 'orange'
        else:
            marker_color = 'green'
        folium.Marker(location=loc, icon=folium.Icon(color=marker_color)).add_to(map_obj)

    return map_obj

# Charger Map (Plotly Version)
def create_plotly_map(df):
    CENTER = {"lat": 1.3765401823882508, "lon": 103.85805501383963}

    # Determine marker color based on conditions
    df['marker_color'] = df.apply(lambda row: 'red' if pd.isna(row['evCpId']) else 'orange' if "Coming Soon" in str(row['name']) else 'green', axis=1)

    # Create Plotly scatter mapbox
    fig = px.scatter_mapbox(
        df,
        lat='latitude',
        lon='longitude',
        color='marker_color',  # This will control the color of the markers
        hover_name='name',  # Column to display on hover
        center=CENTER,
        zoom=11,
        mapbox_style="carto-positron"
    )

    # Update layout to adjust marker size and add other customizations
    fig.update_traces(marker=dict(size=10))
    
    return fig

########################################################
####################### OVERVIEW #######################
########################################################

# Utilisation Table (used in overview + by_station)
def create_util_table(charger_charging, time_window_start, time_window_end, inactive_charger_dict):
    charger_charging = charger_charging.dropna(subset=['totalDuration'])

    charger_times = charger_charging.groupby('Station ID').agg({
        'totalDuration': 'sum',
        'Date': ['min', 'max']
    }).reset_index()

    if time_window_start < min_date:
        time_window_start = min_date
    if time_window_start > max_date:
        time_window_start = max_date
    if time_window_end < min_date:
        time_window_end = min_date
    if time_window_end > max_date:
        time_window_end = max_date

    charger_times.columns = ['Station ID', 'Total Duration', 'Time Window Start', 'Time Window End']

    def process_window_end(row):
        if row['Station ID'] in inactive_charger_dict:
            return inactive_charger_dict[row['Station ID']]
        else:
            return time_window_end

    charger_times['Time Window End'] = charger_times.apply(process_window_end, axis=1)
    charger_times['Time Window Start'] = pd.to_datetime(charger_times['Time Window Start'])
    charger_times['Time Window End'] = pd.to_datetime(charger_times['Time Window End'])

    charger_times['Time Period'] = charger_times.apply(lambda x: (x['Time Window End'] - x['Time Window Start']).days * 24 * 60, axis=1)
    charger_times['Time Period'] = np.where(charger_times['Time Period'] == 0, 1440, charger_times['Time Period'])
    charger_times = charger_times.drop(columns=['Time Window Start', 'Time Window End'])

    charger_utilisation = charger_times.copy()
    charger_utilisation.columns = ['Charger ID', 'Total Time', 'Time Period']
    charger_utilisation["Utilisation Rate"] = charger_utilisation.apply(lambda x: (x['Total Time'] / x['Time Period']) * 100, axis=1)
    charger_utilisation = charger_utilisation.sort_values(by='Utilisation Rate', ascending=False)

    return charger_utilisation[['Charger ID', 'Utilisation Rate']]

###########################################################
####################### UTILISATION #######################
###########################################################

# Utilisation Heatmap (UNUSED)
def get_util_heatmap(charger_charging):
    charger_times = charger_charging.groupby('evse_id').agg({
        'total_time': 'mean',
        'latitude': 'first',
        'longitude': 'first'
    }).reset_index()

    charger_utilisation = charger_times.copy()
    charger_utilisation.columns = ['Charger ID', 'Utilisation Rate', 'Latitude', 'Longitude']
    charger_utilisation["Utilisation Rate"] = charger_utilisation["Utilisation Rate"].apply(lambda x: x / 432)
    charger_utilisation = charger_utilisation.sort_values(by='Utilisation Rate', ascending=False)

    map_center = [1.3765401823882508, 103.85805501383963]
    map = folium.Map(location=map_center, zoom_start=11, tiles="cartodb positron")
    heat_data = [[row['Latitude'], row['Longitude'], row['Utilisation Rate']] for index, row in charger_utilisation.iterrows()]
    HeatMap(heat_data, min_opacity=0.5, max_val=max(charger_utilisation['Utilisation Rate']), radius=25, blur=15, max_zoom=1).add_to(map)

    return map

# Utilisation Cluster Map (UNUNSED)
def get_util_clustermap(charger_charging):
    charger_charging = charger_charging.dropna(subset=['latitude', 'longitude'])
    charger_times = charger_charging.groupby('Station ID').agg({
        'totalDuration': 'sum',
        'latitude': 'first',
        'longitude': 'first',
        'Date': lambda x: x.max() - x.min()
    }).reset_index()

    charger_utilisation = charger_times.copy()
    charger_utilisation.columns = ['Charger ID', 'Total Time', 'Latitude', 'Longitude', 'Time Period']
    charger_utilisation['Time Period'] = charger_utilisation['Time Period'].dt.total_seconds() / 60
    charger_utilisation['Time Period'] = np.where(charger_utilisation['Time Period'] == 0, 1440, charger_utilisation['Time Period'])
    charger_utilisation["Utilisation Rate"] = charger_utilisation.apply(lambda x: (x['Total Time'] / x['Time Period']) * 100, axis=1)
    charger_utilisation = charger_utilisation.sort_values(by='Utilisation Rate', ascending=False)

    map_center = [charger_utilisation['Latitude'].mean(), charger_utilisation['Longitude'].mean()]
    map = folium.Map(location=map_center, zoom_start=11, tiles="cartodb positron")
    icon_create_function = '''
        function(cluster) {
            var markers = cluster.getAllChildMarkers();
            var sum = 0;
            for (var i = 0; i < markers.length; i++) {
                sum += markers[i].options.props.utilisationRate;
            }
            var avg = sum / markers.length;
            return L.divIcon({
                html: '<div style="background-color: #d63e2a; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 10px;"><b>' + avg.toFixed(2) + '%</b></div>',
                className: 'marker-cluster-custom',
                iconSize: new L.Point(40, 40)
            });
        }
    '''
    marker_cluster = MarkerCluster(icon_create_function=icon_create_function).add_to(map)

    for index, row in charger_utilisation.iterrows():
        marker = MarkerWithProps(
            location=[row['Latitude'], row['Longitude']],
            popup=f"Charger ID: {row['Charger ID']}<br>Utilisation Rate: {round(row['Utilisation Rate'], 2)}%",
            icon=folium.Icon(color='red', icon='bolt', prefix='fa'),
            props={"utilisationRate": row['Utilisation Rate']}
        )
        marker_cluster.add_child(marker)

    return map

# Utilisation Cluster Map (JSON)
def get_util_clustermap_json(charger_charging):
    charger_charging = charger_charging.dropna(subset=['latitude', 'longitude'])
    charger_times = charger_charging.groupby('Station ID').agg({
        'totalDuration': 'sum',
        'latitude': 'first',
        'longitude': 'first',
        'Date': lambda x: x.max() - x.min()
    }).reset_index()

    charger_utilisation = charger_times.copy()
    charger_utilisation.columns = ['Charger ID', 'Total Time', 'Latitude', 'Longitude', 'Time Period']
    charger_utilisation['Time Period'] = charger_utilisation['Time Period'].dt.total_seconds() / 60
    charger_utilisation['Time Period'] = np.where(charger_utilisation['Time Period'] == 0, 1440, charger_utilisation['Time Period'])
    charger_utilisation["Utilisation Rate"] = charger_utilisation.apply(lambda x: (x['Total Time'] / x['Time Period']) * 100, axis=1)
    charger_utilisation = charger_utilisation.sort_values(by='Utilisation Rate', ascending=False)

    # Prepare data for JSON
    markers_data = []
    for index, row in charger_utilisation.iterrows():
        marker_info = {
            'latitude': row['Latitude'],
            'longitude': row['Longitude'],
            'charger_id': row['Charger ID'],
            'utilisation_rate': round(row['Utilisation Rate'], 2)
        }
        markers_data.append(marker_info)

    # Convert to JSON format
    markers_json = json.dumps(markers_data)
    return markers_json

# Utilisation Line Charts
def get_util_hour_df(charging):
    def expand_transactions(charging):
        rows = []
        for _, row in charging.iterrows():
            start_time = row['Start Date/Time']
            end_time = row['End Date/Time']
            station_id = row['Station ID']
            
            # Loop through each hour in the range
            current_time = start_time.replace(minute=0, second=0, microsecond=0)
            while current_time <= end_time.replace(minute=0, second=0, microsecond=0):
                if current_time == start_time.replace(minute=0, second=0, microsecond=0):
                    start_minute = start_time.minute
                else:
                    start_minute = 0

                if current_time == end_time.replace(minute=0, second=0, microsecond=0):
                    end_minute = end_time.minute
                else:
                    end_minute = 59

                utilisation = (end_minute - start_minute + 1) / 60  # utilisation for the hour
                rows.append({
                    'Hour': current_time,
                    'Station ID': station_id,
                    'Utilisation': utilisation
                })
                
                # Move to the next hour
                current_time += pd.Timedelta(hours=1)
        
        return pd.DataFrame(rows)

    def ensure_all_hours(charging, expanded_df):
        all_hours = pd.date_range(start=charging['Start Date/Time'].min().replace(minute=0, second=0, microsecond=0), 
                                end=charging['End Date/Time'].max().replace(minute=0, second=0, microsecond=0), 
                                freq='H')
        unique_stations = charging['Station ID'].unique()
        all_combinations = pd.MultiIndex.from_product([all_hours, unique_stations], names=['Hour', 'Station ID']).to_frame(index=False)
        merged_df = pd.merge(all_combinations, expanded_df, on=['Hour', 'Station ID'], how='left').fillna(0)
        return merged_df

    expanded_df = expand_transactions(charging)
    util_hour_df = ensure_all_hours(charging, expanded_df)

    util_hour_df['Hour'] = util_hour_df['Hour'].dt.hour

    util_hour_df = util_hour_df.groupby(['Hour', 'Station ID']).agg(
        Utilisation = ('Utilisation', 'mean')
    ).reset_index()

    pivot_df = util_hour_df.pivot(index='Hour', columns='Station ID', values='Utilisation').fillna(0).reset_index()

    return pivot_df

# Utilisation Hourly Chart (UNUSED)
def util_hour_chart(charging, start_date=min_date, end_date=max_date):
    pivot_df_reset = get_util_hour_df(charging)
    pivot_df_reset['Average Utilisation'] = pivot_df_reset.iloc[:, 1:].mean(axis=1)
    pivot_df_reset = pivot_df_reset[['Hour', 'Average Utilisation']]

    fig = px.line(pivot_df_reset, x='Hour', y='Average Utilisation', title=f"Average Utilisation by Hour <br>({start_date.strftime('%d %b %Y')} - {end_date.strftime('%d %b %Y')})")
    fig.update_traces(line=dict(color='#add653', width=3))
    fig.update_layout(
        title=dict(x=0.5, y=0.95, xanchor='center'),
        xaxis_title='Hour of Day',
        yaxis_title='Average Utilisation Rate (%)',
        showlegend=False,
        paper_bgcolor='#363a41',
        plot_bgcolor='#363a41',
        height=350
    )
    fig.update_xaxes(gridcolor='rgba(255,255,255,0)', linecolor='white', tickcolor='white', dtick=1)
    fig.update_yaxes(gridcolor='rgba(255,255,255,0)', linecolor='white', tickcolor='white', tickformat=".0%")

    return fig

# Utilisation Hourly Chart Data Points to JSON
def util_hour_chart_json(charging, start_date=min_date, end_date=max_date):
    # Prepare the data for plotting
    pivot_df_reset = get_util_hour_df(charging)
    pivot_df_reset['Average Utilisation'] = pivot_df_reset.iloc[:, 1:].mean(axis=1)
    pivot_df_reset = pivot_df_reset[['Hour', 'Average Utilisation']]

    # Convert data points to a list of dictionaries
    data_points = pivot_df_reset.to_dict(orient='records')

    # Convert to JSON format
    data_json = json.dumps(data_points)

    return data_json

# Utilisation Line Charts
def get_util_df(charging, x_variable='Hour'):

    ### FOR USING THE PRODUCTION DATA --> ONLY OPERATOR IS CHARGEO
    if 'Strides' not in unique_chargers.keys():
        charging['Service Provider'] = charging['Service Provider'].apply(lambda x: 'ChargEco')

    # Group by 'Hour', 'Operator', and 'Date' and sum 'totalDuration'
    aggregated_data = charging.groupby([x_variable, 'Service Provider', 'Date', 'Station ID'])['totalDuration'].sum().reset_index()

    # Group by 'Hour', 'Operator', and 'Station ID' to calculate sum of 'totalDuration' and count unique 'Date'
    aggregated_data = aggregated_data.groupby([x_variable, 'Service Provider']).agg(
        totalDuration=('totalDuration', 'sum'),
        uniqueDates=('Date', pd.Series.nunique),
        uniqueChargers=('Station ID', pd.Series.nunique)  # Count unique 'Station ID'
    ).reset_index()

    # print(list(aggregated_data['uniqueChargers']))

    # Calculate the Avg Utilisation for each operator at each hour
    aggregated_data['Avg Utilisation'] = aggregated_data.apply(
        lambda row: (row['totalDuration'] / (row['uniqueDates'] * 24 * 60 * row['uniqueChargers'])), axis=1)

    # st.dataframe(aggregated_data)

    # Now you have the average utilization per operator per hour
    # If you need to pivot this for visualization or other purposes, you can do so:
    pivot_df = aggregated_data.pivot(index=x_variable, columns='Service Provider', values='Avg Utilisation')
    pivot_df = pivot_df.fillna(0)

    # Reset index to make 'Hour' a column
    pivot_df_reset = pivot_df.reset_index()

    return pivot_df_reset

# Utilisation Bar Chart (UNUSED)
def util_bar_chart(charging, x_variable, height=350, start_date=min_date, end_date=max_date, text=""):
    pivot_df_reset = get_util_df(charging, x_variable=x_variable)
    charging_melted = pivot_df_reset.melt(id_vars=[x_variable], var_name='Operator', value_name='Utilisation')
    charging_melted['Utilisation'] = (charging_melted['Utilisation'] * 100).round(2)

    colors = {
        'GetGo': '#1f77b4',
        'LKH': '#2ca02c',
        'Lemon Charge': '#ff7f0e',
        'Strides': '#d62728',
        'ChargEco': '#add653' 
    }

    fig = px.bar(charging_melted, y=x_variable, x='Utilisation', color='Operator', barmode='group', text='Utilisation',
                 orientation='h', title=f'Average Utilisation by {x_variable}<br>({start_date.strftime("%d %b %Y")} - {end_date.strftime("%d %b %Y")})',
                 color_discrete_map=colors)

    fig.update_traces(texttemplate='%{text:.2f}%', textposition='outside', insidetextanchor='end', 
                      textfont=dict(size=14, color="white"))
    fig.update_layout(
        title = dict(x=0.5, y=0.95, xanchor = 'center', pad=dict(t=10)),
        yaxis_title=None,
        xaxis_title='Average Utilisation Rate (%)',
        showlegend=False,
        paper_bgcolor='#363a41',
        plot_bgcolor='#363a41',
        height=height,
        margin=dict(l=10, r=0, t=50, b=20),
    )
    fig.update_yaxes(autorange="reversed")
    fig.update_xaxes(tickformat='.2f%', range=[0, max(charging_melted['Utilisation']) * 1.2])
    fig.update_traces(hovertemplate='Utilisation: %{x:.2f}%<extra></extra>')

    if text:
        fig.add_annotation(
            text=text,
            xref="paper", yref="paper",
            x=-0.07, y=-0.2,
            showarrow=False,
            font=dict(size=12, color="white")
        )

    return fig

# Utilisation Bar Chart Data Points to JSON
def util_bar_chart_json(charging, x_variable, start_date, end_date):
    # Prepare the data for plotting
    pivot_df_reset = get_util_df(charging, x_variable=x_variable)
    charging_melted = pivot_df_reset.melt(id_vars=[x_variable], var_name='Operator', value_name='Utilisation')
    charging_melted['Utilisation'] = (charging_melted['Utilisation'] * 100).round(2)

    # Convert data points to a list of dictionaries
    data_points = charging_melted.to_dict(orient='records')

    # Convert to JSON format
    data_json = json.dumps(data_points)

    return data_json

###########################################################
####################### BY_STATION ########################
###########################################################

# Station Hour Chart (UNUSED)
def station_hour_chart(charging, height=485, start_date=min_date, end_date=max_date):
    pivot_df_reset = get_util_hour_df(charging)
    pivot_df_reset['Average Utilisation'] = pivot_df_reset.iloc[:, 1:].mean(axis=1)
    pivot_df_reset = pivot_df_reset[['Hour', 'Average Utilisation']]

    fig = px.bar(pivot_df_reset, x='Hour', y='Average Utilisation', title=f"Average Utilisation by Hour <br>({start_date.strftime('%d %b %Y')} - {end_date.strftime('%d %b %Y')})")
    fig.update_traces(
        marker=dict(color='#add653'),
        texttemplate='%{y:.2%}',
        textposition='outside',
        hovertemplate='Hour=%{x}<br>Average Utilisation=%{customdata:.2f}%'
    )
    fig.data[0].customdata = (pivot_df_reset['Average Utilisation'] * 100).to_numpy().reshape(-1, 1)
    fig.update_layout(
        title=dict(x=0.5, y=0.95, xanchor='center'),
        xaxis_title='Hour of Day',
        yaxis_title='Average Utilisation Rate (%)',
        showlegend=False,
        paper_bgcolor='#363a41',
        plot_bgcolor='#363a41',
        height=height,
    )
    fig.update_xaxes(gridcolor='rgba(255,255,255,0)', linecolor='white', tickcolor='white', dtick=1)
    fig.update_yaxes(gridcolor='rgba(255,255,255,0)', linecolor='white', tickcolor='white', tickformat=".0%", range=[0, max(pivot_df_reset['Average Utilisation']) * 1.2])

    return fig

# Station Hour Chart to JSON
def station_hour_chart_json(charging, height=485, start_date=min_date, end_date=max_date):
    pivot_df_reset = get_util_hour_df(charging)
    pivot_df_reset['Average Utilisation'] = pivot_df_reset.iloc[:, 1:].mean(axis=1)
    pivot_df_reset = pivot_df_reset[['Hour', 'Average Utilisation']]

    # Convert data points to a list of dictionaries
    data_points = pivot_df_reset.to_dict(orient='records')

    # Convert to JSON format
    data_json = json.dumps(data_points)

    return data_json

# Utilisation Timeseries Chart
def util_timeseries_chart(charging, height=462.5, start_date=min_date, end_date=max_date):
    charging['Start Date/Time'] = pd.to_datetime(charging['Start Date/Time'], errors='coerce')
    charging['End Date/Time'] = pd.to_datetime(charging['End Date/Time'], errors='coerce')
    charging = charging.dropna(subset=['Start Date/Time', 'End Date/Time'])

    date_range = pd.date_range(start=start_date, end=end_date).date
    station_ids = charging['Station ID'].unique()
    all_combinations = pd.MultiIndex.from_product([date_range, station_ids], names=['Date', 'Station ID']).to_frame(index=False)

    all_combinations['Date'] = pd.to_datetime(all_combinations['Date']).dt.date
    charging['Date'] = pd.to_datetime(charging['Date']).dt.date
    merged_df = all_combinations.merge(charging, on=['Date', 'Station ID'], how='left').fillna({'totalDuration': 0, 'Site Name': ''})

    expanded_rows = []
    for idx, row in merged_df.iterrows():
        start_time = row['Start Date/Time']
        end_time = row['End Date/Time']
        station_id = row['Station ID']
        site_name = row['Site Name']
        duration = row['totalDuration']
        date = row['Date']
        
        if pd.isnull(start_time) or pd.isnull(end_time):
            expanded_rows.append({
                'Station ID': station_id,
                'Site Name': site_name,
                'Date': date,
                'totalDuration': 0
            })
            continue
        
        current_time = start_time
        while current_time.date() <= end_time.date():
            if current_time.date() == end_time.date() and current_time.date() == start_time.date():
                daily_duration = duration
            elif current_time.date() == start_time.date():
                daily_duration = ((current_time.replace(hour=23, minute=59) - current_time).seconds + 60) / 60
            elif current_time.date() == end_time.date():
                daily_duration = (end_time - end_time.replace(hour=0, minute=0)).seconds / 60
            else:
                daily_duration = 24 * 60

            expanded_rows.append({
                'Station ID': station_id,
                'Site Name': site_name,
                'Date': current_time.date(),
                'totalDuration': daily_duration
            })
            current_time = current_time.replace(hour=0, minute=0) + datetime.timedelta(days=1)

    expanded_df = pd.DataFrame(expanded_rows)
    expanded_df['Date'] = pd.to_datetime(expanded_df['Date'])
    expanded_df['Month'] = expanded_df['Date'].dt.to_period('M').astype(str)

    grouped = expanded_df.groupby(['Site Name', 'Month']).agg({
        'totalDuration': 'sum',
        'Station ID': 'nunique'
    }).reset_index()

    grouped['Avg Utilisation'] = grouped['totalDuration'] / (24 * 60 * grouped['Station ID'] * grouped['Month'].apply(lambda x: pd.Period(x, freq='M').days_in_month))
    plot_data = grouped.pivot(index='Month', columns='Site Name', values='Avg Utilisation').fillna(0)

    fig = px.line(plot_data, x=plot_data.index, y=plot_data.columns, title=f"Avg. Utilisation<br>({start_date.strftime('%d %b %Y')} to {end_date.strftime('%d %b %Y')})")
    fig.update_traces(line=dict(color='#add653', width=2))
    fig.update_layout(
        title=dict(x=0.5, y=0.95, xanchor='center'),
        xaxis_title='Date',
        yaxis_title='Avg. Utilisation Rate (%)',
        showlegend=False,
        paper_bgcolor='#363a41',
        plot_bgcolor='#363a41',
        height=height
    )
    fig.update_xaxes(gridcolor='rgba(255,255,255,0)', linecolor='white', tickcolor='white')
    fig.update_yaxes(gridcolor='rgba(255,255,255,0)', linecolor='white', tickcolor='white', tickformat=".0%", zeroline=False)

    return fig

# Utilisation Timeseries Chart to JSON
def util_timeseries_chart_json(charging, height=462.5, start_date=min_date, end_date=max_date):
    charging['Start Date/Time'] = pd.to_datetime(charging['Start Date/Time'], errors='coerce')
    charging['End Date/Time'] = pd.to_datetime(charging['End Date/Time'], errors='coerce')
    charging = charging.dropna(subset=['Start Date/Time', 'End Date/Time'])

    date_range = pd.date_range(start=start_date, end=end_date).date
    station_ids = charging['Station ID'].unique()
    all_combinations = pd.MultiIndex.from_product([date_range, station_ids], names=['Date', 'Station ID']).to_frame(index=False)

    all_combinations['Date'] = pd.to_datetime(all_combinations['Date']).dt.date
    charging['Date'] = pd.to_datetime(charging['Date']).dt.date
    merged_df = all_combinations.merge(charging, on=['Date', 'Station ID'], how='left').fillna({'totalDuration': 0, 'Site Name': ''})

    expanded_rows = []
    for idx, row in merged_df.iterrows():
        start_time = row['Start Date/Time']
        end_time = row['End Date/Time']
        station_id = row['Station ID']
        site_name = row['Site Name']
        duration = row['totalDuration']
        date = row['Date']
        
        if pd.isnull(start_time) or pd.isnull(end_time):
            expanded_rows.append({
                'Station ID': station_id,
                'Site Name': site_name,
                'Date': date,
                'totalDuration': 0
            })
            continue
        
        current_time = start_time
        while current_time.date() <= end_time.date():
            if current_time.date() == end_time.date() and current_time.date() == start_time.date():
                daily_duration = duration
            elif current_time.date() == start_time.date():
                daily_duration = ((current_time.replace(hour=23, minute=59) - current_time).seconds + 60) / 60
            elif current_time.date() == end_time.date():
                daily_duration = (end_time - end_time.replace(hour=0, minute=0)).seconds / 60
            else:
                daily_duration = 24 * 60

            expanded_rows.append({
                'Station ID': station_id,
                'Site Name': site_name,
                'Date': current_time.date(),
                'totalDuration': daily_duration
            })
            current_time = current_time.replace(hour=0, minute=0) + datetime.timedelta(days=1)

    expanded_df = pd.DataFrame(expanded_rows)
    expanded_df['Date'] = pd.to_datetime(expanded_df['Date'])
    expanded_df['Month'] = expanded_df['Date'].dt.to_period('M').astype(str)

    grouped = expanded_df.groupby(['Site Name', 'Month']).agg({
        'totalDuration': 'sum',
        'Station ID': 'nunique'
    }).reset_index()

    grouped['Avg Utilisation'] = grouped['totalDuration'] / (24 * 60 * grouped['Station ID'] * grouped['Month'].apply(lambda x: pd.Period(x, freq='M').days_in_month))
    plot_data = grouped.pivot(index='Month', columns='Site Name', values='Avg Utilisation').fillna(0)

    # Convert data points to a list of dictionaries
    data_points = plot_data.to_dict(orient='records')

    # Convert to JSON format
    data_json = json.dumps(data_points)

    return data_json

###########################################################
######################### BILLING #########################
###########################################################

# Energy Expenditure Table
def energy_expenditure_table(monthly_charging):
    grouped_data = monthly_charging.groupby('evse_id').agg(total_energy=('total_energy', 'sum'), total_cost=('total_cost', 'sum')).reset_index()
    grouped_data = grouped_data.sort_values(by='total_energy', ascending=False)
    return grouped_data

# Energy Expenditure Table to JSON
def energy_expenditure_table_json(monthly_charging):
    grouped_data = monthly_charging.groupby('evse_id').agg(total_energy=('total_energy', 'sum'), total_cost=('total_cost', 'sum')).reset_index()
    grouped_data = grouped_data.sort_values(by='total_energy', ascending=False)

    # Convert data points to a list of dictionaries
    data_points = grouped_data.to_dict(orient='records')

    # Convert to JSON format
    data_json = json.dumps(data_points)

    return data_json

# Total Energy Cost Chart
def total_energy_cost_chart(monthly_charging):
    aggregated_data = monthly_charging.groupby(['month']).agg({'total_energy': 'sum', 'total_cost': 'sum'}).reset_index()
    aggregated_data['month'] = pd.to_datetime(aggregated_data['month'], format='%Y-%m')
    min_month = aggregated_data['month'].min().strftime('%b %Y')
    max_month = aggregated_data['month'].max().strftime('%b %Y')

    fig = make_subplots(specs=[[{"secondary_y": True}]])
    fig.add_trace(
        go.Bar(x=aggregated_data['month'], y=aggregated_data['total_cost'], name='Total Revenue', marker=dict(color='green')),
        secondary_y=True,
    )
    fig.add_trace(
        go.Scatter(x=aggregated_data['month'], y=aggregated_data['total_energy'], name='Total Energy', mode='lines', line=dict(color='#1f77b4')),
        secondary_y=False,
    )

    default_height = 355
    height = fig.layout.height if fig.layout.height is not None else default_height
    fig.update_layout(
        height=height,
        title=dict(
            text=f"Monthly Energy Consumption and Revenue<br>({min_month} - {max_month})",
            x=0.5,
            y=0.95,
            xanchor='center',
            font=dict(color='white'),
        ),
        xaxis=dict(
            title='Month',
            title_font=dict(color='white'),
            tickfont=dict(color='white'),
            gridcolor='rgba(255,255,255,0)',
            linecolor='white',
            tickcolor='white',
            dtick="M2",
            tickformat="%b %Y"
        ),
        yaxis=dict(
            title='Energy Consumption (kWh)',
            title_font=dict(color='white'),
            tickfont=dict(color='white'),
            gridcolor='rgba(255,255,255,0)',
            linecolor='white',
            tickcolor='white'
        ),
        yaxis2=dict(
            title='Revenue ($)',
            title_font=dict(color='white'),
            tickfont=dict(color='white'),
            overlaying='y',
            side='right',
            gridcolor='rgba(255,255,255,0)',
            linecolor='white',
            tickcolor='white'
        ),
        legend=dict(
            x=0,
            y=-0.32,
            orientation='h',
            bgcolor='rgba(54,58,65,0)',
            bordercolor='white',
            font=dict(
                color='white'
            )
        ),
        paper_bgcolor='#363a41',
        plot_bgcolor='#363a41',
        hovermode="x"
    )
    fig.update_xaxes(title_text='')

    return fig

# Total Energy Cost Chart to JSON
def total_energy_cost_chart_json(monthly_charging):
    aggregated_data = monthly_charging.groupby(['month']).agg({'total_energy': 'sum', 'total_cost': 'sum'}).reset_index()
    aggregated_data['month'] = pd.to_datetime(aggregated_data['month'], format='%Y-%m')
    # min_month = aggregated_data['month'].min().strftime('%b %Y')
    # max_month = aggregated_data['month'].max().strftime('%b %Y')

    # Convert data points to a list of dictionaries
    data_points = aggregated_data.to_dict(orient='records')

    # Convert to JSON format
    data_json = json.dumps(data_points)

    return data_json

# Monthly Energy Consumption Chart
def monthly_energy_consumption_chart(monthly_charging):
    aggregated_data = monthly_charging.groupby(['evse_id', 'month'])['total_energy'].sum().reset_index()
    pivot_df = aggregated_data.pivot(index='month', columns='evse_id', values='total_energy').reset_index()
    pivot_df['month'] = pd.to_datetime(pivot_df['month'], format='%Y-%m')

    min_month = pivot_df['month'].min().strftime('%b %Y')
    max_month = pivot_df['month'].max().strftime('%b %Y')
    title_text = f"Monthly Energy Consumption across Chargers<br>({min_month} - {max_month})"
    colors = ['#' + ''.join([random.choice('0123456789ABCDEF') for j in range(6)]) for i in range(len(pivot_df.columns) - 1)]

    fig = px.line(pivot_df, x='month', y=pivot_df.columns[1:], title=title_text)

    for i, line in enumerate(fig.data):
        fig.data[i].update(line=dict(color=colors[i]))

    default_height = 355
    height = fig.layout.height if fig.layout.height is not None else default_height
    fig.update_layout(
        title=dict(
            text=title_text,
            x=0.5,
            y=0.95,
            xanchor='center',
            font=dict(color='white'),
        ),
        xaxis=dict(
            title='Month',
            title_font=dict(color='white'),
            tickfont=dict(color='white'),
            gridcolor='rgba(255,255,255,0)',
            linecolor='white',
            tickcolor='white',
            dtick="M2",
            tickformat="%b %Y"
        ),
        yaxis=dict(
            title='Energy Consumption (kWh)',
            title_font=dict(color='white'),
            tickfont=dict(color='white'),
            gridcolor='rgba(255,255,255,0)',
            linecolor='white',
            tickcolor='white'
        ),
        showlegend=False,
        height=height,
        paper_bgcolor='#363a41',
        plot_bgcolor='#363a41',
        margin=dict(r=20)
    )
    fig.update_xaxes(title_text='')

    return fig

# Monthly Energy Consumption Chart
def monthly_energy_consumption_chart_json(monthly_charging):
    aggregated_data = monthly_charging.groupby(['evse_id', 'month'])['total_energy'].sum().reset_index()
    pivot_df = aggregated_data.pivot(index='month', columns='evse_id', values='total_energy').reset_index()
    pivot_df['month'] = pd.to_datetime(pivot_df['month'], format='%Y-%m')

    # Convert data points to a list of dictionaries
    data_points = pivot_df.to_dict(orient='records')

    # Convert to JSON format
    data_json = json.dumps(data_points)

    return data_json

###########################################################
######################### PRICING #########################
###########################################################

# Payment Mode Donut Chart
def payment_mode_donut_chart(charging_transactions, start_date=min_date, end_date=max_date):
    charging_transactions = charging_transactions.dropna(subset=['Payment By'])
    payment_type_count = charging_transactions['Payment By'].value_counts()
    colors = {
        'Fleet Credit Wallet': '#29A3CC',
        'Group Credit': '#8CD1E6',
        'RFID': '#005D82',
        'User Credit': '#8eaadb'
    }
    color_sequence = [colors[group] for group in payment_type_count.index if group in colors]

    fig = px.pie(values=payment_type_count, 
                 names=payment_type_count.index, 
                 hole=0.7,
                 color_discrete_sequence=color_sequence)

    fig.update_traces(textinfo='percent', 
                      textposition='outside',
                      hovertemplate='Mode: %{label}<br>Count: %{value}<extra></extra>')
    fig.update_layout(
        title=dict(text=f"Payment Mode<br>({start_date.strftime('%d %b %Y')} to {end_date.strftime('%d %b %Y')})", x=0.5, y=0.95, xanchor='center'),
        paper_bgcolor='#363a41',
        plot_bgcolor='#363a41',
        showlegend=True,
        legend_title_text='Payment Mode',
        height=430,
        legend=dict(
            x=0.5,
            y=-0.5,
            xanchor='center',
            yanchor='middle',
            orientation='h'
        ),
        margin=dict(t=100, l=50, r=50, b=20),
    )
    fig.add_annotation(text=f"<span style='font-size:18px; font-weight:bold;'>{charging_transactions['Payment By'].nunique()}</span><br><b>Payment Modes</b>",
                       x=0.5, y=0.5, showarrow=False, font=dict(size=12), align="center")

    return fig

# Payment Mode Donut Chart Data Points to JSON
def payment_mode_donut_chart_json(charging_transactions, start_date=min_date, end_date=max_date):
    charging_transactions = charging_transactions.dropna(subset=['Payment By'])
    payment_type_count = charging_transactions['Payment By'].value_counts()

    # Convert data points to a list of dictionaries
    data_points = payment_type_count.to_dict(orient='records')

    # Convert to JSON format
    data_json = json.dumps(data_points)

    return data_json

# Utilisation Price Chart
def get_util_price_chart(charger_charging):
    charger_charging = charger_charging.dropna(subset=['Applicable Discount'])

    charger_times = charger_charging.groupby('Station ID').agg({
        'totalDuration': 'sum',
        'Rate': 'mean',
        'Applicable Discount': 'mean',
        'Date': lambda x: x.max() - x.min()
    }).reset_index()

    charger_utilisation = charger_times.copy()
    charger_utilisation.columns = ['Charger ID', 'Total Time', 'Rate', 'Discount', 'Time Period']
    charger_utilisation['Time Period'] = charger_utilisation['Time Period'].dt.total_seconds() / 60
    charger_utilisation['Time Period'] = np.where(charger_utilisation['Time Period'] == 0, 1440, charger_utilisation['Time Period'])
    charger_utilisation["Utilisation Rate"] = charger_utilisation.apply(lambda x: (x['Total Time'] / x['Time Period']), axis=1)
    charger_utilisation = charger_utilisation.sort_values(by='Utilisation Rate', ascending=False)

    fig = px.scatter(
        charger_utilisation,
        x='Utilisation Rate',
        y='Rate',
        labels={"Rate": "Average Rate ($/kWh)", "Utilisation Rate": "Utilisation Rate (%)", "Discount": "Applicable Discount (%)"},
        hover_data=['Charger ID']
    )

    height = 717 
    fig.update_layout(
        xaxis_title="Utilisation Rate (%)",
        yaxis_title="Average Rate ($)",
        xaxis=dict(tickformat=".0%", gridcolor='#999594'),
        yaxis=dict(tickformat="$,.2f", gridcolor='#999594'),
        paper_bgcolor='#363a41',
        plot_bgcolor='#363a41',
        height=height,
        margin=dict(t=0, l=50, r=50, b=50)
    )
    fig.update_traces(marker=dict(color='#b22222', size=10))

    return fig

# Utilisation Price Chart Data Points to JSON
def get_util_price_chart_json(charger_charging):
    charger_charging = charger_charging.dropna(subset=['Applicable Discount'])

    charger_times = charger_charging.groupby('Station ID').agg({
        'totalDuration': 'sum',
        'Rate': 'mean',
        'Applicable Discount': 'mean',
        'Date': lambda x: x.max() - x.min()
    }).reset_index()

    charger_utilisation = charger_times.copy()
    charger_utilisation.columns = ['Charger ID', 'Total Time', 'Rate', 'Discount', 'Time Period']
    charger_utilisation['Time Period'] = charger_utilisation['Time Period'].dt.total_seconds() / 60
    charger_utilisation['Time Period'] = np.where(charger_utilisation['Time Period'] == 0, 1440, charger_utilisation['Time Period'])
    charger_utilisation["Utilisation Rate"] = charger_utilisation.apply(lambda x: (x['Total Time'] / x['Time Period']), axis=1)
    charger_utilisation = charger_utilisation.sort_values(by='Utilisation Rate', ascending=False)

    # Convert data points to a list of dictionaries
    data_points = charger_utilisation.to_dict(orient='records')

    # Convert to JSON format
    data_json = json.dumps(data_points)

    return data_json

###########################################################
########################## USERS ##########################
###########################################################

# User Donut Chart
def user_donut_chart(charging_transactions):
    user_type_count = charging_transactions['User Type Cleaned'].value_counts()
    colors = {
        'Fleet': '#2986cc',
        'Member': '#53a67f',
        'Partner': '#e67300',
        'Public': '#b22222',
    }

    fig = px.pie(values=user_type_count, 
                 names=user_type_count.index, 
                 hole=0.6,
                 color_discrete_sequence=[colors[op] for op in user_type_count.index])
    
    height = 400
    fig.update_traces(textinfo='label+percent', textposition='outside', textfont=dict(size=14, color="white"),
                      hovertemplate='User Type: %{label}<br>Count: %{value}<extra></extra>')
    fig.update_layout(
        title=dict(text="Usage across Users<br>(Feb 2023 - Apr 2024)", x=0.5, y=0.95, xanchor='center'),
        paper_bgcolor='#363a41',
        plot_bgcolor='#363a41',
        showlegend=False,
        height=height,
    )
    fig.add_annotation(text=f"<b>Charging Sessions</b><br><span style='font-size:18px; font-weight:bold;'>{str(sum(user_type_count))}</span>",
                    x=0.5, y=0.5, showarrow=False,
                    font=dict(size=12),
                    align="center")

    return fig

# User Donut Chart to JSON
def user_donut_chart_json(charging_transactions):
    user_type_count = charging_transactions['User Type Cleaned'].value_counts()

    # Convert data points to a list of dictionaries
    data_points = user_type_count.to_dict(orient='records')

    # Convert to JSON format
    data_json = json.dumps(data_points)

    return data_json

# Fleet Donut Chart
def fleet_donut_chart(charging_transactions):
    charging_transactions = charging_transactions[charging_transactions['User Type Cleaned'] == 'Fleet']
    group_type_count = charging_transactions['Group Type Cleaned'].value_counts()
    unique_fleets = set(charging_transactions['Group Type Cleaned'])
    colors = {fleet_id: f'#{random.randint(0, 0xFFFFFF):06x}' for fleet_id in unique_fleets}
    colors = {
        'Strides Taxi': '#29A3CC',
        'GetGo Vendor': '#8CD1E6',
        'GetGo Operation': '#005D82',
        'Others': '#8eaadb'
    }
    color_sequence = [colors[group] for group in group_type_count.index if group in colors]

    fig = px.pie(values=group_type_count, 
                 names=group_type_count.index, 
                 hole=0.7,
                 color_discrete_sequence=color_sequence)

    fig.update_traces(textinfo='percent', 
                      textposition='outside',
                      hovertemplate='Fleet: %{label}<br>Count: %{value}<extra></extra>')
    fig.update_layout(
        title=dict(text="Usage across Fleets<br>(Feb 2023 - Apr 2024)", x=0.5, y=0.95, xanchor='center'),
        paper_bgcolor='#363a41',
        plot_bgcolor='#363a41',
        showlegend=True,
        legend_title_text='Fleet',
        height=350,
        legend=dict(
            x=0.5,
            y=-0.2,
            xanchor='center',
            yanchor='middle',
            traceorder='normal',
            orientation='h'
        ),
        margin=dict(t=100, l=20, r=20, b=20),
    )
    fig.add_annotation(text=f"<b>Charging Sessions</b><br><span style='font-size:18px; font-weight:bold;'>{str(sum(group_type_count))}</span>",
                       x=0.5, y=0.5, showarrow=False, font=dict(size=12), align="center")

    return fig

# Fleet Donut Chart to JSON
def fleet_donut_chart_json(charging_transactions):
    charging_transactions = charging_transactions[charging_transactions['User Type Cleaned'] == 'Fleet']
    group_type_count = charging_transactions['Group Type Cleaned'].value_counts()

    # Convert data points to a list of dictionaries
    data_points = group_type_count.to_dict(orient='records')

    # Convert to JSON format
    data_json = json.dumps(data_points)

    return data_json

# Member Donut Chart
def member_donut_chart(charging_transactions):
    charging_transactions = charging_transactions[charging_transactions['User Type Cleaned'] == 'Member']
    group_type_count = charging_transactions['Group Type Cleaned'].value_counts()
    
    group_type_count.index = group_type_count.index.to_series().replace({
        'Automobile Association of Singapore': 'Automobile Association<br>of Singapore'
    })
    
    unique_members = set(charging_transactions['Group Type Cleaned'])
    colors = {fleet_id: f'#{random.randint(0, 0xFFFFFF):06x}' for fleet_id in unique_members}
    colors = {
        'SAFRA': '#A4DE02',
        'PHV Driver': '#397D02',
        'Automobile Association<br>of Singapore': '#00A550'
    }
    color_sequence = [colors[group] for group in group_type_count.index if group in colors]

    fig = px.pie(values=group_type_count, 
                 names=group_type_count.index, 
                 hole=0.7,
                 color_discrete_sequence=color_sequence)

    fig.update_traces(textinfo='percent', 
                      textposition='outside',
                      hovertemplate='Member: %{label}<br>Count: %{value}<extra></extra>')
    fig.update_layout(
        title=dict(text="Usage across Members<br>(Feb 2023 - Apr 2024)", x=0.5, y=0.95, xanchor='center'),
        paper_bgcolor='#363a41',
        plot_bgcolor='#363a41',
        showlegend=True,
        legend_title_text='Member',
        height=350,
        legend=dict(
            x=0.5,
            y=-0.1,
            xanchor='center',
            yanchor='top',
            orientation='h',
            traceorder='normal',
            font=dict(size=10),
            bgcolor='#363a41'
        ),
        margin=dict(t=100, l=20, r=20, b=50),
    )
    fig.add_annotation(text=f"<b>Charging Sessions</b><br><span style='font-size:18px; font-weight:bold;'>{str(sum(group_type_count))}</span>",
                       x=0.5, y=0.5, showarrow=False, font=dict(size=12), align="center")

    return fig

# Member Donut Chart to JSON
def member_donut_chart_json(charging_transactions):
    charging_transactions = charging_transactions[charging_transactions['User Type Cleaned'] == 'Member']
    group_type_count = charging_transactions['Group Type Cleaned'].value_counts()

    # Convert data points to a list of dictionaries
    data_points = group_type_count.to_dict(orient='records')

    # Convert to JSON format
    data_json = json.dumps(data_points)

    return data_json

# Partner Donut Chart
def partner_donut_chart(charging_transactions):
    charging_transactions = charging_transactions[charging_transactions['User Type Cleaned'] == 'Partner']
    group_type_count = charging_transactions['Group Type Cleaned'].value_counts()

    unique_partners = set(charging_transactions['Group Type Cleaned'])
    colors = {fleet_id: f'#{random.randint(0, 0xFFFFFF):06x}' for fleet_id in unique_partners}
    colors = {
        'GetGo Partner': '#CC5500'
    }
    color_sequence = [colors[group] for group in group_type_count.index if group in colors]

    fig = px.pie(values=group_type_count, 
                 names=group_type_count.index, 
                 hole=0.7,
                 color_discrete_sequence=color_sequence)

    fig.update_traces(textinfo='percent', 
                      textposition='outside',
                      hovertemplate='Partner: %{label}<br>Count: %{value}<extra></extra>')
    fig.update_layout(
        title=dict(text="Usage across Partners<br>(Feb 2023 - Apr 2024)", x=0.5, y=0.95, xanchor='center'),
        paper_bgcolor='#363a41',
        plot_bgcolor='#363a41',
        showlegend=True,
        legend_title_text='Partner',
        height=350,
        legend=dict(
            x=0.5,
            y=-0.1,
            xanchor='center',
            yanchor='top',
            traceorder='normal',
            orientation='h'
        ),
        margin=dict(t=100, l=20, r=20, b=20),
    )
    fig.add_annotation(text=f"<b>Charging Sessions</b><br><span style='font-size:18px; font-weight:bold;'>{str(sum(group_type_count))}</span>",
                       x=0.5, y=0.5, showarrow=False, font=dict(size=12), align="center")

    return fig

# Partner Donut Chart to JSON
def partner_donut_chart_json(charging_transactions):
    charging_transactions = charging_transactions[charging_transactions['User Type Cleaned'] == 'Partner']
    group_type_count = charging_transactions['Group Type Cleaned'].value_counts()

    # Convert data points to a list of dictionaries
    data_points = group_type_count.to_dict(orient='records')

    # Convert to JSON format
    data_json = json.dumps(data_points)

    return data_json

# User Across Time Chart
def user_across_time(charging_transactions):
    charging_transactions = charging_transactions.drop_duplicates(subset=['User ID', 'Month'])
    grouped_data = charging_transactions.groupby(['Month', 'User Type Cleaned']).size().reset_index(name='Count')
    charging_transactions.sort_values('Month', inplace=True)
    grouped_data = charging_transactions.groupby(['Month', 'User Type Cleaned']).size().reset_index(name='Count')
    pivot_df = grouped_data.pivot(index='Month', columns='User Type Cleaned', values='Count').fillna(0)
    pivot_df_reset = pivot_df.reset_index()
    pivot_df_reset = pivot_df.reset_index()
    unique_user_types = pivot_df.columns
    colors = {
        'Fleet': '#2986cc',
        'Member': '#53a67f',
        'Partner': '#e67300',
        'Public': '#b22222',
    }

    fig = px.line(pivot_df_reset, x='Month', y=pivot_df_reset.columns[1:])
    for user_type in unique_user_types:
        fig.update_traces(selector=dict(name=user_type), line=dict(color=colors[user_type], width=3))

    fig.update_layout(
        title=dict(text="Users over Time<br>(Feb 2023 - Apr 2024)", x=0.5, y=0.95, xanchor='center'),
        xaxis_title='Month',
        yaxis_title='No. of Users',
        xaxis=dict(
            tickmode='array',
            tickvals=pivot_df_reset['Month'],
            ticktext=[date.strftime('%b %Y') for date in pd.to_datetime(pivot_df_reset['Month'])]
        ),
        legend_title_text='User Type',
        paper_bgcolor='#363a41',
        plot_bgcolor='#363a41',
        height=350
    )

    return fig

# User Across Time Chart to JSON
def user_across_time_json(charging_transactions):
    # Remove duplicate entries based on 'User ID' and 'Month'
    charging_transactions = charging_transactions.drop_duplicates(subset=['User ID', 'Month'])

    # Group by 'Month' and 'User Type Cleaned', then count the occurrences
    grouped_data = charging_transactions.groupby(['Month', 'User Type Cleaned']).size().reset_index(name='Count')

    # Pivot the DataFrame to have 'Month' as index and 'User Type Cleaned' as columns, filling NaN with 0
    pivot_df = grouped_data.pivot(index='Month', columns='User Type Cleaned', values='Count').fillna(0).reset_index()

    # Convert to JSON format
    data_json = pivot_df.to_json(orient='records')

    return data_json

###########################################################
################### OPERATOR (UNUSED) #####################
###########################################################

# Utilisation Operator Chart
def util_operator_chart(charging):
    if 'Strides' not in unique_chargers.keys():
        charging['operator'] = charging['operator'].apply(lambda x: 'ChargEco')

    charging['Date'] = pd.to_datetime(charging['Date'])
    num_days = (charging['Date'].max() - charging['Date'].min()).days
    aggregated_data = charging.groupby('operator')['totalDuration'].sum().reset_index()
    aggregated_data['days'] = num_days
    aggregated_data['Chargers'] = aggregated_data['operator'].apply(lambda x: unique_chargers[x])
    aggregated_data["Utilisation"] = ((aggregated_data['totalDuration']/(aggregated_data['days'] * 24 * 60 * aggregated_data['Chargers'])) * 100).round(2)

    colors = {
        'GetGo': '#1f77b4',
        'LKH': '#2ca02c',
        'Lemon Charge': '#ff7f0e',
        'Strides': '#d62728',
        'ChargEco': '#add653' 
    }

    fig = px.bar(aggregated_data, y='Utilisation', x='operator', color='operator', text='Utilisation',
                title=f'Average Utilisation by Operator<br>(Feb 2023 - Feb 2024)', color_discrete_map=colors)
    height = 350
    fig.update_traces(texttemplate='%{text:.2f}%', textposition='outside', insidetextanchor='end',
                      textfont=dict(size=14, color="white"), hovertemplate='Operator: %{x}<br>Utilisation: %{y:.2f}%<extra></extra>')
    fig.update_layout(
        title = dict(x=0.5, y=0.95, xanchor = 'center'),
        yaxis_title='Average Utilisation (%)',
        xaxis_title='Operator',
        showlegend=False,
        paper_bgcolor='#363a41',
        plot_bgcolor='#363a41',
        height=height,
    )
    fig.update_yaxes(range=[0, max(aggregated_data["Utilisation"]) * 1.2])

    return fig

# Operators Donut Chart
def operator_donut_chart(charger):
    operator_counts = charger['operator'].value_counts()
    colors = {
        'GetGo': '#1f77b4',
        'LKH': '#2ca02c',
        'Lemon Charge': '#ff7f0e',
        'Strides': '#d62728',
        'ChargEco': '#add653' 
    }

    fig = px.pie(values=operator_counts, 
                 names=operator_counts.index, 
                 hole=0.5,
                 color_discrete_sequence=[colors[op] for op in operator_counts.index])
    height = 350
    fig.update_traces(textinfo='percent+value', textposition='outside', textfont=dict(size=14, color="white"),
                      hovertemplate='Operator: %{label}<br>Count: %{value}<extra></extra>')
    fig.update_layout(
        title=dict(text="Distribution of Operators<br>(Feb 2023 - Feb 2024)", x=0.5, y=0.95, xanchor='center'),
        paper_bgcolor='#363a41',
        plot_bgcolor='#363a41',
        showlegend=False,
        height=height,
    )
    fig.add_annotation(text=str(sum(operator_counts)),
                       x=0.5, y=0.5, showarrow=False, font=dict(size=20))

    return fig

# Price across Operators Chart
def price_operator_chart(charger):
    aggregated_data = charger.groupby('operator')['price'].mean().reset_index()
    colors = {
        'GetGo': '#1f77b4',
        'LKH': '#2ca02c',
        'Lemon Charge': '#ff7f0e',
        'Strides': '#d62728',
        'ChargEco': '#add653' 
    }
    
    aggregated_data['price'] = aggregated_data['price'].round(4)
    fig = px.bar(aggregated_data, y='price', x='operator', color='operator', text='price',
                title=f'Average Price by Operator ($/kWh)<br>(Feb 2023 - Feb 2024)', color_discrete_map=colors)

    fig.update_traces(texttemplate='%{text:$.4f}', textposition='outside', insidetextanchor='end',
                      textfont=dict(size=14, color="white"))

    height = 350
    fig.update_layout(
        title = dict(x=0.5, y=0.95, xanchor = 'center'),
        yaxis_title='Average Price ($/kWh)',
        xaxis_title='Operator',
        showlegend=False,
        paper_bgcolor='#363a41',
        plot_bgcolor='#363a41',
        height=height,
    )
    fig.update_yaxes(range=[0, max(aggregated_data["price"]) * 1.2])

    return fig

# Operator AC/DC Chart
def operator_acdc_chart(charger):
    aggregated_data = charger.groupby(['operator', 'power_type']).size().reset_index(name='count')
    aggregated_data = aggregated_data.set_index(['operator', 'power_type']).unstack(fill_value=0).stack().reset_index()
    aggregated_data.columns = ['operator', 'power_type', 'count']
    
    colors = {
        'GetGo': '#1f77b4',
        'LKH': '#2ca02c',
        'Lemon Charge': '#ff7f0e',
        'Strides': '#d62728',
        'ChargEco': '#add653' 
    }
    
    max_x = max(aggregated_data['count']) * 1.2
    figs = []

    for operator in aggregated_data['operator'].unique():
        fig = px.bar(aggregated_data[aggregated_data['operator'] == operator], y='power_type', x='count', orientation='h', color='operator', text='count',
                     color_discrete_map=colors, title=f"{operator}")
        
        default_height = 327
        height = fig.layout.height if fig.layout.height is not None else default_height
        fig.update_layout(
            title = dict(x=0.5, y=0.95, xanchor = 'center'),
            showlegend=False,
            paper_bgcolor='#363a41',
            plot_bgcolor='#363a41',
            height=height/2,
            margin=dict(l=0, r=20, t=40, b=40), 
        )
        fig.update_traces(textfont_size=14, textposition='outside')
        fig.update_yaxes(autorange="reversed", title_text='')
        fig.update_xaxes(range=[0, max_x], showticklabels=False, visible=False)
        figs.append(fig)

    return figs