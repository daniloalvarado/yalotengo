using UnityEngine;
using TMPro;
using UnityEngine.UI;
using System.Collections;
using System.Collections.Generic;

public class ControladorInfo : MonoBehaviour
{
    [Header("UI")]
    public TextMeshProUGUI txtNombre, txtTaxonomia, txtDescripcion, txtFlechitaBoton;
    public Button btnAgrandar;
    public Button btnDescargar;
    public GameObject panelInformacion; 
    public GameObject modalExitoDescarga; // Animación o Pop-up visual cuando la descarga termina
    public float margenBordes = 50f;
    // Variables de control interno
    private bool vistaInmersiva = false;
    private RectTransform rectBoton;
    private Vector2 posOriginal, anchorMinOriginal, anchorMaxOriginal, pivotOriginal;
    private CanvasGroup panelCanvasGroup;
    
    // UI Dinámica para descarga
    private GameObject objDescargandoDinamico;
    private Coroutine rutinaDescargando;

    // --- DICCIONARIOS DE TRADUCCIÓN ---
    
    
    
    
    
    void Awake()
    {
        if (btnAgrandar != null)
        {
            rectBoton = btnAgrandar.GetComponent<RectTransform>();
            posOriginal = rectBoton.anchoredPosition;
            anchorMinOriginal = rectBoton.anchorMin;
            anchorMaxOriginal = rectBoton.anchorMax;
            pivotOriginal = rectBoton.pivot;

            btnAgrandar.onClick.AddListener(AlternarVista);
            btnAgrandar.gameObject.SetActive(false);
        }

        if (btnDescargar != null)
        {
            btnDescargar.onClick.AddListener(() => {
                if (GestorColeccionLocal.Instancia != null) {
                    GestorColeccionLocal.Instancia.BotonUI_DescargarModelo();
                }
            });
            btnDescargar.gameObject.SetActive(false);
        }
        
        if (panelInformacion != null && !panelInformacion.TryGetComponent(out panelCanvasGroup))
            panelCanvasGroup = panelInformacion.AddComponent<CanvasGroup>();
        
        LimpiarPanel();
    }

