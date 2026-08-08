// MODUL MONITOR NILAI
// -------------------------------------------------------------

        function getMonitoringRows(classKey, students) {
            const cls = state.classData[classKey];
            if (!cls) return [];
            const mk = state.mkList.find(m => m.id === cls.mkId) || { id: cls.mkId, code: 'N/A', name: 'Mata Kuliah' };
            const komps = cls.komponenList || [];
            const subCpmks = cls.subCpmkList || [];
            const cpmks = state.cpmkList[mk.id] || [];
            const mappedCPLs = state.cplList.filter(cpl => mk.cpls && mk.cpls.includes(cpl.id));

            return students.map(student => {
                const componentScores = {};
                komps.forEach(k => {
                    componentScores[k.id] = parseFloat(student.scores && student.scores[k.id]) || 0;
                });

                const subCpmkScores = {};
                subCpmks.forEach(sub => {
                    let numerator = 0;
                    let denominator = 0;
                    komps.forEach(k => {
                        const weight = parseFloat(k.weights && k.weights[sub.id]) || 0;
                        if (weight > 0) {
                            numerator += componentScores[k.id] * weight;
                            denominator += weight;
                        }
                    });
                    subCpmkScores[sub.id] = denominator > 0 ? Number((numerator / denominator).toFixed(1)) : 0;
                });

                const cpmkScores = {};
                cpmks.forEach(cpmk => {
                    let numerator = 0;
                    let denominator = 0;
                    subCpmks.forEach(sub => {
                        const weight = parseFloat(sub.weights && sub.weights[cpmk.id]) || 0;
                        if (weight > 0) {
                            numerator += subCpmkScores[sub.id] * weight;
                            denominator += weight;
                        }
                    });
                    cpmkScores[cpmk.id] = denominator > 0 ? Number((numerator / denominator).toFixed(1)) : 0;
                });

                const cplScores = {};
                mappedCPLs.forEach(cpl => {
                    let numerator = 0;
                    let denominator = 0;
                    cpmks.forEach(cpmk => {
                        const weight = parseFloat(cpmk.weights && cpmk.weights[cpl.id]) || 0;
                        if (weight > 0) {
                            numerator += cpmkScores[cpmk.id] * weight;
                            denominator += weight;
                        }
                    });
                    cplScores[cpl.id] = denominator > 0 ? Number((numerator / denominator).toFixed(1)) : 0;
                });

                const componentTypeScores = {};
                const componentTypeWeights = {};
                const componentTypeWeightedTotals = {};
                komps.forEach(k => {
                    const type = k.jenis || 'Lainnya';
                    const rawScore = parseFloat(student.scores && student.scores[k.id]) || 0;
                    let totalWeight = 0;
                    subCpmks.forEach(sub => {
                        totalWeight += parseFloat(k.weights && k.weights[sub.id]) || 0;
                    });
                    const contribution = totalWeight > 0 ? rawScore * totalWeight : rawScore;
                    componentTypeScores[type] = (componentTypeScores[type] || 0) + contribution;
                    componentTypeWeights[type] = (componentTypeWeights[type] || 0) + (totalWeight > 0 ? totalWeight : 1);
                    componentTypeWeightedTotals[type] = (componentTypeWeightedTotals[type] || 0) + (totalWeight > 0 ? totalWeight : 1);
                });

                const componentTypeBreakdown = Object.entries(componentTypeScores).reduce((acc, [type, value]) => {
                    const weight = componentTypeWeightedTotals[type] || 0;
                    acc[type] = {
                        weight,
                        score: weight > 0 ? Number((value / weight).toFixed(1)) : 0
                    };
                    return acc;
                }, {});

                const componentScore = Object.keys(componentTypeBreakdown).length > 0
                    ? Number((Object.entries(componentTypeBreakdown).reduce((sum, [type, item]) => sum + (item.score * item.weight), 0) / Object.values(componentTypeBreakdown).reduce((sum, item) => sum + item.weight, 0)).toFixed(1))
                    : 0;
                const componentSummary = Object.entries(componentTypeBreakdown)
                    .map(([type, item]) => `${type} (${item.weight}%): ${item.score}`)
                    .join(' | ');

                return {
                    ...student,
                    componentScore,
                    componentSummary,
                    componentTypeBreakdown,
                    subCpmkScores,
                    cpmkScores,
                    cplScores
                };
            });
        }
 
        function getMonitorPredicate(value) {
            if (value >= 86) return { label: 'A', className: 'bg-emerald-100 text-emerald-800' };
            if (value >= 78) return { label: 'AB', className: 'bg-teal-100 text-teal-800' };
            if (value >= 70) return { label: 'B', className: 'bg-sky-100 text-sky-800' };
            if (value >= 62) return { label: 'BC', className: 'bg-cyan-100 text-cyan-800' };
            if (value >= 54) return { label: 'C', className: 'bg-amber-100 text-amber-800' };
            if (value >= 40) return { label: 'D', className: 'bg-orange-100 text-orange-800' };
            return { label: 'E', className: 'bg-red-100 text-red-800' };
        }

        function getWeightedScore(values, weights) {
            let numerator = 0;
            let denominator = 0;
            values.forEach((value, idx) => {
                const weight = parseFloat(weights[idx]) || 0;
                if (weight > 0) {
                    numerator += (parseFloat(value) || 0) * weight;
                    denominator += weight;
                }
            });
            return denominator > 0 ? Number((numerator / denominator).toFixed(1)) : 0;
        }

        function getMonitorExportModel(classKey) {
            const cls = state.classData[classKey];
            if (!cls) return null;
            const mk = state.mkList.find(item => item.id === cls.mkId) || { code: 'N/A', name: 'Mata Kuliah' };
            const monitorRows = getMonitoringRows(classKey, cls.students || []);
            let title = 'Ketercapaian Komponen Penilaian';
            let columns = [...new Set((cls.komponenList || []).map(component => component.jenis || 'Lainnya'))]
                .map(type => ({ id: type, label: type, scoreKey: 'componentTypeBreakdown' }));
            let getValue = (row, column) => row.componentTypeBreakdown?.[column.id]?.score ?? 0;
            let getFinalValue = row => row.componentScore;

            if (state.activeSubMenu === 'mon_subcpmk') {
                title = 'Ketercapaian SubCPMK';
                columns = (cls.subCpmkList || []).map(item => ({ id: item.id, label: item.code }));
                const weights = (cls.subCpmkList || []).map(item =>
                    Object.values(item.weights || {}).reduce((sum, weight) => sum + (parseFloat(weight) || 0), 0)
                );
                getValue = (row, column) => row.subCpmkScores[column.id] ?? 0;
                getFinalValue = row => getWeightedScore(columns.map(column => getValue(row, column)), weights);
            } else if (state.activeSubMenu === 'mon_cpmk') {
                title = 'Ketercapaian CPMK';
                const cpmks = state.cpmkList[mk.id] || [];
                columns = cpmks.map(item => ({ id: item.id, label: item.code }));
                const weights = cpmks.map(item =>
                    Object.values(item.weights || {}).reduce((sum, weight) => sum + (parseFloat(weight) || 0), 0)
                );
                getValue = (row, column) => row.cpmkScores[column.id] ?? 0;
                getFinalValue = row => getWeightedScore(columns.map(column => getValue(row, column)), weights);
            } else if (state.activeSubMenu === 'mon_cpl') {
                title = 'Ketercapaian CPL';
                const cpmks = state.cpmkList[mk.id] || [];
                const mappedCpls = state.cplList.filter(cpl => mk.cpls && mk.cpls.includes(cpl.id));
                columns = mappedCpls.map(item => ({ id: item.id, label: item.code }));
                const weights = mappedCpls.map(cpl =>
                    cpmks.reduce((sum, cpmk) => sum + (parseFloat(cpmk.weights?.[cpl.id]) || 0), 0)
                );
                getValue = (row, column) => row.cplScores[column.id] ?? 0;
                getFinalValue = row => getWeightedScore(columns.map(column => getValue(row, column)), weights);
            }

            return {
                title,
                mk,
                headers: ['No.', 'NIM', 'Nama Mahasiswa', ...columns.map(column => column.label), 'Nilai Akhir', 'Predikat'],
                rows: monitorRows.map((row, index) => {
                    const finalValue = getFinalValue(row);
                    return [index + 1, row.nim, row.name, ...columns.map(column => getValue(row, column)), finalValue, getMonitorPredicate(finalValue).label];
                })
            };
        }

        function exportMonitorToExcel() {
            const model = getMonitorExportModel(state.selectedClassKey);
            if (!model) return;
            const worksheet = XLSX.utils.aoa_to_sheet([
                [model.title],
                [`${model.mk.code} - ${model.mk.name}`],
                [],
                model.headers,
                ...model.rows
            ]);
            worksheet['!cols'] = model.headers.map((header, index) => ({ wch: index === 2 ? 28 : Math.max(12, String(header).length + 2) }));
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Monitor Nilai');
            XLSX.writeFile(workbook, `Monitor-${state.activeSubMenu}-${model.mk.code}.xlsx`);
        }

        function exportMonitorToPdf() {
            const model = getMonitorExportModel(state.selectedClassKey);
            if (!model || !window.jspdf || !window.jspdf.jsPDF) return;
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(model.title, 12, 14);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(`${model.mk.code} - ${model.mk.name}`, 12, 20);
            doc.autoTable({
                startY: 25,
                head: [model.headers],
                body: model.rows,
                theme: 'grid',
                styles: { fontSize: 7, cellPadding: 1.3, overflow: 'linebreak' },
                headStyles: { fillColor: [30, 58, 138], textColor: 255, halign: 'center' },
                columnStyles: { 0: { halign: 'center' }, 1: { fontStyle: 'bold' } },
                margin: { left: 12, right: 12 }
            });
            doc.save(`Monitor-${state.activeSubMenu}-${model.mk.code}.pdf`);
        }

        function renderMonitorView(container) {
            const classKeys = getAccessibleClassKeys('monitor');
            if (classKeys.length === 0) {
                container.innerHTML = `<div class="p-4 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 text-sm">${getCurrentRole() === 'dosen' ? 'Belum ada kelas yang diplot kepada akun Anda.' : 'Belum ada kelas perkuliahan terdaftar.'}</div>`;
                return;
            }

            if (!state.selectedClassKey || !classKeys.includes(state.selectedClassKey)) state.selectedClassKey = classKeys[0];
            const currentClassKey = state.selectedClassKey;
            const cls = state.classData[currentClassKey];
            const mk = state.mkList.find(m => m.id === cls.mkId) || { code: 'N/A', name: 'Mata Kuliah' };
            const students = cls.students || [];

            const monitorRows = getMonitoringRows(currentClassKey, students);

            let title = "Monitor Capaian Komponen Penilaian";
            if (state.activeSubMenu === 'mon_subcpmk') title = "Monitor Capaian SubCPMK";
            else if (state.activeSubMenu === 'mon_cpmk') title = "Monitor Capaian CPMK";
            else if (state.activeSubMenu === 'mon_cpl') title = "Monitor Capaian CPL";

            let html = `
                <div class="mb-4 flex flex-wrap justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div class="flex items-center space-x-2">
                        <label class="text-sm font-bold text-blue-900">Pilih Kelas Perkuliahan:</label>
                        <select onchange="state.selectedClassKey = this.value; saveState(); renderApp();" class="border font-medium rounded px-3 py-1.5 text-sm bg-white shadow-sm">
                            ${classKeys.map(k => {
                                const c = state.classData[k];
                                const m = state.mkList.find(x => x.id === c.mkId) || { code: 'N/A' };
                                return `<option value="${k}" ${k === currentClassKey ? 'selected' : ''}>[${m.code}] ${m.name} - Smt ${c.semester} - Kelas ${c.kelas}</option>`;
                            }).join('')}
                        </select>
                    </div>
                    <div class="text-xs text-blue-800"><span class="font-bold">Mata Kuliah:</span> ${mk.name} (${mk.code})</div>
                </div>
                <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h4 class="font-bold text-gray-800 text-sm flex items-center"><i class="fa-solid fa-chart-line mr-2 text-blue-800"></i> ${title}</h4>
                    <div class="flex gap-2">
                        <button onclick="exportMonitorToExcel()" class="rounded bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800"><i class="fa-solid fa-file-excel mr-1"></i>Ekspor Excel</button>
                        <button onclick="exportMonitorToPdf()" class="rounded bg-red-700 px-3 py-2 text-xs font-bold text-white hover:bg-red-800"><i class="fa-solid fa-file-pdf mr-1"></i>Ekspor PDF</button>
                    </div>
                </div>`;

            if (students.length === 0) {
                html += `<div class="p-4 bg-gray-50 text-gray-600 rounded border border-gray-200 text-xs">Belum ada mahasiswa di kelas ini.</div>`;
            } else {
                if (state.activeSubMenu === 'mon_subcpmk') {
                    const subCpmks = cls.subCpmkList || [];
                    html += `
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs text-left border border-gray-200 rounded-lg table-compact" style="w-auto;">
                                <thead class="bg-blue-900 text-white border-b">
                                    <tr>
                                        <th class="p-2.5 w-12 text-center">No</th>
                                        <th class="p-2.5 w-28">NIM</th>
                                        <th class="p-2.5 min-w-auto">Nama Mahasiswa</th>`;
                    subCpmks.forEach(sub => html += `<th class="p-2.5 text-center min-w-[120px]">${sub.code}</th>`);
                    html += `<th class="p-2.5 text-center min-w-[120px]">Nilai Akhir</th><th class="p-2.5 text-center min-w-[90px]">Predikat</th></tr></thead><tbody>`;
                    monitorRows.forEach((row, sIdx) => {
                        const subWeights = subCpmks.map(sub => Object.values(sub.weights || {}).reduce((sum, w) => sum + (parseFloat(w) || 0), 0));
                        const finalValue = subCpmks.length > 0
                            ? getWeightedScore(subCpmks.map(sub => row.subCpmkScores[sub.id] ?? 0), subWeights)
                            : 0;
                        const finalPred = getMonitorPredicate(finalValue);
                        html += `<tr class="border-b hover:bg-gray-50">
                            <td class="p-2 text-center text-gray-500 font-medium">${sIdx + 1}</td>
                            <td class="p-2 font-mono font-bold text-blue-900">${row.nim}</td>
                            <td class="p-2 font-medium">${row.name}</td>`;
                        subCpmks.forEach(sub => {
                            const value = row.subCpmkScores[sub.id] ?? 0;
                            const pred = getMonitorPredicate(value);
                            html += `<td class="p-2 text-center font-bold"><span class="px-2 py-0.5 rounded ${pred.className}">${value}</span></td>`;
                        });
                        html += `<td class="p-2 text-center font-bold text-blue-950">${finalValue}</td><td class="p-2 text-center"><span class="px-2 py-0.5 rounded ${finalPred.className}">${finalPred.label}</span></td></tr>`;
                    });
                    html += `</tbody></table></div>`;
                } else if (state.activeSubMenu === 'mon_cpmk') {
                    const cpmks = state.cpmkList[mk.id] || [];
                    html += `
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs text-left border border-gray-200 rounded-lg table-compact" style="w-auto;">
                                <thead class="bg-blue-900 text-white border-b">
                                    <tr>
                                        <th class="p-2.5 w-12 text-center">No</th>
                                        <th class="p-2.5 w-28">NIM</th>
                                        <th class="p-2.5 min-w-[180px]">Nama Mahasiswa</th>`;
                    cpmks.forEach(cpmk => html += `<th class="p-2.5 text-center min-w-[120px]">${cpmk.code}</th>`);
                    html += `<th class="p-2.5 text-center min-w-[120px]">Nilai Akhir</th><th class="p-2.5 text-center min-w-[90px]">Predikat</th></tr></thead><tbody>`;
                    monitorRows.forEach((row, sIdx) => {
                        const cpmkWeights = cpmks.map(cpmk => Object.values(cpmk.weights || {}).reduce((sum, w) => sum + (parseFloat(w) || 0), 0));
                        const finalValue = cpmks.length > 0
                            ? getWeightedScore(cpmks.map(cpmk => row.cpmkScores[cpmk.id] ?? 0), cpmkWeights)
                            : 0;
                        const finalPred = getMonitorPredicate(finalValue);
                        html += `<tr class="border-b hover:bg-gray-50">
                            <td class="p-2 text-center text-gray-500 font-medium">${sIdx + 1}</td>
                            <td class="p-2 font-mono font-bold text-blue-900">${row.nim}</td>
                            <td class="p-2 font-medium">${row.name}</td>`;
                        cpmks.forEach(cpmk => {
                            const value = row.cpmkScores[cpmk.id] ?? 0;
                            const pred = getMonitorPredicate(value);
                            html += `<td class="p-2 text-center font-bold"><span class="px-2 py-0.5 rounded ${pred.className}">${value}</span></td>`;
                        });
                        html += `<td class="p-2 text-center font-bold text-blue-950">${finalValue}</td><td class="p-2 text-center"><span class="px-2 py-0.5 rounded ${finalPred.className}">${finalPred.label}</span></td></tr>`;
                    });
                    html += `</tbody></table></div>`;
                } else if (state.activeSubMenu === 'mon_cpl') {
                    const mappedCPLs = state.cplList.filter(cpl => mk.cpls && mk.cpls.includes(cpl.id));
                    const cpmks = state.cpmkList[mk.id] || [];
                    html += `
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs text-left border border-gray-200 rounded-lg table-compact" style="w-auto;">
                                <thead class="bg-blue-900 text-white border-b">
                                    <tr>
                                        <th class="p-2.5 w-12 text-center">No</th>
                                        <th class="p-2.5 w-28">NIM</th>
                                        <th class="p-2.5 min-w-[180px]">Nama Mahasiswa</th>`;
                    mappedCPLs.forEach(cpl => html += `<th class="p-2.5 text-center min-w-[120px]">${cpl.code}</th>`);
                    html += `<th class="p-2.5 text-center min-w-[120px]">Nilai Akhir</th><th class="p-2.5 text-center min-w-[90px]">Predikat</th></tr></thead><tbody>`;
                    monitorRows.forEach((row, sIdx) => {
                        const cplWeights = mappedCPLs.map(cpl => cpmks.reduce((sum, cpmk) => sum + (parseFloat(cpmk.weights?.[cpl.id]) || 0), 0));
                        const finalValue = mappedCPLs.length > 0
                            ? getWeightedScore(mappedCPLs.map(cpl => row.cplScores[cpl.id] ?? 0), cplWeights)
                            : 0;
                        const finalPred = getMonitorPredicate(finalValue);
                        html += `<tr class="border-b hover:bg-gray-50">
                            <td class="p-2 text-center text-gray-500 font-medium">${sIdx + 1}</td>
                            <td class="p-2 font-mono font-bold text-blue-900">${row.nim}</td>
                            <td class="p-2 font-medium">${row.name}</td>`;
                        mappedCPLs.forEach(cpl => {
                            const value = row.cplScores[cpl.id] ?? 0;
                            const pred = getMonitorPredicate(value);
                            html += `<td class="p-2 text-center font-bold"><span class="px-2 py-0.5 rounded ${pred.className}">${value}</span></td>`;
                        });
                        html += `<td class="p-2 text-center font-bold text-blue-950">${finalValue}</td><td class="p-2 text-center"><span class="px-2 py-0.5 rounded ${finalPred.className}">${finalPred.label}</span></td></tr>`;
                    });
                    html += `</tbody></table></div>`;
                } else {
                    const componentTypeColumns = [...new Set((cls.komponenList || []).map(component => component.jenis || 'Lainnya'))];
                    html += `
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs text-left border border-gray-200 rounded-lg table-compact" style="w-auto;">
                                <thead class="bg-blue-900 text-white border-b">
                                    <tr>
                                        <th class="p-2.5 w-12 text-center">No</th>
                                        <th class="p-2.5 w-28">NIM</th>
                                        <th class="p-2.5 min-w-[180px]">Nama Mahasiswa</th>
                                        ${componentTypeColumns.map(type => `<th class="p-2.5 text-center min-w-[140px]">${type}</th>`).join('')}
                                        <th class="p-2.5 text-center w-32">Nilai Akhir</th>
                                        <th class="p-2.5 text-center w-28">Predikat</th>
                                    </tr>
                                </thead>
                                <tbody>`;
                    monitorRows.forEach((row, sIdx) => {
                        const pred = getMonitorPredicate(row.componentScore);
                        const componentTypeCells = componentTypeColumns.map(type => {
                            const item = row.componentTypeBreakdown?.[type];
                            const value = item && typeof item.score === 'number' ? item.score : 0;
                            return `<td class="p-2 text-center font-semibold text-slate-700">${value}</td>`;
                        }).join('');
                        html += `
                            <tr class="border-b hover:bg-gray-50">
                                <td class="p-2 text-center text-gray-500 font-medium">${sIdx + 1}</td>
                                <td class="p-2 font-mono font-bold text-blue-900">${row.nim}</td>
                                <td class="p-2 font-medium">${row.name}</td>
                                ${componentTypeCells}
                                <td class="p-2 text-center font-bold text-blue-950">${row.componentScore}</td>
                                <td class="p-2 text-center">
                                    <span class="px-2 py-0.5 rounded text-[11px] font-bold ${pred.className}">${pred.label}</span>
                                </td>
                            </tr>`;
                    });
                    html += `</tbody></table></div>`;
                }
            }
            container.innerHTML = html;
        }
