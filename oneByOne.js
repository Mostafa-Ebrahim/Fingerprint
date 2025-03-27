async function getFingerprint() {
  const navigatorInfo = window.navigator;
  const screenInfo = window.screen;

  let fingerprintData = {
    motionSupport: typeof DeviceMotionEvent !== "undefined",
    orientationSupport: typeof DeviceOrientationEvent !== "undefined",

    audioFingerprint: await getAudioFingerprint(),
    // permissions: Object.entries(await getPermissionStates())
    //   .map(([k, v]) => `${k}: ${v}`)
    //   .join(", "),

    mediaDevicesCount:
      (await navigator.mediaDevices
        ?.enumerateDevices?.()
        .then((devices) => devices.length)
        .catch(() => "Unavailable")) || "Unavailable",

    cookiesEnabled: navigator.cookieEnabled,
    localStorageAvailable: (function () {
      try {
        const testKey = "__test";
        localStorage.setItem(testKey, "1");
        localStorage.removeItem(testKey);
        return true;
      } catch (e) {
        return false;
      }
    })(),
    imageRendering: getCanvasPixelFingerprint(),
    webRTCSupported: typeof RTCPeerConnection !== "undefined",
    keyboardLocale: Intl.DateTimeFormat().resolvedOptions().locale || "Unknown",
    mathFingerprint: [
      Math.acos(0.123456789),
      Math.sin(-1e300),
      Math.sqrt(2),
      Math.log10(1000),
    ]
      .map((n) => n.toFixed(15))
      .join(","),
    virtualKeyboardSupport: !!navigator.virtualKeyboard,
    forceTouchSupport:
      "ontouchforcechange" in window || "onwebkitmouseforcechanged" in window,

    platform: (navigatorInfo.platform || "Unknown").split(/\s+/)[0],
    screenOrientationAngle: screen.orientation?.angle ?? "Unknown",
    deviceMemory: navigator.deviceMemory || "Unknown",
    screenResolution: screenInfo.width + "x" + screenInfo.height,
    colorDepth: screenInfo.colorDepth,
    timezoneOffset: new Date().getTimezoneOffset(),
    hardwareConcurrency: navigatorInfo.hardwareConcurrency,
    maxTouchPoints: navigatorInfo.maxTouchPoints,
    devicePixelRatio: window.devicePixelRatio,
    logicalProcessors: navigator.hardwareConcurrency || "Unknown",
    touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    screenOrientation: screen.orientation ? screen.orientation.type : "Unknown",
    colorGamut: navigatorInfo.colorGamut || "Unknown",
    monochromeDepth: navigatorInfo.monochrome || "Unknown",
    pointerCapabilities: navigator.maxTouchPoints > 0 ? "Touch" : "Mouse",
    deviceType: /Mobi|Android/i.test(navigator.userAgent)
      ? "Mobile"
      : "Desktop",
    navigatorLanguage:
      navigator.languages && navigator.languages.length > 0
        ? navigator.languages[0]
        : navigator.language || "Unknown",
    cpuThreads: navigator.hardwareConcurrency || "Unknown",
    hardwareConcurrencyLevel: navigator.hardwareConcurrency || "Unknown",
    deviceAspectRatio: (screenInfo.width / screenInfo.height).toFixed(2),
    maxColorDepth: screenInfo.pixelDepth || "Unknown",
    preferredContrast: window.matchMedia("(prefers-contrast: more)").matches
      ? "High"
      : "Normal",
    prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? "Reduce"
      : "No-preference",
    installedFonts: await detectFonts(),
    gpuModel: getGPUModel(),
  };

  const hash = await hashFingerprint(JSON.stringify(fingerprintData));

  // Display the data
  document.getElementById("fingerprintHash").textContent = hash;
  const tableBody = document.getElementById("fingerprintTable");

  for (const [key, value] of Object.entries(fingerprintData)) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())}</td>
      <td>${value}</td>
    `;
    tableBody.appendChild(row);
  }

  return hash;
}

async function hashFingerprint(input) {
  const buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function detectFonts() {
  const testFonts = [
    "Arial",
    "Verdana",
    "Times New Roman",
    "Courier New",
    "Comic Sans MS",
    "Georgia",
    "Impact",
    "Trebuchet MS",
    "Palatino Linotype",
    "Tahoma",
    "Century Gothic",
    "Lucida Console",
    "Lucida Sans",
    "Garamond",
    "Franklin Gothic Medium",
  ];
  const defaultFont = "sans-serif";
  const sampleText =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let detectedFonts = [];

  const measureFont = (font) => {
    let span = document.createElement("span");
    span.style.fontFamily = defaultFont;
    span.style.fontSize = "16px";
    span.style.position = "absolute";
    span.style.visibility = "hidden";
    span.textContent = sampleText;
    document.body.appendChild(span);
    let defaultWidth = span.offsetWidth;

    span.style.fontFamily = `${font}, ${defaultFont}`;
    let newWidth = span.offsetWidth;

    document.body.removeChild(span);

    return newWidth !== defaultWidth;
  };

  for (let font of testFonts) {
    if (measureFont(font)) {
      detectedFonts.push(font);
    }
  }

  return detectedFonts.join(", ");
}

function getGPUModel() {
  const canvas = document.createElement("canvas");
  const gl =
    canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (!gl) return "Unknown";
  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  if (debugInfo) {
    return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
  }
  return "Unknown";
}
function getCanvasPixelFingerprint() {
  const canvas = document.createElement("canvas");
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f00";
  ctx.fillRect(10, 10, 80, 80);
  const pixel = ctx.getImageData(50, 50, 1, 1).data;
  return `rgba(${pixel[0]},${pixel[1]},${pixel[2]},${pixel[3]})`;
}

async function getAudioFingerprint() {
  try {
    const OfflineContext =
      window.OfflineAudioContext || window.webkitOfflineAudioContext;

    if (!OfflineContext) {
      return "Not supported";
    }

    const context = new OfflineContext(1, 44100, 44100);
    const oscillator1 = context.createOscillator();
    const oscillator2 = context.createOscillator();
    const compressor = context.createDynamicsCompressor();
    const merger = context.createGain();

    oscillator1.type = "triangle";
    oscillator1.frequency.setValueAtTime(1000, context.currentTime);

    oscillator2.type = "sawtooth";
    oscillator2.frequency.setValueAtTime(1500, context.currentTime + 0.01);

    oscillator1.connect(merger);
    oscillator2.connect(merger);
    merger.connect(compressor);
    compressor.connect(context.destination);

    oscillator1.start();
    oscillator2.start();

    const buffer = await context.startRendering();
    const channelData = buffer.getChannelData(0);

    const fingerprint = channelData.reduce(
      (sum, value) => sum + Math.abs(value),
      0
    );

    return fingerprint.toFixed(3);
  } catch (error) {
    // console.error("Audio fingerprinting error:", error.message);
    return "Not supported";
  }
}

async function getAudioFingerprint() {
  try {
    const OfflineContext =
      window.OfflineAudioContext || window.webkitOfflineAudioContext;

    if (!OfflineContext) {
      return "Not supported";
    }

    const startTime = performance.now();
    const context = new OfflineContext(1, 44100, 44100);
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const compressor = context.createDynamicsCompressor();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(950, context.currentTime);

    const randomGain = Math.sin(performance.now() % 1000) * 0.3 + 0.7;
    gainNode.gain.setValueAtTime(randomGain, context.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(compressor);
    compressor.connect(context.destination);

    oscillator.start();

    const buffer = await context.startRendering();
    const channelData = buffer.getChannelData(0);

    const fingerprint = channelData.reduce(
      (sum, value, index) =>
        sum + Math.abs(value * (index % 2 === 0 ? 1.1 : 0.9)),
      0
    );

    const processingTime = performance.now() - startTime;

    const compressorValues = [
      compressor.threshold.value,
      compressor.knee.value,
      compressor.ratio.value,
      compressor.attack.value,
      compressor.release.value,
    ].map((v) => v.toFixed(2));

    const screenFactor = window.screen.width * window.screen.height;
    const audioLatency = context.baseLatency || 0.0001;

    return `${fingerprint.toFixed(3)}-${processingTime.toFixed(
      2
    )}-${compressorValues.join(",")}-${screenFactor}-${audioLatency}`;
  } catch (error) {
    console.error("Audio fingerprinting error:", error.message);
    return "Not supported";
  }
}

window.addEventListener("load", getFingerprint);