    public void MostrarDatosFirebase(LectorApiAR.ModeloResponse datos, GameObject modelo3DEscaneado, bool animarTexto = true)
    {
        // 1. SI LLEGAN DATOS DE TEXTO (Paso 1 del LectorApi)
        if (datos != null && animarTexto)
        {
            // --- NUEVO: Forzar reseteo del Scroll siempre que lleguen nuevos datos ---
            if (panelInformacion != null)
            {
                ScrollRect scroll = panelInformacion.GetComponentInChildren<ScrollRect>();
                if (scroll != null) scroll.verticalNormalizedPosition = 1f;
            }

            // === DEBUG CRÍTICO: ¿Llega la fuente desde el JSON? ===
            Debug.Log($"[AR-DEBUG] nombre={datos.nombre}, fuente={(datos.fuente ?? "NULL")}, desc_len={datos.descripcion?.Length}");
            
            string nombreDefinitivo = datos.nombre;
            string taxonomiaDefinitiva = datos.taxonomia;
            string descripcionDefinitiva = datos.descripcion;

            string idiomaActual = PlayerPrefs.GetString("IdiomaSeleccionado", "es").ToLower();
            
            // --- LÓGICA DE TRADUCCIÓN CON FALLBACK ---
            LectorApiAR.Traduccion traduccion = null;
            
            // Solo buscamos traducciones si el idioma NO es el base (Español)
            if (idiomaActual != "es" && datos.traducciones != null)
            {
                // 1. Intentamos buscar el idioma seleccionado
                foreach (var t in datos.traducciones)
                {
                    if (t.language_code.ToLower() == idiomaActual)
                    {
                        traduccion = t;
                        break;
                    }
                }

                // 2. Si NO existe (ej: Italiano), buscamos en INGLÉS como backup (siempre que no estemos ya en inglés)
                if (traduccion == null && idiomaActual != "en")
                {
                    foreach (var t in datos.traducciones)
                    {
                        if (t.language_code.ToLower() == "en")
                        {
                            traduccion = t;
                            break;
                        }
                    }
                }
            }

            // 3. Aplicamos la traducción encontrada
            if (traduccion != null)
            {
                if (!string.IsNullOrEmpty(traduccion.name)) nombreDefinitivo = traduccion.name;
                if (!string.IsNullOrEmpty(traduccion.descripcion)) descripcionDefinitiva = traduccion.descripcion;
            }

            // --- AGREGAR FUENTE AL FINAL DE LA DESCRIPCIÓN ---
            if (!string.IsNullOrEmpty(datos.fuente))
              {
                  string tagFuente = "Fuente:";
                  if (idiomaActual != "es" && LectorApiAR.DiccionarioUI != null && LectorApiAR.DiccionarioUI.ContainsKey(idiomaActual)) {
                      var d = LectorApiAR.DiccionarioUI[idiomaActual];
                      if (d.ContainsKey("lbl_fuente")) tagFuente = d["lbl_fuente"];
                  }
                  // Añadimos la fuente al final de la descripción en itálica
                descripcionDefinitiva += $"\n\n<i>{tagFuente} {datos.fuente}</i>";
            }

            // --- TRADUCCIÓN DE TAXONOMÍA DINÁMICA ---
              taxonomiaDefinitiva = TraducirTaxonomiaDinamica(taxonomiaDefinitiva);

            // --- PREPARACIÓN DE TEXTOS PARA EL EFECTO ---
            string tituloCompleto = "";

            // --- CHIP DE TEMÁTICA ---
            if (!string.IsNullOrEmpty(datos.tematica))
            {
                string[] palabras = datos.tematica.ToUpper().Split(' ');
                string tematicaChips = "";
                
                for (int i = 0; i < palabras.Length; i++)
                {
                    // Truco definitivo 4.0: Eliminar los guiones transparentes que causan problemas en móviles.
                    // En su lugar, usamos el atributo nativo 'padding' de TextMeshPro y reducimos levemente el tamaño.
                    tematicaChips += $"<size=85%><nobr><mark=#10b98150 padding=\"30,30,0,0\"><color=#064e3b><b>{palabras[i]}</b></color></mark></nobr></size>";
                    
                    if (i < palabras.Length - 1) tematicaChips += "\n"; // Bajamos de renglón cada palabra para simetría total
                }
                
                tituloCompleto += $"<align=center>{tematicaChips}</align>\n<size=50%>\n</size>";
            }

            tituloCompleto += nombreDefinitivo;
            
            // Verificamos que tenga nombre científico y no sea exactamente igual al nombre común
            if (!string.IsNullOrEmpty(datos.nombre_cientifico) && nombreDefinitivo.ToLower() != datos.nombre_cientifico.ToLower())
            {
                // Solo el nombre científico va entre paréntesis y en itálica
                tituloCompleto += " <i>(" + datos.nombre_cientifico + ")</i>";
            }

            // --- ANIMACIÓN SECUENCIAL DE LOS 3 COMPONENTES ---
            if (txtNombre != null) txtNombre.text = "";
            if (txtTaxonomia != null) txtTaxonomia.text = ""; 
            if (txtDescripcion != null) txtDescripcion.text = "";

            StopAllCoroutines();
            StartCoroutine(TypewriterSecuencial(tituloCompleto, taxonomiaDefinitiva, descripcionDefinitiva));
        }

        // 2. SI LLEGA EL MODELO 3D (Paso 2 del LectorApi)
        if (modelo3DEscaneado != null)
        {
            vistaInmersiva = false;
            if (panelInformacion != null) { panelInformacion.SetActive(true); StartCoroutine(FadePanel(1f, 0.5f)); }
            if (txtFlechitaBoton != null) txtFlechitaBoton.text = "↓"; 
            
            RestaurarBoton();
            if (btnAgrandar != null) btnAgrandar.gameObject.SetActive(true);

            // NUEVO: Activamos y mostramos SIEMPRE el botón de descarga
            if (btnDescargar == null) 
            {
                Debug.Log("[INFO] Botón de descargar no asignado (normal en galería).");
            }
            else if (datos == null) 
            {
                Debug.LogError("[CRÍTICO] Los metadatos son nulos. El botón no puede activar.");
            }
            else 
            {
                Debug.Log("¡Activando el botón de descargar por código!");
                btnDescargar.gameObject.SetActive(true); // Forzamos a que aparezca siempre sí o sí
                
                string idCheck = datos.nombre_cientifico;
                if (string.IsNullOrEmpty(idCheck)) idCheck = datos.nombre;

                if (GestorColeccionLocal.Instancia != null && GestorColeccionLocal.Instancia.YaEstaDescargado(idCheck))
                {
                    btnDescargar.interactable = false; // Ya lo tiene, así que lo mostramos gris
                }
                else
                {
                    btnDescargar.interactable = true; // Lo puede clickear
                }
            }
        }
    }

