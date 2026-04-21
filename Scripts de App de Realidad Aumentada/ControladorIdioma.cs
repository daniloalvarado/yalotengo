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
    public TextMeshProUGUI txtTemasBtnGaleria; // NUEVO
    public TextMeshProUGUI txtTemasBtnAjustes;

    [Header("--- PANEL GALERIA ---")]
    public TextMeshProUGUI txtGaleriaPlaceholderBuscador; // NUEVO
    public string msgNombreComun = "Nombre Común"; // NUEVO
    public string msgNombreCientifico = "Nombre Científico"; // NUEVO
    public string msgTodos = "Todos"; // NUEVO

    [Header("--- ESCENA AR ---")]
    public TextMeshProUGUI txtArMenuBtn;   // Botón "Menú" arriba a la izquierda
    public TextMeshProUGUI txtArPlaceholder; // Texto "Escanea un animal..."

    [Header("--- MODALES EXTRA ---")]
    public TextMeshProUGUI txtModalMuseoBtn;   
    public TextMeshProUGUI txtModalAjustesBtn; 
    public TextMeshProUGUI txtAjustesTitulo;      // Nuevo: Título del panel Ajustes
    public TextMeshProUGUI txtAjustesLabelIdioma; // Nuevo: Label "Idioma" en Ajustes

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
        // Eliminamos las advertencias para que no te saturen la consola
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
        if(txtTemasBtnGaleria) txtTemasBtnGaleria.text = "Galería";
        if(txtGaleriaPlaceholderBuscador) txtGaleriaPlaceholderBuscador.text = "Buscar por nombre común o científico...";
        if(txtArMenuBtn) txtArMenuBtn.text = "Menú";
        if(txtArPlaceholder) txtArPlaceholder.text = "Apunta a la imagen...";
        if(txtAjustesTitulo) txtAjustesTitulo.text = "AJUSTES";
        if(txtAjustesLabelIdioma) txtAjustesLabelIdioma.text = "Idioma";
        msgCargandoTitulo = "Identificando...";
        msgCargandoTaxo = "Escaneando 3D...";
        msgCargandoDesc = "Por favor, mantenga la imagen centrada...";
        msgNombreComun = "Nombre Común";
        msgNombreCientifico = "Nombre Científico";
        msgTodos = "Todos";

        msgErrNoInternet = "Sin conexión a Internet";
        msgErrServidor = "Error de servidor";
        msgErrDetalleRed = "Revisa tu Wi-Fi o Datos móviles";
        msgErrDetalleServidor = "Reintenta más tarde";
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
        if(txtTemasBtnGaleria) txtTemasBtnGaleria.text = "Gallery";
        if(txtGaleriaPlaceholderBuscador) txtGaleriaPlaceholderBuscador.text = "Search by common or scientific name...";
        if(txtArMenuBtn) txtArMenuBtn.text = "Menu";
        if(txtArPlaceholder) txtArPlaceholder.text = "Aim at the image...";
        if(txtAjustesTitulo) txtAjustesTitulo.text = "SETTINGS";
        if(txtAjustesLabelIdioma) txtAjustesLabelIdioma.text = "Language";

        msgCargandoTitulo = "Identifying...";
        msgCargandoTaxo = "3D Scanning...";
        msgCargandoDesc = "Please keep the image centered...";
        msgNombreComun = "Common Name";
        msgNombreCientifico = "Scientific Name";
        msgTodos = "All";

        msgErrNoInternet = "No Internet connection";
        msgErrServidor = "Server Error";
        msgErrDetalleRed = "Check your Wi-Fi or Data";
        msgErrDetalleServidor = "Please try again later";
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
        if(txtTemasBtnGaleria) txtTemasBtnGaleria.text = "Galeria";
        if(txtGaleriaPlaceholderBuscador) txtGaleriaPlaceholderBuscador.text = "Pesquisar por nome comum ou científico...";
        if(txtArMenuBtn) txtArMenuBtn.text = "Menu";
        if(txtArPlaceholder) txtArPlaceholder.text = "Aponte para a imagem...";
        if(txtAjustesTitulo) txtAjustesTitulo.text = "AJUSTES";
        if(txtAjustesLabelIdioma) txtAjustesLabelIdioma.text = "Idioma";
        msgCargandoTitulo = "Identificando...";
        msgCargandoTaxo = "Digitalização 3D...";
        msgCargandoDesc = "Por favor, mantenha a imagem centrada...";
        msgNombreComun = "Nome Comum";
        msgNombreCientifico = "Nome Científico";
        msgTodos = "Todos";

        msgErrNoInternet = "Sem conexão à Internet";
        msgErrServidor = "Erro de servidor";
        msgErrDetalleRed = "Verifique o seu Wi-Fi";
        msgErrDetalleServidor = "Tente mais tarde";
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
        if(txtTemasBtnGaleria) txtTemasBtnGaleria.text = "Galerie";
        if(txtGaleriaPlaceholderBuscador) txtGaleriaPlaceholderBuscador.text = "Recherche par nom commun ou scientifique...";
        if(txtArMenuBtn) txtArMenuBtn.text = "Menu";
        if(txtArPlaceholder) txtArPlaceholder.text = "Visez l'image...";
        if(txtAjustesTitulo) txtAjustesTitulo.text = "PARAMÈTRES";
        if(txtAjustesLabelIdioma) txtAjustesLabelIdioma.text = "Langue";
        msgCargandoTitulo = "Identification...";
        msgCargandoTaxo = "Numérisation 3D...";
        msgCargandoDesc = "Veuillez garder l'image centrée...";
        msgNombreComun = "Nom Commun";
        msgNombreCientifico = "Nom Scientifique";
        msgTodos = "Tous";

        msgErrNoInternet = "Pas de connexion Internet";
        msgErrServidor = "Erreur de serveur";
        msgErrDetalleRed = "Vérifiez votre Wi-Fi";
        msgErrDetalleServidor = "Veuillez réessayer plus tard";
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
        if(txtTemasBtnGaleria) txtTemasBtnGaleria.text = "Galleria";
        if(txtGaleriaPlaceholderBuscador) txtGaleriaPlaceholderBuscador.text = "Cerca per nome comune o scientifico...";
        if(txtArMenuBtn) txtArMenuBtn.text = "Menu";
        if(txtArPlaceholder) txtArPlaceholder.text = "Inquadra l'immagine...";
        if(txtAjustesTitulo) txtAjustesTitulo.text = "IMPOSTAZIONI";
        if(txtAjustesLabelIdioma) txtAjustesLabelIdioma.text = "Lingua";
        msgCargandoTitulo = "Identificazione...";
        msgCargandoTaxo = "Scansione 3D...";
        msgCargandoDesc = "Per favore, mantieni l'immagine centrata...";
        msgNombreComun = "Nome Comune";
        msgNombreCientifico = "Nome Scientifico";
        msgTodos = "Tutti";

        msgErrNoInternet = "Nessuna connessione Internet";
        msgErrServidor = "Errore del server";
        msgErrDetalleRed = "Controlla il tuo Wi-Fi";
        msgErrDetalleServidor = "Riprova più tardi";
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
        if(txtTemasBtnGaleria) txtTemasBtnGaleria.text = "Galerie";
        if(txtGaleriaPlaceholderBuscador) txtGaleriaPlaceholderBuscador.text = "Nach Trivial- oder wissenschaftlichem Namen suchen...";
        if(txtArMenuBtn) txtArMenuBtn.text = "Menü";
        if(txtArPlaceholder) txtArPlaceholder.text = "Richten Sie auf das Bild...";
        if(txtAjustesTitulo) txtAjustesTitulo.text = "EINSTELLUNGEN";
        if(txtAjustesLabelIdioma) txtAjustesLabelIdioma.text = "Sprache";
        msgCargandoTitulo = "Identifizierung...";
        msgCargandoTaxo = "3D-Scan...";
        msgCargandoDesc = "Bitte halten Sie das Bild zentriert...";
        msgNombreComun = "Trivialname";
        msgNombreCientifico = "Wissenschaftlicher Name";
        msgTodos = "Alle";

        msgErrNoInternet = "Keine Internetverbindung";
        msgErrServidor = "Serverfehler";
        msgErrDetalleRed = "Prüfen Sie Ihr Wi-Fi";
        msgErrDetalleServidor = "Später erneut versuchen";
    }

    public string GetPlaceholderText()
    {
        string codigo = PlayerPrefs.GetString("IdiomaSeleccionado", "es").ToLower();
        switch (codigo)
        {
            case "en": return "Aim at the image...";
            case "pt": return "Aponte para a imagem...";
            case "fr": return "Visez l'image...";
            case "it": return "Inquadra l'immagine...";
            case "de": return "Auf das Bild richten...";
            default: return "Apunta a la imagen...";
        }
    }
}