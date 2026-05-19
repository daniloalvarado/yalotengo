using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class ControladorBotonesIdioma : MonoBehaviour
{
    public GameObject botonPrefab;
    public Transform contenedorBotones;
    public ControladorIdioma controladorIdioma;

    void OnEnable()
    {
        GenerarBotones();
    }

    public void GenerarBotones()
    {
        // 1. Limpiar los botones antiguos (excepto el propio prefab si está ahí)
        foreach (Transform child in contenedorBotones)
        {
            Destroy(child.gameObject);
        }

        // 2. Crear los botones dinámicos
        foreach (var idioma in LectorApiAR.IdiomasDisponibles)
        {
            GameObject nuevoBoton = Instantiate(botonPrefab, contenedorBotones);
            nuevoBoton.SetActive(true);
            
            // Buscar y cambiar el texto del botón
            TextMeshProUGUI txt = nuevoBoton.GetComponentInChildren<TextMeshProUGUI>();
            if (txt != null) txt.text = idioma.name;

            // Configurar el evento onClick
            Button btn = nuevoBoton.GetComponent<Button>();
            if (btn != null)
            {
                string cod = idioma.code;
                btn.onClick.AddListener(() => {
                    if (controladorIdioma != null) controladorIdioma.CambiarIdioma(cod);
                    // Cerrar el modal automáticamente al elegir idioma
                    gameObject.SetActive(false);
                });
            }
        }
    }
}
