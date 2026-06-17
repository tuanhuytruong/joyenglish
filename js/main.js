import { EXTERNAL_AUDIO_VOLUMES, playSound, realKameAudio, mainThemeAudio, suddenDeathAudio, winAudio, defeatedAudio, welcomeAudio, audioCtx } from './audio.js';
import { WEAPON_ASSETS, spawnFloatingText, takeDamage, fireConfetti, createDeflectedProjectile, playWeaponBarrage, spawnFloatingIcons, triggerStatusEffect } from './effects.js';
import { gameState } from './state.js';
import { saveMatchToHistory, renderHallOfFame, triggerEndGame, updateUI } from './ui.js';
import { loadSettings, saveSettings } from './settings.js';
import { triggerClickSkill, applyHealOverTime, playMeteorShower, playKamehamehaAnimation, useBasicSkill, triggerCooldownUI } from './skills.js';

// Expose functions needed by inline HTML handlers and cross-module window references
window.triggerClickSkill = triggerClickSkill;
window.takeDamage = takeDamage;
window.spawnFloatingText = spawnFloatingText;
window.fireConfetti = fireConfetti;
window.createDeflectedProjectile = createDeflectedProjectile;
window.playWeaponBarrage = playWeaponBarrage;
window.triggerEndGame = triggerEndGame;
window.applyHealOverTime = applyHealOverTime;
window.triggerCooldownUI = triggerCooldownUI;
window.useBasicSkill = useBasicSkill;

        window.triggerClickAnswer = function(playerPrefix, index) {
            if (window.GameplayManager) {
                window.GameplayManager.handlePlayerAnswer(playerPrefix, index);
            }
        };


            // ========================================================
            // BIẾN TOÀN CỤC
            // ========================================================

            // ========================================================
            // ⚓ [NEO -1]: HỆ THỐNG LƯU TRỮ (LOCAL STORAGE)
            // ========================================================


            // =========================================================================
            // TABS & DATA GRID & MODAL LOGIC
            // =========================================================================
            const gridContainer = document.getElementById('debug-grid');
            for(let r = 1; r <= 9; r++) {
                for(let c = 0; c < 16; c++) {
                    const cell = document.createElement('div');
                    cell.className = "border border-green-400/50 flex items-start justify-start p-1 text-green-400 font-mono text-xs";
                    cell.innerText = String.fromCharCode(65 + c) + r;
                    gridContainer.appendChild(cell);
                }
            }
            document.getElementById('toggle-grid-btn').addEventListener('click', () => {
                gridContainer.classList.toggle('hidden');
            });

            const tabBtns = document.querySelectorAll('.tab-btn');
            const tabContents = document.querySelectorAll('.tab-content');
            tabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    tabBtns.forEach(b => { 
                        b.classList.remove('active', 'border-b-4', 'border-orange-500', 'text-orange-600', 'bg-edNavy', 'text-white'); 
                        b.classList.add('bg-e5e7eb', 'text-374151'); 
                    });
                    tabContents.forEach(c => c.classList.remove('active'));
                    
                    btn.classList.remove('bg-e5e7eb', 'text-374151'); 
                    if(btn.dataset.target === 'tab-controls') {
                        btn.classList.add('active', 'border-b-4', 'border-orange-500', 'text-orange-600'); 
                    } else {
                        btn.classList.add('active', 'bg-edNavy', 'text-white');
                    }
                    document.getElementById(btn.dataset.target).classList.add('active');
                });
            });

            const modal = document.getElementById('settings-modal');
            const modalContent = document.getElementById('modal-content');
            
            document.getElementById('open-settings-btn').addEventListener('click', () => {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                modalContent.classList.remove('scale-95');
                modalContent.classList.add('scale-100');
            });
            
            document.getElementById('close-settings-btn').addEventListener('click', () => {
                modal.classList.add('opacity-0', 'pointer-events-none');
                modalContent.classList.add('scale-95');
                modalContent.classList.remove('scale-100');
            });

            const keybindInputs = document.querySelectorAll('.keybind-input');
            let activeKeybindInput = null;

            keybindInputs.forEach(input => {
                input.addEventListener('focus', function() {
                    activeKeybindInput = this;
                    this.value = '...';
                });
                input.addEventListener('blur', function() {
                    if (this.value === '...') {
                        this.value = this.dataset.oldValue || 'A'; 
                    }
                    activeKeybindInput = null;
                });
                input.dataset.oldValue = input.value;
            });

            document.addEventListener('keydown', (e) => {
                if (activeKeybindInput) {
                    e.preventDefault(); 
                    let key = e.key;
                    
                    if (e.code.startsWith('Numpad') && key >= '0' && key <= '9') {
                        key = 'NUM' + key;
                    } else if (e.code === 'NumpadEnter') {
                        key = 'NUM ENTER';
                    }
                    
                    if(key === ' ') key = 'SPACE';
                    else if(key === 'Enter') key = 'ENTER';
                    else if(key.length === 1) key = key.toUpperCase();
                    else if(key.startsWith('Arrow')) key = key.replace('Arrow', 'A-');

                    activeKeybindInput.value = key;
                    activeKeybindInput.dataset.oldValue = key;
                    activeKeybindInput.blur(); 
                    activeKeybindInput.dispatchEvent(new Event('change'));
                }
            });

            const tbody = document.getElementById('grid-body');
            let currentRowCount = 0;
            const colATypeSelect = document.getElementById('col-a-type');
            const colBTypeSelect = document.getElementById('col-b-type');
            const colALbl = document.getElementById('col-a-lbl');
            const colBLbl = document.getElementById('col-b-lbl');

            function updateGridHeaders() {
                colALbl.textContent = colATypeSelect.value === 'image' ? '(images/...)' : '(Text)';
                colBLbl.textContent = colBTypeSelect.value === 'image' ? '(images/...)' : '(Text)';
                document.querySelectorAll('.excel-input').forEach(inp => {
                    inp.dispatchEvent(new Event('input'));
                });
            }

            colATypeSelect.addEventListener('change', updateGridHeaders);
            colBTypeSelect.addEventListener('change', updateGridHeaders);

            function attachInputListeners(input) {
                input.addEventListener('focus', function() { this.parentElement.classList.add('focused'); });
                input.addEventListener('blur', function() { this.parentElement.classList.remove('focused'); });
                
                input.addEventListener('input', function() {
                    const row = this.dataset.row;
                    const colName = this.dataset.col; 
                    const type = colName === 'colA' ? colATypeSelect.value : colBTypeSelect.value;
                    const previewImg = document.getElementById(`preview-${colName}-${row}`);
                    const val = this.value.trim();

                    if (type === 'image' && val !== '') {
                        previewImg.src = `images/${val}.png`;
                        previewImg.onerror = function() {
                            if (this.src.includes('.png')) this.src = `images/${val}.jpg`;
                            else { this.onerror = null; this.src = `https://placehold.co/32x32/f1f5f9/94a3b8?text=X`; }
                        };
                        previewImg.classList.remove('hidden');
                        this.style.paddingRight = '40px'; 
                    } else {
                        previewImg.classList.add('hidden');
                        previewImg.src = '';
                        this.style.paddingRight = '8px';
                    }
                });

                input.addEventListener('keydown', function(e) {
                    if(activeKeybindInput) return; 
                    const row = parseInt(this.dataset.row); 
                    const col = this.dataset.col; 
                    let nextRow = row; let nextInput = null;
                    if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); nextRow = row < currentRowCount ? row + 1 : row; nextInput = document.querySelector(`.excel-input[data-row="${nextRow}"][data-col="${col}"]`); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); nextRow = row > 1 ? row - 1 : 1; nextInput = document.querySelector(`.excel-input[data-row="${nextRow}"][data-col="${col}"]`); }
                    else if (e.key === 'ArrowRight' && this.selectionStart === this.value.length) { if(col === 'colA') nextInput = document.querySelector(`.excel-input[data-row="${row}"][data-col="colB"]`); if(nextInput) e.preventDefault(); }
                    else if (e.key === 'ArrowLeft' && this.selectionStart === 0) { if(col === 'colB') nextInput = document.querySelector(`.excel-input[data-row="${row}"][data-col="colA"]`); if(nextInput) e.preventDefault(); }
                    if (nextInput) nextInput.focus();
                });
            }

            function createGridRow(i) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="row-num">${i}</td>
                    <td class="excel-cell">
                        <div class="flex items-center w-full h-full relative">
                            <input type="text" class="excel-input text-left" data-col="colA" data-row="${i}">
                            <img src="" class="img-preview hidden" id="preview-colA-${i}">
                        </div>
                    </td>
                    <td class="excel-cell">
                        <div class="flex items-center w-full h-full relative">
                            <input type="text" class="excel-input text-left" data-col="colB" data-row="${i}">
                            <img src="" class="img-preview hidden" id="preview-colB-${i}">
                        </div>
                    </td>
                    <td class="excel-cell flex items-center justify-center"><input type="checkbox" class="custom-checkbox" data-col="active" data-row="${i}" checked></td>
                `;
                tbody.appendChild(tr);
                tr.querySelectorAll('.excel-input').forEach(attachInputListeners);
                currentRowCount = i;
            }

            for (let i = 1; i <= 5; i++) { createGridRow(i); }
            updateGridHeaders();

            document.getElementById('btn-auto-fill').addEventListener('click', () => {
                const targetCol = document.getElementById('autofill-target').value;
                const start = parseInt(document.getElementById('autofill-start').value);
                const end = parseInt(document.getElementById('autofill-end').value);
                
                if(isNaN(start) || isNaN(end) || start > end) { alert("Khoảng số không hợp lệ!"); return; }
                const count = end - start + 1;
                while (currentRowCount < count) { createGridRow(currentRowCount + 1); }
                let currentNum = start;
                for(let r = 1; r <= count; r++) {
                    const checkbox = document.querySelector(`.custom-checkbox[data-col="active"][data-row="${r}"]`);
                    if(targetCol === 'colC') {
                        if(checkbox) checkbox.checked = true;
                    } else {
                        const input = document.querySelector(`.excel-input[data-col="${targetCol}"][data-row="${r}"]`);
                        if(input) { input.value = currentNum; input.dispatchEvent(new Event('input')); currentNum++; }
                        if(checkbox) checkbox.checked = true;
                    }
                }
            });

            document.getElementById('btn-clear-data').addEventListener('click', () => {
                if(confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu hiện tại?')) {
                    document.querySelectorAll('.excel-input').forEach(inp => { inp.value = ''; inp.dispatchEvent(new Event('input')); });
                    document.querySelectorAll('.custom-checkbox').forEach(cb => cb.checked = false);
                    localStorage.removeItem('pvp_game_data');
                }
            });

            document.getElementById('data-grid').addEventListener('paste', function(e) {
                e.preventDefault(); 
                const pastedData = (e.clipboardData || window.clipboardData).getData('Text'); if (!pastedData) return;
                const activeElement = document.activeElement; if (!activeElement.classList.contains('excel-input')) return;
                const startRow = parseInt(activeElement.dataset.row); 
                const columns = ['colA', 'colB']; 
                let startColIndex = columns.indexOf(activeElement.dataset.col);
                const rows = pastedData.split(/\r?\n/); 
                const neededRows = startRow + rows.length - 1;
                while(currentRowCount < neededRows) { createGridRow(currentRowCount + 1); }
                let cRow = startRow;
                rows.forEach(row => {
                    if (row.trim() === '') return;
                    const cells = row.split('\t'); let currentColIndex = startColIndex;
                    cells.forEach(cellText => {
                        if (currentColIndex < columns.length) {
                            const targetInput = document.querySelector(`.excel-input[data-col="${columns[currentColIndex]}"][data-row="${cRow}"]`);
                            if (targetInput) { targetInput.value = cellText; targetInput.dispatchEvent(new Event('input')); }
                        }
                        currentColIndex++;
                    });
                    cRow++;
                });
            });

            function getAvatarHtml(val) {
                if(!val) return "";
                const isUrl = val.startsWith('http') || val.startsWith('data:');
                const tenorMatch = val.match(/tenor\.com\/view\/.*-(\d+)$/);
                if (tenorMatch) { return `<iframe src="https://tenor.com/embed/${tenorMatch[1]}" width="100%" height="100%" frameBorder="0" scrolling="no" class="pointer-events-none bg-black" allowtransparency="true"></iframe>`; } 
                else if (isUrl) { return `<img src="${val}" class="w-full h-full object-cover pointer-events-none bg-black" onerror="this.onerror=null; this.src='https://placehold.co/200x200/1e293b/cbd5e1?text=ERROR';" />`; } 
                else { return `<img src="Hero/${val}.png" onerror="if(this.src.includes('.png')){this.src='Hero/${val}.jpg'}else{this.onerror=null;this.src='https://placehold.co/200x200/1E3A8A/F6C90E?text=IMG+${val}';}" class="w-full h-full object-cover pointer-events-none bg-black" />`; }
            }

            function safeSetText(elementId, textValue) {
                const el = document.getElementById(elementId);
                if (el && textValue) el.innerText = textValue;
            }

            const svgTick = `<div class="bg-white rounded-full p-2 shadow-[0_0_20px_rgba(34,197,94,0.8)]"><svg class="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="4"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg></div>`;
            const svgCross = `<div class="bg-white rounded-full p-2 shadow-[0_0_20px_rgba(239,68,68,0.8)]"><svg class="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg></div>`;

            document.getElementById('save-and-close-btn').addEventListener('click', function() {
                try {
                    this.blur(); 
                    const savedKeys = {};
                    document.querySelectorAll('.keybind-input').forEach(inp => { savedKeys[inp.dataset.save] = inp.value; });
                    
                    safeSetText('ui-key-p1-a1', savedKeys.key_p1_a1); safeSetText('ui-ans-p1-1', savedKeys.key_p1_a1);
                    safeSetText('ui-key-p1-a2', savedKeys.key_p1_a2); safeSetText('ui-ans-p1-2', savedKeys.key_p1_a2);
                    safeSetText('ui-key-p1-a3', savedKeys.key_p1_a3); safeSetText('ui-ans-p1-3', savedKeys.key_p1_a3);
                    safeSetText('ui-key-p1-a4', savedKeys.key_p1_a4); safeSetText('ui-ans-p1-4', savedKeys.key_p1_a4);
                    
                    safeSetText('ui-key-p1-s1', savedKeys.key_p1_s1); safeSetText('ui-key-p1-s2', savedKeys.key_p1_s2);
                    safeSetText('ui-key-p1-s3', savedKeys.key_p1_s3); safeSetText('ui-key-p1-ult', savedKeys.key_p1_ult);

                    safeSetText('ui-key-p2-a1', savedKeys.key_p2_a1); safeSetText('ui-ans-p2-1', savedKeys.key_p2_a1);
                    safeSetText('ui-key-p2-a2', savedKeys.key_p2_a2); safeSetText('ui-ans-p2-2', savedKeys.key_p2_a2);
                    safeSetText('ui-key-p2-a3', savedKeys.key_p2_a3); safeSetText('ui-ans-p2-3', savedKeys.key_p2_a3);
                    safeSetText('ui-key-p2-a4', savedKeys.key_p2_a4); safeSetText('ui-ans-p2-4', savedKeys.key_p2_a4);
                    
                    safeSetText('ui-key-p2-s1', savedKeys.key_p2_s1); safeSetText('ui-key-p2-s2', savedKeys.key_p2_s2);
                    safeSetText('ui-key-p2-s3', savedKeys.key_p2_s3); safeSetText('ui-key-p2-ult', savedKeys.key_p2_ult);

                    const p1Av = document.getElementById('p1-avatar-input').value;
                    const p2Av = document.getElementById('p2-avatar-input').value;
                    if(p1Av) { let avHtml = getAvatarHtml(p1Av); document.getElementById('p1-avatar-inner').innerHTML = avHtml; document.getElementById('vs-p1-avatar').innerHTML = avHtml; }
                    if(p2Av) { let avHtml = getAvatarHtml(p2Av); document.getElementById('p2-avatar-inner').innerHTML = avHtml; document.getElementById('vs-p2-avatar').innerHTML = avHtml; }

                    let gridData = [];
                    for (let r = 1; r <= currentRowCount; r++) {
                        let colA = document.querySelector(`.excel-input[data-col="colA"][data-row="${r}"]`)?.value;
                        let colB = document.querySelector(`.excel-input[data-col="colB"][data-row="${r}"]`)?.value;
                        let active = document.querySelector(`.custom-checkbox[data-col="active"][data-row="${r}"]`)?.checked;
                        if (colA && colB && active) { gridData.push({ cotA: colA, cotB: colB, active: active }); }
                    }
                    
                    saveSettings(gridData);
                    
                    if (gridData.length < 4) {
                        alert("Please enter and tick at least 4 valid rows of data to have 4 options!");
                        return; // DO NOT CLOSE MODAL
                    }

                    if (typeof window.GameplayManager !== 'undefined') { window.GameplayManager.initGame(null, gridData); }

                    document.getElementById('close-settings-btn').click();
                    document.getElementById('vs-modal').classList.remove('hidden');
                } catch(e) {
                    alert("ERROR in save and close: " + e.message + "\n" + e.stack);
                }
            });

            document.getElementById('btn-play-again').addEventListener('click', function() {
                document.getElementById('endgame-modal').classList.add('hidden');
                
                // Tắt nhạc Win và các nhạc nền khác để đảm bảo im lặng trước trận mới
                winAudio.pause();
                winAudio.currentTime = 0;
                mainThemeAudio.pause();
                mainThemeAudio.currentTime = 0;
                suddenDeathAudio.pause();
                suddenDeathAudio.currentTime = 0;
                
                // Reset hiệu ứng chết/thắng của Avatar để vào trận mới
                ['p1', 'p2'].forEach(p => {
                     const box = document.getElementById(`${p}-avatar-box`);
                     box.style.transition = 'none'; 
                     box.style.filter = ''; 
                     box.style.transform = ''; 
                     box.style.opacity = '1'; 
                     box.style.zIndex = '10';
                     box.style.boxShadow = '';
                     box.style.borderRadius = ''; // Xóa border-radius set thủ công
                     if(box.effectIntervalId) clearInterval(box.effectIntervalId);

                     if(window.GameplayManager && window.GameplayManager.state[p]) {
                         window.GameplayManager.state[p].hp = window.GameplayManager.state[p].maxHp;
                         window.GameplayManager.state[p].shield = 0;
                     }
                });
                
                if (window.GameplayManager) {
                    window.GameplayManager.updateUI();
                    // Reset đồng hồ và câu hỏi
                    window.GameplayManager.state.questionsPassed = 0;
                    window.GameplayManager.state.isSuddenDeath = false; // Đặt lại cờ SD
                    document.getElementById('quiz-timer').classList.remove('text-red-500', 'animate-pulse');
                    if (window.GameplayManager.suddenDeathTimer) clearInterval(window.GameplayManager.suddenDeathTimer);
                }
                document.getElementById('vs-modal').classList.remove('hidden');
            });

            document.getElementById('btn-start-battle').addEventListener('click', function() {
                // Phát âm thanh Welcome
                welcomeAudio.currentTime = 0;
                welcomeAudio.play().catch(e => console.log("Cần tương tác để phát âm thanh"));

                // ======================================================
                // ⚙️ THÔNG SỐ ĐIỀU CHỈNH: THỜI GIAN TRỄ BẬT NHẠC MAIN THEME
                // Đổi số 2000 thành thời gian bạn muốn (ví dụ: 3000 = 3 giây)
                // ======================================================
                const MAIN_THEME_DELAY_MS = 2000;

                // Chờ X giây sau mới bật nhạc nền chính Main Theme
                setTimeout(() => {
                    if (window.GameplayManager && window.GameplayManager.state.isPlaying && !window.GameplayManager.state.isSuddenDeath) {
                        mainThemeAudio.currentTime = 0;
                        mainThemeAudio.play().catch(e => console.log(e));
                    }
                }, MAIN_THEME_DELAY_MS);

                window.GameplayManager.state.p1.name = document.getElementById('p1-name-input').value || 'HERO';
                window.GameplayManager.state.p2.name = document.getElementById('p2-name-input').value || 'BOSS';
                
                document.getElementById('p1-name-input').dispatchEvent(new Event('change'));
                document.getElementById('p2-name-input').dispatchEvent(new Event('change'));

                document.getElementById('vs-modal').classList.add('hidden');
                window.GameplayManager.startGame(); 
            });


            const loaded = loadSettings();
            if (loaded.settings) {
                document.querySelectorAll('[data-save]').forEach(el => {
                    if (loaded.settings[el.dataset.save] !== undefined) {
                        if (el.type === 'checkbox') el.checked = loaded.settings[el.dataset.save];
                        else el.value = loaded.settings[el.dataset.save];
                        el.dispatchEvent(new Event('change')); 
                    }
                });
            }
            if (loaded.gridData && loaded.gridData.length > 0) {
                const tbody = document.getElementById('grid-body');
                tbody.innerHTML = ''; 
                currentRowCount = 0;
                loaded.gridData.forEach((row, index) => {
                    createGridRow(index + 1);
                    document.querySelector(`.excel-input[data-col="colA"][data-row="${index + 1}"]`).value = row.cotA || '';
                    document.querySelector(`.excel-input[data-col="colB"][data-row="${index + 1}"]`).value = row.cotB || '';
                    document.querySelector(`.custom-checkbox[data-col="active"][data-row="${index + 1}"]`).checked = row.active;
                });
            }

            // =========================================================================
            // --- [MODULE: GAMEPLAY_MANAGER_CORE] ---
            // =========================================================================
            const GameplayManager = {
                state: gameState,
                suddenDeathTimer: null,
                SKILL_POOL: [
                    { id: 'meteor', icon: '☄️' },
                    { id: 'kamehameha', icon: '🌊' }
                ],

                initGame: function(settingsData, gridData) {
                    this.state.dataPool = gridData;
                    this.state.totalQuestions = gridData.length;
                    this.state.questionsPassed = 1;
                    
                    this.state.mode = document.getElementById('setting_quiz_mode')?.value || 'sequential';
                    this.state.stunTime = (parseFloat(document.getElementById('setting_stun_time')?.value) || 2) * 1000;
                    
                    this.state.p1.maxHp = this.state.p1.hp = parseInt(document.getElementById('hero-max-hp')?.value) || 100;
                    this.state.p2.maxHp = this.state.p2.hp = parseInt(document.getElementById('boss-max-hp')?.value) || 1000;
                    this.state.p1.mana = 0; this.state.p2.mana = 0;
                    this.state.p1.isStunned = false; this.state.p2.isStunned = false;
                    this.state.p1.isFrozen = false; this.state.p2.isFrozen = false;
                    this.state.p1.queue = []; this.state.p2.queue = [];
                    
                    this.state.wrongPool = [];
                    this.state.isRetryPhase = false;
                    this.state.isTransitioning = false;

                    this.buildDecks();
                    this.refreshActivePool();
                    this.updateUI();
                    
                    document.getElementById('quiz-counter').innerText = `1/${this.state.totalQuestions}`;
                    renderHallOfFame(); // Hiển thị lịch sử ngay khi load
                },

                updateUI: function() {
                    updateUI(this.state);
                },

                buildDecks: function() {
                    // Logic xào bài vào Giỏ (Deck)
                    this.state.p1.deck = [...this.SKILL_POOL].sort(() => Math.random() - 0.5);
                    this.state.p2.deck = [...this.SKILL_POOL].sort(() => Math.random() - 0.5);
                },

                drawSkill: function(playerPrefix) {
                    let player = this.state[playerPrefix];
                    // Nếu rút hết bài thì nạp lại và xáo lên
                    if (player.deck.length === 0) {
                        player.deck = [...this.SKILL_POOL].sort(() => Math.random() - 0.5);
                    }
                    return player.deck.shift();
                },

                startGame: function() {
                    this.state.isPlaying = true;
                    this.state.matchStartTime = Date.now();
                    this.startSuddenDeathTimer();
                    this.loadNextQuestion();
                },
                
                startSuddenDeathTimer: function() {
                    if (this.suddenDeathTimer) clearInterval(this.suddenDeathTimer);
                    
                    let limitMinutes = parseFloat(document.getElementById('sudden-death-time')?.value) || 3;
                    let limitSec = limitMinutes * 60;
                    let sdDmg = parseFloat(document.getElementById('sudden-death-dmg')?.value) || 5;
                    let timerEl = document.getElementById('quiz-timer');
                    
                    this.suddenDeathTimer = setInterval(() => {
                        if (!this.state.isPlaying) {
                            clearInterval(this.suddenDeathTimer);
                            return;
                        }
                        
                        let elapsedSec = Math.floor((Date.now() - this.state.matchStartTime) / 1000);
                        let remaining = Math.max(0, limitSec - elapsedSec);
                        
                        let mins = Math.floor(remaining / 60).toString().padStart(2, '0');
                        let secs = (remaining % 60).toString().padStart(2, '0');
                        timerEl.innerText = `${mins}:${secs}`;

                        // Hết giờ: Kích hoạt Sudden Death
                        if (remaining <= 0) {
                            // Chuyển nhạc nếu chưa chuyển
                            if (!this.state.isSuddenDeath) {
                                this.state.isSuddenDeath = true;
                                mainThemeAudio.pause();
                                mainThemeAudio.currentTime = 0; // Đảm bảo ngưng hẳn Main Theme
                                suddenDeathAudio.currentTime = 0;
                                suddenDeathAudio.play().catch(e => console.log("Cần tương tác audio"));

                                // ==========================================
                                // HIỆU ỨNG SUDDEN DEATH: MA QUỶ BAY LÊN
                                // ==========================================
                                for (let i = 0; i < 20; i++) {
                                    setTimeout(() => {
                                        let entity = document.createElement('div');
                                        entity.innerText = Math.random() > 0.4 ? '👻' : (Math.random() > 0.5 ? '💀' : '☠️');
                                        entity.style.position = 'fixed';
                                        entity.style.left = (Math.random() * 100) + 'vw';
                                        entity.style.top = '110vh'; // Bắt đầu từ dưới đáy màn hình
                                        entity.style.fontSize = (50 + Math.random() * 80) + 'px'; 
                                        entity.style.zIndex = '9999';
                                        entity.style.pointerEvents = 'none';
                                        entity.style.filter = 'drop-shadow(0 0 15px red)';
                                        document.body.appendChild(entity);

                                        let duration = 2000 + Math.random() * 2000;
                                        
                                        entity.animate([
                                            { transform: 'translate(-50%, 0) rotate(0deg) scale(0.5)', opacity: 0 },
                                            { transform: `translate(-50%, -30vh) rotate(${(Math.random() - 0.5) * 45}deg) scale(1)`, opacity: 0.9, offset: 0.2 },
                                            { transform: `translate(-50%, -120vh) rotate(${(Math.random() - 0.5) * 90}deg) scale(1.5)`, opacity: 0 }
                                        ], { duration: duration, easing: 'ease-in-out' }).onfinish = () => entity.remove();
                                    }, i * 150); // Xuất hiện lần lượt
                                }
                            }

                            timerEl.classList.add('text-red-500', 'animate-pulse');
                            
                            // Trừ thẳng máu (Sudden Death) bằng hàm takeDamage để kích hoạt hiệu ứng văng máu
                            window.takeDamage('p1', sdDmg);
                            window.takeDamage('p2', sdDmg);
                            
                            // Rung nhẹ màn hình cảnh báo
                            document.body.style.transform = `translate(${(Math.random()-0.5)*4}px, ${(Math.random()-0.5)*4}px)`;
                            setTimeout(()=> document.body.style.transform = '', 100);
                        }
                    }, 1000);
                },

                refreshActivePool: function() {
                    this.state.activePool = [...this.state.dataPool];
                    if (this.state.mode === 'random') { this.state.activePool.sort(() => Math.random() - 0.5); }
                    this.state.wrongPool = [];
                    this.state.isRetryPhase = false;
                },

                loadNextQuestion: function() {
                    if (this.state.activePool.length === 0) {
                        if (this.state.wrongPool.length > 0 && !this.state.isRetryPhase) {
                            this.state.activePool = [...this.state.wrongPool];
                            if (this.state.mode === 'random') { this.state.activePool.sort(() => Math.random() - 0.5); }
                            this.state.wrongPool = [];
                            this.state.isRetryPhase = true; 
                        } else {
                            this.refreshActivePool();
                        }
                    }
                    
                    // Cập nhật Q Counter
                    if (this.state.questionsPassed > this.state.totalQuestions && this.state.totalQuestions > 0) {
                        // Tính chu kỳ lặp lại
                         let displayNum = ((this.state.questionsPassed - 1) % this.state.totalQuestions) + 1;
                         document.getElementById('quiz-counter').innerText = `${displayNum}/${this.state.totalQuestions}`;
                    } else {
                         document.getElementById('quiz-counter').innerText = `${this.state.questionsPassed}/${this.state.totalQuestions}`;
                    }

                    this.state.currentQuestionFails = 0;
                    let quizItem = this.state.activePool.shift(); 
                    let correctAnswer = quizItem.cotB;
                    
                    let otherOptions = this.state.dataPool.map(item => item.cotB).filter(val => val !== correctAnswer);
                    let uniqueDistractors = [...new Set(otherOptions)]; 
                    uniqueDistractors.sort(() => Math.random() - 0.5);
                    
                    let selectedDistractors = [];
                    if (uniqueDistractors.length === 0) {
                         selectedDistractors = ["A", "B", "C"]; 
                    } else {
                        for(let i=0; i<3; i++) { 
                            selectedDistractors.push(uniqueDistractors[i % uniqueDistractors.length]); 
                        }
                    }

                    let finalAnswers = [correctAnswer, ...selectedDistractors];
                    finalAnswers.sort(() => Math.random() - 0.5);

                    this.state.currentQuiz = {
                        originalItem: quizItem, 
                        questionImageOrText: quizItem.cotA,
                        correctAnswer: correctAnswer,
                        options: finalAnswers,
                        correctIndex: finalAnswers.indexOf(correctAnswer)
                    };

                    let ansContainer = document.getElementById('answers-container');
                    let quizQ = document.getElementById('question-container');
                    
                    ansContainer.classList.add('opacity-0', 'scale-90');
                    quizQ.classList.add('opacity-0', 'scale-90');
                    
                    for(let i=1; i<=4; i++){
                        document.getElementById(`overlay-ans-${i}`).classList.add('hidden');
                        document.getElementById(`icon-ans-${i}`).classList.replace('scale-100', 'scale-0');
                    }

                    setTimeout(() => {
                        this.renderQuizUI();
                        ansContainer.classList.remove('opacity-0', 'scale-90');
                        quizQ.classList.remove('opacity-0', 'scale-90');
                        this.state.isTransitioning = false; 
                    }, 300); 
                },

                renderQuizUI: function() {
                    let qState = this.state.currentQuiz;
                    let qImg = document.getElementById('quiz-q-img');
                    let qTxt = document.getElementById('quiz-q-txt');
                    let colAType = document.getElementById('col-a-type').value;
                    let colBType = document.getElementById('col-b-type').value;
                    
                    if (colAType === 'image') {
                        let imgSource = qState.questionImageOrText;
                        if (!imgSource.startsWith('http') && !imgSource.startsWith('data:')) { imgSource = `images/${imgSource}.png`; }
                        qImg.src = imgSource;
                        qImg.onerror = function() {
                            if (this.src.includes('.png')) {
                                this.src = this.src.replace('.png', '.jpg');
                            } else {
                                // Image not found — fall back to text display
                                this.onerror = null;
                                this.classList.add('hidden');
                                qTxt.innerText = qState.questionImageOrText;
                                qTxt.classList.remove('hidden');
                            }
                        };
                        qImg.classList.remove('hidden'); qTxt.classList.add('hidden');
                    } else {
                        qTxt.innerText = qState.questionImageOrText;
                        qTxt.classList.remove('hidden'); qImg.classList.add('hidden');
                    }

                    let answerButtons = document.querySelectorAll('#answers-container > div');
                    answerButtons.forEach((btn, index) => {
                        let spanTxt = btn.querySelector('span.text-3xl');
                        if (spanTxt && qState.options[index]) {
                            if (colBType === 'image') {
                                let ansImgSource = qState.options[index];
                                if (!ansImgSource.startsWith('http') && !ansImgSource.startsWith('data:')) { ansImgSource = `images/${ansImgSource}.png`; }
                                spanTxt.innerHTML = `<img src="${ansImgSource}" class="w-full h-full max-h-24 object-contain drop-shadow-md" onerror="if(this.src.includes('.png'))this.src=this.src.replace('.png','.jpg');else this.style.display='none';">`;
                            } else { spanTxt.innerText = qState.options[index]; }
                        }
                    });
                },

                addMana: function(playerPrefix, amount) {
                    let player = this.state[playerPrefix];
                    let oldCapacity = Math.floor(player.mana / 5);
                    player.mana = Math.min(10, player.mana + amount);
                    let newCapacity = Math.floor(player.mana / 5);

                    if (newCapacity > oldCapacity) {
                        let skillsToDraw = newCapacity - oldCapacity;
                        for(let i=0; i<skillsToDraw; i++) {
                            if (player.queue.length < 2) {
                                let drawnSkill = this.drawSkill(playerPrefix);
                                player.queue.push(drawnSkill);
                                playSound('draw_skill');
                            }
                        }
                    }
                    this.updateUI();
                },

                handlePlayerAnswer: function(playerPrefix, selectedAnswerIndex) {
                    if (!this.state.isPlaying || this.state.isTransitioning) return;
                    let player = this.state[playerPrefix];
                    let opponentPrefix = playerPrefix === 'p1' ? 'p2' : 'p1';
                    let opponent = this.state[opponentPrefix];

                    if (player.isStunned || player.isFrozen) return;

                    let isCorrect = (selectedAnswerIndex === this.state.currentQuiz.correctIndex);
                    
                    let ansIndexPlus1 = selectedAnswerIndex + 1;
                    let overlay = document.getElementById(`overlay-ans-${ansIndexPlus1}`);
                    let icon = document.getElementById(`icon-ans-${ansIndexPlus1}`);
                    overlay.classList.remove('hidden');

                    if (isCorrect) {
                        this.state.isTransitioning = true;
                        
                        icon.innerHTML = svgTick;
                        icon.classList.replace('scale-0', 'scale-100');
                        
                        playSound('correct');
                        this.addMana(playerPrefix, 1);
                        this.state.questionsPassed++; // Tăng câu hỏi khi đúng
                        
                        setTimeout(() => {
                            this.loadNextQuestion();
                        }, 1200);
                        
                    } else {
                        icon.innerHTML = svgCross;
                        icon.classList.replace('scale-0', 'scale-100');

                        playSound('wrong');

                        let oldCapacity = Math.floor(player.mana / 5);
                        player.mana = Math.max(0, player.mana - 1);
                        let newCapacity = Math.floor(player.mana / 5);
                        
                        if (newCapacity < oldCapacity && player.queue.length > newCapacity) {
                            player.queue.pop();
                        }

                        player.isStunned = true;
                        let actionBox = document.getElementById(`actions-${playerPrefix}`);
                        if(actionBox) actionBox.classList.add('stun-lock');
                        this.updateUI();
                        
                        this.state.currentQuestionFails++;

                        if (this.state.currentQuestionFails >= 2) {
                            this.state.isTransitioning = true;
                            if (!this.state.isRetryPhase) {
                                this.state.wrongPool.push(this.state.currentQuiz.originalItem);
                            }
                            
                            setTimeout(() => { this.loadNextQuestion(); }, 1000);
                        }
                        
                        setTimeout(() => { 
                            player.isStunned = false; 
                            if(actionBox) actionBox.classList.remove('stun-lock');
                            this.updateUI(); 
                        }, this.state.stunTime);
                    }
                },

                handleSkill: function(playerPrefix) {
                    if (!this.state.isPlaying) return;
                    let player = this.state[playerPrefix];
                    let opponentPrefix = playerPrefix === 'p1' ? 'p2' : 'p1';

                    if (player.isFrozen) { playSound('freeze'); return; }
                    
                    if (player.queue.length > 0 && player.mana >= 5) {
                        let skillToUse = player.queue.shift();
                        player.mana -= 5;
                        this.updateUI();

                        // ==========================================
                        // ⚓ [NEO 4]: GỌI TÊN SKILL (KÍCH HOẠT)
                        // Khi có skill mới, thêm 1 dòng "else if" ở đây:
                        // ==========================================
                        if (skillToUse.id === 'meteor') { playMeteorShower(playerPrefix, opponentPrefix); } 
                        else if (skillToUse.id === 'kamehameha') { playKamehamehaAnimation(playerPrefix, opponentPrefix); }
                        // ✂️👇 THÊM ELSE IF CHO SKILL MỚI VÀO ĐÂY 👇✂️

                        // ==========================================
                    }
                },

            };
            window.GameplayManager = GameplayManager;

            window.addEventListener('keydown', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
                if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); }

                let key = e.key;
                if (e.code.startsWith('Numpad') && key >= '0' && key <= '9') { key = 'NUM' + key; } 
                else if (e.code === 'NumpadEnter') { key = 'NUM ENTER'; }

                key = key.toUpperCase();
                if(key === ' ') key = 'SPACE';
                
                let p1_keys = [
                    document.getElementById('ui-ans-p1-1')?.innerText.trim().toUpperCase(),
                    document.getElementById('ui-ans-p1-2')?.innerText.trim().toUpperCase(),
                    document.getElementById('ui-ans-p1-3')?.innerText.trim().toUpperCase(),
                    document.getElementById('ui-ans-p1-4')?.innerText.trim().toUpperCase()
                ];
                
                let p2_keys = [
                    document.getElementById('ui-ans-p2-1')?.innerText.trim().toUpperCase(),
                    document.getElementById('ui-ans-p2-2')?.innerText.trim().toUpperCase(),
                    document.getElementById('ui-ans-p2-3')?.innerText.trim().toUpperCase(),
                    document.getElementById('ui-ans-p2-4')?.innerText.trim().toUpperCase()
                ];

                let p1_ult = document.getElementById('ui-key-p1-ult')?.innerText.trim().toUpperCase();
                let p2_ult = document.getElementById('ui-key-p2-ult')?.innerText.trim().toUpperCase();

                if (key === p1_ult) { window.GameplayManager.handleSkill('p1'); return; }
                if (key === p2_ult) { window.GameplayManager.handleSkill('p2'); return; }

                let p1_s1 = document.getElementById('ui-key-p1-s1')?.innerText.trim().toUpperCase(); 
                let p1_s2 = document.getElementById('ui-key-p1-s2')?.innerText.trim().toUpperCase(); 
                let p1_s3 = document.getElementById('ui-key-p1-s3')?.innerText.trim().toUpperCase(); 
                
                let p2_s1 = document.getElementById('ui-key-p2-s1')?.innerText.trim().toUpperCase(); 
                let p2_s2 = document.getElementById('ui-key-p2-s2')?.innerText.trim().toUpperCase(); 
                let p2_s3 = document.getElementById('ui-key-p2-s3')?.innerText.trim().toUpperCase(); 

                if (key === p1_s2) { window.triggerClickSkill('p1', 'atk'); return; }
                if (key === p1_s1) { window.triggerClickSkill('p1', 'def'); return; }
                if (key === p1_s3) { window.triggerClickSkill('p1', 'heal'); return; }

                if (key === p2_s2) { window.triggerClickSkill('p2', 'atk'); return; }
                if (key === p2_s1) { window.triggerClickSkill('p2', 'def'); return; }
                if (key === p2_s3) { window.triggerClickSkill('p2', 'heal'); return; }

                let p1Index = p1_keys.indexOf(key);
                if (p1Index !== -1) { window.GameplayManager.handlePlayerAnswer('p1', p1Index); return; }

                let p2Index = p2_keys.indexOf(key);
                if (p2Index !== -1) { window.GameplayManager.handlePlayerAnswer('p2', p2Index); }
            });
