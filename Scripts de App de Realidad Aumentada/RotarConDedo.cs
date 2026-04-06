using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;

public class RotarConDedo : MonoBehaviour
{
    [Header("¡ARRASTRA TU MODELO AQUÍ!")]
    public Transform modeloAGirar;

    public float velocidadRotacionPC = 2f;
    public float velocidadRotacionCelular = 0.2f;
    
    [Header("Velocidad de Zoom")]
    public float velocidadZoomCelular = 0.5f;
    public float velocidadZoomPC = 10f; 

    void Update()
    {
        if (modeloAGirar == null) return; 

        // EVITAR QUE SE ROTE EL MODELO SI ESTAMOS TOCANDO LA INTERFAZ WEB/UI
        if (EventSystem.current != null)
        {
            // Táctil
            if (Touchscreen.current != null && Touchscreen.current.touches.Count > 0)
            {
                if (EventSystem.current.IsPointerOverGameObject(Touchscreen.current.touches[0].touchId.ReadValue())) return;
            }
            // Mouse
            if (Mouse.current != null && EventSystem.current.IsPointerOverGameObject()) return;
        }

        // --- 1. MODO CELULAR / TÁCTIL (New Input System) ---
        if (Touchscreen.current != null && Touchscreen.current.touches.Count > 0)
        {
            var touch0 = Touchscreen.current.touches[0];

            if (Touchscreen.current.touches.Count == 1)
            {
                // ROTAR CON 1 DEDO
                if (touch0.phase.ReadValue() == UnityEngine.InputSystem.TouchPhase.Moved)
                {
                    Vector2 delta = touch0.delta.ReadValue();
                    float rotX = delta.x * velocidadRotacionCelular;
                    float rotY = delta.y * velocidadRotacionCelular;
                    
                    modeloAGirar.Rotate(Camera.main.transform.up, -rotX, Space.World);
                    modeloAGirar.Rotate(Camera.main.transform.right, rotY, Space.World);
                }
            }
            else if (Touchscreen.current.touches.Count == 2)
            {
                // ZOOM CON 2 DEDOS (Pellizco)
                var touch1 = Touchscreen.current.touches[1];

                if (touch0.phase.ReadValue() == UnityEngine.InputSystem.TouchPhase.Moved || 
                    touch1.phase.ReadValue() == UnityEngine.InputSystem.TouchPhase.Moved)
                {
                    Vector2 t0Pos = touch0.position.ReadValue();
                    Vector2 t1Pos = touch1.position.ReadValue();
                    Vector2 t0Delta = touch0.delta.ReadValue();
                    Vector2 t1Delta = touch1.delta.ReadValue();

                    float prevDist = (t0Pos - t0Delta - (t1Pos - t1Delta)).magnitude;
                    float actualDist = (t0Pos - t1Pos).magnitude;

                    if (prevDist > 0.1f)
                    {
                        float factor = actualDist / prevDist;
                        float percent = 1f + (factor - 1f) * velocidadZoomCelular;

                        Vector3 newScale = modeloAGirar.localScale * percent;
                        newScale.x = Mathf.Clamp(newScale.x, 0.001f, 1000f);
                        newScale.y = Mathf.Clamp(newScale.y, 0.001f, 1000f);
                        newScale.z = Mathf.Clamp(newScale.z, 0.001f, 1000f);
                        modeloAGirar.localScale = newScale;
                    }
                }
            }
        }
        
        // --- 2. MODO COMPUTADORA (New Input System Mouse) ---
        else if (Mouse.current != null)
        {
            // ROTAR CON CLIC IZQUIERDO
            if (Mouse.current.leftButton.isPressed)
            {
                Vector2 delta = Mouse.current.delta.ReadValue();
                float rotX = delta.x * velocidadRotacionPC * 0.1f;
                float rotY = delta.y * velocidadRotacionPC * 0.1f;
                
                modeloAGirar.Rotate(Camera.main.transform.up, -rotX, Space.World);
                modeloAGirar.Rotate(Camera.main.transform.right, rotY, Space.World);
            }

            // ZOOM CON RUEDITA
            float scroll = Mouse.current.scroll.ReadValue().y * 0.001f;

            // Soporte teclado (+ y -)
            if (Keyboard.current != null)
            {
                if (Keyboard.current.numpadPlusKey.isPressed || Keyboard.current.equalsKey.isPressed) scroll = 0.02f;
                if (Keyboard.current.numpadMinusKey.isPressed || Keyboard.current.minusKey.isPressed) scroll = -0.02f;
            }

            if (Mathf.Abs(scroll) > 0.0001f)
            {
                float factor = 1f + (scroll * velocidadZoomPC);
                Vector3 newScale = modeloAGirar.localScale * factor;
                newScale.x = Mathf.Clamp(newScale.x, 0.001f, 1000f);
                newScale.y = Mathf.Clamp(newScale.y, 0.001f, 1000f);
                newScale.z = Mathf.Clamp(newScale.z, 0.001f, 1000f);
                modeloAGirar.localScale = newScale;
            }
        }
    }
}