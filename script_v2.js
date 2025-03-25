document.addEventListener("DOMContentLoaded", async () => {
  const fingerprintHashElement = document.getElementById("fingerprintHash");
  const fingerprintTable = document.getElementById("fingerprintTable");

  try {
    const response = await fetch("https://creepjs-api.web.app/fp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ request: "fingerprint" }),
    });

    const data = await response.json();

    if (data && data.fingerprint) {
      fingerprintHashElement.textContent = data.fingerprint;

      Object.entries(data).forEach(([key, value]) => {
        if (key !== "fingerprint") {
          const row = document.createElement("tr");
          row.innerHTML = `<td>${key}</td><td>${JSON.stringify(value)}</td>`;
          fingerprintTable.appendChild(row);
        }
      });
    } else {
      fingerprintHashElement.textContent =
        "Error: No fingerprint data received";
    }
  } catch (error) {
    console.error("Error fetching fingerprint:", error);
    fingerprintHashElement.textContent = "Error fetching fingerprint data";
  }
});
