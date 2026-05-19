using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using System;
using System.Threading.Tasks;
using GLTFast;

public class LectorApiAR : MonoBehaviour
{
    [Serializable]
    public class UIIdiomaText { public string key; public string value; }
    [Serializable]
    public class UIIdioma { public string code; public string name; public UIIdiomaText[] textos; }
    [Serializable]
    public class UIDictResponse { public UIIdioma[] idiomas; }

    public static System.Collections.Generic.Dictionary<string, System.Collections.Generic.Dictionary<string, string>> DiccionarioUI = new System.Collections.Generic.Dictionary<string, System.Collections.Generic.Dictionary<string, string>>();
    public static System.Collections.Generic.List<UIIdioma> IdiomasDisponibles = new System.Collections.Generic.List<UIIdioma>();

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
        StartCoroutine(DescargarDiccionarioUI());
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
        public int id;
        public string nombre;
        public string nombre_cientifico;
        public string taxonomia;
        public string descripcion;
        public string url_modelo;
        public string fuente;
        public string tematica;
        public string qr_image_url;
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
            www.timeout = 120; // Aumentado para conexiones lentas
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
                        StartCoroutine(DescargarYConstruirModelo(datos, padreAR));
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

    // DISPATCHER: Según la extensión decide qué método usar
    private IEnumerator DescargarYConstruirModelo(ModeloResponse datos, Transform padre)
    {
        string url = datos.url_modelo;
        if (url.ToLower().EndsWith(".glb"))
        {
            DescargarYConstruirGLB(datos, padre);
            yield break;
        }

        // LÓGICA ORIGINAL DE ASSETBUNDLE (para los .molde)
        Debug.Log("Intentando descargar (con CACHÉ) modelo desde: " + url);

        // --- NUEVO: Limpieza preventiva para evitar error de 'ya cargado' ---
        AssetBundle.UnloadAllAssetBundles(false);

        using (UnityWebRequest www = UnityWebRequest.Get(url))
        {
            www.certificateHandler = new BypassCertificate();
            www.timeout = 120; // Aumentado para modelos pesados (4MB+)
            yield return www.SendWebRequest();

            if (www.result == UnityWebRequest.Result.Success)
            {
                byte[] rawData = www.downloadHandler.data;
                totalBytesModelos += (ulong)rawData.Length;
                
                // Cargar el bundle desde los Bytes en memoria (esto permite copiar los bytes al GestorColeccionLocal)
                AssetBundleCreateRequest bundleRequest = AssetBundle.LoadFromMemoryAsync(rawData);
                yield return bundleRequest;

                AssetBundle bundle = bundleRequest.assetBundle;
                if (bundle != null)
                {
                    if (objetoLoading != null) objetoLoading.SetActive(false);
                    string[] assets = bundle.GetAllAssetNames();
                    GameObject prefab = bundle.LoadAsset<GameObject>(assets[0]);
                    
                    if (modeloCargadoEnEscena != null) Destroy(modeloCargadoEnEscena);

                    modeloCargadoEnEscena = Instantiate(prefab, Camera.main.transform);
                    ConfigurarModeloRecienCargado(modeloCargadoEnEscena, datos, null); 
                    
                    // --- Registrar los bytes para que el botón de descarga tenga qué guardar ---
                    if (GestorColeccionLocal.Instancia != null) {
                        GestorColeccionLocal.Instancia.RegistrarModeloEnPantalla(datos, rawData);
                    }

                    bundle.Unload(false);
                    Debug.Log("¡Modelo AssetBundle normalizado y cargado con éxito!");

                    if (controladorInfo != null)
                    {
                        controladorInfo.MostrarDatosFirebase(datos, modeloCargadoEnEscena, false); // false = NO reiniciar animación de texto
                    }
                }
                else
                {
                    Debug.LogError("El archivo descargado no es un AssetBundle válido.");
                }
            }
            else
            {
                ManejarErrorDescarga(www);
            }
        }
    }

