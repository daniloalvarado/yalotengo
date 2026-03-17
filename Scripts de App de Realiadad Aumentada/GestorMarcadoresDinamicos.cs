using UnityEngine;
using UnityEngine.XR.ARFoundation;
using UnityEngine.XR.ARSubsystems;
using UnityEngine.Networking;
using System.Collections;
using System.Collections.Generic;
using System;

[RequireComponent(typeof(ARTrackedImageManager))]
public class GestorMarcadoresDinamicos : MonoBehaviour
{
    [Header("Configuración de API")]
    [Tooltip("La URL base para obtener la lista de marcadores (ej: http://localhost:3000/microscopicos/public/targets o en producción https://tu-sitio.com/microscopicos/public/targets)")]
    public string apiTargetsUrl = "http://localhost:3000/microscopicos/public/targets";

    private ARTrackedImageManager trackedImageManager;

    [Serializable]
    private class TargetResponse
    {
        public string name; // Debe ser el scientificName o id usado en AnimalAR.cs
        public string url;
    }

    [Serializable]
    private class TargetList
    {
        public TargetResponse[] array;
    }

    void Start()
    {
        trackedImageManager = GetComponent<ARTrackedImageManager>();
        
        // Evitamos que inicie con librerías vacías si se requiere
        if (trackedImageManager.referenceLibrary == null)
        {
            trackedImageManager.referenceLibrary = trackedImageManager.CreateRuntimeLibrary();
        }

        StartCoroutine(ObtenerMarcadoresDesdeNube());
    }

    private IEnumerator ObtenerMarcadoresDesdeNube()
    {
        Debug.Log("Obteniendo lista de marcadores de: " + apiTargetsUrl);
        using (UnityWebRequest www = UnityWebRequest.Get(apiTargetsUrl))
        {
            yield return www.SendWebRequest();

            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError("Error al conectar con la API de Targets: " + www.error);
                yield break;
            }

            string jsonReponse = "{\"array\":" + www.downloadHandler.text + "}";
            TargetList targets = JsonUtility.FromJson<TargetList>(jsonReponse);

            if (targets != null && targets.array != null)
            {
                Debug.Log($"Se encontraron {targets.array.Length} marcadores dinámicos.");
                foreach (var t in targets.array)
                {
                    StartCoroutine(DescargarYAgnadirMarcador(t.url, t.name));
                }
            }
        }
    }

    private IEnumerator DescargarYAgnadirMarcador(string imageUrl, string nombreMarcador)
    {
        // Reemplazar espacios por %20 para URLs correctas
        string safeUrl = imageUrl.Replace(" ", "%20");
        
        using (UnityWebRequest www = UnityWebRequestTexture.GetTexture(safeUrl))
        {
            yield return www.SendWebRequest();

            if (www.result == UnityWebRequest.Result.Success)
            {
                Texture2D texture = DownloadHandlerTexture.GetContent(www);
                
                // Asegurarse de que la textura sea leíble (el backend MinIO devuelve un JPG o PNG estandar)
                // Se intentará agregar a la librería Mutable
                if (trackedImageManager.referenceLibrary is MutableRuntimeReferenceImageLibrary mutableLibrary)
                {
                    // Tamaño sugerido de 0.1 metros (10 centímetros) físico para calcular escala
                    try 
                    {
                        mutableLibrary.ScheduleAddImageWithValidationJob(texture, nombreMarcador, 0.1f);
                        Debug.Log("Marcador inyectado en RAM exitosamente: " + nombreMarcador);
                    } 
                    catch (Exception e) 
                    {
                        Debug.LogError("Error inyectando el marcador: " + e.Message);
                    }
                }
                else
                {
                    Debug.LogError("Error: ARTrackedImageManager no soporta librerías mutables en esta plataforma o no se ha inicializado correctamente.");
                }
            }
            else
            {
                Debug.LogError($"Fallo al descargar imagen marcador {nombreMarcador} de URL {safeUrl}: {www.error}");
            }
        }
    }
}
