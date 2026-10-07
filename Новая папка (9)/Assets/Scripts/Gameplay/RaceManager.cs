using System.Collections.Generic;
using UnityEngine;

namespace NeonHorizon.Core
{
    /// <summary>
    /// Handles race state, checkpoints, timer, and finish conditions.
    /// It provides a clean separation between traveling logic and player input.
    /// </summary>
    public class RaceManager : MonoBehaviour
    {
        [SerializeField] private List<Transform> checkpoints = new List<Transform>();
        [SerializeField] private Transform finishLine;
        [SerializeField] private float countdownSeconds = 3f;
        [SerializeField] private bool isRaceRunning;
        [SerializeField] private bool isPaused;
        [SerializeField] private float currentLapTime;

        public void Initialize()
        {
            currentLapTime = 0f;
        }

        public void StartRace()
        {
            isRaceRunning = true;
            isPaused = false;
            currentLapTime = 0f;
        }

        public void SetPaused(bool paused)
        {
            isPaused = paused;
        }

        private void Update()
        {
            if (!isRaceRunning || isPaused)
            {
                return;
            }

            currentLapTime += Time.deltaTime;
        }

        public float GetRaceTime()
        {
            return currentLapTime;
        }
    }
}
