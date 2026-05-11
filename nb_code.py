import pandas as pd
import os
import scipy.stats as stats
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import warnings

warnings.filterwarnings('ignore')

# ─── CONSTANTS ────────────────────────────────────────────────────────────────

POS_SCORE = {
    'FW': 1.0,
    'FW,MF': 0.75, 'MF,FW': 0.75,
    'MF': 0.5,  'FW,DF': 0.5, 'DF,FW': 0.5,
    'DF,MF': 0.25, 'MF,DF': 0.25,
    'DF': 0.0,
}

# ─── 1. LOAD & FILTER ─────────────────────────────────────────────────────────

base_dir = os.path.dirname(os.path.abspath(__file__))
df = pd.read_csv(os.path.join(base_dir, 'premier-player-23-24.csv'))

print(f"Total players before filtering: {len(df)}")
df_filtered = df[df['Min'] >= 900].copy()
df_filtered = df_filtered[df_filtered['Pos'] != 'GK'].copy()
df_filtered = df_filtered.reset_index(drop=True)
print(f"Total outfield players after filtering (>= 900 mins): {len(df_filtered)}")

# ─── 2. FEATURE ENGINEERING ───────────────────────────────────────────────────

df_filtered['PrgC_90'] = df_filtered['PrgC'] / df_filtered['90s']
df_filtered['PrgP_90'] = df_filtered['PrgP'] / df_filtered['90s']
df_filtered['PrgR_90'] = df_filtered['PrgR'] / df_filtered['90s']

# Position score: forward = 1.0, defender = 0.0
df_filtered['pos_score'] = df_filtered['Pos'].map(POS_SCORE).fillna(0.5)

# Bayesian smoothing: pulls extreme values from low-minute players towards the mean
C = df_filtered['Min'].mean()
smoothable = ['Gls_90', 'Ast_90', 'npxG_90', 'xAG_90', 'PrgC_90', 'PrgP_90', 'PrgR_90']
for feat in smoothable:
    mean = df_filtered[feat].mean()
    df_filtered[feat + '_s'] = (
        (df_filtered[feat] * df_filtered['Min'] + mean * C) / (df_filtered['Min'] + C)
    )

# Finisher ratio: high = pure finisher, low = creator/distributor
df_filtered['finisher_ratio_s'] = (
    df_filtered['npxG_90_s'] / df_filtered['xAG_90_s'].clip(lower=0.01)
).clip(upper=10.0)
df_filtered['pos_score_s'] = df_filtered['pos_score']

clustering_features = [f + '_s' for f in smoothable] + ['finisher_ratio_s', 'pos_score_s']

# ─── 3. SCALE ─────────────────────────────────────────────────────────────────

scaler = StandardScaler()
scaled_data = scaler.fit_transform(df_filtered[clustering_features])
df_scaled = pd.DataFrame(scaled_data, columns=clustering_features)
print("Data successfully scaled!")

# ─── 4. CHOOSE K — Elbow + Silhouette ────────────────────────────────────────

k_range = range(2, 11)
inertia = []
silhouette_scores = []

for k in k_range:
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans.fit(df_scaled)
    inertia.append(kmeans.inertia_)
    silhouette_scores.append(silhouette_score(df_scaled, kmeans.labels_))

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5))

ax1.plot(k_range, inertia, marker='o', linestyle='-', color='b')
ax1.set_title('Elbow Method (Inertia)')
ax1.set_xlabel('Number of Clusters (k)')
ax1.set_ylabel('Inertia (Lower is better)')
ax1.grid(True)

ax2.plot(k_range, silhouette_scores, marker='o', linestyle='-', color='g')
ax2.set_title('Silhouette Score')
ax2.set_xlabel('Number of Clusters (k)')
ax2.set_ylabel('Silhouette Score (Higher is better)')
ax2.grid(True)

plt.tight_layout()
plt.show()

# ─── 5. FINAL CLUSTERING (k=7) ────────────────────────────────────────────────

k_final = 7
kmeans_final = KMeans(n_clusters=k_final, random_state=42, n_init=10)
df_filtered['Cluster'] = kmeans_final.fit_predict(df_scaled)
print(df_filtered['Cluster'].value_counts())

# Inspect cluster means to verify the profile labels below make sense
inspect_cols = ['npxG_90_s', 'xAG_90_s', 'PrgP_90_s', 'PrgC_90_s', 'pos_score_s', 'finisher_ratio_s']
print("\nCluster mean stats (smoothed):")
print(df_filtered.groupby('Cluster')[inspect_cols].mean().round(3).to_string())

# ─── 6. PCA FOR VISUALIZATION ─────────────────────────────────────────────────

pca = PCA(n_components=2)
principal_components = pca.fit_transform(df_scaled)
df_filtered['PCA1'] = principal_components[:, 0]
df_filtered['PCA2'] = principal_components[:, 1]

# Initial scatter using numeric cluster IDs
plt.figure(figsize=(14, 10))
sns.scatterplot(
    x='PCA1', y='PCA2', hue='Cluster',
    data=df_filtered, palette='viridis', s=100, alpha=0.7
)

