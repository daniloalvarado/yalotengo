using UnityEngine;
using TMPro;
using System.Collections.Generic;

public class ControladorIdioma : MonoBehaviour
{
    [Header("--- PANEL LOGIN ---")]
    public TextMeshProUGUI txtLoginTitulo;
    public TextMeshProUGUI txtLoginBtnGoogle;
    public TextMeshProUGUI txtLoginPlaceholderNombre;
    public TextMeshProUGUI txtLoginPlaceholderCorreo;
    public TextMeshProUGUI txtLoginBtnIniciar;

    [Header("--- PANEL BIENVENIDA ---")]
    public TextMeshProUGUI txtBienvTitulo;
    public TextMeshProUGUI txtBienvBtnMuseo; 
    public TextMeshProUGUI txtBienvBtnIdioma;
    public TextMeshProUGUI txtBienvBtnContinuar;

    [Header("--- PANEL TEMATICAS ---")]
    public TextMeshProUGUI txtTemasTitulo;
    public TextMeshProUGUI txtTemasBtnBiodiversidad;
    public TextMeshProUGUI txtTemasBtnGaleria;
    public TextMeshProUGUI txtTemasBtnAjustes;

    [Header("--- PANEL GALERIA ---")]
    public TextMeshProUGUI txtGaleriaPlaceholderBuscador;
    public string msgNombreComun = "Nombre Común";
    public string msgNombreCientifico = "Nombre Científico";
    public string msgTodos = "Todos";

    [Header("--- ESCENA AR ---")]
    public TextMeshProUGUI txtArMenuBtn;
    public TextMeshProUGUI txtArPlaceholder;

    [Header("--- MODALES EXTRA ---")]
    public TextMeshProUGUI txtModalMuseoBtn;   
    public TextMeshProUGUI txtModalAjustesBtn; 
    public TextMeshProUGUI txtAjustesTitulo;
    public TextMeshProUGUI txtAjustesLabelIdioma;

    [Header("--- TEXTOS DE CARGA (Loading) ---")]
    public string msgCargandoTitulo = "Identificando...";
    public string msgCargandoTaxo = "Escaneando 3D...";
    public string msgCargandoDesc = "Por favor, mantenga la imagen centrada...";

    [Header("--- TEXTOS DE ERROR ---")]
    public string msgErrNoInternet = "Sin conexión a Internet";
    public string msgErrServidor = "Error de servidor";
    public string msgErrDetalleRed = "Revisa tu Wi-Fi o Datos móviles";
    public string msgErrDetalleServidor = "Reintenta más tarde";

    void Start()
    {
        string idiomaGuardado = PlayerPrefs.GetString("IdiomaSeleccionado", "es");
        CambiarIdioma(idiomaGuardado);
    }

    public void RefrescarTextosActuales()
    {
        string idiomaGuardado = PlayerPrefs.GetString("IdiomaSeleccionado", "es");
        CambiarIdioma(idiomaGuardado);
    }

    public void CambiarIdioma(string codigo)
    {
        codigo = codigo.ToLower();
        PlayerPrefs.SetString("IdiomaSeleccionado", codigo);
        PlayerPrefs.Save();

        // 1. Intentar usar el diccionario de internet
        if (LectorApiAR.DiccionarioUI.ContainsKey(codigo))
        {
            AplicarTextos(LectorApiAR.DiccionarioUI[codigo]);
        }
        // 2. Si no, fallback al español de internet
        else if (LectorApiAR.DiccionarioUI.ContainsKey("es"))
        {
            AplicarTextos(LectorApiAR.DiccionarioUI["es"]);
        }
    }

