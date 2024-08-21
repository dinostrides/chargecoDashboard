from django.core.cache import cache
import pandas as pd
import datetime
import re

CACHE_TIMEOUT = 60 * 60 * 24  # Cache timeout in seconds (e.g., 1 day)

def read_file(file_path, sheet_name='Sheet1'):
    return pd.read_excel(file_path, sheet_name=sheet_name)

def load_charger_details():
    cache_key = 'charger_details'
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        return cached_data['charger_data'], cached_data['unique_chargers'], cached_data['charger_charging']

    file_path = './dashboard/static/data/ChargeEco_Master(Production).xlsx'
    master_data = read_file(file_path, sheet_name=None)
    charger_data = master_data['Master Charger']
    unique_chargers = charger_data.groupby('operator')['evCpId'].nunique().to_dict()

    # Monthly Charging Report
    charger_charging = master_data['chargerCharging']


    def assign_operation_status(row):
        if str(row['evCpId']) == 'nan':
            return "No Charging Points"
        elif "Coming Soon" in str(row['name']):
            return "Coming Soon"
        else:
            return "In Operation"

    charger_data['In Operation'] = charger_data.apply(assign_operation_status, axis=1)
    cache.set(cache_key, {'charger_data': charger_data, 'unique_chargers': unique_chargers, 'charger_charging': charger_charging}, CACHE_TIMEOUT)
    return charger_data, unique_chargers, charger_charging

def load_inactive_chargers():
    inactive_chargers = read_file('./dashboard/static/data/2024-05-16-Connectors Invalid List.xlsx')

    # Replace '\N' with the current datetime
    current_time = datetime.datetime.now()
    inactive_chargers['last_heartbeat_timestamp'] = inactive_chargers['last_heartbeat_timestamp'].replace('\\N', current_time)

    # Convert the last_heartbeat_timestamp column to datetime format
    inactive_chargers['last_heartbeat_timestamp'] = pd.to_datetime(inactive_chargers['last_heartbeat_timestamp'], errors='coerce', format='%d/%m/%Y %H:%M')

    # Create the dictionary mapping charge_box_id to last_heartbeat_timestamp
    inactive_charger_dict = inactive_chargers.set_index('charge_box_id')['last_heartbeat_timestamp'].to_dict()

    return inactive_charger_dict

def load_dummy_charger_transactions(charger_data):
    cache_key = 'dummy_charger_transactions'
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        return cached_data

    file_path = './dashboard/static/data/chargingDummyData.xlsx'
    charging_dummy = read_file(file_path)
    charging_dummy['Date'] = pd.to_datetime(charging_dummy['Date']).dt.date
    charging_dummy['Start Time'] = pd.to_datetime(charging_dummy['Start Time'])
    charging_dummy['Hour'] = charging_dummy['Start Time'].dt.hour
    charging_dummy = charging_dummy.merge(charger_data[['evCpId', 'address']], on='evCpId', how='left')

    cache.set(cache_key, charging_dummy, CACHE_TIMEOUT)
    return charging_dummy