famous_players = [
    'Erling Haaland', 'Bukayo Saka', 'Rodri',
    'Virgil van Dijk', 'Martin Odegaard', 'Ollie Watkins', 'Declan Rice'
]
for player in famous_players:
    player_row = df_filtered[df_filtered['Player'] == player]
    if not player_row.empty:
        x = player_row['PCA1'].values[0]
        y = player_row['PCA2'].values[0]
        plt.text(x + 0.1, y + 0.1, player, fontsize=10, weight='bold',
                 bbox=dict(facecolor='white', alpha=0.5, edgecolor='none'))

plt.title('Premier League Playing Style Map (K-Means + PCA)', fontsize=16, weight='bold')
plt.xlabel(f'Principal Component 1 (Explains {pca.explained_variance_ratio_[0]*100:.1f}% of variance)')
plt.ylabel(f'Principal Component 2 (Explains {pca.explained_variance_ratio_[1]*100:.1f}% of variance)')
plt.legend(title='Group / Cluster', title_fontsize='12')
plt.grid(True, linestyle='--', alpha=0.5)
plt.show()

# ─── 7. CLUSTER SUMMARY TABLE ─────────────────────────────────────────────────

display_features = ['Gls_90', 'Ast_90', 'xG_90', 'xAG_90', 'PrgC_90', 'PrgP_90', 'PrgR_90']
cluster_summary = df_filtered.groupby('Cluster')[display_features].mean()
cluster_summary['No. of Players'] = df_filtered['Cluster'].value_counts()
table_with_colors = cluster_summary.style.background_gradient(cmap='YlGnBu', axis=0)
table_with_colors  # Display in Jupyter

# ─── 8. ASSIGN PROFILE NAMES ──────────────────────────────────────────────────

cluster_names = {
    0: "Workhorses (DM/Fullbacks)",
    1: "Pass Masters",
    2: "Goal Threats",
    3: "Traditional Defenders",
    4: "Box Strikers",
    5: "Attacking Wingers",
    6: "Elite Creators",
}

df_filtered['Player_Profile'] = df_filtered['Cluster'].map(cluster_names)

# Scatter with named profiles
plt.figure(figsize=(14, 10))
sns.scatterplot(
    x='PCA1', y='PCA2', hue='Player_Profile',
    data=df_filtered, palette='tab10', s=100, alpha=0.8
)
plt.title('Premier League Player Profile Map', fontsize=16, weight='bold')
plt.xlabel('Component 1 (Attacking Activity / Final Third Volume)')
plt.ylabel('Component 2 (Progression and Chance Creation)')
plt.legend(title='Player Profile', title_fontsize='12', bbox_to_anchor=(1.05, 1), loc='upper left')
plt.grid(True, linestyle='--', alpha=0.5)
plt.show()

# ─── 9. INTERACTIVE PLOTLY MAP ────────────────────────────────────────────────

fig = px.scatter(
    df_filtered,
    x='PCA1', y='PCA2',
    color='Player_Profile',
    hover_name='Player',
    hover_data={
        'Team': True, 'Pos': True,
        'PCA1': False, 'PCA2': False,
        'Gls_90': True, 'xG_90': True, 'PrgP_90': True,
    },
    title="Interactive Premier League Player Map (Hover over!)",
    width=1000, height=700
)
fig.show()

# ─── 10. PLAYER SEARCH ────────────────────────────────────────────────────────

search_name = "Bruno Fernandes"

fig = px.scatter(
    df_filtered,
    x='PCA1', y='PCA2',
    color='Player_Profile',
    hover_name='Player',
    hover_data={'Team': True, 'Pos': True, 'PCA1': False, 'PCA2': False,
                'Gls_90': True, 'xG_90': True, 'PrgP_90': True},
    title=f"Interactive Style Map - Searching for: {search_name}",
    width=1000, height=700
)

player_found = df_filtered[df_filtered['Player'].str.contains(search_name, case=False, na=False)]

if not player_found.empty:
    real_name = player_found['Player'].values[0]
    profile = player_found['Player_Profile'].values[0]
    print(f"SUCCESS: {real_name} is of type '{profile}'")
    fig.add_scatter(
        x=player_found['PCA1'], y=player_found['PCA2'],
        mode='markers+text',
        marker=dict(color='red', size=20, symbol='star', line=dict(color='black', width=2)),
        text=player_found['Player'],
        textfont=dict(size=14, color='red'),
        textposition='top center',
        name='Search'
    )
else:
    print(f"ERROR: No player named '{search_name}' found in the dataset!")

fig.show()

# ─── 11. PERCENTILES & EXPORT TO JSON ────────────────────────────────────────

for feat in display_features:
    mean = df_filtered[feat].mean()
    smoothed = (df_filtered[feat] * df_filtered['Min'] + mean * C) / (df_filtered['Min'] + C)
    df_filtered[feat + '_percentile'] = smoothed.apply(
        lambda x: stats.percentileofscore(smoothed, x)
    )

export_cols = (
    ['Player', 'Nation', 'Pos', 'Age', 'Team', 'Min',
     'Cluster', 'Player_Profile', 'PCA1', 'PCA2']
    + [f + '_percentile' for f in display_features]
    + display_features
)

output_path = os.path.join(base_dir, 'football-app', 'public', 'data.json')
df_filtered[export_cols].to_json(output_path, orient='records', force_ascii=False)
print(f"\nSaved {len(df_filtered)} players to {output_path}")
