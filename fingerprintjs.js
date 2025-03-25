(async () => {
  try {
    const FingerprintJS = await import("https://openfpcdn.io/fingerprintjs/v4");
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    const visitorId = result.visitorId;
    document.getElementById("fingerprintHash").textContent = visitorId;
    const fingerprintTable = document.getElementById("fingerprintTable");

    Object.entries(result.components).forEach(([key, { value }]) => {
      let row = document.createElement("tr");

      let propertyCell = document.createElement("td");
      propertyCell.textContent = key;

      let valueCell = document.createElement("td");
      valueCell.textContent = Array.isArray(value) ? value.join(", ") : value;

      row.appendChild(propertyCell);
      row.appendChild(valueCell);
      fingerprintTable.appendChild(row);
    });

    console.log("FingerprintJS Result:", result);
  } catch (error) {
    console.error("FingerprintJS Error:", error);
  }
})();
