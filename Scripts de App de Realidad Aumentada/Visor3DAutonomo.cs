using UnityEngine;
using UnityEngine.SceneManagement;
using System.IO;
using System.Threading.Tasks;
using GLTFast;
using System;

public class Visor3DAutonomo : MonoBehaviour
{
    public static Visor3DAutonomo Instancia { get; private set; }

    [Header("Conexiones de UI")]
    public ControladorInfo controladorInfo;
    public GameObject panelVisor3D; // El panel que muestra la ficha informativa
    public Transform anclaObjeto3D; // Donde va a aparecer el modelo flotando

    private GameObject modeloCargadoEnVisor;
    private GameObject panelGaleriaRef;  // Para ocultar la galería al abrir el visor
    private GameObject fondoGeneralRef;  // Para ocultar el fondo de la selva y dejar ver el 3D
    private GameObject btnCerrarRef;     // Botón cerrar del visor
    private GameObject btnMenuRef;       // Botón Volver que el usuario clonó
    private int versionCarga = 0;        // Para cancelar cargas asíncronas si el usuario sale rápido

    void Awake()
    {
        if (Instancia != null && Instancia != this) { Destroy(gameObject); return; }
        Instancia = this;
        DontDestroyOnLoad(gameObject);
    }

    public async void CargarModeloLocal(ResumenColeccion modeloData)
    {
        versionCarga++;
        int miVersion = versionCarga;

        Debug.Log("[VISOR3D] === INICIO CargarModeloLocal === Modelo: " + modeloData.nombre);
        
        if (!File.Exists(modeloData.rutaModeloLocal))
        {
            Debug.LogError("[VISOR3D] No se encontró el archivo físico del modelo en: " + modeloData.rutaModeloLocal);
            return;
        }
        Debug.Log("[VISOR3D] Archivo encontrado: " + modeloData.rutaModeloLocal);

        // 0. Primero buscamos el contenedor principal ("PanelDescargados" o "Panel Informativo")
        if (panelVisor3D == null)
        {
            panelVisor3D = BuscarObjetoIncluyendoInactivos("PanelDescargados");
            if (panelVisor3D == null) panelVisor3D = BuscarObjetoIncluyendoInactivos("Panel Informativo");
        }

        // 0.1 Buscar referencias ESTRICTAMENTE DENTRO del panelVisor3D para no agarrar cosas de la Galería
        if (panelVisor3D != null)
        {
            if (controladorInfo == null) controladorInfo = panelVisor3D.GetComponentInChildren<ControladorInfo>(true);
            
            if (btnMenuRef == null)
            {
                foreach (Transform hijo in panelVisor3D.GetComponentsInChildren<Transform>(true))
                {
                    if (hijo.name == "Btn_Volver")
                    {
                        btnMenuRef = hijo.gameObject;
                        break;
                    }
                }
            }
        }

        // Fallbacks por si acaso no estaban adentro
        if (controladorInfo == null) controladorInfo = BuscarComponenteIncluyendoInactivos<ControladorInfo>();
        if (btnMenuRef == null) btnMenuRef = BuscarObjetoIncluyendoInactivos("Btn_Volver");
        if (btnCerrarRef == null) btnCerrarRef = BuscarObjetoIncluyendoInactivos("Btn_Cerrar");

        // Auto-buscar PanelGalería para ocultarlo
        if (panelGaleriaRef == null)
        {
            panelGaleriaRef = BuscarObjetoIncluyendoInactivos("PanelGalería");
            if (panelGaleriaRef == null) panelGaleriaRef = BuscarObjetoIncluyendoInactivos("PanelGaleria");
        }

        // Auto-buscar FondoGeneral para asegurar que no bloquee clics
        if (fondoGeneralRef == null)
        {
            fondoGeneralRef = BuscarObjetoIncluyendoInactivos("FondoGeneral");
            if (fondoGeneralRef == null) fondoGeneralRef = BuscarObjetoIncluyendoInactivos("Fondo General");
            
            // CRÍTICO: Desactivar Raycast Target para que no bloquee los toques a la pantalla
            if (fondoGeneralRef != null)
            {
                UnityEngine.UI.Image img = fondoGeneralRef.GetComponent<UnityEngine.UI.Image>();
                if (img != null) img.raycastTarget = false;
            }
        }

        // 1. Ocultar Galería y mostrar el Visor
        if (panelGaleriaRef != null)
        {
            panelGaleriaRef.SetActive(false);
            Debug.Log("[VISOR3D] PanelGalería ocultado.");
        }

        if (panelVisor3D != null)
        {
            panelVisor3D.SetActive(true);
            Debug.Log("[VISOR3D] Panel Informativo activado.");
            
            // --- HACK DEFINITIVO DE PROFUNDIDADES ---
            // Obligamos a los Canvas a adoptar las distancias correctas por código
            Canvas canvasUI = panelVisor3D.GetComponentInParent<Canvas>();
            if (canvasUI != null && canvasUI.renderMode == RenderMode.ScreenSpaceCamera)
            {
                canvasUI.planeDistance = 1f; // UI pegada a la cámara (adelante del todo)
            }
        }
        else
        {
            Debug.LogWarning("[VISOR3D] panelVisor3D sigue NULL.");
        }

        // Obligamos al fondo a irse bien atrás
        if (fondoGeneralRef != null)
        {
            Canvas canvasDelFondo = fondoGeneralRef.GetComponentInParent<Canvas>();
            if (canvasDelFondo != null && canvasDelFondo.renderMode == RenderMode.ScreenSpaceCamera)
            {
                canvasDelFondo.planeDistance = 100f; // Fondo allá a lo lejos
            }
        }

        if (btnCerrarRef != null)
        {
            btnCerrarRef.SetActive(true);
            // Conectar el botón cerrar al visor si no está conectado
            UnityEngine.UI.Button btnComp = btnCerrarRef.GetComponent<UnityEngine.UI.Button>();
            if (btnComp != null)
            {
                btnComp.onClick.RemoveAllListeners();
                btnComp.onClick.AddListener(CerrarVisor);
            }
        }

        if (btnMenuRef != null)
        {
            btnMenuRef.SetActive(true);
            UnityEngine.UI.Button btnMenuComp = btnMenuRef.GetComponent<UnityEngine.UI.Button>();
            if (btnMenuComp != null)
            {
                btnMenuComp.onClick.RemoveAllListeners();
                // Redirigimos al cierre del visor, que a su vez reactiva la galería
                btnMenuComp.onClick.AddListener(CerrarVisor); 
            }
        }

        // 2. Limpiar modelo anterior
        if (modeloCargadoEnVisor != null) Destroy(modeloCargadoEnVisor);

        // 3. Crear ancla si no existe o si fue destruida al cambiar de escena
        if (anclaObjeto3D == null || anclaObjeto3D.gameObject == null)
        {
            Camera cam = Camera.main;
            if (cam == null)
            {
                cam = FindObjectOfType<Camera>();
                Debug.LogWarning("[VISOR3D] Camera.main es NULL (escena sin MainCamera tag). Usando: " + (cam != null ? cam.name : "NINGUNA"));
            }

            if (cam != null)
            {
                anclaObjeto3D = new GameObject("AnclaVisor3D").transform;
                anclaObjeto3D.SetParent(cam.transform, false);
                // Lo alejamos significativamente (2.5f) para que quede físicamente DETRÁS de la UI
                anclaObjeto3D.localPosition = new Vector3(0f, 0.2f, 2.5f);
                anclaObjeto3D.localEulerAngles = Vector3.zero;
            }
            else
            {
                // Último recurso: crear ancla en el mundo sin padre
                Debug.LogError("[VISOR3D] No hay NINGUNA cámara. Creando ancla en posición mundial.");
                anclaObjeto3D = new GameObject("AnclaVisor3D").transform;
                anclaObjeto3D.position = new Vector3(0, 0, 3f);
            }
        }

        // 4. Transformar los metadatos locales en la misma estructura que espera ControladorInfo
        LectorApiAR.ModeloResponse pseudoRespuesta = new LectorApiAR.ModeloResponse
        {
            nombre = modeloData.nombre,
            nombre_cientifico = modeloData.nombre_cientifico,
            taxonomia = modeloData.taxonomia,
            descripcion = modeloData.descripcion,
            fuente = modeloData.fuente,
            tematica = modeloData.tematica,
            traducciones = modeloData.traducciones
        };

        // 5. Mostrar la Data en la UI lateral
        if (controladorInfo != null)
        {
            // Aseguramos que el panel principal esté ACTIVO y sea VISIBLE
            if (panelVisor3D != null) panelVisor3D.SetActive(true);
            if (btnMenuRef != null) btnMenuRef.SetActive(true);

            // Forzamos visibilidad en el controlador
            controladorInfo.ForzarMostrarPanel(); 
            controladorInfo.OcultarBotonDescarga();
            controladorInfo.MostrarDatosFirebase(pseudoRespuesta, null);
            Debug.Log("[VISOR3D] Info del modelo enviada al panel de texto.");
        }

        // 6. Cargar físicamente según el tipo de archivo (.glb vs .molde)
        try
        {
            if (modeloData.rutaModeloLocal.EndsWith(".glb", StringComparison.OrdinalIgnoreCase))
            {
                Debug.Log("[VISOR3D] Cargando archivo GLB...");
                byte[] bytes = File.ReadAllBytes(modeloData.rutaModeloLocal);
                var gltf = new GltfImport();
                bool success = await gltf.Load(bytes, new Uri("file:///" + modeloData.rutaModeloLocal));
                if (miVersion != versionCarga) return;

                if (success)
                {
                    modeloCargadoEnVisor = new GameObject("GLB_Local");
                    modeloCargadoEnVisor.transform.SetParent(anclaObjeto3D, false);

                    var instantiator = new GameObjectInstantiator(gltf, modeloCargadoEnVisor.transform);
                    success = await gltf.InstantiateMainSceneAsync(instantiator);
                    if (miVersion != versionCarga) 
                    {
                        if (modeloCargadoEnVisor != null) Destroy(modeloCargadoEnVisor);
                        return;
                    }

                    if (success)
                    {
                        RepararMaterialesLocales(modeloCargadoEnVisor, gltf);
                        ConfigurarInteraccionModelo(modeloData);
                        if (controladorInfo != null) controladorInfo.MostrarDatosFirebase(null, modeloCargadoEnVisor, false);
                        Debug.Log("[VISOR3D] ¡Modelo GLB cargado con éxito!");
                    }
                    else
                    {
                        Debug.LogError("[VISOR3D] Error al instanciar la malla GLB.");
                    }
                }
                else
                {
                    Debug.LogError("[VISOR3D] Error al parsear el archivo GLB.");
                }
            }
            else // Es un .molde / AssetBundle
            {
                Debug.Log("[VISOR3D] Cargando AssetBundle (.molde)...");
                AssetBundle.UnloadAllAssetBundles(false); // Prevenir error de 'ya cargado'
                
                var bundleRequest = AssetBundle.LoadFromFileAsync(modeloData.rutaModeloLocal);
                while (!bundleRequest.isDone) {
                    await Task.Yield();
                    if (miVersion != versionCarga) return;
                }
                
                AssetBundle bundle = bundleRequest.assetBundle;
                if (bundle != null)
                {
                    string[] assets = bundle.GetAllAssetNames();
                    GameObject prefab = bundle.LoadAsset<GameObject>(assets[0]);
                    
                    modeloCargadoEnVisor = Instantiate(prefab, anclaObjeto3D);
                    bundle.Unload(false);

                    ConfigurarInteraccionModelo(modeloData);
                    if (controladorInfo != null) controladorInfo.MostrarDatosFirebase(null, modeloCargadoEnVisor, false);
                    Debug.Log("[VISOR3D] ¡Modelo AssetBundle cargado con éxito!");
                }
                else
                {
                    Debug.LogError("[VISOR3D] No se pudo cargar el AssetBundle offline desde: " + modeloData.rutaModeloLocal);
                }
            }
        }
        catch (Exception ex)
        {
            Debug.LogError("[VISOR3D] EXCEPCIÓN al cargar modelo: " + ex.Message + "\n" + ex.StackTrace);
        }
    }

