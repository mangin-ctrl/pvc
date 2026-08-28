import Peer from 'peerjs';
import './style.css';

const isNick =
    window.location.pathname.endsWith(
        'nick.html'
    );

const MY_PEER_ID =
    isNick
        ? 'nick'
        : 'ana';


const REMOTE_PEER_ID =
    isNick
        ? 'ana'
        : 'nick';


const localVideo =
    document.getElementById(
        'localVideo'
    );


const remoteVideo =
    document.getElementById(
        'remoteVideo'
    );


const callButton =
    document.getElementById(
        'callButton'
    );


const hangupButton =
    document.getElementById(
        'hangupButton'
    );

const status =
    document.getElementById(
        'status'
    );

const remotePlaceholder =
    document.getElementById(
        'remotePlaceholder'
    );

const peer = new Peer(MY_PEER_ID);

let localStream = null;

let currentCall = null;

let dataConnection = null;

let recognition = null;

async function startCamera() {

    try {

        console.log(
            'Starting camera...'
        );

        localStream =
            await navigator
                .mediaDevices
                .getUserMedia({
                    video: true,
                    audio: true
                });

        localVideo.srcObject =
            localStream;

        console.log(
            'Camera started successfully'
        );

        setStatus(
            'Camera ready'
        );

    } catch (error) {

        console.error(
            error
        );

        setStatus(
            'Camera/microphone permission denied'
        );
    }
}

function setStatus(
    message
) {
    status.textContent =
        message;
}

peer.on(
    'open',
    (id) => {

        console.log(
            'Peer connected:',
            id
        );

        setStatus(
            `Online as ${id}`
        );

    }
);

peer.on("call", (call) => {

    console.log("📞 INCOMING CALL");
    console.log("Caller:", call.peer);

    setStatus("Incoming call...");

    if (!localStream) {

        console.error(
            "❌ No local stream available!"
        );
        return;
    }

    console.log(
        "Answering with local stream:",
        localStream
    );

    call.answer(localStream);

    currentCall = call;
    handleCall(call);
});

function callPerson() {

    if (!localStream) {
        setStatus(
            'Camera is not ready'
        );
        return;
    }

    setStatus(
        `Calling ${REMOTE_PEER_ID}...`
    );

    console.log(
        "📞 Calling:",
        REMOTE_PEER_ID
    );

    console.log(
        "Local stream:",
        localStream
    );

    const call =
        peer.call(
            REMOTE_PEER_ID,
            localStream
        );

    currentCall =
        call;

    handleCall(
        call
    );
    console.log("Start Recognition");
    startRecognition();
    console.log("Recognition started");
    
}

function handleCall(call) {

    console.log("Handling call:", call);

    if (!recognition) {
        initSpeechRecognition();
    }

    call.on("stream", (remoteStream) => {
        console.log("🎥 REMOTE STREAM RECEIVED");
        console.log("Remote stream:", remoteStream);
        remoteVideo.srcObject = remoteStream;
        remotePlaceholder.style.display = "none";
        setStatus("Connected");
        if (!recognition) {
            initSpeechRecognition();
        }
        startRecognition();
    });

    call.on("close", () => {

        console.log("Call closed");
        endCall();
        stopRecognition();
        setStatus("Call ended");
    });

    call.on("error", (error) => {
        console.error("❌ CALL ERROR:", error);
        setStatus("Call error");
        endCall();
    });
}

callButton.addEventListener(
    'click',
    () => {
        connectData();
        callPerson();
    }
);

hangupButton.addEventListener(
    'click',
    () => {
        endCall();

        setStatus(
            'Call ended'
        );

    }
);

function endCall() {
    stopRecognition();

    if (currentCall) {
        currentCall.close();
        currentCall = null;
    }

    if (dataConnection) {
        dataConnection.close();
        dataConnection = null;
    }

    remoteVideo.srcObject = null;
    remotePlaceholder.style.display = "flex";

    showSubtitle("");
    setStatus("Call ended");
}

startCamera();

function showSubtitle(
    text
) {

    const textElement =
        document.querySelector(
            '.subtitle-text'
        );

    textElement.textContent = text;
}

function initSpeechRecognition() {
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechAPI) {
        showSubtitle("Speech API not supported in this browser.");
        return;
    }

    recognition = new SpeechAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = isNick ? 'en-US' : 'pt-BR';

    recognition.onresult = event => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {

            // Accessing index 0 of the alternative array inside the results array
            const alternative = event.results[i][0];

            if (event.results[i].isFinal) {
                finalText += alternative.transcript;
            } else {
                interimText += alternative.transcript;
            }
        }

        const currentText = finalText || interimText;

        console.log("Current Subtitle Text: ", currentText);

        if (dataConnection && dataConnection.open && currentText) {
            dataConnection.send({ type: 'subtitle', text: currentText });
        }
    };

    recognition.onerror = e => console.error("Speech Error: ", e);
}

function startRecognition() {
    if (recognition) {
        recognition.start();
    }
}

function stopRecognition() {
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
}

// 🚀 Native Integration Layer with Google Cloud Translate API
async function processAndDisplayRemoteSubtitle(rawText) {
    const targetLang = isNick ? 'en' : 'pt';
    const apiKey = "API KEY"

    // If no API Key is entered, display raw text as fallback
    if (!apiKey) {
        setSubtitleText(`[No API Key - Raw Text]: ${rawText}`);
        return;
    }

    try {
        // Fetch to Google Cloud Translation REST API endpoint (v2 basic)
        const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                q: rawText,
                target: targetLang,
                format: 'text'
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const translatedText = data.data.translations[0].translatedText;

        // Print translated text on remote block
        setSubtitleText(translatedText);

    } catch (error) {
        console.error("Translation Pipeline Failed:", error);
        setSubtitleText(`[Translation Error]: ${rawText}`);
    }
}

function connectData() {

    console.log(
        'Connecting data channel to:',
        REMOTE_PEER_ID
    );

    dataConnection =
        peer.connect(
            REMOTE_PEER_ID,
            {
                reliable: true,
                serialization: 'json'
            }
        );

    setupDataConnection(
        dataConnection
    );
}

peer.on(
    'connection',
    (connection) => {

        console.log(
            '💬 Incoming data connection from:',
            connection.peer
        );

        dataConnection =
            connection;

        setupDataConnection(
            connection
        );

    }
);

function setupDataConnection(
    connection
) {

    connection.on(
        'open',
        () => {

            console.log(
                '💬 DATA CONNECTION OPEN'
            );

            setStatus(
                'Video + Data connected'
            );
        }
    );

    connection.on(
        'data',
        (data) => {

            console.log(
                '📨 DATA RECEIVED:',
                data
            );

            handleData(data);
        }
    );

    connection.on(
        'close',
        () => {

            console.log(
                '💬 Data connection closed'
            );

        }
    );

    connection.on(
        'error',
        (error) => {

            console.error(
                '❌ DATA CONNECTION ERROR:',
                error
            );

        }
    );
}

function handleData(data) {

    if (!data) {
        return;
    }

    if (data.type === 'subtitle') {
        showSubtitle(data.text);
    }
}