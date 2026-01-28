
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

                window.scrollTo({ top: 0, behavior: 'smooth' });

            } catch (error) {
                console.error('Error in show():', error);
            }
        }
