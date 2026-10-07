using UnityEngine;

namespace NeonHorizon.Vehicle
{
    /// <summary>
    /// Player vehicle controller for a mobile arcade racer.
    /// It handles acceleration, steering, drifting, braking, nitro, and steering
    /// sensitivity based on current speed so the car feels responsive on Android.
    /// </summary>
    public class VehicleController : MonoBehaviour
    {
        [Header("Vehicle Stats")]
        [SerializeField] private string vehicleId = "nova_gt";
        [SerializeField] private float enginePower = 1800f;
        [SerializeField] private float topSpeed = 220f;
        [SerializeField] private float steeringAngle = 28f;
        [SerializeField] private float grip = 0.9f;
        [SerializeField] private float brakeForce = 1600f;
        [SerializeField] private float nitroPower = 2600f;
        [SerializeField] private float nitroMax = 100f;

        [Header("Physics")]
        [SerializeField] private Rigidbody rb;
        [SerializeField] private Transform frontLeftWheel;
        [SerializeField] private Transform frontRightWheel;
        [SerializeField] private float wheelSpinFactor = 1.5f;

        [Header("Input")]
        [SerializeField] private float throttleInput;
        [SerializeField] private float steeringInput;
        [SerializeField] private bool braking;
        [SerializeField] private bool nitroActive;

        private float currentNitro;
        private float currentSpeed;
        private bool isDrifting;

        private void Awake()
        {
            if (rb == null)
            {
                rb = GetComponent<Rigidbody>();
            }

            currentNitro = nitroMax;
        }

        private void Update()
        {
            HandleWheelVisuals();
        }

        private void FixedUpdate()
        {
            float forwardSpeed = Vector3.Dot(rb.velocity, transform.forward);
            currentSpeed = Mathf.Abs(forwardSpeed);

            float steerStrength = Mathf.Clamp01(currentSpeed / 40f);
            float steerAmount = steeringInput * steeringAngle * (1f - steerStrength * 0.4f);
            Quaternion turnRotation = Quaternion.Euler(0f, steerAmount * Time.fixedDeltaTime * 2.5f, 0f);
            rb.MoveRotation(rb.rotation * turnRotation);

            if (throttleInput > 0f)
            {
                float force = enginePower * throttleInput;
                rb.AddForce(transform.forward * force, ForceMode.Acceleration);
            }

            if (braking)
            {
                rb.AddForce(-transform.forward * brakeForce, ForceMode.Acceleration);
            }

            if (nitroActive && currentNitro > 0f)
            {
                currentNitro = Mathf.Max(0f, currentNitro - 18f * Time.fixedDeltaTime);
                rb.AddForce(transform.forward * nitroPower, ForceMode.Acceleration);
            }
            else
            {
                currentNitro = Mathf.Min(nitroMax, currentNitro + 10f * Time.fixedDeltaTime);
            }

            float driftSlip = isDrifting ? 0.7f : 1f;
            Vector3 driftVelocity = rb.velocity;
            driftVelocity = Vector3.Lerp(driftVelocity, transform.forward * Mathf.Clamp01(currentSpeed / topSpeed) * topSpeed, Time.fixedDeltaTime * grip * driftSlip);
            rb.velocity = driftVelocity;

            if (currentSpeed > topSpeed)
            {
                Vector3 clampedVelocity = rb.velocity.normalized * topSpeed;
                rb.velocity = new Vector3(clampedVelocity.x, rb.velocity.y, clampedVelocity.z);
            }
        }

        private void HandleWheelVisuals()
        {
            if (frontLeftWheel == null || frontRightWheel == null)
            {
                return;
            }

            float spin = currentSpeed * wheelSpinFactor * Time.deltaTime;
            frontLeftWheel.Rotate(Vector3.right, spin);
            frontRightWheel.Rotate(Vector3.right, spin);
        }

        public void SetInput(float throttle, float steering, bool brake, bool nitro)
        {
            throttleInput = Mathf.Clamp(throttle, -1f, 1f);
            steeringInput = Mathf.Clamp(steering, -1f, 1f);
            braking = brake;
            nitroActive = nitro;
        }

        public void SetVehicleId(string newId)
        {
            vehicleId = newId;
        }

        public float GetCurrentSpeedKmh()
        {
            return currentSpeed * 3.6f;
        }

        public float GetNitroPercentage()
        {
            return currentNitro / nitroMax;
        }

        public void SetDrift(bool driftState)
        {
            isDrifting = driftState;
        }
    }
}
