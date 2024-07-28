import pandas as pd

df = pd.read_csv('world_population.csv')
# df = df.sort_values(['Rank']).head(20)
# df.to_csv("top20_world_population.csv", index = False)

df = df.append(df.sum(numeric_only=True), ignore_index=True)
df_total = df.tail(1)
df_total = df_total.fillna('Total')
df_total.to_csv("total_world_population.csv", index = False)
