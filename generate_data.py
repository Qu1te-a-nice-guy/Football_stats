import pandas as pd
import os
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
import scipy.stats as stats

POS_SCORE = {
    'FW': 1.0,
    'FW,MF': 0.75, 'MF,FW': 0.75,
    'MF': 0.5,  'FW,DF': 0.5, 'DF,FW': 0.5,
    'DF,MF': 0.25, 'MF,DF': 0.25,
    'DF': 0.0,
}

def process_data():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, 'premier-player-23-24.csv')
    df = pd.read_csv(csv_path)

    df_filtered = df[df['Min'] >= 900].copy()
    df_filtered = df_filtered[df_filtered['Pos'] != 'GK'].copy()
    df_filtered = df_filtered.reset_index(drop=True)

    df_filtered['PrgC_90'] = df_filtered['PrgC'] / df_filtered['90s']
    df_filtered['PrgP_90'] = df_filtered['PrgP'] / df_filtered['90s']
    df_filtered['PrgR_90'] = df_filtered['PrgR'] / df_filtered['90s']

    # Position score: FW=1.0 → DF=0.0
    df_filtered['pos_score'] = df_filtered['Pos'].map(POS_SCORE).fillna(0.5)

    # Per-90 features to Bayesian-smooth
    smoothable = [
        'Gls_90', 'Ast_90',
        'npxG_90', 'xAG_90',
        'PrgC_90', 'PrgP_90', 'PrgR_90',
    ]

    C = df_filtered['Min'].mean()
    for feat in smoothable:
        mean = df_filtered[feat].mean()
        df_filtered[feat + '_s'] = (
            (df_filtered[feat] * df_filtered['Min'] + mean * C)
            / (df_filtered['Min'] + C)
        )

    # Finisher ratio from smoothed values — separates pure finishers (high) from creators (low)
    df_filtered['finisher_ratio_s'] = (
        df_filtered['npxG_90_s'] / df_filtered['xAG_90_s'].clip(lower=0.01)
    ).clip(upper=10.0)

    # pos_score needs no smoothing
    df_filtered['pos_score_s'] = df_filtered['pos_score']

    clustering_features = [f + '_s' for f in smoothable] + ['finisher_ratio_s', 'pos_score_s']

    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(df_filtered[clustering_features])

    kmeans = KMeans(n_clusters=7, random_state=42, n_init=10)
    df_filtered['Cluster'] = kmeans.fit_predict(scaled_data)

    pca = PCA(n_components=2)
    pca_coords = pca.fit_transform(scaled_data)
    df_filtered['PCA1'] = pca_coords[:, 0]
    df_filtered['PCA2'] = pca_coords[:, 1]

    # --- Inspect cluster means so names can be assigned correctly ---
    print("\nCluster mean stats (smoothed, for naming):")
    inspect_cols = ['npxG_90_s', 'xAG_90_s', 'PrgP_90_s', 'PrgC_90_s', 'pos_score_s', 'finisher_ratio_s']
    print(df_filtered.groupby('Cluster')[inspect_cols].mean().round(3).to_string())
    print(f"\nCluster sizes: {dict(df_filtered['Cluster'].value_counts().sort_index())}")

    print("\nSample players per cluster:")
    for cid in range(6):
        sub = df_filtered[df_filtered['Cluster'] == cid][['Player', 'Pos', 'npxG_90', 'xAG_90', 'PrgP_90']].head(8)
        print(f"\nCluster {cid} (n={len(df_filtered[df_filtered['Cluster']==cid])}):")
        print(sub.to_string(index=False).encode('ascii', 'replace').decode('ascii'))

    cluster_names = {
        0: "Workhorses (DM/Fullbacks)",
        1: "Pass Masters",
        2: "Goal Threats",
        3: "Traditional Defenders",
        4: "Box Strikers",
        5: "Attacking Wingers",
        6: "Elite Creators",
    }
    df_filtered['Perfil_do_Jogador'] = df_filtered['Cluster'].map(cluster_names)

    # Percentiles for radar chart display — still using xG_90 (familiar metric)
    display_features = ['Gls_90', 'Ast_90', 'xG_90', 'xAG_90', 'PrgC_90', 'PrgP_90', 'PrgR_90']
    for feat in display_features:
        mean = df_filtered[feat].mean()
        smoothed = (df_filtered[feat] * df_filtered['Min'] + mean * C) / (df_filtered['Min'] + C)
        df_filtered[feat + '_percentile'] = smoothed.apply(
            lambda x: stats.percentileofscore(smoothed, x)
        )

    export_cols = (
        ['Player', 'Nation', 'Pos', 'Age', 'Team', 'Min',
         'Cluster', 'Perfil_do_Jogador', 'PCA1', 'PCA2']
        + [f + '_percentile' for f in display_features]
        + display_features
    )

    output_path = os.path.join(
        base_dir, 'football-app', 'public', 'data.json'
    )
    df_filtered[export_cols].to_json(output_path, orient='records', force_ascii=False)
    print(f"\nSaved {len(df_filtered)} players to {output_path}")

if __name__ == "__main__":
    process_data()