    private void AplicarTextos(Dictionary<string, string> d)
    {
        if(txtLoginTitulo && d.ContainsKey("txtLoginTitulo")) txtLoginTitulo.text = d["txtLoginTitulo"];
        if(txtLoginBtnGoogle && d.ContainsKey("txtLoginBtnGoogle")) txtLoginBtnGoogle.text = d["txtLoginBtnGoogle"];
        if(txtLoginPlaceholderNombre && d.ContainsKey("txtLoginPlaceholderNombre")) txtLoginPlaceholderNombre.text = d["txtLoginPlaceholderNombre"];
        if(txtLoginPlaceholderCorreo && d.ContainsKey("txtLoginPlaceholderCorreo")) txtLoginPlaceholderCorreo.text = d["txtLoginPlaceholderCorreo"];
        if(txtLoginBtnIniciar && d.ContainsKey("txtLoginBtnIniciar")) txtLoginBtnIniciar.text = d["txtLoginBtnIniciar"];
        
        if(txtBienvTitulo && d.ContainsKey("txtBienvTitulo")) txtBienvTitulo.text = d["txtBienvTitulo"];
        if(txtBienvBtnMuseo && d.ContainsKey("txtBienvBtnMuseo")) txtBienvBtnMuseo.text = d["txtBienvBtnMuseo"];
        if(txtBienvBtnIdioma && d.ContainsKey("txtBienvBtnIdioma")) txtBienvBtnIdioma.text = d["txtBienvBtnIdioma"];
        if(txtBienvBtnContinuar && d.ContainsKey("txtBienvBtnContinuar")) txtBienvBtnContinuar.text = d["txtBienvBtnContinuar"];
        
        if(txtTemasTitulo && d.ContainsKey("txtTemasTitulo")) txtTemasTitulo.text = d["txtTemasTitulo"];
        if(txtTemasBtnBiodiversidad && d.ContainsKey("txtTemasBtnBiodiversidad")) txtTemasBtnBiodiversidad.text = d["txtTemasBtnBiodiversidad"];
        if(txtTemasBtnGaleria && d.ContainsKey("txtTemasBtnGaleria")) txtTemasBtnGaleria.text = d["txtTemasBtnGaleria"];
        if(txtTemasBtnAjustes && d.ContainsKey("txtTemasBtnAjustes")) txtTemasBtnAjustes.text = d["txtTemasBtnAjustes"];
        
        if(txtGaleriaPlaceholderBuscador && d.ContainsKey("txtGaleriaPlaceholderBuscador")) txtGaleriaPlaceholderBuscador.text = d["txtGaleriaPlaceholderBuscador"];
        
        if(d.ContainsKey("msgNombreComun")) msgNombreComun = d["msgNombreComun"];
        if(d.ContainsKey("msgNombreCientifico")) msgNombreCientifico = d["msgNombreCientifico"];
        if(d.ContainsKey("msgTodos")) msgTodos = d["msgTodos"];
        
        if(txtArMenuBtn && d.ContainsKey("txtArMenuBtn")) txtArMenuBtn.text = d["txtArMenuBtn"];
        if(txtArPlaceholder && d.ContainsKey("txtArPlaceholder")) txtArPlaceholder.text = d["txtArPlaceholder"];
        
        if(txtAjustesTitulo && d.ContainsKey("txtAjustesTitulo")) txtAjustesTitulo.text = d["txtAjustesTitulo"];
        if(txtAjustesLabelIdioma && d.ContainsKey("txtAjustesLabelIdioma")) txtAjustesLabelIdioma.text = d["txtAjustesLabelIdioma"];
        
        if(d.ContainsKey("msgCargandoTitulo")) msgCargandoTitulo = d["msgCargandoTitulo"];
        if(d.ContainsKey("msgCargandoTaxo")) msgCargandoTaxo = d["msgCargandoTaxo"];
        if(d.ContainsKey("msgCargandoDesc")) msgCargandoDesc = d["msgCargandoDesc"];
        
        if(d.ContainsKey("msgErrNoInternet")) msgErrNoInternet = d["msgErrNoInternet"];
        if(d.ContainsKey("msgErrServidor")) msgErrServidor = d["msgErrServidor"];
        if(d.ContainsKey("msgErrDetalleRed")) msgErrDetalleRed = d["msgErrDetalleRed"];
        if(d.ContainsKey("msgErrDetalleServidor")) msgErrDetalleServidor = d["msgErrDetalleServidor"];
    }

    // --- MÉTODOS DE COMPATIBILIDAD ---
    public void CambiarAEspanol() => CambiarIdioma("es");
    public void CambiarAIngles()  => CambiarIdioma("en");
    public void CambiarAPortugues() => CambiarIdioma("pt");
    public void CambiarAFrances()   => CambiarIdioma("fr");
    public void CambiarAItaliano()  => CambiarIdioma("it");
    public void CambiarAAleman()    => CambiarIdioma("de");

    public string GetPlaceholderText()
    {
        string codigo = PlayerPrefs.GetString("IdiomaSeleccionado", "es").ToLower();
        if (LectorApiAR.DiccionarioUI != null && LectorApiAR.DiccionarioUI.ContainsKey(codigo))
        {
            var d = LectorApiAR.DiccionarioUI[codigo];
            if (d.ContainsKey("txtArPlaceholder")) return d["txtArPlaceholder"];
        }
        return "Escanea un animal...";
    }
}
