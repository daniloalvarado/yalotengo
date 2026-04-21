using UnityEngine;
using UnityEngine.SceneManagement; 
using TMPro; 
using System.Text.RegularExpressions; 
using System.Collections;
using UnityEngine.Networking;

public class NavegacionMenu : MonoBehaviour
{
    [Header("Paneles de la App")]
    public GameObject panelLogin;
    public GameObject panelBienvenida;
    public GameObject panelTematicas;
    public GameObject panelGaleria; // NUEVO: Panel de Galería Offline

    [Header("Configuración de API")]
    [Tooltip("La URL de tu backend Node.js para el login AR")]
    public string apiUrl = "http://108.181.191.82.sslip.io:8070/api/auth/ar-login";

    [Header("Formulario de Registro")]
    public TMP_InputField inputNombre;
    public TMP_InputField inputCorreo;
    
    [Header("Feedback Visual")]
    public TextMeshProUGUI textoError; 

    void Start()
    {
        // Limpiamos el mensaje de error al iniciar la app
        if(textoError != null) textoError.text = "";

        // --- LÓGICA DE NAVEGACIÓN INTELIGENTE ---
        if (PlayerPrefs.GetInt("VengoDeAR") == 1)
        {
            // CASO A: El usuario pulsó "Menú" en la escena AR. 
            // Lo enviamos a las Temáticas (Biodiversidad/Ajustes) para que pueda explorar.
            PlayerPrefs.SetInt("VengoDeAR", 0); 
            IrATematicas();
        }
        else if (PlayerPrefs.HasKey("CorreoUsuario"))
        {
            // CASO B: El usuario acaba de abrir la app y ya está logueado.
            // Lo enviamos directo a la acción (Cámara AR).
            IrARealidadAumentada();
        }
        else
        {
            // CASO C: Usuario nuevo o sesión no iniciada.
            MostrarSoloLogin();
        }
    }

    // --- FUNCIÓN PRINCIPAL PARA EL BOTÓN "ENTRAR / CONTINUAR" ---
    public void IntentarLogin()
    {
        // 1. VALIDACIÓN BÁSICA: ¿Están vacíos los campos?
        if (string.IsNullOrEmpty(inputNombre.text) || string.IsNullOrEmpty(inputCorreo.text))
        {
            Debug.LogWarning("Validación fallida: Campos vacíos.");
            MostrarErrorAnimado("Por favor, completa todos los campos.");
            return; 
        }

        // 1.1 VALIDACIÓN DE INTERNET: ¿El celular tiene señal?
        if (Application.internetReachability == NetworkReachability.NotReachable)
        {
            Debug.LogWarning("Validación fallida: Sin Internet.");
            ControladorIdioma ci = FindObjectOfType<ControladorIdioma>();
            string msg = (ci != null) ? ci.msgErrNoInternet : "Sin conexión a Internet";
            MostrarErrorAnimado(msg);
            return;
        }

        // 2. VALIDACIÓN DE FORMATO: ¿Es un correo real?
        if (EsCorreoValido(inputCorreo.text) == false)
        {
            Debug.LogWarning("Validación fallida: Formato de correo incorrecto.");
            MostrarErrorAnimado("Correo no válido (ej: usuario@gmail.com)");
            return; 
        }

        // 3. ENVIAR DATOS AL BACKEND (Nuevo Flujo)
        StartCoroutine(EnviarDatosAlBackend(inputNombre.text, inputCorreo.text));
    }

