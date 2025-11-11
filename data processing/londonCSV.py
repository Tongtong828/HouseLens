import pandas as pd


df = pd.read_csv(r"D:\UCL\CASA0017\pricedata\london_2021_2025.csv", low_memory=False)


geo_candidates = ["District", "Town", "County"]
geo_col = next((c for c in geo_candidates if c in df.columns), None)
if geo_col is None:
    raise KeyError("The administrative district column was not found. Please verify that the column name is District/Town/County")

print(f" Administrative district column used: {geo_col}")

target_size = 50_000
total_size = len(df)
sample_fraction = target_size / total_size

print(f"There are {total_size:,} current records，target to retain {target_size:,} records，Sampling ratio ≈ {sample_fraction:.3%}")


sampled_df = (
    df.groupby(geo_col, group_keys=False)
      .apply(lambda x: x.sample(frac=sample_fraction, random_state=42))
      .reset_index(drop=True)
)

print(f" Sampling finished，in total {len(sampled_df):,} records")


print("\n Proportion of each borough before and after sampling：")
before = df[geo_col].value_counts(normalize=True) * 100
after = sampled_df[geo_col].value_counts(normalize=True) * 100
comparison = pd.DataFrame({'Before (%)': before, 'After (%)': after}).head(10)
print(comparison)

output_path = r"D:\UCL\CASA0017\pricedata\london_2021_2025_sampled.csv"
sampled_df.to_csv(output_path, index=False)
print(f"\n save to: {output_path}")

