using UnityEngine;
using UnityEngine.SceneManagement;

public class BotonVolver : MonoBehaviour
{
    public void RegresarAlMenu()
    {
        // 1. Dejamos una nota que diga "VengoDeAR" con valor 1 (Verdadero)
        PlayerPrefs.SetInt("VengoDeAR", 1);

        // 2. Cargamos la escena del menú
        SceneManager.LoadScene("MenuPrincipal");
    }
}