    private void ConfigurarInteraccionModelo(ResumenColeccion datos)
    {
        // REINICIO DE POSICIÓN DINÁMICO
        float offsetY = 0f;
        float offsetZ = 0f;

        // Si es personaje histórico, lo bajamos un poco para que el panel no tape su cara
        if (datos != null && !string.IsNullOrEmpty(datos.tematica))
        {
            if (datos.tematica.ToLower().Contains("personajes") || datos.tematica.ToLower().Contains("históricos"))
            {
                offsetY = -0.2f; // Lo subimos un poco (antes -0.4f)
                offsetZ = 0f;    
            }
        }

        modeloCargadoEnVisor.transform.localPosition = new Vector3(0f, offsetY, offsetZ);

        // ROTACIÓN INICIAL
        float rotacionY = 210f; // Por defecto: ladeados a la izquierda (para bichos/insectos)
        if (datos != null && !string.IsNullOrEmpty(datos.tematica))
        {
            if (datos.tematica.ToLower().Contains("personajes") || datos.tematica.ToLower().Contains("históricos"))
            {
                rotacionY = 265f; // Personajes históricos: perfil hacia la izquierda (330 grados)
            }
        }
        modeloCargadoEnVisor.transform.localEulerAngles = new Vector3(0f, rotacionY, 0f);

        // ESCALA INICIAL
        modeloCargadoEnVisor.transform.localScale = Vector3.one;

        if (modeloCargadoEnVisor.GetComponent<Collider>() == null)
        {
            modeloCargadoEnVisor.AddComponent<BoxCollider>();
        }

        // Normalizar su tamaño según temática
        NormalizarTamaño(modeloCargadoEnVisor, datos);

        // Quitamos RotarLento para que no gire solo, pero mantenemos RotarConDedo
        RotarConDedo scriptTacto = modeloCargadoEnVisor.AddComponent<RotarConDedo>();
        scriptTacto.modeloAGirar = modeloCargadoEnVisor.transform;
    }

