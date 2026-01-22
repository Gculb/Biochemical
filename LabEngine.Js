window.LabEngine = {
  utils: {},
  titration: {},
  kinetics: {}
};

// =============================
// Michaelis–Menten Kinetics Lab
// =============================

(() => {
  const LE = window.LabEngine;

  // ---------- Math ----------
  LE.kinetics.mmRate = function (S, Vmax, Km) {
    return (Vmax * S) / (Km + S);
  };

  LE.kinetics.generateData = function ({
    E, kcat, Km, Smax, step, noise = false
  }) {
    const Vmax = kcat * E;
    const data = [];

    for (let S = 0; S <= Smax + 1e-9; S += step) {
      let v = LE.kinetics.mmRate(S, Vmax, Km);

      if (noise) {
        const sigma = 0.08 * v; // ±8% noise
        v += (Math.random() * 2 - 1) * sigma;
      }

      data.push({
        S: +S.toFixed(3),
        v: +v.toFixed(4)
      });
    }

    return { data, Vmax };
  };

  // ---------- Parameter fitting (frontend-safe) ----------
  LE.kinetics.fit = function (data) {
    let best = { err: Infinity, Km: 0, Vmax: 0 };

    for (let Km = 1; Km <= 500; Km += 1) {
      for (let Vmax = 1; Vmax <= 1000; Vmax += 5) {
        let err = 0;
        for (const p of data) {
          const pred = LE.kinetics.mmRate(p.S, Vmax, Km);
          err += (pred - p.v) ** 2;
        }
        if (err < best.err) best = { err, Km, Vmax };
      }
    }
    return best;
  };

  // ---------- Plotting ----------
  let mmChart = null;

  LE.kinetics.plot = function (data) {
    const ctx = document.getElementById("mm_chart").getContext("2d");

    if (mmChart) {
      mmChart.data.datasets[0].data =
        data.map(d => ({ x: d.S, y: d.v }));
      mmChart.update();
      return;
    }

    mmChart = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [{
          label: "Initial velocity (v₀)",
          data: data.map(d => ({ x: d.S, y: d.v })),
          showLine: true,
          tension: 0.2,
          pointRadius: 3
        }]
      },
      options: {
        scales: {
          x: { title: { display: true, text: "[S] (µM)" } },
          y: { title: { display: true, text: "v₀ (µM·s⁻¹)" } }
        }
      }
    });
  };

  // ---------- UI Controller ----------
  LE.kinetics.runLab = function () {
    const params = {
      E: +mm_E.value,
      kcat: +mm_kcat.value,
      Km: +mm_Km.value,
      Smax: +mm_Smax.value,
      step: +mm_step.value,
      noise: mm_noise.checked
    };

    const result = LE.kinetics.generateData(params);
    LE.kinetics._data = result.data;

    LE.kinetics.plot(result.data);

    mm_info.innerHTML = `
      <strong>True Vmax:</strong> ${(params.kcat * params.E).toFixed(2)} µM·s⁻¹<br>
      <em>Determine Km from the curve.</em>
    `;
  };

  LE.kinetics.fitLab = function () {
    if (!LE.kinetics._data) return;

    const fit = LE.kinetics.fit(LE.kinetics._data);

    mm_info.innerHTML += `
      <br><strong>Estimated Vmax:</strong> ${fit.Vmax.toFixed(1)} µM·s⁻¹
      &nbsp; | &nbsp;
      <strong>Estimated Km:</strong> ${fit.Km.toFixed(1)} µM
    `;
  };

  // ---------- Event hooks ----------
  document.addEventListener("DOMContentLoaded", () => {
    if (window.mm_run) {
      mm_run.addEventListener("click", LE.kinetics.runLab);
      mm_fit.addEventListener("click", LE.kinetics.fitLab);
    }
  });
})();