    // NUEVO MÉTODO ASÍNCRONO PARA LEER TEXTURA GLB EN TIEMPO REAL
    private async void DescargarYConstruirGLB(ModeloResponse datos, Transform padre)
    {
        string url = datos.url_modelo;
        Debug.Log("Intentando descargar modelo ultraligero GLB desde: " + url);
        
        using (UnityWebRequest www = UnityWebRequest.Get(url))
        {
            www.certificateHandler = new BypassCertificate();
            www.timeout = 120; // Aumentado para modelos pesados
            
            var req = www.SendWebRequest();
            while (!req.isDone) await Task.Yield();
            
            if (www.result == UnityWebRequest.Result.Success)
            {
                byte[] glbBytes = www.downloadHandler.data;

                // --- NUEVO: Registramos en memoria para permitir su guardado offline ---
                if (GestorColeccionLocal.Instancia != null) {
                    GestorColeccionLocal.Instancia.RegistrarModeloEnPantalla(datos, glbBytes);
                }

                var gltf = new GltfImport();
                bool success = await gltf.Load(glbBytes, new Uri(url));

                if (success)
                {
                    if (objetoLoading != null) objetoLoading.SetActive(false);
                    if (modeloCargadoEnEscena != null) Destroy(modeloCargadoEnEscena);

                    // Contenedor principal que anclamos a la cámara
                    modeloCargadoEnEscena = new GameObject("ModeloGLB");
                    modeloCargadoEnEscena.transform.SetParent(Camera.main.transform, false);

                    var instantiator = new GameObjectInstantiator(gltf, modeloCargadoEnEscena.transform);
                    success = await gltf.InstantiateMainSceneAsync(instantiator);

                    if (success)
                    {
                        ConfigurarModeloRecienCargado(modeloCargadoEnEscena, datos, gltf);
                        Debug.Log("¡Modelo GLB normalizado y cargado con éxito!");

                        if (controladorInfo != null)
                        {
                            controladorInfo.MostrarDatosFirebase(datos, modeloCargadoEnEscena, false); // false = NO reiniciar animación
                        }
                    }
                    else
                    {
                        Debug.LogError("Error instanciando la malla del archivo GLB.");
                    }
                }
                else
                {
                    Debug.LogError("Error en glTFast parseando el archivo GLB.");
                }
            }
            else
            {
                Debug.LogError("Error descargando el archivo GLB o es inválido: " + www.error);
                ManejarErrorDescarga(www);
            }
        }
    }

    // LÓGICA COMPARTIDA DE POSICIONAMIENTO, COLISIÓN Y GIRO
    private void ConfigurarModeloRecienCargado(GameObject modeloObj, ModeloResponse datos, GltfImport gltf = null)
    {
        // RESCATE DE MATERIALES MORADOS DE glTFast
        RepararMaterialesMorados(modeloObj, gltf);

        // REINICIO DE POSICIÓN DINÁMICO
        float offsetY = 0.05f; // Altura estándar para bichos
        float offsetZ = 0.5f;  // Distancia estándar

        // Si es personaje histórico, lo bajamos y alejamos un poco más
        if (datos != null && !string.IsNullOrEmpty(datos.tematica))
        {
            if (datos.tematica.ToLower().Contains("personajes") || datos.tematica.ToLower().Contains("históricos"))
            {
                offsetY = 0.0f; // Lo bajamos para que no se corte la cabeza
                offsetZ = 0.5f;  // Lo alejamos un poco para que entre en pantalla
            }
        }

        modeloObj.transform.localPosition = new Vector3(0f, offsetY, offsetZ);
        
        // ROTACIÓN INICIAL
        float rotacionY = 210f; // Por defecto: ladeados a la izquierda (para bichos/insectos)
        if (datos != null && !string.IsNullOrEmpty(datos.tematica))
        {
            if (datos.tematica.ToLower().Contains("personajes") || datos.tematica.ToLower().Contains("históricos"))
            {
                rotacionY = 265f; // Personajes históricos: perfil hacia la izquierda (330 grados)
            }
        }
        modeloObj.transform.localEulerAngles = new Vector3(0f, rotacionY, 0f);
        
        // ESCALA INICIAL
        modeloObj.transform.localScale = Vector3.one;

        if (modeloObj.GetComponent<Collider>() == null)
        {
            modeloObj.AddComponent<BoxCollider>();
        }
        
        RotarConDedo scriptTacto = modeloObj.AddComponent<RotarConDedo>();
        scriptTacto.modeloAGirar = modeloObj.transform;

        // Normalizamos el tamaño de visualizacion
        NormalizarTamaño(modeloObj, datos);
        
        if (objetoLoading != null) objetoLoading.SetActive(false);
    }

