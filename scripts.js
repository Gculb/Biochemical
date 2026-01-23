
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
                function dashedBond(p1, p2, segments = 6) {
        const g = new THREE.Group();
        const dir = new THREE.Vector3().subVectors(p2, p1);
        const step = dir.clone().divideScalar(segments);

        for (let i = 0; i < segments; i += 2) {
            const start = p1.clone().add(step.clone().multiplyScalar(i));
            const end = p1.clone().add(step.clone().multiplyScalar(i + 1));
            g.add(bond(start, end, 0x00ffff)); // cyan for H-bond
        }
        return g;
}
        function makeAlphaHelix() {
            const g = new THREE.Group();

            const residues = 12;
            const radius = 1.2;
            const rise = 0.5;
            const turn = (2 * Math.PI) / 3.6;

            const backbone = [];

            for (let i = 0; i < residues; i++) {
                const angle = i * turn;

                // Backbone positions
                const caPos = new THREE.Vector3(
                    Math.cos(angle) * radius,
                    i * rise,
                    Math.sin(angle) * radius
                );

                const nPos = caPos.clone().add(new THREE.Vector3(
                    Math.cos(angle - 0.3) * 0.6,
                    -0.3,
                    Math.sin(angle - 0.3) * 0.6
                ));

                const cPos = caPos.clone().add(new THREE.Vector3(
                    Math.cos(angle + 0.3) * 0.6,
                    0.3,
                    Math.sin(angle + 0.3) * 0.6
                ));

                // Atoms
                const n = atom(nPos.x, nPos.y, nPos.z, 0x0000ff, 0.35); // N
                const ca = atom(caPos.x, caPos.y, caPos.z, 0xaaaaaa, 0.4); // Cα
                const c = atom(cPos.x, cPos.y, cPos.z, 0x333333, 0.35); // C

                g.add(n, ca, c);

                // Backbone bonds
                g.add(bond(nPos, caPos));
                g.add(bond(caPos, cPos));

                if (i > 0) {
                    g.add(bond(backbone[i - 1].cPos, nPos));
                }

                backbone.push({ nPos, cPos });
            }

            // Hydrogen bonds (i → i+4)
            for (let i = 0; i < residues - 4; i++) {
                const donor = backbone[i + 4].nPos;
                const acceptor = backbone[i].cPos;
                g.add(dashedBond(acceptor, donor));
            }

            return g;
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

            connectAtoms(alphaCarbon, amineNitrogen);
            connectAtoms(amineNitrogen, amineHydrogen1);
            connectAtoms(amineNitrogen, amineHydrogen2);

            const carboxylCarbon = createAtom(1.4, 0, 0, "C");
            const carboxylOxygen1 = createAtom(2.4, 0.8, 0, "O");
            const carboxylOxygen2 = createAtom(2.4, -0.8, 0, "O");

            connectAtoms(alphaCarbon, carboxylCarbon);
            connectAtoms(carboxylCarbon, carboxylOxygen1);
            connectAtoms(carboxylCarbon, carboxylOxygen2);

            // ---------------------------
            // Side Chain: Methyl (CH₃)
            // ---------------------------

            const betaCarbon = createAtom(0, -1.4, 0, "C");
            connectAtoms(alphaCarbon, betaCarbon);

            const methylH1 = createAtom(-0.8, -2.2, 0, "H");
            const methylH2 = createAtom(0.8, -2.2, 0, "H");
            const methylH3 = createAtom(0, -1.4, 1.0, "H");

            connectAtoms(betaCarbon, methylH1);
            connectAtoms(betaCarbon, methylH2);
            connectAtoms(betaCarbon, methylH3);

            return molecule;
        }


       
        function makeATP() {
            const molecule = new THREE.Group();
            const SCALE = 1.25;

            // shared style / small helper used inside subbuilders
            function stylesFor(el) {
                return {
                    C: [0x404040, 0.4],
                    N: [0x3050f8, 0.45],
                    O: [0xff3030, 0.45],
                    P: [0xffa500, 0.6],
                    H: [0xffffff, 0.25]
                }[el];
            }

            // world-space connector helper: create a bond using each atom's world position
            function connectWorld(aAtom, bAtom) {
                const pa = new THREE.Vector3();
                const pb = new THREE.Vector3();
                aAtom.getWorldPosition(pa);
                bAtom.getWorldPosition(pb);
                molecule.add(bond(pa, pb));
            }

            // Adenine builder -> returns { group, attachN9 }
            function buildAdenine() {
                const g = new THREE.Group();

                function a(x, y, z, el) {
                    const [c, r] = stylesFor(el);
                    const m = atom(x * SCALE, y * SCALE, z * SCALE, c, r);
                    g.add(m);
                    return m;
                }

                // =====================
                // 6-membered ring
                // =====================
                const N1 = a(-4.6,  1.2, 0, "N");
                const C2 = a(-3.6,  1.8, 0, "C");
                const N3 = a(-2.6,  1.2, 0, "N");
                const C4 = a(-2.6,  0.0, 0, "C");
                const C5 = a(-3.6, -0.6, 0, "C");
                const C6 = a(-4.6,  0.0, 0, "C");

                // =====================
                // 5-membered ring
                // =====================
                const N7 = a(-3.6, -1.8, 0, "N");
                const C8 = a(-2.4, -1.2, 0, "C");   // ← raised & separated
                const N9 = a(-1.8, -0.2, 0, "N");   // glycosidic attachment

                // =====================
                // Bonds: 6-ring
                // =====================
                [
                    [N1, C2], [C2, N3], [N3, C4],
                    [C4, C5], [C5, C6], [C6, N1]
                ].forEach(([x, y]) => g.add(bond(x.position, y.position)));

                // =====================
                // Bonds: 5-ring (correct fusion)
                // =====================
                [
                    [C4, C5],   // shared fusion edge
                    [C5, N7],
                    [N7, C8],
                    [C8, N9],
                    [N9, C4]
                ].forEach(([x, y]) => g.add(bond(x.position, y.position)));

                return {
                    group: g,
                    attachN9: N9
                };
            }


            // ----------------------
            // Ribose builder -> returns { group, attachC1p, attachO5p }
            // ----------------------
            function buildRibose() {
                const g = new THREE.Group();

                function a(x,y,z,el){ const [c,r]=stylesFor(el); const m = atom(x*SCALE,y*SCALE,z*SCALE,c,r); g.add(m); return m; }

                // ring: C1' C2' C3' C4' O4'
                const C1p = a(-2.0,  0.0,  0.25, "C");
                const C2p = a(-1.0,  0.8, -0.18, "C");
                const C3p = a( 0.0,  0.1,  0.22, "C");
                const C4p = a(-0.7, -1.2, -0.15, "C");
                const O4p = a(-1.8, -1.0,  0.05, "O");

                [[C1p,C2p],[C2p,C3p],[C3p,C4p],[C4p,O4p],[O4p,C1p]]
                    .forEach(([x,y]) => g.add(bond(x.position, y.position)));

                // 2' and 3' OH
                const O2p = a(-0.8, 1.6, -0.28, "O");
                const O3p = a(0.4,  0.9,  0.38, "O");
                g.add(bond(C2p.position, O2p.position));
                g.add(bond(C3p.position, O3p.position));

                // C5' and O5' (attach to phosphate)
                const C5p = a(0.8, -1.0, -0.65, "C");
                g.add(bond(C4p.position, C5p.position));
                const O5p = a(1.7, -0.6, -0.25, "O");
                g.add(bond(C5p.position, O5p.position));

                return { group: g, attachC1p: C1p, attachO5p: O5p };
            }

            // ----------------------
            // Triphosphate builder -> returns { group, attachP1, attachObridge12, attachObridge23 }
            // ----------------------
            function buildTriphosphate() {
                const g = new THREE.Group();

                function a(x,y,z,el){ const [c,r]=stylesFor(el); const m = atom(x*SCALE,y*SCALE,z*SCALE,c,r); g.add(m); return m; }

                // P positions (local coords)
                const P1 = a(0.0, 0.0, 0.0, "P");             // alpha (we'll position the whole group later)
                const P2 = a(1.6, 0.9, -0.6, "P");           // beta
                const P3 = a(3.2, 0.3,  0.4, "P");           // gamma

                // bridging oxygens (explicit)
                const O12 = a(0.95, 0.45, -0.12, "O");
                const O23 = a(2.4, 0.6, 0.0, "O");

                // P<->Obridges
                g.add(bond(P1.position, O12.position));
                g.add(bond(O12.position, P2.position));
                g.add(bond(P2.position, O23.position));
                g.add(bond(O23.position, P3.position));

                // terminal oxygens (so each P has correct O count)
                function addTerminals(p, baseX, baseY, baseZ, offsets) {
                    offsets.forEach(off => {
                        const o = a(baseX + off[0], baseY + off[1], baseZ + off[2], "O");
                        g.add(bond(p.position, o.position));
                    });
                }

                addTerminals(P1, 0.0, 0.0, 0.0, [
                    [-0.6,  0.9,  0.2],
                    [-0.9, -0.2, -0.4]
                ]);

                addTerminals(P2, 1.6, 0.9, -0.6, [
                    [0.6,  0.5,  0.5],
                    [0.5, -0.7, -0.3]
                ]);

                addTerminals(P3, 3.2, 0.3,  0.4, [
                    [ 0.6,  0.9,  0.0],
                    [ 1.0, -0.2, -0.4],
                    [-0.4, -0.6,  0.3]
                ]);

                return { group: g, attachP1: P1, attachO12: O12, attachO23: O23 };
            }

            // build parts
            const adeninePart = buildAdenine();
            const ribosePart  = buildRibose();
            const phosPart    = buildTriphosphate();

            // position parts with clear spacing so they don't overlap
            // feel free to tweak these offsets:
            adeninePart.group.position.set(-5.8,  0.0,  0.0);
            ribosePart.group.position.set(-1.5,  0.0,  0.0);
            phosPart.group.position.set( 3.2,  0.0,  0.6); // slight z to avoid coplanar overlap

            // add groups to the top-level molecule
            molecule.add(adeninePart.group);
            molecule.add(ribosePart.group);
            molecule.add(phosPart.group);

            // connect adenine N9 -> ribose C1' (glycosidic bond)
            connectWorld(adeninePart.attachN9, ribosePart.attachC1p);

            // connect ribose O5' -> triphosphate P1 (alpha phosphate)
            connectWorld(ribosePart.attachO5p, phosPart.attachP1);




            return molecule;
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
        function addTrimethylEnd(group, anchor) {

            const siPos = anchor.clone();
            const si = atom(siPos.x, siPos.y, siPos.z, 0xffa500, 0.7);
            group.add(si);

            const offsets = [
                new THREE.Vector3(0,  1.2,  0),
                new THREE.Vector3(0, -1.2,  0),
                new THREE.Vector3(0,  0,  1.2)
            ];

            offsets.forEach(off => {
                const cPos = siPos.clone().add(off);
                const c = atom(cPos.x, cPos.y, cPos.z, 0x333333, 0.45);
                group.add(c);
                group.add(bond(siPos, cPos));

                for (let h = 0; h < 3; h++) {
                    const hPos = cPos.clone().add(
                        new THREE.Vector3(
                            Math.cos(h * 2 * Math.PI / 3) * 0.6,
                            Math.sin(h * 2 * Math.PI / 3) * 0.6,
                            0.4
                        )
                    );
                    const hydrogen = atom(hPos.x, hPos.y, hPos.z, 0xffffff, 0.25);
                    group.add(hydrogen);
                    group.add(bond(cPos, hPos));
                }
            });
        }

        function makeSiliconPolymer() {
            const g = new THREE.Group();

            const units = 15;        // chain length
            const siO = 1.65;
            const siC = 1.85;
            const zigzag = 1.2;

            let prevSiPos = null;
            let direction = 1;

            for (let i = 0; i < units; i++) {

                // Silicon position
                const siPos = new THREE.Vector3(
                    i * 2.4,
                    0,
                    direction * zigzag
                );

                const si = atom(siPos.x, siPos.y, siPos.z, 0xffa500, 0.7);
                g.add(si);

                // Oxygen bridge (Si–O–Si)
                if (prevSiPos) {
                    const oPos = prevSiPos.clone()
                        .add(siPos)
                        .multiplyScalar(0.5)
                        .add(new THREE.Vector3(0, 0.6 * direction, 0));

                    const o = atom(oPos.x, oPos.y, oPos.z, 0xff0000, 0.5);
                    g.add(o);

                    g.add(bond(prevSiPos, oPos));
                    g.add(bond(oPos, siPos));
                }

                // Two methyl groups (CH3) on silicon
                const offsets = [
                    new THREE.Vector3(0,  1.1,  0.9),
                    new THREE.Vector3(0, -1.1, -0.9)
                ];

                offsets.forEach(off => {
                    const cPos = siPos.clone().add(off);
                    const c = atom(cPos.x, cPos.y, cPos.z, 0x333333, 0.45);
                    g.add(c);
                    g.add(bond(siPos, cPos));

                    // Hydrogens
                    for (let h = 0; h < 3; h++) {
                        const hPos = cPos.clone().add(
                            new THREE.Vector3(
                                Math.cos(h * 2 * Math.PI / 3) * 0.6,
                                Math.sin(h * 2 * Math.PI / 3) * 0.6,
                                0.4
                            )
                        );

                        const hydrogen = atom(
                            hPos.x, hPos.y, hPos.z,
                            0xffffff, 0.25
                        );
                        g.add(hydrogen);
                        g.add(bond(cPos, hPos));
                    }
                });

                prevSiPos = siPos;
                direction *= -1;
            }

            // === End groups (–Si(CH3)3) ===
            addTrimethylEnd(g, new THREE.Vector3(-2.4, 0, 0));
            addTrimethylEnd(g, new THREE.Vector3(units * 2.4, 0, 0));

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
                siliconpolymer: {mol: makeSiliconPolymer(),title: 'Polydimethylsiloxane (PDMS)',type: 'Organosilicon polymer',role: 'Sealants, elastomers, biomedical materials',struct: '–[Si(CH₃)₂–O]ₙ–, n = 15',feat: 'Low Tg, high flexibility, thermal stability'},
                cholesterol: {mol: makeCholesterol(), title: 'Cholesterol (C₂₇H₄₆O)', type: 'Steroid', role: 'Membrane component', struct: 'Four rings', feat: 'Hormone precursor'},
                alphahelix: {mol: makeAlphaHelix(), title: 'Alpha Helix', type: 'Protein secondary structure', role: 'Structural motif', struct: 'Right-handed coil', feat: 'Stabilized by H-bonds'}
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