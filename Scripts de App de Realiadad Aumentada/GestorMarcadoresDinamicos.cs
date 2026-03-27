using UnityEngine;
using Vuforia;
using UnityEngine.Networking;
using System.Collections;
using System;
using System.Collections.Generic;

/// <summary>
/// Este script descarga imágenes QR de tu backend yalotengo y las inyecta 
/// en el motor de Vuforia en tiempo real como marcadores rastreables.
/// </summary>
public class GestorMarcadoresDinamicos : MonoBehaviour
{
    [Header("Interfaz de Usuario")]
    [Tooltip("Arrastra aquí un UI Image (como una mira central o marco). Aparecerá cuando no haya marcadores visibles.")]
    public GameObject reticulaApuntador;

    [Tooltip("URL base para obtener la lista de marcadores")]
    public string apiTargetsUrl = "https://yalotengo.onrender.com/microscopicos/public/targets";

    [Header("Ajustes de Puntería")]
    [Tooltip("Distancia máxima en píxeles para que se active el marcador. Ajusta esto según el tamaño de tu OverlayQR.")]
    public float distanciaUmbral = 200f; // Ajustado a 200px por defecto

    [Serializable]
    private class TargetResponse
    {
        public string name; // ID del animal en la base de datos
        public string url;  // URL de la imagen del marcador (JPG/PNG)
        public string url_modelo; // URL del AssetBundle 3D (para precarga)
    }

    [Serializable]
    private class TargetList
    {
        public TargetResponse[] array;
    }

    // --- NUEVO: SISTEMA DE APUNTADO CENTRADO ---
    private Dictionary<string, Transform> marcadoresVisibles = new Dictionary<string, Transform>();
    private string idTargetActivo = "";
    private ulong totalBytesCargados = 0; 
    private LectorApiAR lectorApi; // Caché para el comunicador de modelos

    void Start()
    {
        lectorApi = FindObjectOfType<LectorApiAR>();
        
        // Esperamos a que Vuforia esté inicializado antes de inyectar
        VuforiaApplication.Instance.OnVuforiaStarted += OnVuforiaStarted;
    }

    void OnDestroy()
    {
        // SIEMPRE desuscribirse para evitar errores de "objeto destruido" al cambiar de escena
        if (VuforiaApplication.Instance != null)
        {
            VuforiaApplication.Instance.OnVuforiaStarted -= OnVuforiaStarted;
        }
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
                Debug.Log($"Vuforia: Se encontraron {targets.array.Length} marcadores. Iniciando precarga de modelos...");
                foreach (var t in targets.array)
                {
                    StartCoroutine(DescargarYAgnadirMarcadorVuforia(t.url, t.name));
                    
                    // --- NUEVO: PRECARGAMOS EL MODELO 3D EN EL CACHÉ DEL CELULAR ---
                    if (lectorApi != null && !string.IsNullOrEmpty(t.url_modelo))
                    {
                        lectorApi.SolicitarPrecarga(t.url_modelo);
                    }
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
                // Cálculo de peso para la consola
                totalBytesCargados += www.downloadedBytes;
                float kb = www.downloadedBytes / 1024f;
                float totalMb = totalBytesCargados / (1024f * 1024f);
                Debug.Log($"<color=cyan>[Marcador]</color> '{nombreMarcador}' cargado. Peso: {kb:F2} KB. Acumulado en RAM: {totalMb:F2} MB");

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
                            if (!marcadoresVisibles.ContainsKey(nombreMarcador))
                                marcadoresVisibles.Add(nombreMarcador, mTarget.transform);
                        }
                        else
                        {
                            if (marcadoresVisibles.ContainsKey(nombreMarcador))
                                marcadoresVisibles.Remove(nombreMarcador);
                            
                            // Opcional: Si perdemos de vista el objetivo actual, podemos "soltarlo" 
                            // para estar listos para apuntar a otro de inmediato.
                            if (idTargetActivo == nombreMarcador)
                                idTargetActivo = "";
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
        Debug.Log("Apuntando al objetivo principal: " + idAnimal);
        LectorApiAR lector = FindObjectOfType<LectorApiAR>();
        if (lector != null)
        {
            // Disparamos la descarga del modelo 3D
            lector.BuscarDatosEnLaNube(idAnimal, transformMarcador);
        }
    }

    void Update()
    {
        // Si hay al menos un marcador en pantalla, evaluamos cuál está más al centro.
        if (marcadoresVisibles.Count > 0)
        {
            if (reticulaApuntador != null) reticulaApuntador.SetActive(false);

            float minDistancia = float.MaxValue;
            string mejorObjetivo = "";
            Transform mejorTransform = null;

            // Novedad: Si asignaste la retícula, usamos SU posición exacta en la pantalla como el "centro de gravedad".
            // Si no la asignaste, calculamos un centro tirando un poco hacia arriba (65%) para esquivar el panel inferior.
            Vector2 centroPunteria;
            if (reticulaApuntador != null)
            {
                // En Canvas Overlay, la posición del transform UI coincide con sus coordenadas pixel screen.
                centroPunteria = reticulaApuntador.transform.position;
            }
            else
            {
                centroPunteria = new Vector2(Camera.main.pixelWidth / 2f, Camera.main.pixelHeight * 0.65f);
            }

            foreach (var kvp in marcadoresVisibles)
            {
                if (kvp.Value == null) continue;

                Vector3 posPantalla = Camera.main.WorldToScreenPoint(kvp.Value.position);
                
                // Ignorar si el marcador quedó detrás de la cámara físicamente
                if (posPantalla.z < 0) continue;

                float dist = Vector2.Distance(new Vector2(posPantalla.x, posPantalla.y), centroPunteria);
                if (dist < minDistancia)
                {
                    minDistancia = dist;
                    mejorObjetivo = kvp.Key;
                    mejorTransform = kvp.Value;
                }
            }

            // --- NUEVA LÓGICA: PERMITIR ESCANEAR OTRO AUNQUE HAYA UNO ACTIVO ---
            bool hayModeloHoy = (lectorApi != null && lectorApi.EstaMostrandoModelo());

            if (!string.IsNullOrEmpty(mejorObjetivo) && minDistancia < distanciaUmbral)
            {
                // Si estamos apuntando a un objetivo válido, ocultamos la mira
                if (reticulaApuntador != null) reticulaApuntador.SetActive(false);

                // Si es un animal DISTINTO al que ya tenemos, lo cargamos
                if (mejorObjetivo != idTargetActivo)
                {
                    idTargetActivo = mejorObjetivo;
                    AccionAlDetectar(mejorObjetivo, mejorTransform);
                }
            }
            else
            {
                // No estamos apuntando a nada en el centro
                idTargetActivo = "";
                
                // Mostramos la mira SOLO si no hay un animal ya cargado en pantalla
                if (reticulaApuntador != null) 
                    reticulaApuntador.SetActive(!hayModeloHoy);
            }
        }
        else
        {
            // No hay marcadores visibles para Vuforia
            idTargetActivo = "";
            bool hayModeloHoy = (lectorApi != null && lectorApi.EstaMostrandoModelo());
            if (reticulaApuntador != null) 
                reticulaApuntador.SetActive(!hayModeloHoy);
        }
    }
}