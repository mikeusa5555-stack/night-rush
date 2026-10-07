using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace NeonHorizon.UI
{
    /// <summary>
    /// Displays speed, lap time, nitro meter, position, and race state.
    /// </summary>
    public class RaceHUD : MonoBehaviour
    {
        [Header("HUD Elements")]
        [SerializeField] private TextMeshProUGUI speedText;
        [SerializeField] private TextMeshProUGUI timerText;
        [SerializeField] private TextMeshProUGUI positionText;
        [SerializeField] private Image nitroFill;
        [SerializeField] private GameObject racePanel;

        [SerializeField] private float elapsedSeconds;
        [SerializeField] private float currentSpeed;

        public void ShowRaceHUD(bool visible)
        {
            if (racePanel != null)
            {
                racePanel.SetActive(visible);
            }
        }

        public void UpdateHUD(float speedKmh, float nitroAmount, float raceTime)
        {
            currentSpeed = speedKmh;
            elapsedSeconds = raceTime;

            if (speedText != null)
            {
                speedText.text = Mathf.RoundToInt(speedKmh).ToString();
            }

            if (nitroFill != null)
            {
                nitroFill.fillAmount = Mathf.Clamp01(nitroAmount);
            }

            if (timerText != null)
            {
                int minutes = Mathf.FloorToInt(elapsedSeconds / 60f);
                int seconds = Mathf.FloorToInt(elapsedSeconds % 60f);
                int milliseconds = Mathf.FloorToInt((elapsedSeconds * 100f) % 100f);
                timerText.text = string.Format("{0:00}:{1:00}.{2:00}", minutes, seconds, milliseconds);
            }
        }

        public void SetPosition(int position)
        {
            if (positionText != null)
            {
                positionText.text = "P" + position;
            }
        }
    }
}