    private void NormalizarTamaño(GameObject objeto, ResumenColeccion datos)
    {
        MeshRenderer[] renderers = objeto.GetComponentsInChildren<MeshRenderer>();
        if (renderers.Length == 0) return;

        Bounds totalBounds = renderers[0].bounds;
        foreach (MeshRenderer r in renderers)
        {
            totalBounds.Encapsulate(r.bounds);
        }

        float tamañoActual = Mathf.Max(totalBounds.size.x, totalBounds.size.y, totalBounds.size.z);
        if (tamañoActual > 0)
        {
            // Tamaño base (0.8) ideal para pantalla 2D
            float targetSize = 1.8f;

            // Si es personaje histórico, lo hacemos mucho más grande (2.2) para que ocupe más pantalla
            if (datos != null && !string.IsNullOrEmpty(datos.tematica))
            {
                if (datos.tematica.ToLower().Contains("personajes") || datos.tematica.ToLower().Contains("históricos"))
                {
                    targetSize = 2.2f; 
                }
            }

            float factorEscala = targetSize / tamañoActual; 
            objeto.transform.localScale *= factorEscala;
        }
    }

    public void CerrarVisor()
    {
        versionCarga++; // Cancela cualquier carga de modelo en progreso
        Debug.Log("[VISOR3D] Cerrando visor...");
        
        if (modeloCargadoEnVisor != null) Destroy(modeloCargadoEnVisor);
        if (panelVisor3D != null) panelVisor3D.SetActive(false);
        if (controladorInfo != null) controladorInfo.LimpiarPanel();
        if (btnCerrarRef != null) btnCerrarRef.SetActive(false);
        if (btnMenuRef != null) btnMenuRef.SetActive(false);

        // Volver a mostrar la Galería
        if (panelGaleriaRef != null)
        {
            panelGaleriaRef.SetActive(true);
            Debug.Log("[VISOR3D] PanelGalería reactivado.");
        }
        else
        {
            // Intentar encontrarla de nuevo (podría estar inactiva)
            panelGaleriaRef = BuscarObjetoIncluyendoInactivos("PanelGalería");
            if (panelGaleriaRef == null) panelGaleriaRef = BuscarObjetoIncluyendoInactivos("PanelGaleria");
            if (panelGaleriaRef != null) panelGaleriaRef.SetActive(true);
        }
    }

