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
    public string apiUrl = "http://localhost:3000/microscopicos/public/";

    private GameObject modeloCargadoEnEscena;

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

                    modeloCargadoEnEscena = Instantiate(prefab, padre);
                    
                    // REINICIO DE POSICIÓN
                    modeloCargadoEnEscena.transform.localPosition = Vector3.zero;
                    // ROTACIÓN INICIAL (de perfil, para que se vea bien al cargar)
                    modeloCargadoEnEscena.transform.localEulerAngles = new Vector3(0f, 0f, 200f);
                    
                    // --- REDUCCIÓN DE ESCALA ---
                    // Como el modelo de Meshy mide ~10 metros, lo reducimos al 1% (10 cm)
                    // Si sigue sin verse, prueba con 0.005f o 0.001f
                    modeloCargadoEnEscena.transform.localScale = new Vector3(20.01f, 20.01f, 20.01f); 

                    // 1. Verificamos si ya tiene un Collider, si no, le ponemos uno para que tenga "cuerpo"
                    if (modeloCargadoEnEscena.GetComponent<Collider>() == null)
                    {
                        modeloCargadoEnEscena.AddComponent<BoxCollider>();
                    }
                    
                    RotarConDedo scriptTacto = modeloCargadoEnEscena.AddComponent<RotarConDedo>();
                    scriptTacto.modeloAGirar = modeloCargadoEnEscena.transform;

                    controladorInfo.MostrarDatosFirebase(null, modeloCargadoEnEscena);
                    
                    bundle.Unload(false);
                    Debug.Log("¡Modelo cargado y escalado con éxito!");
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
}