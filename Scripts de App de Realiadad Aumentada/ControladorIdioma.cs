using UnityEngine;
using TMPro;

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
    public TextMeshProUGUI txtTemasBtnAjustes;

    [Header("--- MODAL IDIOMAS ---")]
    public TextMeshProUGUI txtModalIdioma1; 
    public TextMeshProUGUI txtModalIdioma2;

    // 👇 ¡AQUÍ ESTÁN LOS MODALES QUE FALTABAN! 👇
    [Header("--- MODALES EXTRA ---")]
    public TextMeshProUGUI txtModalMuseoBtn;   // El Texto dentro de ModalMuseos -> Museo
    public TextMeshProUGUI txtModalAjustesBtn; // El Texto dentro de ModalAjustes -> Museo

    void Start()
    {
        string idiomaGuardado = PlayerPrefs.GetString("IdiomaSeleccionado", "es");

        if (idiomaGuardado == "en")
        {
            CambiarAIngles();
        }
        else
        {
            CambiarAEspanol();
        }
    }

    public void CambiarAEspanol()
    {
        PlayerPrefs.SetString("IdiomaSeleccionado", "es");
        PlayerPrefs.Save();

        // --- LOGIN ---
        if(txtLoginTitulo) txtLoginTitulo.text = "INICIAR SESIÓN";
        if(txtLoginBtnGoogle) txtLoginBtnGoogle.text = "Entrar con Google";
        if(txtLoginPlaceholderNombre) txtLoginPlaceholderNombre.text = "Ingresa tu nombre...";
        if(txtLoginPlaceholderCorreo) txtLoginPlaceholderCorreo.text = "Ingresa tu correo...";
        if(txtLoginBtnIniciar) txtLoginBtnIniciar.text = "Iniciar Sesión";

        // --- BIENVENIDA ---
        if(txtBienvTitulo) txtBienvTitulo.text = "BIENVENIDA";
        if(txtBienvBtnMuseo) txtBienvBtnMuseo.text = "Independencia con Borja"; 
        if(txtBienvBtnIdioma) txtBienvBtnIdioma.text = "Seleccionar Idioma";
        if(txtBienvBtnContinuar) txtBienvBtnContinuar.text = "Continuar";

        // --- TEMATICAS ---
        if(txtTemasTitulo) txtTemasTitulo.text = "TEMÁTICAS";
        if(txtTemasBtnBiodiversidad) txtTemasBtnBiodiversidad.text = "Biodiversidad";
        if(txtTemasBtnAjustes) txtTemasBtnAjustes.text = "Ajustes";

        // --- MODAL IDIOMAS ---
        if(txtModalIdioma1) txtModalIdioma1.text = "Español";
        if(txtModalIdioma2) txtModalIdioma2.text = "Inglés";

        // --- MODALES EXTRA ---
        // El único museo disponible
        if(txtModalMuseoBtn) txtModalMuseoBtn.text = "Independencia con Borja"; 
        // El botón dentro de ajustes (asumo que es para sonido, cambiar idioma u otra info)
        if(txtModalAjustesBtn) txtModalAjustesBtn.text = "Idioma"; 
    }

    public void CambiarAIngles()
    {
        PlayerPrefs.SetString("IdiomaSeleccionado", "en");
        PlayerPrefs.Save();

        // --- LOGIN ---
        if(txtLoginTitulo) txtLoginTitulo.text = "LOGIN";
        if(txtLoginBtnGoogle) txtLoginBtnGoogle.text = "Sign in with Google";
        if(txtLoginPlaceholderNombre) txtLoginPlaceholderNombre.text = "Enter your name...";
        if(txtLoginPlaceholderCorreo) txtLoginPlaceholderCorreo.text = "Enter your email...";
        if(txtLoginBtnIniciar) txtLoginBtnIniciar.text = "Log In";

        // --- WELCOME ---
        if(txtBienvTitulo) txtBienvTitulo.text = "WELCOME";
        if(txtBienvBtnMuseo) txtBienvBtnMuseo.text = "Independencia con Borja"; 
        if(txtBienvBtnIdioma) txtBienvBtnIdioma.text = "Select Language";
        if(txtBienvBtnContinuar) txtBienvBtnContinuar.text = "Continue";

        // --- THEMES ---
        if(txtTemasTitulo) txtTemasTitulo.text = "TOPICS";
        if(txtTemasBtnBiodiversidad) txtTemasBtnBiodiversidad.text = "Biodiversity";
        if(txtTemasBtnAjustes) txtTemasBtnAjustes.text = "Settings";

        // --- MODAL IDIOMAS ---
        if(txtModalIdioma1) txtModalIdioma1.text = "Spanish";
        if(txtModalIdioma2) txtModalIdioma2.text = "English";

        // --- MODALES EXTRA ---
        if(txtModalMuseoBtn) txtModalMuseoBtn.text = "Independencia con Borja"; 
        if(txtModalAjustesBtn) txtModalAjustesBtn.text = "Language"; 
    }
}   