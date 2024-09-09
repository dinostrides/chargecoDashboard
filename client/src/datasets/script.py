# script.py

def format_addresses(input_file, output_file):
    with open(input_file, 'r') as infile, open(output_file, 'w') as outfile:
        for line in infile:
            # Strip newline and surrounding spaces
            line = line.strip()
            # Add quotes at the start and end, and a comma at the end
            formatted_line = f'"{line}",\n'
            outfile.write(formatted_line)

if __name__ == "__main__":
    input_file = 'chargers.json'
    output_file = 'addresses_formatted.json'
    format_addresses(input_file, output_file)
