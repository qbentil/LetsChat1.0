# LetsChat1.0

As part of my introduction to RTC, I decided to build a simple chat application that allows users to chat with each other in real time video and audio. It is built using WebRTC and Socket.io.


## Features

* Real time video and audio chat
* Join a room and chat with other users

## Limitations
This is a very basic application and only allows a maximum of 2 users to chat with each other. It is also not very secure and does not have any authentication. It is only meant to be a proof of concept.

## What I learnt from this project

* How to use WebRTC
RTC is a set of JavaScript APIs that allow you to capture and share audio and video streams. It also allows you to share data between peers. 

WebRTC is very fast and efficient.
- Connection is P2P	
- Real time communication between browsers. Data is not sent to a server.

## What is WebSockets?

WebSockets is a protocol that allows for full duplex communication between a client and a server. It is a persistent connection between the client and the server. It is a TCP connection that is kept open and allows for real time communication between the client and the server.

- connection is P2S (Peer to Server)
- Real time communication between browsers and server. Data is sent to a server.
- Latency is higher than WebRTC

## Why use WebRTC instead of WebSockets?
WebRTC uses UDP (User Datagram Protocol) which is faster than TCP (Transmission Control Protocol) which is used by WebSockets but 

- UDP is not reliable. It does not guarantee delivery of data.
- UDP is not secure. It does not validate the data that is sent.
- WebRTC is not supported by all browsers. It is supported by Chrome, Firefox and Opera. It is not supported by IE and Safari.

- WebRTC has no built in signaling mechanism. It is up to the developer to implement a signaling mechanism. This is where WebSockets comes in. WebSockets is used to send signaling data between the peers.

## Real time communication Solution?
use WebRTC + WebSock

## Third party libraries used

* [Socket.io](https://socket.io/) - Socket.IO enables real-time bidirectional event-based communication. It works on every platform, browser or device, focusing equally on reliability and speed.

* [Algora](https://www.agora.io/en/) - Agora.io is a real-time video and voice platform that enables developers to build high-quality, real-time, and interactive voice and video applications.

* [WebRTC](https://webrtc.org/) - WebRTC is a free, open project that provides browsers and mobile applications with Real-Time Communications (RTC) capabilities via simple APIs. The WebRTC components have been optimized to best serve this purpose.