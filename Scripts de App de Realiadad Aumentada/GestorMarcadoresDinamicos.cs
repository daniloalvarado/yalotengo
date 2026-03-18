using UnityEngine;
using Vuforia;
using UnityEngine.Networking;
using System.Collections;
using System;

/// <summary>
/// Este script descarga imágenes QR de tu backend yalotengo y las inyecta 
/// en el motor de Vuforia en tiempo real como marcadores rastreables.
/// </summary>
public class GestorMarcadoresDinamicos : MonoBehaviour
{
    [Header("Configuración de API")]
    [Tooltip("URL base para obtener la lista de marcadores")]
    public string apiTargetsUrl = "https://yalotengo.onrender.com/microscopicos/public/targets";

    [Serializable]
    private class TargetResponse
    {
        public string name; // ID del animal en la base de datos
        public string url;  // URL de la imagen del marcador (JPG/PNG)
    }

    [Serializable]
    private class TargetList
    {
        public TargetResponse[] array;
    }

    void Start()
    {
        // Esperamos a que Vuforia esté inicializado antes de inyectar
        VuforiaApplication.Instance.OnVuforiaStarted += OnVuforiaStarted;
    }

    private void OnVuforiaStarted()
    {
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
                Debug.Log($"Vuforia: Se encontraron {targets.array.Length} marcadores dinámicos.");
                foreach (var t in targets.array)
                {
                    StartCoroutine(DescargarYAgnadirMarcadorVuforia(t.url, t.name));
                }
            }
        }
    }

    private IEnumerator DescargarYAgnadirMarcadorVuforia(string imageUrl, string nombreMarcador)
    {
        string safeUrl = imageUrl.Replace(" ", "%20");
        
        using (UnityWebRequest www = UnityWebRequestTexture.GetTexture(safeUrl))
        {
            yield return www.SendWebRequest();

            if (www.result == UnityWebRequest.Result.Success)
            {
                Texture2D texture = DownloadHandlerTexture.GetContent(www);
                
                // --- MAGIA DE VUFORIA ---
                // Creamos un observador de imagen en tiempo de ejecución de 0.1 metros de ancho
                var mTarget = VuforiaBehaviour.Instance.ObserverFactory.CreateImageTarget(
                    texture, 0.1f, nombreMarcador);

                if (mTarget != null)
                {
                    // Le añadimos un componente de evento para detectar cuando la cámara lo vea
                    mTarget.OnTargetStatusChanged += (observer, status) => 
                    {
                        if (status.Status == Status.TRACKED || status.Status == Status.EXTENDED_TRACKED)
                        {
                            Debug.Log("Vuforia detectó marcador dinámico: " + nombreMarcador);
                            AccionAlDetectar(nombreMarcador, mTarget.transform);
                        }
                    };
                    Debug.Log("Vuforia: Marcador inyectado en RAM: " + nombreMarcador);
                }
            }
            else
            {
                Debug.LogError($"Fallo al descargar marcador {nombreMarcador}: {www.error}");
            }
        }
    }

    private void AccionAlDetectar(string idAnimal, Transform transformMarcador)
    {
        LectorApiAR lector = FindObjectOfType<LectorApiAR>();
        if (lector != null)
        {
            // Disparamos la descarga del modelo 3D
            lector.BuscarDatosEnLaNube(idAnimal, transformMarcador);
        }
    }
}