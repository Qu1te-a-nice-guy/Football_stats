import pandas as pd
import json
import os
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
import scipy.stats as stats

def process_data():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, 'premier-player-23-24.csv')
    df = pd.read_csv(csv_path)

    min_minutes_threshold = 500
    df_filtered = df[df['Min'] >= min_minutes_threshold].copy()
    df_filtered = df_filtered[df_filtered['Pos'] != 'GK'].copy()
    df_filtered = df_filtered.reset_index(drop=True)

    df_filtered['PrgC_90'] = df_filtered['PrgC'] / df_filtered['90s']
    df_filtered['PrgP_90'] = df_filtered['PrgP'] / df_filtered['90s']
    df_filtered['PrgR_90'] = df_filtered['PrgR'] / df_filtered['90s']

    features = [
        'Gls_90', 'Ast_90',       
        'xG_90', 'xAG_90',        
        'PrgC_90', 'PrgP_90', 'PrgR_90' 
    ]
    
    df_features = df_filtered[features].copy()
    
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(df_features)
    df_scaled = pd.DataFrame(scaled_data, columns=features)
    
    k_final = 6
    kmeans_final = KMeans(n_clusters=k_final, random_state=42, n_init=10)
    cluster_labels = kmeans_final.fit_predict(df_scaled)
    df_filtered['Cluster'] = cluster_labels
    
    pca = PCA(n_components=2)
    componentes_principais = pca.fit_transform(df_scaled)
    df_filtered['PCA1'] = componentes_principais[:, 0]
    df_filtered['PCA2'] = componentes_principais[:, 1]
    
    nomes_clusters = {
        0: "Construtores (DC/MD)",
        1: "Criativos de Elite (Extremos/MOC)",
        2: "Motores (Box-to-Box/Laterais Ofensivos)",
        3: "Finalizadores Puros (PL)",
        4: "Defesas Tradicionais",
        5: "Mestres do Passe (Metrónomos)"
    }
    df_filtered['Perfil_do_Jogador'] = df_filtered['Cluster'].map(nomes_clusters)

    # Calculate percentiles relative to all outfield players for radar chart (spider map)
    # 0-100 scale for visual comparison
    for feat in features:
        df_filtered[feat + '_percentile'] = df_filtered[feat].apply(
            lambda x: stats.percentileofscore(df_filtered[feat], x)
        )

    # Export specific columns needed for the frontend
    export_columns = [
        'Player', 'Nation', 'Pos', 'Age', 'Team', 'Min',
        'Cluster', 'Perfil_do_Jogador', 'PCA1', 'PCA2'
    ] + [feat + '_percentile' for feat in features] + features

    export_df = df_filtered[export_columns]
    
    output_path = os.path.join(base_dir, 'players_processed.json')
    export_df.to_json(output_path, orient='records', force_ascii=False)
    print(f"Successfully processed {len(export_df)} players and saved to {output_path}")

if __name__ == "__main__":
    process_data()
