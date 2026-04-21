using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;
using System.Linq;

public class GestorGaleria : MonoBehaviour
{
    [Header("UI General")]
    public GameObject panelGaleria;
    public TMP_InputField inputBuscador;
    
    [Header("Contenedor de Tarjetas (Catálogo)")]
    public Transform contenedorTarjetas;
    public GameObject prefabTarjetaEspecie; // Debe tener: Image(portada), TMP(nombre), TMP(cientifico), Button
    
    [Header("Contenedor de Temáticas (Chips)")]
    public Transform contenedorTematicas;
    public GameObject prefabChipTematica; // Debe tener: TMP(nombre), Button

    private List<ResumenColeccion> todosLosModelos = new List<ResumenColeccion>();
    private string tematicaActiva = "";

    void OnEnable()
    {
        // Ya no requerimos Instancia (está en otra escena), leemos el archivo directamente estáticamente
        CargarColeccionLocales();
        
        if (inputBuscador != null)
        {
            inputBuscador.onValueChanged.RemoveAllListeners();
            inputBuscador.onValueChanged.AddListener(FiltrarGaleria);
        }
    }

    public void CargarColeccionLocales()
    {
        todosLosModelos = GestorColeccionLocal.ObtenerCatalogoDescargado();
        ConstruirChipsTematicas();
        FiltrarGaleria(inputBuscador != null ? inputBuscador.text : "");
    }

    // Funciones adicionales para los nuevos botones
    public void BotonBuscar()
    {
        FiltrarGaleria(inputBuscador != null ? inputBuscador.text : "");
    }

    public void CerrarGaleria()
    {
        NavegacionMenu nav = FindObjectOfType<NavegacionMenu>();
        if (nav != null) nav.IrATematicas();
    }

    public void BotonLimpiarDatos()
    {
        string dirBase = System.IO.Path.Combine(Application.persistentDataPath, "ColeccionOffline");
        if (System.IO.Directory.Exists(dirBase))
        {
            System.IO.Directory.Delete(dirBase, true);
        }
        todosLosModelos.Clear();
        FiltrarGaleria("");
        Debug.Log("¡Caché de Galería Local BORRADA completamente!");
    }

    private void ConstruirChipsTematicas()
    {
        // 1. Limpiar chips viejos
        foreach (Transform child in contenedorTematicas) Destroy(child.gameObject);

        if (todosLosModelos.Count == 0) return;

        // 2. Extraer todas las temáticas únicas omitiendo vacías
        var tematicasUnicas = todosLosModelos
            .Select(m => m.tematica)
            .Where(t => !string.IsNullOrEmpty(t))
            .Distinct()
            .OrderBy(t => t)
            .ToList();

        // 3. Crear Chip de "Todas"
        ControladorIdioma ci = FindObjectOfType<ControladorIdioma>();
        string strTodos = ci != null ? ci.msgTodos : "Todos";
        CrearChipInstancia(strTodos, "");

        // 4. Crear los demás chips
        foreach (string t in tematicasUnicas) CrearChipInstancia(t, t);
    }

    private void CrearChipInstancia(string etiquetaVisiva, string valorTematica)
    {
        GameObject chip = Instantiate(prefabChipTematica, contenedorTematicas);
        chip.GetComponentInChildren<TextMeshProUGUI>().text = etiquetaVisiva;
        
        Button btn = chip.GetComponent<Button>();
        btn.onClick.AddListener(() => {
            tematicaActiva = valorTematica;
            FiltrarGaleria(inputBuscador != null ? inputBuscador.text : "");
        });
    }

    private void FiltrarGaleria(string terminoBusqueda)
    {
        // 1. Limpiar cuadrícula
        foreach (Transform child in contenedorTarjetas) Destroy(child.gameObject);

        // 2. Filtrar
        string termLower = terminoBusqueda.ToLower();
        var filtrados = todosLosModelos.Where(m => 
            (string.IsNullOrEmpty(tematicaActiva) || m.tematica == tematicaActiva) &&
            (m.nombre.ToLower().Contains(termLower) || m.nombre_cientifico.ToLower().Contains(termLower))
        ).ToList();

        // 3. Crear Tarjetas
        foreach (var modelo in filtrados)
        {
            GameObject tarjeta = Instantiate(prefabTarjetaEspecie, contenedorTarjetas);
            
            // Buscar textos por nombre para evitar equivocarse con el texto por defecto del botón
            TextMeshProUGUI[] textos = tarjeta.GetComponentsInChildren<TextMeshProUGUI>();
            foreach (var txt in textos)
            {
                string nombreObj = txt.gameObject.name.ToLower();
                
                // Reconocer capa "común" con o sin tilde
                if (nombreObj.Contains("común") || nombreObj.Contains("comun") || nombreObj.Contains("tmp") || nombreObj == "text" || nombreObj == "titulo")
                {
                    txt.text = modelo.nombre;
                }

                // Reconocer capa "científico" con o sin tilde
                if (nombreObj.Contains("científico") || nombreObj.Contains("cientifico") || nombreObj == "subtitulo")
                {
                    txt.text = $"<i>{modelo.nombre_cientifico}</i>";
                }
            }
            
            // Buscar foto si existe
            Image img = tarjeta.GetComponentInChildren<Image>();
            if (img != null && System.IO.File.Exists(modelo.rutaFotoLocal))
            {
                byte[] bytes = System.IO.File.ReadAllBytes(modelo.rutaFotoLocal);
                Texture2D tex = new Texture2D(2, 2);
                if (tex.LoadImage(bytes))
                {
                    img.sprite = Sprite.Create(tex, new Rect(0, 0, tex.width, tex.height), new Vector2(0.5f, 0.5f));
                }
            }

            // Click -> Visor 3D
            Button btn = tarjeta.GetComponent<Button>();
            if (btn != null)
            {
                btn.onClick.AddListener(() => {
                    Visor3DAutonomo.Instancia.CargarModeloLocal(modelo);
                });
            }
        }
    }
}