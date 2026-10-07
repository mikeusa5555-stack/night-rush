using UnityEngine;
using UnityEngine.SceneManagement;

namespace NeonHorizon.Core
{
    /// <summary>
    /// Central controller that starts and transitions between menu, race, garage,
    /// and results screens. This keeps gameplay flow decoupled from the UI layer.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private Vehicle.VehicleController playerVehicle;
        [SerializeField] private RaceManager raceManager;
        [SerializeField] private UI.RaceHUD hud;
        [SerializeField] private Save.SaveSystem saveSystem;

        [Header("Gameplay")]
        [SerializeField] private bool isGameRunning;
        [SerializeField] private string selectedCarId = "nova_gt";

        private void Awake()
        {
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 0;
        }

        private void Start()
        {
            if (saveSystem != null)
            {
                saveSystem.LoadProgress();
            }

            if (playerVehicle != null)
            {
                playerVehicle.SetVehicleId(selectedCarId);
            }

            if (raceManager != null)
            {
                raceManager.Initialize();
            }
        }

        public void StartRace()
        {
            isGameRunning = true;
            if (raceManager != null)
            {
                raceManager.StartRace();
            }

            if (hud != null)
            {
                hud.ShowRaceHUD(true);
            }
        }

        public void PauseRace()
        {
            if (raceManager != null)
            {
                raceManager.SetPaused(true);
            }
        }

        public void ResumeRace()
        {
            if (raceManager != null)
            {
                raceManager.SetPaused(false);
            }
        }

        public void ReturnToMenu()
        {
            SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
        }
    }
}
