using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using System;

public class LectorApiAR : MonoBehaviour
{
    [Header("Conexiones Principales")]
    public ControladorInfo controladorInfo;
    public GestorAnaliticas analiticas;

    [Header("Configuración de API")]
    [Tooltip("La URL base de tu backend Node.js (Asegúrate de cambiarla al servidor de producción)")]
    public string apiUrl = "https://yalotengo.onrender.com/microscopicos/public/";

    private GameObject modeloCargadoEnEscena;
    private string ultimoIdCargado = "";
    
    [Header("Configuración de Visualización")]
    [Tooltip("Multiplicador de tamaño. Si el modelo es gigante (Meshy), usa 8. Si es pequeño, usa 1.")]
    public float escalaInicial = 8f;

    [Serializable]
    public class Traduccion
    {
        public string language_code;
        public string name;
        public string descripcion;
    }

    [Serializable]
    public class ModeloResponse
    {
        public string nombre;
        public string taxonomia;
        public string descripcion;
        public string url_modelo;
        public Traduccion[] traducciones;
    }

    public void BuscarDatosEnLaNube(string idAnimal, Transform padreAR)
    {
        // Si ya estamos mostrando este animal, no hacemos nada (Evita recargas infinitas)
        if (modeloCargadoEnEscena != null && ultimoIdCargado == idAnimal) return;

        ultimoIdCargado = idAnimal;
        
        if (controladorInfo != null)
        {
            controladorInfo.txtNombre.text = "...";
            controladorInfo.txtTaxonomia.text = "...";
            controladorInfo.txtDescripcion.text = "...";
        }

        StartCoroutine(SolicitarDatosAPI(idAnimal, padreAR));
    }

    private IEnumerator SolicitarDatosAPI(string idAnimal, Transform padreAR)
    {
        // Usamos System.Uri.EscapeDataString para que los espacios sean "%20" y Express los lea sin problemas.
        string requestUrl = apiUrl + System.Uri.EscapeDataString(idAnimal.Trim());
        
        using (UnityWebRequest www = UnityWebRequest.Get(requestUrl))
        {
            yield return www.SendWebRequest();

            if (www.result != UnityWebRequest.Result.Success)
            {
                if (controladorInfo != null) controladorInfo.txtNombre.text = "Error de conexión o modelo no existe";
                Debug.LogError("Error al conectar con la API: " + www.error + " | URL: " + requestUrl);
            }
            else
            {
                string jsonResponse = www.downloadHandler.text;
                ModeloResponse datos = null;

                try
                {
                    datos = JsonUtility.FromJson<ModeloResponse>(jsonResponse);
                }
                catch (Exception e)
                {
                    Debug.LogError("Error parseando el JSON de la API: " + e.Message);
                }

                if (datos != null)
                {
                    if (controladorInfo != null)
                    {
                        controladorInfo.MostrarDatosFirebase(datos, null);
                    }

                    if (analiticas != null) analiticas.ReportarModeloVisto(datos.nombre);

                    if (!string.IsNullOrEmpty(datos.url_modelo))
                    {
                        StartCoroutine(DescargarYConstruirModelo(datos.url_modelo, padreAR));
                    }
                }
            }
        }
    }

    private IEnumerator DescargarYConstruirModelo(string url, Transform padre)
    {
        Debug.Log("Intentando descargar modelo desde: " + url);

        using (UnityWebRequest www = UnityWebRequest.Get(url))
        {
            yield return www.SendWebRequest();

            if (www.result == UnityWebRequest.Result.Success)
            {
                AssetBundle bundle = AssetBundle.LoadFromMemory(www.downloadHandler.data);
                if (bundle != null)
                {
                    string[] assets = bundle.GetAllAssetNames();
                    GameObject prefab = bundle.LoadAsset<GameObject>(assets[0]);
                    
                    if (modeloCargadoEnEscena != null) Destroy(modeloCargadoEnEscena);

                    // LO EMPARENTAMOS A LA CÁMARA PARA QUE SE QUEDE PEGADO A LA PANTALLA
                    modeloCargadoEnEscena = Instantiate(prefab, Camera.main.transform);
                    
                    // REINICIO DE POSICIÓN: 50cm al frente de la cámara y 5cm hacia ARRIBA
                    modeloCargadoEnEscena.transform.localPosition = new Vector3(0f, 0.05f, 0.5f);
                    // ROTACIÓN INICIAL: Mirando a la cámara (180) con perfil a la izquierda (-20) = 160
                    modeloCargadoEnEscena.transform.localEulerAngles = new Vector3(250f, 0f, 200f);
                    
                    // --- ESCALA AUTOMÁTICA (NORMALIZACIÓN) ---
                    // Ya no escalamos a un número fijo, sino que el método Normalizar lo hará abajo
                    modeloCargadoEnEscena.transform.localScale = Vector3.one; 

                    // 1. Verificamos si ya tiene un Collider, si no, le ponemos uno para que tenga "cuerpo"
                    if (modeloCargadoEnEscena.GetComponent<Collider>() == null)
                    {
                        modeloCargadoEnEscena.AddComponent<BoxCollider>();
                    }
                    
                    RotarConDedo scriptTacto = modeloCargadoEnEscena.AddComponent<RotarConDedo>();
                    scriptTacto.modeloAGirar = modeloCargadoEnEscena.transform;

                    NormalizarTamaño(modeloCargadoEnEscena);

                    controladorInfo.MostrarDatosFirebase(null, modeloCargadoEnEscena);
                    
                    bundle.Unload(false);
                    Debug.Log("¡Modelo normalizado y cargado con éxito!");
                }
                else
                {
                    Debug.LogError("El archivo descargado no es un AssetBundle válido.");
                }
            }
            else
            {
                Debug.LogError("Error al descargar el modelo: " + www.error);
            }
        }
    }

    private void NormalizarTamaño(GameObject objeto)
    {
        // 1. Obtenemos todos los MeshRenderers del modelo (hijos incluidos)
        MeshRenderer[] renderers = objeto.GetComponentsInChildren<MeshRenderer>();
        if (renderers.Length == 0) return;

        // 2. Calculamos el "cubo" (Bounds) que encierra a todo el bicho
        Bounds totalBounds = renderers[0].bounds;
        foreach (MeshRenderer r in renderers)
        {
            totalBounds.Encapsulate(r.bounds);
        }

        // 3. Obtenemos la medida más larga (ya sea alto, ancho o largo)
        float tamañoActual = Mathf.Max(totalBounds.size.x, totalBounds.size.y, totalBounds.size.z);
        
        if (tamañoActual > 0)
        {
            // 4. Calculamos cuánto hay que multiplicar para que mida exactamente lo que dice 'escalaInicial'
            // Si escalaInicial es 0.15f, el bicho medirá 15cm sin importar qué tan grande venía.
            float factorEscala = escalaInicial / tamañoActual;
            objeto.transform.localScale *= factorEscala;
        }
    }
}