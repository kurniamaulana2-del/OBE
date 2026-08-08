// MODUL PERKULIAHAN
// -------------------------------------------------------------

        // -------------------------------------------------------------
        // SUB MODUL SETUP PERKULIAHAN
        // -------------------------------------------------------------

                function renderLecturerPicker(pickerId, inputName, pjmkInputName, lecturers, selectedIds = [], selectedPjmkId = '') {
                    const selected = new Set(selectedIds);
                    const faculties = new Map();
                    lecturers.forEach(lecturer => {
                        const facultyKey = lecturer.facultyId || 'unknown-faculty';
                        const programKey = lecturer.prodiId || 'unknown-program';
                        if (!faculties.has(facultyKey)) {
                            faculties.set(facultyKey, { name: lecturer.facultyName || 'Fakultas tidak diketahui', programs: new Map() });
                        }
                        const faculty = faculties.get(facultyKey);
                        if (!faculty.programs.has(programKey)) {
                            faculty.programs.set(programKey, { name: lecturer.prodiName || 'Program Studi tidak diketahui', lecturers: [] });
                        }
                        faculty.programs.get(programKey).lecturers.push(lecturer);
                    });

                    const groups = Array.from(faculties.values()).map(faculty => `
                        <details open data-lecturer-faculty class="border-b last:border-b-0">
                            <summary class="cursor-pointer bg-blue-50 px-3 py-2 text-xs font-bold text-blue-950">${escapeHtml(faculty.name)}</summary>
                            <div class="p-2">${Array.from(faculty.programs.values()).map(program => `
                                <details open data-lecturer-program class="mb-2 rounded border last:mb-0">
                                    <summary class="cursor-pointer bg-gray-100 px-2 py-1.5 text-[11px] font-semibold text-gray-700">${escapeHtml(program.name)}</summary>
                                    <div class="space-y-1 p-1">${program.lecturers.map(lecturer => `
                                        <div data-lecturer-row class="flex items-start gap-2 rounded p-1.5 text-[11px] hover:bg-blue-50">
                                            <label class="flex min-w-0 flex-1 cursor-pointer items-start gap-2">
                                                <input type="checkbox" data-lecturer-select name="${inputName}" value="${lecturer.id}" ${selected.has(lecturer.id) ? 'checked' : ''} onchange="updateLecturerSelection('${pickerId}', '${lecturer.id}', this.checked)" class="mt-0.5 h-3.5 w-3.5">
                                                <span class="min-w-0 flex-1"><strong>${escapeHtml(lecturer.name)}</strong><br><span class="text-gray-400">${escapeHtml(ROLE_LABELS[lecturer.role])} · NUPTK ${escapeHtml(lecturer.nuptk || '-')}</span></span>
                                            </label>
                                            <label class="ml-2 flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800" title="Tetapkan sebagai satu-satunya Dosen PJMK">
                                                <input type="checkbox" data-pjmk-select name="${pjmkInputName}" value="${lecturer.id}" ${selectedPjmkId === lecturer.id ? 'checked' : ''} onchange="selectSinglePjmk('${pickerId}', '${lecturer.id}', this.checked)" class="h-3.5 w-3.5"> PJMK
                                            </label>
                                            <span class="hidden">${escapeHtml(faculty.name)} ${escapeHtml(program.name)}</span>
                                        </div>`).join('')}</div>
                                </details>`).join('')}</div>
                        </details>`).join('');

                    return `<details id="${pickerId}" class="relative rounded border bg-white">
                        <summary class="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-gray-700">
                            <i class="fa-solid fa-magnifying-glass mr-1 text-blue-700"></i>Pilih Dosen
                            <span data-lecturer-count class="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-800">${selected.size} dipilih</span>
                            <i class="fa-solid fa-chevron-down float-right mt-0.5"></i>
                        </summary>
                        <div class="absolute z-40 mt-1 w-[min(32rem,90vw)] rounded-lg border bg-white p-2 shadow-xl">
                            <input type="search" oninput="filterLecturerPicker('${pickerId}', this.value)" onclick="event.stopPropagation()" placeholder="Cari nama, NUPTK, fakultas, atau prodi..." class="mb-2 w-full rounded border px-3 py-2 text-xs">
                            <div data-lecturer-results class="max-h-72 overflow-y-auto">${groups || '<p class="p-3 text-xs text-red-600">Belum ada akun dosen aktif.</p>'}</div>
                        </div>
                    </details>`;
                }

                function filterLecturerPicker(pickerId, value) {
                    const picker = document.getElementById(pickerId);
                    if (!picker) return;
                    const query = value.trim().toLowerCase();
                    picker.querySelectorAll('[data-lecturer-row]').forEach(row => {
                        row.classList.toggle('hidden', query && !row.textContent.toLowerCase().includes(query));
                    });
                    picker.querySelectorAll('[data-lecturer-program]').forEach(group => {
                        const visible = Array.from(group.querySelectorAll('[data-lecturer-row]')).some(row => !row.classList.contains('hidden'));
                        group.classList.toggle('hidden', !visible);
                        if (query && visible) group.open = true;
                    });
                    picker.querySelectorAll('[data-lecturer-faculty]').forEach(group => {
                        const visible = Array.from(group.querySelectorAll('[data-lecturer-program]')).some(program => !program.classList.contains('hidden'));
                        group.classList.toggle('hidden', !visible);
                        if (query && visible) group.open = true;
                    });
                }

                function updateLecturerPickerCount(pickerId) {
                    const picker = document.getElementById(pickerId);
                    if (!picker) return;
                    const count = picker.querySelectorAll('[data-lecturer-select]:checked').length;
                    picker.querySelector('[data-lecturer-count]').textContent = `${count} dipilih`;
                }

                function updateLecturerSelection(pickerId, lecturerId, checked) {
                    const picker = document.getElementById(pickerId);
                    if (!picker) return;
                    if (!checked) {
                        const pjmk = Array.from(picker.querySelectorAll('[data-pjmk-select]')).find(input => input.value === lecturerId);
                        if (pjmk) pjmk.checked = false;
                    }
                    updateLecturerPickerCount(pickerId);
                }

                function selectSinglePjmk(pickerId, lecturerId, checked) {
                    const picker = document.getElementById(pickerId);
                    if (!picker) return;
                    picker.querySelectorAll('[data-pjmk-select]').forEach(input => {
                        input.checked = checked && input.value === lecturerId;
                    });
                    if (checked) {
                        const lecturer = Array.from(picker.querySelectorAll('[data-lecturer-select]')).find(input => input.value === lecturerId);
                        if (lecturer) lecturer.checked = true;
                    }
                    updateLecturerPickerCount(pickerId);
                }

                function renderSetupPerkuliahan(container) {
            const finalizedMKs = state.mkList.filter(mk => state.cpmkFinalized && state.cpmkFinalized[mk.id]);
            const lecturers = getLecturerAccounts();
            const academicYears = state.masterData.academicYears.filter(year => year.active);
            let html = `
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-800"><i class="fa-solid fa-school mr-2 text-blue-800"></i>Setup Kelas Perkuliahan</h3>
                </div>

                <!-- Form Tambah Kelas Baru -->
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                    <h4 class="font-bold text-sm text-gray-700 mb-3"><i class="fa-solid fa-plus-circle mr-1 text-blue-700"></i>Tambah Kelas Perkuliahan Baru</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 items-end">
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 mb-1">Semester:</label>
                            <select id="new-class-semester" class="w-full border rounded px-3 py-1.5 text-sm bg-white">
                                <option value="1">Semester 1</option>
                                <option value="2">Semester 2</option>
                                <option value="3">Semester 3</option>
                                <option value="4">Semester 4</option>
                                <option value="5">Semester 5</option>
                                <option value="6">Semester 6</option>
                                <option value="7">Semester 7</option>
                                <option value="8">Semester 8</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 mb-1">Mata Kuliah (Hanya MK yang sudah final CPMK):</label>
                            <select id="new-class-mk" class="w-full border rounded px-3 py-1.5 text-sm bg-white">
                                ${finalizedMKs.length > 0 ? finalizedMKs.map(mk => `<option value="${mk.id}">[${mk.code}] ${mk.name}</option>`).join('') : '<option value="" disabled>Tidak ada MK yang siap</option>'}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 mb-1">Tahun Akademik:</label>
                            <select id="new-class-academic-year" class="w-full border rounded px-3 py-1.5 text-sm bg-white">
                                ${academicYears.map(year => `<option value="${year.id}">${escapeHtml(year.code)} - ${escapeHtml(year.term)}</option>`).join('') || '<option value="">Belum ada Tahun Akademik</option>'}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 mb-1">Nama Kelas (Periode):</label>
                            <input type="text" id="new-class-name" placeholder=" A25" class="w-full border rounded px-3 py-1.5 text-sm bg-white">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 mb-1">Dosen Pengampu:</label>
                            ${renderLecturerPicker('new-class-lecturers', 'new-class-lecturer', 'new-class-pjmk', lecturers)}
                        </div>
                        <div>
                            <button onclick="createNewClass()" class="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm px-4 py-1.5 rounded shadow">
                                <i class="fa-solid fa-plus mr-1"></i> Buat Kelas
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Tabel Daftar Kelas Perkuliahan -->
                <h4 class="font-bold text-sm text-gray-700 mb-2">Daftar Kelas Perkuliahan Terdaftar</h4>
                <div class="overflow-x-auto">
                    <table class="w-full text-xs text-left border border-gray-200 rounded-lg">
                        <thead class="bg-blue-900 text-white border-b">
                            <tr>
                                <th class="p-2.5 w-16 text-center">Smt</th>
                                <th class="p-2.5 w-28">Kode MK</th>
                                <th class="p-2.5">Nama Mata Kuliah</th>
                                <th class="p-2.5 min-w-[130px]">Tahun Akademik</th>
                                <th class="p-2.5 w-20 text-center">Kelas</th>
                                <th class="p-2.5 min-w-[240px]">Dosen Pengampu</th>
                                <th class="p-2.5 w-28 text-center">Jml Mahasiswa</th>
                                <th class="p-2.5 w-28 text-center">Status Kunci</th>
                                <th class="p-2.5 w-64 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>`;

            const classKeys = Object.keys(state.classData);

            if (classKeys.length === 0) {
                html += `<tr><td colspan="9" class="p-4 text-center text-gray-500">Belum ada kelas perkuliahan. Silakan buat kelas di atas.</td></tr>`;
            } else {
                classKeys.forEach(key => {
                    const cls = state.classData[key];
                    const mk = state.mkList.find(m => m.id === cls.mkId) || { code: 'N/A', name: 'Mata Kuliah' };
                    const academicYear = academicYears.find(year => year.id === cls.academicYearId);
                    const studentCount = cls.students ? cls.students.length : 0;
                    const isLocked = !!cls.locked;

                    html += `
                        <tr class="border-b hover:bg-gray-50">
                            <td class="p-2.5 text-center font-medium">${cls.semester}</td>
                            <td class="p-2.5 font-bold text-blue-900">${mk.code}</td>
                            <td class="p-2.5 font-medium">${mk.name}</td>
                            <td class="p-2.5">${academicYear ? `${escapeHtml(academicYear.code)} - ${escapeHtml(academicYear.term)}` : '-'}</td>
                            <td class="p-2.5 text-center font-bold bg-blue-50 text-blue-900">${cls.kelas}</td>
                            <td class="p-2.5">
                                <div class="rounded border p-2 ${isLocked ? 'bg-gray-100' : 'bg-white'}">
                                    <div class="mb-2 text-[11px]">${lecturers.filter(lecturer => (cls.lecturerIds || []).includes(lecturer.id)).map(lecturer => `${escapeHtml(lecturer.name)}${cls.pjmkLecturerId === lecturer.id ? ' <span class="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold text-amber-800">PJMK</span>' : ''}`).join('<br>') || '<span class="text-red-600">Belum ada dosen.</span>'}</div>
                                    <button onclick="openClassLecturerModal('${key}')" ${isLocked ? 'disabled title="Buka kunci kelas untuk mengubah dosen pengampu."' : ''}
                                        class="rounded px-2 py-1 text-[11px] font-semibold ${isLocked ? 'cursor-not-allowed bg-gray-300 text-gray-500' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}">
                                        <i class="fa-solid fa-user-plus mr-1"></i>Tambah / Hapus Dosen
                                    </button>
                                </div>
                            </td>
                            <td class="p-2.5 text-center font-semibold">${studentCount} Mhs</td>
                            <td class="p-2.5 text-center">
                                ${isLocked ? 
                                    `<span class="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded text-[11px] inline-flex items-center"><i class="fa-solid fa-lock mr-1"></i> Dikunci</span>` : 
                                    `<span class="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px] inline-flex items-center"><i class="fa-solid fa-lock-open mr-1"></i> Terbuka</span>`
                                }
                            </td>
                            <td class="p-2.5 text-center">
                                <div class="flex items-center justify-center space-x-1.5">
                                    <!-- Tombol RPS -->
                                    <button onclick="openRPSFromClass('${key}')" 
                                        class="px-2.5 py-1 text-[11px] font-semibold rounded shadow transition flex items-center bg-indigo-600 hover:bg-indigo-700 text-white">
                                        <i class="fa-solid fa-file-lines mr-1"></i> RPS
                                    </button>

                                    <!-- Tombol Edit Mahasiswa -->
                                    <button onclick="openStudentModal('${key}')" ${isLocked ? 'disabled title="Kelas dikunci! Tidak bisa diedit."' : ''} 
                                        class="px-2.5 py-1 text-[11px] font-semibold rounded shadow transition flex items-center ${isLocked ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}">
                                        <i class="fa-solid fa-users-gear mr-1"></i> Edit Mahasiswa
                                    </button>

                                    <!-- Tombol Kunci / Buka Kunci -->
                                    <button onclick="toggleLockClass('${key}')" 
                                        class="px-2.5 py-1 text-[11px] font-semibold rounded shadow transition flex items-center ${isLocked ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}">
                                        <i class="fa-solid ${isLocked ? 'fa-lock-open' : 'fa-lock'} mr-1"></i> ${isLocked ? 'Buka Kunci' : 'Kunci'}
                                    </button>

                                    <!-- Tombol Hapus -->
                                    <button onclick="deleteClass('${key}')" ${isLocked ? 'disabled title="Kelas dikunci! Tidak bisa dihapus."' : ''} 
                                        class="px-2.5 py-1 text-[11px] font-semibold rounded shadow transition flex items-center ${isLocked ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}">
                                        <i class="fa-solid fa-trash mr-1"></i> Hapus
                                    </button>
                                </div>
                            </td>
                        </tr>`;
                });
            }

            html += `</tbody></table></div>`;
            container.innerHTML = html;
        }