    private void RepararMaterialesMorados(GameObject modelo, GltfImport gltf)
    {
        Renderer[] renderers = modelo.GetComponentsInChildren<Renderer>();
        
        Shader shaderStandard = Shader.Find("Standard"); 
        Shader shaderURP = Shader.Find("Universal Render Pipeline/Lit"); 
        Shader shaderOptimo = shaderStandard != null ? shaderStandard : shaderURP;

        if (shaderOptimo == null) shaderOptimo = Shader.Find("Mobile/Diffuse");

        // [NUEVO] Rescate brutal directo de la memoria del glTFast
        Texture texturaFuerzaBruta = null;
        if (gltf != null)
        {
            try {
                // Sacamos la primera textura decodificada con éxito de todo el modelo
                texturaFuerzaBruta = gltf.GetTexture(0);
                if (texturaFuerzaBruta != null) Debug.Log("Tengo la textura directo de memoria GLB.");
            } catch {
                Debug.Log("No hay texturas disponibles en la memoria glTFast.");
            }
        }

        foreach (Renderer ren in renderers)
        {
            foreach (Material mat in ren.materials)
            {
                Texture texturaBase = texturaFuerzaBruta; // Usar rescate de memoria GLB primero

                if (texturaBase == null) {
                    if (mat.HasProperty("_MainTex")) texturaBase = mat.GetTexture("_MainTex");
                    if (mat.HasProperty("_BaseMap") && texturaBase == null) texturaBase = mat.GetTexture("_BaseMap");
                    if (texturaBase == null) texturaBase = mat.mainTexture;
                }

                Color colorBase = Color.white;
                if (mat.HasProperty("_Color")) colorBase = mat.GetColor("_Color");
                if (mat.HasProperty("_BaseColor")) colorBase = mat.GetColor("_BaseColor");

                if (shaderOptimo != null)
                {
                    mat.shader = shaderOptimo;
                    
                    if (texturaBase != null)
                    {
                        if (mat.HasProperty("_MainTex")) mat.SetTexture("_MainTex", texturaBase);
                        if (mat.HasProperty("_BaseMap")) mat.SetTexture("_BaseMap", texturaBase);
                    }
                    
                    if (mat.HasProperty("_Color")) mat.SetColor("_Color", colorBase);
                    if (mat.HasProperty("_BaseColor")) mat.SetColor("_BaseColor", colorBase);
                }
            }
        }
    }

    private void ManejarErrorDescarga(UnityWebRequest www)
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

    private void NormalizarTamaño(GameObject objeto, ModeloResponse datos)
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
            // 4. Determinar el tamaño objetivo según la temática
            float targetSize = escalaInicial * 1.2f; 

            if (datos != null && !string.IsNullOrEmpty(datos.tematica))
            {
                // Personaje histórico
                if (datos.tematica.ToLower().Contains("personajes") || datos.tematica.ToLower().Contains("históricos"))
                {
                    targetSize = escalaInicial * 1.5f; 
                }
            }

            // 5. Calculamos cuánto hay que multiplicar para que mida exactamente lo que dice targetSize
            float factorEscala = targetSize / tamañoActual;
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
        if (url.ToLower().EndsWith(".glb"))
        {
            // Omitimos la precarga fuerte de AssetBundle para GLB (ya que glTFast usa su propia API para parsear)
            // Podríamos hacer un GET rápido para cachear, pero GLTFast es tan rápido que no vale la pena sobrecargar.
            yield break;
        }

        // Al usar GetAssetBundle y dejar que termine, Unity lo guarda en disco automáticamente
        using (UnityWebRequest www = UnityWebRequestAssetBundle.GetAssetBundle(url))
        {
            www.certificateHandler = new BypassCertificate();
            www.timeout = 120; // Tiempo extendido para precarga
            yield return www.SendWebRequest();
            if (www.result == UnityWebRequest.Result.Success)
            {
                // Solo lo descargamos, no lo abrimos ni lo usamos. Ya queda en el Caché del celular.
                AssetBundle bundle = DownloadHandlerAssetBundle.GetContent(www);
                if (bundle != null) bundle.Unload(true); // Liberamos RAM pero queda en DISCO
            }
        }
    }

    IEnumerator DescargarDiccionarioUI()
    {
        string url = apiUrl.Replace("microscopicos/public/", "languages/public/ui-dict");
        using (UnityWebRequest webRequest = UnityWebRequest.Get(url))
        {
            yield return webRequest.SendWebRequest();
            if (webRequest.result == UnityWebRequest.Result.Success)
            {
                UIDictResponse response = JsonUtility.FromJson<UIDictResponse>(webRequest.downloadHandler.text);
                if (response != null && response.idiomas != null)
                {
                    DiccionarioUI.Clear();
                      IdiomasDisponibles.Clear();
                    foreach (var idm in response.idiomas)
                      {
                          IdiomasDisponibles.Add(idm);
                        var dict = new System.Collections.Generic.Dictionary<string, string>();
                        if (idm.textos != null)
                        {
                            foreach (var txt in idm.textos)
                            {
                                dict[txt.key] = txt.value;
                            }
                        }
                        DiccionarioUI[idm.code] = dict;
                    }
                    if (controladorIdioma != null)
                    {
                        controladorIdioma.RefrescarTextosActuales();
                    }
                }
            }
        }
    }
}
