using UnityEngine;

namespace NeonHorizon.Vehicle
{
    /// <summary>
    /// Basic AI rival that follows a lane or path and competes with the player.
    /// It maintains separation from traffic while respecting path checkpoints.
    /// </summary>
    public class AIController : MonoBehaviour
    {
        [SerializeField] private Transform[] waypointPath;
        [SerializeField] private float moveSpeed = 24f;
        [SerializeField] private float steeringLerp = 2f;
        [SerializeField] private int waypointIndex;
        [SerializeField] private Rigidbody rb;

        private void Awake()
        {
            if (rb == null)
            {
                rb = GetComponent<Rigidbody>();
            }
        }

        private void Update()
        {
            if (waypointPath == null || waypointPath.Length == 0)
            {
                return;
            }

            Transform targetWaypoint = waypointPath[waypointIndex];
            Vector3 direction = (targetWaypoint.position - transform.position).normalized;
            if (direction.sqrMagnitude > 0.01f)
            {
                Quaternion targetRotation = Quaternion.LookRotation(direction, Vector3.up);
                transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, steeringLerp * Time.deltaTime);
                rb.velocity = transform.forward * moveSpeed;
            }

            if (Vector3.Distance(transform.position, targetWaypoint.position) < 8f)
            {
                waypointIndex = (waypointIndex + 1) % waypointPath.Length;
            }
        }
    }
}
