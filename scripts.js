
        let scene, camera, renderer, mol;
        let drag = false;
        let prev = {x: 0, y: 0};
        let rotSpd = {x: 0.01, y: 0.01};
        let curMol = 'glucose';
        let init = false;

        function startViewer() {
            if (init) return;
            const canvas = document.getElementById('canvas3d');
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0f0f1e);
            camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
            camera.position.z = 15;
            renderer = new THREE.WebGLRenderer({canvas, antialias: true});
            renderer.setSize(canvas.clientWidth, canvas.clientHeight);
            const l1 = new THREE.AmbientLight(0xffffff, 0.7);
            scene.add(l1);
            const l2 = new THREE.DirectionalLight(0xffffff, 0.8);
            l2.position.set(10, 10, 10);
            scene.add(l2);
            canvas.addEventListener('mousedown', e => { drag = true; prev = {x: e.clientX, y: e.clientY}; });
            canvas.addEventListener('mousemove', e => {
                if (drag && mol) {
                    const dx = e.clientX - prev.x;
                    const dy = e.clientY - prev.y;
                    mol.rotation.y += dx * 0.01;
                    mol.rotation.x += dy * 0.01;
                    prev = {x: e.clientX, y: e.clientY};
                }
            });
            canvas.addEventListener('mouseup', () => drag = false);
            canvas.addEventListener('mouseleave', () => drag = false);
            canvas.addEventListener('wheel', e => {
                e.preventDefault();
                camera.position.z += e.deltaY * 0.01;
                camera.position.z = Math.max(5, Math.min(30, camera.position.z));
            });
            init = true;
            loadMolData('glucose');
            loadViews();
            animate();
        }

        function atom(x, y, z, c, s = 0.5) {
            const g = new THREE.SphereGeometry(s, 32, 32);
            const m = new THREE.MeshPhongMaterial({color: c, shininess: 100});
            const a = new THREE.Mesh(g, m);
            a.position.set(x, y, z);
            return a;
        }

        function bond(s, e, c = 0xcccccc) {
            const d = new THREE.Vector3().subVectors(e, s);
            const l = d.length();
            const g = new THREE.CylinderGeometry(0.15, 0.15, l, 8);
            const m = new THREE.MeshPhongMaterial({color: c});
            const b = new THREE.Mesh(g, m);
            b.position.copy(s).add(d.multiplyScalar(0.5));
            b.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
            return b;
        }

        function makeGlucose() {
            const g = new THREE.Group();
            const atoms = [];
            const r = 2;
            for (let i = 0; i < 6; i++) {
                const a = (i * Math.PI * 2) / 6;
                const x = r * Math.cos(a);
                const y = r * Math.sin(a);
                const isO = i === 0;
                const at = atom(x, y, 0, isO ? 0xff0000 : 0x404040, isO ? 0.6 : 0.5);
                atoms.push(at);
                g.add(at);
            }
            for (let i = 0; i < 6; i++) g.add(bond(atoms[i].position, atoms[(i + 1) % 6].position));
            [1, 2, 3, 4].forEach(i => {
                const a = (i * Math.PI * 2) / 6;
                const x = (r + 1.2) * Math.cos(a);
                const y = (r + 1.2) * Math.sin(a);
                const o = atom(x, y, 0, 0xff0000, 0.6);
                g.add(o);
                g.add(bond(atoms[i].position, o.position));
                const hx = x + 0.7 * Math.cos(a);
                const hy = y + 0.7 * Math.sin(a);
                const h = atom(hx, hy, 0, 0xffffff, 0.35);
                g.add(h);
                g.add(bond(o.position, h.position));
            });
            return g;
        }


        function makeAlanine() {
            const g = new THREE.Group();
            const c = atom(0, 0, 0, 0x404040, 0.5);
            g.add(c);
            const n = atom(0, 2, 0, 0x0000ff, 0.6);
            g.add(n);
            g.add(bond(c.position, n.position));
            const h1 = atom(-0.8, 2.8, 0, 0xffffff, 0.35);
            const h2 = atom(0.8, 2.8, 0, 0xffffff, 0.35);
            g.add(h1, h2);
            g.add(bond(n.position, h1.position));
            g.add(bond(n.position, h2.position));
            const cc = atom(2, 0, 0, 0x404040, 0.5);
            g.add(cc);
            g.add(bond(c.position, cc.position));
            const o1 = atom(3, 0.8, 0, 0xff0000, 0.6);
            const o2 = atom(3, -0.8, 0, 0xff0000, 0.6);
            g.add(o1, o2);
            g.add(bond(cc.position, o1.position));
            g.add(bond(cc.position, o2.position));
            const m = atom(-2, 0, 0, 0x404040, 0.5);
            g.add(m);
            g.add(bond(c.position, m.position));
            return g;
        }

        function makeATP() {
            const g = new THREE.Group();
            const ring = [];
            for (let i = 0; i < 5; i++) {
                const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
                const x = -5 + 1.2 * Math.cos(a);
                const y = 1.2 * Math.sin(a);
                const at = atom(x, y, 0, i < 2 ? 0x0000ff : 0x404040, 0.45);
                ring.push(at);
                g.add(at);
            }
            for (let i = 0; i < 5; i++) g.add(bond(ring[i].position, ring[(i + 1) % 5].position));
            const rib = atom(-2.5, 0, 0, 0x404040, 0.5);
            g.add(rib);
            g.add(bond(ring[2].position, rib.position));
            const phos = [];
            for (let i = 0; i < 3; i++) {
                const p = atom(i * 2.5, 0, 0, 0xffa500, 0.6);
                phos.push(p);
                g.add(p);
                const o1 = atom(i * 2.5, 1.2, 0, 0xff0000, 0.5);
                const o2 = atom(i * 2.5, -1.2, 0, 0xff0000, 0.5);
                g.add(o1, o2);
                g.add(bond(p.position, o1.position));
                g.add(bond(p.position, o2.position));
                if (i > 0) g.add(bond(phos[i - 1].position, p.position));
            }
            g.add(bond(rib.position, phos[0].position));
            return g;
        }

        function makeDNA() {
            const g = new THREE.Group();
            const aPos = [{x: -3, y: 1.5}, {x: -2.5, y: 0.5}, {x: -3, y: -0.5}, {x: -4, y: -0.5}, {x: -4.5, y: 0.5}];
            const aAtoms = [];
            aPos.forEach((p, i) => {
                const a = atom(p.x, p.y, 0, i === 0 || i === 4 ? 0x0000ff : 0x404040, 0.45);
                aAtoms.push(a);
                g.add(a);
            });
            for (let i = 0; i < 5; i++) g.add(bond(aAtoms[i].position, aAtoms[(i + 1) % 5].position));
            const tPos = [{x: 3, y: 1.5}, {x: 2.5, y: 0.5}, {x: 3, y: -0.5}, {x: 4, y: -0.5}, {x: 4.5, y: 0.5}];
            const tAtoms = [];
            tPos.forEach((p, i) => {
                const a = atom(p.x, p.y, 0, i === 1 || i === 3 ? 0xff0000 : 0x404040, 0.45);
                tAtoms.push(a);
                g.add(a);
            });
            for (let i = 0; i < 5; i++) g.add(bond(tAtoms[i].position, tAtoms[(i + 1) % 5].position));
            g.add(bond(new THREE.Vector3(-2.5, 1, 0), new THREE.Vector3(2.5, 1, 0), 0x88ff88));
            g.add(bond(new THREE.Vector3(-2.5, -0.2, 0), new THREE.Vector3(2.5, -0.2, 0), 0x88ff88));
            return g;
        }
        function makeDNACG() {
            const g = new THREE.Group();
            const cPos = [{x: -3, y: 1.5}, {x: -2.5, y: 0.5}, {x: -3, y: -0.5}, {x: -4, y: -0.5}, {x: -4.5, y: 0.5}];
            const cAtoms = [];
            cPos.forEach((p, i) => {
                const a = atom(p.x, p.y, 0, i === 1 || i === 3 ? 0x0000ff : 0x404040, 0.45);
                cAtoms.push(a);
                g.add(a);
            });
            for (let i = 0; i < 5; i++) g.add(bond(cAtoms[i].position, cAtoms[(i + 1) % 5].position));
            const gPos = [{x: 3, y: 1.5}, {x: 2.5, y: 0.5}, {x: 3, y: -0.5}, {x: 4, y: -0.5}, {x: 4.5, y: 0.5}];
            const gAtoms = [];
            gPos.forEach((p, i) => {
                const a = atom(p.x, p.y, 0, i === 0 || i === 4 ? 0x404040 : 0x0000ff, 0.45);
                gAtoms.push(a);
                g.add(a);
            });
            for (let i = 0; i < 5; i++) g.add(bond(gAtoms[i].position, gAtoms[(i + 1) % 5].position));
            g.add(bond(new THREE.Vector3(-2.5, 1, 0), new THREE.Vector3(2.5, 1, 0), 0x88ff88));
            g.add(bond(new THREE.Vector3(-2.5, -0.2, 0), new THREE.Vector3(2.5, -0.2, 0), 0x88ff88));
            g.add(bond(new THREE.Vector3(-2.5, 0.4, 0), new THREE.Vector3(2.5, 0.4, 0), 0x88ff88));
            return g;
        }

        function makeAcetylCoA() {
            const g = new THREE.Group();
            const c1 = atom(-1, 0, 0, 0x404040, 0.5);
            const c2 = atom(0.5, 0, 0, 0x404040, 0.5);
            const o = atom(1, 1.3, 0, 0xff0000, 0.6);
            g.add(c1, c2, o);
            g.add(bond(c1.position, c2.position));
            g.add(bond(c2.position, o.position));
            const s = atom(2, 0, 0, 0xffff00, 0.65);
            g.add(s);
            g.add(bond(c2.position, s.position));
            const coa = [];
            for (let i = 0; i < 4; i++) {
                const x = 3.5 + i * 1.5;
                const y = Math.sin(i * 0.5) * 0.8;
                const a = atom(x, y, 0, i % 2 === 0 ? 0x404040 : 0x0000ff, 0.45);
                coa.push(a);
                g.add(a);
                if (i > 0) g.add(bond(coa[i - 1].position, a.position));
            }
            g.add(bond(s.position, coa[0].position));
            return g;
        }
        function makeTrytophan() {
            const molecule = new THREE.Group();
            const SCALE = 1.6;

            function createAtom(x, y, z, element) {
                const styles = {
                    C: [0x404040, 0.4],
                    N: [0x3050f8, 0.45],
                    O: [0xff3030, 0.45],
                    H: [0xffffff, 0.25]
                };
                const [color, radius] = styles[element];
                const atomMesh = atom(x * SCALE, y * SCALE, z * SCALE, color, radius);
                molecule.add(atomMesh);
                return atomMesh;
            }

            function connectAtoms(atomA, atomB) {
                molecule.add(bond(atomA.position, atomB.position));
            }

            // ---------------------------
            // Amino Acid Backbone
            // ---------------------------

            const alphaCarbon = createAtom(0, 0, 0, "C");

            const amineNitrogen = createAtom(-1.2, 0.8, 0, "N");
            const amineHydrogen1 = createAtom(-2.0, 1.3, 0, "H");
            const amineHydrogen2 = createAtom(-1.2, 1.8, 0, "H");

            const carboxylCarbon = createAtom(1.4, 0, 0, "C");
            const carboxylOxygen1 = createAtom(2.4, 0.8, 0, "O");
            const carboxylOxygen2 = createAtom(2.4, -0.8, 0, "O");

            connectAtoms(alphaCarbon, amineNitrogen);
            connectAtoms(amineNitrogen, amineHydrogen1);
            connectAtoms(amineNitrogen, amineHydrogen2);

            connectAtoms(alphaCarbon, carboxylCarbon);
            connectAtoms(carboxylCarbon, carboxylOxygen1);
            connectAtoms(carboxylCarbon, carboxylOxygen2);

            // ---------------------------
            // Side Chain: CH2 linker
            // ---------------------------

            const betaCarbon = createAtom(0, -1.5, 0, "C");
            connectAtoms(alphaCarbon, betaCarbon);

            // ---------------------------
            // Side Chain: Indole Ring
            // ---------------------------

            const indoleCarbons = [
                createAtom(0.8, -3.0, 0, "C"),
                createAtom(2.2, -3.0, 0, "C"),
                createAtom(3.0, -4.2, 0, "C"),
                createAtom(2.2, -5.4, 0, "C"),
                createAtom(0.8, -5.4, 0, "C"),
                createAtom(0.0, -4.2, 0, "C"),
                createAtom(1.5, -6.8, 0, "C"),
                createAtom(2.8, -6.2, 0, "C")
            ];

            const indoleNitrogen = createAtom(1.0, -7.8, 0, "N");

            connectAtoms(betaCarbon, indoleCarbons[0]);

            [
                [0,1],[1,2],[2,3],[3,4],[4,5],[5,0],
                [4,6],[6,7],[7,3]
            ].forEach(([i, j]) =>
                connectAtoms(indoleCarbons[i], indoleCarbons[j])
            );

            connectAtoms(indoleCarbons[6], indoleNitrogen);

            return molecule;
}
        function makeSiliconPolymer() {
            const g = new THREE.Group();
            const len = 5;
            const spacing = 2;
            const atoms = [];
            for (let i = 0; i < len; i++) {
                const si = atom(i * spacing, 0, 0, 0xffa500, 0.7);
                atoms.push(si);
                g.add(si);
                const o1 = atom(i * spacing - 0.7, 1, 0, 0xff0000, 0.5);
                const o2 = atom(i * spacing + 0.7, -1, 0, 0xff0000, 0.5);
                g.add(o1, o2);
                g.add(bond(si.position, o1.position));
                g.add(bond(si.position, o2.position));
                if (i > 0) g.add(bond(atoms[i - 1].position, si.position));
            }
            return g;
        }

        

        function makeCholesterol() {
            const g = new THREE.Group();
            const rings = [
                [{x: 0, y: 0}, {x: 1, y: 0.8}, {x: 2, y: 0.5}, {x: 2.5, y: -0.5}, {x: 1.5, y: -1.2}, {x: 0.5, y: -0.8}],
                [{x: 2.5, y: -0.5}, {x: 3.5, y: 0}, {x: 4.5, y: -0.3}, {x: 4.5, y: -1.5}, {x: 3.5, y: -1.8}, {x: 2.5, y: -1.5}],
                [{x: 4.5, y: -1.5}, {x: 5.5, y: -1.2}, {x: 6.5, y: -1.5}, {x: 6.5, y: -2.5}, {x: 5.5, y: -2.8}, {x: 4.5, y: -2.5}],
                [{x: 6.5, y: -2.5}, {x: 7.5, y: -2.2}, {x: 8, y: -3}, {x: 7.5, y: -3.8}, {x: 6.5, y: -3.5}]
            ];
            rings.forEach(ring => {
                const atoms = [];
                ring.forEach(p => {
                    const a = atom(p.x - 4, p.y + 1.5, 0, 0x404040, 0.4);
                    atoms.push(a);
                    g.add(a);
                });
                for (let i = 0; i < atoms.length; i++) {
                    g.add(bond(atoms[i].position, atoms[(i + 1) % atoms.length].position));
                }
            });
            return g;
        }

        function loadMolData(name) {
            if (!init) { startViewer(); return; }
            if (mol) scene.remove(mol);
            curMol = name;
            const info = {
                glucose: {mol: makeGlucose(), title: 'Glucose (C₆H₁₂O₆)', type: 'Monosaccharide', role: 'Primary energy source', struct: '6-carbon ring', feat: 'Glycolysis substrate'},
                alanine: {mol: makeAlanine(), title: 'Alanine (C₃H₇NO₂)', type: 'Amino acid', role: 'Protein building block', struct: 'Nonpolar side chain', feat: 'Ala or A'},
                atp: {mol: makeATP(), title: 'ATP (C₁₀H₁₆N₅O₁₃P₃)', type: 'Nucleotide', role: 'Energy currency', struct: 'Three phosphates', feat: 'ΔG° = -30.5 kJ/mol'},
                dna: {mol: makeDNA(), title: 'DNA Base Pair (A-T)', type: 'Nucleic acid', role: 'Genetic storage', struct: '2 H-bonds', feat: 'Watson-Crick pairing'},
                dnacg: {mol: makeDNACG(), title: 'DNA Base Pair (C-G)', type: 'Nucleic acid', role: 'Genetic storage', struct: '3 H-bonds', feat: 'Watson-Crick pairing'},
                acetylcoa: {mol: makeAcetylCoA(), title: 'Acetyl-CoA', type: 'Coenzyme', role: 'Metabolic intermediate', struct: '2-carbon acetyl', feat: 'TCA entry'},
                tryptophan: {mol: makeTrytophan(), title: 'Tryptophan (C₁₁H₁₂N₂O₂)', type: 'Amino acid', role: 'Protein building block', struct: 'Aromatic side chain', feat: 'Precursor to serotonin'},
                siliconpolymer: {mol: makeSiliconPolymer(), title: 'Silicon Polymer (SiO)n', type: 'Inorganic polymer', role: 'Sealants and adhesives', struct: 'Si-O backbone', feat: 'Thermal stability'},
                cholesterol: {mol: makeCholesterol(), title: 'Cholesterol (C₂₇H₄₆O)', type: 'Steroid', role: 'Membrane component', struct: 'Four rings', feat: 'Hormone precursor'}
            };
            const d = info[name];
            mol = d.mol;
            scene.add(mol);
            document.getElementById('info').innerHTML = `
                <h3>${d.title}</h3>
                <p><strong>Type:</strong> ${d.type}</p>
                <p><strong>Role:</strong> ${d.role}</p>
                <p><strong>Structure:</strong> ${d.struct}</p>
                <p><strong>Features:</strong> ${d.feat}</p>
            `;
        }

        function loadMol(name) {
            document.querySelectorAll('.mol-btn').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');
            loadMolData(name);
        }

        function animate() {
            requestAnimationFrame(animate);
            if (mol && !drag) {
                mol.rotation.x += rotSpd.x;
                mol.rotation.y += rotSpd.y;
            }
            renderer.render(scene, camera);
        }

        function setSpeed(v) {
            const s = v / 3000;
            rotSpd = {x: s, y: s};
            document.getElementById('speedVal').textContent = v;
        }

        function setZoom(v) {
            camera.position.z = 15 * (200 - v) / 100;
            document.getElementById('zoomVal').textContent = v;
        }

        function saveView() {
            const name = document.getElementById('viewName').value.trim();
            if (!name) { alert('Enter a name'); return; }
            const view = {
                name,
                molecule: curMol,
                rotation: {x: mol.rotation.x, y: mol.rotation.y, z: mol.rotation.z},
                zoom: camera.position.z,
                time: new Date().toISOString()
            };
            const views = JSON.parse(localStorage.getItem('molViews') || '[]');
            views.push(view);
            localStorage.setItem('molViews', JSON.stringify(views));
            document.getElementById('viewName').value = '';
            loadViews();
        }

        function loadViews() {
            const views = JSON.parse(localStorage.getItem('molViews') || '[]');
            const list = document.getElementById('viewsList');
            if (views.length === 0) {
                list.innerHTML = '<p style="opacity: 0.7; margin: 10px 0;">No saved views yet</p>';
                return;
            }
            list.innerHTML = views.map((v, i) => `
                <div class="saved-item">
                    <div>
                        <strong>${v.name}</strong>
                        <div style="font-size: 0.9em; opacity: 0.8;">${v.molecule} - ${new Date(v.time).toLocaleDateString()}</div>
                    </div>
                    <div>
                        <button class="vbtn" onclick="restoreView(${i})">Load</button>
                        <button class="vbtn del" onclick="delView(${i})">Delete</button>
                    </div>
                </div>
            `).join('');
        }

        function restoreView(i) {
            const views = JSON.parse(localStorage.getItem('molViews') || '[]');
            const v = views[i];
            const btn = document.querySelector(`.mol-btn[onclick="loadMol('${v.molecule}')"]`);
            if (btn) btn.click();
            setTimeout(() => {
                if (mol) {
                    mol.rotation.x = v.rotation.x;
                    mol.rotation.y = v.rotation.y;
                    mol.rotation.z = v.rotation.z;
                }
                camera.position.z = v.zoom;
                document.getElementById('zoom').value = (15 / v.zoom) * 100;
                document.getElementById('zoomVal').textContent = Math.round((15 / v.zoom) * 100);
            }, 100);
        }

        function delView(i) {
            if (confirm('Delete this view?')) {
                const views = JSON.parse(localStorage.getItem('molViews') || '[]');
                views.splice(i, 1);
                localStorage.setItem('molViews', JSON.stringify(views));
                loadViews();
            }
        }
        function toggleCard(card) {
            const keyPoints = card.querySelector(".key-points");
            const icon = card.querySelector(".expand-icon");

            const isOpen = keyPoints.style.display === "block";

            keyPoints.style.display = isOpen ? "none" : "block";
            icon.textContent = isOpen ? "▼" : "▲";
        }

        function show(id) {
            try {
                const section = document.getElementById(id);
                if (!section) {
                    console.error('Section not found:', id);
                    return;
                }
                
                document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                section.classList.add('active');
                
                // Find the button that was clicked
                const clickedTab = Array.from(document.querySelectorAll('.tab')).find(tab => 
                    tab.getAttribute('onclick').includes(`'${id}'`)
                );
                if (clickedTab) {
                    clickedTab.classList.add('active');
                }
                
                if (id === 'viewer' && !init) setTimeout(startViewer, 100);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (error) {
                console.error('Error in show():', error);
            }
        }
 

        window.addEventListener('DOMContentLoaded', () => setTimeout(startViewer, 500));