using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections;
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
    private List<GameObject> chipsTematicaInstancias = new List<GameObject>();

    // Colores de Biodiversidad para los chips
    private readonly Color colorChipActivo = new Color(0.18f, 0.49f, 0.20f, 1f);    // Verde bosque #2E7D32
    private readonly Color colorChipInactivo = new Color(0.85f, 0.85f, 0.85f, 1f);   // Gris claro
    private readonly Color colorTextoActivo = Color.white;
    private readonly Color colorTextoInactivo = new Color(0.2f, 0.2f, 0.2f, 1f);

    void OnEnable()
    {
        CargarColeccionLocales();
        
        if (inputBuscador != null)
        {
            inputBuscador.onValueChanged.RemoveAllListeners();
            inputBuscador.onValueChanged.AddListener(FiltrarGaleria);
        }

        // --- AJUSTE DE TEMÁTICAS (CHIPS) ---
        HorizontalLayoutGroup layoutTematicas = contenedorTematicas.GetComponent<HorizontalLayoutGroup>();
        if (layoutTematicas != null)
        {
            layoutTematicas.spacing = 10;
            layoutTematicas.childControlWidth = false;
            layoutTematicas.childForceExpandWidth = false;
            layoutTematicas.childAlignment = TextAnchor.MiddleLeft;
        }

        // Forzar que el contenedor de temáticas ocupe todo el ancho desde la IZQUIERDA
        RectTransform rectTematicas = contenedorTematicas.GetComponent<RectTransform>();
        if (rectTematicas != null)
        {
            rectTematicas.anchorMin = new Vector2(0, 0);      // Izquierda-Abajo
            rectTematicas.anchorMax = new Vector2(1, 1);      // Derecha-Arriba (stretch completo)
            rectTematicas.pivot = new Vector2(0, 0.5f);       // Pivote a la izquierda
            rectTematicas.offsetMin = new Vector2(0, rectTematicas.offsetMin.y);  // Sin margen izquierdo
            rectTematicas.offsetMax = new Vector2(0, rectTematicas.offsetMax.y);  // Sin margen derecho
        }

        // --- AJUSTE DINÁMICO DE TARJETAS (esperamos 1 frame para que rect.width sea real) ---
        StartCoroutine(AjustarGridDespuesDeLayout());
    }

    private IEnumerator AjustarGridDespuesDeLayout()
    {
        // Esperamos al final del frame para que Unity calcule las dimensiones reales del RectTransform
        yield return new WaitForEndOfFrame();

        GridLayoutGroup grid = contenedorTarjetas.GetComponent<GridLayoutGroup>();
        if (grid != null)
        {
            RectTransform rectContenedor = contenedorTarjetas.GetComponent<RectTransform>();
            
            // Forzamos 2 columnas exactas
            grid.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
            grid.constraintCount = 2;
            grid.startCorner = GridLayoutGroup.Corner.UpperLeft;
            grid.childAlignment = TextAnchor.UpperLeft;

            // Espaciado entre tarjetas: 10px horizontal, 20px vertical
            grid.spacing = new Vector2(10, 20);

            // Calculamos el ancho de cada celda para que 2 quepan perfectamente
            float paddingTotal = grid.padding.left + grid.padding.right;
            float anchoDisponible = rectContenedor.rect.width - paddingTotal - grid.spacing.x;
            
            // Si rect.width aún es 0 (caso raro), usamos Screen.width como respaldo
            if (anchoDisponible <= 0)
            {
                anchoDisponible = Screen.width - paddingTotal - grid.spacing.x;
            }

            float anchoCelda = anchoDisponible / 2f;
            grid.cellSize = new Vector2(anchoCelda, anchoCelda * 1.4f); // Proporción 1:1.4 (más alta que ancha)
            
            Debug.Log($"[GALERÍA] Grid ajustado: celda={grid.cellSize}, contenedor={rectContenedor.rect.width}px");
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
        chipsTematicaInstancias.Clear();

        Debug.Log("[GALERÍA] Modelos cargados para chips: " + todosLosModelos.Count);
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

        // 5. Aplicar colores iniciales ("Todos" empieza seleccionado)
        ActualizarColoresChips();
    }

    private void CrearChipInstancia(string etiquetaVisiva, string valorTematica)
    {
        GameObject chip = Instantiate(prefabChipTematica, contenedorTematicas);
        chip.GetComponentInChildren<TextMeshProUGUI>().text = etiquetaVisiva;
        chip.name = "Chip_" + valorTematica; // Para identificar cuál es cuál
        
        chipsTematicaInstancias.Add(chip);

        Button btn = chip.GetComponent<Button>();
        btn.onClick.AddListener(() => {
            tematicaActiva = valorTematica;
            ActualizarColoresChips();
            FiltrarGaleria(inputBuscador != null ? inputBuscador.text : "");
        });
    }

    private void ActualizarColoresChips()
    {
        for (int i = 0; i < chipsTematicaInstancias.Count; i++)
        {
            GameObject chip = chipsTematicaInstancias[i];
            if (chip == null) continue;

            // El primer chip siempre es "Todos" (valorTematica = "")
            string valorDeEsteChip = (i == 0) ? "" : chip.name.Replace("Chip_", "");
            bool estaSeleccionado = (valorDeEsteChip == tematicaActiva);

            // Cambiar color del fondo (Image del chip)
            Image imgChip = chip.GetComponent<Image>();
            if (imgChip != null)
            {
                imgChip.color = estaSeleccionado ? colorChipActivo : colorChipInactivo;
            }

            // Cambiar color del texto
            TextMeshProUGUI txtChip = chip.GetComponentInChildren<TextMeshProUGUI>();
            if (txtChip != null)
            {
                txtChip.color = estaSeleccionado ? colorTextoActivo : colorTextoInactivo;
            }
        }
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
                    txt.enableWordWrapping = true;
                    txt.overflowMode = TextOverflowModes.Ellipsis;
                    txt.maxVisibleLines = 2;
                }

                // Reconocer capa "científico" con o sin tilde
                if (nombreObj.Contains("científico") || nombreObj.Contains("cientifico") || nombreObj == "subtitulo")
                {
                    txt.text = $"<i>{modelo.nombre_cientifico}</i>";
                    txt.enableWordWrapping = true;
                    txt.overflowMode = TextOverflowModes.Ellipsis;
                    txt.maxVisibleLines = 1;
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
                // Capturamos la referencia local para el closure
                var modeloCapturado = modelo;
                btn.onClick.AddListener(() => {
                    // Intentamos encontrar el Visor3DAutonomo de varias formas
                    Visor3DAutonomo visor = Visor3DAutonomo.Instancia;
                    
                    if (visor == null)
                    {
                        visor = FindObjectOfType<Visor3DAutonomo>();
                        Debug.LogWarning("[GALERÍA] Visor3DAutonomo.Instancia era NULL. Buscando con FindObjectOfType: " + (visor != null ? "ENCONTRADO" : "NO ENCONTRADO"));
                    }

                    if (visor != null)
                    {
                        Debug.Log("[GALERÍA] Abriendo modelo local: " + modeloCapturado.nombre + " | Ruta: " + modeloCapturado.rutaModeloLocal);
                        visor.CargarModeloLocal(modeloCapturado);
                    }
                    else
                    {
                        Debug.LogError("[GALERÍA] ¡ERROR CRÍTICO! No se encontró ningún Visor3DAutonomo en la escena. Asegúrate de que existe un GameObject con el script Visor3DAutonomo en la escena del Menú Principal.");
                    }
                });
            }
        }
    }
}