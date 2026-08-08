        // SUB MODUL SETUP MATRIKS MATA KULIAH
        // -------------------------------------------------------------

        function numbersAreEqual(a, b) {
            return Math.abs((parseFloat(a) || 0) - (parseFloat(b) || 0)) < 0.0001;
        }

        function getPositiveMappedParentIds(weights, parentIds) {
            return (parentIds || []).filter(parentId => (parseFloat(weights && weights[parentId]) || 0) > 0);
        }

        function getCpmkCplAllocationValidation(cpmks, mappedCPLs) {
            const cplIds = (mappedCPLs || []).map(cpl => cpl.id);
            const cpmkCountsByCpl = Object.fromEntries(cplIds.map(cplId => [cplId, 0]));
            let grandTotal = 0;
            const mappings = (cpmks || []).map(cpmk => {
                const parentIds = getPositiveMappedParentIds(cpmk.weights, cplIds);
                parentIds.forEach(cplId => {
                    cpmkCountsByCpl[cplId] += 1;
                    grandTotal += parseFloat(cpmk.weights[cplId]) || 0;
                });
                return { cpmkId: cpmk.id, parentIds };
            });
            const hierarchyValid = mappings.length > 0
                && mappings.every(mapping => mapping.parentIds.length === 1);
            return {
                cpmkCountsByCpl,
                grandTotal,
                hierarchyValid,
                totalValid: numbersAreEqual(grandTotal, 100),
                valid: hierarchyValid && numbersAreEqual(grandTotal, 100)
            };
        }

        function isCpmkHierarchyValid(cpmks, mappedCPLs) {
            return getCpmkCplAllocationValidation(cpmks, mappedCPLs).hierarchyValid;
        }

        function isSubCpmkHierarchyValid(subcpmks, cpmks) {
            const cpmkIds = (cpmks || []).map(cpmk => cpmk.id);
            return (subcpmks || []).length > 0
                && (subcpmks || []).every(sub => getPositiveMappedParentIds(sub.weights, cpmkIds).length === 1);
        }

        function getCpmkReferenceTotals(cpmks, mappedCPLs) {
            const totals = {};
            cpmks.forEach(cpmk => {
                let total = 0;
                mappedCPLs.forEach(cpl => {
                    total += (parseFloat(cpmk.weights && cpmk.weights[cpl.id]) || 0);
                });
                totals[cpmk.id] = total;
            });
            return totals;
        }

        function getSubCpmkReferenceTotals(cls, cpmks) {
            const totals = {};
            (cls.subCpmkList || []).forEach(sub => {
                let total = 0;
                cpmks.forEach(cpmk => {
                    total += (parseFloat(sub.weights && sub.weights[cpmk.id]) || 0);
                });
                totals[sub.id] = total;
            });
            return totals;
        }

        function getKomponenMatrixSortState() {
            if (!state.komponenMatrixSort) {
                state.komponenMatrixSort = { field: 'jenis', direction: 'asc' };
            }
            return state.komponenMatrixSort;
        }

        function toggleKomponenMatrixSort(field) {
            const sortState = getKomponenMatrixSortState();
            if (sortState.field === field) {
                sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
            } else {
                sortState.field = field;
                sortState.direction = 'asc';
            }
            saveState();
            renderApp();
        }

        function getSortedKomponenList(komponenList, sortState) {
            const list = [...(komponenList || [])];
            if (!sortState || !sortState.field) return list;

            const getValue = (komp) => {
                const raw = sortState.field === 'name' ? (komp.name || '') : (komp.jenis || '');
                return String(raw).toLowerCase();
            };

            return list.sort((a, b) => {
                const aValue = getValue(a);
                const bValue = getValue(b);
                if (aValue < bValue) return sortState.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortState.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        function renderSetupMatriksMataKuliah(container) {
            const classKeys = Object.keys(state.classData);
            if (classKeys.length === 0) {
                container.innerHTML = `<div class="p-4 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 text-sm">Belum ada kelas perkuliahan. Buat kelas terlebih dahulu di menu Setup Perkuliahan.</div>`;
                return;
            }

            if (!state.selectedClassKey || !state.classData[state.selectedClassKey]) {
                state.selectedClassKey = classKeys[0];
            }

            const currentClassKey = state.selectedClassKey;
            const cls = state.classData[currentClassKey];
            const mk = state.mkList.find(m => m.id === cls.mkId) || { id: cls.mkId, code: 'N/A', name: 'Mata Kuliah' };
            const cpmks = state.cpmkList[mk.id] || [];
            const mappedCPLs = state.cplList.filter(cpl => mk.cpls && mk.cpls.includes(cpl.id));
            const cpmkReferenceTotals = getCpmkReferenceTotals(cpmks, mappedCPLs);
            const subCpmkReferenceTotals = getSubCpmkReferenceTotals(cls, cpmks);
            if (normalizeSequentialCodes(cls.subCpmkList || [], 'SubCPMK')) saveState();
            const komponenSortState = getKomponenMatrixSortState();
            let sortedKomponenList;
            if (state.doNotSortKomponen) {
                sortedKomponenList = cls.komponenList || [];
                delete state.doNotSortKomponen;
            } else {
                sortedKomponenList = getSortedKomponenList(cls.komponenList || [], komponenSortState);
            }

            const hasValidSubCpmkHierarchy = isSubCpmkHierarchyValid(cls.subCpmkList || [], cpmks);
            if (cls.subCpmkFinalized && !hasValidSubCpmkHierarchy) {
                cls.subCpmkFinalized = false;
                saveState();
            }
            const isSubCpmkLocked = !!cls.subCpmkFinalized;
            const isKomponenLocked = !!cls.komponenFinalized;
            
            // Pre-calculate grand totals
            let subCpmkGrandTotal = 0;
            if (cls.subCpmkList) {
                cls.subCpmkList.forEach(sub => {
                    let rowTotal = 0;
                    cpmks.forEach(cpmk => {
                        rowTotal += (parseFloat(sub.weights ? sub.weights[cpmk.id] : 0) || 0);
                    });
                    subCpmkGrandTotal += rowTotal;
                });
            }

            let komponenGrandTotal = 0;
            if (isSubCpmkLocked && cls.komponenList) {
                cls.komponenList.forEach(komp => {
                    let rowTotal = 0;
                    (cls.subCpmkList || []).forEach(sub => {
                        rowTotal += (parseFloat(komp.weights ? komp.weights[sub.id] : 0) || 0);
                    });
                    komponenGrandTotal += rowTotal;
                });
            }

            let html = `
                <!-- Class Switcher Banner -->
                <div class="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-200 flex flex-wrap justify-between items-center gap-3">
                    <div>
                        <label class="block text-xs font-bold text-blue-900 mb-1">Pilih Kelas Perkuliahan Aktif:</label>
                        <select onchange="state.selectedClassKey = this.value; saveState(); renderApp();" class="border font-bold text-sm rounded-lg px-3 py-2 bg-white shadow-sm text-blue-950 focus:ring-2 focus:ring-blue-500">
                            ${classKeys.map(k => {
                                const c = state.classData[k];
                                const m = state.mkList.find(x => x.id === c.mkId) || { code: 'N/A', name: 'Mata Kuliah Tidak Dikenal' };
                                return `<option value="${k}" ${k === currentClassKey ? 'selected' : ''}>[${m.code}] ${m.name} - Smt ${c.semester} - Kelas ${c.kelas}</option>`;
                            }).join('')}
                        </select>
                    </div>
                    <div class="text-xs text-blue-800">
                        <span class="font-bold">Mata Kuliah:</span> ${mk.name} (${mk.code}) | <span class="font-bold">SKS:</span> ${mk.totalSks}
                    </div>
                </div>

                <!-- SECTION 1: MATRIKS SubCPMK - CPMK -->
                <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-8">
                    <div class="flex justify-between items-center mb-4 pb-2 border-b">
                        <div>
                            <h3 class="text-base font-bold text-gray-800 flex items-center">
                                <i class="fa-solid fa-diagram-project mr-2 text-blue-800"></i> Matriks SubCPMK - CPMK
                            </h3>
                            <p class="text-xs text-gray-500">Petakan bobot (%) kontribusi tiap SubCPMK terhadap CPMK Mata Kuliah.</p>
                        </div>
                        ${!isSubCpmkLocked ? `
                            <button onclick="addSubCPMK('${currentClassKey}')" class="bg-blue-700 hover:bg-blue-800 text-white text-xs px-3 py-2 rounded shadow font-semibold">
                                <i class="fa-solid fa-plus mr-1"></i> Tambah SubCPMK
                            </button>` : ''}
                    </div>

                    <div class="overflow-x-auto mb-4">
                        <table class="w-full text-xs text-left border border-gray-200 rounded-lg">
                            <thead class="bg-blue-900 text-white border-b">
                                <tr>
                                    <th class="p-2.5 w-28">SubCPMK</th>
                                    <th class="p-2.5 min-w-[200px]">Deskripsi SubCPMK</th>`;
            cpmks.forEach(cpmk => { html += `<th class="p-2.5 text-center w-28">${cpmk.code} (%)</th>`; });
            html += `<th class="p-2.5 w-24 text-center bg-blue-800">Total Bobot</th>
                                    <th class="p-2.5 w-12 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>`;

            if (!cls.subCpmkList || cls.subCpmkList.length === 0) {
                html += `<tr><td colspan="${4 + cpmks.length}" class="p-4 text-center text-gray-500">Belum ada SubCPMK. Klik Tambah SubCPMK.</td></tr>`;
            } else {
                cls.subCpmkList.forEach((sub, sIdx) => {
                    let rowTotal = 0;
                    html += `
                        <tr class="border-b hover:bg-gray-50">
                            <td class="p-2"><input type="text" value="${sub.code}" readonly class="w-full font-semibold border rounded px-2 py-1 bg-gray-50 cursor-not-allowed"></td>
                            <td class="p-2"><input type="text" value="${sub.desc}" ${isSubCpmkLocked ? 'disabled' : ''} onchange="state.classData['${currentClassKey}'].subCpmkList[${sIdx}].desc=this.value; saveState();" class="w-full border rounded px-2 py-1"></td>`;

                    cpmks.forEach(cpmk => {
                        const w = (sub.weights && sub.weights[cpmk.id]) !== undefined ? sub.weights[cpmk.id] : 0;
                        rowTotal += parseFloat(w) || 0;
                        const displayValue = (parseFloat(w) || 0) > 0 ? w : '';
                        html += `
                            <td class="p-2 text-center">
                                <input type="number" min="0" max="100" value="${displayValue}" ${isSubCpmkLocked ? 'disabled' : ''} 
                                    onchange="updateSubCpmkWeight('${currentClassKey}', ${sIdx}, '${cpmk.id}', this.value)" 
                                    class="w-16 border rounded px-1 py-1 text-center font-medium">
                            </td>`;
                    });

                    // Penyesuaian class rowTotal agar warnanya dinamis saat 0 atau lebih dari 0
                    html += `<td class="p-2 text-center font-bold ${rowTotal > 0 ? 'text-blue-900 bg-blue-50' : 'text-gray-400'}">${rowTotal}%</td>`;
                    html += `
                            <td class="p-2 text-center">
                                ${!isSubCpmkLocked ? `<button onclick="deleteSubCPMK('${currentClassKey}', ${sIdx})" class="text-red-600 hover:text-red-800"><i class="fa-solid fa-trash"></i></button>` : '-'}
                            </td>
                        </tr>`;
                });
            }

            html += `</tbody>
                            <tfoot class="bg-gray-100 font-bold">
                                <tr>
                                    <td colspan="2" class="p-2 text-right">Total Akumulasi Bobot SubCPMK per CPMK:</td>`;
            let isCpmkValidationValid = true;
            cpmks.forEach(cpmk => {
                let colSum = 0;
                if (cls.subCpmkList) {
                    cls.subCpmkList.forEach(s => { colSum += (parseFloat(s.weights ? s.weights[cpmk.id] : 0) || 0); });
                }
                const targetTotal = cpmkReferenceTotals[cpmk.id] || 0;
                const isValid = numbersAreEqual(colSum, targetTotal);
                isCpmkValidationValid = isCpmkValidationValid && isValid;
                const valueClass = isValid ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50';
                html += `<td class="p-2 text-center ${valueClass}">${colSum}%${!isValid ? ` <span class="text-[10px]">(target ${targetTotal}%)</span>` : ''}</td>`;
            });
            
            const isSubCpmkReadyToFinalize = subCpmkGrandTotal === 100 && isCpmkValidationValid && hasValidSubCpmkHierarchy;
            html += `<td class="p-2 text-center ${subCpmkGrandTotal === 100 ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}">${subCpmkGrandTotal}%</td>
                                     <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <!-- TOMBOL FINALISASI SubCPMK - CPMK -->
                    <div class="flex justify-between items-center border-t pt-3">
                        <p class="text-xs ${isSubCpmkReadyToFinalize ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}">
                            ${isSubCpmkReadyToFinalize ? '<i class="fa-solid fa-circle-check mr-1"></i> Total bobot 100%, setiap SubCPMK mengukur tepat satu CPMK, dan akumulasi tiap CPMK sesuai matriks CPMK-CPL.' : `<i class="fa-solid fa-triangle-exclamation mr-1"></i> Pastikan setiap SubCPMK hanya mengukur satu CPMK, total bobot 100%, dan akumulasi tiap CPMK sesuai target.`}
                        </p>
                        <div>
                            ${isSubCpmkLocked ? 
                                `<span class="bg-green-100 text-green-800 font-bold px-3 py-1.5 rounded text-xs inline-flex items-center"><i class="fa-solid fa-lock mr-1"></i> MATRIKS SubCPMK - CPMK DIFINALISASI</span>
                                <button onclick="unfinalizeSubCPMK('${currentClassKey}')" class="ml-2 text-xs text-red-600 underline">Buka Kunci</button>` :
                                `<button class="inline-flex items-center bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-4 py-2 rounded-lg shadow font-bold disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed" ${isSubCpmkReadyToFinalize ? `onclick="finalizeSubCPMK('${currentClassKey}')"` : 'disabled'}>
                                    <i class="fa-solid fa-check-double mr-1.5"></i> Finalisasi Matriks SubCPMK - CPMK
                                </button>`
                            }
                        </div>
                    </div>
                </div>`;

            // SECTION 2: MATRIKS KOMPONEN PENILAIAN - SubCPMK (Conditionally Rendered)
            if (!isSubCpmkLocked) {
                html += `
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm opacity-60">
                    <div class="flex justify-between items-center mb-2 pb-2 border-b">
                        <div>
                            <h3 class="text-base font-bold text-gray-500 flex items-center">
                                <i class="fa-solid fa-sliders mr-2"></i> Matriks Komponen Penilaian - SubCPMK
                            </h3>
                        </div>
                    </div>
                    <div class="p-6 text-center text-sm text-gray-600">
                        <i class="fa-solid fa-lock fa-2x mb-3 text-gray-400"></i>
                        <p class="font-semibold">Harap finalisasi Matriks SubCPMK - CPMK di atas untuk membuka bagian ini.</p>
                    </div>
                </div>`;
            } else {
                // Calculate accumulated weights per component type
                const komponenTypeTotals = {};
                const componentTypes = ['Aktivitas Partisipatif', 'Hasil Proyek', 'Tugas', 'Kuis', 'UTS', 'UAS'];
                componentTypes.forEach(type => komponenTypeTotals[type] = 0);

                if (cls.komponenList) {
                    cls.komponenList.forEach(komp => {
                        let rowTotal = 0;
                        (cls.subCpmkList || []).forEach(sub => {
                            rowTotal += (parseFloat(komp.weights ? komp.weights[sub.id] : 0) || 0);
                        });
                        if (komponenTypeTotals[komp.jenis] !== undefined) {
                            komponenTypeTotals[komp.jenis] += rowTotal;
                        }
                    });
                }
                
                html += `
                <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div class="flex justify-between items-center mb-4 pb-2 border-b">
                        <div>
                            <h3 class="text-base font-bold text-gray-800 flex items-center">
                                <i>Matriks Komponen Penilaian - SubCPMK
                            </h3>
                            <p class="text-xs text-gray-500">Tentukan komponen penilaian dan bobot (%) ke SubCPMK.</p>
                        </div>
                        ${!isKomponenLocked ? `
                            <button onclick="addKomponen('${currentClassKey}')" class="bg-blue-700 hover:bg-blue-800 text-white text-xs px-3 py-2 rounded shadow font-semibold">
                                <i class="fa-solid fa-plus mr-1"></i> Tambah Komponen
                            </button>` : ''}
                    </div>

                    <div class="overflow-x-auto mb-4">
                        <table class="w-full text-xs text-left border border-gray-200 rounded-lg">
                            <thead class="bg-gray-800 text-white border-b">
                                <tr>
                                    <th class="p-2.5 w-28">
                                        <button type="button" onclick="toggleKomponenMatrixSort('jenis')" class="flex items-center gap-1 font-semibold hover:text-blue-200">
                                            Jenis Komponen
                                            <i class="fa-solid ${komponenSortState.field === 'jenis' ? (komponenSortState.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'}"></i>
                                        </button>
                                    </th>
                                    <th class="p-2.5 w-40">
                                        <button type="button" onclick="toggleKomponenMatrixSort('name')" class="flex items-center gap-1 font-semibold hover:text-blue-200">
                                            Nama Komponen
                                            <i class="fa-solid ${komponenSortState.field === 'name' ? (komponenSortState.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'}"></i>
                                        </button>
                                    </th>`;
                (cls.subCpmkList || []).forEach(sub => { html += `<th class="p-2.5 text-center w-28">${sub.code} (%)</th>`; });
                html += `<th class="p-2.5 w-24 text-center bg-gray-700">Total Bobot</th>
                                    <th class="p-2.5 w-12 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>`;

                if (!sortedKomponenList || sortedKomponenList.length === 0) {
                    html += `<tr><td colspan="${4 + (cls.subCpmkList ? cls.subCpmkList.length : 0)}" class="p-4 text-center text-gray-500">Belum ada komponen penilaian. Klik Tambah Komponen.</td></tr>`;
                } else {
                    sortedKomponenList.forEach((komp) => {
                        const originalIndex = cls.komponenList.indexOf(komp);
                        let rowTotal = 0;
                        html += `
                            <tr class="border-b hover:bg-gray-50">
                                <td class="p-2">
                                    <select ${isKomponenLocked ? 'disabled' : ''} onchange="state.classData['${currentClassKey}'].komponenList[${originalIndex}].jenis=this.value; saveState();" class="w-full border rounded px-1.5 py-1">
                                        <option value="Aktivitas Partisipatif" ${komp.jenis === 'Aktivitas Partisipatif' ? 'selected' : ''}>Aktivitas Partisipatif</option>
                                        <option value="Hasil Proyek" ${komp.jenis === 'Hasil Proyek' ? 'selected' : ''}>Hasil Proyek</option>
                                        <option value="Tugas" ${komp.jenis === 'Tugas' ? 'selected' : ''}>Tugas</option>
                                        <option value="Kuis" ${komp.jenis === 'Kuis' ? 'selected' : ''}>Kuis</option>
                                        <option value="UTS" ${komp.jenis === 'UTS' ? 'selected' : ''}>UTS</option>
                                        <option value="UAS" ${komp.jenis === 'UAS' ? 'selected' : ''}>UAS</option>
                                    </select>
                                </td>
                                <td class="p-2"><input type="text" value="${komp.name}" ${isKomponenLocked ? 'disabled' : ''} onchange="state.classData['${currentClassKey}'].komponenList[${originalIndex}].name=this.value; saveState();" class="w-full border rounded px-2 py-1 font-medium"></td>`;

                        (cls.subCpmkList || []).forEach(sub => {
                            const w = (komp.weights && komp.weights[sub.id]) !== undefined ? komp.weights[sub.id] : 0;
                            rowTotal += parseFloat(w) || 0;
                            const displayValue = (parseFloat(w) || 0) > 0 ? w : '';
                            html += `
                                <td class="p-2 text-center">
                                    <input type="number" min="0" max="100" value="${displayValue}" ${isKomponenLocked ? 'disabled' : ''} 
                                        onchange="updateKomponenWeight('${currentClassKey}', ${originalIndex}, '${sub.id}', this.value)" 
                                        class="w-16 border rounded px-1 py-1 text-center font-medium">
                                </td>`;
                        });

                        // Penyesuaian class rowTotal komponen agar warnanya dinamis
                        html += `<td class="p-2 text-center font-bold ${rowTotal > 0 ? 'text-blue-900 bg-blue-50' : 'text-gray-400'}">${rowTotal}%</td>`;
                        html += `
                                <td class="p-2 text-center">
                                    ${!isKomponenLocked ? `<button onclick="deleteKomponen('${currentClassKey}', ${originalIndex})" class="text-red-600 hover:text-red-800"><i class="fa-solid fa-trash"></i></button>` : '-'}
                                </td>
                            </tr>`;
                    });
                }

                html += `</tbody>
                                <tfoot class="bg-gray-100 font-bold">
                                    <tr>
                                        <td colspan="2" class="p-2 text-right">Total Akumulasi Bobot Komponen per SubCPMK:</td>`;
                let isSubCpmkTargetValid = true;
                (cls.subCpmkList || []).forEach(sub => {
                    let colSum = 0;
                    if (cls.komponenList) {
                        cls.komponenList.forEach(k => { colSum += (parseFloat(k.weights ? k.weights[sub.id] : 0) || 0); });
                    }
                    const targetTotal = subCpmkReferenceTotals[sub.id] || 0;
                    const isValid = numbersAreEqual(colSum, targetTotal);
                    isSubCpmkTargetValid = isSubCpmkTargetValid && isValid;
                    const valueClass = isValid ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50';
                    html += `<td class="p-2 text-center ${valueClass}">${colSum}%${!isValid ? ` <span class="text-[10px]">(target ${targetTotal}%)</span>` : ''}</td>`;
                });
                
                const isKomponenReadyToFinalize = komponenGrandTotal === 100 && isSubCpmkTargetValid;
                html += `<td class="p-2 text-center ${komponenGrandTotal === 100 ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}">${komponenGrandTotal}%</td>
                                         <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>


                <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm mb-4">
                    <h4 class="font-bold text-sm text-gray-700 mb-3"><i class="fa-solid fa-chart-pie mr-1 text-blue-700"></i> Akumulasi Bobot per Jenis Komponen (%)</h4>
                    <div class="overflow-x-auto">
                        <table class="w-full text-xs text-left border border-gray-300 rounded-lg">
                            <thead class="bg-gray-200 border-b text-gray-700">
                                <tr>
                                    ${componentTypes.map(type => `<th class="p-2.5 text-center">${type}</th>`).join('')}
                                    <th class="p-2.5 text-center bg-gray-300 text-gray-800">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    ${componentTypes.map(type => `<td class="p-2 text-center font-bold text-blue-900">${komponenTypeTotals[type]}%</td>`).join('')}
                                    <td class="p-2 text-center font-bold bg-gray-300 text-gray-800">${Object.values(komponenTypeTotals).reduce((sum, current) => sum + current, 0)}%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                        <!-- TOMBOL FINALISASI KOMPONEN PENILAIAN -->
                        <div class="flex justify-between items-center border-t pt-3">
                            <p class="text-xs ${isKomponenReadyToFinalize ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}">
                                ${isKomponenReadyToFinalize ? '<i class="fa-solid fa-circle-check mr-1"></i> Total Bobot 100% dan tiap SubCPMK sesuai dengan matriks SubCPMK-CPMK.' : `<i class="fa-solid fa-triangle-exclamation mr-1"></i> Pastikan total bobot 100% dan tiap SubCPMK memiliki bobot yang sama dengan target pada matriks SubCPMK-CPMK.`}
                            </p>
                            <div>
                                ${isKomponenLocked ? 
                                    `<span class="bg-green-100 text-green-800 font-bold px-3 py-1.5 rounded text-xs inline-flex items-center"><i class="fa-solid fa-lock mr-1"></i> KOMPONEN PENILAIAN DIFINALISASI</span>
                                    <button onclick="unfinalizeKomponen('${currentClassKey}')" class="ml-2 text-xs text-red-600 underline">Buka Kunci</button>` :
                                    `<button ${isKomponenReadyToFinalize ? `onclick="finalizeKomponen('${currentClassKey}')"` : 'disabled class="opacity-50 cursor-not-allowed bg-gray-400 text-white text-xs px-4 py-2 rounded shadow font-bold inline-flex items-center"'}>
                                        <i class="fa-solid fa-check-double mr-1.5"></i> Finalisasi Komponen Penilaian
                                    </button>`
                                }
                            </div>
                        </div>
`;
            }

            container.innerHTML = html;
        }

        function addSubCPMK(classKey) {
            if (state.classData[classKey]?.subCpmkFinalized) return;
            if (!state.classData[classKey].subCpmkList) state.classData[classKey].subCpmkList = [];
            state.classData[classKey].subCpmkList.push({ id: 'SUB' + Date.now(), code: '', desc: '', weights: {} });
            normalizeSequentialCodes(state.classData[classKey].subCpmkList, 'SubCPMK');
            saveState();
            renderApp();
        }

        function deleteSubCPMK(classKey, sIdx) {
            if (state.classData[classKey]?.subCpmkFinalized) return;
            
            // 1. Hapus SubCPMK pada indeks yang dipilih
            state.classData[classKey].subCpmkList.splice(sIdx, 1);
            
            // 2. Tulis ulang penomoran berdasarkan urutan array yang baru
            state.classData[classKey].subCpmkList.forEach((sub, index) => {
                sub.code = `SubCPMK ${index + 1}`;
            });
            
            saveState();
            renderApp();
        }

        function updateSubCPMKDesc(classKey, sIdx, value) {
            if (state.classData[classKey]?.subCpmkFinalized) return;
            if (!state.classData[classKey] || !state.classData[classKey].subCpmkList || !state.classData[classKey].subCpmkList[sIdx]) return;
            state.classData[classKey].subCpmkList[sIdx].desc = value;
            saveState();
            renderApp();
        }

        function updateSubCpmkWeight(classKey, sIdx, cpmkId, val) {
            if (state.classData[classKey]?.subCpmkFinalized) return;
            const num = parseFloat(val) || 0;
            if (!state.classData[classKey].subCpmkList[sIdx].weights) state.classData[classKey].subCpmkList[sIdx].weights = {};
            const weights = state.classData[classKey].subCpmkList[sIdx].weights;
            if (num > 0) {
                Object.keys(weights).forEach(parentId => {
                    if (parentId !== cpmkId) weights[parentId] = 0;
                });
            }
            weights[cpmkId] = num;
            saveState();
            renderApp();
        }

        function finalizeSubCPMK(classKey) {
            if (!state.classData[classKey]) return;
            const cls = state.classData[classKey];
            const mk = state.mkList.find(m => m.id === cls.mkId) || { id: cls.mkId, code: 'N/A', name: 'Mata Kuliah' };
            const cpmks = state.cpmkList[mk.id] || [];
            const mappedCPLs = state.cplList.filter(cpl => mk.cpls && mk.cpls.includes(cpl.id));
            const cpmkReferenceTotals = getCpmkReferenceTotals(cpmks, mappedCPLs);
            const hasValidSubCpmkHierarchy = isSubCpmkHierarchyValid(cls.subCpmkList || [], cpmks);

            let subCpmkGrandTotal = 0;
            if (cls.subCpmkList) {
                cls.subCpmkList.forEach(sub => {
                    let rowTotal = 0;
                    cpmks.forEach(cpmk => {
                        rowTotal += (parseFloat(sub.weights ? sub.weights[cpmk.id] : 0) || 0);
                    });
                    subCpmkGrandTotal += rowTotal;
                });
            }

            let isCpmkValidationValid = true;
            cpmks.forEach(cpmk => {
                let colSum = 0;
                if (cls.subCpmkList) {
                    cls.subCpmkList.forEach(sub => { colSum += (parseFloat(sub.weights ? sub.weights[cpmk.id] : 0) || 0); });
                }
                const targetTotal = cpmkReferenceTotals[cpmk.id] || 0;
                isCpmkValidationValid = isCpmkValidationValid && numbersAreEqual(colSum, targetTotal);
            });

            if (subCpmkGrandTotal !== 100 || !isCpmkValidationValid || !hasValidSubCpmkHierarchy) {
                alert("Tidak dapat finalisasi. Pastikan setiap SubCPMK mengukur tepat satu CPMK, total bobot 100%, dan akumulasi tiap CPMK sesuai matriks CPMK-CPL.");
                return;
            }

            cls.subCpmkFinalized = true;
            alert("Matriks SubCPMK - CPMK berhasil difinalisasi!");
            saveState();
            renderApp();
        }

        function unfinalizeSubCPMK(classKey) {
            const cls = state.classData[classKey];
            if (!cls) return;
            if (cls.rpsFinalized || cls.komponenFinalized || cls.weeklyMatrixFinalized) {
                alert('Matriks 2f belum dapat dibuka. Buka kunci Bab 3 Matriks Pembelajaran Mingguan terlebih dahulu.');
                return;
            }
            cls.subCpmkFinalized = false;
            saveState();
            renderApp();
            alert('Matriks SubCPMK - CPMK (2f) telah dibuka.');
        }

        function addKomponen(classKey) {
            if (state.classData[classKey]?.komponenFinalized) return;
            if (!state.classData[classKey].komponenList) state.classData[classKey].komponenList = [];
            const nextNo = state.classData[classKey].komponenList.length + 1;
            state.classData[classKey].komponenList.push({ id: 'KOMP' + Date.now(), jenis: 'Tugas', name: ``, weights: {} });
            state.doNotSortKomponen = true;
            saveState();
            renderApp();
        }

        function deleteKomponen(classKey, kIdx) {
            if (state.classData[classKey]?.komponenFinalized) return;
            state.classData[classKey].komponenList.splice(kIdx, 1);
            saveState();
            renderApp();
        }

        function updateKomponenWeight(classKey, kIdx, subId, val) {
            if (state.classData[classKey]?.komponenFinalized) return;
            const num = parseFloat(val) || 0;
            if (!state.classData[classKey].komponenList[kIdx].weights) state.classData[classKey].komponenList[kIdx].weights = {};
            state.classData[classKey].komponenList[kIdx].weights[subId] = num;
            saveState();
            renderApp();
        }

        function finalizeKomponen(classKey) {
            if (!state.classData[classKey]) return;
            const cls = state.classData[classKey];
            if (!cls.weeklyMatrixFinalized) {
                alert("Rancangan Evaluasi / Asesmen belum dapat difinalisasi. Finalisasi Matriks Pembelajaran Mingguan pada Bab 3 terlebih dahulu.");
                return;
            }
            const mk = state.mkList.find(m => m.id === cls.mkId) || { id: cls.mkId, code: 'N/A', name: 'Mata Kuliah' };
            const cpmks = state.cpmkList[mk.id] || [];
            const subCpmkReferenceTotals = getSubCpmkReferenceTotals(cls, cpmks);

            let komponenGrandTotal = 0;
            if (cls.komponenList) {
                cls.komponenList.forEach(komp => {
                    let rowTotal = 0;
                    (cls.subCpmkList || []).forEach(sub => {
                        rowTotal += (parseFloat(komp.weights ? komp.weights[sub.id] : 0) || 0);
                    });
                    komponenGrandTotal += rowTotal;
                });
            }

            let isSubCpmkTargetValid = true;
            (cls.subCpmkList || []).forEach(sub => {
                let colSum = 0;
                if (cls.komponenList) {
                    cls.komponenList.forEach(k => { colSum += (parseFloat(k.weights ? k.weights[sub.id] : 0) || 0); });
                }
                const targetTotal = subCpmkReferenceTotals[sub.id] || 0;
                isSubCpmkTargetValid = isSubCpmkTargetValid && numbersAreEqual(colSum, targetTotal);
            });

            if (komponenGrandTotal !== 100 || !isSubCpmkTargetValid) {
                alert("Tidak dapat finalisasi. Pastikan total bobot 100% dan tiap SubCPMK sesuai dengan target pada matriks SubCPMK-CPMK.");
                return;
            }

            cls.komponenFinalized = true;
            alert("Matriks Komponen Penilaian berhasil difinalisasi!");
            saveState();
            renderApp();
        }

        function unfinalizeKomponen(classKey) {
            const cls = state.classData[classKey];
            if (!cls) return;
            if (cls.rpsFinalized) {
                alert('Rancangan Evaluasi / Asesmen belum dapat dibuka. Buka kunci RPS terlebih dahulu.');
                return;
            }
            cls.komponenFinalized = false;
            saveState();
            renderApp();
        }

        // -------------------------------------------------------------
