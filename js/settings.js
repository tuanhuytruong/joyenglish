            export function loadSettings() {
                try {
                    const savedSettings = localStorage.getItem('pvp_game_settings');
                    if (savedSettings) {
                        const parsedSettings = JSON.parse(savedSettings);
                        document.querySelectorAll('[data-save]').forEach(el => {
                            if (parsedSettings[el.dataset.save] !== undefined) {
                                if (el.type === 'checkbox') el.checked = parsedSettings[el.dataset.save];
                                else el.value = parsedSettings[el.dataset.save];
                                el.dispatchEvent(new Event('change')); 
                            }
                        });
                    }

                    const savedDataGrid = localStorage.getItem('pvp_game_data');
                    if (savedDataGrid) {
                        const parsedData = JSON.parse(savedDataGrid);
                        if (parsedData && parsedData.length > 0) {
                            const tbody = document.getElementById('grid-body');
                            tbody.innerHTML = ''; 
                            currentRowCount = 0;
                            
                            parsedData.forEach((row, index) => {
                                createGridRow(index + 1);
                                document.querySelector(`.excel-input[data-col="colA"][data-row="${index + 1}"]`).value = row.cotA || '';
                                document.querySelector(`.excel-input[data-col="colB"][data-row="${index + 1}"]`).value = row.cotB || '';
                                document.querySelector(`.custom-checkbox[data-col="active"][data-row="${index + 1}"]`).checked = row.active;
                            });
                        }
                    }
                } catch (e) {
                    console.error("Lỗi tải dữ liệu LocalStorage:", e);
                }
            }

            export function saveSettings(gridData) {
                const settingsToSave = {};
                document.querySelectorAll('[data-save]').forEach(el => {
                    if (el.type === 'checkbox') settingsToSave[el.dataset.save] = el.checked;
                    else settingsToSave[el.dataset.save] = el.value;
                });
                
                localStorage.setItem('pvp_game_settings', JSON.stringify(settingsToSave));
                if (gridData) localStorage.setItem('pvp_game_data', JSON.stringify(gridData));
            }

            // ========================================================


            // HÀM LƯU LỊCH SỬ HALL OF FAME
