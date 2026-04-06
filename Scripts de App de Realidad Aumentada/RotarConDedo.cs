using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.EnhancedTouch;
using Touch = UnityEngine.InputSystem.EnhancedTouch.Touch;

public class RotarConDedo : MonoBehaviour
{
    [Header("¡ARRASTRA TU MODELO AQUÍ!")]
    public Transform modeloAGirar;

    [Header("Velocidad de Rotación")]
    public float velocidadRotacionPC = 0.3f;
    public float velocidadRotacionCelular = 0.2f;
    
    [Header("Velocidad de Zoom")]
    public float velocidadZoomCelular = 0.5f;
    public float velocidadZoomPC = 0.15f; 

    void OnEnable()
    {
        EnhancedTouchSupport.Enable();
    }

    void OnDisable()
    {
        EnhancedTouchSupport.Disable();
    }

    void Update()
    {
        if (modeloAGirar == null) return; 

        // EVITAR QUE SE ROTE EL MODELO SI ESTAMOS TOCANDO LA INTERFAZ WEB/UI
        if (EventSystem.current != null && EventSystem.current.IsPointerOverGameObject()) return;

        // --- 1. MODO CELULAR / TÁCTIL (EnhancedTouch) ---
        if (Touch.activeTouches.Count > 0)
        {
            if (Touch.activeTouches.Count == 1)
            {
                // ROTAR CON 1 DEDO
                var toque = Touch.activeTouches[0];
                if (toque.phase == UnityEngine.InputSystem.TouchPhase.Moved)
                {
                    Vector2 delta = toque.delta;
                    float rotX = delta.x * velocidadRotacionCelular;
                    float rotY = delta.y * velocidadRotacionCelular;
                    
                    modeloAGirar.Rotate(Camera.main.transform.up, -rotX, Space.World);
                    modeloAGirar.Rotate(Camera.main.transform.right, rotY, Space.World);
                }
            }
            else if (Touch.activeTouches.Count == 2)
            {
                // ZOOM CON 2 DEDOS (Pellizco)
                var t0 = Touch.activeTouches[0];
                var t1 = Touch.activeTouches[1];

                if (t0.phase == UnityEngine.InputSystem.TouchPhase.Moved || 
                    t1.phase == UnityEngine.InputSystem.TouchPhase.Moved)
                {
                    Vector2 t0Pos = t0.screenPosition;
                    Vector2 t1Pos = t1.screenPosition;
                    Vector2 t0Prev = t0Pos - t0.delta;
                    Vector2 t1Prev = t1Pos - t1.delta;

                    float prevDist = (t0Prev - t1Prev).magnitude;
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
        
        // --- 2. MODO COMPUTADORA / TOUCHPAD (Mouse del New Input System) ---
        else if (Mouse.current != null)
        {
            // ROTAR CON CLIC IZQUIERDO
            if (Mouse.current.leftButton.isPressed)
            {
                Vector2 delta = Mouse.current.delta.ReadValue();
                float rotX = delta.x * velocidadRotacionPC;
                float rotY = delta.y * velocidadRotacionPC;
                
                modeloAGirar.Rotate(Camera.main.transform.up, -rotX, Space.World);
                modeloAGirar.Rotate(Camera.main.transform.right, rotY, Space.World);
            }

            // ZOOM CON SCROLL (funciona con ruedita de ratón Y con touchpad de dos dedos)
            float scrollY = Mouse.current.scroll.ReadValue().y;
            float scroll = scrollY * velocidadZoomPC;

            // Soporte teclado (+ y -)
            if (Keyboard.current != null)
            {
                if (Keyboard.current.numpadPlusKey.isPressed || Keyboard.current.equalsKey.isPressed) scroll = 0.05f;
                if (Keyboard.current.numpadMinusKey.isPressed || Keyboard.current.minusKey.isPressed) scroll = -0.05f;
            }

            if (Mathf.Abs(scroll) > 0.0001f)
            {
                float factor = 1f + scroll;
                Vector3 newScale = modeloAGirar.localScale * factor;
                newScale.x = Mathf.Clamp(newScale.x, 0.001f, 1000f);
                newScale.y = Mathf.Clamp(newScale.y, 0.001f, 1000f);
                newScale.z = Mathf.Clamp(newScale.z, 0.001f, 1000f);
                modeloAGirar.localScale = newScale;
            }
        }
    }
}