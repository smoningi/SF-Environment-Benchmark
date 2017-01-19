#!/usr/bin/env python

# Make sure to install requests before running:
# > pip install requests

import requests
import json

url = "https://data.sfgov.org/resource/j2j3-acqj.json"

response = requests.get(url)
if response.status_code == 200:
    data = response.json()
    with open('75rg-imyz.json', 'w') as the_file:
        json.dump(data, the_file)
