# FlyMap
Flying Map Application for MSFS 2020

Work in progress.  But this will be a Electron JS app that connects to MSFS 2020 via Simconnect.  And will show a map of the world, with airports, etc.   It will show the players plane moving on it.

## Status

- Map works now with both dark/light themes with airports
- Airports are now shown on the map with markers (the list is trimmed a bit to majore airports in the world for performance)
- Search for airports now works, it searches on Ident, Iata Code and Name.  Up to 12 results will be presented
- Search results can now be clicked to jump to that airport

## TODO

- Implement Simconnect for getting planes position
- Simbrief integration for flight plan rendering on the map
- More to come!