    private IEnumerator EnviarDatosAlBackend(string nombre, string correo)
    {
        // Usamos la variable expuesta en el Inspector
        string jsonPayload = $"{{\"email\":\"{correo}\", \"nombre\":\"{nombre}\"}}";
        
        using (UnityWebRequest request = new UnityWebRequest(apiUrl, "POST"))
        {
            byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonPayload);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");
            
            // Bypass SSL for some mobile devices
            request.certificateHandler = new BypassCertificate();
            request.timeout = 20;

            // Opcional: Mostrar mensaje de carga
            if(textoError != null) textoError.text = "<color=#ffffff>Iniciando sesión...</color>";

            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                // ¡Éxito! El backend lo registró o lo reconoció
                Debug.Log("Login Exitoso en Servidor: " + request.downloadHandler.text);

                // 4. GUARDADO DE DATOS (Persistencia Local)
                PlayerPrefs.SetString("NombreUsuario", nombre);
                PlayerPrefs.SetString("CorreoUsuario", correo);
                PlayerPrefs.Save(); 
                
                // 5. AVANZAR DIRECTO A AR
                IrARealidadAumentada();
            }
            else
            {
                ControladorIdioma ci = FindObjectOfType<ControladorIdioma>();
                // Diferenciar entre error de red local y error del servidor remoto
                if (request.result == UnityWebRequest.Result.ConnectionError)
                {
                    Debug.LogError("Error de conexión local: " + request.error);
                    string msg = (ci != null) ? ci.msgErrNoInternet : "Sin conexión a Internet";
                    MostrarErrorAnimado(msg);
                }
                else
                {
                    Debug.LogError("Error en Login AR (Servidor): " + request.error + " | " + request.downloadHandler.text);
                    string msg = (ci != null) ? ci.msgErrServidor : "Error de servidor";
                    MostrarErrorAnimado(msg);
                }
            }
        }
    }

    // --- FUNCIÓN AUXILIAR PARA VERIFICAR EL CORREO ---
    private bool EsCorreoValido(string email)
    {
        string patron = @"^[^@\s]+@[^@\s]+\.[^@\s]+$";
        return Regex.IsMatch(email, patron);
    }

    // --- EFECTO VISUAL DE ERROR ---
    private void MostrarErrorAnimado(string mensaje)
    {
        if (textoError != null)
        {
            textoError.text = $"<color=#ff4d4d>{mensaje}</color>";
            StopAllCoroutines();
            StartCoroutine(ShakeErrorText());
        }
    }

    private IEnumerator ShakeErrorText()
    {
        Vector3 posOriginal = textoError.transform.localPosition;
        float duracion = 0.3f;
        float tiempo = 0f;
        
        while (tiempo < duracion)
        {
            float offsetX = Random.Range(-10f, 10f);
            textoError.transform.localPosition = new Vector3(posOriginal.x + offsetX, posOriginal.y, posOriginal.z);
            tiempo += Time.deltaTime;
            yield return null;
        }
        
        textoError.transform.localPosition = posOriginal;
    }

    // --- FUNCIONES DE NAVEGACIÓN ---
    private void MostrarSoloLogin()
    {
        if (panelLogin != null) panelLogin.SetActive(true);
        if (panelBienvenida != null) panelBienvenida.SetActive(false);
        if (panelTematicas != null) panelTematicas.SetActive(false);
        if (panelGaleria != null) panelGaleria.SetActive(false);
    }

    public void IrABienvenida()
    {
        if(textoError != null) textoError.text = ""; 

        if (panelLogin != null) panelLogin.SetActive(false);
        if (panelBienvenida != null) panelBienvenida.SetActive(true);
        if (panelTematicas != null) panelTematicas.SetActive(false);
        if (panelGaleria != null) panelGaleria.SetActive(false);
    }

    public void IrATematicas()
    {
        if (panelLogin != null) panelLogin.SetActive(false);
        if (panelBienvenida != null) panelBienvenida.SetActive(false);
        if (panelTematicas != null) panelTematicas.SetActive(true);
        if (panelGaleria != null) panelGaleria.SetActive(false);
    }

    public void IrAGaleria()
    {
        if (panelLogin != null) panelLogin.SetActive(false);
        if (panelBienvenida != null) panelBienvenida.SetActive(false);
        if (panelTematicas != null) panelTematicas.SetActive(false);
        if (panelGaleria != null) panelGaleria.SetActive(true);
    }

    public void IrARealidadAumentada()
    {
        SceneManager.LoadScene("SampleScene");
    }
}