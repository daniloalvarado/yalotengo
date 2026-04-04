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
    public string apiTargetsUrl = "http://108.181.191.82.sslip.io:8070/api/microscopicos/public/targets";

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
            www.certificateHandler = new BypassCertificate();
            www.timeout = 30; // Aumentado para tolerar el arranque en frío de Render
            yield return www.SendWebRequest();
            
            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError("Error al conectar con la API de Targets: " + www.error);
                yield break;
            }

            if (string.IsNullOrEmpty(www.downloadHandler.text))
            {
                Debug.LogWarning("La API devolvió un JSON vacío. Reintentando...");
                yield break;
            }

            string jsonReponse = "{\"array\":" + www.downloadHandler.text + "}";
            TargetList targets = JsonUtility.FromJson<TargetList>(jsonReponse);

            if (targets != null && targets.array != null)
            {
                Debug.Log($"Vuforia: {targets.array.Length} marcadores encontrados. Iniciando descarga ESCALONADA (Alta velocidad)...");
                StartCoroutine(ProcesarDescargasEscalonadas(targets.array));
            }
        }
    }

    private IEnumerator ProcesarDescargasEscalonadas(TargetResponse[] listado)
    {
        // 1. PRIORIDAD: Descargar todos los marcadores para que la cámara pueda escanear pronto
        foreach (var t in listado)
        {
            // Lanzamos en paralelo pero con 0.4s de diferencia para no saturar el servidor
            StartCoroutine(DescargarYAgnadirMarcadorVuforia(t.url, t.name));
            yield return new WaitForSeconds(0.4f); 
        }

        Debug.Log("Vuforia: Marcadores en proceso. Iniciando PRECARGA de modelos 3D con gap de seguridad...");

        // 2. SECUNDARIO: Precargar los modelos 3D (AssetBundles) para cuando el usuario escanee
        foreach (var t in listado)
        {
            if (lectorApi != null && !string.IsNullOrEmpty(t.url_modelo))
            {
                lectorApi.SolicitarPrecarga(t.url_modelo);
                // Esperamos 1 segundo entre modelos porque son pesados
                yield return new WaitForSeconds(1.0f);
            }
        }
        
        Debug.Log("¡Optimización de red finalizada!");
    }
    private IEnumerator DescargarYAgnadirMarcadorVuforia(string url, string targetName)
    {
        int intentos = 3;
        bool exito = false;

        while (intentos > 0 && !exito)
        {
            using (UnityWebRequest www = UnityWebRequestTexture.GetTexture(url))
            {
                // Bypass SSL for this specific request if it fails with SSL errors
                www.certificateHandler = new BypassCertificate();
                www.timeout = 30; // Aumentado para estabilidad
                yield return www.SendWebRequest();

                if (www.result == UnityWebRequest.Result.Success)
                {
                    Texture2D textura = DownloadHandlerTexture.GetContent(www);
                    if (textura != null)
                    {
                        // Cálculo de peso para la consola
                        totalBytesCargados += www.downloadedBytes;
                        float kb = www.downloadedBytes / 1024f;
                        float totalMb = totalBytesCargados / (1024f * 1024f);
                        Debug.Log($"<color=cyan>[Marcador]</color> '{targetName}' cargado ({kb:F2} KB). Total RAM: {totalMb:F2} MB");

                        // --- MAGIA DE VUFORIA ---
                        var mTarget = VuforiaBehaviour.Instance.ObserverFactory.CreateImageTarget(textura, 0.1f, targetName);

                        if (mTarget != null)
                        {
                            mTarget.OnTargetStatusChanged += (observer, status) => 
                            {
                                if (status.Status == Status.TRACKED || status.Status == Status.EXTENDED_TRACKED)
                                {
                                    if (!marcadoresVisibles.ContainsKey(targetName))
                                        marcadoresVisibles.Add(targetName, mTarget.transform);
                                }
                                else
                                {
                                    if (marcadoresVisibles.ContainsKey(targetName))
                                        marcadoresVisibles.Remove(targetName);
                                    
                                    if (idTargetActivo == targetName)
                                        idTargetActivo = "";
                                }
                            };
                            Debug.Log("Vuforia: Marcador inyectado con éxito: " + targetName);
                        }
                        exito = true;
                    }
                }
                else
                {
                    intentos--;
                    if (intentos > 0)
                    {
                        Debug.LogWarning($"Reintentando marcador {targetName} ({intentos} intentos restantes)...");
                        yield return new WaitForSeconds(1.5f);
                    }
                    else
                    {
                        Debug.LogError($"Fallo DEFINITIVO al descargar marcador {targetName}: {www.error}");
                    }
                }
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