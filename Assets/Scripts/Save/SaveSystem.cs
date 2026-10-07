using UnityEngine;

namespace NeonHorizon.Save
{
    /// <summary>
    /// Stores progression data such as credits, owned cars, selected car, and upgrade levels
    /// using Unity PlayerPrefs so progress survives between sessions on Android.
    /// </summary>
    public class SaveSystem : MonoBehaviour
    {
        private const string CreditsKey = "neon_horizon_credits";
        private const string SelectedCarKey = "neon_horizon_selected_car";
        private const string OwnedCarsKey = "neon_horizon_owned_cars";

        public int Credits { get; private set; }
        public string SelectedCarId { get; private set; } = "nova_gt";

        public void LoadProgress()
        {
            Credits = PlayerPrefs.GetInt(CreditsKey, 1200);
            SelectedCarId = PlayerPrefs.GetString(SelectedCarKey, "nova_gt");
        }

        public void SaveProgress()
        {
            PlayerPrefs.SetInt(CreditsKey, Credits);
            PlayerPrefs.SetString(SelectedCarKey, SelectedCarId);
            PlayerPrefs.Save();
        }

        public void AddCredits(int amount)
        {
            Credits += amount;
            SaveProgress();
        }

        public bool CanAfford(int cost)
        {
            return Credits >= cost;
        }

        public void SpendCredits(int amount)
        {
            Credits = Mathf.Max(0, Credits - amount);
            SaveProgress();
        }

        public void SetSelectedCar(string carId)
        {
            SelectedCarId = carId;
            SaveProgress();
        }
    }
}
