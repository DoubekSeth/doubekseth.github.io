import pandas as pd
from json import loads, dumps
data = pd.read_csv('data_aging_congress.csv')

# Check for missing values
data.isna().sum()

# Check age to make sure it seems reasonable
max(data['age_years'])
min(data['age_years'])
sum(data['age_years'])/len((data['age_years']))

# Add a new column with party name
data['party_code'].unique()
party_dict = {100:"Democrat",
              200:"Republican",
              329:"Ind. Democrat",
              370:"Progressive",
              537:"Farmer-Labor",
              328:"Independent",
              380:"Socialist",
              112:"Conservative",
              356:"Union Labor",
              522:"American Labor",
              331:"Ind. Republican",
              523:"Unknown",
              347:"Prohibitionist",
              402:"Liberal"}
parties = []
for i in range(len(data)):
    sample = data.loc[i]
    parties.append(party_dict[sample['party_code']])
data['party_name'] = parties

# Add a new column with full state name
state_codes = pd.read_csv('states.csv')
state_list = []
for i in range(len(data)):
    sample = data.loc[i]
    state_name = state_codes[state_codes['Abbreviation'] == sample['state_abbrev']]
    state_list.append(state_name['State'].values[0])
data['state_name'] = state_list

state_chambers = []
hash_codes = []
for i in range(len(data)):
    sample = data.loc[i]
    state_chambers.append(f"{sample['state_name']}-{sample['chamber']}")
    hash_codes.append(hash(f"{sample['state_name']}-{sample['chamber']}"))

data['state_chamber'] = state_chambers
data['hash_code'] = hash_codes

# Check the cumulative congress for odd values
max(data['cmltv_cong'])
min(data['cmltv_cong'])
max(data['cmltv_chamber'])
min(data['cmltv_chamber'])

# Convert df to json
data_json = data.to_json(orient="records")
dumps(loads(data_json), indent = 4)


# Export the json
f = open("congress.json", 'a')
f.writelines(data_json)
f.close()