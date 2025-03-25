document.addEventListener("DOMContentLoaded", async () => {
  const fingerprintHashElement = document.getElementById("fingerprintHash");
  const fingerprintTable = document.getElementById("fingerprintTable");

  try {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = "https://abrahamjuliot.github.io/creepjs/";
    document.body.appendChild(iframe);

    iframe.onload = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const fingerprint = iframe.contentWindow.FingerprintJS;
        if (!fingerprint)
          throw new Error("FingerprintJS not found inside iframe.");

        const fp = await fingerprint.load();
        const result = await fp.get();

        const fingerprintData = {
          visitorId: result.visitorId,
          components: result.components,
        };

        const response = await fetch("https://creepjs-api.web.app/fp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fingerprintData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP error! Status: ${response.status}, Response: ${errorText}`
          );
        }

        const apiData = await response.json();
        fingerprintHashElement.textContent =
          apiData.fingerprint || fingerprintData.visitorId;
        fingerprintTable.innerHTML = "";

        function addTableRow(key, value) {
          const row = document.createElement("tr");
          row.innerHTML = `<td>${key}</td><td>${
            typeof value === "object" ? JSON.stringify(value, null, 2) : value
          }</td>`;
          fingerprintTable.appendChild(row);
        }

        Object.entries(apiData).forEach(([key, value]) =>
          addTableRow(key, value)
        );

        const analysisResponse = await fetch(
          "https://creepjs-api.web.app/analysis",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fingerprint: apiData.fingerprint }),
          }
        );

        if (!analysisResponse.ok) {
          const errorText = await analysisResponse.text();
          throw new Error(
            `Analysis HTTP error! Status: ${analysisResponse.status}, Response: ${errorText}`
          );
        }

        const analysisData = await analysisResponse.json();
        Object.entries(analysisData).forEach(([key, value]) =>
          addTableRow(key, value)
        );
      } catch (error) {
        fingerprintHashElement.textContent = "Error fetching fingerprint data";
      }
    };
  } catch (error) {
    fingerprintHashElement.textContent = "Error loading fingerprint script";
  }
});
