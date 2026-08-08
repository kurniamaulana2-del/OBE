// MODUL KURIKULUM
// -------------------------------------------------------------

        // -------------------------------------------------------------
        // SUB MODUL SETUP PROFIL LULUSAN
        // -------------------------------------------------------------

        function renderSetupPL(container) {
            const isLocked = state.plFinalized;
            if (normalizeSequentialCodes(state.plList, 'PL')) saveState();
            let html = `
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-800"><i class="fa-solid fa-id-card mr-2 text-blue-800"></i>Setup Profil Lulusan (PL)</h3>
                    ${!isLocked ? `
                        <button onclick="addPL()" class="bg-blue-700 hover:bg-blue-800 text-white text-xs px-3 py-2 rounded shadow font-semibold">
                            <i class="fa-solid fa-plus mr-1"></i> Tambah PL
                        </button>` : ''}
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left border border-gray-200 rounded-lg">
                        <thead class="bg-gray-50 border-b text-gray-700">
                            <tr>
                                <th class="p-3 w-32">Profil Lulusan</th>
                                <th class="p-3">Deskripsi</th>
                                <th class="p-3 w-20 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>`;
            state.plList.forEach((pl, idx) => {
                html += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-3"><input type="text" value="${pl.code}" readonly class="w-full font-semibold border rounded px-2 py-1 bg-gray-50 cursor-not-allowed"></td>
                        <td class="p-3"><input type="text" value="${pl.desc}" ${isLocked ? 'disabled' : ''} onchange="state.plList[${idx}].desc=this.value; saveState();" class="w-full border rounded px-2 py-1"></td>
                        <td class="p-3 text-center">
                            ${!isLocked ? `<button onclick="deletePL(${idx})" class="text-red-600 hover:text-red-800"><i class="fa-solid fa-trash"></i></button>` : '-'}
                        </td>
                    </tr>`;
            });
            html += `</tbody></table></div>
                <div class="mt-4 flex justify-between items-center border-t pt-3">
                    <p class="text-xs text-gray-500">* Pastikan seluruh data Profil Lulusan telah sesuai sebelum difinalisasi.</p>
                    <div>
                        ${isLocked ? 
                            `<span class="bg-green-100 text-green-800 font-bold px-3 py-1.5 rounded text-xs"><i class="fa-solid fa-lock mr-1"></i> PROFIL LULUSAN DIFINALISASI</span>
                            <button onclick="unfinalizePL()" class="ml-2 text-xs text-red-600 underline">Buka Kunci</button>` :
                            `<button onclick="finalizePL()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded shadow font-bold">
                                <i class="fa-solid fa-check-double mr-1"></i> Finalisasi Profil Lulusan
                            </button>`
                        }
                    </div>
                </div>`;
            container.innerHTML = html;
        }

        function addPL() {
            state.plList.push({ id: 'PL' + Date.now(), code: '', desc: '' });
            normalizeSequentialCodes(state.plList, 'PL');
            saveState();
            renderApp();
        }

        function deletePL(idx) {
            state.plList.splice(idx, 1);
            normalizeSequentialCodes(state.plList, 'PL');
            saveState();
            renderApp();
        }
 
        function finalizePL() {
            if (state.plList.length === 0) { alert("Tambahkan minimal 1 Profil Lulusan!"); return; }
            state.plFinalized = true;
            saveState();
            renderApp();
        }

        function hasFinalizedCPMK() {
            return Object.values(state.cpmkFinalized || {}).some(Boolean);
        }

        function unfinalizePL() {
            if (state.cplFinalized || state.matrixCplPlFinalized || state.mkFinalized || hasFinalizedCPMK()) {
                alert('Setup Profil Lulusan belum dapat dibuka. Buka kunci secara berurutan dari Setup CPMK, Setup Mata Kuliah, Matriks CPL x Profil Lulusan, lalu Setup CPL.');
                return;
            }
            state.plFinalized = false;
            saveState();
            renderApp();
            alert('Setup Profil Lulusan telah dibuka.');
        }

        // -------------------------------------------------------------
        // SUB MODUL SETUP CPL
        // -------------------------------------------------------------

        function renderSetupCPL(container) {
            const isLocked = state.cplFinalized;
            if (normalizeSequentialCodes(state.cplList, 'CPL')) saveState();
            let html = `
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-800"><i class="fa-solid fa-list-check mr-2 text-blue-800"></i>Setup Capaian Pembelajaran Lulusan (CPL)</h3>
                    ${!isLocked ? `
                        <button onclick="addCPL()" class="bg-blue-700 hover:bg-blue-800 text-white text-xs px-3 py-2 rounded shadow font-semibold">
                            <i class="fa-solid fa-plus mr-1"></i> Tambah CPL
                        </button>` : ''}
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left border border-gray-200 rounded-lg">
                        <thead class="bg-gray-50 border-b text-gray-700">
                            <tr>
                                <th class="p-3 w-32">Kode CPL</th>
                                <th class="p-3">Deskripsi Capaian Pembelajaran</th>
                                <th class="p-3 w-20 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>`;
            state.cplList.forEach((cpl, idx) => {
                html += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-3"><input type="text" value="${cpl.code}" readonly class="w-full font-semibold border rounded px-2 py-1 bg-gray-50 cursor-not-allowed"></td>
                        <td class="p-3"><input type="text" value="${cpl.desc}" ${isLocked ? 'disabled' : ''} onchange="state.cplList[${idx}].desc=this.value; saveState();" class="w-full border rounded px-2 py-1"></td>
                        <td class="p-3 text-center">
                            ${!isLocked ? `<button onclick="deleteCPL(${idx})" class="text-red-600 hover:text-red-800"><i class="fa-solid fa-trash"></i></button>` : '-'}
                        </td>
                    </tr>`;
            });
            html += `</tbody></table></div>
                <div class="mt-4 flex justify-between items-center border-t pt-3">
                    <p class="text-xs text-gray-500">* Pastikan seluruh data CPL telah sesuai sebelum difinalisasi.</p>
                    <div>
                        ${isLocked ? 
                            `<span class="bg-green-100 text-green-800 font-bold px-3 py-1.5 rounded text-xs"><i class="fa-solid fa-lock mr-1"></i> CPL DIFINALISASI</span>
                            <button onclick="unfinalizeCPL()" class="ml-2 text-xs text-red-600 underline">Buka Kunci</button>` :
                            `<button onclick="finalizeCPL()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded shadow font-bold">
                                <i class="fa-solid fa-check-double mr-1"></i> Finalisasi CPL
                            </button>`
                        }
                    </div>
                </div>`;
            container.innerHTML = html;
        }

        function addCPL() {
            state.cplList.push({ id: 'CPL' + Date.now(), code: '', desc: '' });
            normalizeSequentialCodes(state.cplList, 'CPL');
            saveState();
            renderApp();
        }

        function deleteCPL(idx) {
            state.cplList.splice(idx, 1);
            normalizeSequentialCodes(state.cplList, 'CPL');
            saveState();
            renderApp();
        }

        function finalizeCPL() {
            if (!state.plFinalized) { alert("Finalisasi Setup Profil Lulusan terlebih dahulu."); return; }
            if (state.cplList.length === 0) { alert("Tambahkan minimal 1 CPL!"); return; }
            state.cplFinalized = true;
            saveState();
            renderApp();
        }

        function unfinalizeCPL() {
            if (state.matrixCplPlFinalized || state.mkFinalized || hasFinalizedCPMK()) {
                alert('Setup CPL belum dapat dibuka. Buka kunci Setup CPMK, Setup Mata Kuliah, dan Matriks CPL x Profil Lulusan terlebih dahulu.');
                return;
            }
            state.cplFinalized = false;
            saveState();
            renderApp();
            alert('Setup CPL telah dibuka.');
        }

        // -------------------------------------------------------------
        // SUB MODUL MATRIKS CPL X PROFIL LULUSAN
        // -------------------------------------------------------------

        function renderMatriksCPL_PL(container) {
            const isLocked = state.matrixCplPlFinalized;
            let html = `
                <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fa-solid fa-table-cells mr-2 text-blue-800"></i>Matriks CPL x Profil Lulusan</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-center border border-gray-200 rounded-lg">
                        <thead class="bg-blue-900 text-white border-b">
                            <tr>
                                <th class="p-3 text-left w-48">CPL / Profil Lulusan</th>`;
            state.plList.forEach(pl => { html += `<th class="p-3">${pl.code}</th>`; });
            html += `</tr></thead><tbody>`;

            state.cplList.forEach(cpl => {
                html += `<tr class="border-b hover:bg-gray-50"><td class="p-3 font-semibold text-left bg-gray-50">${cpl.code}</td>`;
                state.plList.forEach(pl => {
                    const key = `${cpl.id}_${pl.id}`;
                    const isChecked = !!state.matrixCPL_PL[key];
                    html += `<td class="p-3"><input type="checkbox" ${isChecked ? 'checked' : ''} ${isLocked ? 'disabled' : ''} onchange="toggleMatrixCPL_PL('${key}')" class="w-5 h-5 text-blue-600 rounded"></td>`;
                });
                html += `</tr>`;
            });

            html += `</tbody></table></div>
                <div class="mt-4 flex justify-between items-center border-t pt-3">
                    <p class="text-xs text-gray-500">* Finalisasi pemetaan hubungan antara CPL dan Profil Lulusan.</p>
                    <div>
                        ${isLocked ? 
                            `<span class="bg-green-100 text-green-800 font-bold px-3 py-1.5 rounded text-xs"><i class="fa-solid fa-lock mr-1"></i> MATRIKS CPL x PL DIFINALISASI</span>
                            <button onclick="unfinalizeMatrixCPLPL()" class="ml-2 text-xs text-red-600 underline">Buka Kunci</button>` :
                            `<button onclick="finalizeMatrixCPLPL()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded shadow font-bold">
                                <i class="fa-solid fa-check-double mr-1"></i> Finalisasi Matriks CPL x PL
                            </button>`
                        }
                    </div>
                </div>`;
            container.innerHTML = html;
        }

        function toggleMatrixCPL_PL(key) {
            state.matrixCPL_PL[key] = !state.matrixCPL_PL[key];
            saveState();
        }

        function finalizeMatrixCPLPL() {
            if (!state.cplFinalized) { alert("Finalisasi Setup CPL terlebih dahulu."); return; }
            state.matrixCplPlFinalized = true;
            saveState();
            renderApp();
        }

        function unfinalizeMatrixCPLPL() {
            if (state.mkFinalized || hasFinalizedCPMK()) {
                alert('Matriks CPL x Profil Lulusan belum dapat dibuka. Buka kunci Setup CPMK dan Setup Mata Kuliah terlebih dahulu.');
                return;
            }
            state.matrixCplPlFinalized = false;
            saveState();
            renderApp();
            alert('Matriks CPL x Profil Lulusan telah dibuka.');
        }

        // -------------------------------------------------------------
        // SUB MODUL SETUP MATA KULIAH
        // -------------------------------------------------------------

        function updateSks(idx, type, val) {
            const numVal = parseFloat(val) || 0;
            if (type === 'teori') state.mkList[idx].sksTeori = numVal;
            else if (type === 'praktik') state.mkList[idx].sksPraktik = numVal;
            state.mkList[idx].totalSks = (parseFloat(state.mkList[idx].sksTeori) || 0) + (parseFloat(state.mkList[idx].sksPraktik) || 0);
            saveState();
            renderApp();
        }

        function toggleMKCPL(idx, cplId) {
            if (!state.mkList[idx].cpls) state.mkList[idx].cpls = [];
            const pos = state.mkList[idx].cpls.indexOf(cplId);
            if (pos > -1) state.mkList[idx].cpls.splice(pos, 1);
            else state.mkList[idx].cpls.push(cplId);
            saveState();
        }

        function addMK() {
            const newId = 'MK' + Date.now();
            state.mkList.push({ id: newId, semester: '1', code: '', name: '', sksTeori: 2, sksPraktik: 0, totalSks: 2, jenis: 'MKDU', cpls: [] });
            if (!state.selectedMKId) state.selectedMKId = newId;
            saveState();
            renderApp();
        }

        function resetMK() {
            if (state.mkFinalized) {
                alert("Setup Mata Kuliah telah difinalisasi. Silakan buka kunci terlebih dahulu jika ingin mereset data.");
                return;
            }
            const konfirmasi = confirm("Apakah Anda yakin ingin mereset seluruh data Mata Kuliah?");
            if (konfirmasi) {
                state.mkList = [];
                state.cpmkList = {};
                state.selectedMKId = '';
                saveState();
                renderApp();
                alert("Data Mata Kuliah berhasil direset!");
            }
        }

        function deleteMK(idx) {
            const deletedId = state.mkList[idx].id;
            state.mkList.splice(idx, 1);
            if (state.selectedMKId === deletedId) {
                state.selectedMKId = state.mkList.length > 0 ? state.mkList[0].id : '';
            }
            saveState();
            renderApp();
        }

        function exportMKToExcel() {
            if (state.mkList.length === 0) { alert("Tidak ada data MK untuk diekspor!"); return; }
            const exportData = state.mkList.map(mk => {
                const row = {
                    'Semester': mk.semester,
                    'Kode MK': mk.code,
                    'Nama Mata Kuliah': mk.name,
                    'SKS Teori': mk.sksTeori,
                    'SKS Praktik': mk.sksPraktik,
                    'Total SKS': (parseFloat(mk.sksTeori)||0) + (parseFloat(mk.sksPraktik)||0),
                    'Jenis': mk.jenis
                };
                state.cplList.forEach(cpl => { row[cpl.code] = (mk.cpls && mk.cpls.includes(cpl.id)) ? 'V' : ''; });
                return row;
            });
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Setup MK");
            XLSX.writeFile(wb, "Setup_Mata_Kuliah_OBE.xlsx");
        }

        function importMKFromExcel(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const data = new Uint8Array(evt.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet);

                    if (json.length === 0) { alert("File Excel kosong!"); return; }

                    state.mkList = json.map((row, index) => {
                        const sksTeori = parseFloat(row['SKS Teori']) || 0;
                        const sksPraktik = parseFloat(row['SKS Praktik']) || 0;
                        const cpls = [];
                        state.cplList.forEach(cpl => {
                            if (row[cpl.code] && row[cpl.code].toString().trim().toUpperCase() === 'V') cpls.push(cpl.id);
                        });
                        return {
                            id: 'MK_IMP_' + Date.now() + '_' + index,
                            semester: (row['Semester'] || '1').toString(),
                            code: (row['Kode MK'] || '').toString(),
                            name: (row['Nama Mata Kuliah'] || '').toString(),
                            sksTeori: sksTeori,
                            sksPraktik: sksPraktik,
                            totalSks: sksTeori + sksPraktik,
                            jenis: row['Jenis'] || 'MKDU',
                            cpls: cpls
                        };
                    });
                    if (state.mkList.length > 0) state.selectedMKId = state.mkList[0].id;
                    saveState();
                    renderApp();
                    alert("Berhasil mengimpor Mata Kuliah!");
                } catch (err) { alert("Gagal membaca file Excel!"); }
            };
            reader.readAsArrayBuffer(file);
            e.target.value = '';
        }

        function renderSetupMK(container) {
            const isLocked = state.mkFinalized;
            let html = `
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-800"><i class="fa-solid fa-book mr-2 text-blue-800"></i>Setup Mata Kuliah (MK)</h3>
                    <div class="flex space-x-2">
                        ${!isLocked ? `
                            <button onclick="addMK()" class="bg-blue-700 hover:bg-blue-800 text-white text-xs px-3 py-2 rounded shadow font-semibold"><i class="fa-solid fa-plus mr-1"></i> Tambah MK</button>
                            <button onclick="document.getElementById('mk-import-input').click()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-2 rounded shadow font-semibold"><i class="fa-solid fa-file-import mr-1"></i> Impor Excel</button>
                            <button onclick="resetMK()" class="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2 rounded shadow font-semibold"><i class="fa-solid fa-rotate-left mr-1"></i> Reset MK</button>` : ''}
                        <button onclick="exportMKToExcel()" class="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-2 rounded shadow font-semibold"><i class="fa-solid fa-file-excel mr-1"></i> Ekspor Excel</button>
                    </div>
                </div>
                <input type="file" id="mk-import-input" accept=".xlsx,.xls,.csv" class="hidden" onchange="importMKFromExcel(event)">
                
                <div class="overflow-x-auto">
                    <table class="w-full text-xs text-left border border-gray-200 rounded-lg">
                        <thead class="bg-blue-900 text-white border-b">
                            <tr>
                                <th class="p-2 w-16">Smt</th>
                                <th class="p-2 w-24">Kode MK</th>
                                <th class="p-2">Nama Mata Kuliah</th>
                                <th class="p-2 w-16 text-center">SKS T</th>
                                <th class="p-2 w-16 text-center">SKS P</th>
                                <th class="p-2 w-16 text-center">Total</th>
                                <th class="p-2 w-24">Jenis</th>
                                <th class="p-2">Pemetaan CPL</th>
                                <th class="p-2 w-12 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>`;
            state.mkList.forEach((mk, idx) => {
                html += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-2"><input type="text" value="${mk.semester}" ${isLocked ? 'disabled' : ''} onchange="state.mkList[${idx}].semester=this.value; saveState();" class="w-full border rounded px-1 py-1 text-center"></td>
                        <td class="p-2"><input type="text" value="${mk.code}" ${isLocked ? 'disabled' : ''} onchange="state.mkList[${idx}].code=this.value; saveState();" class="w-full font-semibold border rounded px-1 py-1"></td>
                        <td class="p-2"><input type="text" value="${mk.name}" ${isLocked ? 'disabled' : ''} onchange="state.mkList[${idx}].name=this.value; saveState();" class="w-full border rounded px-1 py-1"></td>
                        <td class="p-2 text-center"><input type="number" value="${mk.sksTeori}" ${isLocked ? 'disabled' : ''} onchange="updateSks(${idx}, 'teori', this.value)" class="w-full border rounded px-1 py-1 text-center"></td>
                        <td class="p-2 text-center"><input type="number" value="${mk.sksPraktik}" ${isLocked ? 'disabled' : ''} onchange="updateSks(${idx}, 'praktik', this.value)" class="w-full border rounded px-1 py-1 text-center"></td>
                        <td class="p-2 text-center font-bold text-blue-900 bg-blue-50">${mk.totalSks}</td>
                        <td class="p-2">
                            <select ${isLocked ? 'disabled' : ''} onchange="state.mkList[${idx}].jenis=this.value; saveState();" class="w-full border rounded px-1 py-1">
                                <option value="MKDU" ${mk.jenis === 'MKDU' ? 'selected' : ''}>MKDU</option>
                                <option value="MKWU" ${mk.jenis === 'MKWU' ? 'selected' : ''}>MKWU</option>
                                <option value="MKWP" ${mk.jenis === 'MKWP' ? 'selected' : ''}>MKWP</option>
                                <option value="MKPP" ${mk.jenis === 'MKPP' ? 'selected' : ''}>MKPP</option>
                            </select>
                        </td>
                        <td class="p-2">
                            <div class="flex flex-wrap gap-1">`;
                state.cplList.forEach(cpl => {
                    const isChecked = mk.cpls && mk.cpls.includes(cpl.id);
                    html += `
                        <label class="inline-flex items-center text-[10px] bg-gray-100 px-1.5 py-0.5 rounded border ${isChecked ? 'border-blue-500 bg-blue-50 font-bold text-blue-800' : 'text-gray-600'}">
                            <input type="checkbox" ${isChecked ? 'checked' : ''} ${isLocked ? 'disabled' : ''} onchange="toggleMKCPL(${idx}, '${cpl.id}')" class="mr-1 w-3 h-3 text-blue-600">
                            ${cpl.code}
                        </label>`;
                });
                html += `</div></td>
                        <td class="p-2 text-center">${!isLocked ? `<button onclick="deleteMK(${idx})" class="text-red-600 hover:text-red-800"><i class="fa-solid fa-trash"></i></button>` : '-'}</td>
                    </tr>`;
            });
            html += `</tbody></table></div>
                <div class="mt-4 flex justify-between items-center border-t pt-3">
                    <p class="text-xs text-gray-500">* Pastikan seluruh data Mata Kuliah telah sesuai.</p>
                    <div>
                        ${isLocked ? 
                            `<span class="bg-green-100 text-green-800 font-bold px-3 py-1.5 rounded text-xs"><i class="fa-solid fa-lock mr-1"></i> MATA KULIAH DIFINALISASI</span>
                            <button onclick="unfinalizeMK()" class="ml-2 text-xs text-red-600 underline">Buka Kunci</button>` :
                            `<button onclick="finalizeMK()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded shadow font-bold"><i class="fa-solid fa-check-double mr-1"></i> Finalisasi Mata Kuliah</button>`
                        }
                    </div>
                </div>`;
            container.innerHTML = html;
        }

        function finalizeMK() {
            if (!state.matrixCplPlFinalized) { alert("Finalisasi Matriks CPL x Profil Lulusan terlebih dahulu."); return; }
            if (state.mkList.length === 0) { alert("Tambahkan minimal 1 Mata Kuliah!"); return; }
            state.mkFinalized = true;
            saveState();
            renderApp();
        }

        function unfinalizeMK() {
            if (hasFinalizedCPMK()) {
                alert('Setup Mata Kuliah belum dapat dibuka. Buka kunci seluruh Setup CPMK terlebih dahulu.');
                return;
            }
            state.mkFinalized = false;
            saveState();
            renderApp();
            alert('Setup Mata Kuliah telah dibuka.');
        }

        // -------------------------------------------------------------
        // SUB MODUL SETUP CPMK
        // -------------------------------------------------------------

        function renderSetupCPMK(container) {
            if (state.mkList.length === 0) {
                container.innerHTML = `<div class="p-4 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 text-sm">Belum ada data Mata Kuliah. Silakan isi Setup Mata Kuliah terlebih dahulu.</div>`;
                return;
            }

            if (!state.selectedMKId || !state.mkList.find(m => m.id === state.selectedMKId)) {
                state.selectedMKId = state.mkList[0].id;
            }

            const currentMK = state.mkList.find(m => m.id === state.selectedMKId);

            if (!state.cpmkList[currentMK.id]) {
                state.cpmkList[currentMK.id] = [
                    { id: 'CPMK1', code: 'CPMK 1', desc: '', weights: {} },
                    { id: 'CPMK2', code: 'CPMK 2', desc: '', weights: {} }
                ];
            }

            const cpmks = state.cpmkList[currentMK.id];
            if (normalizeSequentialCodes(cpmks, 'CPMK')) saveState();
            const mappedCPLs = state.cplList.filter(cpl => currentMK.cpls && currentMK.cpls.includes(cpl.id));
            const cpmkAllocation = getCpmkCplAllocationValidation(cpmks, mappedCPLs);
            const hasValidCpmkHierarchy = cpmkAllocation.hierarchyValid;
            if (state.cpmkFinalized && state.cpmkFinalized[currentMK.id] && !hasValidCpmkHierarchy) {
                state.cpmkFinalized[currentMK.id] = false;
                saveState();
            }
            const canEdit = !!state.mkFinalized && !(state.cpmkFinalized && !!state.cpmkFinalized[currentMK.id]);
            const isLocked = !state.mkFinalized || (state.cpmkFinalized && !!state.cpmkFinalized[currentMK.id]);

            let html = `
                <div class="mb-4 flex flex-wrap justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div class="flex items-center space-x-2">
                        <label class="text-sm font-bold text-blue-900">Pilih Mata Kuliah:</label>
                        <select onchange="state.selectedMKId = this.value; saveState(); renderApp();" class="border font-medium rounded px-3 py-1.5 text-sm bg-white shadow-sm">
                            ${state.mkList.map(mk => `<option value="${mk.id}" ${mk.id === currentMK.id ? 'selected' : ''}>[${mk.code}] ${mk.name} (Smt ${mk.semester})</option>`).join('')}
                        </select>
                    </div>
                    ${canEdit ? `
                        <button onclick="addCPMK('${currentMK.id}')" class="bg-blue-700 hover:bg-blue-800 text-white text-xs px-3 py-2 rounded shadow font-semibold">
                            <i class="fa-solid fa-plus mr-1"></i> Tambah CPMK
                        </button>` : ''}
                </div>

                <h4 class="font-bold text-gray-800 mb-2 text-sm">Daftar CPMK & Pemetaan Bobot ke CPL</h4>`;

            if (!state.mkFinalized) {
                html += `<div class="p-6 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200 text-center text-sm"><i class="fa-solid fa-lock-open block text-2xl mb-2 text-yellow-600"></i><span class="font-semibold">Matriks CPMK tidak ditampilkan.</span><p class="mt-1 text-xs">Finalisasi Setup Mata Kuliah terlebih dahulu untuk menampilkan dan mengelola matriks CPMK.</p></div>`;
                container.innerHTML = html;
                return;
            }

            if (mappedCPLs.length === 0) {
                html += `<div class="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200 mb-4">Mata kuliah ini belum dipetakan ke CPL apapun.</div>`;
            }

            html += `
                <div class="overflow-x-auto mb-4">
                    <table class="w-full text-xs text-left border border-gray-200 rounded-lg table-compact" style="w-auto;">
                        <thead class="bg-gray-100 border-b text-gray-700">
                            <tr>
                                <th class="p-2 w-28">Kode CPMK</th>
                                <th class="p-2 min-w-[200px]">Deskripsi CPMK</th>`;
            mappedCPLs.forEach(cpl => { html += `<th class="p-2 text-center w-24">${cpl.code} (%)</th>`; });
            html += `<th class="p-2 w-20 text-center">Total Bobot</th>
                                <th class="p-2 w-12 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>`;

            let grandTotal = 0;
            cpmks.forEach((cpmk, cIdx) => {
                let rowTotal = 0;
                html += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-2"><input type="text" value="${cpmk.code}" readonly class="w-full font-semibold border rounded px-2 py-1 bg-gray-50 cursor-not-allowed"></td>
                        <td class="p-2"><input type="text" value="${cpmk.desc}" ${isLocked ? 'disabled' : ''} onchange="state.cpmkList['${currentMK.id}'][${cIdx}].desc=this.value; saveState();" class="w-full border rounded px-2 py-1"></td>`;

                mappedCPLs.forEach(cpl => {
                    const w = parseFloat(cpmk.weights[cpl.id]) || 0;
                    rowTotal += w;
                    const displayValue = w > 0 ? w : '';
                    html += `
                        <td class="p-2 text-center">
                            <input type="number" min="0" max="100" value="${displayValue}" ${isLocked ? 'disabled' : ''} 
                                onchange="updateCPMKWeight('${currentMK.id}', ${cIdx}, '${cpl.id}', this.value)" 
                                class="w-16 border rounded px-1 py-1 text-center font-medium">
                        </td>`;
                });

                grandTotal += rowTotal;

                html += `
                        <td class="p-2 text-center font-bold ${rowTotal > 0 ? 'text-blue-900 bg-blue-50' : 'text-gray-400'}">${rowTotal}%</td>
                        <td class="p-2 text-center">
                            ${canEdit ? `<button onclick="deleteCPMK('${currentMK.id}', ${cIdx})" class="text-red-600 hover:text-red-800"><i class="fa-solid fa-trash"></i></button>` : '-'}
                        </td>
                    </tr>`;
            });

            html += `</tbody>
                        <tfoot class="bg-gray-100 font-bold">
                            <tr>
                                <td colspan="2" class="p-2 text-right">Total Akumulasi Bobot CPMK:</td>`;
            mappedCPLs.forEach(cpl => {
                let colTotal = 0;
                cpmks.forEach(c => { colTotal += (parseFloat(c.weights[cpl.id]) || 0); });
                const mappedCount = cpmkAllocation.cpmkCountsByCpl[cpl.id] || 0;
                html += `<td class="p-2 text-center text-blue-900">${colTotal}%<div class="mt-0.5 text-[9px] font-normal text-gray-500">${mappedCount} CPMK</div></td>`;
            });
            html += `<td class="p-2 text-center ${grandTotal === 100 ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}">${grandTotal}%</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div class="mt-4 flex justify-between items-center border-t pt-3">
                    <p class="text-xs ${grandTotal === 100 && hasValidCpmkHierarchy ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}">
                        ${grandTotal === 100 && hasValidCpmkHierarchy ? '<i class="fa-solid fa-circle-check mr-1"></i> Total matriks 100%; setiap CPMK mengukur tepat satu CPL dan satu CPL dapat diukur oleh beberapa CPMK. SIAP DIFINALISASI.' : `<i class="fa-solid fa-triangle-exclamation mr-1"></i> Pastikan total seluruh matriks 100% dan setiap CPMK mengukur tepat satu CPL. Beberapa CPMK boleh mengukur CPL yang sama.`}
                    </p>
                    <div>
                        ${isLocked ? 
                            `<span class="bg-green-100 text-green-800 font-bold px-3 py-1.5 rounded text-xs"><i class="fa-solid fa-lock mr-1"></i> CPMK DIFINALISASI</span>
                            <button onclick="unfinalizeCPMK('${currentMK.id}')" class="ml-2 text-xs text-red-600 underline">Buka Kunci</button>` :
                            `<button class="inline-flex items-center bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-4 py-2 rounded-lg shadow font-bold disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed" ${state.mkFinalized && grandTotal === 100 && hasValidCpmkHierarchy ? `onclick="finalizeCPMK('${currentMK.id}', ${grandTotal})"` : 'disabled'}><i class="fa-solid fa-check-double mr-1.5"></i> Finalisasi Setup CPMK</button>`
                        }
                    </div>
                </div>`;

            container.innerHTML = html;
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(function () {
                    container.querySelectorAll('textarea[data-auto-resize="weekly"]').forEach(function (textarea) {
                        autoResizeTextarea(textarea);
                    });
                });
            } else {
                container.querySelectorAll('textarea[data-auto-resize="weekly"]').forEach(function (textarea) {
                    autoResizeTextarea(textarea);
                });
            }
        }

        function addCPMK(mkId) {
            if (!state.mkFinalized) { alert("Finalisasi Setup Mata Kuliah terlebih dahulu sebelum mengedit CPMK."); return; }
            if (!state.cpmkList[mkId]) state.cpmkList[mkId] = [];
            state.cpmkList[mkId].push({ id: 'CPMK' + Date.now(), code: '', desc: '', weights: {} });
            normalizeSequentialCodes(state.cpmkList[mkId], 'CPMK');
            saveState();
            renderApp();
        }

        function deleteCPMK(mkId, idx) {
            if (!state.mkFinalized) { alert("Finalisasi Setup Mata Kuliah terlebih dahulu sebelum mengedit CPMK."); return; }
            state.cpmkList[mkId].splice(idx, 1);
            normalizeSequentialCodes(state.cpmkList[mkId], 'CPMK');
            saveState();
            renderApp();
        }

        function updateCPMKWeight(mkId, cIdx, cplId, val) {
            if (!state.mkFinalized) { alert("Finalisasi Setup Mata Kuliah terlebih dahulu sebelum mengedit CPMK."); return; }
            const num = Math.min(100, Math.max(0, parseFloat(val) || 0));
            if (!state.cpmkList[mkId][cIdx].weights) state.cpmkList[mkId][cIdx].weights = {};
            const weights = state.cpmkList[mkId][cIdx].weights;
            if (num > 0) {
                // Only clear other CPLs in this CPMK row; other CPMKs may share the selected CPL.
                Object.keys(weights).forEach(parentId => {
                    if (parentId !== cplId) weights[parentId] = 0;
                });
            }
            weights[cplId] = num;
            saveState();
            renderApp();
        }

        function finalizeCPMK(mkId, grandTotal) {
            if (!state.mkFinalized) { alert("Finalisasi Setup Mata Kuliah terlebih dahulu sebelum mengedit CPMK."); return; }
            const mk = state.mkList.find(item => item.id === mkId);
            const cpmks = state.cpmkList[mkId] || [];
            const mappedCPLs = state.cplList.filter(cpl => mk && mk.cpls && mk.cpls.includes(cpl.id));
            const allocation = getCpmkCplAllocationValidation(cpmks, mappedCPLs);
            if (!numbersAreEqual(grandTotal, 100) || !allocation.valid) {
                alert(`Gagal Finalisasi! Pastikan total seluruh matriks tepat 100% dan setiap CPMK mengukur tepat satu CPL. Beberapa CPMK boleh mengukur CPL yang sama.`);
                return;
            }
            if (!state.cpmkFinalized) state.cpmkFinalized = {};
            state.cpmkFinalized[mkId] = true;
            alert("Setup CPMK untuk Mata Kuliah ini berhasil difinalisasi!");
            saveState();
            renderApp();
        }

        function unfinalizeCPMK(mkId) {
            if (!state.cpmkFinalized) state.cpmkFinalized = {};
            state.cpmkFinalized[mkId] = false;
            saveState();
            renderApp();
            alert('Setup CPMK untuk mata kuliah terpilih telah dibuka.');
        }
        
// -------------------------------------------------------------
