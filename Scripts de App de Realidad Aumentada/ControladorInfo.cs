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

    // --- DICCIONARIOS DE TRADUCCIÓN ---
    private readonly Dictionary<string, string> dictEN = new Dictionary<string, string> {
        {"Reino:", "Kingdom:"}, {"Filo:", "Phylum:"}, {"Subfilo:", "Subphylum:"}, {"Clase:", "Class:"}, 
        {"Subclase:", "Subclass:"}, {"Orden:", "Order:"}, {"Familia:", "Family:"}, {"Género:", "Genus:"}, 
        {"Especie:", "Species:"}, {"Taxonomía", "Taxonomy"}, {"Fuente:", "Source:"}
    };

    private readonly Dictionary<string, string> dictPT = new Dictionary<string, string> {
        {"Reino:", "Reino:"}, {"Filo:", "Filo:"}, {"Subfilo:", "Subfilo:"}, {"Clase:", "Classe:"}, 
        {"Subclase:", "Subclasse:"}, {"Orden:", "Ordem:"}, {"Familia:", "Família:"}, {"Género:", "Gênero:"}, 
        {"Especie:", "Espécie:"}, {"Taxonomía", "Taxonomia"}, {"Fuente:", "Fonte:"}
    };

    private readonly Dictionary<string, string> dictFR = new Dictionary<string, string> {
        {"Reino:", "Règne:"}, {"Filo:", "Phylum:"}, {"Subfilo:", "Sous-embranchement:"}, {"Clase:", "Classe:"}, 
        {"Subclase:", "Sous-classe:"}, {"Orden:", "Ordre:"}, {"Familia:", "Famille:"}, {"Género:", "Genre:"}, 
        {"Especie:", "Espèce:"}, {"Taxonomía", "Taxonomie"}, {"Fuente:", "Source:"}
    };

    private readonly Dictionary<string, string> dictIT = new Dictionary<string, string> {
        {"Reino:", "Regno:"}, {"Filo:", "Phylum:"}, {"Subfilo:", "Subphylum:"}, {"Clase:", "Classe:"}, 
        {"Subclase:", "Sottoclasse:"}, {"Orden:", "Ordine:"}, {"Familia:", "Famiglia:"}, {"Género:", "Genere:"}, 
        {"Especie:", "Specie:"}, {"Taxonomía", "Tassonomia"}, {"Fuente:", "Fonte:"}
    };

    private readonly Dictionary<string, string> dictDE = new Dictionary<string, string> {
        {"Reino:", "Reich:"}, {"Filo:", "Stamm:"}, {"Subfilo:", "Unterstamm:"}, {"Clase:", "Klasse:"}, 
        {"Subclase:", "Unterklasse:"}, {"Orden:", "Ordnung:"}, {"Familia:", "Familie:"}, {"Género:", "Gattung:"}, 
        {"Especie:", "Art:"}, {"Taxonomía", "Taxonomie"}, {"Fuente:", "Quelle:"}
    };

    void Start()
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

    public void MostrarDatosFirebase(LectorApiAR.ModeloResponse datos, GameObject modelo3DEscaneado)
    {
        // 1. SI LLEGAN DATOS DE TEXTO (Paso 1 del LectorApi)
        if (datos != null)
        {
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
                if (idiomaActual != "es")
                {
                    switch (idiomaActual)
                    {
                        case "en": tagFuente = "Source:"; break;
                        case "pt": tagFuente = "Fonte:"; break;
                        case "fr": tagFuente = "Source:"; break;
                        case "it": tagFuente = "Fonte:"; break;
                        case "de": tagFuente = "Quelle:"; break;
                    }
                }
                // Añadimos la fuente al final de la descripción en itálica
                descripcionDefinitiva += $"\n\n<i>{tagFuente} {datos.fuente}</i>";
            }

            // --- TRADUCCIÓN DE TAXONOMÍA (ETIQUETAS) ---
            if (idiomaActual != "es")
            {
                switch (idiomaActual)
                {
                    case "en": taxonomiaDefinitiva = TraducirMulti(taxonomiaDefinitiva, dictEN); break;
                    case "pt": taxonomiaDefinitiva = TraducirMulti(taxonomiaDefinitiva, dictPT); break;
                    case "fr": taxonomiaDefinitiva = TraducirMulti(taxonomiaDefinitiva, dictFR); break;
                    case "it": taxonomiaDefinitiva = TraducirMulti(taxonomiaDefinitiva, dictIT); break;
                    case "de": taxonomiaDefinitiva = TraducirMulti(taxonomiaDefinitiva, dictDE); break;
                }
            }

            // --- PREPARACIÓN DE TEXTOS PARA EL EFECTO ---
            string tituloCompleto = nombreDefinitivo;
            
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
                Debug.LogError("[CRÍTICO] ¡El botón Descargar no aparece porque olvidaste arrastrarlo a la casilla 'Btn Descargar' en el Inspector de ControladorInfo!");
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
        if (btnDescargar != null) {
            btnDescargar.interactable = false;
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

    private IEnumerator TypewriterSecuencial(string textoNombre, string textoTaxonomia, string textoDescripcion)
    {
        // 1. Limpiamos y preparamos los 3 campos
        if (txtNombre != null) { txtNombre.text = textoNombre; txtNombre.maxVisibleCharacters = 0; }
        if (txtTaxonomia != null) { txtTaxonomia.text = textoTaxonomia; txtTaxonomia.maxVisibleCharacters = 0; }
        if (txtDescripcion != null) { txtDescripcion.text = textoDescripcion; txtDescripcion.maxVisibleCharacters = 0; }
        
        yield return new WaitForSeconds(0.3f);
        
        // 2. Animamos en orden: Nombre -> Taxonomía -> Descripción
        if (txtNombre) { txtNombre.ForceMeshUpdate(); yield return AnimarTexto(txtNombre); }
        if (txtTaxonomia) { txtTaxonomia.ForceMeshUpdate(); yield return AnimarTexto(txtTaxonomia); }
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

    // --- TRADUCCIÓN OPTIMIZADA ESTÁTICA ---
    private string TraducirMulti(string texto, Dictionary<string, string> dict)
    {
        if (string.IsNullOrEmpty(texto)) return texto;
        foreach (var par in dict) texto = texto.Replace(par.Key, par.Value);
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