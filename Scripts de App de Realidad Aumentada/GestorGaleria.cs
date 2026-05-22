using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Globalization;

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
    private GameObject objMensajeVacio; // Para mostrar mensaje cuando la galería está vacía

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
        foreach (string t in tematicasUnicas) {
            string etiquetaTraducida = TraducirTematica(t);
            CrearChipInstancia(etiquetaTraducida, t);
        }

        // 5. Aplicar colores iniciales ("Todos" empieza seleccionado)
        ActualizarColoresChips();
    }

    private string TraducirTematica(string original)
    {
        if (string.IsNullOrEmpty(original)) return original;
        string idiomaActivo = PlayerPrefs.GetString("IdiomaSeleccionado", "es").ToLower();
        if (idiomaActivo == "es") return original;

        // Replicar la lógica de key_name del backend (tema_...)
        string normalized = original.Trim().ToLower().Normalize(NormalizationForm.FormD);
        StringBuilder sb = new StringBuilder();
        foreach (char c in normalized) {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark) sb.Append(c);
        }
        string sinAcentos = sb.ToString();
        string cleanKey = Regex.Replace(sinAcentos, @"[^a-z0-9]", "_");
        string finalKey = "tema_" + cleanKey;

        if (LectorApiAR.DiccionarioUI != null && LectorApiAR.DiccionarioUI.ContainsKey(idiomaActivo))
        {
            if (LectorApiAR.DiccionarioUI[idiomaActivo].ContainsKey(finalKey))
            {
                return LectorApiAR.DiccionarioUI[idiomaActivo][finalKey];
            }
        }
        return original;
    }

    private void CrearChipInstancia(string etiquetaVisiva, string valorTematica)
    {
        GameObject chip = Instantiate(prefabChipTematica, contenedorTematicas);
        chip.GetComponentInChildren<TextMeshProUGUI>().text = etiquetaVisiva;
        chip.name = "Chip_" + valorTematica; // Para identificar cuál es cuál
        
        // --- PULIDO: Fuente grande + caja adaptable al texto ---
        TextMeshProUGUI txtChipRef = chip.GetComponentInChildren<TextMeshProUGUI>();
        if (txtChipRef != null) 
        { 
            txtChipRef.fontSize = 46; 
            txtChipRef.enableAutoSizing = false;
        }
        // Calcular el ancho real que necesita el texto + padding
        RectTransform rtChip = chip.GetComponent<RectTransform>();
        if (rtChip != null && txtChipRef != null)
        {
            txtChipRef.ForceMeshUpdate(); // Forzar cálculo del tamaño del texto
            float anchoTexto = txtChipRef.GetPreferredValues(etiquetaVisiva).x;
            float anchoFinal = anchoTexto + 50f; // 25px de padding a cada lado
            if (anchoFinal < 160f) anchoFinal = 160f; // Mínimo 160px
            rtChip.sizeDelta = new Vector2(anchoFinal, 80);
        }

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

        // Limpiar mensaje vacío anterior si existe
        if (objMensajeVacio != null) Destroy(objMensajeVacio);

        // Si está vacía, mostramos mensaje
        if (filtrados.Count == 0)
        {
            objMensajeVacio = new GameObject("TxtMensajeVacio");
            // Lo anclamos al padre del grid (usualmente el Viewport o ScrollRect) para que no sea afectado por el LayoutGroup
            objMensajeVacio.transform.SetParent(contenedorTarjetas.parent, false);
            
            TextMeshProUGUI txtMsg = objMensajeVacio.AddComponent<TextMeshProUGUI>();
            
            string idiomaActual = PlayerPrefs.GetString("IdiomaSeleccionado", "es").ToLower();
            string msgVacia = "¡Aún no hay modelos descargados!";
            string msgSinResultados = "No se encontraron modelos con esa búsqueda";

            if (idiomaActual == "en")
            {
                msgVacia = "No downloaded models yet!";
                msgSinResultados = "No models found for this search";
            }
            else if (idiomaActual == "pt")
            {
                msgVacia = "Nenhum modelo baixado ainda!";
                msgSinResultados = "Nenhum modelo encontrado";
            }

            if (LectorApiAR.DiccionarioUI != null && LectorApiAR.DiccionarioUI.ContainsKey(idiomaActual))
            {
                var d = LectorApiAR.DiccionarioUI[idiomaActual];
                if (d.ContainsKey("txtGaleriaVacia")) msgVacia = d["txtGaleriaVacia"];
                if (d.ContainsKey("txtGaleriaSinResultados")) msgSinResultados = d["txtGaleriaSinResultados"];
            }

            if (todosLosModelos.Count == 0)
            {
                txtMsg.text = msgVacia;
            }
            else
            {
                txtMsg.text = msgSinResultados;
            }

            txtMsg.fontSize = 45;
            txtMsg.color = Color.white; // Blanco brillante para que resalte sobre el fondo oscuro
            txtMsg.fontStyle = FontStyles.Bold; // Negrita para mayor legibilidad
            txtMsg.alignment = TextAlignmentOptions.Center;
            txtMsg.enableWordWrapping = true;
            
            RectTransform rtMsg = objMensajeVacio.GetComponent<RectTransform>();
            // Anclamos al centro horizontal (0.5) y bastante más arriba de la mitad (0.75)
            rtMsg.anchorMin = new Vector2(0.5f, 0.75f);
            rtMsg.anchorMax = new Vector2(0.5f, 0.75f);
            rtMsg.pivot = new Vector2(0.5f, 0.5f);
            // Le damos un tamaño fijo de ancho para que el texto salte de línea si es necesario
            rtMsg.sizeDelta = new Vector2(900, 300);
            rtMsg.anchoredPosition = Vector2.zero;
            return;
        }

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
                    txt.fontSize = 44; // Fuente grande para el nombre común
                    txt.enableWordWrapping = true;
                    txt.overflowMode = TextOverflowModes.Ellipsis;
                    txt.maxVisibleLines = 2;
                }

                // Reconocer capa "científico" con o sin tilde
                if (nombreObj.Contains("científico") || nombreObj.Contains("cientifico") || nombreObj == "subtitulo")
                {
                    txt.text = $"<i>{modelo.nombre_cientifico}</i>";
                    txt.fontSize = 40; // Fuente para el nombre científico
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

            // --- BOTÓN ELIMINAR en esquina superior derecha ---
            CrearBotonEliminar(tarjeta, modelo);
        }
    }

    private void CrearBotonEliminar(GameObject tarjeta, ResumenColeccion modelo)
    {
        // Crear botón como ÚLTIMO hijo (se dibuja encima de todo)
        GameObject btnObj = new GameObject("BtnEliminar");
        btnObj.transform.SetParent(tarjeta.transform, false);

        // Añadir RectTransform
        RectTransform rt = btnObj.AddComponent<RectTransform>();
        rt.anchorMin = new Vector2(1, 1); // Esquina superior derecha
        rt.anchorMax = new Vector2(1, 1);
        rt.pivot = new Vector2(1, 1);
        rt.anchoredPosition = new Vector2(-8, -8);
        rt.sizeDelta = new Vector2(70, 70);

        // Fondo rojo
        Image imgBg = btnObj.AddComponent<Image>();
        imgBg.color = new Color(0.85f, 0.15f, 0.15f, 0.9f);
        imgBg.raycastTarget = true; // Importante: captura el toque

        // Texto "X"
        GameObject txtObj = new GameObject("TxtX");
        txtObj.transform.SetParent(btnObj.transform, false);
        RectTransform rtTxt = txtObj.AddComponent<RectTransform>();
        rtTxt.anchorMin = Vector2.zero;
        rtTxt.anchorMax = Vector2.one;
        rtTxt.offsetMin = Vector2.zero;
        rtTxt.offsetMax = Vector2.zero;
        
        TextMeshProUGUI txtX = txtObj.AddComponent<TextMeshProUGUI>();
        txtX.text = "X";
        txtX.fontSize = 36;
        txtX.fontStyle = TMPro.FontStyles.Bold;
        txtX.color = Color.white;
        txtX.alignment = TMPro.TextAlignmentOptions.Center;
        txtX.enableAutoSizing = false;
        txtX.raycastTarget = false; // El fondo captura, no el texto

        // Click -> Mostrar modal de confirmación
        Button btnElim = btnObj.AddComponent<Button>();
        btnElim.targetGraphic = imgBg;
        
        var modeloCap = modelo;
        btnElim.onClick.AddListener(() => {
            MostrarModalConfirmacion(modeloCap);
        });
    }

    private void MostrarModalConfirmacion(ResumenColeccion modelo)
    {
        // --- FONDO OSCURO que cubre toda la pantalla ---
        GameObject modal = new GameObject("ModalConfirmacion");
        Canvas canvasRaiz = GetComponentInParent<Canvas>();
        if (canvasRaiz == null) canvasRaiz = FindObjectOfType<Canvas>();
        modal.transform.SetParent(canvasRaiz.transform, false);

        RectTransform rtModal = modal.AddComponent<RectTransform>();
        rtModal.anchorMin = Vector2.zero;
        rtModal.anchorMax = Vector2.one;
        rtModal.offsetMin = Vector2.zero;
        rtModal.offsetMax = Vector2.zero;

        Image fondoOscuro = modal.AddComponent<Image>();
        fondoOscuro.color = new Color(0, 0, 0, 0.7f);
        fondoOscuro.raycastTarget = true;

        // --- CAJA BLANCA CENTRAL ---
        GameObject caja = new GameObject("CajaModal");
        caja.transform.SetParent(modal.transform, false);
        RectTransform rtCaja = caja.AddComponent<RectTransform>();
        rtCaja.anchorMin = new Vector2(0.5f, 0.5f);
        rtCaja.anchorMax = new Vector2(0.5f, 0.5f);
        rtCaja.pivot = new Vector2(0.5f, 0.5f);
        rtCaja.sizeDelta = new Vector2(700, 400);
        Image imgCaja = caja.AddComponent<Image>();
        imgCaja.color = new Color(0.15f, 0.15f, 0.15f, 0.95f);

        // --- TEXTO DE PREGUNTA ---
        GameObject txtPregObj = new GameObject("TxtPregunta");
        txtPregObj.transform.SetParent(caja.transform, false);
        RectTransform rtPreg = txtPregObj.AddComponent<RectTransform>();
        rtPreg.anchorMin = new Vector2(0.05f, 0.5f);
        rtPreg.anchorMax = new Vector2(0.95f, 0.95f);
        rtPreg.offsetMin = Vector2.zero;
        rtPreg.offsetMax = Vector2.zero;
        TextMeshProUGUI txtPreg = txtPregObj.AddComponent<TextMeshProUGUI>();
        string strTitulo = "¿Eliminar <b>" + modelo.nombre + "</b> permanentemente?";
        string codigo = PlayerPrefs.GetString("IdiomaSeleccionado", "es").ToLower();
        if (LectorApiAR.DiccionarioUI != null && LectorApiAR.DiccionarioUI.ContainsKey(codigo)) {
            var d = LectorApiAR.DiccionarioUI[codigo];
            if (d.ContainsKey("txtEliminarTitulo")) strTitulo = d["txtEliminarTitulo"].Replace("este modelo", "<b>" + modelo.nombre + "</b>");
        }
        txtPreg.text = strTitulo;
        txtPreg.fontSize = 44; // Aumentado para mejor legibilidad
        txtPreg.color = Color.white;
        txtPreg.alignment = TMPro.TextAlignmentOptions.Center;
        txtPreg.enableAutoSizing = false;
        txtPreg.enableWordWrapping = true;

        // --- BOTÓN "SÍ" (rojo) ---
        string strSi = "Sí, eliminar";
        string strNo = "Cancelar";
        if (LectorApiAR.DiccionarioUI != null && LectorApiAR.DiccionarioUI.ContainsKey(codigo)) {
            var d = LectorApiAR.DiccionarioUI[codigo];
            if (d.ContainsKey("txtEliminarSi")) strSi = d["txtEliminarSi"];
            if (d.ContainsKey("txtEliminarNo")) strNo = d["txtEliminarNo"];
        }

        // --- BOTÓN "SÍ" (rojo) ---
        CrearBotonModal(caja, strSi, new Color(0.85f, 0.15f, 0.15f, 1f), 
            new Vector2(-160, -130), () => {
                GestorColeccionLocal gestor = GestorColeccionLocal.Instancia;
                if (gestor == null) gestor = FindObjectOfType<GestorColeccionLocal>();
                
                if (gestor != null)
                {
                    string idModelo = modelo.nombre_cientifico;
                    if (string.IsNullOrEmpty(idModelo)) idModelo = modelo.nombre;
                    gestor.EliminarModeloLocal(idModelo);
                    CargarColeccionLocales();
                }
                Destroy(modal);
            });

        // --- BOTÓN "NO" (gris) ---
        CrearBotonModal(caja, strNo, new Color(0.4f, 0.4f, 0.4f, 1f), 
            new Vector2(160, -130), () => {
                Destroy(modal);
            });
    }

    private void CrearBotonModal(GameObject padre, string texto, Color color, Vector2 posicion, UnityEngine.Events.UnityAction accion)
    {
        GameObject btnObj = new GameObject("Btn_" + texto);
        btnObj.transform.SetParent(padre.transform, false);
        RectTransform rt = btnObj.AddComponent<RectTransform>();
        rt.anchorMin = new Vector2(0.5f, 0.5f);
        rt.anchorMax = new Vector2(0.5f, 0.5f);
        rt.pivot = new Vector2(0.5f, 0.5f);
        rt.anchoredPosition = posicion;
        rt.sizeDelta = new Vector2(280, 80);

        Image img = btnObj.AddComponent<Image>();
        img.color = color;

        GameObject txtObj = new GameObject("Txt");
        txtObj.transform.SetParent(btnObj.transform, false);
        RectTransform rtTxt = txtObj.AddComponent<RectTransform>();
        rtTxt.anchorMin = Vector2.zero;
        rtTxt.anchorMax = Vector2.one;
        rtTxt.offsetMin = Vector2.zero;
        rtTxt.offsetMax = Vector2.zero;
        TextMeshProUGUI tmp = txtObj.AddComponent<TextMeshProUGUI>();
        tmp.text = texto;
        tmp.fontSize = 38; // Textos de "Sí" y "Cancelar" más grandes
        tmp.fontStyle = TMPro.FontStyles.Bold;
        tmp.color = Color.white;
        tmp.alignment = TMPro.TextAlignmentOptions.Center;
        tmp.enableAutoSizing = false;
        tmp.raycastTarget = false;

        Button btn = btnObj.AddComponent<Button>();
        btn.targetGraphic = img;
        btn.onClick.AddListener(accion);
    }
}