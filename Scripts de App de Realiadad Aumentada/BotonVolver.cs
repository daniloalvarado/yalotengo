using UnityEngine;
using UnityEngine.SceneManagement;

public class BotonVolver : MonoBehaviour
{
    [Tooltip("Escribe aquí el nombre EXACTO de tu escena de Menú")]
    public string nombreEscenaMenu = "MenuPrincipal";

    public void RegresarAlMenu()
    {
        // 1. Dejamos una nota que diga "VengoDeAR" con valor 1 (Verdadero)
        PlayerPrefs.SetInt("VengoDeAR", 1);
        PlayerPrefs.Save(); // Aseguramos que se guarde de inmediato

        Debug.Log("Cambiando a escena: " + nombreEscenaMenu);

        // 2. Cargamos la escena del menú
        SceneManager.LoadScene(nombreEscenaMenu);
    }
}