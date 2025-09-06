# OpenDarts AutoScore

A **WebSocket server** that processes dartboard images and returns scoring results using the Python package
`dart-detection`. 


## What It Does

Send images of dartboards via WebSocket and receive scoring data in near real time. The server uses `dart-detection` to find
dart positions and calculate scores automatically and sends back a response with the result.


