using UnityEngine;
using System.IO;
using System.Threading.Tasks;
using GLTFast;
using System;

public class Visor3DAutonomo : MonoBehaviour
{
    public static Visor3DAutonomo Instancia { get; private set; }

    [Header("Conexiones de UI")]
    public ControladorInfo controladorInfo;
    public GameObject panelVisor3D; // El panel que oscurece el fondo
    public Transform anclaObjeto3D; // Donde va a aparecer el modelo flotando

    private GameObject modeloCargadoEnVisor;

    void Awake()
    {
        if (Instancia != null && Instancia != this) { Destroy(gameObject); return; }
        Instancia = this;
    }

    public async void CargarModeloLocal(ResumenColeccion modeloData)
    {
        if (!File.Exists(modeloData.rutaModeloLocal))
        {
            Debug.LogError("Error: No se encontró el archivo físico del modelo en: " + modeloData.rutaModeloLocal);
            return;
        }

        // 1. Mostrar Panel Inmersivo
        if (panelVisor3D != null) panelVisor3D.SetActive(true);

        // 2. Limpiar modelo anterior
        if (modeloCargadoEnVisor != null) Destroy(modeloCargadoEnVisor);

        // 3. Crear ancla si no existe (la ponemos frente a la cámara principal)
        if (anclaObjeto3D == null)
        {
            anclaObjeto3D = new GameObject("AnclaVisor3D").transform;
            anclaObjeto3D.SetParent(Camera.main.transform, false);
            anclaObjeto3D.localPosition = new Vector3(0, 0, 1.5f); // 1.5 mts frente a la cámara
        }

        // 4. Transformar los metadatos locales en la misma estructura que espera ControladorInfo
        LectorApiAR.ModeloResponse pseudoRespuesta = new LectorApiAR.ModeloResponse
        {
            nombre = modeloData.nombre,
            nombre_cientifico = modeloData.nombre_cientifico,
            taxonomia = modeloData.taxonomia,
            descripcion = modeloData.descripcion,
            fuente = modeloData.fuente,
            tematica = modeloData.tematica
        };

        // 5. Mostrar la Data en la UI lateral
        if (controladorInfo != null)
        {
            // Ocultamos el botón Descargar puesto que ya estamos en la Galería Local
            controladorInfo.OcultarBotonDescarga();
            // Llenamos el texto
            controladorInfo.MostrarDatosFirebase(pseudoRespuesta, null);
        }

        // 6. Cargar físicamente con glTFast desde el DISCO DURO (No hay gastó de internet)
        byte[] bytes = File.ReadAllBytes(modeloData.rutaModeloLocal);
        var gltf = new GltfImport();
        
        bool success = await gltf.Load(bytes, new Uri("file:///" + modeloData.rutaModeloLocal));

        if (success)
        {
            modeloCargadoEnVisor = new GameObject("GLB_Local");
            modeloCargadoEnVisor.transform.SetParent(anclaObjeto3D, false);

            var instantiator = new GameObjectInstantiator(gltf, modeloCargadoEnVisor.transform);
            success = await gltf.InstantiateMainSceneAsync(instantiator);

            if (success)
            {
                // Reutilizamos el script de reparación de materiales para garantizar el color
                RepararMaterialesLocales(modeloCargadoEnVisor, gltf);
                
                // Rotación táctil o automática
                modeloCargadoEnVisor.AddComponent<RotarLento>();
                RotarConDedo scriptTacto = modeloCargadoEnVisor.AddComponent<RotarConDedo>();
                scriptTacto.modeloAGirar = modeloCargadoEnVisor.transform;
                
                // Finalizamos indicándole a la UI que ya hay modelo 3D para revelar información inmersiva
                if (controladorInfo != null) controladorInfo.MostrarDatosFirebase(pseudoRespuesta, modeloCargadoEnVisor);
            }
        }
    }

    public void CerrarVisor()
    {
        if (modeloCargadoEnVisor != null) Destroy(modeloCargadoEnVisor);
        if (panelVisor3D != null) panelVisor3D.SetActive(false);
        if (controladorInfo != null) controladorInfo.LimpiarPanel();
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
}