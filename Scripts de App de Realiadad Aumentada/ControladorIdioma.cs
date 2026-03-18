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

    [Header("--- ESCENA AR ---")]
    public TextMeshProUGUI txtArMenuBtn;   // Botón "Menú" arriba a la izquierda
    public TextMeshProUGUI txtArPlaceholder; // Texto "Escanea un animal..."

    [Header("--- MODALES EXTRA ---")]
    public TextMeshProUGUI txtModalMuseoBtn;   
    public TextMeshProUGUI txtModalAjustesBtn; 

    void Start()
    {
        string idiomaGuardado = PlayerPrefs.GetString("IdiomaSeleccionado", "es");
        CambiarIdioma(idiomaGuardado);
    }

    public void CambiarIdioma(string codigo)
    {
        VerificarReferencias();

        codigo = codigo.ToLower();
        PlayerPrefs.SetString("IdiomaSeleccionado", codigo);
        PlayerPrefs.Save();

        switch (codigo)
        {
            case "en": SetEnglish(); break;
            case "pt": SetPortuguese(); break;
            case "fr": SetFrench(); break;
            case "it": SetItalian(); break;
            case "de": SetGerman(); break;
            default: SetSpanish(); break;
        }
    }

    private void VerificarReferencias()
    {
        if (txtArMenuBtn == null) Debug.LogWarning("<color=yellow>ControladorIdioma: ¡Atención! No has arrastrado el componente de texto del BOTÓN MENÚ al script en el Inspector.</color>");
        if (txtArPlaceholder == null) Debug.LogWarning("<color=yellow>ControladorIdioma: ¡Atención! No has arrastrado el componente de texto de 'ESCANEA UN ANIMAL' al script en el Inspector.</color>");
    }

    // --- MÉTODOS DE COMPATIBILIDAD PARA TUS BOTONES ANTIGUOS ---
    public void CambiarAEspanol() => CambiarIdioma("es");
    public void CambiarAIngles()  => CambiarIdioma("en");
    public void CambiarAPortugues() => CambiarIdioma("pt");
    public void CambiarAFrances()   => CambiarIdioma("fr");
    public void CambiarAItaliano()  => CambiarIdioma("it");
    public void CambiarAAleman()    => CambiarIdioma("de");

    private void SetSpanish()
    {
        if(txtArMenuBtn == null) Debug.LogWarning("ControladorIdioma: Faltan asignar el botón 'Menú' en el Inspector.");
        if(txtArPlaceholder == null) Debug.LogWarning("ControladorIdioma: Faltan asignar el texto 'Escanea un animal' en el Inspector.");

        if(txtLoginTitulo) txtLoginTitulo.text = "INICIAR SESIÓN";
        if(txtLoginBtnGoogle) txtLoginBtnGoogle.text = "Entrar con Google";
        if(txtLoginPlaceholderNombre) txtLoginPlaceholderNombre.text = "Ingresa tu nombre...";
        if(txtLoginPlaceholderCorreo) txtLoginPlaceholderCorreo.text = "Ingresa tu correo...";
        if(txtLoginBtnIniciar) txtLoginBtnIniciar.text = "Iniciar Sesión";
        if(txtBienvTitulo) txtBienvTitulo.text = "BIENVENIDA";
        if(txtBienvBtnMuseo) txtBienvBtnMuseo.text = "Amazonía Mágica"; 
        if(txtBienvBtnIdioma) txtBienvBtnIdioma.text = "Seleccionar Idioma";
        if(txtBienvBtnContinuar) txtBienvBtnContinuar.text = "Continuar";
        if(txtTemasTitulo) txtTemasTitulo.text = "TEMÁTICAS";
        if(txtTemasBtnBiodiversidad) txtTemasBtnBiodiversidad.text = "Biodiversidad";
        if(txtTemasBtnAjustes) txtTemasBtnAjustes.text = "Ajustes";
        if(txtArMenuBtn) txtArMenuBtn.text = "Menú";
        if(txtArPlaceholder) txtArPlaceholder.text = "Escanea el código QR...";
    }

    private void SetEnglish()
    {
        if(txtLoginTitulo) txtLoginTitulo.text = "LOGIN";
        if(txtLoginBtnGoogle) txtLoginBtnGoogle.text = "Sign in with Google";
        if(txtLoginPlaceholderNombre) txtLoginPlaceholderNombre.text = "Your name...";
        if(txtLoginPlaceholderCorreo) txtLoginPlaceholderCorreo.text = "Your email...";
        if(txtLoginBtnIniciar) txtLoginBtnIniciar.text = "Log In";
        if(txtBienvTitulo) txtBienvTitulo.text = "WELCOME";
        if(txtBienvBtnMuseo) txtBienvBtnMuseo.text = "Magical Amazon"; 
        if(txtBienvBtnIdioma) txtBienvBtnIdioma.text = "Select Language";
        if(txtBienvBtnContinuar) txtBienvBtnContinuar.text = "Continue";
        if(txtTemasTitulo) txtTemasTitulo.text = "TOPICS";
        if(txtTemasBtnBiodiversidad) txtTemasBtnBiodiversidad.text = "Biodiversity";
        if(txtTemasBtnAjustes) txtTemasBtnAjustes.text = "Settings";
        if(txtArMenuBtn) txtArMenuBtn.text = "Menu";
        if(txtArPlaceholder) txtArPlaceholder.text = "Scan the QR code...";
    }

    private void SetPortuguese()
    {
        if(txtLoginTitulo) txtLoginTitulo.text = "ENTRAR";
        if(txtLoginBtnGoogle) txtLoginBtnGoogle.text = "Entrar com Google";
        if(txtLoginPlaceholderNombre) txtLoginPlaceholderNombre.text = "Seu nome...";
        if(txtLoginPlaceholderCorreo) txtLoginPlaceholderCorreo.text = "Seu e-mail...";
        if(txtLoginBtnIniciar) txtLoginBtnIniciar.text = "Iniciar Sessão";
        if(txtBienvTitulo) txtBienvTitulo.text = "BEM-VINDO";
        if(txtBienvBtnMuseo) txtBienvBtnMuseo.text = "Amazônia Mágica"; 
        if(txtBienvBtnIdioma) txtBienvBtnIdioma.text = "Selecionar Idioma";
        if(txtBienvBtnContinuar) txtBienvBtnContinuar.text = "Continuar";
        if(txtTemasTitulo) txtTemasTitulo.text = "TEMÁTICAS";
        if(txtTemasBtnBiodiversidad) txtTemasBtnBiodiversidad.text = "Biodiversidade";
        if(txtTemasBtnAjustes) txtTemasBtnAjustes.text = "Ajustes";
        if(txtArMenuBtn) txtArMenuBtn.text = "Menu";
        if(txtArPlaceholder) txtArPlaceholder.text = "Escaneie o código QR...";
    }

    private void SetFrench()
    {
        if(txtLoginTitulo) txtLoginTitulo.text = "CONNEXION";
        if(txtLoginBtnGoogle) txtLoginBtnGoogle.text = "Se connecter avec Google";
        if(txtLoginPlaceholderNombre) txtLoginPlaceholderNombre.text = "Votre nom...";
        if(txtLoginPlaceholderCorreo) txtLoginPlaceholderCorreo.text = "Votre email...";
        if(txtLoginBtnIniciar) txtLoginBtnIniciar.text = "Se connecter";
        if(txtBienvTitulo) txtBienvTitulo.text = "BIENVENUE";
        if(txtBienvBtnMuseo) txtBienvBtnMuseo.text = "Amazonie Magique"; 
        if(txtBienvBtnIdioma) txtBienvBtnIdioma.text = "Choisir la langue";
        if(txtBienvBtnContinuar) txtBienvBtnContinuar.text = "Continuer";
        if(txtTemasTitulo) txtTemasTitulo.text = "THÉMATIQUES";
        if(txtTemasBtnBiodiversidad) txtTemasBtnBiodiversidad.text = "Biodiversité";
        if(txtTemasBtnAjustes) txtTemasBtnAjustes.text = "Paramètres";
        if(txtArMenuBtn) txtArMenuBtn.text = "Menu";
        if(txtArPlaceholder) txtArPlaceholder.text = "Scannez le code QR...";
    }

    private void SetItalian()
    {
        if(txtLoginTitulo) txtLoginTitulo.text = "ACCEDI";
        if(txtLoginBtnGoogle) txtLoginBtnGoogle.text = "Accedi con Google";
        if(txtLoginPlaceholderNombre) txtLoginPlaceholderNombre.text = "Tuo nome...";
        if(txtLoginPlaceholderCorreo) txtLoginPlaceholderCorreo.text = "Tua email...";
        if(txtLoginBtnIniciar) txtLoginBtnIniciar.text = "Accedi";
        if(txtBienvTitulo) txtBienvTitulo.text = "BENVENUTO";
        if(txtBienvBtnMuseo) txtBienvBtnMuseo.text = "Amazzonia Magica"; 
        if(txtBienvBtnIdioma) txtBienvBtnIdioma.text = "Scegli Lingua";
        if(txtBienvBtnContinuar) txtBienvBtnContinuar.text = "Continua";
        if(txtTemasTitulo) txtTemasTitulo.text = "TEMATICHE";
        if(txtTemasBtnBiodiversidad) txtTemasBtnBiodiversidad.text = "Biodiversità";
        if(txtTemasBtnAjustes) txtTemasBtnAjustes.text = "Impostazioni";
        if(txtArMenuBtn) txtArMenuBtn.text = "Menu";
        if(txtArPlaceholder) txtArPlaceholder.text = "Scansiona il codice QR...";
    }

    private void SetGerman()
    {
        if(txtLoginTitulo) txtLoginTitulo.text = "ANMELDEN";
        if(txtLoginBtnGoogle) txtLoginBtnGoogle.text = "Mit Google anmelden";
        if(txtLoginPlaceholderNombre) txtLoginPlaceholderNombre.text = "Dein Name...";
        if(txtLoginPlaceholderCorreo) txtLoginPlaceholderCorreo.text = "Deine E-Mail...";
        if(txtLoginBtnIniciar) txtLoginBtnIniciar.text = "Einloggen";
        if(txtBienvTitulo) txtBienvTitulo.text = "WILLKOMMEN";
        if(txtBienvBtnMuseo) txtBienvBtnMuseo.text = "Magischer Amazonien"; 
        if(txtBienvBtnIdioma) txtBienvBtnIdioma.text = "Sprache wählen";
        if(txtBienvBtnContinuar) txtBienvBtnContinuar.text = "Weiter";
        if(txtTemasTitulo) txtTemasTitulo.text = "THEMEN";
        if(txtTemasBtnBiodiversidad) txtTemasBtnBiodiversidad.text = "Biodiversität";
        if(txtTemasBtnAjustes) txtTemasBtnAjustes.text = "Einstellungen";
        if(txtArMenuBtn) txtArMenuBtn.text = "Menü";
        if(txtArPlaceholder) txtArPlaceholder.text = "QR-Code scannen...";
    }

    public string GetPlaceholderText()
    {
        string codigo = PlayerPrefs.GetString("IdiomaSeleccionado", "es").ToLower();
        switch (codigo)
        {
            case "en": return "Scan the QR code...";
            case "pt": return "Escaneie o código QR...";
            case "fr": return "Scannez le code QR...";
            case "it": return "Scansiona il codice QR...";
            case "de": return "QR-Code scannen...";
            default: return "Escanea el código QR...";
        }
    }
}