    /// <summary>
    /// NUEVO: Muestra un mensaje de error claro en el panel de información
    /// </summary>
    public void MostrarError(string titulo, string detalle)
    {
        StopAllCoroutines();
        if (panelInformacion != null) panelInformacion.SetActive(true);
        if (panelCanvasGroup != null) panelCanvasGroup.alpha = 1f;

        if (txtNombre != null) txtNombre.text = $"<color=#FF4D4D>{titulo}</color>";
        if (txtTaxonomia != null) txtTaxonomia.text = detalle;
        if (txtDescripcion != null) txtDescripcion.text = "";

        if (btnAgrandar != null) btnAgrandar.gameObject.SetActive(false);
        if (btnDescargar != null) btnDescargar.gameObject.SetActive(false);
    }

    public void MostrarExitoDescarga()
    {
        if (rutinaDescargando != null) StopCoroutine(rutinaDescargando);
        if (objDescargandoDinamico != null) objDescargandoDinamico.SetActive(false);

        if (btnDescargar != null) {
            btnDescargar.gameObject.SetActive(true); // Reaparece
            btnDescargar.interactable = false;       // Bloqueado
        }

        // Activamos un modal/pop-up flotante que felicite al usuario
        if (modalExitoDescarga != null) {
            modalExitoDescarga.SetActive(true);
        }
    }

    public void OcultarBotonDescarga()
    {
        if (btnDescargar != null) btnDescargar.gameObject.SetActive(false);
    }

    public void DesactivarBotonDescargaTemporalmente()
    {
        if (btnDescargar != null) btnDescargar.gameObject.SetActive(false); // Desaparece
        
        if (rutinaDescargando != null) StopCoroutine(rutinaDescargando);
        rutinaDescargando = StartCoroutine(RutinaMostrarDescargando());
    }

    private IEnumerator RutinaMostrarDescargando()
    {
        // Esperamos medio segundo. Si la descarga es rápida, esto nunca se mostrará.
        yield return new WaitForSeconds(0.5f);

        if (objDescargandoDinamico == null && btnDescargar != null)
        {
            // Creamos un texto por código para no tener que modificar los Prefabs en el editor
            objDescargandoDinamico = new GameObject("Txt_Descargando_Auto");
            objDescargandoDinamico.transform.SetParent(btnDescargar.transform.parent, false);

            TextMeshProUGUI txt = objDescargandoDinamico.AddComponent<TextMeshProUGUI>();
            
            string idiomaActual = PlayerPrefs.GetString("IdiomaSeleccionado", "es").ToLower();
            string texto = "Descargando...";
            if (idiomaActual == "en") texto = "Downloading...";
            else if (idiomaActual == "pt") texto = "Baixando...";
            else if (idiomaActual == "it") texto = "Scaricando...";
            else if (idiomaActual == "fr") texto = "Téléchargement...";

            // Mark negro semitransparente de fondo para que se lea siempre
            txt.text = $"<mark=#000000AA><color=#FFFFFF> {texto} </color></mark>";
            txt.fontSize = 45;
            txt.alignment = TextAlignmentOptions.MidlineRight;

            RectTransform rtBoton = btnDescargar.GetComponent<RectTransform>();
            RectTransform rtTexto = objDescargandoDinamico.GetComponent<RectTransform>();
            
            rtTexto.anchorMin = rtBoton.anchorMin;
            rtTexto.anchorMax = rtBoton.anchorMax;
            rtTexto.pivot = new Vector2(1f, 0.5f); // Crece hacia la izquierda
            rtTexto.anchoredPosition = rtBoton.anchoredPosition;
            rtTexto.sizeDelta = new Vector2(400f, 100f); 
        }

        if (objDescargandoDinamico != null) objDescargandoDinamico.SetActive(true);
    }

    public void ForzarMostrarPanel()
    {
        if (panelInformacion != null) panelInformacion.SetActive(true);
        if (panelCanvasGroup != null) panelCanvasGroup.alpha = 1f;
    }

