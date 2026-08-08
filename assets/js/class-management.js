        function createNewClass() {
            const smt = document.getElementById('new-class-semester').value;
            const mkId = document.getElementById('new-class-mk').value;
            const academicYearId = document.getElementById('new-class-academic-year').value;
            const classInput = document.getElementById('new-class-name').value.trim();
            const lecturerIds = Array.from(document.querySelectorAll('input[name="new-class-lecturer"]:checked'))
                .map(input => input.value);
            const pjmkInput = document.querySelector('input[name="new-class-pjmk"]:checked');
            const pjmkLecturerId = pjmkInput ? pjmkInput.value : '';

            if (!mkId) { alert("Pilih Mata Kuliah!"); return; }
            if (!academicYearId) { alert("Pilih Tahun Akademik!"); return; }
            if (!classInput) { alert("Isi Nama Kelas!"); return; }
            if (lecturerIds.length === 0) { alert("Pilih minimal satu Dosen Pengampu!"); return; }
            if (!pjmkLecturerId || !lecturerIds.includes(pjmkLecturerId)) { alert("Tetapkan tepat satu Dosen PJMK!"); return; }

            const key = `${smt}_${mkId}_${classInput.toUpperCase()}`;

            if (state.classData[key]) {
                alert("Kelas tersebut sudah dibuat sebelumnya!");
                return;
            }

            state.classData[key] = {
                semester: smt,
                mkId: mkId,
                kelas: classInput.toUpperCase(),
                prodiId: currentUser.prodiId || (state.masterData.studyPrograms[0] && state.masterData.studyPrograms[0].id) || '',
                academicYearId: academicYearId,
                lecturerIds: lecturerIds,
                pjmkLecturerId: pjmkLecturerId,
                locked: false,
                subCpmkList: [
                    { id: 'SUB1', code: 'SubCPMK 1', desc: 'Deskripsi SubCPMK', weights: {} },
                    { id: 'SUB2', code: 'SubCPMK 2', desc: 'Deskripsi SubCPMK', weights: {} }
                ],
                subCpmkFinalized: false,
                komponenList: [
                    { id: 'KOMP1', jenis: 'Tugas', name: '', weights: {} },
                    { id: 'KOMP2', jenis: 'Kuis', name: '', weights: {} }
                ],
                komponenFinalized: false,
                students: []
            };

            if (!state.selectedClassKey) state.selectedClassKey = key;
            saveState();
            renderApp();
            alert("Kelas berhasil ditambahkan!");
        }

        function syncClassLecturersToRps(classKey) {
            const cls = state.classData[classKey];
            if (!cls) return;
            const lecturerNames = getLecturerAccounts()
                .filter(account => (cls.lecturerIds || []).includes(account.id))
                .map(account => account.name)
                .join('; ');
            if (cls.rps && cls.rps.identitas) cls.rps.identitas.dosenPengampu = lecturerNames;
        }

        function openClassLecturerModal(classKey) {
            const cls = state.classData[classKey];
            if (!cls || !isCurriculumManager()) return;
            if (cls.locked) return alert('Kelas sedang dikunci. Buka kunci kelas untuk mengubah dosen pengampu.');
            const lecturers = getLecturerAccounts();
            document.getElementById('app-modal-root').innerHTML = `
                <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <form onsubmit="saveClassLecturers(event, '${classKey}')" class="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl">
                        <div class="mb-4 flex items-center justify-between">
                            <div><h3 class="font-bold text-gray-900">Dosen Pengampu</h3><p class="text-xs text-gray-500">Kelas ${escapeHtml(cls.kelas || classKey)}</p></div>
                            <button type="button" onclick="document.getElementById('app-modal-root').innerHTML=''" class="text-gray-500"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        ${renderLecturerPicker('edit-class-lecturers', 'class-lecturer', 'class-pjmk', lecturers, cls.lecturerIds || [], cls.pjmkLecturerId)}
                        <div class="mt-4 flex justify-end gap-2">
                            <button type="button" onclick="document.getElementById('app-modal-root').innerHTML=''" class="rounded border px-3 py-2 text-xs font-semibold">Batal</button>
                            <button type="submit" class="rounded bg-blue-700 px-3 py-2 text-xs font-bold text-white">Simpan Dosen</button>
                        </div>
                    </form>
                </div>`;
        }

        function saveClassLecturers(event, classKey) {
            event.preventDefault();
            const cls = state.classData[classKey];
            if (!cls || cls.locked || !isCurriculumManager()) return;
            const lecturerIds = Array.from(event.currentTarget.querySelectorAll('input[name="class-lecturer"]:checked')).map(input => input.value);
            const pjmkInput = event.currentTarget.querySelector('input[name="class-pjmk"]:checked');
            const pjmkLecturerId = pjmkInput ? pjmkInput.value : '';
            if (lecturerIds.length === 0) return alert('Pilih minimal satu dosen pengampu.');
            if (!pjmkLecturerId || !lecturerIds.includes(pjmkLecturerId)) return alert('Tetapkan tepat satu Dosen PJMK.');
            cls.lecturerIds = lecturerIds;
            cls.pjmkLecturerId = pjmkLecturerId;
            syncClassLecturersToRps(classKey);
            document.getElementById('app-modal-root').innerHTML = '';
            saveState();
            renderApp();
        }

        function toggleClassLecturer(classKey, lecturerId, isAssigned) {
            const cls = state.classData[classKey];
            if (!cls || !isCurriculumManager()) {
                alert('Hanya Kaprodi atau GKM yang dapat mengubah plotting dosen pengampu.');
                renderApp();
                return;
            }
            if (cls.locked) {
                alert('Kelas sedang dikunci. Buka kunci kelas sebelum mengubah dosen pengampu.');
                renderApp();
                return;
            }
            if (!Array.isArray(cls.lecturerIds)) cls.lecturerIds = [];
            if (isAssigned && !cls.lecturerIds.includes(lecturerId)) cls.lecturerIds.push(lecturerId);
            if (!isAssigned) cls.lecturerIds = cls.lecturerIds.filter(id => id !== lecturerId);
            syncClassLecturersToRps(classKey);
            saveState();
            renderApp();
        }

        function updateClassLecturers(classKey, select) {
            const cls = state.classData[classKey];
            if (!cls) return;
            cls.lecturerIds = Array.from(select.selectedOptions).map(option => option.value);
            syncClassLecturersToRps(classKey);
            saveState();
            renderApp();
        }

        function toggleLockClass(key) {
            if (!state.classData[key]) return;
            state.classData[key].locked = !state.classData[key].locked;
            saveState();
            renderApp();
        }

        function deleteClass(key) {
            if (!state.classData[key]) return;
            if (state.classData[key].locked) {
                alert("Kelas sedang dikunci dan tidak dapat dihapus!");
                return;
            }
            if (confirm("Apakah Anda yakin ingin menghapus kelas perkuliahan ini beserta seluruh data di dalamnya?")) {
                delete state.classData[key];
                if (state.selectedClassKey === key) {
                    const keys = Object.keys(state.classData);
                    state.selectedClassKey = keys.length > 0 ? keys[0] : '';
                }
                saveState();
                renderApp();
            }
        }

        function openStudentModal(classKey) {
            if (!state.classData[classKey]) return;
            if (state.classData[classKey].locked) {
                alert("Kelas sedang dikunci! Buka kunci kelas terlebih dahulu jika ingin mengedit mahasiswa.");
                return;
            }
            activeModalClassKey = classKey;
            // Use a deep copy for temporary editing to avoid modifying the original state until save
            state.tempStudentList = JSON.parse(JSON.stringify(state.classData[classKey].students || []));
            renderStudentModal(classKey);
        }

        function renderStudentModal(classKey) {
            const cls = state.classData[classKey];
            if (!cls) return;

            const tempStudents = state.tempStudentList || [];
            const mk = state.mkList.find(m => m.id === cls.mkId) || { code: 'N/A', name: 'Mata Kuliah' };
            const modalRoot = document.getElementById('app-modal-root');

            let html = `
                <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                        <!-- Modal Header -->
                        <div class="bg-blue-900 text-white p-4 flex justify-between items-center">
                            <div>
                                <h3 class="font-bold text-base flex items-center">
                                    <i class="fa-solid fa-users-gear mr-2 text-yellow-400"></i> Kelola Mahasiswa Kelas: ${mk.name} (${cls.kelas})
                                </h3>
                                <p class="text-xs text-blue-200">Semester ${cls.semester} | Kode MK: ${mk.code}</p>
                            </div>
                            <button onclick="closeStudentModal()" class="text-white hover:text-red-300 text-xl font-bold p-1">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <!-- Modal Body -->
                        <div class="p-5 flex-1 overflow-y-auto space-y-4">
                            <!-- Action Toolbar -->
                            <div class="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-3 rounded-lg border">
                                <div class="flex flex-wrap gap-2">
                                    <button onclick="downloadStudentTemplate()" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2 rounded shadow font-semibold flex items-center">
                                        <i class="fa-solid fa-file-arrow-down mr-1.5"></i> Unduh Template Impor
                                    </button>
                                    <button onclick="triggerStudentImport('${classKey}')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-2 rounded shadow font-semibold flex items-center">
                                        <i class="fa-solid fa-file-import mr-1.5"></i> Impor Mahasiswa (Excel)
                                    </button>
                                    <button onclick="resetClassStudents()" class="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2 rounded shadow font-semibold flex items-center">
                                        <i class="fa-solid fa-rotate-left mr-1.5"></i> Reset (Hapus Semua Mahasiswa)
                                    </button>
                                </div>
                            </div>

                            <!-- Form Tambah Mahasiswa Manual -->
                            <div class="bg-blue-50/60 p-3.5 rounded-lg border border-blue-100">
                                <h4 class="font-bold text-xs text-blue-900 mb-2 flex items-center"><i class="fa-solid fa-user-plus mr-1"></i> Tambah Mahasiswa Manual</h4>
                                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <input type="text" id="add-student-nim" placeholder="NIM (misal: 25123003)" class="border rounded px-3 py-1.5 text-xs bg-white">
                                    <input type="text" id="add-student-name" placeholder="Nama Lengkap Mahasiswa" class="border rounded px-3 py-1.5 text-xs bg-white">
                                    <button onclick="addSingleStudent()" class="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-1.5 rounded shadow"><i class="fa-solid fa-plus mr-1"></i> Tambah</button>
                                </div>
                            </div>

                            <!-- Tabel Daftar Mahasiswa -->
                            <div>
                                <h4 class="font-bold text-xs text-gray-700 mb-2">Daftar Mahasiswa Terdaftar (${tempStudents.length})</h4>
                                <div class="overflow-x-auto max-h-[300px]">
                                    <table class="w-full text-xs text-left border border-gray-200 rounded-lg">
                                        <thead class="bg-gray-100 border-b text-gray-700 sticky top-0">
                                            <tr>
                                                <th class="p-2 w-12 text-center">No</th>
                                                <th class="p-2 w-36">NIM</th>
                                                <th class="p-2">Nama Mahasiswa</th>
                                                <th class="p-2 w-16 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>`;
            if (tempStudents.length === 0) {
                html += `<tr><td colspan="4" class="p-4 text-center text-gray-500">Belum ada mahasiswa.</td></tr>`;
            } else {
                tempStudents.forEach((s, sIdx) => {
                    html += `
                        <tr class="border-b hover:bg-gray-50">
                            <td class="p-2 text-center text-gray-500 font-medium">${sIdx + 1}</td>
                            <td class="p-2 font-mono font-semibold text-blue-900">${s.nim}</td>
                            <td class="p-2 font-medium">${s.name}</td>
                            <td class="p-2 text-center">
                                <button onclick="deleteSingleStudent(${sIdx})" class="text-red-600 hover:text-red-800" title="Hapus Mahasiswa"><i class="fa-solid fa-trash"></i></button>
                            </td>
                        </tr>`;
                });
            }
            html += `</tbody></table></div></div></div>
                        <!-- Modal Footer -->
                        <div class="bg-gray-100 px-5 py-3 flex justify-end space-x-2">
                            <button onclick="closeStudentModal()" class="bg-gray-500 hover:bg-gray-600 text-white text-xs px-4 py-2 rounded font-semibold shadow">Batal</button>
                            <button onclick="saveStudentChanges()" class="bg-blue-700 hover:bg-blue-800 text-white text-xs px-4 py-2 rounded font-semibold shadow">Simpan Perubahan</button>
                        </div>
                    </div>
                </div>`;
            modalRoot.innerHTML = html;
        }

        function closeStudentModal() {
            const originalStudents = state.classData[activeModalClassKey].students || [];
            const tempStudents = state.tempStudentList || [];
            const hasChanges = JSON.stringify(originalStudents) !== JSON.stringify(tempStudents);

            if (hasChanges) {
                if (!confirm("Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin menutup dan membatalkan perubahan?")) {
                    return;
                }
            }
            document.getElementById('app-modal-root').innerHTML = '';
            activeModalClassKey = '';
            state.tempStudentList = [];
            renderApp();
        }
        
        function saveStudentChanges() {
            if (!activeModalClassKey) return;
            // Before saving, we need to preserve the scores and attendance from the original students
            const originalStudents = state.classData[activeModalClassKey].students || [];
            const newStudentList = state.tempStudentList || [];

            newStudentList.forEach(newStudent => {
                const originalStudent = originalStudents.find(os => os.nim === newStudent.nim);
                if (originalStudent) {
                    newStudent.scores = originalStudent.scores; // Preserve scores
                    // Note: attendance is now stored on cls.attendance, not the student object, so it's safe.
                } else {
                    // It's a brand new student, ensure scores object exists
                    newStudent.scores = {};
                }
            });

            // Also handle data for students that were deleted
            const originalAttendance = state.classData[activeModalClassKey].attendance || {};
            const newAttendance = {};
            newStudentList.forEach(s => {
                if (originalAttendance[s.nim]) {
                    newAttendance[s.nim] = originalAttendance[s.nim];
                }
            });
            state.classData[activeModalClassKey].attendance = newAttendance;

            state.classData[activeModalClassKey].students = newStudentList;
            saveState();
            alert('Perubahan daftar mahasiswa berhasil disimpan!');
            closeStudentModal(); // This will now close without prompt as data is saved
        }

        function addSingleStudent() {
            const nimInput = document.getElementById('add-student-nim').value.trim();
            const nameInput = document.getElementById('add-student-name').value.trim();

            if (!nimInput || !nameInput) { alert("Mohon isi NIM dan Nama Mahasiswa!"); return; }
            if (!state.tempStudentList) state.tempStudentList = [];

            const exists = state.tempStudentList.some(s => s.nim === nimInput);
            if (exists) { alert(`Mahasiswa dengan NIM ${nimInput} sudah ada dalam daftar!`); return; }

            state.tempStudentList.push({ nim: nimInput, name: nameInput, scores: {} });
            renderStudentModal(activeModalClassKey); // Re-render modal with temp data
        }

        function deleteSingleStudent(tempIndex) {
            state.tempStudentList.splice(tempIndex, 1);
            renderStudentModal(activeModalClassKey); // Re-render modal with temp data
        }

        function resetClassStudents() {
            if (confirm("Apakah Anda yakin ingin menghapus SELURUH daftar mahasiswa di kelas ini? Perubahan ini akan disimpan setelah Anda klik 'Simpan Perubahan'.")) {
                state.tempStudentList = [];
                renderStudentModal(activeModalClassKey); // Re-render modal with temp data
            }
        }

        function downloadStudentTemplate() {
            const templateData = [
                { 'NIM': '25123001', 'Nama Mahasiswa': 'Supangat' },
                { 'NIM': '25123002', 'Nama Mahasiswa': 'Alief Riandi' },
                { 'NIM': '25123003', 'Nama Mahasiswa': 'Siti Rahma' }
            ];
            const ws = XLSX.utils.json_to_sheet(templateData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Template_Mahasiswa");
            XLSX.writeFile(wb, "Template_Impor_Mahasiswa.xlsx");
        }

        function triggerStudentImport(classKey) {
            if (state.classData[classKey]?.locked) { alert("Kelas dikunci!"); return; }
            importTargetClassKey = classKey;
            document.getElementById('student-import-input').click();
        }

        function importStudentsFromExcel(e) {
            const file = e.target.files[0];
            if (!file) return;

            const classKey = importTargetClassKey || activeModalClassKey || state.selectedClassKey;
            if (!classKey || !state.classData[classKey]) {
                alert("Pilih kelas terlebih dahulu!");
                e.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const data = new Uint8Array(evt.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet);

                    if (json.length === 0) { alert("File Excel kosong!"); return; }

                    const isModalActive = activeModalClassKey === classKey;
                    if (isModalActive) {
                        if (!state.tempStudentList) state.tempStudentList = [];
                    } else if (!state.classData[classKey].students) {
                        state.classData[classKey].students = [];
                    }

                    const targetList = isModalActive ? state.tempStudentList : state.classData[classKey].students;
                    const existingNims = new Set(targetList.map(s => s.nim));

                    let countAdded = 0;
                    json.forEach(row => {
                        const nim = (row['NIM'] || row['nim'] || '').toString().trim();
                        const name = (row['Nama Mahasiswa'] || row['Nama'] || row['nama'] || '').toString().trim();

                        if (nim && name && !existingNims.has(nim)) {
                            targetList.push({ nim: nim, name: name, scores: {} });
                            existingNims.add(nim);
                            countAdded++;
                        }
                    });

                    saveState();
                    if (isModalActive) renderStudentModal(classKey);
                    else renderApp();
                    alert(`Berhasil mengimpor ${countAdded} mahasiswa baru!`);
                } catch (err) { alert("Gagal membaca file Excel!"); }
            };
            reader.readAsArrayBuffer(file);
            e.target.value = '';
        }

        // -------------------------------------------------------------
