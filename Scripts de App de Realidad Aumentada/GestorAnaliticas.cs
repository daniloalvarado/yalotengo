using UnityEngine;
using Unity.Services.Core;
using Unity.Services.Analytics;

public class GestorAnaliticas : MonoBehaviour
{
    // Esto enciende el motor de analíticas silenciosamente cuando se abre la app
    async void Start()
    {
        try
        {
            await UnityServices.InitializeAsync();
            AnalyticsService.Instance.StartDataCollection();
            Debug.Log("¡Radar de Unity Analytics encendido y conectado!");
        }
        catch (System.Exception e)
        {
            Debug.Log("Error al conectar analíticas: " + e.Message);
        }
    }

    // Esta es la función que llamaremos cuando escaneen un animal
    public void ReportarModeloVisto(string nombreDelAnimal)
    {
        // Nueva forma de empaquetar datos en el Unity moderno
        CustomEvent evento = new CustomEvent("Modelo_Escaneado")
        {
            { "Nombre_Animal", nombreDelAnimal }
        };

        // Lo disparamos a tu tablero en internet
        AnalyticsService.Instance.RecordEvent(evento);
        
        // Forzamos el envío
        AnalyticsService.Instance.Flush(); 
        
        Debug.Log("El usuario vio al " + nombreDelAnimal);
    }
}