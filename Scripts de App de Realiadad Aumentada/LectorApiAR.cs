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
    public string apiUrl = "http://108.181.191.82.sslip.io:8070/api/microscopicos/public/";

    [Header("Elementos Visuales")]
    public GameObject objetoLoading;
    public ControladorIdioma controladorIdioma; // Para los textos traducidos

    private GameObject modeloCargadoEnEscena;
    private string ultimoIdCargado = "";
    private ulong totalBytesModelos = 0; // Para ver cuánto pesan los 3D en total
    
    [Header("Configuración de Visualización")]
    public float escalaInicial = 0.3f; // Ajustado a tus modelos

    void Start()
    {
        // --- NUEVO: ASEGURAR QUE EL LOADING EMPIEZA OCULTO ---
        if (objetoLoading != null) objetoLoading.SetActive(false);

        // Añadimos el script de giro automático al objeto de carga
        if (objetoLoading != null && objetoLoading.GetComponent<RotarLento>() == null)
        {
            objetoLoading.AddComponent<RotarLento>();
        }
    }

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
        public string nombre_cientifico;
        public string taxonomia;
        public string descripcion;
        public string url_modelo;
        public Traduccion[] traducciones;
    }

    public void BuscarDatosEnLaNube(string idAnimal, Transform padreAR)
    {
        // Si ya estamos mostrando este animal, no hacemos nada (Evita recargas infinitas)
        if (modeloCargadoEnEscena != null && ultimoIdCargado == idAnimal) return;

        // --- NUEVO: MOSTRAR LOADING ---
        if (objetoLoading != null) objetoLoading.SetActive(true);

        ultimoIdCargado = idAnimal;
        
        // --- NUEVO: DESTRUIR INMEDIATAMENTE EL MODELO VIEJO PARA DAR FEEDBACK ---
        if (modeloCargadoEnEscena != null)
        {
            Destroy(modeloCargadoEnEscena);
            modeloCargadoEnEscena = null;
        }

        if (controladorInfo != null)
        {
            if (controladorIdioma != null)
            {
                controladorInfo.txtNombre.text = controladorIdioma.msgCargandoTitulo;
                controladorInfo.txtTaxonomia.text = controladorIdioma.msgCargandoTaxo;
                controladorInfo.txtDescripcion.text = controladorIdioma.msgCargandoDesc;
            }
            else
            {
                controladorInfo.txtNombre.text = "Identificando...";
                controladorInfo.txtTaxonomia.text = "Sincronizando modelo 3D...";
                controladorInfo.txtDescripcion.text = "Por favor, mantén la cámara estable...";
            }
        }

        StartCoroutine(SolicitarDatosAPI(idAnimal, padreAR));
    }

    private IEnumerator SolicitarDatosAPI(string idAnimal, Transform padreAR)
    {
        // Usamos System.Uri.EscapeDataString para que los espacios sean "%20" y Express los lea sin problemas.
        string requestUrl = apiUrl + System.Uri.EscapeDataString(idAnimal.Trim());
        
        // --- NUEVO: VALIDACIÓN DE INTERNET ---
        if (Application.internetReachability == NetworkReachability.NotReachable)
        {
            ControladorIdioma ci = FindObjectOfType<ControladorIdioma>();
            string title = (ci != null) ? ci.msgErrNoInternet : "Sin conexión a Internet";
            string detail = (ci != null) ? ci.msgErrDetalleRed : "Activa tu Wi-Fi o Datos";
            
            if (controladorInfo != null) controladorInfo.MostrarError(title, detail);
            if (objetoLoading != null) objetoLoading.SetActive(false);
            yield break;
        }

        using (UnityWebRequest www = UnityWebRequest.Get(requestUrl))
        {
            www.certificateHandler = new BypassCertificate();
            www.timeout = 30;
            yield return www.SendWebRequest();

            if (www.result != UnityWebRequest.Result.Success)
            {
                if (controladorInfo != null) {
                    ControladorIdioma ci = FindObjectOfType<ControladorIdioma>();
                    if (www.result == UnityWebRequest.Result.ConnectionError)
                    {
                        string title = (ci != null) ? ci.msgErrNoInternet : "Sin conexión a Internet";
                        string detail = (ci != null) ? ci.msgErrDetalleRed : "Error de red local";
                        controladorInfo.MostrarError(title, detail);
                    }
                    else
                    {
                        string title = (ci != null) ? ci.msgErrServidor : "Error de servidor";
                        string detail = (ci != null) ? ci.msgErrDetalleServidor : "Reintenta más tarde";
                        controladorInfo.MostrarError(title, detail);
                    }
                }
                Debug.LogError("Error al conectar con la API: " + www.error + " | URL: " + requestUrl);
                if (objetoLoading != null) objetoLoading.SetActive(false);
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
                    else
                    {
                        if (objetoLoading != null) objetoLoading.SetActive(false);
                    }
                }
                else
                {
                    if (objetoLoading != null) objetoLoading.SetActive(false);
                }
            }
        }
    }

    private IEnumerator DescargarYConstruirModelo(string url, Transform padre)
    {
        Debug.Log("Intentando descargar (con CACHÉ) modelo desde: " + url);

        // Usamos GetAssetBundle para que Unity guarde los archivos en el disco del celular
        // El parámetro 0 (CRC) y Hash128 por defecto permiten caché persistente.
        using (UnityWebRequest www = UnityWebRequestAssetBundle.GetAssetBundle(url))
        {
            www.certificateHandler = new BypassCertificate();
            www.timeout = 30; // Tolerancia para internet inestable
            yield return www.SendWebRequest();

            if (www.result == UnityWebRequest.Result.Success)
            {
                totalBytesModelos += www.downloadedBytes;
                float kb = www.downloadedBytes / 1024f;
                float totalMb = totalBytesModelos / (1024f * 1024f);
                Debug.Log($"<color=orange>[Modelo 3D]</color> descargado ({kb:F2} KB). Acumulado en RAM: {totalMb:F2} MB");

                // --- OPTIMIZACIÓN: GetContent es mucho más rápido que LoadFromMemory ---
                AssetBundle bundle = DownloadHandlerAssetBundle.GetContent(www);
                if (bundle != null)
                {
                    // --- NUEVO: OCULTAR LOADING YA QUE LLEGÓ EL MODELO ---
                    if (objetoLoading != null) objetoLoading.SetActive(false);

                    string[] assets = bundle.GetAllAssetNames();
                    GameObject prefab = bundle.LoadAsset<GameObject>(assets[0]);
                    
                    if (modeloCargadoEnEscena != null) Destroy(modeloCargadoEnEscena);

                    // LO EMPARENTAMOS A LA CÁMARA PARA QUE SE QUEDE PEGADO A LA PANTALLA
                    modeloCargadoEnEscena = Instantiate(prefab, Camera.main.transform);
                    
                    // REINICIO DE POSICIÓN: 50cm al frente de la cámara y 5cm hacia ARRIBA
                    modeloCargadoEnEscena.transform.localPosition = new Vector3(0f, 0.05f, 0.5f);
                    
                    // ROTACIÓN INICIAL: Mirando a la cámara (180) con perfil a la izquierda (-20) = 160
                    // Nota: Los valores 250f y 200f son los que mejor funcionan para tus modelos de Meshy
                    modeloCargadoEnEscena.transform.localEulerAngles = new Vector3(250f, 0f, 200f);
                    
                    // ESCALA INICIAL: Fuerza a ser 1 antes de normalizar
                    modeloCargadoEnEscena.transform.localScale = Vector3.one;

                    // 1. Verificamos si ya tiene un Collider, si no, le ponemos uno para que tenga "cuerpo"
                    if (modeloCargadoEnEscena.GetComponent<Collider>() == null)
                    {
                        modeloCargadoEnEscena.AddComponent<BoxCollider>();
                    }
                    
                    RotarConDedo scriptTacto = modeloCargadoEnEscena.AddComponent<RotarConDedo>();
                    scriptTacto.modeloAGirar = modeloCargadoEnEscena.transform;

                    NormalizarTamaño(modeloCargadoEnEscena);

                    // --- NUEVISSIMO: OCULTAR LOADING AL FINAL DE TODO ---
                    if (objetoLoading != null) objetoLoading.SetActive(false);

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
                if (objetoLoading != null) objetoLoading.SetActive(false);
                if (controladorInfo != null) {
                    ControladorIdioma ci = FindObjectOfType<ControladorIdioma>();
                    if (www.result == UnityWebRequest.Result.ConnectionError)
                    {
                        string title = (ci != null) ? ci.msgErrNoInternet : "Sin conexión a Internet";
                        string detail = (ci != null) ? ci.msgErrDetalleRed : "No se bajó el modelo";
                        controladorInfo.MostrarError(title, detail);
                    }
                    else
                    {
                        string title = (ci != null) ? ci.msgErrServidor : "Error de servidor";
                        string detail = (ci != null) ? ci.msgErrDetalleServidor : "Fallo al bajar 3D";
                        controladorInfo.MostrarError(title, detail);
                    }
                }
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

    public bool EstaMostrandoModelo()
    {
        return modeloCargadoEnEscena != null;
    }

    // --- NUEVO: SISTEMA DE PRECARGA (PARA QUE EL ESCANEO SEA INSTANTÁNEO) ---
    public void SolicitarPrecarga(string url)
    {
        if (string.IsNullOrEmpty(url)) return;
        StartCoroutine(PrecargarModeloEnCache(url));
    }

    private IEnumerator PrecargarModeloEnCache(string url)
    {
        // Al usar GetAssetBundle y dejar que termine, Unity lo guarda en disco automáticamente
        using (UnityWebRequest www = UnityWebRequestAssetBundle.GetAssetBundle(url))
        {
            www.certificateHandler = new BypassCertificate();
            www.timeout = 30; // Tiempo para que el servidor responda
            yield return www.SendWebRequest();
            if (www.result == UnityWebRequest.Result.Success)
            {
                // Solo lo descargamos, no lo abrimos ni lo usamos. Ya queda en el Caché del celular.
                AssetBundle bundle = DownloadHandlerAssetBundle.GetContent(www);
                if (bundle != null) bundle.Unload(true); // Liberamos RAM pero queda en DISCO
            }
        }
    }
}