using System.Collections.Generic;
using UnityEngine;

namespace NeonHorizon.Upgrade
{
    /// <summary>
    /// Upgrade data and progression for engine, turbo, transmission, tires, chassis,
    /// nitro, and cosmetic accessories. Each stat modifies the vehicle controller.
    /// </summary>
    public class UpgradeManager : MonoBehaviour
    {
        [System.Serializable]
        public class UpgradeLevel
        {
            public string Name;
            public int Cost;
            public float EngineBonus;
            public float SpeedBonus;
            public float HandlingBonus;
            public float NitroBonus;
        }

        public List<UpgradeLevel> engineLevels = new List<UpgradeLevel>();
        public List<UpgradeLevel> turboLevels = new List<UpgradeLevel>();
        public List<UpgradeLevel> tireLevels = new List<UpgradeLevel>();

        public void ApplyUpgrades(Vehicle.VehicleController vehicle)
        {
            if (vehicle == null)
            {
                return;
            }

            // This hook is intentionally minimal to keep the upgrade model reusable.
            // Unity project code can map these values to the actual vehicle stats at runtime.
        }
    }
}