    private IEnumerator TypewriterSecuencial(string textoNombre, string textoTaxonomia, string textoDescripcion)
    {
        // 1. Limpiamos y preparamos los 3 campos
        if (txtNombre != null) { txtNombre.text = textoNombre; txtNombre.maxVisibleCharacters = 0; }
        
        // --- DINÁMICO: Si no hay taxonomía, ocultamos el objeto para que no ocupe espacio ---
        if (txtTaxonomia != null) { 
            bool tieneTax = !string.IsNullOrEmpty(textoTaxonomia.Trim());
            txtTaxonomia.gameObject.SetActive(tieneTax);
            if (tieneTax) {
                txtTaxonomia.text = textoTaxonomia; 
                txtTaxonomia.maxVisibleCharacters = 0; 
            }
        }

        if (txtDescripcion != null) { txtDescripcion.text = textoDescripcion; txtDescripcion.maxVisibleCharacters = 0; }
        
        yield return new WaitForSeconds(0.3f);
        
        // 2. Animamos en orden: Nombre -> Taxonomía (si existe) -> Descripción
        if (txtNombre) { txtNombre.ForceMeshUpdate(); yield return AnimarTexto(txtNombre); }
        if (txtTaxonomia && txtTaxonomia.gameObject.activeSelf) { txtTaxonomia.ForceMeshUpdate(); yield return AnimarTexto(txtTaxonomia); }
        if (txtDescripcion) { txtDescripcion.ForceMeshUpdate(); yield return AnimarTexto(txtDescripcion); }
    }

    private IEnumerator AnimarTexto(TextMeshProUGUI txt)
    {
        int total = txt.textInfo.characterCount;
        for (int i = 0; i <= total; i += 2)
        {
            txt.maxVisibleCharacters = i;
            yield return new WaitForSeconds(0.005f); 
        }
        txt.maxVisibleCharacters = 99999;
    }

    

    // --- TRADUCCIÓN OPTIMIZADA DINÁMICA ---
    private string TraducirTaxonomiaDinamica(string texto)
    {
        if (string.IsNullOrEmpty(texto)) return texto;
        string codigo = PlayerPrefs.GetString("IdiomaSeleccionado", "es").ToLower();
        if (codigo == "es" || LectorApiAR.DiccionarioUI == null || !LectorApiAR.DiccionarioUI.ContainsKey(codigo)) return texto;

        var d = LectorApiAR.DiccionarioUI[codigo];
        
        // Extraemos las etiquetas de la base de datos
        if (d.ContainsKey("lbl_reino")) texto = texto.Replace("Reino:", d["lbl_reino"]);
        if (d.ContainsKey("lbl_filo")) texto = texto.Replace("Filo:", d["lbl_filo"]);
        if (d.ContainsKey("lbl_clase")) texto = texto.Replace("Clase:", d["lbl_clase"]);
        if (d.ContainsKey("lbl_orden")) texto = texto.Replace("Orden:", d["lbl_orden"]);
        if (d.ContainsKey("lbl_familia")) texto = texto.Replace("Familia:", d["lbl_familia"]);
        if (d.ContainsKey("lbl_genero")) texto = texto.Replace("Género:", d["lbl_genero"]);

        return texto;
    }

    private IEnumerator FadePanel(float targetAlpha, float duration)
    {
        if (panelCanvasGroup == null) yield break;

        float startAlpha = panelCanvasGroup.alpha;
        float time = 0;

        while (time < duration)
        {
            time += Time.deltaTime;
            panelCanvasGroup.alpha = Mathf.Lerp(startAlpha, targetAlpha, time / duration);
            yield return null;
        }
        panelCanvasGroup.alpha = targetAlpha;

        if (targetAlpha == 0f) panelInformacion.SetActive(false);
    }

