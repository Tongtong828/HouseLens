import pandas as pd


houses = pd.read_csv(r"D:\UCL\CASA0017\pricedata\london_2021_2025_sampled.csv")


postcodes = pd.read_csv(r"D:\UCL\CASA0017\ukpostcodes\ukpostcodes.csv")


houses["Postcode"] = houses["Postcode"].str.replace(" ", "").str.upper()
postcodes["postcode"] = postcodes["postcode"].str.replace(" ", "").str.upper()


geo_df = houses.merge(postcodes, left_on="Postcode", right_on="postcode", how="left")


output_path = r"D:\UCL\CASA0017\pricedata\london_2021_2025_geo.csv"
geo_df.to_csv(output_path, index=False)

print(f"save as：{output_path}")



print(geo_df[["Postcode", "latitude", "longitude"]].head())
print("successful rate：", geo_df["latitude"].notna().mean() * 100, "%")

