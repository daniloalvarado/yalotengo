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

    [Header("Configuración de API")]
    [Tooltip("La URL de tu backend Node.js para el login AR")]
    public string apiUrl = "https://yalotengo.onrender.com/api/auth/ar-login";

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
        // Verificamos si el usuario viene de cerrar la cámara AR
        if (PlayerPrefs.GetInt("VengoDeAR") == 1)
        {
            // CASO A: Vienes de la cámara AR -> Te enviamos directo a elegir otra temática
            IrATematicas(); 
            PlayerPrefs.SetInt("VengoDeAR", 0); // Borramos la nota
        }
        else
        {
            // CASO B: Abres la app desde cero. 
            // [NUEVO] Preguntamos: ¿El usuario ya se había registrado antes?
            if (PlayerPrefs.HasKey("CorreoUsuario"))
            {
                // ¡Sí! Ya tiene una cuenta guardada en el celular.
                // Lo enviamos directo a las Temáticas (saltando el Login)
                Debug.Log("Usuario recordado: " + PlayerPrefs.GetString("NombreUsuario"));
                IrATematicas(); 
            }
            else
            {
                // ¡No! Es la primera vez que abre la app. 
                MostrarSoloLogin();
            }
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
                
                // 5. AVANZAR
                IrABienvenida();
            }
            else
            {
                // Error de conexión o validación del servidor
                Debug.LogError("Error en Login AR: " + request.error);
                MostrarErrorAnimado("Error al conectar con el servidor.");
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
        panelLogin.SetActive(true);
        panelBienvenida.SetActive(false);
        panelTematicas.SetActive(false);
    }

    public void IrABienvenida()
    {
        if(textoError != null) textoError.text = ""; 

        panelLogin.SetActive(false);
        panelBienvenida.SetActive(true);
        panelTematicas.SetActive(false);
    }

    public void IrATematicas()
    {
        panelLogin.SetActive(false);
        panelBienvenida.SetActive(false);
        panelTematicas.SetActive(true);
    }

    public void IrARealidadAumentada()
    {
        SceneManager.LoadScene("SampleScene");
    }
}