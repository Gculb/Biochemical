        const sectionCache = {};

        function snapshotSections() {
            document.querySelectorAll('.section').forEach(section => {
                if (section.classList.contains('active')) return;
                 if (section.querySelector("script[data-global]")) return;

                sectionCache[section.id] = section.innerHTML;
                section.innerHTML = "";                
                section.dataset.lazy = "true";
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            snapshotSections();

            const last = localStorage.getItem("lastActiveSection");
            if (last && document.getElementById(last)) {
                show(last);
            } else {
                show('home'); 
            }
        });
        
        function toggleCard(card) {
            const keyPoints = card.querySelector(".key-points");
            const icon = card.querySelector(".expand-icon");

            const isOpen = keyPoints.style.display === "block";

            keyPoints.style.display = isOpen ? "none" : "block";
            icon.textContent = isOpen ? "▼" : "▲";
        }

    function ensureSectionLoaded(section) {
        if (section.dataset.lazy !== "true") return;

        section.innerHTML = sectionCache[section.id] || "";
        delete sectionCache[section.id];
        section.dataset.lazy = "false";


        section.querySelectorAll("script").forEach(old => {
            const s = document.createElement("script");
            if (old.src) s.src = old.src;
            if (!old.src) s.textContent = old.textContent;
            document.head.appendChild(s);
            old.remove();
        });
}

        function show(id) {
            try {
                const section = document.getElementById(id);
                if (!section) {
                    console.error('Section not found:', id);
                    return;
                }

            ensureSectionLoaded(section);
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            section.classList.add('active');
            localStorage.setItem('lastSection', id);
                
            const clickedTab = Array.from(document.querySelectorAll('.tab')).find(tab =>
                tab.getAttribute('onclick')?.includes(`'${id}'`)
                );
                if (clickedTab) {
                    clickedTab.classList.add('active');
                }

             
                if (id === 'viewer') {
                    setTimeout(() => {
                        if (!init) {
                            startViewer();
                        } else if (renderer && camera) {
                            const canvas = document.getElementById('canvas3d');
                            const parent = canvas.parentElement;

                            renderer.setSize(parent.clientWidth, parent.clientHeight);
                            camera.aspect = parent.clientWidth / parent.clientHeight;
                            camera.updateProjectionMatrix();
                        }
                    }, 50);
                }
                if (id === 'lab' && window.LabEngine?.kinetics) {
                    LabEngine.kinetics.init();
                }

                window.scrollTo({ top: 0, behavior: 'smooth' });

            } catch (error) {
                console.error('Error in show():', error);
            }
        }