    // Copia exacta de rescate de texturas para Offline
    private void RepararMaterialesLocales(GameObject modelo, GltfImport gltf)
    {
        Renderer[] renderers = modelo.GetComponentsInChildren<Renderer>();
        Shader shaderStandard = Shader.Find("Standard"); 
        Shader shaderURP = Shader.Find("Universal Render Pipeline/Lit"); 
        Shader shaderOptimo = shaderStandard != null ? shaderStandard : shaderURP;
        if (shaderOptimo == null) shaderOptimo = Shader.Find("Mobile/Diffuse");

        Texture texturaFuerzaBruta = null;
        if (gltf != null)
        {
            try { texturaFuerzaBruta = gltf.GetTexture(0); } catch { }
        }

        foreach (Renderer ren in renderers)
        {
            foreach (Material mat in ren.materials)
            {
                Texture texturaBase = texturaFuerzaBruta; 
                if (texturaBase == null) {
                    if (mat.HasProperty("_MainTex")) texturaBase = mat.GetTexture("_MainTex");
                    if (mat.HasProperty("_BaseMap") && texturaBase == null) texturaBase = mat.GetTexture("_BaseMap");
                    if (texturaBase == null) texturaBase = mat.mainTexture;
                }

                Color colorBase = Color.white;
                if (mat.HasProperty("_Color")) colorBase = mat.GetColor("_Color");

                if (shaderOptimo != null)
                {
                    mat.shader = shaderOptimo;
                    if (texturaBase != null)
                    {
                        if (mat.HasProperty("_MainTex")) mat.SetTexture("_MainTex", texturaBase);
                        if (mat.HasProperty("_BaseMap")) mat.SetTexture("_BaseMap", texturaBase);
                    }
                    if (mat.HasProperty("_Color")) mat.SetColor("_Color", colorBase);
                }
            }
        }
    }

