import pandas as pd
import glob
import os


folder_path = r"D:\UCL\CASA0017\pricedata"

# Select target years file
csv_files = sorted(glob.glob(os.path.join(folder_path, "pp-202[1-5].csv")))

print("found file：")
for f in csv_files:
    print(" -", os.path.basename(f))

# Data column header name
cols = [
    'TransactionID', 'Price', 'Date', 'Postcode', 'PropertyType',
    'NewBuildFlag', 'Duration', 'PAON', 'SAON', 'Street',
    'Locality', 'Town', 'District', 'County', 'PPDCategoryType', 'RecordStatus'
]

# Merge all files
all_data = pd.concat(
    (pd.read_csv(f, header=None, names=cols) for f in csv_files),
    ignore_index=True
)

print(f"\n Merge complete, in total {len(all_data):,} records")

# Save as new file
output_path = os.path.join(folder_path, "merged_2021_2025.csv")
all_data.to_csv(output_path, index=False)

print(f"Save as:{output_path}")

# Filtering data for the London area
london_data = all_data[all_data["County"] == "GREATER LONDON"]
london_data.to_csv("london_2021_2025.csv", index=False)

print(f"Save as:{london_data}")