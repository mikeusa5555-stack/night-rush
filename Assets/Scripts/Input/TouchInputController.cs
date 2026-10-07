using UnityEngine;

namespace NeonHorizon.Input
{
    /// <summary>
    /// Handles touch gestures for steering, throttle, brake, and nitro.
    /// The same controller can be adapted to UI buttons or touch pads.
    /// </summary>
    public class TouchInputController : MonoBehaviour
    {
        [SerializeField] private Vehicle.VehicleController vehicle;
        [SerializeField] private float steeringValue;
        [SerializeField] private float throttleValue;
        [SerializeField] private bool brakePressed;
        [SerializeField] private bool nitroPressed;

        public void SetSteering(float value)
        {
            steeringValue = Mathf.Clamp(value, -1f, 1f);
        }

        public void SetThrottle(float value)
        {
            throttleValue = Mathf.Clamp(value, 0f, 1f);
        }

        public void SetBrake(bool pressed)
        {
            brakePressed = pressed;
        }

        public void SetNitro(bool pressed)
        {
            nitroPressed = pressed;
        }

        private void Update()
        {
            if (vehicle == null)
            {
                return;
            }

            vehicle.SetInput(throttleValue, steeringValue, brakePressed, nitroPressed);
        }
    }
}
