import pandas as pd
import os
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

POS_SCORE = {
    'FW': 1.0, 'FW,MF': 0.75, 'MF,FW': 0.75,
    'MF': 0.5, 'FW,DF': 0.5, 'DF,FW': 0.5,
    'DF,MF': 0.25, 'MF,DF': 0.25, 'DF': 0.0,
}

base_dir = os.path.dirname(os.path.abspath(__file__))
df = pd.read_csv(os.path.join(base_dir, 'premier-player-23-24.csv'))
df = df[df['Min'] >= 900].copy()
df = df[df['Pos'] != 'GK'].copy()
df = df.reset_index(drop=True)

df['PrgC_90'] = df['PrgC'] / df['90s']
df['PrgP_90'] = df['PrgP'] / df['90s']
df['PrgR_90'] = df['PrgR'] / df['90s']
df['pos_score'] = df['Pos'].map(POS_SCORE).fillna(0.5)

C = df['Min'].mean()
smoothable = ['Gls_90', 'Ast_90', 'npxG_90', 'xAG_90', 'PrgC_90', 'PrgP_90', 'PrgR_90']
for feat in smoothable:
    mean = df[feat].mean()
    df[feat + '_s'] = (df[feat] * df['Min'] + mean * C) / (df['Min'] + C)

df['finisher_ratio_s'] = (df['npxG_90_s'] / df['xAG_90_s'].clip(lower=0.01)).clip(upper=10.0)
df['pos_score_s'] = df['pos_score']
clustering_features = [f + '_s' for f in smoothable] + ['finisher_ratio_s', 'pos_score_s']

scaler = StandardScaler()
scaled_data = scaler.fit_transform(df[clustering_features])

df['Cluster'] = KMeans(n_clusters=7, random_state=42, n_init=10).fit_predict(scaled_data)

inspect_cols = ['npxG_90_s', 'xAG_90_s', 'PrgP_90_s', 'PrgC_90_s', 'pos_score_s', 'finisher_ratio_s']
print("\nCluster mean stats:")
print(df.groupby('Cluster')[inspect_cols].mean().round(3).to_string())
print(f"\nCluster sizes: {dict(df['Cluster'].value_counts().sort_index())}")

print("\nSample players per cluster:")
for cid in range(7):
    sub = df[df['Cluster'] == cid][['Player', 'Pos', 'npxG_90', 'xAG_90', 'PrgP_90']].head(6)
    print(f"\nCluster {cid}:")
    print(sub.to_string(index=False).encode('ascii', 'replace').decode('ascii'))