    public void AlternarVista()
    {
        vistaInmersiva = !vistaInmersiva; 

        StopAllCoroutines(); // Detener otras animaciones en curso
        if (txtDescripcion != null) txtDescripcion.maxVisibleCharacters = 99999; // Forzar que se lea todo si se interrumpe
        if (txtTaxonomia != null) txtTaxonomia.maxVisibleCharacters = 99999; // Forzar que se lea todo si se interrumpe

        if (vistaInmersiva)
        {
            // MODO INMERSIVO: Fade Out al panel y cambiamos flecha
            if (panelInformacion != null) StartCoroutine(FadePanel(0f, 0.3f));
            if (txtFlechitaBoton != null) txtFlechitaBoton.text = "↑";
            
            // Animamos deslizando el botón a la esquina INFERIOR DERECHA
            if (rectBoton != null)
            {
                // 1. Anclajes matemáticos a la Derecha (X=1) y Abajo (Y=0)
                Vector2 targetAnchorMin = new Vector2(1, 0); 
                Vector2 targetAnchorMax = new Vector2(1, 0); 
                Vector2 targetPivot = new Vector2(1, 0); 
                
                // 2. Nos separamos del borde. La 'X' es negativa para empujarlo hacia la izquierda (hacia adentro de la pantalla)
                Vector2 targetPos = new Vector2(-margenBordes, margenBordes);
                
                // 3. ¡Iniciamos la animación! (0.4f es la velocidad)
                StartCoroutine(AnimarBoton(targetAnchorMin, targetAnchorMax, targetPivot, targetPos, 0.4f));
            }
        }
        else
        {
            if (panelInformacion) { panelInformacion.SetActive(true); StartCoroutine(FadePanel(1f, 0.3f)); }
            if (txtFlechitaBoton) txtFlechitaBoton.text = "↓";
            if (rectBoton) StartCoroutine(AnimarBoton(anchorMinOriginal, anchorMaxOriginal, pivotOriginal, posOriginal, 0.4f));
        }
    }

    private IEnumerator AnimarBoton(Vector2 targetAnchorMin, Vector2 targetAnchorMax, Vector2 targetPivot, Vector2 targetPos, float duration)
    {
        float time = 0;
        Vector2 startAnchorMin = rectBoton.anchorMin;
        Vector2 startAnchorMax = rectBoton.anchorMax;
        Vector2 startPivot = rectBoton.pivot;
        Vector2 startPos = rectBoton.anchoredPosition;

        while (time < duration)
        {
            time += Time.deltaTime;
            float t = Mathf.SmoothStep(0f, 1f, time / duration);

            rectBoton.anchorMin = Vector2.Lerp(startAnchorMin, targetAnchorMin, t);
            rectBoton.anchorMax = Vector2.Lerp(startAnchorMax, targetAnchorMax, t);
            rectBoton.pivot = Vector2.Lerp(startPivot, targetPivot, t);
            rectBoton.anchoredPosition = Vector2.Lerp(startPos, targetPos, t);
            
            yield return null;
        }

        rectBoton.anchorMin = targetAnchorMin;
        rectBoton.anchorMax = targetAnchorMax;
        rectBoton.pivot = targetPivot;
        rectBoton.anchoredPosition = targetPos;
    }

    public void LimpiarPanel()
    {
        if (rutinaDescargando != null) StopCoroutine(rutinaDescargando);
        if (objDescargandoDinamico != null) objDescargandoDinamico.SetActive(false);

        if (txtNombre != null) 
        {
            ControladorIdioma ci = FindObjectOfType<ControladorIdioma>();
            txtNombre.text = (ci != null) ? ci.GetPlaceholderText() : "Escanea un animal...";
        }
        if (txtTaxonomia != null) 
        {
            txtTaxonomia.text = "";
            txtTaxonomia.maxVisibleCharacters = 99999;
        }
        if (txtDescripcion != null) 
        {
            txtDescripcion.text = "";
            txtDescripcion.maxVisibleCharacters = 99999;
        }
        
        if (btnAgrandar != null) btnAgrandar.gameObject.SetActive(false);
        if (btnDescargar != null) btnDescargar.gameObject.SetActive(false);
        
        if (panelInformacion != null)
        {
            panelInformacion.SetActive(true);
            if (panelCanvasGroup != null) panelCanvasGroup.alpha = 1f;
            
            // --- NUEVO: Resetear la posición del Scroll al inicio ---
            ScrollRect scroll = panelInformacion.GetComponentInChildren<ScrollRect>();
            if (scroll != null)
            {
                // 1f significa "arriba de todo"
                scroll.verticalNormalizedPosition = 1f;
            }
        }
        
        RestaurarBoton();
    }

    private void RestaurarBoton()
    {
        // Esta función devuelve el botón exactamente a como lo dejaste en Unity
        if (rectBoton != null)
        {
            rectBoton.anchorMin = anchorMinOriginal;
            rectBoton.anchorMax = anchorMaxOriginal;
            rectBoton.pivot = pivotOriginal;
            rectBoton.anchoredPosition = posOriginal;
        }
    }
}