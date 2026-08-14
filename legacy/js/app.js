const user1 = document.getElementById("user1");
const user2 = document.getElementById("user2");
let localStream = null;
let remoteStream = null;
let peerConnection = null;
const AGORA_APP_ID = APP_ID; // APP_ID is defined in my config.js file. Get it from your Agora dashboard.
let token = null;

// generate random number for uid
const uid = String(Math.floor(Math.random() * 10000));
let client;
let channel;

// servers
const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};
const init = async () => {
  // Initialize Agora client
  client = AgoraRTM.createInstance(AGORA_APP_ID);

  // Display connection state changes
  client.on("ConnectionStateChanged", function (state, reason) {
    console.log("State changed To: " + state + " Reason: " + reason);
  });

  // respond to message
  client.on("MessageFromPeer", handleMessageFromPeer);
  // login
  await client.login({ uid, token});
  // create channel
  channel = client.createChannel("main");

  // join channel
  await channel.join();

  // check if user joined
  channel.on("MemberJoined", handleUserJoined);

  // check if user left
  channel.on("MemberLeft", handleUserLeft);

  // Get local stream
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  // Display local stream on #user1
  user1.srcObject = localStream;
};

const createPeerConnection = async (MemberId) => {
  // Create peer connection
  peerConnection = new RTCPeerConnection(servers);
  // make remote stream available to #user2
  remoteStream = new MediaStream();
  user2.srcObject = remoteStream;

  // display user2
  user2.style.display = "block";

  // Add local stream to peer connection and display it on #user1 if not already added
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    // Display local stream on #user1
    user1.srcObject = localStream;
  }

  // Add local stream to peer connection
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // Add remote stream to peer connection
  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  // ice candidate
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      client.sendMessageToPeer(
        {
          text: JSON.stringify({
            type: "candidate",
            candidate: event.candidate,
          }),
        },
        MemberId
      );
    }
  };
}

const createOffer = async (MemberId) => {
  // create peer connection
  await createPeerConnection(MemberId);
  
  // create offer and set local description
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  // send offer to remote user
  client.sendMessageToPeer(
    {
      text: JSON.stringify({
        type: "offer",
        offer,
      }),
    },
    MemberId
  );
};

function handleUserJoined(MemberId) {
  console.log("User joined", MemberId);
  // create offer
  createOffer(MemberId);
}
function handleUserLeft(MemberId) {
  console.log("User left", MemberId);
  // close peer connection
  peerConnection.close();
  peerConnection = null;
  // hide user2
  user2.style.display = "none";
}

async function handleMessageFromPeer(message, MemberId) {
  message = JSON.parse(message.text);
  if (message.type === "offer") {
    createAnswer(MemberId, message.offer);
  }
  if (message.type === "answer") {
    addAnswer(message.answer);
  }

  if (message.type === "candidate") {
    if (peerConnection) {
      peerConnection.addIceCandidate(message.candidate);
    }
  }
}

async function createAnswer(MemberId, offer){
  // create peer connection
  await createPeerConnection(MemberId);
  
  // set remote description
  // await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  await peerConnection.setRemoteDescription(offer);

  // create answer
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  
  // send answer to remote user
  client.sendMessageToPeer({
    text: JSON.stringify({
      type: "answer",
      answer,
    })
  }, MemberId);
}

async function addAnswer(answer){

  if(!peerConnection.currentRemoteDescription){
    // set remote description
    peerConnection.setRemoteDescription(answer)
  }
  
}


init();
