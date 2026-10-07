# Neon Horizon

Neon Horizon is an original arcade street-racing game concept built for mobile-first Android play. It avoids copying any EA or Need for Speed assets and instead creates a distinct identity with fictional cars, a neon city night setting, original UI, and original vehicle tuning.

## Project structure

- `Assets/Scenes/` — game scenes and environment setup
- `Assets/Scripts/Core/` — game bootstrap and race flow
- `Assets/Scripts/Vehicle/` — player driving, AI cars, and tuning logic
- `Assets/Scripts/Camera/` — third-person chase camera
- `Assets/Scripts/Input/` — touch controls and input mapping
- `Assets/Scripts/UI/` — HUD and menus
- `Assets/Scripts/Save/` — local PlayerPrefs save system
- `Assets/Scripts/Audio/` — engine, nitro, drift, collisions, music placeholders
- `Assets/Scripts/Upgrade/` — garage, credits, and upgrade logic
- `ProjectSettings/` — Unity 6 project defaults

## Browser prototype status

The workspace already contains a playable browser prototype with:

- main menu and mode switching
- garage selection for original fictional cars
- street-racing and parking mode
- touch controls
- responsive mobile layout
- offline install support via service worker

This is intended as a fast mobile prototype and a basis for a Unity 6 Android version.

## Unity 6 setup

1. Open this folder in Unity 6.
2. Create a new 3D URP or Built-in project if needed.
3. Copy the scripts under `Assets/Scripts/` into the Unity project.
4. Create a `MainScene` and attach `GameManager` to a root object.
5. Add `VehicleController`, `TouchInputController`, `CameraFollow`, and `RaceManager` to the active player car.
6. Create UI canvases for the HUD, garage, and upgrade panels.
7. Build for Android in landscape orientation and target modern devices.

## Original identity

The game uses fictional vehicles such as:

- Nova GT
- Apex R
- Vanta RS
- Brimstone S
- Ion X
- Kestrel V
- Driftline Z
- Ember S

These names were created specifically for this project and are not based on real-world copyrighted car brands or trademarks.
