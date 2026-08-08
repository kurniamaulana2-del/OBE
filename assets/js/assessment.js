        // SUB MODUL PENILAIAN
        // -------------------------------------------------------------

        function canManageClassAssessment(classKey) {
            const cls = state.classData[classKey];
            return !!(cls
                && cls.rpsFinalized
                && ['kaprodi', 'gkm', 'dosen'].includes(getCurrentRole())
                && isAssignedToClass(classKey));
        }

        function renderPenilaianMahasiswa(container) {
            const classKeys = getAccessibleClassKeys('input_nilai');
            if (classKeys.length === 0) {
                container.innerHTML = `<div class="p-4 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 text-sm">${getCurrentRole() === 'dosen' ? 'Belum ada kelas yang diplot kepada akun Anda.' : 'Belum ada kelas perkuliahan. Buat kelas terlebih dahulu di menu Setup Perkuliahan.'}</div>`;
                return;
            }

            if (!state.selectedClassKey || !classKeys.includes(state.selectedClassKey)) state.selectedClassKey = classKeys[0];
            const currentClassKey = state.selectedClassKey;
            const cls = state.classData[currentClassKey];
            const mk = state.mkList.find(m => m.id === cls.mkId) || { code: 'N/A', name: 'Mata Kuliah' };
            const komps = getSortedKomponenList(cls.komponenList || [], getKomponenMatrixSortState());
            const students = cls.students || [];

            const isRpsFinalized = !!cls.rpsFinalized;
            const canManageAssessment = canManageClassAssessment(currentClassKey);

            let html = `
                <!-- Header -->
                <div class="flex flex-wrap justify-between items-center mb-4">
                    <div>
                        <h3 class="text-lg font-bold text-gray-800"><i class="fa-solid fa-user-pen mr-2 text-blue-800"></i>Penilaian</h3>
                        <p class="text-xs text-gray-500">Input nilai mahasiswa untuk setiap komponen penilaian.</p>
                    </div>
                    <!-- Action Buttons -->
                    <div class="flex items-center space-x-2">
                        <button onclick="downloadGradeTemplate('${currentClassKey}')" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2 rounded shadow font-semibold flex items-center">
                            <i class="fa-solid fa-file-arrow-down mr-1.5"></i> Unduh Template Impor
                        </button>
                        <button onclick="triggerGradeImport('${currentClassKey}')" ${!canManageAssessment ? 'disabled' : ''} class="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white text-xs px-3 py-2 rounded shadow font-semibold flex items-center">
                            <i class="fa-solid fa-file-import mr-1.5"></i> Impor Nilai
                        </button>
                        <button onclick="exportGradesToPdf('${currentClassKey}')" class="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2 rounded shadow font-semibold flex items-center">
                            <i class="fa-solid fa-file-pdf mr-1.5"></i> Ekspor PDF
                        </button>
                    </div>
                </div>

                <!-- Class Switcher -->
                <div class="mb-4 flex flex-wrap justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div class="flex items-center space-x-2">
                        <label class="text-sm font-bold text-blue-900">Pilih Kelas Perkuliahan:</label>
                        <select onchange="state.selectedClassKey = this.value; saveState(); renderApp();" class="border font-medium rounded px-3 py-1.5 text-sm bg-white shadow-sm">
                            ${classKeys.map(k => {
                                const c = state.classData[k];
                                const m = state.mkList.find(x => x.id === c.mkId) || { code: 'N/A', name: 'Mata Kuliah Tidak Dikenal' };
                                return `<option value="${k}" ${k === currentClassKey ? 'selected' : ''}>[${m.code}] ${m.name} - Smt ${c.semester} - Kelas ${c.kelas}</option>`;
                            }).join('')}
                        </select>
                    </div>
                    <div class="text-xs text-blue-800"><span class="font-bold">Mata Kuliah:</span> ${mk.name} (${mk.code})</div>
                </div>`;
            
            if (!isRpsFinalized) {
                html += `<div class="p-3 mb-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200 text-sm shadow-sm">
                    <i class="fa-solid fa-triangle-exclamation mr-1.5"></i>
                    <strong>Penilaian terkunci:</strong> RPS kelas ini belum difinalisasi secara keseluruhan.
                    Selesaikan seluruh bagian RPS lalu gunakan tombol <strong>Finalisasi RPS</strong> sebelum mengelola nilai.
                </div>`;
            }

            if (students.length === 0) {
                html += `<div class="p-4 bg-gray-50 text-gray-600 rounded border border-gray-200 text-xs">Belum ada mahasiswa di kelas ini. Klik "Edit Mahasiswa" pada Setup Perkuliahan untuk menambah mahasiswa.</div>`;
            } else if (komps.length === 0) {
                html += `<div class="p-4 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 text-xs">Belum ada Komponen Penilaian. Buat komponen penilaian pada RPS poin 4.</div>`;
            } else {
                html += `
                    <div class="overflow-x-auto">
                        <table class="w-full text-xs text-left border border-gray-200 rounded-lg table-compact" style="min-width: 2000px;">
                            <thead class="bg-blue-900 text-white border-b">
                                <tr>
                                    <th class="p-2.5 w-12 text-center sticky left-0 bg-blue-900 z-20">No</th>
                                    <th class="p-2.5 w-28 sticky left-12 bg-blue-900 z-20">NIM</th>
                                    <th class="p-2.5 w-40 sticky left-40 bg-blue-900 z-20">Nama Mahasiswa</th>`;
                komps.forEach(k => { html += `<th class="p-2.5 text-center min-w-1028px">${k.name}<br><span class="font-normal opacity-70">(${k.jenis})</span></th>`; });
                html += `</tr></thead><tbody>`;

                students.forEach((s, sIdx) => {
                    html += `
                        <tr class="border-b hover:bg-gray-50/70">
                            <td class="p-2 text-center font-medium text-gray-500 sticky left-0 bg-white/70 backdrop-blur-sm">${sIdx + 1}</td>
                            <td class="p-2 font-mono font-bold text-blue-900 sticky left-12 bg-white/70 backdrop-blur-sm">${s.nim}</td>
                            <td class="p-2 font-medium sticky left-40 bg-white/70 backdrop-blur-sm">${s.name}</td>`;

                    komps.forEach(k => {
                        const score = (s.scores && s.scores[k.id]) !== undefined ? s.scores[k.id] : '';
                        html += `
                            <td class="p-1.5 text-center">
                                <input type="number" min="0" max="100" value="${score}" ${!canManageAssessment ? 'disabled' : ''} 
                                    onchange="updateStudentScore('${currentClassKey}', ${sIdx}, '${k.id}', this.value)" 
                                    class="w-20 border rounded px-1.5 py-1 text-center font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed">
                            </td>`;
                    });
                    html += `</tr>`;
                });
                html += `</tbody></table></div>`;
            }
            container.innerHTML = html;
        }

        function updateStudentScore(classKey, sIdx, kompId, val) {
            if (!canManageClassAssessment(classKey)) {
                alert('Nilai hanya dapat dikelola oleh dosen pengampu setelah RPS difinalisasi secara keseluruhan.');
                renderApp();
                return;
            }
            const num = parseFloat(val);
            if (!state.classData[classKey].students[sIdx].scores) state.classData[classKey].students[sIdx].scores = {};
            if (isNaN(num)) delete state.classData[classKey].students[sIdx].scores[kompId];
            else state.classData[classKey].students[sIdx].scores[kompId] = num;
            saveState();
        }

        function downloadGradeTemplate(classKey) {
            if (!classKey || !state.classData[classKey]) { alert("Kelas tidak valid."); return; }
            const cls = state.classData[classKey];
            const students = cls.students || [];
            const komps = getSortedKomponenList(cls.komponenList || [], getKomponenMatrixSortState());
            
            if (students.length === 0) { alert("Tidak ada mahasiswa di kelas ini untuk membuat template."); return; }
            if (komps.length === 0) { alert("Tidak ada komponen penilaian di kelas ini untuk membuat template."); return; }

            const templateData = students.map(s => {
                const row = {
                    'NIM': s.nim,
                    'Nama Mahasiswa': s.name
                };
                komps.forEach(k => {
                    const header = `${k.name} (${k.jenis})|${k.id}`; // Header: Name (Type)|id
                    const score = (s.scores && s.scores[k.id]) !== undefined ? s.scores[k.id] : '';
                    row[header] = score;
                });
                return row;
            });
            const ws = XLSX.utils.json_to_sheet(templateData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Template Nilai");
            XLSX.writeFile(wb, `Template_Impor_Nilai_${cls.kelas}.xlsx`);
        }

        function triggerGradeImport(classKey) {
            if (!canManageClassAssessment(classKey)) {
                alert('Impor nilai hanya tersedia setelah RPS difinalisasi secara keseluruhan.');
                return;
            }
            importTargetClassKey = classKey;
            document.getElementById('grade-import-input').click();
        }

        function importGradesFromExcel(e) {
            const file = e.target.files[0];
            if (!file) return;

            const classKey = importTargetClassKey;
            if (!classKey || !state.classData[classKey]) {
                alert("Kelas target impor tidak valid!");
                e.target.value = '';
                return;
            }
            if (!canManageClassAssessment(classKey)) {
                alert('Impor dibatalkan karena RPS belum difinalisasi atau Anda bukan dosen pengampu.');
                e.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(evt) {
                if (!canManageClassAssessment(classKey)) {
                    alert('Impor dibatalkan karena status akses atau finalisasi RPS telah berubah.');
                    e.target.value = '';
                    return;
                }
                try {
                    const data = new Uint8Array(evt.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet, {raw: false});

                    if (json.length === 0) { alert("File Excel kosong!"); return; }

                    const cls = state.classData[classKey];
                    const komps = cls.komponenList || [];
                    let updatedCount = 0;
                    
                    json.forEach(row => {
                        const nim = (row['NIM'] || '').toString().trim();
                        if (!nim) return;

                        const studentIndex = cls.students.findIndex(s => s.nim === nim);
                        if (studentIndex !== -1) {
                            if (!cls.students[studentIndex].scores) cls.students[studentIndex].scores = {};
                            
                            Object.keys(row).forEach(header => {
                                if (header.includes('|')) {
                                    const kompId = header.split('|')[1];
                                    if (komps.some(k => k.id === kompId)) {
                                        const score = parseFloat(row[header]);
                                        if (!isNaN(score) && score >= 0 && score <= 100) {
                                            cls.students[studentIndex].scores[kompId] = score;
                                        }
                                    }
                                }
                            });
                            updatedCount++;
                        }
                    });

                    saveState();
                    renderApp();
                    alert(`Berhasil memperbarui nilai untuk ${updatedCount} mahasiswa.`);

                } catch (err) { alert("Gagal membaca file Excel! Pastikan format sesuai template."); console.error(err); }
            };
            reader.readAsArrayBuffer(file);
            e.target.value = ''; // Reset file input
        }

        function exportGradesToPdf(classKey) {
            if (!classKey || !state.classData[classKey]) { alert("Kelas tidak valid."); return; }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const cls = state.classData[classKey];
            const mk = state.mkList.find(m => m.id === cls.mkId) || { name: 'N/A', code: 'N/A' };
            const komps = getSortedKomponenList(cls.komponenList || [], getKomponenMatrixSortState());
            const students = cls.students || [];

            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("Daftar Nilai Mahasiswa", 14, 22);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Mata Kuliah: ${mk.name} (${mk.code})`, 14, 30);
            doc.text(`Kelas: ${cls.kelas} | Semester: ${cls.semester}`, 14, 35);

            const head = [['No', 'NIM', 'Nama Mahasiswa', ...komps.map(k => `${k.name} (${k.jenis})`)]];
            const body = students.map((s, idx) => {
                const studentScores = komps.map(k => {
                    return (s.scores && s.scores[k.id] !== undefined) ? s.scores[k.id] : '-';
                });
                return [idx + 1, s.nim, s.name, ...studentScores];
            });

            doc.autoTable({
                startY: 40,
                head: head,
                body: body,
                theme: 'grid',
                headStyles: { fillColor: [22, 78, 99] }, // bg-blue-900
                styles: { fontSize: 8 },
            });

            doc.save(`Nilai_${mk.code}_${cls.kelas}.pdf`);
        }

        // -------------------------------------------------------------