def load_real_transactions(charger_data):
    cache_key = 'real_transactions'
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        return cached_data['charging_transactions'], cached_data['max_date'], cached_data['min_date']

    file_path = './dashboard/static/data/combined_transactions.xlsx'
    charging_transactions = read_file(file_path, sheet_name='charging_transactions')
    charging_transactions['Start Date/Time'] = pd.to_datetime(charging_transactions['Start Date/Time'].str.extract(r'(\d{2}/\d{2}/\d{4} \d{2}:\d{2})')[0], format='%d/%m/%Y %H:%M')
    charging_transactions['End Date/Time'] = pd.to_datetime(charging_transactions['End Date/Time'].str.extract(r'(\d{2}/\d{2}/\d{4} \d{2}:\d{2})')[0], format='%d/%m/%Y %H:%M')
    charging_transactions['Date'] = charging_transactions['Start Date/Time'].dt.date
    charging_transactions['Month'] = charging_transactions['Start Date/Time'].dt.strftime('%m/%Y')
    charging_transactions['Month'] = pd.to_datetime(charging_transactions['Month'], format='%m/%Y')
    charging_transactions['Start Time'] = charging_transactions['Start Date/Time'].dt.time
    charging_transactions['Hour'] = charging_transactions['Start Date/Time'].dt.hour

    def clean_user_type(user_type, group_type):
        if not pd.isna(group_type):
            if 'MEMBER' in group_type:
                return 'Member'
        if 'FLEET' in user_type:
            return 'Fleet'
        elif 'MEMBER' in user_type:
            return 'Member'
        elif 'PARTNER' in user_type:
            return 'Partner'
        else:
            return 'Public'

    def clean_group_type(user_type, group):
        if pd.isna(group):
            if "RFID" not in user_type:
                extracted_group_type = re.search(r'\(([^)]+)\)', user_type)
                if extracted_group_type:
                    if extracted_group_type.group(1) == 'GetGo':
                        return 'GetGo Partner'
                    elif extracted_group_type.group(1) in ('Strides Premier Auto', 'Strides Premier Taxi', 'SMRT Buses'):
                        return 'Others'
                    return extracted_group_type.group(1)
                return None
            else:
                return pd.NA
        if group in ('Strides Premier Auto', 'Strides Premier Taxi', 'SMRT Buses'):
            return 'Others'
        return group

    def clean_user_id(user_id, id_tag):
        if pd.isna(user_id):
            return id_tag
        else:
            return user_id

    charging_transactions['User Type Cleaned'] = charging_transactions.apply(
        lambda row: clean_user_type(row['User Type'], row['Group Type']), axis=1)

    charging_transactions['Group Type Cleaned'] = charging_transactions.apply(
        lambda row: clean_group_type(row['User Type'], row['Group']), axis=1)

    charging_transactions['User ID'] = charging_transactions.apply(
        lambda row: clean_user_id(row['User ID'], row['ID tag']), axis=1)

    def convert_duration_to_minutes(duration):
        if isinstance(duration, str):
            parts = duration.split()
            hours = int(parts[0]) if len(parts) > 1 else 0
            minutes = int(parts[2]) if len(parts) > 3 else 0
            return hours * 60 + minutes
        else:
            return pd.NA

    charging_transactions['totalDuration'] = charging_transactions['Transaction Duration'].apply(convert_duration_to_minutes)

    def categorize_hour(hour):
        if pd.isnull(hour):
            return None
        elif 8 <= hour.hour <= 18:
            return 'DAY'
        else:
            return 'NIGHT'

    charging_transactions['Day/Night'] = charging_transactions['Start Date/Time'].apply(categorize_hour)
    charging_transactions['Weekend/Weekday'] = charging_transactions['Start Date/Time'].dt.dayofweek.apply(lambda x: "Weekend" if x // 5 == 1 else "Weekday")

    charging_transactions = charging_transactions.merge(charger_data.drop_duplicates(subset=['evCpId'], keep='first')[['evCpId', 'address', 'power_type', 'latitude', 'longitude', 'price', 'In Operation']], left_on='Station ID', right_on='evCpId', how='left')
    charging_transactions = charging_transactions.drop_duplicates(subset='Transaction ID', keep='first')

    def clean_and_convert_rate(rate):
        if pd.isna(rate):
            return 0
        if 'null' in rate:
            return 0
        rate = rate.split(';')[0]
        rate = rate.replace('S$', '').replace('/kWh', '').replace('/HR', '').strip()
        return float(rate)

    charging_transactions['Rate'] = charging_transactions['Rate'].apply(clean_and_convert_rate)

    def clean_payment_type(payment_type):
        if not pd.isna(payment_type):
            if 'fleet' in payment_type:
                return 'Fleet Credit Wallet'
            if 'Uaer' in payment_type:
                return 'User Credit'
        return payment_type

    charging_transactions['Payment By'] = charging_transactions['Payment By'].apply(clean_payment_type)

    def clean_discount(discount):
        if pd.isna(discount):
            return 0
        discount = discount.replace('S$', '').strip()
        return float(discount)

    charging_transactions['Applicable Discount'] = charging_transactions['Applicable Discount'].apply(clean_discount)
    max_date, min_date = charging_transactions['Start Date/Time'].max().date(), charging_transactions['Start Date/Time'].min().date()
    min_date = min_date.replace(day=1)
    max_date = (pd.to_datetime(max_date) + pd.offsets.MonthEnd(0)).date()

    cache.set(cache_key, {'charging_transactions': charging_transactions, 'max_date': max_date, 'min_date': min_date}, CACHE_TIMEOUT)
    return charging_transactions, max_date, min_date
