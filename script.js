async function getFingerprint() {
  const navigatorInfo = window.navigator;
  const screenInfo = window.screen;

  let fingerprintData = {
    platform: navigatorInfo.platform ? navigatorInfo.platform.split(" ")[0] : "Unknown",
    screenResolution: screenInfo.width + "x" + screenInfo.height,
    colorDepth: screenInfo.colorDepth,
    timezoneOffset: new Date().getTimezoneOffset(),
    hardwareConcurrency: navigatorInfo.hardwareConcurrency,
    maxTouchPoints: navigatorInfo.maxTouchPoints,
    devicePixelRatio: window.devicePixelRatio,
    availableScreenWidth: screenInfo.availWidth,
    availableScreenHeight: screenInfo.availHeight,
    logicalProcessors: navigator.hardwareConcurrency || "Unknown",
    touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    screenOrientation: screen.orientation ? screen.orientation.type : "Unknown",
    colorGamut: navigatorInfo.colorGamut || "Unknown",
    monochromeDepth: navigatorInfo.monochrome || "Unknown",
    pointerCapabilities: navigator.maxTouchPoints > 0 ? "Touch" : "Mouse",
    deviceType: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
    navigatorLanguage: navigator.languages && navigator.languages.length > 0
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
  };

  const hash = await hashFingerprint(JSON.stringify(fingerprintData));
  
  // Display the data
  document.getElementById('fingerprintHash').textContent = hash;
  const tableBody = document.getElementById('fingerprintTable');
  
  for (const [key, value] of Object.entries(fingerprintData)) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</td>
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

window.addEventListener('load', getFingerprint);
