using UnityEngine;
using System.IO;
using System.Threading.Tasks;
using UnityEngine.Networking;
using System.Collections.Generic;
using System.Collections;
using System;

[Serializable]
public class ResumenColeccion
{
    public string id;
    public string nombre;
    public string nombre_cientifico;
    public string taxonomia;
    public string descripcion;
    public string fuente;
    public string rutaFotoLocal;
    public string rutaModeloLocal;
    public string tematica;
}

[Serializable]
public class ListaColecciones
{
    public List<ResumenColeccion> items = new List<ResumenColeccion>();
}

public class GestorColeccionLocal : MonoBehaviour
{
    public static GestorColeccionLocal Instancia { get; private set; }

    private string DirectorioBase;
    
    // Caché temporal flotante del modelo que se está viendo ahora mismo
    private LectorApiAR.ModeloResponse infoActiva;
    private byte[] bytesActivos;

    void Awake()
    {
        if (Instancia != null && Instancia != this) { Destroy(gameObject); return; }
        Instancia = this;
        
        DirectorioBase = Path.Combine(Application.persistentDataPath, "ColeccionOffline");
        if (!Directory.Exists(DirectorioBase)) Directory.CreateDirectory(DirectorioBase);
    }

    /// Guarda temporalmente en RAM el modelo que acaba de descargarse online
    public void RegistrarModeloEnPantalla(LectorApiAR.ModeloResponse datosEspecie, byte[] glbBytes)
    {
        this.infoActiva = datosEspecie;
        this.bytesActivos = glbBytes;
    }

    /// <summary>
    /// Función pública que será llamada por el NUEVO BOTÓN "Descargar" en la UI (ControladorInfo)
    /// </summary>
    public void BotonUI_DescargarModelo()
    {
        if (infoActiva != null && bytesActivos != null && bytesActivos.Length > 0)
        {
            string idCheck = infoActiva.nombre_cientifico;
            if (string.IsNullOrEmpty(idCheck)) idCheck = infoActiva.nombre;

            if (!YaEstaDescargado(idCheck))
            {
                GuardarEnColeccion(infoActiva, bytesActivos);
            }
        }
    }

    /// <summary>
    /// Guarda un modelo recién escaneado al celular de forma estructural para la Galería
    /// </summary>
    private void GuardarEnColeccion(LectorApiAR.ModeloResponse datosEspecie, byte[] glbBytes)
    {
        StartCoroutine(ProcesoGuardado(datosEspecie, glbBytes));
    }

    private IEnumerator ProcesoGuardado(LectorApiAR.ModeloResponse datos, byte[] glbBytes)
    {
        string idUnico = datos.nombre_cientifico;
        if (string.IsNullOrEmpty(idUnico)) idUnico = datos.nombre; // Respaldo por si no tiene científico

        string rutaDirectorio = Path.Combine(DirectorioBase, idUnico);

        if (!Directory.Exists(rutaDirectorio)) Directory.CreateDirectory(rutaDirectorio);

        // 1. Escribir el 3D
        string rutaGLB = Path.Combine(rutaDirectorio, "modelo.glb");
        File.WriteAllBytes(rutaGLB, glbBytes);

        // 2. Descargar la foto miniatura
        string urlFoto = datos.qr_image_url;
        string rutaFoto = "";

        if (!string.IsNullOrEmpty(urlFoto))
        {
            // Parseamos a URL absoluta en caso de que la app reciba solo el archivo
            if (!urlFoto.StartsWith("http")) urlFoto = "http://108.181.191.82.sslip.io:8070/uploads/microscopicos/" + urlFoto;

            rutaFoto = Path.Combine(rutaDirectorio, "portada.jpg");
            using (UnityWebRequest www = UnityWebRequest.Get(urlFoto))
            {
                www.certificateHandler = new BypassCertificate();
                yield return www.SendWebRequest();

                if (www.result == UnityWebRequest.Result.Success)
                {
                    File.WriteAllBytes(rutaFoto, www.downloadHandler.data);
                }
            }
        }

        // 3. Crear el Resumen
        ResumenColeccion resumen = new ResumenColeccion
        {
            id = idUnico,
            nombre = datos.nombre,
            nombre_cientifico = datos.nombre_cientifico,
            taxonomia = datos.taxonomia,
            descripcion = datos.descripcion,
            fuente = datos.fuente,
            tematica = datos.tematica, // Obtenemos la tematica enviada desde NodeJS
            rutaFotoLocal = rutaFoto,
            rutaModeloLocal = rutaGLB
        };

        // 4. Actualizar el Gran Índice (El JSON Maestro de la Galería)
        ActualizarIndiceMaestro(resumen);

        Debug.Log("Modelo guardado exitosamente en Galería Offline: " + resumen.nombre);
        
        // Notificamos a la UI que ya se guardó para mostrar un "Toaster" o desactivar el botón
        ControladorInfo ci = FindObjectOfType<ControladorInfo>();
        if (ci != null) ci.MostrarExitoDescarga();
    }

    private void ActualizarIndiceMaestro(ResumenColeccion nuevoItem)
    {
        string rutaIndice = Path.Combine(DirectorioBase, "indice.json");
        ListaColecciones listaBase;

        if (File.Exists(rutaIndice))
        {
            string oldJson = File.ReadAllText(rutaIndice);
            listaBase = JsonUtility.FromJson<ListaColecciones>(oldJson);
            if (listaBase == null) listaBase = new ListaColecciones();
        }
        else
        {
            listaBase = new ListaColecciones();
        }

        // Si ya existía, lo reemplazamos
        int index = listaBase.items.FindIndex(x => x.id == nuevoItem.id);
        if (index >= 0) listaBase.items[index] = nuevoItem;
        else listaBase.items.Add(nuevoItem);

        string jsonSalida = JsonUtility.ToJson(listaBase, true);
        File.WriteAllText(rutaIndice, jsonSalida);
    }

    public static List<ResumenColeccion> ObtenerCatalogoDescargado()
    {
        string dirBase = Path.Combine(Application.persistentDataPath, "ColeccionOffline");
        string rutaIndice = Path.Combine(dirBase, "indice.json");
        if (!File.Exists(rutaIndice)) return new List<ResumenColeccion>();

        string json = File.ReadAllText(rutaIndice);
        ListaColecciones lista = JsonUtility.FromJson<ListaColecciones>(json);
        if (lista == null) return new List<ResumenColeccion>();

        bool archivoModificado = false;
        for (int i = lista.items.Count - 1; i >= 0; i--)
        {
            // Auto-eliminar el fantasma bugueado "0" de ayer o registros corruptos
            if (lista.items[i].id == "0" || !File.Exists(lista.items[i].rutaModeloLocal))
            {
                string carpetaMala = Path.Combine(dirBase, lista.items[i].id);
                if (Directory.Exists(carpetaMala)) Directory.Delete(carpetaMala, true);

                lista.items.RemoveAt(i);
                archivoModificado = true;
            }
        }

        if (archivoModificado)
        {
            File.WriteAllText(rutaIndice, JsonUtility.ToJson(lista, true));
        }

        return lista.items;
    }

    public bool YaEstaDescargado(string idModelo)
    {
        string rutaIndice = Path.Combine(DirectorioBase, "indice.json");
        if (!File.Exists(rutaIndice)) return false;

        string json = File.ReadAllText(rutaIndice);
        ListaColecciones lista = JsonUtility.FromJson<ListaColecciones>(json);
        if (lista == null) return false;

        return lista.items.Exists(x => x.id == idModelo);
    }
}