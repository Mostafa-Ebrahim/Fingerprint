async function getFingerprint() {
  const navigatorInfo = window.navigator;
  const screenInfo = window.screen;

  const webglFingerprint = await getWebGLFingerprint();

  const audioFingerprint = await getAudioFingerprint();

  let fingerprintData = {
    screenResolution: screenInfo.width + "x" + screenInfo.height,
    colorDepth: screenInfo.colorDepth,
    timezoneOffset: new Date().getTimezoneOffset(),
    hardwareConcurrency: navigatorInfo.hardwareConcurrency,
    devicePixelRatio: window.devicePixelRatio,
    availableScreenSize: screenInfo.availWidth + "x" + screenInfo.availHeight,
    touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    maxTouchPoints: navigatorInfo.maxTouchPoints,
    deviceMemory: navigatorInfo.deviceMemory || "Unknown",
    screenOrientation: screen.orientation ? screen.orientation.type : "Unknown",
    deviceAspectRatio: (screenInfo.width / screenInfo.height).toFixed(2),
    systemLanguage: navigator.language || "Unknown",
    preferredContrast: window.matchMedia("(prefers-contrast: more)").matches
      ? "High"
      : "Normal",
    prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? "Reduce"
      : "No-preference",
    prefersColorScheme: window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "Dark"
      : "Light",
    installedFonts: await detectFonts(),
    webglFingerprint: webglFingerprint,
    audioFingerprint: audioFingerprint,
  };

  const hash = await hashFingerprint(JSON.stringify(fingerprintData));

  document.getElementById("fingerprintHash").textContent = hash;
  const tableBody = document.getElementById("fingerprintTable");

  for (const [key, value] of Object.entries(fingerprintData)) {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())}</td>
        <td>${typeof value === "object" ? JSON.stringify(value) : value}</td>
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

async function getWebGLFingerprint() {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (!gl) {
      return "WebGL not supported";
    }

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const result = {};

    if (debugInfo) {
      result.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      result.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }

    canvas.width = 256;
    canvas.height = 128;

    gl.clearColor(0.2, 0.4, 0.6, 0.8);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const vertices = new Float32Array([-0.7, -0.1, 0.0, 0.4, -0.3, 0.8]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const vsSource = `
        attribute vec2 position;
        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
          gl_PointSize = 10.0;
        }
      `;

    const fsSource = `
        precision mediump float;
        void main() {
          gl_FragColor = vec4(0.9, 0.3, 0.7, 1.0);
        }
      `;

    function createShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    result.imageHash = canvas.toDataURL().slice(-32);

    return result;
  } catch (e) {
    return "WebGL fingerprinting failed: " + e.message;
  }
}

async function getAudioFingerprint() {
  try {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const oscillator = audioContext.createOscillator();
    const dynamicsCompressor = audioContext.createDynamicsCompressor();

    analyser.fftSize = 1024;

    dynamicsCompressor.threshold.setValueAtTime(-50, audioContext.currentTime);
    dynamicsCompressor.knee.setValueAtTime(40, audioContext.currentTime);
    dynamicsCompressor.ratio.setValueAtTime(12, audioContext.currentTime);
    dynamicsCompressor.attack.setValueAtTime(0, audioContext.currentTime);
    dynamicsCompressor.release.setValueAtTime(0.25, audioContext.currentTime);

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);

    oscillator.connect(dynamicsCompressor);
    dynamicsCompressor.connect(analyser);
    analyser.connect(audioContext.destination);

    oscillator.start(0);
    oscillator.stop(0.1);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }

    if (audioContext.close) {
      await audioContext.close();
    }

    return sum.toString(16);
  } catch (e) {
    return "Audio fingerprinting failed: " + e.message;
  }
}

window.addEventListener("load", getFingerprint);