    // Busca un GameObject por nombre incluyendo objetos INACTIVOS (GameObject.Find solo busca activos)
    private GameObject BuscarObjetoIncluyendoInactivos(string nombre)
    {
        // Buscar en los root objects de la escena activa (incluye inactivos)
        Scene escenaActiva = SceneManager.GetActiveScene();
        GameObject[] raices = escenaActiva.GetRootGameObjects();
        
        foreach (GameObject raiz in raices)
        {
            if (raiz.name == nombre) return raiz;
            
            // También buscar en hijos (para paneles dentro del Canvas)
            Transform encontrado = raiz.transform.Find(nombre);
            if (encontrado != null) return encontrado.gameObject;
            
            // Búsqueda recursiva en hijos
            foreach (Transform hijo in raiz.GetComponentsInChildren<Transform>(true))
            {
                if (hijo.name == nombre) return hijo.gameObject;
            }
        }
        
        Debug.LogWarning($"[VISOR3D] No se encontró '{nombre}' en la escena (ni activo ni inactivo).");
        return null;
    }

    // Busca un componente incluyendo los inactivos
    private T BuscarComponenteIncluyendoInactivos<T>() where T : Component
    {
        Scene escenaActiva = SceneManager.GetActiveScene();
        GameObject[] raices = escenaActiva.GetRootGameObjects();
        
        foreach (GameObject raiz in raices)
        {
            T componente = raiz.GetComponentInChildren<T>(true);
            if (componente != null) return componente;
        }
        return null;
    }
}