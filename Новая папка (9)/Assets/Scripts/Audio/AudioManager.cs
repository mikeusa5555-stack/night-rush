using UnityEngine;

namespace NeonHorizon.Audio
{
    /// <summary>
    /// Lightweight audio manager for engine tone, nitro sound, skids, and collisions.
    /// In production, these can be replaced by generated or recorded sound assets.
    /// </summary>
    public class AudioManager : MonoBehaviour
    {
        [SerializeField] private AudioSource engineSource;
        [SerializeField] private AudioSource nitroSource;
        [SerializeField] private AudioSource skidSource;
        [SerializeField] private AudioSource crashSource;

        public void UpdateEngine(float speedRatio)
        {
            if (engineSource != null)
            {
                engineSource.pitch = 0.75f + speedRatio * 1.5f;
            }
        }

        public void TriggerNitro()
        {
            if (nitroSource != null && !nitroSource.isPlaying)
            {
                nitroSource.Play();
            }
        }

        public void TriggerCrash()
        {
            if (crashSource != null)
            {
                crashSource.Play();
            }
        }
    }
}
