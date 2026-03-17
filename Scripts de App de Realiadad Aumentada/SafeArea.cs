using UnityEngine;

public class SafeArea : MonoBehaviour
{
    RectTransform panel;

    void Start()
    {
        AplicarSafeArea();
    }

    // El Simulador de Unity a veces necesita que se actualice en tiempo real
    void Update()
    {
        if (Application.isEditor)
        {
            AplicarSafeArea();
        }
    }

    void AplicarSafeArea()
    {
        panel = GetComponent<RectTransform>();
        Rect areaSegura = Screen.safeArea;

        Vector2 anclaMinima = areaSegura.position;
        Vector2 anclaMaxima = areaSegura.position + areaSegura.size;

        anclaMinima.x /= Screen.width;
        anclaMinima.y /= Screen.height;
        anclaMaxima.x /= Screen.width;
        anclaMaxima.y /= Screen.height;

        // Cambiamos el tamaño
        panel.anchorMin = anclaMinima;
        panel.anchorMax = anclaMaxima;

        // [EL TRUCO VITAL] Forzamos a que los márgenes extraños se pongan en cero
        panel.offsetMin = Vector2.zero;
        panel.offsetMax = Vector2.zero;
    }
}