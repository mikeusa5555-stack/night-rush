# Unity 6 Android setup

This project is designed as a clean, original arcade racer for Android. The goal is to keep the gameplay loop, save system, and UI architecture modular so it can be expanded without hard coupling between systems.

## Recommended folder layout

```text
Assets/
  Scenes/
  Materials/
  Prefabs/
  Art/
    Cars/
    Environment/
  Scripts/
    Core/
    Vehicle/
    AI/
    Camera/
    Input/
    UI/
    Save/
    Audio/
    Upgrade/
    Gameplay/
ProjectSettings/
```

## Core system responsibilities

### Core
- `GameManager` starts the game flow and coordinates all subsystems.
- `RaceManager` handles checkpoint logic, lap timers, finish conditions, and challenge modes.

### Vehicle
- `VehicleController` handles input, acceleration, steering, drift, braking, and nitro.
- `AIController` follows the target path and adjusts to traffic and racing positions.

### Camera and input
- `CameraFollow` keeps a stable chase camera behind the player vehicle.
- `TouchInputController` maps touch pads to throttle, brake, steering, and nitro.

### UI and progression
- `RaceHUD` updates speed, nitro, lap timer, position, and mini-map.
- `GarageManager` chooses cars, shows stats, and purchases new vehicles.
- `UpgradeManager` applies tuning values to acceleration, top speed, handling, and nitro.
- `SaveSystem` persists credits, owned cars, upgrades, and selected vehicle.

## Android optimization checklist

- Use a fixed landscape aspect ratio for mobile screens.
- Reduce shadow distance and baked lighting complexity.
- Prefer simple materials and light probes.
- Keep physics iterations low and use mobile-friendly rigidbody settings.
- Reduce draw calls with material sharing and static batching.
- Disable expensive post-processing on lower-end devices.
- Use simple particle effects for nitro, smoke, and sparks.
- Limit active traffic vehicles to maintain 60 FPS on mid-range Android devices.

## Production notes

The project intentionally uses original vehicle names, UI, color design, and custom tuning values. It does not use copyrighted names, logos, cars, or source code from any existing racing title.
