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

let recognitionRunning = false;
let recognitionShouldRun = false;
let recognitionRestartTimer = null;

let endingCall = false;

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
    
}

function handleCall(call) {

    console.log("Handling call:", call);

    call.on("stream", (remoteStream) => {

        console.log("🎥 REMOTE STREAM RECEIVED");
        console.log("Remote stream:", remoteStream);

        remoteVideo.srcObject = remoteStream;

        remotePlaceholder.style.display = "none";

        setStatus("Connected");

        // Start recognition ONLY after the video connection
        // is actually established.
        startRecognition();
    });

    call.on("close", () => {

        console.log("📞 Call closed");

        // Do NOT call currentCall.close() again here.
        cleanupCall(false);

        setStatus("Call ended");
    });

    call.on("error", (error) => {

        console.error("❌ CALL ERROR:", error);

        cleanupCall(false);

        setStatus("Call error");
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
    cleanupCall(true);
}

function cleanupCall(closeCall) {

    if (endingCall) {
        return;
    }

    endingCall = true;

    // Stop recognition and prevent automatic restart.
    stopRecognition();

    // Save references before clearing them.
    const call = currentCall;
    currentCall = null;

    // Only close the call when WE initiated the hangup.
    // If PeerJS already fired "close", don't close it again.
    if (closeCall && call) {
        try {
            call.close();
        } catch (error) {
            console.warn(
                "Call was already closed:",
                error
            );
        }
    }

    const connection = dataConnection;
    dataConnection = null;

    if (connection) {
        try {
            connection.close();
        } catch (error) {
            console.warn(
                "Data connection was already closed:",
                error
            );
        }
    }

    remoteVideo.srcObject = null;

    remotePlaceholder.style.display = "flex";

    showSubtitle("");

    setStatus("Call ended");

    // Allow another call to start cleanly.
    setTimeout(() => {
        endingCall = false;
    }, 0);
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

    const SpeechAPI =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechAPI) {

        console.warn(
            "Speech Recognition API is not supported."
        );

        showSubtitle(
            "Speech API not supported in this browser."
        );

        return false;
    }

    // Only create ONE recognition object.
    if (recognition) {
        return true;
    }

    recognition = new SpeechAPI();

    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.lang =
        isNick
            ? 'en-US'
            : 'pt-BR';


    recognition.onstart = () => {

        recognitionRunning = true;

        console.log(
            "🎤 Speech recognition started"
        );
    };


    recognition.onresult = event => {

        let interimText = '';
        let finalText = '';

        for (
            let i = event.resultIndex;
            i < event.results.length;
            ++i
        ) {

            const alternative =
                event.results[i][0];

            if (
                event.results[i].isFinal
            ) {

                finalText +=
                    alternative.transcript;

            } else {

                interimText +=
                    alternative.transcript;
            }
        }

        const currentText =
            finalText || interimText;

        console.log(
            "Current Subtitle Text:",
            currentText
        );


        // Only send when the data channel
        // is actually open.
        if (
            dataConnection &&
            dataConnection.open &&
            currentText
        ) {

            try {

                dataConnection.send({
                    type: 'subtitle',
                    text: currentText
                });

            } catch (error) {

                console.warn(
                    "Unable to send subtitle:",
                    error
                );
            }
        }
    };


    recognition.onerror = event => {

        console.warn(
            "🎤 Speech recognition error:",
            event.error
        );

        recognitionRunning = false;

        // These errors mean the browser has
        // denied/blocked speech recognition.
        if (
            event.error === 'not-allowed' ||
            event.error === 'service-not-allowed'
        ) {

            recognitionShouldRun = false;

            showSubtitle(
                "Microphone permission is required for subtitles."
            );
        }
    };


    recognition.onend = () => {

        recognitionRunning = false;

        console.log(
            "🎤 Speech recognition ended. Restart:",
            recognitionShouldRun
        );

        // If the call has ended, DO NOT restart.
        if (!recognitionShouldRun) {
            return;
        }

        clearTimeout(
            recognitionRestartTimer
        );

        // Chrome frequently ends SpeechRecognition
        // even when continuous=true.
        //
        // Wait briefly before restarting.
        recognitionRestartTimer =
            setTimeout(() => {

                recognitionRestartTimer = null;

                startRecognition();

            }, 250);
    };


    return true;
}

function startRecognition() {

    recognitionShouldRun = true;

    if (!initSpeechRecognition()) {
        return;
    }

    // Already running — do nothing.
    if (recognitionRunning) {

        console.log(
            "🎤 Recognition already running"
        );

        return;
    }

    try {

        recognition.start();

    } catch (error) {

        // Chrome throws this if start() is called
        // while recognition is already starting/running.
        if (
            error.name ===
            'InvalidStateError'
        ) {

            console.log(
                "🎤 Recognition is already starting/running."
            );

            return;
        }

        console.error(
            "❌ Unable to start speech recognition:",
            error
        );

        clearTimeout(
            recognitionRestartTimer
        );

        recognitionRestartTimer =
            setTimeout(() => {

                recognitionRestartTimer = null;

                if (
                    recognitionShouldRun &&
                    !recognitionRunning
                ) {

                    startRecognition();
                }

            }, 500);
    }
}

function stopRecognition() {

    // Tell onend NOT to restart recognition.
    recognitionShouldRun = false;

    clearTimeout(
        recognitionRestartTimer
    );

    recognitionRestartTimer = null;


    if (!recognition) {

        recognitionRunning = false;

        return;
    }


    try {

        recognition.stop();

    } catch (error) {

        if (
            error.name !==
            'InvalidStateError'
        ) {

            console.warn(
                "Speech recognition stop warning:",
                error
            );
        }
    }

    recognitionRunning = false;

    // IMPORTANT:
    // Do NOT destroy the recognition object.
    //
    // It can be reused on the next call.
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