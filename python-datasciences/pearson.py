import pandas as pd
import seaborn as sb
import matplotlib.pyplot as plt

if __name__=='__main__':
    df_meteo = pd.read_csv('dataMeteo.csv',sep = ';')

    df_rncp = pd.read_csv('RNCP_decembre.csv')
    df_rncp['day of mouth'] = ""
    print(df_meteo.head(5))

    for index, row in df_rncp.iterrows():
        df_rncp.at[index, 'day of mouth'] = pd.Timestamp(row['journey_start_datetime']).day





    days = df_rncp.groupby(['day of mouth'])['day of mouth'].count().tolist()
    df_meteo["nbCovoit"]=days
    print(df_meteo.head(5))

    pearsoncorr = df_meteo.corr(method='pearson')
    print(pearsoncorr)
    sb.heatmap(pearsoncorr,
               xticklabels=pearsoncorr.columns,
               yticklabels=pearsoncorr.columns,
               cmap='RdBu_r',
               annot=True,
               linewidth=0.5)
    plt.show()
