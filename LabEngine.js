/**
 * LabEngine Documentation Module: Kinetics
 * Description: Implements Michaelis–Menten kinetics lab functionalities.
 * Author: Grant Culbertson 
 * This code had been developed to simulate enzyme kinetics experiments,
 * allowing users to generate data, visualize it, and fit parameters.
 * AI was used to assist in code generation and optimization.
 */
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
  LE.kinetics.init = function () {
  const run = document.getElementById("mm_run");
  const fit = document.getElementById("mm_fit");

  if (!run || !fit) {
    console.warn("Kinetics lab not in DOM yet");
    return;
  }

  run.onclick = LE.kinetics.runLab;
  fit.onclick = LE.kinetics.fitLab;

  console.log("Kinetics lab initialized");
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

  function debounce(fn, wait = 120) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

  // ---------- Plotting ----------
LE.kinetics._chart = null;
LE.kinetics._resizeObserver = null;

LE.kinetics.plot = function (data) {
  const canvas = document.getElementById("mm_chart");
  const container = document.getElementById("mm_chart_container");

  if (!canvas || !container) {
    console.warn("Chart container or canvas missing");
    return;
  }

  const ctx = canvas.getContext("2d");

  // ----- Update existing chart -----
  if (LE.kinetics._chart) {
    LE.kinetics._chart.data.datasets[0].data =
      data.map(d => ({ x: d.S, y: d.v }));
    LE.kinetics._chart.update("none");
    return;
  }

  // ----- Create chart -----
  LE.kinetics._chart = new Chart(ctx, {
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
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          type: "linear",
          title: { display: true, text: "[S] (µM)" }
        },
        y: {
          title: { display: true, text: "v₀ (µM·s⁻¹)" }
        }
      }
    }
  });

  // ----- Prevent mouse wheel scroll from affecting page -----
  canvas.addEventListener("wheel", e => e.preventDefault(), { passive: false });

  // ----- Resize observer (mobile-safe, no resize loops) -----
  if (window.ResizeObserver) {
    if (LE.kinetics._resizeObserver) {
      LE.kinetics._resizeObserver.disconnect();
    }

    let resizeTimer = null;

    LE.kinetics._resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (LE.kinetics._chart) {
          LE.kinetics._chart.resize();
        }
      }, 120);
    });

    LE.kinetics._resizeObserver.observe(container);
  }
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
})();
