# Open Darts Backend

This is the backend service for the Open Darts application. It provides RESTful APIs and WebSocket connections to manage
dart game sessions, player statistics, and match history.

Built with Java and Spring Boot, it uses Maven for dependency management and Docker for containerization. Data is
persisted using a relational database.

## Features

- Real-time game updates via WebSockets for live scoring and state synchronization.
- Automatic scoring logic for various X01
- Game state management and stabilization to ensure consistent data handling.