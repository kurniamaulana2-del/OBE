        // SUB MODUL PRESENSI
        // -------------------------------------------------------------

        function exportAttendanceToPdf(classKey) {
            if (!classKey || !state.classData[classKey]) { alert("Kelas tidak valid."); return; }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l', 'mm', 'a4'); // Landscape mode

            const cls = state.classData[classKey];
            const mk = state.mkList.find(m => m.id === cls.mkId) || { name: 'N/A', code: 'N/A' };
            const students = cls.students || [];

            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("Laporan Presensi Kehadiran Mahasiswa", 14, 22);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Mata Kuliah: ${mk.name} (${mk.code})`, 14, 30);
            doc.text(`Kelas: ${cls.kelas} | Semester: ${cls.semester}`, 14, 35);

            const headCols = ['No', 'NIM', 'Nama Mahasiswa'];
            for (let i = 1; i <= 16; i++) headCols.push(`P${i}`);
            headCols.push('Hadir');
            headCols.push('%');

            const body = students.map((s, idx) => {
                const row = [idx + 1, s.nim, s.name];
                let hadirCount = 0;
                for (let i = 1; i <= 16; i++) {
                    const status = (cls.attendance && cls.attendance[s.nim] && cls.attendance[s.nim][i]) || 'hadir';
                    if (status === 'hadir') hadirCount++;
                    row.push(status.charAt(0).toUpperCase()); // 'H', 'I', 'T'
                }
                const pct = Math.round((hadirCount / 16) * 100);
                row.push(`${hadirCount}/16`);
                row.push(`${pct}%`);
                return row;
            });

            doc.autoTable({
                startY: 40,
                head: [headCols],
                body: body,
                theme: 'grid',
                headStyles: { fillColor: [22, 78, 99] }, // bg-blue-900
                styles: { fontSize: 7, cellPadding: 1.5 },
                columnStyles: {
                    0: { cellWidth: 8 }, 
                    1: { cellWidth: 20 },
                    2: { cellWidth: 40 },
                }
            });

            doc.save(`Presensi_${mk.code}_${cls.kelas}.pdf`);
        }

        function toggleAttendanceLock(classKey, meetingNumber) {
            if (!state.classData[classKey].attendanceLocks) state.classData[classKey].attendanceLocks = {};
            state.classData[classKey].attendanceLocks[meetingNumber] = !state.classData[classKey].attendanceLocks[meetingNumber];
            saveState();
            renderApp();
        }

        function updateAttendance(classKey, nim, meetingNumber, status) {
            if (!state.classData[classKey].attendance) state.classData[classKey].attendance = {};
            if (!state.classData[classKey].attendance[nim]) state.classData[classKey].attendance[nim] = {};
            state.classData[classKey].attendance[nim][meetingNumber] = status;
            saveState();
            renderApp(); // Re-render to update percentages
        }

        function renderSetupPresensi(container) {
            const classKeys = getAccessibleClassKeys('presensi');
            if (classKeys.length === 0) {
                container.innerHTML = `<div class="p-4 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 text-sm">${getCurrentRole() === 'dosen' ? 'Belum ada kelas yang diplot kepada akun Anda.' : 'Belum ada kelas perkuliahan.'}</div>`;
                return;
            }

            if (!state.selectedClassKey || !classKeys.includes(state.selectedClassKey)) state.selectedClassKey = classKeys[0];
            const currentClassKey = state.selectedClassKey;
            const cls = state.classData[currentClassKey];
            const mk = state.mkList.find(m => m.id === cls.mkId) || { code: 'N/A', name: 'Mata Kuliah' };
            const students = cls.students || [];

            // Initialize attendance data structure if it doesn't exist
            if (!cls.attendance) cls.attendance = {};
            if (!cls.attendanceLocks) {
                cls.attendanceLocks = {};
                for (let i = 1; i <= 16; i++) cls.attendanceLocks[i] = false;
            }
            students.forEach(s => {
                if (!cls.attendance[s.nim]) {
                    cls.attendance[s.nim] = {};
                    for (let i = 1; i <= 16; i++) {
                        if (s.attendance && typeof s.attendance === 'number') {
                             cls.attendance[s.nim][i] = (i <= s.attendance) ? 'hadir' : 'tidak hadir';
                        } else {
                            cls.attendance[s.nim][i] = '';
                        }
                    }
                    delete s.attendance;
                }
            });

            let html = `
                <div class="flex flex-wrap justify-between items-center mb-4">
                    <div>
                        <h3 class="text-lg font-bold text-gray-800"><i class="fa-solid fa-clipboard-list mr-2 text-blue-800"></i>Presensi Kehadiran</h3>
                        <p class="text-xs text-gray-500">Kelola kehadiran mahasiswa untuk 16 pertemuan.</p>
                    </div>
                    <div class="flex items-center space-x-2">
                         <button onclick="exportAttendanceToPdf('${currentClassKey}')" class="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2 rounded shadow font-semibold flex items-center">
                            <i class="fa-solid fa-file-pdf mr-1.5"></i> Ekspor PDF
                        </button>
                    </div>
                </div>

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

            if (students.length === 0) {
                html += `<div class="p-4 bg-gray-50 text-gray-600 rounded border border-gray-200 text-xs">Belum ada mahasiswa di kelas ini.</div>`;
            } else {
                html += `
                    <div class="overflow-x-auto border border-gray-200 rounded-lg">
                        <table class="w-full text-xs text-left table-compact" style="min-width: 2000px;">
                            <thead class="bg-blue-900 text-white border-b sticky top-0 z-10">
                                <tr>
                                    <th class="p-2.5 w-12 text-center sticky left-0 bg-blue-900 z-20">No</th>
                                    <th class="p-2.5 w-28 sticky left-12 bg-blue-900 z-20">NIM</th>
                                    <th class="p-2.5 min-w-[150px] sticky left-40 bg-blue-900 z-20">Nama Mahasiswa</th>`;
                html += `
                    <th class="p-2.5 text-center w-24 bg-blue-900 z-20">Presentase Kehadiran</th>
                    <th class="p-2.5 text-center w-20 bg-blue-900 z-20">Jumlah Hadir</th>
                    <th class="p-2.5 text-center w-20 bg-blue-900 z-20">Jumlah Izin</th>
                    <th class="p-2.5 text-center w-24 bg-blue-900 z-20">Jumlah Sakit</th>
                    <th class="p-2.5 text-center w-28 bg-blue-900 z-20">Jumlah Tidak Hadir</th>`;
                for (let i = 1; i <= 16; i++) {
                    const isLocked = !!cls.attendanceLocks[i];
                    html += `<th class="p-2.5 text-center min-w-[120px]">
                                <div class="flex items-center justify-center space-x-2">
                                    <span>P ${i}</span>
                                    <button onclick="toggleAttendanceLock('${currentClassKey}', ${i})" class="text-xs ${isLocked ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}">
                                        <i class="fa-solid ${isLocked ? 'fa-lock' : 'fa-lock-open'}"></i>
                                    </button>
                                </div>
                            </th>`;
                }
                html += `</tr>
                            </thead>
                            <tbody>`;

                students.forEach((s, sIdx) => {
                    html += `<tr class="border-b hover:bg-gray-50/70">
                                <td class="p-2 text-center font-medium text-gray-500 sticky left-0 bg-white/70 backdrop-blur-sm">${sIdx + 1}</td>
                                <td class="p-2 font-mono font-bold text-blue-900 sticky left-12 bg-white/70 backdrop-blur-sm">${s.nim}</td>
                                <td class="p-2 font-medium sticky left-40 bg-white/70 backdrop-blur-sm">${s.name}</td>`;

                    let hadirCount = 0;
                    let izinCount = 0;
                    let sakitCount = 0;
                    let tidakHadirCount = 0;

                    // Calculate counts before rendering the summary columns
                    for (let i = 1; i <= 16; i++) {
                        const status = cls.attendance[s.nim] ? (cls.attendance[s.nim][i] || '') : '';
                        if (status === 'hadir') hadirCount++;
                        else if (status === 'izin') izinCount++;
                        else if (status === 'sakit') sakitCount++;
                        else if (status === 'tidak hadir') tidakHadirCount++;
                    }

                    const totalMeetings = 16; // Assuming 16 meetings for percentage calculation
                    const pct = totalMeetings > 0 ? Math.round((hadirCount / totalMeetings) * 100) : 0;
                    html += `
                                <td class="p-2 text-center font-bold bg-white/70 ${pct >= 75 ? 'text-emerald-700' : 'text-red-700'}">${pct}%</td>
                                <td class="p-2 text-center font-bold bg-white/70">${hadirCount}</td>
                                <td class="p-2 text-center font-bold bg-white/70">${izinCount}</td>
                                <td class="p-2 text-center font-bold bg-white/70">${sakitCount}</td>
                                <td class="p-2 text-center font-bold bg-white/70">${tidakHadirCount}</td>`;
                    for (let i = 1; i <= 16; i++) {
                        const isLocked = !!cls.attendanceLocks[i];
                        const status = cls.attendance[s.nim] ? (cls.attendance[s.nim][i] || '') : '';
                        if (status === 'hadir') hadirCount++;
                        else if (status === 'izin') izinCount++;
                        else if (status === 'sakit') sakitCount++;
                        else if (status === 'tidak hadir') tidakHadirCount++;

                        html += `<td class="p-1.5 text-center">
                                    <select onchange="updateAttendance('${currentClassKey}', '${s.nim}', ${i}, this.value)" 
                                            ${isLocked ? 'disabled' : ''} 
                                            class="w-full border rounded-md px-1.5 py-1 text-center font-medium text-xs disabled:cursor-not-allowed ${
                                                status === 'hadir' ? 'bg-green-50 border-green-200 text-green-900 disabled:bg-green-50/50' : 
                                                status === 'izin' ? 'bg-yellow-50 border-yellow-200 text-yellow-900 disabled:bg-yellow-50/50' : 
                                                status === 'sakit' ? 'bg-blue-50 border-blue-200 text-blue-900 disabled:bg-blue-50/50' : 
                                                status === 'tidak hadir' ? 'bg-red-50 border-red-200 text-red-900 disabled:bg-red-50/50' :
                                                'bg-gray-50 border-gray-200 text-gray-500 disabled:bg-gray-50/50'
                                            }">
                                        <option value="" ${status === '' ? 'selected' : ''}>-</option>
                                        <option value="hadir" ${status === 'hadir' ? 'selected' : ''}>Hadir</option>
                                        <option value="izin" ${status === 'izin' ? 'selected' : ''}>Izin</option>
                                        <option value="sakit" ${status === 'sakit' ? 'selected' : ''}>Sakit</option>
                                        <option value="tidak hadir" ${status === 'tidak hadir' ? 'selected' : ''}>Tidak Hadir</option>
                                    </select>
                                 </td>`;
                    }
                    html += `</tr>`;
                });
                html += `</tbody></table></div>`;
            }
            container.innerHTML = html;
        }

// -------------------------------------------------------------
