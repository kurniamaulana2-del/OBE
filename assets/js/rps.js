        function getRpsClassContext(classKey) {
            const cls = state.classData[classKey];
            if (!cls) return null;
            const mk = state.mkList.find(m => m.id === cls.mkId) || {
                id: cls.mkId,
                code: 'N/A',
                name: 'Mata Kuliah',
                semester: cls.semester || '',
                sksTeori: 0,
                sksPraktik: 0,
                totalSks: 0,
                jenis: ''
            };
            return { cls: cls, mk: mk };
        }

        function syncRpsLinkedItems(existingItems, sourceItems) {
            const existing = Array.isArray(existingItems) ? existingItems : [];
            const source = Array.isArray(sourceItems) ? sourceItems : [];
            const existingById = {};
            existing.forEach(item => {
                if (item && item.id) existingById[item.id] = item;
            });

            const next = source.map(src => {
                const found = existingById[src.id];
                return found ? {
                    id: src.id,
                    code: src.code || src.name || src.id,
                    desc: found.desc !== undefined && found.desc !== null ? found.desc : (src.desc || '')
                } : {
                    id: src.id,
                    code: src.code || src.name || src.id,
                    desc: src.desc || ''
                };
            });

            const sourceIds = {};
            source.forEach(src => { sourceIds[src.id] = true; });
            existing.forEach(item => {
                if (item && item.id && !sourceIds[item.id]) next.push(item);
            });

            return next;
        }

        function getClassInstitutionContext(classKey) {
            const cls = state.classData[classKey] || {};
            const programs = state.masterData.studyPrograms || [];
            const faculties = state.masterData.faculties || [];
            const program = programs.find(item => item.id === cls.prodiId)
                || programs.find(item => item.active)
                || programs[0];
            const faculty = program
                ? faculties.find(item => item.id === program.facultyId)
                : (faculties.find(item => item.active) || faculties[0]);
            return {
                university: 'Universitas Sunan Gresik',
                faculty: faculty ? faculty.name : '-',
                studyProgram: program ? program.name : '-'
            };
        }

        function ensureRPSData(classKey) {
            const ctx = getRpsClassContext(classKey);
            if (!ctx) return null;

            const cls = ctx.cls;
            const mk = ctx.mk;
            if (cls.rpsFinalized === undefined || cls.rpsFinalized === null) cls.rpsFinalized = false;
            if (!cls.rps) cls.rps = {};
            const rps = cls.rps;

            if (!rps.identitas) rps.identitas = {};
            const identitas = rps.identitas;
            const institution = getClassInstitutionContext(classKey);
            const lecturerNames = getLecturerAccounts()
                .filter(account => (cls.lecturerIds || []).includes(account.id))
                .map(account => account.name)
                .join('; ');
            identitas.mataKuliah = mk.name || '';
            identitas.kodeMK = mk.code || '';
            identitas.semester = cls.semester || mk.semester || '';
            identitas.universitas = institution.university;
            identitas.fakultas = institution.faculty;
            identitas.programStudi = institution.studyProgram;
            identitas.dosenPengampu = lecturerNames;
            if (identitas.logoDataUrl === undefined || identitas.logoDataUrl === null) identitas.logoDataUrl = '';
            if (identitas.rumpunMK === undefined || identitas.rumpunMK === null) identitas.rumpunMK = mk.rumpunMK || '';
            if (identitas.jenisMK === undefined || identitas.jenisMK === null) identitas.jenisMK = mk.jenis || '';
            if (identitas.moda === undefined || identitas.moda === null) identitas.moda = '';
            if (identitas.sksT === undefined || identitas.sksT === null || identitas.sksT === '') identitas.sksT = mk.sksTeori || 0;
            if (identitas.sksP === undefined || identitas.sksP === null || identitas.sksP === '') identitas.sksP = mk.sksPraktik || 0;
            if (identitas.sksPL === undefined || identitas.sksPL === null || identitas.sksPL === '') identitas.sksPL = 0;
            if (identitas.totalSKS === undefined || identitas.totalSKS === null || identitas.totalSKS === '') identitas.totalSKS = mk.totalSks || ((mk.sksTeori || 0) + (mk.sksPraktik || 0));
            if (identitas.mkPrasyarat === undefined || identitas.mkPrasyarat === null) identitas.mkPrasyarat = '';
            if (identitas.menjadiPrasyarat === undefined || identitas.menjadiPrasyarat === null) identitas.menjadiPrasyarat = '';
            if (identitas.integrasiAntarMK === undefined || identitas.integrasiAntarMK === null) identitas.integrasiAntarMK = '';
            if (identitas.tanggalPenyusunan === undefined || identitas.tanggalPenyusunan === null) identitas.tanggalPenyusunan = '';
            if (identitas.tanggalRevisi === undefined || identitas.tanggalRevisi === null) identitas.tanggalRevisi = '';
            if (identitas.deskripsiMK === undefined || identitas.deskripsiMK === null) identitas.deskripsiMK = '';
            if (identitas.tautanKelasDaring === undefined || identitas.tautanKelasDaring === null) identitas.tautanKelasDaring = '';
            if (identitas.bahasaPengantar === undefined || identitas.bahasaPengantar === null) identitas.bahasaPengantar = 'Indonesia';
            if (!identitas.pengesahan) identitas.pengesahan = {};
            const kaprodiAccount = state.accounts.find(account =>
                account.active && account.prodiId === cls.prodiId && account.role === 'kaprodi'
            );
            const gkmAccount = state.accounts.find(account =>
                account.active && account.prodiId === cls.prodiId && account.role === 'gkm'
            );
            const pjmkAccount = state.accounts.find(account =>
                account.active && account.id === cls.pjmkLecturerId && (cls.lecturerIds || []).includes(account.id)
            );
            identitas.pengesahan.dosenPengembangNama = pjmkAccount ? pjmkAccount.name : '';
            identitas.pengesahan.dosenPengembangNUPTK = pjmkAccount ? (pjmkAccount.nuptk || '') : '';
            if (identitas.pengesahan.koordinatorRumpunMKNama === undefined || identitas.pengesahan.koordinatorRumpunMKNama === null) identitas.pengesahan.koordinatorRumpunMKNama = identitas.pengesahan.koordinatorRumpunMK || '';
            if (identitas.pengesahan.koordinatorRumpunMKNUPTK === undefined || identitas.pengesahan.koordinatorRumpunMKNUPTK === null) identitas.pengesahan.koordinatorRumpunMKNUPTK = '';
            identitas.pengesahan.ketuaProgramStudiNama = kaprodiAccount ? kaprodiAccount.name : '';
            identitas.pengesahan.ketuaProgramStudiNUPTK = kaprodiAccount ? (kaprodiAccount.nuptk || '') : '';
            if (identitas.pengesahan.tanggalValidasi === undefined || identitas.pengesahan.tanggalValidasi === null) identitas.pengesahan.tanggalValidasi = '';
            identitas.pengesahan.gugusKendaliMutuNama = gkmAccount ? gkmAccount.name : '';
            identitas.pengesahan.gugusKendaliMutuNUPTK = gkmAccount ? (gkmAccount.nuptk || '') : '';
            identitas.pengesahan.dosenPJMKNama = pjmkAccount ? pjmkAccount.name : '';
            identitas.pengesahan.dosenPJMKNUPTK = pjmkAccount ? (pjmkAccount.nuptk || '') : '';
            identitas.pengesahan.dosenPengembang = identitas.pengesahan.dosenPengembangNama;
            if (identitas.pengesahan.koordinatorRumpunMK === undefined) identitas.pengesahan.koordinatorRumpunMK = identitas.pengesahan.koordinatorRumpunMKNama;
            if (identitas.pengesahan.kaprodi === undefined) identitas.pengesahan.kaprodi = identitas.pengesahan.ketuaProgramStudiNama;

            rps.cplItems = syncRpsLinkedItems(rps.cplItems, state.cplList);
            rps.cpmkItems = syncRpsLinkedItems(rps.cpmkItems, state.cpmkList[mk.id] || []);
            rps.subcpmkItems = syncRpsLinkedItems(rps.subcpmkItems, cls.subCpmkList || []);

            if (!Array.isArray(rps.bahanKajianItems) || rps.bahanKajianItems.length === 0) {
                rps.bahanKajianItems = [{ id: 'BK_' + Date.now(), isi: '' }];
            }
            if (ensureItemIds(rps.bahanKajianItems, 'BK')) saveState();

            if (!Array.isArray(rps.daftarPustakaItems)) {
                rps.daftarPustakaItems = [];
            }
            if (ensureItemIds(rps.daftarPustakaItems, 'DP')) saveState();
            if (!rps.rubricSetups || typeof rps.rubricSetups !== 'object' || Array.isArray(rps.rubricSetups)) {
                rps.rubricSetups = {};
            }

            if (!Array.isArray(rps.weeklyPlan)) {
                if (Array.isArray(rps.weeklyMatrix)) rps.weeklyPlan = rps.weeklyMatrix;
                else rps.weeklyPlan = [];
            }
            let assessmentInstrumentMigrated = false;
            rps.weeklyPlan.forEach((row, rowIdx) => {
                if (!row) return;
                if (row.topik === undefined || row.topik === null) row.topik = '';
                if (!Array.isArray(row.weekSelections)) {
                    row.weekSelections = row.mingguKe !== undefined && row.mingguKe !== null && row.mingguKe !== ''
                        ? [String(row.mingguKe)]
                        : [];
                }
                row.weekSelections = row.weekSelections
                    .map(value => String(value).toUpperCase())
                    .filter((value, idx, values) => WEEKLY_WEEK_OPTIONS.includes(value) && values.indexOf(value) === idx);
                if (row.weekSelections.includes('UTS')) row.weekSelections = ['UTS'];
                else if (row.weekSelections.includes('UAS')) row.weekSelections = ['UAS'];
                row.mingguKe = row.weekSelections.length > 0 ? row.weekSelections.join(', ') : '';
                if (!Array.isArray(row.subcpmkIds)) {
                    row.subcpmkIds = row.subcpmkId ? [row.subcpmkId] : [];
                }
                row.subcpmkIds = row.subcpmkIds.filter((id, idx, arr) => id && arr.indexOf(id) === idx);
                row.subcpmkId = row.subcpmkIds.length > 0 ? row.subcpmkIds[0] : (row.subcpmkId || '');
                if (!row.subcpmkWeights || typeof row.subcpmkWeights !== 'object') row.subcpmkWeights = {};
                if (row.bobotPenilaian !== undefined && row.bobotPenilaian !== null && row.bobotPenilaian !== '') {
                    const legacyWeight = parseFloat(row.bobotPenilaian) || 0;
                    if (row.subcpmkIds.length === 1 && row.subcpmkWeights[row.subcpmkIds[0]] === undefined) {
                        row.subcpmkWeights[row.subcpmkIds[0]] = legacyWeight;
                    }
                }
                if (!Array.isArray(row.bahanKajianIds)) {
                    row.bahanKajianIds = row.bahanKajianId ? [row.bahanKajianId] : [];
                }
                row.bahanKajianIds = row.bahanKajianIds.filter((id, idx, arr) => id && arr.indexOf(id) === idx);
                if (row.bahanKajianId === undefined || row.bahanKajianId === null) row.bahanKajianId = '';
                row.bahanKajianId = row.bahanKajianIds.length > 0 ? row.bahanKajianIds[0] : row.bahanKajianId;

                if (!Array.isArray(row.daftarPustakaIds)) {
                    row.daftarPustakaIds = row.daftarPustakaId ? [row.daftarPustakaId] : [];
                }
                row.daftarPustakaIds = row.daftarPustakaIds.filter((id, idx, arr) => id && arr.indexOf(id) === idx);
                if (row.daftarPustakaId === undefined || row.daftarPustakaId === null) row.daftarPustakaId = '';
                row.daftarPustakaId = row.daftarPustakaIds.length > 0 ? row.daftarPustakaIds[0] : row.daftarPustakaId;
                if (!Array.isArray(row.assessmentComponents)) row.assessmentComponents = [];
                if (!Array.isArray(row.assessmentCriteria)) row.assessmentCriteria = [];
                row.assessmentCriteria = row.assessmentCriteria.filter(Boolean).map((criterion, criterionIdx) => ({
                    id: criterion.id || ('WCRIT_' + Date.now() + '_' + criterionIdx),
                    type: criterion.type || '',
                    label: criterion.label || criterion.type || ''
                }));
                row.assessmentComponents = row.assessmentComponents.filter(Boolean).map((component, componentIdx) => {
                    const legacyCriterion = row.assessmentCriteria[0] || null;
                    const criterionType = component.criterionType || (legacyCriterion ? legacyCriterion.type : '');
                    const criterionLabel = component.criterionLabel || (legacyCriterion ? legacyCriterion.label : '');
                    const hasStoredInstrument = Object.prototype.hasOwnProperty.call(component, 'assessmentInstrument');
                    const assessmentInstrument = hasStoredInstrument
                        ? (['Formatif', 'Sumatif'].includes(component.assessmentInstrument) ? component.assessmentInstrument : '')
                        : (component.summativeCriterion ? 'Sumatif' : 'Formatif');
                    if (component.formativeCriterion === undefined || component.summativeCriterion === undefined) {
                        assessmentInstrumentMigrated = true;
                    }
                    return {
                        id: component.id || ('WCOMP_' + rowIdx + '_' + componentIdx + '_' + Date.now()),
                        technique: component.technique === 'non_tes' ? 'non_tes' : 'tes',
                        name: component.name || '',
                        jenis: component.jenis || 'Tugas',
                        weight: parseFloat(component.weight) || 0,
                        criterionType: criterionType,
                        criterionLabel: criterionLabel,
                        assignmentScope: component.assignmentScope || '',
                        assignmentInstructions: component.assignmentInstructions || '',
                        assignmentMethod: component.assignmentMethod || '',
                        performanceEvidence: component.performanceEvidence || '',
                        durationDeadline: component.durationDeadline || '',
                        assessmentNotes: component.assessmentNotes || '',
                        assessmentInstrument: assessmentInstrument,
                        formativeCriterion: component.formativeCriterion !== undefined
                            ? component.formativeCriterion
                            : (assessmentInstrument === 'Formatif' ? criterionLabel : ''),
                        summativeCriterion: component.summativeCriterion !== undefined
                            ? component.summativeCriterion
                            : (assessmentInstrument === 'Sumatif' ? criterionLabel : '')
                    };
                });
            });
            if (!Array.isArray(cls.komponenList)) cls.komponenList = [];
            cls.komponenList.forEach(component => {
                const criterionLabel = component.criterionLabel || (Array.isArray(component.criteria) ? component.criteria[0] : '') || '';
                const hasStoredInstrument = Object.prototype.hasOwnProperty.call(component, 'assessmentInstrument');
                const assessmentInstrument = hasStoredInstrument
                    ? (['Formatif', 'Sumatif'].includes(component.assessmentInstrument) ? component.assessmentInstrument : '')
                    : (component.summativeCriterion ? 'Sumatif' : 'Formatif');
                if (!hasStoredInstrument) {
                    component.assessmentInstrument = assessmentInstrument;
                    assessmentInstrumentMigrated = true;
                }
                if (component.formativeCriterion === undefined) {
                    component.formativeCriterion = assessmentInstrument === 'Formatif' ? criterionLabel : '';
                    assessmentInstrumentMigrated = true;
                }
                if (component.summativeCriterion === undefined) {
                    component.summativeCriterion = assessmentInstrument === 'Sumatif' ? criterionLabel : '';
                    assessmentInstrumentMigrated = true;
                }
                if (!component.criterionType && criterionLabel) component.criterionType = criterionLabel;
                if (!component.criterionLabel && criterionLabel) component.criterionLabel = criterionLabel;
            });
            if (assessmentInstrumentMigrated) saveState();
            const isLegacyBlankWeeklyMatrix = rps.weeklyPlan.length === 16 && rps.weeklyPlan.every((row, idx) => {
                if (!row) return false;
                const blankFields = (
                    (row.subcpmk === undefined || row.subcpmk === null || row.subcpmk === '') &&
                    (row.subcpmkId === undefined || row.subcpmkId === null || row.subcpmkId === '') &&
                    (row.indikatorPenilaian === undefined || row.indikatorPenilaian === null || row.indikatorPenilaian === '') &&
                    (row.teknikKriteria === undefined || row.teknikKriteria === null || row.teknikKriteria === '') &&
                    (row.metodePembelajaranDaring === undefined || row.metodePembelajaranDaring === null || row.metodePembelajaranDaring === '') &&
                    (row.metodePembelajaranLuring === undefined || row.metodePembelajaranLuring === null || row.metodePembelajaranLuring === '') &&
                    (row.materiPembelajaran === undefined || row.materiPembelajaran === null || row.materiPembelajaran === '') &&
                    (row.bobotPenilaian === undefined || row.bobotPenilaian === null || row.bobotPenilaian === '')
                );
                return blankFields && (row.mingguKe === idx + 1 || row.mingguKe === String(idx + 1));
            });
            if (isLegacyBlankWeeklyMatrix) rps.weeklyPlan = [];
            if (rps.weeklyMatrix) delete rps.weeklyMatrix;

            if (!rps.matrixCpmkCpl) rps.matrixCpmkCpl = {};
            if (!rps.matrixSubcpmkCpmk) rps.matrixSubcpmkCpmk = {};
            if (!rps.evaluasiMatrix) rps.evaluasiMatrix = {};
            if (cls.weeklyMatrixFinalized === undefined) cls.weeklyMatrixFinalized = false;
            if (cls.weeklyDraftSaved === undefined) cls.weeklyDraftSaved = false;
            if (cls.weeklyDraftDirty === undefined) cls.weeklyDraftDirty = false;

            const cpmks = rps.cpmkItems;
            const cpls = rps.cplItems;
            cpmks.forEach(cpmk => {
                if (!rps.matrixCpmkCpl[cpmk.id]) rps.matrixCpmkCpl[cpmk.id] = {};
                cpls.forEach(cpl => {
                    if (rps.matrixCpmkCpl[cpmk.id][cpl.id] === undefined) {
                        const sourceCpmk = (state.cpmkList[mk.id] || []).find(item => item.id === cpmk.id);
                        rps.matrixCpmkCpl[cpmk.id][cpl.id] = sourceCpmk && sourceCpmk.weights ? (sourceCpmk.weights[cpl.id] || 0) : 0;
                    }
                });
            });

            const subcpmks = rps.subcpmkItems;
            const sourceSubList = cls.subCpmkList || [];
            subcpmks.forEach(sub => {
                if (!rps.matrixSubcpmkCpmk[sub.id]) rps.matrixSubcpmkCpmk[sub.id] = {};
                cpmks.forEach(cpmk => {
                    if (rps.matrixSubcpmkCpmk[sub.id][cpmk.id] === undefined) {
                        const sourceSub = sourceSubList.find(item => item.id === sub.id);
                        rps.matrixSubcpmkCpmk[sub.id][cpmk.id] = sourceSub && sourceSub.weights ? (sourceSub.weights[cpmk.id] || 0) : 0;
                    }
                });
            });

            const sourceKomponen = cls.komponenList || [];
            sourceKomponen.forEach(komp => {
                if (!rps.evaluasiMatrix[komp.id]) rps.evaluasiMatrix[komp.id] = {};
                subcpmks.forEach(sub => {
                    if (rps.evaluasiMatrix[komp.id][sub.id] === undefined) {
                        rps.evaluasiMatrix[komp.id][sub.id] = komp.weights ? (komp.weights[sub.id] || 0) : 0;
                    }
                });
            });

            return ctx;
        }

        function autoResizeTextarea(textarea) {
            if (!textarea) return;
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }

        function normalizeSequentialCodes(items, prefix) {
            if (!Array.isArray(items)) return false;
            let changed = false;
            items.forEach((item, idx) => {
                if (!item) return;
                const expected = prefix + ' ' + (idx + 1);
                if (item.code !== expected) {
                    item.code = expected;
                    changed = true;
                }
            });
            return changed;
        }

        function ensureItemIds(items, prefix) {
            if (!Array.isArray(items)) return false;
            let changed = false;
            items.forEach((item, idx) => {
                if (!item) return;
                const expectedId = prefix + '_' + (idx + 1);
                if (!item.id) {
                    item.id = expectedId;
                    changed = true;
                }
            });
            return changed;
        }

        function getRpsWeeklySubcpmkIds(row) {
            if (!row) return [];
            if (Array.isArray(row.subcpmkIds)) return row.subcpmkIds.filter(Boolean);
            if (typeof row.subcpmkIds === 'string' && row.subcpmkIds) {
                return row.subcpmkIds.split('|').map(item => item.trim()).filter(Boolean);
            }
            if (row.subcpmkId) return [row.subcpmkId];
            return [];
        }

        function getWeeklySelectionIds(row, listField, fallbackField) {
            if (!row) return [];
            if (Array.isArray(row[listField])) return row[listField].filter(Boolean);
            if (typeof row[listField] === 'string' && row[listField]) {
                return row[listField].split('|').map(item => item.trim()).filter(Boolean);
            }
            if (row[fallbackField]) return [row[fallbackField]];
            return [];
        }

        function getSortedDaftarPustakaOptions(items) {
            const jenisOrder = { utama: 0, pendukung: 1 };
            return (items || [])
                .map((item, index) => ({ item: item, index: index }))
                .filter(entry => entry.item && entry.item.id)
                .sort((a, b) => {
                    const aJenis = a.item.jenis || 'utama';
                    const bJenis = b.item.jenis || 'utama';
                    const jenisDiff = (jenisOrder[aJenis] !== undefined ? jenisOrder[aJenis] : 99) - (jenisOrder[bJenis] !== undefined ? jenisOrder[bJenis] : 99);
                    if (jenisDiff !== 0) return jenisDiff;
                    return a.index - b.index;
                })
                .map(entry => entry.item);
        }

        const WEEKLY_COMPONENT_TYPES = ['Aktivitas Partisipatif', 'Hasil Proyek', 'Tugas', 'Kuis', 'UTS', 'UAS'];
        const WEEKLY_CRITERIA_TYPES = ['Rubrik Holistik', 'Rubrik Analitik', 'Rubrik Skala Persepsi', 'Portofolio', 'Kriteria Lainnya'];
        const WEEKLY_WEEK_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', 'UTS', 'UAS'];

        function getWeeklyAssessmentComponents(row, technique) {
            const components = row && Array.isArray(row.assessmentComponents) ? row.assessmentComponents : [];
            return technique ? components.filter(component => component.technique === technique) : components;
        }

        function getWeeklyAssessmentWeight(row) {
            return getWeeklyAssessmentComponents(row).reduce((total, component) => total + (parseFloat(component.weight) || 0), 0);
        }

        function getWeeklyComponentCriterion(component) {
            if (!component || !component.criterionLabel) return '';
            return component.criterionLabel;
        }

        function getWeeklyWeekSelections(row) {
            if (!row) return [];
            if (Array.isArray(row.weekSelections)) return row.weekSelections.filter(value => WEEKLY_WEEK_OPTIONS.includes(String(value)));
            if (row.mingguKe !== undefined && row.mingguKe !== null && row.mingguKe !== '') {
                return String(row.mingguKe).split(',').map(value => value.trim().toUpperCase()).filter(value => WEEKLY_WEEK_OPTIONS.includes(value));
            }
            return [];
        }

        function getWeeklyNextAvailableWeekNumber(rows, rowIdx) {
            var maxWeek = 0;
            (rows || []).slice(0, rowIdx).forEach(function (row) {
                getWeeklyWeekSelections(row).forEach(function (value) {
                    var parsed = parseInt(value, 10);
                    if (Number.isFinite(parsed) && parsed > maxWeek) maxWeek = parsed;
                });
            });
            return maxWeek + 1;
        }

        function isWeeklyExamRow(row) {
            const selections = getWeeklyWeekSelections(row);
            return selections.length === 1 && (selections[0] === 'UTS' || selections[0] === 'UAS');
        }

        function getWeeklyExamLabel(row) {
            const examType = getWeeklyWeekSelections(row)[0];
            if (examType === 'UTS') return 'Ujian Tengah Semester';
            if (examType === 'UAS') return 'Ujian Akhir Semester';
            return '';
        }

        function getWeeklyExamWeekNumber(rows, rowIdx) {
            return getWeeklyNextAvailableWeekNumber(rows, rowIdx);
        }

        function markWeeklyDraftDirty(ctx) {
            if (!ctx || !ctx.cls) return;
            ctx.cls.weeklyDraftDirty = true;
        }

        function escapeHtml(value) {
            return String(value === undefined || value === null ? '' : value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function getRpsSubcpmkLabel(classKey, subcpmkId) {
            const ctx = getRpsClassContext(classKey);
            if (!ctx || !subcpmkId) return subcpmkId || '';
            const found = (ctx.cls.subCpmkList || []).find(item => item.id === subcpmkId);
            return found ? found.code : subcpmkId;
        }

        function getRpsWeeklySubcpmkStatus(classKey, row, excludeIndex) {
            const subcpmkIds = getRpsWeeklySubcpmkIds(row);
            if (subcpmkIds.length === 0) {
                return { text: 'Pilih SubCPMK', isOver: false, subcpmkIds: [], total: 0 };
            }

            const validations = getRpsWeeklySubcpmkValidations(classKey, row, excludeIndex);
            const total = validations.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
            return {
                text: `Total: ${total}%`,
                isOver: validations.some(item => item.isOver),
                subcpmkIds: subcpmkIds,
                total: total,
                validations: validations
            };
        }

        function getRpsCpmkList(classKey) {
            const ctx = getRpsClassContext(classKey);
            if (!ctx) return [];
            return state.cpmkList[ctx.mk.id] || [];
        }

        function getRpsSubcpmkTargetTotal(classKey, subcpmkId) {
            const ctx = getRpsClassContext(classKey);
            if (!ctx || !subcpmkId) return 0;
            const totals = getSubCpmkReferenceTotals(ctx.cls, getRpsCpmkList(classKey));
            return totals[subcpmkId] || 0;
        }

        function getRpsWeeklyUsedTotal(classKey, subcpmkId, excludeIndex) {
            const ctx = getRpsClassContext(classKey);
            if (!ctx || !subcpmkId) return 0;
            let total = 0;
            (ctx.cls.rps && ctx.cls.rps.weeklyPlan ? ctx.cls.rps.weeklyPlan : []).forEach((row, idx) => {
                if (idx === excludeIndex) return;
                const selectedIds = getRpsWeeklySubcpmkIds(row);
                if (selectedIds.indexOf(subcpmkId) !== -1) total += (parseFloat(getRpsWeeklySubcpmkWeight(row, subcpmkId)) || 0);
            });
            return total;
        }

        function getRpsWeeklySubcpmkValidations(classKey, row, excludeIndex) {
            const subcpmkIds = getRpsWeeklySubcpmkIds(row);
            return subcpmkIds.map(subcpmkId => {
                const targetTotal = getRpsSubcpmkTargetTotal(classKey, subcpmkId);
                const weight = parseFloat(getRpsWeeklySubcpmkWeight(row, subcpmkId)) || 0;
                const usedOther = getRpsWeeklyUsedTotal(classKey, subcpmkId, excludeIndex);
                const usedTotal = usedOther + weight;
                return {
                    subcpmkId: subcpmkId,
                    label: getRpsSubcpmkLabel(classKey, subcpmkId),
                    targetTotal: targetTotal,
                    usedTotal: usedTotal,
                    weight: weight,
                    isOver: targetTotal > 0 ? usedTotal > targetTotal : weight > 0
                };
            });
        }

        function getRpsWeeklySubcpmkWeight(row, subcpmkId) {
            if (!row || !subcpmkId) return 0;
            if (getWeeklyAssessmentComponents(row).length > 0) {
                return getWeeklyAssessmentWeight(row);
            }
            if (row.subcpmkWeights && row.subcpmkWeights[subcpmkId] !== undefined && row.subcpmkWeights[subcpmkId] !== '') {
                return row.subcpmkWeights[subcpmkId];
            }
            return row.bobotPenilaian || 0;
        }

        function addRpsWeeklyRow(classKey) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || ctx.cls.weeklyMatrixFinalized) return;
            if (!Array.isArray(ctx.cls.rps.weeklyPlan)) ctx.cls.rps.weeklyPlan = [];
            ctx.cls.rps.weeklyPlan.push({
                id: 'WEEK_' + Date.now(),
                mingguKe: '',
                topik: '',
                subcpmkId: '',
                subcpmkIds: [],
                subcpmkWeights: {},
                indikatorPenilaian: '',
                teknikKriteria: '',
                metodePembelajaranDaring: '',
                metodePembelajaranLuring: '',
                bahanKajianIds: [],
                bahanKajianId: '',
                daftarPustakaIds: [],
                daftarPustakaId: '',
                assessmentComponents: [],
                assessmentCriteria: [],
                weekSelections: [],
                materiPembelajaran: '',
                bobotPenilaian: ''
            });
            markWeeklyDraftDirty(ctx);
            saveState();
            renderApp();
        }

        function toggleRpsWeeklySelection(classKey, idx, listField, fallbackField, itemId) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || ctx.cls.weeklyMatrixFinalized || !ctx.cls.rps.weeklyPlan || !ctx.cls.rps.weeklyPlan[idx] || !itemId) return;
            const row = ctx.cls.rps.weeklyPlan[idx];
            const current = getWeeklySelectionIds(row, listField, fallbackField);
            const existingIndex = current.indexOf(itemId);
            if (existingIndex >= 0) current.splice(existingIndex, 1);
            else current.push(itemId);
            row[listField] = current;
            row[fallbackField] = current.length > 0 ? current[0] : '';
            markWeeklyDraftDirty(ctx);
            saveState();
            renderApp();
        }

        function toggleRpsWeeklyWeek(classKey, idx, weekValue) {
            openWeeklyWeekModal(classKey, idx);
        }

        function openWeeklyWeekModal(classKey, idx) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || ctx.cls.weeklyMatrixFinalized || !ctx.cls.rps.weeklyPlan || !ctx.cls.rps.weeklyPlan[idx]) return;
            let startWeek = 1;
            (ctx.cls.rps.weeklyPlan || []).slice(0, idx).forEach(function (row) {
                const selections = getWeeklyWeekSelections(row);
                if (selections.length === 1 && (selections[0] === 'UTS' || selections[0] === 'UAS')) {
                    const examWeek = getWeeklyExamWeekNumber(ctx.cls.rps.weeklyPlan, ctx.cls.rps.weeklyPlan.indexOf(row));
                    if (Number.isFinite(examWeek) && examWeek >= startWeek) startWeek = examWeek + 1;
                    return;
                }
                selections.forEach(function (value) {
                    const parsed = parseInt(value, 10);
                    if (Number.isFinite(parsed) && parsed >= startWeek) startWeek = parsed + 1;
                });
            });
            activeWeeklyWeekModal = {
                classKey: classKey,
                idx: idx,
                selection: getWeeklyWeekSelections(ctx.cls.rps.weeklyPlan[idx]),
                locked: !!ctx.cls.weeklyMatrixFinalized,
                startWeek: startWeek
            };
            renderWeeklyWeekModal();
        }

        function closeWeeklyWeekModal() {
            activeWeeklyWeekModal = null;
            const modalRoot = document.getElementById('app-modal-root');
            if (modalRoot) modalRoot.innerHTML = '';
        }

        function getWeeklyModalSelectionSummary(selection) {
            if (!selection || selection.length === 0) return '- Pilih Minggu -';
            if (selection.length === 1 && (selection[0] === 'UTS' || selection[0] === 'UAS')) return selection[0];
            var numeric = selection.filter(value => value !== 'UTS' && value !== 'UAS');
            if (numeric.length > 0) return numeric.join(',');
            return selection.join(',');
        }

        function getWeeklyModalNumericSelection(selection) {
            return (selection || []).filter(value => value !== 'UTS' && value !== 'UAS').sort((a, b) => Number(a) - Number(b));
        }

        function setWeeklyModalNumericWeek(weekValue) {
            if (!activeWeeklyWeekModal || activeWeeklyWeekModal.locked) return;
            var weekNumber = parseInt(weekValue, 10);
            if (!Number.isFinite(weekNumber) || weekNumber < 1 || weekNumber > 16) return;
            var startWeek = activeWeeklyWeekModal.startWeek || 1;
            if (weekNumber < startWeek) return;
            var selection = [];
            for (var i = startWeek; i <= weekNumber; i += 1) selection.push(String(i));
            activeWeeklyWeekModal.selection = selection;
            renderWeeklyWeekModal();
        }

        function setWeeklyModalExamWeek(weekValue) {
            if (!activeWeeklyWeekModal || activeWeeklyWeekModal.locked) return;
            if (weekValue !== 'UTS' && weekValue !== 'UAS') return;
            activeWeeklyWeekModal.selection = [weekValue];
            renderWeeklyWeekModal();
        }

        function renderWeeklyWeekModal() {
            if (!activeWeeklyWeekModal) return;
            var ctx = ensureRPSData(activeWeeklyWeekModal.classKey);
            if (!ctx || !ctx.cls.rps.weeklyPlan || !ctx.cls.rps.weeklyPlan[activeWeeklyWeekModal.idx]) return;
            var modalRoot = document.getElementById('app-modal-root');
            if (!modalRoot) return;
            var selection = activeWeeklyWeekModal.selection || [];
            var numericSelection = getWeeklyModalNumericSelection(selection);
            var examValue = selection.length === 1 && (selection[0] === 'UTS' || selection[0] === 'UAS') ? selection[0] : '';
            var examWeek = examValue ? getWeeklyExamWeekNumber(ctx.cls.rps.weeklyPlan, activeWeeklyWeekModal.idx) : '';
            var takenWeeks = {};
            (ctx.cls.rps.weeklyPlan || []).slice(0, activeWeeklyWeekModal.idx).forEach(function (row) {
                var rowSelections = getWeeklyWeekSelections(row);
                if (rowSelections.length === 1 && (rowSelections[0] === 'UTS' || rowSelections[0] === 'UAS')) {
                    var rowExamWeek = getWeeklyExamWeekNumber(ctx.cls.rps.weeklyPlan, ctx.cls.rps.weeklyPlan.indexOf(row));
                    if (Number.isFinite(rowExamWeek)) takenWeeks[String(rowExamWeek)] = true;
                    takenWeeks[rowSelections[0]] = true;
                    return;
                }
                rowSelections.forEach(function (value) {
                    takenWeeks[value] = true;
                });
            });
            modalRoot.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div class="flex items-center justify-between px-5 py-4 border-b">
                            <div>
                                <h3 class="font-bold text-gray-800">Pilih Minggu ke</h3>
                                <p class="text-xs text-gray-500">Pilihan harus berurutan tanpa loncatan. UTS/UAS hanya satu pilihan.</p>
                            </div>
                            <button type="button" onclick="closeWeeklyWeekModal()" class="text-gray-500 hover:text-red-600"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <div class="p-5 space-y-4">
                            <div class="rounded border bg-gray-50 p-3">
                                <div class="text-xs font-semibold text-gray-600 mb-2">Pilihan mingguan 1-16</div>
                                <div class="grid grid-cols-4 sm:grid-cols-8 gap-2">
                                    ${Array.from({ length: 16 }, function (_, idxWeek) {
                                        var value = String(idxWeek + 1);
                                        var checked = numericSelection.indexOf(value) >= 0;
                                        var disabled = activeWeeklyWeekModal.locked || (idxWeek + 1 < (activeWeeklyWeekModal.startWeek || 1)) || takenWeeks[value];
                                        return `<button type="button" ${disabled ? 'disabled' : ''} onclick="setWeeklyModalNumericWeek('${value}')" class="rounded border px-2 py-1 text-xs font-semibold ${checked ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}" style="${disabled && !checked ? 'background-color:#d1d5db;color:#4b5563;border-color:#9ca3af;' : ''}">${value}</button>`;
                                    }).join('')}
                                </div>
                                <div class="text-[10px] text-gray-500 mt-2">Klik angka untuk mengisi berurutan sampai angka itu. Klik angka terakhir yang terpilih untuk mengurangi satu tingkat.</div>
                            </div>
                            <div class="rounded border bg-gray-50 p-3">
                                <div class="text-xs font-semibold text-gray-600 mb-2">UTS / UAS</div>
                                <div class="flex flex-wrap gap-2">
                                    <button type="button" ${activeWeeklyWeekModal.locked || takenWeeks.UTS ? 'disabled' : ''} onclick="setWeeklyModalExamWeek('UTS')" class="rounded border px-3 py-2 text-xs font-semibold ${examValue === 'UTS' ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}">UTS</button>
                                    <button type="button" ${activeWeeklyWeekModal.locked || takenWeeks.UAS ? 'disabled' : ''} onclick="setWeeklyModalExamWeek('UAS')" class="rounded border px-3 py-2 text-xs font-semibold ${examValue === 'UAS' ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}">UAS</button>
                                </div>
                                <div class="text-[10px] text-gray-500 mt-2">${examValue ? ('Akan ditampilkan sebagai baris ' + examValue + ' pada minggu ' + examWeek + '.') : 'Pilih satu untuk membuat baris ujian tunggal.'}</div>
                            </div>
                            <div class="rounded border p-3">
                                <div class="text-xs font-semibold text-gray-600">Ringkasan</div>
                                <div class="mt-1 text-sm font-bold text-blue-900">${escapeHtml(getWeeklyModalSelectionSummary(selection))}</div>
                            </div>
                            <div class="flex justify-end gap-2">
                                <button type="button" onclick="closeWeeklyWeekModal()" class="text-xs px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">Batal</button>
                                <button type="button" onclick="saveWeeklyWeekModal()" class="text-xs px-4 py-2 rounded bg-blue-700 text-white hover:bg-blue-800 font-semibold">Simpan</button>
                            </div>
                        </div>
                    </div>
                </div>`;
        }

        function saveWeeklyWeekModal() {
            if (!activeWeeklyWeekModal) return;
            var ctx = ensureRPSData(activeWeeklyWeekModal.classKey);
            var row = ctx && ctx.cls.rps.weeklyPlan ? ctx.cls.rps.weeklyPlan[activeWeeklyWeekModal.idx] : null;
            if (!row) return;
            var selection = activeWeeklyWeekModal.selection || [];
            if (selection.length === 0) {
                alert('Pilih minggu terlebih dahulu.');
                return;
            }
            if (selection.length === 1 && (selection[0] === 'UTS' || selection[0] === 'UAS')) {
                if (getWeeklyAssessmentComponents(row).length > 0) {
                    alert('Hapus seluruh komponen penilaian pada baris ini sebelum mengubahnya menjadi baris ' + selection[0] + '.');
                    return;
                }
                row.weekSelections = [selection[0]];
                row.mingguKe = selection[0];
                row.subcpmkId = '';
                row.subcpmkIds = [];
            } else {
                var numeric = getWeeklyModalNumericSelection(selection);
                if (numeric.length === 0) {
                    alert('Pilih minggu angka atau UTS/UAS.');
                    return;
                }
                var startWeek = activeWeeklyWeekModal.startWeek || 1;
                if (numeric[0] !== String(startWeek)) {
                    alert('Pilihan minggu harus dimulai dari minggu berikutnya yang masih kosong.');
                    return;
                }
                row.weekSelections = numeric;
                row.mingguKe = numeric.join(', ');
            }
            markWeeklyDraftDirty(ctx);
            saveState();
            closeWeeklyWeekModal();
            renderApp();
        }

        function renderWeeklyWeekPicker(classKey, row, idx, isLocked) {
            var selectedWeeks = getWeeklyWeekSelections(row);
            var summary = getWeeklyModalSelectionSummary(selectedWeeks);
            return `
                <button type="button" ${isLocked ? 'disabled' : ''} onclick="openWeeklyWeekModal('${classKey}', ${idx})" class="w-full border rounded px-2 py-1 bg-white text-xs text-left flex items-center justify-between ${isLocked ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-50'}">
                    <span>${escapeHtml(summary)}</span>
                    <i class="fa-solid fa-calendar-days text-[10px] text-gray-400"></i>
                </button>`;
        }

        function closeWeeklyEntryModal() {
            const modalRoot = document.getElementById('app-modal-root');
            if (modalRoot) modalRoot.innerHTML = '';
        }

        function openWeeklyComponentModal(classKey, rowIdx, technique, componentId) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || ctx.cls.weeklyMatrixFinalized || !ctx.cls.rps.weeklyPlan[rowIdx]) return;
            const row = ctx.cls.rps.weeklyPlan[rowIdx];
            if (!row.subcpmkId) {
                alert('Pilih SubCPMK pada baris pertemuan terlebih dahulu.');
                return;
            }
            const components = getWeeklyAssessmentComponents(row, technique);
            const editingComponent = componentId ? components.find(component => component.id === componentId) : null;
            activeWeeklyComponentModal = {
                classKey: classKey,
                rowIdx: rowIdx,
                technique: technique,
                componentId: componentId || '',
                editing: !!editingComponent
            };
            renderWeeklyComponentModal();
        }

        function closeWeeklyComponentModal() {
            activeWeeklyComponentModal = null;
            const modalRoot = document.getElementById('app-modal-root');
            if (modalRoot) modalRoot.innerHTML = '';
        }

        function toggleWeeklyComponentOtherCriterionInput() {
            const select = document.getElementById('weekly-component-criterion-type');
            const wrap = document.getElementById('weekly-component-other-criterion-wrap');
            if (select && wrap) wrap.classList.toggle('hidden', select.value !== 'Kriteria Lainnya');
        }

        function renderWeeklyComponentModal() {
            if (!activeWeeklyComponentModal) return;
            const ctx = ensureRPSData(activeWeeklyComponentModal.classKey);
            if (!ctx || !ctx.cls.rps.weeklyPlan || !ctx.cls.rps.weeklyPlan[activeWeeklyComponentModal.rowIdx]) return;
            const row = ctx.cls.rps.weeklyPlan[activeWeeklyComponentModal.rowIdx];
            const components = getWeeklyAssessmentComponents(row, activeWeeklyComponentModal.technique);
            const editingComponent = activeWeeklyComponentModal.componentId ? components.find(component => component.id === activeWeeklyComponentModal.componentId) : null;
            const title = activeWeeklyComponentModal.technique === 'non_tes' ? 'Teknik Non-Tes' : 'Teknik Tes';
            const modalRoot = document.getElementById('app-modal-root');
            if (!modalRoot) return;
            modalRoot.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div class="flex items-center justify-between px-5 py-4 border-b">
                            <div>
                                <h3 class="font-bold text-gray-800">${editingComponent ? 'Edit' : 'Tambah'} Komponen ${title}</h3>
                                <p class="text-xs text-gray-500">Teknik, kriteria, jenis, dan bobot bisa diedit di sini.</p>
                            </div>
                            <button type="button" onclick="closeWeeklyComponentModal()" class="text-gray-500 hover:text-red-600"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <div class="p-5 flex flex-col">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div class="md:col-span-3">
                                    <label class="block text-xs font-semibold text-gray-600 mb-1">Nama Komponen</label>
                                    <input id="weekly-component-name" type="text" value="${editingComponent ? escapeHtml(editingComponent.name || '') : ''}" class="w-full border rounded px-3 py-2 text-sm" placeholder="Masukkan nama komponen">
                                </div>
                                <div class="md:col-span-2">
                                    <label class="block text-xs font-semibold text-gray-600 mb-1">Jenis</label>
                                    <select id="weekly-component-type" class="w-full border rounded px-3 py-2 text-sm bg-white">
                                        ${WEEKLY_COMPONENT_TYPES.map(type => `<option value="${type}" ${editingComponent && editingComponent.jenis === type ? 'selected' : ''}>${type}</option>`).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-gray-600 mb-1">Bobot (%)</label>
                                    <input id="weekly-component-weight" type="number" min="0.01" step="0.01" value="${editingComponent ? (editingComponent.weight || '') : ''}" class="w-full border rounded px-3 py-2 text-sm">
                                </div>
                                <div class="md:col-span-3">
                                    <label class="block text-xs font-semibold text-gray-600 mb-1">Kriteria</label>
                                    <select id="weekly-component-criterion-type" onchange="toggleWeeklyComponentOtherCriterionInput()" class="w-full border rounded px-3 py-2 text-sm bg-white">
                                        ${WEEKLY_CRITERIA_TYPES.map(type => `<option value="${type}" ${editingComponent && editingComponent.criterionType === type ? 'selected' : ''}>${type}</option>`).join('')}
                                    </select>
                                </div>
                                <div id="weekly-component-other-criterion-wrap" class="md:col-span-3 ${editingComponent && editingComponent.criterionType === 'Kriteria Lainnya' ? '' : 'hidden'}">
                                    <label class="block text-xs font-semibold text-gray-600 mb-1">Kriteria Lainnya</label>
                                    <input id="weekly-component-other-criterion" type="text" value="${editingComponent && editingComponent.criterionType === 'Kriteria Lainnya' ? escapeHtml(editingComponent.criterionLabel || '') : ''}" class="w-full border rounded px-3 py-2 text-sm" placeholder="Isi kriteria lainnya">
                                </div>
                            </div>
                            <div class="flex justify-end gap-2 mt-4">
                                ${editingComponent ? `<button type="button" onclick="deleteWeeklyComponent('${activeWeeklyComponentModal.classKey}', ${activeWeeklyComponentModal.rowIdx}, '${editingComponent.id}', '${activeWeeklyComponentModal.technique}')" class="text-xs px-4 py-2 rounded border border-red-300 text-red-700 hover:bg-red-50">Hapus</button>` : ''}
                                <button type="button" onclick="saveWeeklyComponentModal()" class="bg-blue-700 hover:bg-blue-800 text-white text-xs px-4 py-2 rounded font-semibold">
                                    <i class="fa-solid fa-save mr-1"></i> ${editingComponent ? 'Simpan Perubahan' : 'Tambah Komponen'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`;
        }

        function saveWeeklyComponentModal() {
            if (!activeWeeklyComponentModal) return;
            const ctx = ensureRPSData(activeWeeklyComponentModal.classKey);
            const row = ctx && ctx.cls.rps.weeklyPlan ? ctx.cls.rps.weeklyPlan[activeWeeklyComponentModal.rowIdx] : null;
            if (!row || ctx.cls.weeklyMatrixFinalized) return;
            const name = document.getElementById('weekly-component-name').value.trim();
            const jenis = document.getElementById('weekly-component-type').value;
            const weight = parseFloat(document.getElementById('weekly-component-weight').value);
            const criterionType = document.getElementById('weekly-component-criterion-type').value;
            const customCriterionInput = document.getElementById('weekly-component-other-criterion');
            const criterionLabel = criterionType === 'Kriteria Lainnya' ? (customCriterionInput ? customCriterionInput.value.trim() : '') : criterionType;
            if (!name) {
                alert('Nama komponen wajib diisi.');
                return;
            }
            if (!WEEKLY_COMPONENT_TYPES.includes(jenis)) {
                alert('Jenis komponen tidak valid.');
                return;
            }
            if (!Number.isFinite(weight) || weight <= 0) {
                alert('Bobot komponen harus lebih dari 0.');
                return;
            }
            if (!WEEKLY_CRITERIA_TYPES.includes(criterionType) || !criterionLabel) {
                alert('Kriteria penilaian wajib diisi.');
                return;
            }
            const currentComponents = getWeeklyAssessmentComponents(row, activeWeeklyComponentModal.technique);
            const existingIndex = currentComponents.findIndex(component => component.id === activeWeeklyComponentModal.componentId);
            const existingComponent = existingIndex >= 0 ? currentComponents[existingIndex] : null;
            const nextComponent = {
                id: activeWeeklyComponentModal.componentId || ('WCOMP_' + Date.now()),
                technique: activeWeeklyComponentModal.technique,
                name: name,
                jenis: jenis,
                weight: weight,
                criterionType: criterionType,
                criterionLabel: criterionLabel,
                assignmentScope: existingComponent ? (existingComponent.assignmentScope || '') : '',
                assignmentInstructions: existingComponent ? (existingComponent.assignmentInstructions || '') : '',
                assignmentMethod: existingComponent ? (existingComponent.assignmentMethod || '') : '',
                performanceEvidence: existingComponent ? (existingComponent.performanceEvidence || '') : '',
                durationDeadline: existingComponent ? (existingComponent.durationDeadline || '') : '',
                assessmentNotes: existingComponent ? (existingComponent.assessmentNotes || '') : '',
                assessmentInstrument: existingComponent ? (existingComponent.assessmentInstrument || '') : '',
                formativeCriterion: existingComponent ? (existingComponent.formativeCriterion || '') : '',
                summativeCriterion: existingComponent ? (existingComponent.summativeCriterion || '') : ''
            };
            const targetTotal = getRpsSubcpmkTargetTotal(activeWeeklyComponentModal.classKey, row.subcpmkId);
            const usedOther = getRpsWeeklyUsedTotal(activeWeeklyComponentModal.classKey, row.subcpmkId, activeWeeklyComponentModal.rowIdx);
            const currentRowOther = getWeeklyAssessmentComponents(row)
                .filter(component => component.id !== nextComponent.id)
                .reduce((sum, component) => sum + (parseFloat(component.weight) || 0), 0);
            if (targetTotal <= 0 || usedOther + currentRowOther + weight > targetTotal) {
                alert(`Bobot komponen melebihi sisa target ${getRpsSubcpmkLabel(activeWeeklyComponentModal.classKey, row.subcpmkId)}.`);
                return;
            }
            if (existingIndex >= 0) currentComponents[existingIndex] = nextComponent;
            else currentComponents.push(nextComponent);
            row.assessmentComponents = getWeeklyAssessmentComponents(row).filter(component => component.technique !== activeWeeklyComponentModal.technique).concat(currentComponents);
            markWeeklyDraftDirty(ctx);
            saveState();
            closeWeeklyComponentModal();
            renderApp();
        }

        function deleteWeeklyComponent(classKey, rowIdx, componentId, technique) {
            const ctx = ensureRPSData(classKey);
            const row = ctx && ctx.cls.rps.weeklyPlan[rowIdx];
            if (!row || ctx.cls.weeklyMatrixFinalized) return;
            row.assessmentComponents = getWeeklyAssessmentComponents(row).filter(component => component.id !== componentId);
            markWeeklyDraftDirty(ctx);
            saveState();
            closeWeeklyComponentModal();
            renderApp();
        }

        function addRpsWeeklySubcpmk(classKey, idx) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || !ctx.cls.rps.weeklyPlan || !ctx.cls.rps.weeklyPlan[idx]) return;
            const select = document.getElementById('weekly-subcpmk-select-' + idx);
            if (!select || !select.value) return;
            const row = ctx.cls.rps.weeklyPlan[idx];
            const current = getRpsWeeklySubcpmkIds(row);
            if (current.indexOf(select.value) === -1) {
                current.push(select.value);
                row.subcpmkIds = current;
                row.subcpmkId = current.length > 0 ? current[0] : '';
                if (!row.subcpmkWeights || typeof row.subcpmkWeights !== 'object') row.subcpmkWeights = {};
                if (row.subcpmkWeights[select.value] === undefined) row.subcpmkWeights[select.value] = '';
                saveState();
                renderApp();
            }
        }

        function removeRpsWeeklySubcpmk(classKey, idx, subcpmkId) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || !ctx.cls.rps.weeklyPlan || !ctx.cls.rps.weeklyPlan[idx]) return;
            const row = ctx.cls.rps.weeklyPlan[idx];
            const current = getRpsWeeklySubcpmkIds(row).filter(id => id !== subcpmkId);
            row.subcpmkIds = current;
            row.subcpmkId = current.length > 0 ? current[0] : '';
            if (row.subcpmkWeights && row.subcpmkWeights[subcpmkId] !== undefined) delete row.subcpmkWeights[subcpmkId];
            saveState();
            renderApp();
        }

        function updateRpsWeeklySubcpmkWeight(classKey, idx, subcpmkId, value) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || !ctx.cls.rps.weeklyPlan || !ctx.cls.rps.weeklyPlan[idx]) return;
            const row = ctx.cls.rps.weeklyPlan[idx];
            if (!row.subcpmkWeights || typeof row.subcpmkWeights !== 'object') row.subcpmkWeights = {};
            const nextValue = value === '' ? '' : (parseFloat(value) || 0);
            const targetTotal = getRpsSubcpmkTargetTotal(classKey, subcpmkId);
            const usedOther = getRpsWeeklyUsedTotal(classKey, subcpmkId, idx);
            const nextTotal = usedOther + (nextValue === '' ? 0 : nextValue);
            if (targetTotal === 0 && nextValue !== '' && nextValue > 0) {
                alert('SubCPMK yang dipilih belum memiliki bobot target.');
                return;
            }
            if (targetTotal > 0 && nextTotal > targetTotal) {
                alert(`Bobot ${getRpsSubcpmkLabel(classKey, subcpmkId)} melebihi target yang ditetapkan. Target ${targetTotal}%.`);
                return;
            }
            row.subcpmkWeights[subcpmkId] = nextValue;
            saveState();
            renderApp();
        }

        function deleteRpsWeeklyRow(classKey, idx) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || ctx.cls.weeklyMatrixFinalized || !Array.isArray(ctx.cls.rps.weeklyPlan)) return;
            ctx.cls.rps.weeklyPlan.splice(idx, 1);
            markWeeklyDraftDirty(ctx);
            saveState();
            renderApp();
        }

        function openRPSFromClass(classKey) {
            if (!state.classData[classKey]) return;
            state.activeMainMenu = 'perkuliahan';
            state.activeSubMenu = 'rps';
            expandedMainMenu = 'perkuliahan';
            state.selectedClassKey = classKey;
            renderApp();
        }

        function updateRpsIdentitasField(classKey, field, value) {
            const ctx = ensureRPSData(classKey);
            if (!ctx) return;
            ctx.cls.rps.identitas[field] = value;
            saveState();
            renderApp();
        }

        function updateRpsLogo(classKey, input) {
            const ctx = ensureRPSData(classKey);
            const file = input && input.files ? input.files[0] : null;
            if (!ctx || !file) return;
            if (!['image/png', 'image/jpeg'].includes(file.type)) {
                alert('Logo harus berupa gambar PNG atau JPG.');
                input.value = '';
                return;
            }
            if (file.size > 1024 * 1024) {
                alert('Ukuran logo maksimal 1 MB.');
                input.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onerror = function () {
                alert('Logo tidak dapat dibaca. Silakan pilih file lain.');
                input.value = '';
            };
            reader.onload = function () {
                ctx.cls.rps.identitas.logoDataUrl = String(reader.result || '');
                saveState();
                renderApp();
            };
            reader.readAsDataURL(file);
        }

        function removeRpsLogo(classKey) {
            const ctx = ensureRPSData(classKey);
            if (!ctx) return;
            ctx.cls.rps.identitas.logoDataUrl = '';
            saveState();
            renderApp();
        }

        function updateRpsPengesahanField(classKey, field, value) {
            const ctx = ensureRPSData(classKey);
            if (!ctx) return;
            ctx.cls.rps.identitas.pengesahan[field] = value;
            saveState();
            renderApp();
        }

        function finalizeRPS(classKey) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || ctx.cls.rpsFinalized) return;
            if (!ctx.cls.subCpmkFinalized || !ctx.cls.weeklyMatrixFinalized || !ctx.cls.komponenFinalized) {
                alert('RPS belum dapat difinalisasi. Finalisasi bagian sebelumnya terlebih dahulu.');
                return;
            }
            ctx.cls.rpsFinalized = true;
            saveState();
            renderApp();
            alert('RPS berhasil difinalisasi. Seluruh bagian dalam RPS telah dikunci.');
        }

        function unfinalizeRPS(classKey) {
            const ctx = ensureRPSData(classKey);
            if (!ctx) return;
            ctx.cls.rpsFinalized = false;
            saveState();
            renderApp();
            alert('Finalisasi RPS dibuka. Seluruh bagian RPS dapat dikelola kembali sesuai status finalisasi masing-masing.');
        }

        const RPS_PDF_MARGIN = 12;
        const RPS_PDF_GREY = [232, 232, 232];

        function formatRpsPdfDate(value, includeDay = true) {
            if (!value) return '-';
            const date = new Date(`${value}T00:00:00`);
            if (Number.isNaN(date.getTime())) return String(value);
            return new Intl.DateTimeFormat('id-ID', includeDay
                ? { day: 'numeric', month: 'long', year: 'numeric' }
                : { month: 'long', year: 'numeric' }).format(date);
        }

        function drawRpsPdfLogo(doc, identity, x, y, width, height) {
            const logoDataUrl = identity.logoDataUrl || '';
            if (logoDataUrl.startsWith('data:image/png;base64,')) {
                doc.addImage(logoDataUrl, 'PNG', x, y, width, height, undefined, 'FAST');
                return;
            }
            const defaultLogo = document.getElementById('rps-pdf-default-logo');
            if (defaultLogo && defaultLogo.complete && defaultLogo.naturalWidth > 0) {
                doc.addImage(defaultLogo, 'PNG', x, y, width, height, undefined, 'FAST');
                return;
            }
            if (logoDataUrl.startsWith('data:image/jpeg;base64,')) {
                doc.addImage(logoDataUrl, 'JPEG', x, y, width, height, undefined, 'FAST');
                return;
            }
            const centerX = x + (width / 2);
            const centerY = y + (height / 2);
            const radius = Math.min(width, height) / 2;
            doc.setDrawColor(0);
            doc.setLineWidth(0.6);
            doc.circle(centerX, centerY, radius);
            doc.circle(centerX, centerY, radius - 2);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(Math.max(8, radius * 0.9));
            doc.text('USG', centerX, centerY + 2, { align: 'center' });
        }

        function addRpsPdfLandscapePage(doc) {
            doc.addPage('a4', 'landscape');
            return RPS_PDF_MARGIN;
        }

        function ensureRpsPdfSpace(doc, y, requiredHeight) {
            const pageHeight = doc.internal.pageSize.getHeight();
            return y + requiredHeight > pageHeight - RPS_PDF_MARGIN
                ? addRpsPdfLandscapePage(doc)
                : y;
        }

        function drawRpsPdfChapterTitle(doc, title, y) {
            y = ensureRpsPdfSpace(doc, y, 12);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text(title, RPS_PDF_MARGIN, y + 5);
            doc.setDrawColor(0);
            doc.setLineWidth(0.4);
            doc.line(RPS_PDF_MARGIN, y + 7, doc.internal.pageSize.getWidth() - RPS_PDF_MARGIN, y + 7);
            return y + 12;
        }

        function drawRpsPdfSubheading(doc, title, y) {
            y = ensureRpsPdfSpace(doc, y, 10);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(0);
            doc.text(title, RPS_PDF_MARGIN, y + 4);
            return y + 7;
        }

        function drawRpsPdfTable(doc, options) {
            const customStyles = options.styles || {};
            const customHeadStyles = options.headStyles || {};
            const customAlternateStyles = options.alternateRowStyles || {};
            const tableOptions = { ...options };
            delete tableOptions.styles;
            delete tableOptions.headStyles;
            delete tableOptions.alternateRowStyles;
            doc.autoTable({
                theme: 'grid',
                margin: {
                    top: RPS_PDF_MARGIN,
                    right: RPS_PDF_MARGIN,
                    bottom: 18,
                    left: RPS_PDF_MARGIN
                },
                styles: {
                    font: 'helvetica',
                    fontSize: 7,
                    textColor: 0,
                    fillColor: 255,
                    lineColor: [80, 80, 80],
                    lineWidth: 0.15,
                    cellPadding: 1.4,
                    overflow: 'linebreak',
                    valign: 'top',
                    ...customStyles
                },
                headStyles: {
                    fillColor: RPS_PDF_GREY,
                    textColor: 0,
                    fontStyle: 'bold',
                    halign: 'center',
                    valign: 'middle',
                    ...customHeadStyles
                },
                alternateRowStyles: { fillColor: [248, 248, 248], ...customAlternateStyles },
                ...tableOptions
            });
            return doc.lastAutoTable.finalY + 4;
        }

        function createRpsPdfRichCell(lines) {
            return {
                content: lines.map(line => line.text || '-').join('\n'),
                richLines: lines
            };
        }

        function drawRpsPdfRichCell(doc, data) {
            const richLines = data.cell.raw && data.cell.raw.richLines;
            if (!richLines || data.section !== 'body') return;
            const fill = Array.isArray(data.cell.styles.fillColor) ? data.cell.styles.fillColor : [255, 255, 255];
            doc.setFillColor(...fill);
            doc.rect(data.cell.x + 0.2, data.cell.y + 0.2, data.cell.width - 0.4, data.cell.height - 0.4, 'F');
            const fontSize = data.cell.styles.fontSize || 5.4;
            const lineHeight = fontSize * 0.3528 * 1.2;
            const maxWidth = data.cell.width - 2;
            let y = data.cell.y + 2.2;
            richLines.forEach(line => {
                doc.setFont('helvetica', line.bold ? 'bold' : 'normal');
                doc.setFontSize(fontSize);
                doc.setTextColor(0);
                const wrapped = doc.splitTextToSize(String(line.text || '-'), maxWidth);
                doc.text(wrapped, data.cell.x + 1, y);
                y += wrapped.length * lineHeight;
            });
        }

        function drawRpsPdfCompetencyHierarchy(doc, cpls, cpmks, subcpmks, y) {
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const columns = [
                { x: RPS_PDF_MARGIN, width: 78, fill: [219, 234, 254] },
                { x: RPS_PDF_MARGIN + 96, width: 78, fill: [220, 252, 231] },
                { x: RPS_PDF_MARGIN + 192, width: 78, fill: [254, 249, 195] }
            ];
            const groups = cpls.map(cpl => {
                const cpmkNodes = cpmks
                    .filter(cpmk => (parseFloat(cpmk.weights && cpmk.weights[cpl.id]) || 0) > 0)
                    .map(cpmk => ({
                        item: cpmk,
                        children: subcpmks.filter(sub => (parseFloat(sub.weights && sub.weights[cpmk.id]) || 0) > 0)
                    }));
                return { item: cpl, children: cpmkNodes };
            }).filter(group => group.children.length > 0);
            const leafCount = Math.max(1, groups.reduce((sum, group) =>
                sum + group.children.reduce((inner, node) => inner + Math.max(1, node.children.length), 0), 0
            ));
            const availableHeight = pageHeight - y - RPS_PDF_MARGIN - 8;
            const rowHeight = Math.max(8, Math.min(15, availableHeight / leafCount));
            const nodeHeight = Math.max(7, rowHeight - 1.5);
            const nodes = [];
            let leafIndex = 0;

            groups.forEach(group => {
                const cplStart = leafIndex;
                group.children.forEach(cpmkNode => {
                    const cpmkStart = leafIndex;
                    const children = cpmkNode.children.length ? cpmkNode.children : [{ code: '-', desc: '-' }];
                    children.forEach(sub => {
                        const centerY = y + (leafIndex * rowHeight) + (rowHeight / 2);
                        nodes.push({ level: 2, item: sub, centerY });
                        leafIndex += 1;
                    });
                    nodes.push({
                        level: 1,
                        item: cpmkNode.item,
                        centerY: y + (((cpmkStart + leafIndex) / 2) * rowHeight)
                    });
                });
                nodes.push({
                    level: 0,
                    item: group.item,
                    centerY: y + (((cplStart + leafIndex) / 2) * rowHeight)
                });
            });

            const nodeCenter = node => columns[node.level].x + (columns[node.level].width / 2);
            doc.setDrawColor(100);
            doc.setLineWidth(0.25);
            groups.forEach(group => {
                const parent = nodes.find(node => node.level === 0 && node.item.id === group.item.id);
                group.children.forEach(cpmkNode => {
                    const child = nodes.find(node => node.level === 1 && node.item.id === cpmkNode.item.id);
                    if (parent && child) doc.line(columns[0].x + columns[0].width, parent.centerY, columns[1].x, child.centerY);
                    cpmkNode.children.forEach(sub => {
                        const leaf = nodes.find(node => node.level === 2 && node.item.id === sub.id);
                        if (child && leaf) doc.line(columns[1].x + columns[1].width, child.centerY, columns[2].x, leaf.centerY);
                    });
                });
            });

            nodes.forEach(node => {
                const column = columns[node.level];
                const top = node.centerY - (nodeHeight / 2);
                doc.setFillColor(...column.fill);
                doc.setDrawColor(80);
                doc.roundedRect(column.x, top, column.width, nodeHeight, 1.2, 1.2, 'FD');
                doc.setTextColor(0);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(5.4);
                const code = String(node.item.code || '-');
                doc.text(code, column.x + 2, top + 2.8);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(4.8);
                const description = doc.splitTextToSize(String(node.item.desc || '-'), column.width - 4).slice(0, 2);
                doc.text(description, column.x + 2, top + 5);
            });
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.text('CPL', nodeCenter({ level: 0 }), y - 2, { align: 'center' });
            doc.text('CPMK', nodeCenter({ level: 1 }), y - 2, { align: 'center' });
            doc.text('SubCPMK', nodeCenter({ level: 2 }), y - 2, { align: 'center' });
            return y + (leafCount * rowHeight) + 4;
        }

        function drawRpsPdfDocumentHeader(doc, identity) {
            const x = RPS_PDF_MARGIN;
            const y = RPS_PDF_MARGIN;
            const widths = [30, 147, 96];
            const firstRowHeight = 28;
            const secondRowHeight = 10;
            const totalWidth = widths.reduce((sum, value) => sum + value, 0);
            doc.setDrawColor(0);
            doc.setLineWidth(0.35);
            doc.rect(x, y, totalWidth, firstRowHeight + secondRowHeight);
            doc.line(x + widths[0], y, x + widths[0], y + firstRowHeight + secondRowHeight);
            doc.line(x + widths[0] + widths[1], y, x + widths[0] + widths[1], y + firstRowHeight);
            doc.line(x, y + firstRowHeight, x + totalWidth, y + firstRowHeight);
            drawRpsPdfLogo(doc, identity, x + 6, y + 3, 18, 22);

            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0);
            doc.setFontSize(9);
            const institutionX = x + widths[0] + 4;
            doc.text(String(identity.universitas || 'Universitas Sunan Gresik').toUpperCase(), institutionX, y + 8);
            doc.text(String(identity.fakultas || 'Fakultas Teknologi dan Rekayasa').toUpperCase(), institutionX, y + 15);
            doc.text(`PROGRAM STUDI ${String(identity.programStudi || 'Teknik Industri').toUpperCase()}`, institutionX, y + 22);

            doc.setFontSize(10);
            const titleX = x + widths[0] + widths[1] + (widths[2] / 2);
            const titleLines = doc.splitTextToSize('RENCANA PEMBELAJARAN SEMESTER (RPS)', widths[2] - 8);
            doc.text(titleLines, titleX, y + 11, { align: 'center' });

            doc.setFontSize(7.5);
            doc.text('Tanggal Penyusunan:', x + 2, y + firstRowHeight + 6.5);
            doc.setFont('helvetica', 'normal');
            doc.text(formatRpsPdfDate(identity.tanggalPenyusunan), x + widths[0] + 4, y + firstRowHeight + 6.5);
            return y + firstRowHeight + secondRowHeight + 5;
        }

        function drawRpsPdfCover(doc, identity) {
            const pageWidth = doc.internal.pageSize.getWidth();
            const preparer = identity.pengesahan && identity.pengesahan.dosenPengembangNama
                ? identity.pengesahan.dosenPengembangNama
                : (identity.dosenPengampu || '-');
            drawRpsPdfLogo(doc, identity, (pageWidth - 42) / 2, 24, 42, 42);
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(15);
            doc.text('RENCANA PEMBELAJARAN SEMESTER (RPS)', pageWidth / 2, 83, { align: 'center' });
            doc.setFontSize(16);
            doc.text(String(identity.mataKuliah || 'NAMA MATA KULIAH').toUpperCase(), pageWidth / 2, 103, {
                align: 'center',
                maxWidth: pageWidth - 40
            });
            doc.setFontSize(11);
            doc.text('oleh:', pageWidth / 2, 126, { align: 'center' });
            doc.setFontSize(12);
            doc.text(String(preparer).toUpperCase(), pageWidth / 2, 140, {
                align: 'center',
                maxWidth: pageWidth - 45
            });
            doc.setFontSize(12);
            doc.text(`Program Studi ${identity.programStudi || 'Teknik Industri'}`, pageWidth / 2, 180, { align: 'center' });
            doc.setFontSize(13);
            doc.text(String(identity.universitas || 'UNIVERSITAS SUNAN GRESIK').toUpperCase(), pageWidth / 2, 194, { align: 'center' });
            doc.setFontSize(11);
            doc.text(`Gresik, ${formatRpsPdfDate(identity.tanggalPenyusunan, false)}`, pageWidth / 2, 220, { align: 'center' });
        }

        async function captureRpsCompetencyFlowchart() {
            const svg = document.querySelector('.rps-competency-flowchart svg');
            if (!svg) return null;
            const viewBox = svg.viewBox && svg.viewBox.baseVal;
            const width = viewBox && viewBox.width ? viewBox.width : svg.clientWidth;
            const height = viewBox && viewBox.height ? viewBox.height : svg.clientHeight;
            if (!width || !height) return null;
            const clone = svg.cloneNode(true);
            clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            clone.setAttribute('width', width);
            clone.setAttribute('height', height);
            const source = new XMLSerializer().serializeToString(clone);
            const image = new Image();
            await new Promise((resolve, reject) => {
                image.onload = resolve;
                image.onerror = () => reject(new Error('Bagan kompetensi tidak dapat dirasterisasi.'));
                image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
            });
            const scale = Math.min(2, 2400 / width);
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(width * scale);
            canvas.height = Math.ceil(height * scale);
            const context = canvas.getContext('2d');
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            return { dataUrl: canvas.toDataURL('image/png'), width, height };
        }

        function buildRpsPdf(classKey, competencyChart) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || !ctx.cls.rpsFinalized) {
                alert('Ekspor PDF hanya tersedia setelah RPS difinalisasi.');
                return null;
            }
            if (!window.jspdf || !window.jspdf.jsPDF) {
                alert('Pustaka PDF belum tersedia. Periksa koneksi internet lalu muat ulang halaman.');
                return null;
            }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
            const cls = ctx.cls;
            const mk = ctx.mk;
            const rps = cls.rps;
            const identity = rps.identitas;
            const approval = identity.pengesahan || {};
            const cpmks = state.cpmkList[mk.id] || [];
            const cpls = state.cplList.filter(cpl => mk.cpls && mk.cpls.includes(cpl.id));
            const subcpmks = cls.subCpmkList || [];
            const components = cls.komponenList || [];
            const weeklyRows = rps.weeklyPlan || [];

            drawRpsPdfCover(doc, identity);

            let y = addRpsPdfLandscapePage(doc);
            y = drawRpsPdfDocumentHeader(doc, identity);
            y = drawRpsPdfChapterTitle(doc, '1. IDENTITAS MATA KULIAH', y);
            const identityRows = [
                ['Nama Mata Kuliah', identity.mataKuliah || '-', 'Kode Mata Kuliah', identity.kodeMK || '-'],
                ['Semester', identity.semester || '-', 'Rumpun Mata Kuliah', identity.rumpunMK || '-'],
                ['Jenis Mata Kuliah', identity.jenisMK || '-', 'Moda Pembelajaran', identity.moda || '-'],
                ['SKS Teori', identity.sksT || 0, 'SKS Praktik', identity.sksP || 0],
                ['Total SKS', identity.totalSKS || 0, 'Dosen Pengampu', identity.dosenPengampu || '-'],
                ['Tanggal Penyusunan', formatRpsPdfDate(identity.tanggalPenyusunan), 'Tanggal Revisi', formatRpsPdfDate(identity.tanggalRevisi)],
                ['Mata Kuliah Prasyarat', identity.mkPrasyarat || 'Tidak ada', 'Menjadi Prasyarat', identity.menjadiPrasyarat || 'Tidak ada'],
                ['Integrasi antar Mata Kuliah', { content: identity.integrasiAntarMK || '-', colSpan: 3 }],
                ['Deskripsi Mata Kuliah', { content: identity.deskripsiMK || '-', colSpan: 3 }],
                ['Tautan Kelas Daring', identity.tautanKelasDaring || '-', 'Bahasa Pengantar', identity.bahasaPengantar || '-']
            ];
            y = drawRpsPdfTable(doc, {
                startY: y,
                body: identityRows,
                columnStyles: {
                    0: { cellWidth: 38, fontStyle: 'bold', fillColor: RPS_PDF_GREY },
                    1: { cellWidth: 98 },
                    2: { cellWidth: 38, fontStyle: 'bold', fillColor: RPS_PDF_GREY },
                    3: { cellWidth: 99 }
                },
                styles: { fontSize: 6.7, cellPadding: 1.1 }
            });
            y = drawRpsPdfSubheading(doc, 'Pengesahan RPS', y);
            drawRpsPdfTable(doc, {
                startY: y,
                head: [['Dosen Pengembang RPS', 'Koordinator Rumpun MK', 'Ketua Program Studi']],
                body: [[
                    `\n\n\n${approval.dosenPengembangNama || '-'}\n${approval.dosenPengembangNUPTK || '-'}`,
                    `\n\n\n${approval.koordinatorRumpunMKNama || '-'}\n${approval.koordinatorRumpunMKNUPTK || '-'}`,
                    `\n\n\n${approval.ketuaProgramStudiNama || '-'}\n${approval.ketuaProgramStudiNUPTK || '-'}`
                ]],
                styles: { halign: 'center', valign: 'bottom', fontSize: 6.7 },
                bodyStyles: { minCellHeight: 27 }
            });

            y = addRpsPdfLandscapePage(doc);
            y = drawRpsPdfChapterTitle(doc, '2. CAPAIAN PEMBELAJARAN DAN BAHAN KAJIAN', y);
            y = drawRpsPdfSubheading(doc, 'a. CPL yang Dibebankan ke Mata Kuliah', y);
            y = drawRpsPdfTable(doc, {
                startY: y,
                head: [['Kode CPL', 'Deskripsi Capaian Pembelajaran Lulusan']],
                body: cpls.map(cpl => [cpl.code, cpl.desc || '-']),
                columnStyles: { 0: { cellWidth: 28, fontStyle: 'bold' } }
            });
            y = drawRpsPdfSubheading(doc, 'b. Capaian Pembelajaran Mata Kuliah (CPMK)', y);
            y = drawRpsPdfTable(doc, {
                startY: y,
                head: [['Kode CPMK', 'Deskripsi CPMK']],
                body: cpmks.map(cpmk => [cpmk.code, cpmk.desc || '-']),
                columnStyles: { 0: { cellWidth: 28, fontStyle: 'bold' } }
            });
            y = drawRpsPdfSubheading(doc, 'c. SubCPMK', y);
            y = drawRpsPdfTable(doc, {
                startY: y,
                head: [['Kode SubCPMK', 'Deskripsi SubCPMK']],
                body: subcpmks.map(sub => [sub.code, sub.desc || '-']),
                columnStyles: { 0: { cellWidth: 32, fontStyle: 'bold' } }
            });
            y = drawRpsPdfSubheading(doc, 'd. Bahan Kajian', y);
            y = drawRpsPdfTable(doc, {
                startY: y,
                head: [['No.', 'Uraian Bahan Kajian']],
                body: (rps.bahanKajianItems || []).map((item, index) => [index + 1, item.isi || '-']),
                columnStyles: { 0: { cellWidth: 14, halign: 'center' } }
            });
            y = drawRpsPdfSubheading(doc, 'e. Daftar Pustaka', y);
            y = drawRpsPdfTable(doc, {
                startY: y,
                head: [['No.', 'Jenis', 'Referensi']],
                body: (rps.daftarPustakaItems || [])
                    .slice()
                    .sort((a, b) => {
                        const rank = value => value === 'pendukung' ? 1 : 0;
                        return rank(a.jenis) - rank(b.jenis) || String(a.isi || '').localeCompare(String(b.isi || ''));
                    })
                    .map((item, index) => [index + 1, item.jenis === 'pendukung' ? 'Pendukung' : 'Utama', item.isi || '-']),
                columnStyles: { 0: { cellWidth: 14, halign: 'center' }, 1: { cellWidth: 25 } }
            });
            y = drawRpsPdfSubheading(doc, 'f. Matriks SubCPMK - CPMK', y);
            const subCpmkCpmkColumnTotals = cpmks.map(cpmk =>
                subcpmks.reduce((sum, sub) => sum + (parseFloat(sub.weights && sub.weights[cpmk.id]) || 0), 0)
            );
            const subCpmkCpmkGrandTotal = subCpmkCpmkColumnTotals.reduce((sum, value) => sum + value, 0);
            y = drawRpsPdfTable(doc, {
                startY: y,
                head: [['SubCPMK', ...cpmks.map(cpmk => cpmk.code), 'Total']],
                body: [
                    ...subcpmks.map(sub => {
                        const weights = cpmks.map(cpmk => parseFloat(sub.weights && sub.weights[cpmk.id]) || 0);
                        const total = weights.reduce((sum, value) => sum + value, 0);
                        return [sub.code, ...weights.map(value => value ? `${value}%` : '-'), total ? `${total}%` : '-'];
                    }),
                    [
                        { content: 'Total', styles: { fontStyle: 'bold', fillColor: RPS_PDF_GREY } },
                        ...subCpmkCpmkColumnTotals.map(value => ({ content: value ? `${value}%` : '-', styles: { fontStyle: 'bold', fillColor: RPS_PDF_GREY } })),
                        { content: subCpmkCpmkGrandTotal ? `${subCpmkCpmkGrandTotal}%` : '-', styles: { fontStyle: 'bold', fillColor: RPS_PDF_GREY } }
                    ]
                ],
                styles: { halign: 'center', fontSize: 6.5 },
                columnStyles: { 0: { fontStyle: 'bold', halign: 'left' } }
            });

            y = addRpsPdfLandscapePage(doc);
            y = drawRpsPdfChapterTitle(doc, '3. MATRIKS PEMBELAJARAN MINGGUAN', y);
            const weeklyBody = weeklyRows.map((row, rowIndex) => {
                const week = getWeeklyWeekSelections(row).join(', ') || String(rowIndex + 1);
                if (isWeeklyExamRow(row)) {
                    return [
                        { content: week, styles: { halign: 'center', fontStyle: 'bold', fillColor: RPS_PDF_GREY } },
                        {
                            content: String(getWeeklyExamLabel(row) || '-').toUpperCase(),
                            colSpan: 7,
                            styles: { halign: 'center', fontStyle: 'bold', fillColor: RPS_PDF_GREY }
                        }
                    ];
                }
                const sub = subcpmks.find(item => item.id === row.subcpmkId);
                const rowComponents = getWeeklyAssessmentComponents(row);
                const testComponents = rowComponents.filter(component => component.technique !== 'non_tes');
                const nonTestComponents = rowComponents.filter(component => component.technique === 'non_tes');
                const formatComponent = component => `${component.name || component.jenis || '-'} (${parseFloat(component.weight) || 0}%)`;
                const formatCriterion = component => `${component.technique === 'non_tes' ? 'Non-Tes' : 'Tes'}: ${getWeeklyComponentCriterion(component) || '-'}`;
                const bahanKajian = (row.bahanKajianIds || [])
                    .map(id => (rps.bahanKajianItems || []).find(item => item.id === id)?.isi || '')
                    .filter(Boolean);
                const daftarPustaka = (row.daftarPustakaIds || [])
                    .map(id => (rps.daftarPustakaItems || []).find(item => item.id === id)?.isi || '')
                    .filter(Boolean);
                return [
                    week,
                    createRpsPdfRichCell([
                        { text: sub ? sub.code : '-', bold: true },
                        { text: sub ? sub.desc || '-' : '-', bold: false }
                    ]),
                    row.indikatorPenilaian || '-',
                    createRpsPdfRichCell([
                        { text: 'Teknik Tes:', bold: true },
                        { text: testComponents.map(formatComponent).join('\n') || '-', bold: false },
                        { text: 'Teknik Non-Tes:', bold: true },
                        { text: nonTestComponents.map(formatComponent).join('\n') || '-', bold: false },
                        { text: 'Kriteria:', bold: true },
                        { text: rowComponents.map(formatCriterion).join('\n') || '-', bold: false }
                    ]),
                    row.metodePembelajaranDaring || '-',
                    row.metodePembelajaranLuring || '-',
                    createRpsPdfRichCell([
                        { text: 'Bahan Kajian:', bold: true },
                        { text: bahanKajian.join('\n') || '-', bold: false },
                        { text: 'Daftar Pustaka:', bold: true },
                        { text: daftarPustaka.join('\n') || '-', bold: false }
                    ]),
                    `${rowComponents.reduce((sum, component) => sum + (parseFloat(component.weight) || 0), 0)}%`
                ];
            });
            const weeklyTotalWeight = weeklyRows.reduce((total, row) =>
                total + getWeeklyAssessmentComponents(row).reduce((sum, component) => sum + (parseFloat(component.weight) || 0), 0), 0
            );
            weeklyBody.push([
                {
                    content: 'TOTAL BOBOT PENILAIAN',
                    colSpan: 7,
                    styles: { halign: 'right', fontStyle: 'bold', fillColor: RPS_PDF_GREY }
                },
                { content: `${weeklyTotalWeight}%`, styles: { halign: 'center', fontStyle: 'bold', fillColor: RPS_PDF_GREY } }
            ]);
            drawRpsPdfTable(doc, {
                startY: y,
                head: [['Minggu ke', 'SubCPMK', 'Indikator Penilaian', 'Teknik & Kriteria Penilaian', 'Metode Daring', 'Metode Luring', 'Materi Pembelajaran', 'Bobot']],
                body: weeklyBody,
                styles: { fontSize: 5.4, cellPadding: 1 },
                columnStyles: {
                    0: { cellWidth: 15, halign: 'center' },
                    1: { cellWidth: 42 },
                    2: { cellWidth: 42 },
                    3: { cellWidth: 46 },
                    4: { cellWidth: 34 },
                    5: { cellWidth: 34 },
                    6: { cellWidth: 45 },
                    7: { cellWidth: 15, halign: 'center' }
                },
                didDrawCell: data => drawRpsPdfRichCell(doc, data),
                rowPageBreak: 'avoid',
                pageBreak: 'auto'
            });

            y = addRpsPdfLandscapePage(doc);
            y = drawRpsPdfChapterTitle(doc, '4. RANCANGAN EVALUASI / ASESMEN', y);
            y = drawRpsPdfSubheading(doc, 'a. Matriks Komponen Penilaian - SubCPMK', y);
            const assessmentSubColumnTotals = subcpmks.map(sub =>
                components.reduce((sum, component) => sum + (parseFloat(component.weights && component.weights[sub.id]) || 0), 0)
            );
            const assessmentGrandTotal = assessmentSubColumnTotals.reduce((sum, value) => sum + value, 0);
            y = drawRpsPdfTable(doc, {
                startY: y,
                head: [['Jenis Komponen', 'Nama Komponen', ...subcpmks.map(sub => sub.code), 'Total']],
                body: [
                    ...components.map(component => {
                        const weights = subcpmks.map(sub => parseFloat(component.weights && component.weights[sub.id]) || 0);
                        const total = weights.reduce((sum, value) => sum + value, 0);
                        return [component.jenis || '-', component.name || '-', ...weights.map(value => value ? `${value}%` : '-'), total ? `${total}%` : '-'];
                    }),
                    [
                        { content: 'Total', colSpan: 2, styles: { fontStyle: 'bold', fillColor: RPS_PDF_GREY } },
                        ...assessmentSubColumnTotals.map(value => ({ content: value ? `${value}%` : '-', styles: { fontStyle: 'bold', fillColor: RPS_PDF_GREY } })),
                        { content: assessmentGrandTotal ? `${assessmentGrandTotal}%` : '-', styles: { fontStyle: 'bold', fillColor: RPS_PDF_GREY } }
                    ]
                ],
                styles: { fontSize: 5.8, halign: 'center' },
                columnStyles: { 0: { cellWidth: 26, halign: 'left' }, 1: { cellWidth: 60, halign: 'left' } }
            });
            y = drawRpsPdfSubheading(doc, 'b. Akumulasi Bobot per Jenis Komponen', y);
            const assessmentTypes = [...new Set(components.map(component => component.jenis || 'Lainnya'))];
            const typeTotals = assessmentTypes.map(type => {
                const total = components.filter(component => (component.jenis || 'Lainnya') === type).reduce((sum, component) =>
                    sum + subcpmks.reduce((inner, sub) => inner + (parseFloat(component.weights && component.weights[sub.id]) || 0), 0), 0);
                return [type, total ? `${total}%` : '-'];
            });
            y = drawRpsPdfTable(doc, {
                startY: y,
                head: [['Jenis Komponen', 'Total Bobot']],
                body: [
                    ...typeTotals,
                    [
                        { content: 'Total', styles: { fontStyle: 'bold', fillColor: RPS_PDF_GREY } },
                        { content: assessmentGrandTotal ? `${assessmentGrandTotal}%` : '-', styles: { fontStyle: 'bold', fillColor: RPS_PDF_GREY, halign: 'center' } }
                    ]
                ],
                columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 30, halign: 'center' } },
                tableWidth: 100
            });
            y = drawRpsPdfSubheading(doc, 'c. Rincian Evaluasi / Asesmen', y);
            drawRpsPdfTable(doc, {
                startY: y,
                head: [['Minggu', 'Bentuk Evaluasi', 'SubCPMK', 'Deskripsi Penugasan dan Ruang Lingkup', 'Tagihan / Luaran', 'Durasi / Batas Waktu', 'Instrumen Penilaian', 'Bobot']],
                body: components.map(component => {
                    const relatedSubs = subcpmks.filter(sub => (parseFloat(component.weights && component.weights[sub.id]) || 0) > 0);
                    const weight = relatedSubs.reduce((sum, sub) => sum + (parseFloat(component.weights[sub.id]) || 0), 0);
                    return [
                        component.weekNumber || '-',
                        `${component.jenis || '-'}\n${component.name || '-'}`,
                        relatedSubs.map(sub => sub.code).join(', ') || '-',
                        `Ruang lingkup: ${component.assignmentScope || '-'}\nInstruksi: ${component.assignmentInstructions || '-'}\nMetode: ${component.assignmentMethod || '-'}`,
                        component.performanceEvidence || '-',
                        component.durationDeadline || '-',
                        `Formatif: ${component.formativeCriterion || '-'}\nSumatif: ${component.summativeCriterion || '-'}`,
                        `${weight}%`
                    ];
                }),
                styles: { fontSize: 5.2, cellPadding: 0.9 },
                columnStyles: {
                    0: { cellWidth: 15, halign: 'center' },
                    1: { cellWidth: 39 },
                    2: { cellWidth: 22 },
                    3: { cellWidth: 67 },
                    4: { cellWidth: 42 },
                    5: { cellWidth: 32 },
                    6: { cellWidth: 40 },
                    7: { cellWidth: 16, halign: 'center' }
                }
            });

            y = addRpsPdfLandscapePage(doc);
            y = drawRpsPdfChapterTitle(doc, '5. RUBRIK PENILAIAN', y);
            components.forEach((component, index) => {
                const rubricData = ensureComponentRubricSetup(classKey, component.id);
                if (!rubricData) return;
                const setup = rubricData.setup;
                const columns = getRubricSetupColumns(setup);
                const rubricLetter = index < 26 ? `${String.fromCharCode(97 + index)}.` : `${index + 1}.`;
                y = ensureRpsPdfSpace(doc, y, 38);
                y = drawRpsPdfSubheading(
                    doc,
                    `${rubricLetter} ${component.criterionLabel && component.name ? `${component.criterionLabel} - ${component.name}` : (component.criterionLabel || component.name || 'Rubrik')}`,
                    y
                );
                y = drawRpsPdfTable(doc, {
                    startY: y,
                    head: [['Field', 'Isi']],
                    body: [
                        ['Jenis Komponen', component.jenis || '-'],
                        ['Jenis Instrumen', component.assessmentInstrument || '-'],
                        ['Bobot', `${Object.values(component.weights || {}).reduce((sum, value) => sum + (parseFloat(value) || 0), 0)}%`],
                        ['Petunjuk Penggunaan / Penskoran', setup.instructions || '-']
                    ],
                    styles: { fontSize: 6.3 },
                    columnStyles: {
                        0: { cellWidth: 62, fontStyle: 'bold', fillColor: [248, 250, 252] },
                        1: { cellWidth: 211 }
                    }
                });
                y = drawRpsPdfTable(doc, {
                    startY: y,
                    head: [['No.', ...columns.map(column => column.label)]],
                    body: (setup.rows || []).map((row, rowIndex) => [
                        rowIndex + 1,
                        ...columns.map(column => row[column.field] ?? '-')
                    ]),
                    styles: { fontSize: columns.length > 6 ? 4.8 : 5.8, cellPadding: 1, overflow: 'linebreak' },
                    columnStyles: { 0: { cellWidth: 12, halign: 'center' } },
                    rowPageBreak: 'avoid',
                    pageBreak: 'auto'
                });
            });

            y = addRpsPdfLandscapePage(doc);
            y = drawRpsPdfChapterTitle(doc, '6. LAMPIRAN', y);
            y = drawRpsPdfSubheading(doc, 'a. Bagan Alir Kompetensi', y);
            const chartMaxWidth = doc.internal.pageSize.getWidth() - (RPS_PDF_MARGIN * 2);
            const chartMaxHeight = doc.internal.pageSize.getHeight() - y - RPS_PDF_MARGIN;
            const chartScale = Math.min(chartMaxWidth / competencyChart.width, chartMaxHeight / competencyChart.height);
            const chartWidth = competencyChart.width * chartScale;
            const chartHeight = competencyChart.height * chartScale;
            doc.addImage(
                competencyChart.dataUrl,
                'PNG',
                RPS_PDF_MARGIN + ((chartMaxWidth - chartWidth) / 2),
                y,
                chartWidth,
                chartHeight,
                undefined,
                'FAST'
            );
            y += chartHeight + 4;
            y = ensureRpsPdfSpace(doc, y, 35);
            y = drawRpsPdfSubheading(doc, 'b. Peta Proses Pembelajaran', y);
            y = drawRpsPdfTable(doc, {
                startY: y,
                head: [['Minggu', 'Fokus Pembelajaran (SubCPMK)', 'Metode Pembelajaran', 'Bentuk Asesmen']],
                body: weeklyRows.map((row, index) => {
                    const sub = subcpmks.find(item => item.id === row.subcpmkId);
                    const methods = `Daring: ${row.metodePembelajaranDaring || '-'}\nLuring: ${row.metodePembelajaranLuring || '-'}`;
                    const assessments = getWeeklyAssessmentComponents(row)
                        .map(component => `${component.technique === 'non_tes' ? 'Non-Tes' : 'Tes'}: ${component.name || component.jenis || '-'} (${parseFloat(component.weight) || 0}%)`)
                        .join('\n');
                    return [
                        getWeeklyWeekSelections(row).join(', ') || String(index + 1),
                        sub ? `${sub.code} - ${sub.desc || '-'}` : (getWeeklyExamLabel(row) || '-'),
                        methods || '-',
                        assessments || '-'
                    ];
                }),
                columnStyles: { 0: { cellWidth: 20, halign: 'center' }, 1: { cellWidth: 95 }, 2: { cellWidth: 80 }, 3: { cellWidth: 78 } }
            });
            y = ensureRpsPdfSpace(doc, y, 42);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(0);
            doc.text('Penandatangan Validasi', RPS_PDF_MARGIN, y + 4);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.text(`Tanggal: ${formatRpsPdfDate(approval.tanggalValidasi)}`, doc.internal.pageSize.getWidth() - RPS_PDF_MARGIN, y + 4, { align: 'right' });
            y += 7;
            drawRpsPdfTable(doc, {
                startY: y,
                head: [['Ketua Program Studi', 'Gugus Kendali Mutu Program Studi', 'Dosen PJMK']],
                body: [[
                    `\n\n\n${approval.ketuaProgramStudiNama || '-'}\n${approval.ketuaProgramStudiNUPTK || '-'}`,
                    `\n\n\n${approval.gugusKendaliMutuNama || '-'}\n${approval.gugusKendaliMutuNUPTK || '-'}`,
                    `\n\n\n${approval.dosenPJMKNama || '-'}\n${approval.dosenPJMKNUPTK || '-'}`
                ]],
                styles: { halign: 'center', valign: 'bottom', fontSize: 6.7 },
                bodyStyles: { minCellHeight: 30 }
            });

            const totalPages = doc.getNumberOfPages();
            for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
                doc.setPage(pageNumber);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                doc.setTextColor(80);
                const footerY = doc.internal.pageSize.getHeight() - RPS_PDF_MARGIN - 0.5;
                doc.text(`RPS ${identity.kodeMK || ''} - ${identity.mataKuliah || ''}`, RPS_PDF_MARGIN, footerY);
                doc.text(`Halaman ${pageNumber} dari ${totalPages}`, doc.internal.pageSize.getWidth() - RPS_PDF_MARGIN, footerY, { align: 'right' });
            }
            return doc;
        }

        async function exportRpsToPdf(classKey) {
            let competencyChart;
            try {
                competencyChart = await captureRpsCompetencyFlowchart();
            } catch (error) {
                alert(error.message);
                return;
            }
            if (!competencyChart) {
                alert('Bagan Alir Kompetensi belum tersedia pada tampilan RPS.');
                return;
            }
            const doc = buildRpsPdf(classKey, competencyChart);
            if (!doc) return;
            const ctx = getRpsClassContext(classKey);
            const identity = ctx && ctx.cls.rps ? ctx.cls.rps.identitas : {};
            const safeCode = String(identity.kodeMK || 'Mata-Kuliah').replace(/[^a-z0-9_-]+/gi, '-');
            doc.save(`RPS-${safeCode}.pdf`);
        }

        function updateRpsListItem(classKey, listName, idx, field, value) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || !ctx.cls.rps[listName] || !ctx.cls.rps[listName][idx]) return;
            ctx.cls.rps[listName][idx][field] = value;
            saveState();
            renderApp();
        }

        function addRpsListItem(classKey, listName) {
            const ctx = ensureRPSData(classKey);
            if (!ctx) return;
            if (!Array.isArray(ctx.cls.rps[listName])) ctx.cls.rps[listName] = [];
            ctx.cls.rps[listName].push({ id: listName + '_' + Date.now(), isi: '' });
            saveState();
            renderApp();
        }

        function deleteRpsListItem(classKey, listName, idx) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || !Array.isArray(ctx.cls.rps[listName])) return;
            ctx.cls.rps[listName].splice(idx, 1);
            if (ctx.cls.rps[listName].length === 0) {
                ctx.cls.rps[listName].push({ id: listName + '_' + Date.now(), isi: '' });
            }
            saveState();
            renderApp();
        }

        function updateRpsMatrixValue(classKey, matrixName, rowId, colId, value) {
            const ctx = ensureRPSData(classKey);
            if (!ctx) return;
            if (!ctx.cls.rps[matrixName]) ctx.cls.rps[matrixName] = {};
            if (!ctx.cls.rps[matrixName][rowId]) ctx.cls.rps[matrixName][rowId] = {};
            ctx.cls.rps[matrixName][rowId][colId] = parseFloat(value) || 0;
            saveState();
            renderApp();
        }

        function updateRpsWeeklyField(classKey, idx, field, value) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || ctx.cls.weeklyMatrixFinalized || !ctx.cls.rps.weeklyPlan || !ctx.cls.rps.weeklyPlan[idx]) return;
            if (field === 'subcpmkId' || field === 'subcpmkIds') {
                const row = ctx.cls.rps.weeklyPlan[idx];
                const ids = Array.isArray(value) ? value : (value ? [value] : []);
                const uniqueIds = ids.filter((id, i, arr) => id && arr.indexOf(id) === i);
                const nextId = uniqueIds.length > 0 ? uniqueIds[0] : '';
                if (row.subcpmkId && row.subcpmkId !== nextId && getWeeklyAssessmentComponents(row).length > 0) {
                    alert('Hapus komponen penilaian pada baris ini sebelum mengganti SubCPMK.');
                    renderApp();
                    return;
                }
                row.subcpmkIds = uniqueIds;
                row.subcpmkId = nextId;
                markWeeklyDraftDirty(ctx);
                saveState();
                renderApp();
                return;
            }
            if (field === 'bobotPenilaian') {
                const row = ctx.cls.rps.weeklyPlan[idx];
                const selectedIds = getRpsWeeklySubcpmkIds(row);
                const nextValue = value === '' ? '' : (parseFloat(value) || 0);
                if (selectedIds.length > 0) {
                    if (!row.subcpmkWeights || typeof row.subcpmkWeights !== 'object') row.subcpmkWeights = {};
                    row.subcpmkWeights[selectedIds[0]] = nextValue;
                } else {
                    row.bobotPenilaian = nextValue;
                }
                saveState();
                renderApp();
                return;
            }
            ctx.cls.rps.weeklyPlan[idx][field] = value;
            markWeeklyDraftDirty(ctx);
            saveState();
            renderApp();
        }

        function getWeeklyMatrixValidation(classKey) {
            const ctx = ensureRPSData(classKey);
            if (!ctx) return { valid: false, messages: ['Data kelas tidak ditemukan.'] };
            const rows = ctx.cls.rps.weeklyPlan || [];
            const messages = [];
            if (rows.length === 0) messages.push('Tambahkan minimal satu pertemuan.');
            const usedWeekValues = new Set();
            rows.forEach((row, idx) => {
                const weekSelections = getWeeklyWeekSelections(row);
                const label = `Baris ${idx + 1}`;
                if (weekSelections.length === 0) messages.push(`${label}: minggu ke belum dipilih.`);
                weekSelections.forEach(value => {
                    if (usedWeekValues.has(value)) messages.push(`${label}: pilihan minggu ${value} sudah digunakan pada baris lain.`);
                    usedWeekValues.add(value);
                });
                if (isWeeklyExamRow(row)) return;
                if (!row.subcpmkId) messages.push(`${label}: SubCPMK belum dipilih.`);
                if (getWeeklyAssessmentComponents(row).length === 0) messages.push(`${label}: belum memiliki komponen tes atau non-tes.`);
                getWeeklyAssessmentComponents(row).forEach(component => {
                    if (!getWeeklyComponentCriterion(component)) messages.push(`${label}: komponen ${component.name || 'tanpa nama'} belum memiliki kriteria.`);
                    if (!['Formatif', 'Sumatif'].includes(component.assessmentInstrument)) {
                        messages.push(`${label}: jenis instrumen komponen ${component.name || 'tanpa nama'} belum dipilih.`);
                    }
                });
            });
            (ctx.cls.subCpmkList || []).forEach(sub => {
                const target = getRpsSubcpmkTargetTotal(classKey, sub.id);
                const used = getRpsWeeklyUsedTotal(classKey, sub.id, -1);
                if (!numbersAreEqual(used, target)) {
                    messages.push(`${sub.code}: total bobot ${used}% harus sama dengan target ${target}%.`);
                }
            });
            return { valid: messages.length === 0, messages: messages };
        }

        function buildKomponenListFromWeekly(classKey) {
            const ctx = ensureRPSData(classKey);
            if (!ctx) return [];
            const list = [];
            (ctx.cls.rps.weeklyPlan || []).forEach((row, rowIdx) => {
                if (isWeeklyExamRow(row)) return;
                getWeeklyAssessmentComponents(row).forEach(component => {
                    list.push({
                        id: component.id,
                        jenis: component.jenis,
                        name: component.name,
                        technique: component.technique,
                        weeklyRowId: row.id || '',
                        weekNumber: getWeeklyWeekSelections(row).join(', ') || rowIdx + 1,
                        criteria: [getWeeklyComponentCriterion(component)].filter(Boolean),
                        criterionType: component.criterionType || '',
                        criterionLabel: component.criterionLabel || '',
                        assignmentScope: component.assignmentScope || '',
                        assignmentInstructions: component.assignmentInstructions || '',
                        assignmentMethod: component.assignmentMethod || '',
                        performanceEvidence: component.performanceEvidence || '',
                        durationDeadline: component.durationDeadline || '',
                        assessmentNotes: component.assessmentNotes || '',
                        assessmentInstrument: component.assessmentInstrument || '',
                        formativeCriterion: component.formativeCriterion || '',
                        summativeCriterion: component.summativeCriterion || '',
                        weights: row.subcpmkId ? { [row.subcpmkId]: parseFloat(component.weight) || 0 } : {}
                    });
                });
            });
            return list;
        }

        function saveWeeklyMatrixDraft(classKey, showMessage = true) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || ctx.cls.weeklyMatrixFinalized) return;
            ctx.cls.komponenList = buildKomponenListFromWeekly(classKey);
            ctx.cls.weeklyDraftSaved = true;
            ctx.cls.weeklyDraftDirty = false;
            saveState();
            renderApp();
            if (showMessage) alert('Draft matriks mingguan disimpan dan Bab 4 telah diperbarui.');
        }

        function updateWeeklyDraftComponentWeight(classKey, componentId, subcpmkId, value) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || ctx.cls.weeklyMatrixFinalized || !ctx.cls.weeklyDraftSaved) return;
            let sourceRow = null;
            let sourceComponent = null;
            (ctx.cls.rps.weeklyPlan || []).some(row => {
                const component = getWeeklyAssessmentComponents(row).find(item => item.id === componentId);
                if (!component) return false;
                sourceRow = row;
                sourceComponent = component;
                return true;
            });
            if (!sourceRow || !sourceComponent || sourceRow.subcpmkId !== subcpmkId) return;
            const nextValue = value === '' ? 0 : (parseFloat(value) || 0);
            const targetTotal = getRpsSubcpmkTargetTotal(classKey, subcpmkId);
            const sourceRowIdx = (ctx.cls.rps.weeklyPlan || []).indexOf(sourceRow);
            const usedOtherRows = getRpsWeeklyUsedTotal(classKey, subcpmkId, sourceRowIdx);
            const otherComponentsInRow = getWeeklyAssessmentComponents(sourceRow)
                .filter(component => component.id !== componentId)
                .reduce((sum, component) => sum + (parseFloat(component.weight) || 0), 0);
            if (nextValue < 0 || usedOtherRows + otherComponentsInRow + nextValue > targetTotal) {
                alert(`Bobot melebihi target ${getRpsSubcpmkLabel(classKey, subcpmkId)} sebesar ${targetTotal}%.`);
                renderApp();
                return;
            }
            sourceComponent.weight = nextValue;
            const draftComponent = (ctx.cls.komponenList || []).find(component => component.id === componentId);
            if (draftComponent) draftComponent.weights = { [subcpmkId]: nextValue };
            ctx.cls.weeklyDraftDirty = false;
            saveState();
            renderApp();
        }

        function updateWeeklyDraftComponentField(classKey, componentId, field, value) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || ctx.cls.weeklyMatrixFinalized || !ctx.cls.weeklyDraftSaved) return;
            const component = (ctx.cls.komponenList || []).find(item => item.id === componentId);
            if (!component) return;
            if (field === 'criterionLabel' && component.criterionType === 'Kriteria Lainnya' && !String(value || '').trim()) {
                alert('Kriteria lainnya wajib diisi.');
                return;
            }
            if (field === 'criterionType') {
                component.criterionType = value;
                component.criterionLabel = value === 'Kriteria Lainnya' ? (component.criterionLabel || '') : value;
            } else if (field === 'technique') {
                component.technique = value === 'non_tes' ? 'non_tes' : 'tes';
            } else if (field === 'jenis') {
                component.jenis = value;
            } else if (field === 'name') {
                component.name = value;
            } else if (field === 'criterionLabel') {
                component.criterionLabel = value;
            }

            (ctx.cls.rps.weeklyPlan || []).forEach(row => {
                const weeklyComponent = getWeeklyAssessmentComponents(row).find(item => item.id === componentId);
                if (weeklyComponent) {
                    weeklyComponent[field] = field === 'technique' ? (value === 'non_tes' ? 'non_tes' : 'tes') : value;
                    if (field === 'criterionType') {
                        weeklyComponent.criterionLabel = value === 'Kriteria Lainnya' ? (weeklyComponent.criterionLabel || '') : value;
                    }
                }
            });
            ctx.cls.weeklyDraftDirty = false;
            saveState();
            renderApp();
        }

        function updateAssessmentDetailField(classKey, componentId, field, value) {
            const allowedFields = [
                'assignmentScope',
                'assignmentInstructions',
                'assignmentMethod',
                'performanceEvidence',
                'durationDeadline',
                'assessmentNotes',
                'assessmentInstrument'
            ];
            if (!allowedFields.includes(field)) return;
            const ctx = ensureRPSData(classKey);
            if (!ctx || ctx.cls.weeklyMatrixFinalized || !ctx.cls.weeklyDraftSaved) return;

            const draftComponent = (ctx.cls.komponenList || []).find(component => component.id === componentId);
            if (!draftComponent) return;
            if (field === 'assessmentInstrument' && !['', 'Formatif', 'Sumatif'].includes(value)) return;
            draftComponent[field] = value;
            if (field === 'assessmentInstrument') {
                draftComponent.formativeCriterion = value === 'Formatif' ? (draftComponent.criterionLabel || '') : '';
                draftComponent.summativeCriterion = value === 'Sumatif' ? (draftComponent.criterionLabel || '') : '';
            }

            (ctx.cls.rps.weeklyPlan || []).some(row => {
                const weeklyComponent = getWeeklyAssessmentComponents(row).find(component => component.id === componentId);
                if (!weeklyComponent) return false;
                weeklyComponent[field] = value;
                if (field === 'assessmentInstrument') {
                    weeklyComponent.formativeCriterion = value === 'Formatif' ? (weeklyComponent.criterionLabel || '') : '';
                    weeklyComponent.summativeCriterion = value === 'Sumatif' ? (weeklyComponent.criterionLabel || '') : '';
                }
                return true;
            });
            ctx.cls.weeklyDraftDirty = false;
            saveState();
        }

        function finalizeWeeklyMatrix(classKey) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || ctx.cls.weeklyMatrixFinalized) return;
            if (!ctx.cls.subCpmkFinalized) {
                alert('Bab 3 belum dapat difinalisasi. Finalisasi Matriks SubCPMK - CPMK pada bagian 2f terlebih dahulu.');
                return;
            }
            const validation = getWeeklyMatrixValidation(classKey);
            if (!validation.valid) {
                alert('Matriks mingguan belum dapat difinalisasi:\n\n' + validation.messages.join('\n'));
                return;
            }
            ctx.cls.komponenList = buildKomponenListFromWeekly(classKey);
            ctx.cls.weeklyDraftSaved = true;
            ctx.cls.weeklyDraftDirty = false;
            ctx.cls.weeklyMatrixFinalized = true;
            ctx.cls.komponenFinalized = false;
            closeWeeklyEntryModal();
            saveState();
            renderApp();
            alert('Matriks pembelajaran mingguan berhasil difinalisasi. Bab 4 telah diperbarui.');
        }

        function unfinalizeWeeklyMatrix(classKey) {
            const ctx = ensureRPSData(classKey);
            if (!ctx) return;
            if (ctx.cls.rpsFinalized || ctx.cls.komponenFinalized) {
                alert('Bab 3 belum dapat dibuka. Buka kunci RPS dan Bab 4 Rincian Evaluasi / Asesmen terlebih dahulu.');
                return;
            }
            ctx.cls.weeklyMatrixFinalized = false;
            saveState();
            renderApp();
            alert('Bab 3 Matriks Pembelajaran Mingguan telah dibuka.');
        }

        function finalizeAssessmentDetails(classKey) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || ctx.cls.komponenFinalized) return;
            if (!ctx.cls.weeklyMatrixFinalized) {
                alert('Bab 4 belum dapat difinalisasi. Finalisasi Matriks Pembelajaran Mingguan pada Bab 3 terlebih dahulu.');
                return;
            }
            if (!Array.isArray(ctx.cls.komponenList) || ctx.cls.komponenList.length === 0) {
                alert('Bab 4 belum dapat difinalisasi karena belum ada komponen evaluasi / asesmen.');
                return;
            }
            ctx.cls.komponenFinalized = true;
            saveState();
            renderApp();
            alert('Bab 4 Rincian Evaluasi / Asesmen berhasil difinalisasi.');
        }

        function unfinalizeAssessmentDetails(classKey) {
            const ctx = ensureRPSData(classKey);
            if (!ctx) return;
            if (ctx.cls.rpsFinalized) {
                alert('Bab 4 belum dapat dibuka. Buka kunci RPS terlebih dahulu.');
                return;
            }
            ctx.cls.komponenFinalized = false;
            saveState();
            renderApp();
            alert('Bab 4 Rincian Evaluasi / Asesmen telah dibuka.');
        }

        function addRpsBahanKajian(classKey) {
            const ctx = ensureRPSData(classKey);
            if (!ctx) return;
            if (!Array.isArray(ctx.cls.rps.bahanKajianItems)) {
                ctx.cls.rps.bahanKajianItems = [];
            }
            ctx.cls.rps.bahanKajianItems.push({ id: 'BK_' + Date.now(), isi: '' });
            saveState();
            renderApp();
        }

        function deleteRpsBahanKajian(classKey, idx) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || !Array.isArray(ctx.cls.rps.bahanKajianItems)) return;
            ctx.cls.rps.bahanKajianItems.splice(idx, 1);
            saveState();
            renderApp();
        }

        function updateRpsBahanKajian(classKey, idx, isi) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || !Array.isArray(ctx.cls.rps.bahanKajianItems)) return;
            ctx.cls.rps.bahanKajianItems[idx].isi = isi;
            saveState();
            renderApp();
        }

        function addRpsDaftarPustaka(classKey, jenis) {
            const ctx = ensureRPSData(classKey);
            if (!ctx) return;
            if (!Array.isArray(ctx.cls.rps.daftarPustakaItems)) {
                ctx.cls.rps.daftarPustakaItems = [];
            }
            ctx.cls.rps.daftarPustakaItems.push({ id: 'DP_' + Date.now(), isi: '', jenis: jenis });
            saveState();
            renderApp();
        }

        function deleteRpsDaftarPustaka(classKey, idx) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || !Array.isArray(ctx.cls.rps.daftarPustakaItems)) return;
            ctx.cls.rps.daftarPustakaItems.splice(idx, 1);
            saveState();
            renderApp();
        }

        function updateRpsDaftarPustaka(classKey, idx, isi) {
            const ctx = ensureRPSData(classKey);
            if (!ctx || !Array.isArray(ctx.cls.rps.daftarPustakaItems)) return;
            ctx.cls.rps.daftarPustakaItems[idx].isi = isi;
            saveState();
            renderApp();
        }

        const RUBRIC_SETUP_TYPES = {
            holistic: {
                label: 'Rubrik Holistik',
                color: 'blue',
                columns: [
                    { field: 'grade', label: 'Grade', kind: 'grade', width: 'min-w-[160px]' },
                    { field: 'score', label: 'Skor', kind: 'number', width: 'w-20' },
                    { field: 'criterion', label: 'Kriteria Penilaian', kind: 'textarea', width: 'min-w-[420px]' }
                ]
            },
            analytic: {
                label: 'Rubrik Analitik',
                color: 'indigo',
                columns: [
                    { field: 'aspect', label: 'Aspek / Dimensi yang Dinilai', kind: 'text', width: 'min-w-[200px]' },
                    { field: 'weight', label: 'Bobot (%)', kind: 'number', width: 'w-24' },
                    { field: 'veryPoor', label: 'Sangat Kurang', kind: 'textarea', width: 'min-w-[200px]' },
                    { field: 'poor', label: 'Kurang', kind: 'textarea', width: 'min-w-[200px]' },
                    { field: 'fair', label: 'Cukup', kind: 'textarea', width: 'min-w-[200px]' },
                    { field: 'good', label: 'Baik', kind: 'textarea', width: 'min-w-[200px]' },
                    { field: 'veryGood', label: 'Sangat Baik', kind: 'textarea', width: 'min-w-[200px]' }
                ]
            },
            perception: {
                label: 'Rubrik Skala Persepsi',
                color: 'emerald',
                columns: [
                    { field: 'aspect', label: 'Aspek / Dimensi yang Dinilai', kind: 'textarea', width: 'min-w-[260px]' },
                    { field: 'weight', label: 'Bobot (%)', kind: 'number', width: 'w-24' },
                    { field: 'veryPoor', label: 'Sangat Kurang', kind: 'textarea', width: 'min-w-[180px]' },
                    { field: 'poor', label: 'Kurang', kind: 'textarea', width: 'min-w-[180px]' },
                    { field: 'fair', label: 'Cukup', kind: 'textarea', width: 'min-w-[180px]' },
                    { field: 'good', label: 'Baik', kind: 'textarea', width: 'min-w-[180px]' },
                    { field: 'veryGood', label: 'Sangat Baik', kind: 'textarea', width: 'min-w-[180px]' }
                ]
            },
            portfolio: {
                label: 'Portofolio',
                color: 'amber',
                columns: [
                    { field: 'aspect', label: 'Aspek / Dimensi yang Dinilai', kind: 'textarea', width: 'min-w-[300px]' },
                    { field: 'lowScore', label: 'Skor Rendah (1-5)', kind: 'textarea', width: 'min-w-[300px]' },
                    { field: 'highScore', label: 'Skor Tinggi (6-10)', kind: 'textarea', width: 'min-w-[300px]' }
                ]
            },
            custom: {
                label: 'Custom Kriteria / Rubrik',
                color: 'slate',
                columns: []
            }
        };

        function getRubricSetupType(component) {
            const criterionType = component ? (component.criterionType || component.criterionLabel || '') : '';
            if (criterionType === 'Rubrik Holistik') return 'holistic';
            if (criterionType === 'Rubrik Analitik') return 'analytic';
            if (criterionType === 'Rubrik Skala Persepsi') return 'perception';
            if (criterionType === 'Portofolio') return 'portfolio';
            return 'custom';
        }

        function createRubricSetupRow(type, presetIndex) {
            if (type === 'holistic') {
                const presets = [
                    { grade: 'Sangat Baik', score: 5, criterion: '' },
                    { grade: 'Baik', score: 4, criterion: '' },
                    { grade: 'Cukup', score: 3, criterion: '' },
                    { grade: 'Kurang', score: 2, criterion: '' },
                    { grade: 'Sangat Kurang', score: 1, criterion: '' }
                ];
                return presets[presetIndex] || { grade: '', score: '', criterion: '' };
            }
            if (type === 'analytic' || type === 'perception') {
                return { aspect: '', weight: '', veryPoor: '', poor: '', fair: '', good: '', veryGood: '' };
            }
            if (type === 'portfolio') return { aspect: '', lowScore: '', highScore: '' };
            return {};
        }

        function createRubricSetup(component) {
            const type = getRubricSetupType(component);
            return {
                type: type,
                schemaVersion: 2,
                instructions: '',
                rows: type === 'holistic'
                    ? [0, 1, 2, 3, 4].map(index => createRubricSetupRow(type, index))
                    : [createRubricSetupRow(type, 0)],
                columns: type === 'custom'
                    ? [
                        { field: 'custom_criterion', label: 'Kriteria', kind: 'textarea', width: 'min-w-[220px]' },
                        { field: 'custom_description', label: 'Deskripsi', kind: 'textarea', width: 'min-w-[300px]' }
                    ]
                    : undefined
            };
        }

        function migrateRubricSetup(setup, type) {
            const rows = Array.isArray(setup.rows) ? setup.rows : [];
            let migratedRows;
            if (type === 'holistic') {
                migratedRows = rows.map(row => ({
                    grade: row.grade || row.level || '',
                    score: row.score ?? '',
                    criterion: row.criterion || row.description || ''
                }));
                const existingGrades = new Set(migratedRows.map(row => row.grade));
                ['Sangat Baik', 'Baik', 'Cukup', 'Kurang', 'Sangat Kurang'].forEach((grade, index) => {
                    if (!existingGrades.has(grade)) migratedRows.push(createRubricSetupRow(type, index));
                });
            } else if (type === 'analytic') {
                migratedRows = rows.map(row => ({
                    aspect: row.aspect || '',
                    weight: row.weight ?? '',
                    veryPoor: row.veryPoor || '',
                    poor: row.poor || row.level1 || '',
                    fair: row.fair || row.level2 || '',
                    good: row.good || row.level3 || '',
                    veryGood: row.veryGood || row.level4 || ''
                }));
            } else if (type === 'perception') {
                migratedRows = rows.map(row => ({
                    aspect: row.aspect || row.statement || row.dimension || '',
                    weight: row.weight ?? '',
                    veryPoor: row.veryPoor || '',
                    poor: row.poor || '',
                    fair: row.fair || '',
                    good: row.good || '',
                    veryGood: row.veryGood || ''
                }));
            } else if (type === 'portfolio') {
                migratedRows = rows.map(row => ({
                    aspect: row.aspect || row.criterion || '',
                    lowScore: row.lowScore || row.evidence || '',
                    highScore: row.highScore || row.standard || ''
                }));
            } else {
                const hasLegacyCustomFields = rows.some(row =>
                    ['criterion', 'indicator', 'maxScore', 'description'].some(field =>
                        Object.prototype.hasOwnProperty.call(row, field)
                    )
                );
                const existingColumns = Array.isArray(setup.columns) && setup.columns.length > 0
                    ? setup.columns
                    : (hasLegacyCustomFields
                        ? [
                            { field: 'custom_criterion', label: 'Kriteria', kind: 'textarea', width: 'min-w-[220px]' },
                            { field: 'custom_indicator', label: 'Indikator', kind: 'textarea', width: 'min-w-[260px]' },
                            { field: 'custom_max_score', label: 'Skor Maks.', kind: 'textarea', width: 'min-w-[140px]' },
                            { field: 'custom_description', label: 'Deskripsi', kind: 'textarea', width: 'min-w-[300px]' }
                        ]
                        : [
                            { field: 'custom_criterion', label: 'Kriteria', kind: 'textarea', width: 'min-w-[220px]' },
                            { field: 'custom_description', label: 'Deskripsi', kind: 'textarea', width: 'min-w-[300px]' }
                        ]);
                setup.columns = existingColumns;
                migratedRows = rows.map(row => {
                    if (Object.keys(row).some(field => field.startsWith('custom_'))) return row;
                    const migratedRow = {};
                    existingColumns.forEach(column => {
                        if (column.field === 'custom_criterion') migratedRow[column.field] = row.criterion || '';
                        else if (column.field === 'custom_indicator') migratedRow[column.field] = row.indicator || '';
                        else if (column.field === 'custom_max_score') migratedRow[column.field] = row.maxScore ?? '';
                        else if (column.field === 'custom_description') migratedRow[column.field] = row.description || '';
                        else migratedRow[column.field] = '';
                    });
                    return migratedRow;
                });
            }
            setup.rows = migratedRows.length > 0 ? migratedRows : [createRubricSetupRow(type, 0)];
            setup.schemaVersion = 2;
            return setup;
        }

        function getRubricSetupColumns(setup) {
            return setup.type === 'custom'
                ? (Array.isArray(setup.columns) ? setup.columns : [])
                : RUBRIC_SETUP_TYPES[setup.type].columns;
        }

        function ensureComponentRubricSetup(classKey, componentId) {
            const ctx = ensureRPSData(classKey);
            if (!ctx) return null;
            const component = (ctx.cls.komponenList || []).find(item => item.id === componentId);
            if (!component) return null;
            const type = getRubricSetupType(component);
            let setup = ctx.cls.rps.rubricSetups[componentId];
            if (!setup || setup.type !== type) {
                setup = createRubricSetup(component);
                ctx.cls.rps.rubricSetups[componentId] = setup;
            }
            if (setup.schemaVersion !== 2) migrateRubricSetup(setup, type);
            if (!Array.isArray(setup.rows)) setup.rows = [];
            if (setup.instructions === undefined || setup.instructions === null) setup.instructions = '';
            return { ctx: ctx, component: component, setup: setup };
        }

        function updateRubricSetupField(classKey, componentId, field, value) {
            if (field !== 'instructions') return;
            const data = ensureComponentRubricSetup(classKey, componentId);
            if (!data) return;
            data.setup[field] = value;
            saveState();
        }

        function updateRubricSetupRow(classKey, componentId, rowIndex, field, value) {
            const data = ensureComponentRubricSetup(classKey, componentId);
            if (!data || !data.setup.rows[rowIndex]) return;
            const columns = getRubricSetupColumns(data.setup);
            if (!columns.some(column => column.field === field)) return;
            data.setup.rows[rowIndex][field] = value;
            saveState();
        }

        function addCustomRubricColumn(classKey, componentId) {
            const data = ensureComponentRubricSetup(classKey, componentId);
            if (!data || data.setup.type !== 'custom') return;
            const field = 'custom_' + Date.now();
            data.setup.columns.push({ field: field, label: `Kolom ${data.setup.columns.length + 1}`, kind: 'textarea', width: 'min-w-[220px]' });
            data.setup.rows.forEach(row => { row[field] = ''; });
            saveState();
            renderApp();
        }

        function updateCustomRubricColumn(classKey, componentId, columnIndex, label) {
            const data = ensureComponentRubricSetup(classKey, componentId);
            if (!data || data.setup.type !== 'custom' || !data.setup.columns[columnIndex]) return;
            data.setup.columns[columnIndex].label = label;
            saveState();
        }

        function deleteCustomRubricColumn(classKey, componentId, columnIndex) {
            const data = ensureComponentRubricSetup(classKey, componentId);
            if (!data || data.setup.type !== 'custom' || !data.setup.columns[columnIndex]) return;
            const field = data.setup.columns[columnIndex].field;
            data.setup.columns.splice(columnIndex, 1);
            data.setup.rows.forEach(row => { delete row[field]; });
            saveState();
            renderApp();
        }

        function addRubricSetupRow(classKey, componentId) {
            const data = ensureComponentRubricSetup(classKey, componentId);
            if (!data) return;
            data.setup.rows.push(createRubricSetupRow(data.setup.type, -1));
            saveState();
            renderApp();
        }

        function deleteRubricSetupRow(classKey, componentId, rowIndex) {
            const data = ensureComponentRubricSetup(classKey, componentId);
            if (!data || !data.setup.rows[rowIndex]) return;
            data.setup.rows.splice(rowIndex, 1);
            saveState();
            renderApp();
        }

        function renderRubricSetupCard(classKey, component, rubricIndex) {
            const data = ensureComponentRubricSetup(classKey, component.id);
            if (!data) return '';
            const setup = data.setup;
            const config = RUBRIC_SETUP_TYPES[setup.type];
            const columns = getRubricSetupColumns(setup);
            const totalWeight = ['analytic', 'perception'].includes(setup.type)
                ? setup.rows.reduce((sum, row) => sum + (parseFloat(row.weight) || 0), 0)
                : null;
            const rubricPoint = rubricIndex >= 0 && rubricIndex < 26 ? String.fromCharCode(97 + rubricIndex) + '. ' : '';
            const customColumnSetup = setup.type === 'custom'
                ? `<div class="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div class="flex items-center justify-between gap-3 mb-2">
                            <div class="text-xs font-bold text-slate-700">Pengaturan Kolom Custom</div>
                            <button onclick="addCustomRubricColumn('${classKey}', '${component.id}')" class="text-xs bg-slate-700 hover:bg-slate-800 text-white px-2 py-1 rounded"><i class="fa-solid fa-plus mr-1"></i>Tambah Kolom</button>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            ${columns.length > 0 ? columns.map((column, columnIndex) => `
                                <div class="flex items-center gap-2 rounded border bg-white p-2">
                                    <input type="text" value="${escapeHtml(column.label)}" onchange="updateCustomRubricColumn('${classKey}', '${component.id}', ${columnIndex}, this.value)" class="min-w-0 flex-1 border rounded px-2 py-1 text-xs" placeholder="Nama kolom">
                                    <button onclick="deleteCustomRubricColumn('${classKey}', '${component.id}', ${columnIndex})" class="text-red-600 hover:text-red-800" title="Hapus kolom"><i class="fa-solid fa-trash"></i></button>
                                </div>`).join('') : '<div class="text-xs text-gray-500">Belum ada kolom. Klik Tambah Kolom.</div>'}
                        </div>
                    </div>`
                : '';
            return `
                <article class="rounded-xl border border-gray-200 overflow-hidden">
                    <div class="p-4 bg-gray-50 border-b flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div class="flex flex-wrap items-center gap-2">
                                <h5 class="font-bold text-sm text-gray-800">${rubricPoint}${escapeHtml(component.criterionLabel && component.name ? `${component.criterionLabel} - ${component.name}` : (component.criterionLabel || component.name || 'Rubrik'))}</h5>
                                <span class="rounded-full bg-${config.color}-100 text-${config.color}-800 px-2 py-0.5 text-[10px] font-bold">${config.label}</span>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">${escapeHtml(component.jenis || '-')} · ${escapeHtml(component.assessmentInstrument || 'Jenis instrumen belum dipilih')} · Bobot ${Object.values(component.weights || {}).reduce((sum, value) => sum + (parseFloat(value) || 0), 0)}%</div>
                        </div>
                        ${totalWeight !== null ? `<span class="rounded px-2 py-1 text-xs font-bold ${totalWeight === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">Total Bobot Kriteria: ${totalWeight}%</span>` : ''}
                    </div>
                    <div class="p-4">
                        <div class="mb-3">
                            <label class="block text-xs font-semibold text-gray-600 mb-1">Petunjuk Penggunaan / Penskoran</label>
                            <textarea rows="2" oninput="autoResizeTextarea(this)" onchange="updateRubricSetupField('${classKey}', '${component.id}', 'instructions', this.value)" class="w-full border rounded px-3 py-2 text-sm resize-none overflow-hidden" placeholder="Jelaskan cara menggunakan rubrik dan menentukan skor">${escapeHtml(setup.instructions || '')}</textarea>
                        </div>
                        ${customColumnSetup}
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs border border-gray-200">
                                <thead class="bg-blue-900 text-white">
                                    <tr>
                                        <th class="p-2 w-12 text-center">No</th>
                                        ${columns.map(column => `<th class="p-2 text-left ${column.width || ''}">${escapeHtml(column.label)}</th>`).join('')}
                                        <th class="p-2 w-16 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${setup.rows.length > 0 ? setup.rows.map((row, rowIndex) => `
                                        <tr class="border-b align-top">
                                            <td class="p-2 text-center font-semibold text-gray-500">${rowIndex + 1}</td>
                                            ${columns.map(column => `
                                                <td class="p-2 ${column.width || ''}">
                                                    ${column.kind === 'textarea'
                                                        ? `<textarea rows="2" oninput="autoResizeTextarea(this)" onchange="updateRubricSetupRow('${classKey}', '${component.id}', ${rowIndex}, '${column.field}', this.value)" class="w-full border rounded px-2 py-1.5 resize-none overflow-hidden">${escapeHtml(row[column.field] ?? '')}</textarea>`
                                                        : (column.kind === 'grade'
                                                            ? `<select onchange="updateRubricSetupRow('${classKey}', '${component.id}', ${rowIndex}, '${column.field}', this.value)" class="w-full border rounded px-2 py-1.5 bg-white">
                                                                    <option value="">Pilih grade</option>
                                                                    ${['Sangat Baik', 'Baik', 'Cukup', 'Kurang', 'Sangat Kurang'].map(grade => `<option value="${grade}" ${row[column.field] === grade ? 'selected' : ''}>${grade}</option>`).join('')}
                                                               </select>`
                                                            : `<input type="${column.kind === 'number' ? 'number' : 'text'}" ${column.kind === 'number' ? 'min="0"' : ''} value="${escapeHtml(row[column.field] ?? '')}" onchange="updateRubricSetupRow('${classKey}', '${component.id}', ${rowIndex}, '${column.field}', this.value)" class="w-full border rounded px-2 py-1.5">`)}
                                                </td>`).join('')}
                                            <td class="p-2 text-center"><button onclick="deleteRubricSetupRow('${classKey}', '${component.id}', ${rowIndex})" class="text-red-600 hover:text-red-800" title="Hapus baris"><i class="fa-solid fa-trash"></i></button></td>
                                        </tr>`).join('') : `<tr><td colspan="${columns.length + 2}" class="p-4 text-center text-gray-500">Belum ada rincian rubrik.</td></tr>`}
                                </tbody>
                            </table>
                        </div>
                        <div class="mt-3 flex justify-end">
                            <button onclick="addRubricSetupRow('${classKey}', '${component.id}')" class="bg-blue-700 hover:bg-blue-800 text-white text-xs px-3 py-2 rounded font-semibold"><i class="fa-solid fa-plus mr-1"></i> Tambah Rincian</button>
                        </div>
                    </div>
                </article>`;
        }

        async function openRpsImportModal(classKey) {
            const ctx = getRpsClassContext(classKey);
            if (!ctx || !isPjmkForClass(classKey)) return;
            try {
                const result = await apiRequest(`/rps-templates?courseCode=${encodeURIComponent(ctx.mk.code)}`);
                const templates = result.templates.filter(template => template.id !== `${contextProdiId}:${classKey}`);
                document.getElementById('app-modal-root').innerHTML = `
                    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <form onsubmit="importSelectedRps(event, '${classKey}')" class="w-full max-w-3xl rounded-xl bg-white p-5 shadow-2xl">
                            <div class="mb-4 flex items-start justify-between gap-3">
                                <div><h3 class="font-bold text-gray-900">Impor RPS Sebelumnya</h3><p class="text-xs text-gray-500">Pilih RPS ${escapeHtml(ctx.mk.code)} dari kelas atau tahun akademik lain. Data mahasiswa dan nilai tidak ikut disalin.</p></div>
                                <button type="button" onclick="document.getElementById('app-modal-root').innerHTML=''" class="text-gray-500"><i class="fa-solid fa-xmark"></i></button>
                            </div>
                            <div class="max-h-[55vh] space-y-2 overflow-y-auto rounded border p-3">
                                ${templates.length ? templates.map((template, index) => `
                                    <label class="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-blue-50">
                                        <input type="radio" name="rps-template" value="${index}" required class="mt-1 h-4 w-4">
                                        <span class="text-sm"><strong>${escapeHtml(template.courseCode)} · Kelas ${escapeHtml(template.className)}</strong><br>
                                            <span class="text-xs text-gray-600">${escapeHtml(template.academicYear)} · ${escapeHtml(template.facultyName)} / ${escapeHtml(template.prodiName)}</span><br>
                                            <span class="text-[10px] text-gray-400">Terakhir diperbarui ${escapeHtml(new Date(template.updatedAt).toLocaleString('id-ID'))}</span>
                                        </span>
                                    </label>`).join('') : '<p class="p-4 text-center text-sm text-gray-500">Belum ada RPS sebelumnya untuk mata kuliah ini.</p>'}
                            </div>
                            <div class="mt-4 rounded bg-amber-50 p-3 text-xs text-amber-800"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Impor mengganti isi RPS kelas tujuan. Identitas mata kuliah, dosen pengampu, dan PJMK tetap mengikuti Setup Perkuliahan kelas tujuan.</div>
                            <div class="mt-4 flex justify-end gap-2">
                                <button type="button" onclick="document.getElementById('app-modal-root').innerHTML=''" class="rounded border px-3 py-2 text-xs font-semibold">Batal</button>
                                <button type="submit" ${templates.length ? '' : 'disabled'} class="rounded bg-blue-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"><i class="fa-solid fa-file-import mr-1"></i>Impor RPS</button>
                            </div>
                        </form>
                    </div>`;
                const form = document.querySelector('#app-modal-root form');
                if (form) form._rpsTemplates = templates;
            } catch (error) {
                alert(`Daftar RPS gagal dimuat: ${error.message}`);
            }
        }

        function importSelectedRps(event, classKey) {
            event.preventDefault();
            const form = event.currentTarget;
            const selected = form.querySelector('input[name="rps-template"]:checked');
            const template = selected && form._rpsTemplates ? form._rpsTemplates[Number(selected.value)] : null;
            const target = state.classData[classKey];
            if (!template || !target || !isPjmkForClass(classKey)) return;
            if (target.rps && !confirm('Isi RPS kelas ini akan diganti dengan RPS terpilih. Lanjutkan?')) return;

            const currentIdentity = target.rps && target.rps.identitas ? target.rps.identitas : {};
            const importedRps = JSON.parse(JSON.stringify(template.rps));
            importedRps.identitas = Object.assign({}, importedRps.identitas || {}, {
                mataKuliah: currentIdentity.mataKuliah,
                kodeMK: currentIdentity.kodeMK,
                semester: currentIdentity.semester,
                universitas: currentIdentity.universitas,
                fakultas: currentIdentity.fakultas,
                programStudi: currentIdentity.programStudi,
                dosenPengampu: currentIdentity.dosenPengampu
            });
            target.rps = importedRps;
            target.subCpmkList = JSON.parse(JSON.stringify(template.subCpmkList || []));
            target.komponenList = JSON.parse(JSON.stringify(template.komponenList || []));
            target.subCpmkFinalized = false;
            target.komponenFinalized = false;
            target.weeklyMatrixFinalized = false;
            target.rpsFinalized = false;
            ensureRPSData(classKey);
            document.getElementById('app-modal-root').innerHTML = '';
            saveState();
            renderApp();
            alert('RPS berhasil diimpor dan dibuka kembali untuk penyesuaian.');
        }

        function renderSetupRPS(container) {
            const classKeys = getAccessibleClassKeys('rps');
            if (classKeys.length === 0) {
                container.innerHTML = `<div class="p-4 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 text-sm">${getCurrentRole() === 'dosen' ? 'Belum ada kelas yang diplot kepada akun Anda.' : 'Belum ada kelas perkuliahan. Buat kelas terlebih dahulu di menu Setup Perkuliahan.'}</div>`;
                return;
            }

            if (!state.selectedClassKey || !classKeys.includes(state.selectedClassKey)) {
                state.selectedClassKey = classKeys[0];
            }

            const ctx = ensureRPSData(state.selectedClassKey);
            if (!ctx) {
                container.innerHTML = `<div class="p-4 bg-red-50 text-red-700 rounded border border-red-200 text-sm">Gagal memuat data RPS.</div>`;
                return;
            }

            const cls = ctx.cls;
            const mk = ctx.mk;
            const rps = cls.rps;
            const cpmks = getRpsCpmkList(state.selectedClassKey);
            const subcpmks = cls.subCpmkList || [];
            const komponenList = cls.komponenList || [];
            const weeklyRows = Array.isArray(rps.weeklyPlan) ? rps.weeklyPlan : [];
            const prerequisiteMkOptions = (state.mkList || []).filter(item => item.id !== mk.id);
            const currentClassKey = state.selectedClassKey;
            const mappedCPLs = state.cplList.filter(cpl => mk.cpls && mk.cpls.includes(cpl.id));
            const cpmkReferenceTotals = getCpmkReferenceTotals(cpmks, mappedCPLs);
            const subCpmkReferenceTotals = getSubCpmkReferenceTotals(cls, cpmks);
            if (normalizeSequentialCodes(subcpmks, 'SubCPMK')) saveState();
            const hasValidSubCpmkHierarchy = isSubCpmkHierarchyValid(subcpmks, cpmks);
            if (cls.subCpmkFinalized && !hasValidSubCpmkHierarchy) {
                cls.subCpmkFinalized = false;
                saveState();
            }
            const isSubCpmkLocked = !!cls.subCpmkFinalized;
            const isKomponenLocked = !!cls.komponenFinalized;
            const isWeeklyLocked = !!cls.weeklyMatrixFinalized;
            const isRpsFinalized = !!cls.rpsFinalized;
            const komponenSortState = getKomponenMatrixSortState();
            let sortedKomponenList;
            if (state.doNotSortKomponen) {
                sortedKomponenList = cls.komponenList || [];
                delete state.doNotSortKomponen;
            } else {
                sortedKomponenList = getSortedKomponenList(cls.komponenList || [], komponenSortState);
            }
            
            const allCpls = state.cplList || [];
            const cpls = allCpls.filter(cpl => {
                return cpmks.some(cpmk => {
                    const cpmkData = state.cpmkList[mk.id] && state.cpmkList[mk.id].find(c => c.id === cpmk.id);
                    return cpmkData && cpmkData.weights && cpmkData.weights[cpl.id] && cpmkData.weights[cpl.id] > 0;
                });
            });
            
            const cpmkTotalsByCpl = {};
            const subcpmkTotalsByCpmk = {};

            const renderRpsSubcpmkEntrySection = () => {
                return `
                        <div class="mb-4">
                            <div class="flex justify-between items-center mb-2">
                                <h5 class="font-bold text-sm text-gray-800">c. SUBCPMK</h5>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="w-full text-xs text-left border border-gray-200 rounded-lg">
                                    <thead class="bg-gray-100 text-gray-700">
                                        <tr>
                                            <th class="p-2 w-28">Kode SUBCPMK</th>
                                            <th class="p-2">Deskripsi SubCPMK</th>
                                            <th class="p-2 w-20 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${subcpmks.length === 0
                                            ? `<tr><td colspan="3" class="p-3 text-center text-gray-500">Belum ada SUBCPMK.</td></tr>`
                                            : subcpmks.map((sub, idx) => `
                                                <tr class="border-b hover:bg-gray-50">
                                                    <td class="p-2 font-semibold">${sub.code}</td>
                                                    <td class="p-2">
                                                        <input type="text" value="${sub.desc || ''}" ${isSubCpmkLocked ? 'disabled' : ''}
                                                            onchange="updateSubCPMKDesc('${currentClassKey}', ${idx}, this.value)"
                                                            class="w-full px-2 py-1 border rounded text-xs">
                                                    </td>
                                                    <td class="p-2 text-center">
                                                        ${!isSubCpmkLocked ? `<button onclick="deleteSubCPMK('${currentClassKey}', ${idx})" class="text-red-600 hover:text-red-800"><i class="fa-solid fa-trash"></i></button>` : '-'}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                    </tbody>
                                </table>
                            </div>
                            ${!isSubCpmkLocked ? `
                                <div class="mt-2 flex justify-end">
                                    <button onclick="addSubCPMK('${currentClassKey}')" class="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">+ Tambah</button>
                                </div>
                            ` : ''}
                        </div>`;
            };

            const renderRpsSubcpmkMatrixSection = () => {
                let subCpmkGrandTotal = 0;
                if (subcpmks.length > 0) {
                    subcpmks.forEach(sub => {
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
                    subcpmks.forEach(sub => {
                        colSum += (parseFloat(sub.weights ? sub.weights[cpmk.id] : 0) || 0);
                    });
                    isCpmkValidationValid = isCpmkValidationValid && numbersAreEqual(colSum, cpmkReferenceTotals[cpmk.id] || 0);
                });

                const isSubCpmkReadyToFinalize = subCpmkGrandTotal === 100 && isCpmkValidationValid && hasValidSubCpmkHierarchy;
                let htmlMatrix = `<div class="mb-4"><h5 class="font-bold text-sm text-gray-800 mb-2">f. Matriks SubCPMK - CPMK</h5>`;
                if (subcpmks.length === 0) {
                    htmlMatrix += `<div class="p-3 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 text-sm">Belum ada SUBCPMK. Tambahkan pada poin c terlebih dahulu.</div>`;
                } else {
                    htmlMatrix += `<div class="overflow-x-auto"><table class="w-full text-xs text-left border border-gray-200 rounded-lg"><thead class="bg-blue-900 text-white border-b"><tr><th class="p-2.5 w-28">SubCPMK</th>`;
                    cpmks.forEach(cpmk => { htmlMatrix += `<th class="p-2.5 text-center w-28">${cpmk.code} (%)</th>`; });
                    htmlMatrix += `<th class="p-2.5 w-24 text-center bg-blue-800">Total Bobot</th></tr></thead><tbody>`;
                    subcpmks.forEach((sub, sIdx) => {
                        let rowTotal = 0;
                        htmlMatrix += `<tr class="border-b hover:bg-gray-50"><td class="p-2 font-semibold">${sub.code}</td>`;
                        cpmks.forEach(cpmk => {
                            const w = (sub.weights && sub.weights[cpmk.id]) !== undefined ? sub.weights[cpmk.id] : 0;
                            rowTotal += parseFloat(w) || 0;
                            const displayValue = (parseFloat(w) || 0) > 0 ? w : '';
                            htmlMatrix += `<td class="p-2 text-center"><input type="number" min="0" max="100" value="${displayValue}" ${isSubCpmkLocked ? 'disabled' : ''} onchange="updateSubCpmkWeight('${currentClassKey}', ${sIdx}, '${cpmk.id}', this.value)" class="w-16 border rounded px-1 py-1 text-center font-medium"></td>`;
                        });
                        htmlMatrix += `<td class="p-2 text-center font-bold ${rowTotal > 0 ? 'text-blue-900 bg-blue-50' : 'text-gray-400'}">${rowTotal}%</td></tr>`;
                    });
                    htmlMatrix += `</tbody><tfoot class="bg-gray-100 font-bold"><tr><td colspan="1" class="p-2 text-right">Total Akumulasi Bobot SubCPMK per CPMK:</td>`;
                    cpmks.forEach(cpmk => {
                        let colSum = 0;
                        subcpmks.forEach(sub => { colSum += (parseFloat(sub.weights ? sub.weights[cpmk.id] : 0) || 0); });
                        const targetTotal = cpmkReferenceTotals[cpmk.id] || 0;
                        const isValid = numbersAreEqual(colSum, targetTotal);
                        htmlMatrix += `<td class="p-2 text-center ${isValid ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}">${colSum}%${!isValid ? ` <span class="text-[10px]">(target ${targetTotal}%)</span>` : ''}</td>`;
                    });
                    htmlMatrix += `<td class="p-2 text-center ${subCpmkGrandTotal === 100 ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}">${subCpmkGrandTotal}%</td></tr></tfoot></table></div>`;
                }
                htmlMatrix += `<div class="flex justify-between items-center border-t pt-3 mt-4"><p class="text-xs ${isSubCpmkReadyToFinalize ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}">${isSubCpmkReadyToFinalize ? '<i class="fa-solid fa-circle-check mr-1"></i> Total bobot 100%, setiap SubCPMK mengukur tepat satu CPMK, dan akumulasi tiap CPMK sesuai matriks CPMK-CPL.' : '<i class="fa-solid fa-triangle-exclamation mr-1"></i> Pastikan setiap SubCPMK hanya mengukur satu CPMK, total bobot 100%, dan akumulasi tiap CPMK sesuai target.'}</p><div>${isSubCpmkLocked ? `<span class="bg-green-100 text-green-800 font-bold px-3 py-1.5 rounded text-xs inline-flex items-center"><i class="fa-solid fa-lock mr-1"></i> MATRIKS SubCPMK - CPMK DIFINALISASI</span><button onclick="unfinalizeSubCPMK('${currentClassKey}')" class="ml-2 text-xs text-red-600 underline">Buka Kunci</button>` : `<button class="inline-flex items-center bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-4 py-2 rounded-lg shadow font-bold disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed" ${isSubCpmkReadyToFinalize ? `onclick="finalizeSubCPMK('${currentClassKey}')"` : 'disabled'}><i class="fa-solid fa-check-double mr-1.5"></i> Finalisasi Matriks SubCPMK - CPMK</button>`}</div></div></div>`;
                return htmlMatrix;
            };

            const renderRpsKomponenMatrixSection = () => {
                if (!cls.weeklyDraftSaved && !isWeeklyLocked) {
                    return `
                        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <div class="border-b p-4">
                                <h3 class="text-base font-bold text-gray-800"></i>a. Matriks Komponen Penilaian - SubCPMK</h3>
                                <div class="mt-3 bg-gray-50 p-6 rounded-xl border border-gray-200 text-center text-sm text-gray-600">
                                    <i class="fa-solid fa-floppy-disk fa-2x mb-3 text-gray-400"></i>
                                    <p class="font-semibold">Simpan draft Matriks Pembelajaran Mingguan untuk membentuk matriks ini.</p>
                                    <p class="text-xs text-gray-500 mt-1">Komponen, jenis, SubCPMK, dan bobot akan diambil dari Bab 3.</p>
                                </div>
                            </div>
                            <div class="p-4">
                                <h4 class="text-sm font-bold text-gray-800">b. Rincian Evaluasi / Asesmen</h4>
                                <div class="mt-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">Rincian evaluasi / asesmen akan tersedia setelah draft Bab 3 disimpan.</div>
                            </div>
                        </div>`;
                }

                const components = [...(cls.komponenList || [])].sort((a, b) => {
                    const typeDiff = WEEKLY_COMPONENT_TYPES.indexOf(a.jenis) - WEEKLY_COMPONENT_TYPES.indexOf(b.jenis);
                    if (typeDiff !== 0) return typeDiff;
                    return String(a.name || '').localeCompare(String(b.name || ''), 'id');
                });
                const getAssessmentSubcpmkGroup = component => {
                    const related = subcpmks.filter(sub =>
                        component.weights && Object.prototype.hasOwnProperty.call(component.weights, sub.id)
                    );
                    const key = related.length > 0
                        ? related.map(sub => String(subcpmks.indexOf(sub)).padStart(4, '0')).join('-')
                        : '9999';
                    return { key: key, related: related };
                };
                const assessmentDetailComponents = [...components].sort((a, b) => {
                    const groupDiff = getAssessmentSubcpmkGroup(a).key.localeCompare(getAssessmentSubcpmkGroup(b).key);
                    if (groupDiff !== 0) return groupDiff;
                    const weekDiff = String(a.weekNumber || '').localeCompare(String(b.weekNumber || ''), 'id', { numeric: true });
                    if (weekDiff !== 0) return weekDiff;
                    return String(a.name || '').localeCompare(String(b.name || ''), 'id');
                });
                const typeTotals = {};
                WEEKLY_COMPONENT_TYPES.forEach(type => typeTotals[type] = 0);
                let grandTotal = 0;
                let htmlKomponen = `
                    <div class="bg-white rounded-xl border border-gray-200">
                        <div class="flex items-center justify-between p-4 border-b">
                            <div>
                                <h3 class="text-base font-bold text-gray-800"></i>a. Matriks Komponen Penilaian - SubCPMK</h3>
                                <p class="text-xs text-gray-500">${isWeeklyLocked ? 'Read-only, dibentuk otomatis dari matriks mingguan yang telah difinalisasi.' : 'Draft dari Bab 3. Bobot pada SubCPMK terkait dapat diedit dan langsung tersinkron ke matriks mingguan.'}</p>
                            </div>
                            ${isWeeklyLocked
                                ? `<span class="bg-green-100 text-green-800 font-bold px-3 py-1.5 rounded text-xs"><i class="fa-solid fa-lock mr-1"></i> READ ONLY</span>`
                                : `<span class="bg-amber-100 text-amber-800 font-bold px-3 py-1.5 rounded text-xs"><i class="fa-solid fa-pen mr-1"></i> DRAFT EDITABLE</span>`}
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs text-left border-collapse">
                                <thead class="bg-gray-800 text-white">
                                    <tr>
                                        <th class="p-2.5">Jenis Komponen</th>
                                        <th class="p-2.5">Nama Komponen</th>`;
                subcpmks.forEach(sub => { htmlKomponen += `<th class="p-2.5 text-center w-24">${sub.code} (%)</th>`; });
                htmlKomponen += `<th class="p-2.5 text-center bg-gray-700">Total</th></tr></thead><tbody>`;

                if (components.length === 0) {
                    htmlKomponen += `<tr><td colspan="${3 + subcpmks.length}" class="p-4 text-center text-gray-500">Belum ada komponen dari matriks mingguan.</td></tr>`;
                } else {
                    components.forEach(component => {
                        let rowTotal = 0;
                        htmlKomponen += `<tr class="border-b hover:bg-gray-50 align-top">
                            <td class="p-2">${escapeHtml(component.jenis)}</td>
                            <td class="p-2 font-medium">${escapeHtml(component.name)}</td>`;
                        subcpmks.forEach(sub => {
                            const weight = parseFloat(component.weights && component.weights[sub.id]) || 0;
                            rowTotal += weight;
                            const isMappedSubcpmk = component.weights && Object.prototype.hasOwnProperty.call(component.weights, sub.id);
                            htmlKomponen += `<td class="p-2 text-center ${weight > 0 ? 'font-semibold text-blue-900 bg-blue-50' : 'text-gray-300'}">
                                ${!isWeeklyLocked && isMappedSubcpmk
                                    ? `<input type="number" min="0" max="100" value="${weight || ''}" onchange="updateWeeklyDraftComponentWeight('${currentClassKey}', '${component.id}', '${sub.id}', this.value)" class="w-16 border rounded px-1 py-1 text-center font-semibold text-blue-900 bg-white">`
                                    : (weight > 0 ? weight + '%' : '-')}
                            </td>`;
                        });
                        grandTotal += rowTotal;
                        if (typeTotals[component.jenis] !== undefined) typeTotals[component.jenis] += rowTotal;
                        htmlKomponen += `<td class="p-2 text-center font-bold">${rowTotal}%</td></tr>`;
                    });
                }

                htmlKomponen += `</tbody><tfoot class="bg-gray-100 font-bold"><tr>
                    <td colspan="2" class="p-2 text-right">Total per SubCPMK:</td>`;
                subcpmks.forEach(sub => {
                    const total = components.reduce((sum, component) => sum + (parseFloat(component.weights && component.weights[sub.id]) || 0), 0);
                    htmlKomponen += `<td class="p-2 text-center text-emerald-700 bg-emerald-50">${total}%</td>`;
                });
                htmlKomponen += `<td class="p-2 text-center text-emerald-700 bg-emerald-100">${grandTotal}%</td>
                    </tr></tfoot></table></div>
                    <div class="p-4 border-t bg-gray-50">
                        <div class="text-xs font-bold text-gray-700 mb-2">Akumulasi Bobot per Jenis Komponen</div>
                        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                            ${WEEKLY_COMPONENT_TYPES.map(type => `<div class="rounded border bg-white p-2 text-center"><div class="text-[10px] text-gray-500">${type}</div><div class="font-bold text-blue-900">${typeTotals[type]}%</div></div>`).join('')}
                        </div>
                    </div>
                    <div class="p-4 border-t">
                        <div class="mb-3">
                            <div class="text-sm font-bold text-gray-800">b. Rincian Evaluasi / Asesmen</div>
                            <div class="text-xs text-gray-500">${isKomponenLocked ? 'Rincian evaluasi / asesmen telah difinalisasi dan terkunci.' : (isWeeklyLocked ? 'Matriks mingguan telah terkunci. Lengkapi rincian lalu finalisasi Rincian Evaluasi / Asesmen.' : 'Lengkapi rincian. Finalisasi Bab 4 tersedia setelah Bab 3 dikunci.')}</div>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full min-w-[1900px] text-xs text-left border-collapse border border-gray-200">
                                <thead class="bg-blue-900 text-white">
                                    <tr>
                                        <th class="p-2.5 w-24 text-center">Minggu ke</th>
                                        <th class="p-2.5 min-w-[220px]">Bentuk Evaluasi</th>
                                        <th class="p-2.5 min-w-[180px]">SubCPMK Terkait</th>
                                        <th class="p-2.5 min-w-[420px]">Deskripsi Penugasan dan Ruang Lingkup</th>
                                        <th class="p-2.5 min-w-[260px]">Tagihan / Luaran Bukti Kinerja</th>
                                        <th class="p-2.5 min-w-[220px]">Durasi / Batas Waktu</th>
                                        <th class="p-2.5 min-w-[280px]">Instrumen Penilaian</th>
                                        <th class="p-2.5 w-28 text-center">Bobot Penilaian</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${assessmentDetailComponents.length === 0
                                        ? `<tr><td colspan="8" class="p-4 text-center text-gray-500">Belum ada komponen evaluasi dari matriks mingguan.</td></tr>`
                                        : assessmentDetailComponents.map((component, componentIndex) => {
                                            const group = getAssessmentSubcpmkGroup(component);
                                            const relatedSubcpmks = group.related;
                                            const previousGroup = componentIndex > 0
                                                ? getAssessmentSubcpmkGroup(assessmentDetailComponents[componentIndex - 1])
                                                : null;
                                            const groupHeader = !previousGroup || previousGroup.key !== group.key
                                                ? `<tr class="bg-blue-50 border-y border-blue-200">
                                                        <td colspan="8" class="px-3 py-2 font-bold text-blue-900">
                                                            <i class="fa-solid fa-layer-group mr-1.5"></i>
                                                            Kelompok SubCPMK: ${relatedSubcpmks.length > 0 ? relatedSubcpmks.map(sub => escapeHtml(sub.code)).join(' + ') : 'Belum Dipetakan'}
                                                        </td>
                                                   </tr>`
                                                : '';
                                            const componentWeight = relatedSubcpmks.reduce((sum, sub) => sum + (parseFloat(component.weights[sub.id]) || 0), 0);
                                            return `${groupHeader}
                                                <tr class="border-b align-top hover:bg-gray-50">
                                                    <td class="p-2 text-center font-semibold text-blue-900">${escapeHtml(component.weekNumber || '-')}</td>
                                                    <td class="p-2">
                                                        <div class="font-semibold text-gray-800">${escapeHtml(component.jenis || '-')}</div>
                                                        <div class="mt-1 text-gray-600">${escapeHtml(component.name || '-')}</div>
                                                    </td>
                                                    <td class="p-2">
                                                        <div class="flex flex-wrap gap-1">
                                                            ${relatedSubcpmks.length > 0
                                                                ? relatedSubcpmks.map(sub => `<span class="inline-flex rounded-full bg-blue-100 text-blue-800 px-2 py-1 text-[10px] font-semibold">${escapeHtml(sub.code)}</span>`).join('')
                                                                : '<span class="text-gray-400">-</span>'}
                                                        </div>
                                                    </td>
                                                    <td class="p-2">
                                                        ${isKomponenLocked
                                                            ? `<div class="space-y-2">
                                                                    <div><span class="font-semibold">Ruang Lingkup:</span><div class="whitespace-pre-line">${escapeHtml(component.assignmentScope || '-')}</div></div>
                                                                    <div><span class="font-semibold">Instruksi:</span><div class="whitespace-pre-line">${escapeHtml(component.assignmentInstructions || '-')}</div></div>
                                                                    <div><span class="font-semibold">Metode:</span><div class="whitespace-pre-line">${escapeHtml(component.assignmentMethod || '-')}</div></div>
                                                                </div>`
                                                            : `<div class="space-y-2">
                                                                    <div><label class="block text-[10px] font-semibold text-gray-500 mb-1">Ruang Lingkup</label><textarea rows="2" oninput="autoResizeTextarea(this)" onchange="updateAssessmentDetailField('${currentClassKey}', '${component.id}', 'assignmentScope', this.value)" class="w-full border rounded px-2 py-1 resize-none overflow-hidden">${escapeHtml(component.assignmentScope || '')}</textarea></div>
                                                                    <div><label class="block text-[10px] font-semibold text-gray-500 mb-1">Instruksi</label><textarea rows="2" oninput="autoResizeTextarea(this)" onchange="updateAssessmentDetailField('${currentClassKey}', '${component.id}', 'assignmentInstructions', this.value)" class="w-full border rounded px-2 py-1 resize-none overflow-hidden">${escapeHtml(component.assignmentInstructions || '')}</textarea></div>
                                                                    <div><label class="block text-[10px] font-semibold text-gray-500 mb-1">Metode</label><textarea rows="2" oninput="autoResizeTextarea(this)" onchange="updateAssessmentDetailField('${currentClassKey}', '${component.id}', 'assignmentMethod', this.value)" class="w-full border rounded px-2 py-1 resize-none overflow-hidden">${escapeHtml(component.assignmentMethod || '')}</textarea></div>
                                                                </div>`}
                                                    </td>
                                                    <td class="p-2">
                                                        ${isKomponenLocked
                                                            ? `<div class="whitespace-pre-line">${escapeHtml(component.performanceEvidence || '-')}</div>`
                                                            : `<textarea rows="3" oninput="autoResizeTextarea(this)" onchange="updateAssessmentDetailField('${currentClassKey}', '${component.id}', 'performanceEvidence', this.value)" class="w-full border rounded px-2 py-1 resize-none overflow-hidden">${escapeHtml(component.performanceEvidence || '')}</textarea>`}
                                                    </td>
                                                    <td class="p-2">
                                                        ${isKomponenLocked
                                                            ? `<div class="whitespace-pre-line">${escapeHtml(component.durationDeadline || '-')}</div>`
                                                            : `<textarea rows="3" oninput="autoResizeTextarea(this)" onchange="updateAssessmentDetailField('${currentClassKey}', '${component.id}', 'durationDeadline', this.value)" class="w-full border rounded px-2 py-1 resize-none overflow-hidden">${escapeHtml(component.durationDeadline || '')}</textarea>`}
                                                    </td>
                                                    <td class="p-2">
                                                        ${isKomponenLocked
                                                            ? `<div class="space-y-2">
                                                                    <div>
                                                                        <div class="text-[10px] font-bold uppercase text-gray-500">Jenis Instrumen</div>
                                                                        <span class="mt-1 inline-flex rounded-full px-2 py-1 font-semibold ${component.assessmentInstrument === 'Sumatif' ? 'bg-purple-100 text-purple-800' : (component.assessmentInstrument === 'Formatif' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500')}">${escapeHtml(component.assessmentInstrument || '-')}</span>
                                                                    </div>
                                                                    <div>
                                                                        <div class="text-[10px] font-bold uppercase text-gray-500">Kriteria / Rubrik</div>
                                                                        <div class="mt-1 rounded border border-amber-200 bg-amber-50 px-2 py-1.5 font-semibold text-amber-900">${escapeHtml(component.criterionLabel && component.name ? `${component.criterionLabel} - ${component.name}` : (component.criterionLabel || component.name || '-'))}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div class="text-[10px] font-bold uppercase text-gray-500">Keterangan Tambahan</div>
                                                                        <div class="mt-1 whitespace-pre-line text-gray-700">${escapeHtml(component.assessmentNotes || '-')}</div>
                                                                    </div>
                                                                </div>`
                                                            : `<div class="space-y-2">
                                                                    <div>
                                                                        <label class="block text-[10px] font-bold uppercase text-gray-600 mb-1">Jenis Instrumen</label>
                                                                        <select onchange="updateAssessmentDetailField('${currentClassKey}', '${component.id}', 'assessmentInstrument', this.value)" class="w-full border rounded px-2 py-1.5 bg-white">
                                                                            <option value="" ${!component.assessmentInstrument ? 'selected' : ''}>Pilih jenis instrumen</option>
                                                                            <option value="Formatif" ${component.assessmentInstrument === 'Formatif' ? 'selected' : ''}>Formatif</option>
                                                                            <option value="Sumatif" ${component.assessmentInstrument === 'Sumatif' ? 'selected' : ''}>Sumatif</option>
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <div class="text-[10px] font-bold uppercase text-gray-500 mb-1">Kriteria / Rubrik yang Ditetapkan</div>
                                                                        <div class="rounded border border-amber-200 bg-amber-50 px-2 py-1.5 font-semibold text-amber-900">${escapeHtml(component.criterionLabel && component.name ? `${component.criterionLabel} - ${component.name}` : (component.criterionLabel || component.name || '-'))}</div>
                                                                    </div>
                                                                    <div>
                                                                        <label class="block text-[10px] font-bold uppercase text-gray-600 mb-1">Keterangan Tambahan</label>
                                                                        <textarea rows="2" oninput="autoResizeTextarea(this)" onchange="updateAssessmentDetailField('${currentClassKey}', '${component.id}', 'assessmentNotes', this.value)" class="w-full border rounded px-2 py-1.5 resize-none overflow-hidden" placeholder="Isi keterangan tambahan (opsional)">${escapeHtml(component.assessmentNotes || '')}</textarea>
                                                                    </div>
                                                                </div>`}
                                                    </td>
                                                    <td class="p-2 text-center font-bold text-blue-900">${componentWeight}%</td>
                                                </tr>`;
                                        }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="flex flex-wrap items-center justify-between gap-3 border-t bg-gray-50 p-4">
                        <p class="text-xs ${isKomponenLocked ? 'font-semibold text-emerald-700' : (isWeeklyLocked ? 'text-blue-800' : 'text-amber-700')}">
                            ${isKomponenLocked
                                ? '<i class="fa-solid fa-lock mr-1"></i> Bab 4 Rincian Evaluasi / Asesmen telah difinalisasi.'
                                : (isWeeklyLocked
                                    ? '<i class="fa-solid fa-circle-info mr-1"></i> Bab 4 siap dilengkapi dan difinalisasi.'
                                    : '<i class="fa-solid fa-triangle-exclamation mr-1"></i> Finalisasi Bab 3 terlebih dahulu.')}
                        </p>
                        <div>
                            ${isKomponenLocked
                                ? `<span class="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800"><i class="fa-solid fa-lock mr-1.5"></i>RINCIAN EVALUASI / ASESMEN DIFINALISASI</span>
                                   <button onclick="unfinalizeAssessmentDetails('${currentClassKey}')" class="ml-2 text-xs text-red-600 underline">Buka Kunci</button>`
                                : `<button onclick="finalizeAssessmentDetails('${currentClassKey}')" ${!isWeeklyLocked ? 'disabled' : ''} class="inline-flex items-center bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs px-4 py-2 rounded-lg shadow font-bold"><i class="fa-solid fa-check-double mr-1.5"></i>Finalisasi Rincian Evaluasi / Asesmen</button>`}
                        </div>
                    </div>
                </div>
                `;
                return htmlKomponen;
            };

            const renderReadonlyTextTable = (title, rows, cols) => {
                let html = `
                    <div class="mb-4">
                        <h5 class="font-bold text-sm text-gray-800 mb-2">${title}</h5>
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs border border-gray-200 rounded-lg">
                                <thead class="bg-gray-100 text-gray-700">
                                    <tr>`;
                cols.forEach(col => { html += `<th class="p-2 text-left">${col}</th>`; });
                html += `</tr></thead><tbody>`;
                if (!rows || rows.length === 0) {
                    html += `<tr><td colspan="${cols.length}" class="p-3 text-center text-gray-500">Belum ada data.</td></tr>`;
                } else {
                    rows.forEach(row => {
                        html += `<tr class="border-b hover:bg-gray-50">`;
                        cols.forEach(col => {
                            html += `<td class="p-2">${row[col.key] || '-'}</td>`;
                        });
                        html += `</tr>`;
                    });
                }
                html += `</tbody></table></div></div>`;
                return html;
            };

            const renderMatrixReadonly = (title, rowItems, colItems, matrixGetter, rowLabel, showColTotals) => {
                let html = `
                    <div class="mb-4">
                        <h5 class="font-bold text-sm text-gray-800 mb-2">${title}</h5>
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs border border-gray-200 rounded-lg">`;
                html += `<thead class="bg-blue-900 text-white"><tr><th class="p-2 w-44 text-left">${rowLabel}</th>`;
                colItems.forEach(col => { html += `<th class="p-2 text-center min-w-[120px]">${col.code}</th>`; });
                html += `<th class="p-2 w-24 text-center">Total</th></tr></thead><tbody>`;
                if (!rowItems || rowItems.length === 0 || colItems.length === 0) {
                    html += `<tr><td colspan="${2 + colItems.length}" class="p-3 text-center text-gray-500">Belum ada data untuk matriks ini.</td></tr>`;
                } else {
                    rowItems.forEach(row => {
                        let rowTotal = 0;
                        html += `<tr class="border-b hover:bg-gray-50"><td class="p-2 font-semibold">${row.code}</td>`;
                        colItems.forEach(col => {
                            const val = matrixGetter(row.id, col.id) || 0;
                            rowTotal += parseFloat(val) || 0;
                            html += `<td class="p-2 text-center">${val ? val + '%' : '-'}</td>`;
                        });
                        html += `<td class="p-2 text-center font-bold ${rowTotal === 0 ? 'text-gray-500' : 'text-blue-900 bg-blue-50'}">${rowTotal}%</td></tr>`;
                    });
                }
                if (showColTotals && rowItems && rowItems.length > 0 && colItems.length > 0) {
                    html += `<tr class="bg-gray-100 font-bold"><td class="p-2 text-right">Total</td>`;
                    colItems.forEach(col => {
                        let total = 0;
                        rowItems.forEach(row => { total += parseFloat(matrixGetter(row.id, col.id)) || 0; });
                        html += `<td class="p-2 text-center text-blue-900">${total}%</td>`;
                    });
                    let grand = 0;
                    rowItems.forEach(row => {
                        colItems.forEach(col => { grand += parseFloat(matrixGetter(row.id, col.id)) || 0; });
                    });
                    html += `<td class="p-2 text-center ${grand === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${grand}%</td></tr>`;
                }
                html += `</tbody></table></div></div>`;
                return html;
            };

            const renderWeeklyValidation = (row, idx) => {
                const targetTotal = row.subcpmkId ? getRpsSubcpmkTargetTotal(state.selectedClassKey, row.subcpmkId) : 0;
                const usedTotal = row.subcpmkId ? getRpsWeeklyUsedTotal(state.selectedClassKey, row.subcpmkId, idx) + (parseFloat(row.bobotPenilaian) || 0) : 0;
                if (!row.subcpmkId) return 'Pilih SubCPMK';
                if (targetTotal === 0) return 'SubCPMK belum punya bobot target';
                if (usedTotal > targetTotal) return `Melebihi ${usedTotal - targetTotal}%`;
                return `Sisa ${targetTotal - usedTotal}% dari target ${targetTotal}%`;
            };

            const renderCompetencyFlowchart = () => {
                if (!isSubCpmkLocked) {
                    return `<div class="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-6 text-center text-sm text-amber-800"><i class="fa-solid fa-lock mb-2 block text-2xl text-amber-500"></i>Bagan Alir Kompetensi akan ditampilkan setelah Matriks SubCPMK - CPMK pada bagian 2f difinalisasi.</div>`;
                }
                if (mappedCPLs.length === 0 || cpmks.length === 0 || subcpmks.length === 0) {
                    return `<div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">Diagram hierarki akan terbentuk setelah CPL, CPMK, dan SubCPMK dipetakan.</div>`;
                }

                const nodeWidth = 250;
                const columnGap = 42;
                const marginX = 55;
                const labelWidth = 285;
                const profile = { width: 270, height: 80, y: 25 };
                const cplY = 155;
                const cpmkY = 335;
                const standardHeight = 125;
                const subHeight = 135;
                const subGap = 38;

                const cpmkNodes = cpmks.map((cpmk, index) => {
                    const parent = mappedCPLs.find(cpl => (parseFloat(cpmk.weights && cpmk.weights[cpl.id]) || 0) > 0);
                    return {
                        id: cpmk.id,
                        parentId: parent ? parent.id : '',
                        code: cpmk.code,
                        desc: cpmk.desc,
                        weight: parent ? (parseFloat(cpmk.weights[parent.id]) || 0) : 0,
                        x: labelWidth + marginX + (index * (nodeWidth + columnGap)),
                        y: cpmkY,
                        width: nodeWidth,
                        height: standardHeight
                    };
                });
                const treeWidth = (marginX * 2) + (cpmkNodes.length * nodeWidth) + ((cpmkNodes.length - 1) * columnGap);
                const chartWidth = Math.max(1385, labelWidth + treeWidth);
                profile.x = labelWidth + ((treeWidth - profile.width) / 2);

                const cplNodes = mappedCPLs.map(cpl => {
                    const children = cpmkNodes.filter(cpmk => cpmk.parentId === cpl.id);
                    const center = children.length > 0
                        ? children.reduce((sum, child) => sum + child.x + (child.width / 2), 0) / children.length
                        : labelWidth + (treeWidth / 2);
                    return {
                        id: cpl.id,
                        code: cpl.code,
                        desc: cpl.desc,
                        weight: children.reduce((sum, child) => sum + child.weight, 0),
                        x: center - (nodeWidth / 2),
                        y: cplY,
                        width: nodeWidth,
                        height: standardHeight
                    };
                });
                const subcpmkNodes = [];
                cpmkNodes.forEach(cpmk => {
                    subcpmks
                        .filter(sub => (parseFloat(sub.weights && sub.weights[cpmk.id]) || 0) > 0)
                        .forEach((sub, index) => {
                            subcpmkNodes.push({
                                id: sub.id,
                                parentId: cpmk.id,
                                code: sub.code,
                                desc: sub.desc,
                                weight: parseFloat(sub.weights[cpmk.id]) || 0,
                                x: cpmk.x + 30,
                                y: 535 + (index * (subHeight + subGap)),
                                width: nodeWidth - 30,
                                height: subHeight
                            });
                        });
                });
                const maxSubCount = Math.max(...cpmkNodes.map(cpmk => subcpmkNodes.filter(sub => sub.parentId === cpmk.id).length), 1);
                const chartHeight = 560 + (maxSubCount * subHeight) + ((maxSubCount - 1) * subGap) + 35;

                const renderDownArrow = (parent, child) => {
                    const startX = parent.x + (parent.width / 2);
                    const startY = parent.y + parent.height;
                    const endX = child.x + (child.width / 2);
                    const endY = child.y;
                    const branchY = startY + ((endY - startY) / 2);
                    return `<path d="M ${startX} ${startY} V ${branchY} H ${endX} V ${endY - 7}" fill="none" stroke="#111827" stroke-width="2" marker-end="url(#tree-arrow)" />`;
                };
                const renderSubArrow = (parent, child) => {
                    const trunkX = parent.x + 24;
                    const startX = parent.x + (parent.width / 2);
                    const startY = parent.y + parent.height;
                    const endY = child.y + (child.height / 2);
                    return `<path d="M ${startX} ${startY} H ${trunkX} V ${endY} H ${child.x - 7}" fill="none" stroke="#111827" stroke-width="2" marker-end="url(#tree-arrow)" />`;
                };
                const arrows = [
                    ...cplNodes.map(cpl => renderDownArrow(profile, cpl)),
                    ...cpmkNodes.map(cpmk => {
                        const parent = cplNodes.find(cpl => cpl.id === cpmk.parentId);
                        return parent ? renderDownArrow(parent, cpmk) : '';
                    }),
                    ...subcpmkNodes.map(sub => {
                        const parent = cpmkNodes.find(cpmk => cpmk.id === sub.parentId);
                        return parent ? renderSubArrow(parent, sub) : '';
                    })
                ].join('');

                const wrapSvgText = (value, maxChars, maxLines) => {
                    const words = String(value || '').split(/\s+/).filter(Boolean);
                    const lines = [];
                    let line = '';
                    words.forEach(word => {
                        const next = line ? `${line} ${word}` : word;
                        if (next.length > maxChars && line) {
                            lines.push(line);
                            line = word;
                        } else {
                            line = next;
                        }
                    });
                    if (line) lines.push(line);
                    if (lines.length > maxLines) {
                        lines.length = maxLines;
                        lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.…]+$/, '')}…`;
                    }
                    return lines.length ? lines : ['-'];
                };
                const renderSvgTextLines = (lines, x, y, lineHeight, attributes) => `
                    <text x="${x}" y="${y}" ${attributes}>${lines.map((line, index) =>
                        `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeHtml(line)}</tspan>`
                    ).join('')}</text>`;
                const renderNode = node => {
                    const descriptionLines = wrapSvgText(node.desc || 'Deskripsi belum tersedia', 36, node.height >= subHeight ? 6 : 5);
                    return `
                        <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" fill="#ffffff" stroke="#111827" stroke-width="2"></rect>
                        <text x="${node.x + 14}" y="${node.y + 26}" fill="#111827" font-family="Arial, sans-serif" font-size="15" font-weight="700">${escapeHtml(node.code)}</text>
                        <rect x="${node.x + node.width - 53}" y="${node.y + 11}" width="39" height="22" fill="#ffffff" stroke="#111827" stroke-width="1"></rect>
                        <text x="${node.x + node.width - 33.5}" y="${node.y + 26}" text-anchor="middle" fill="#111827" font-family="Arial, sans-serif" font-size="10" font-weight="700">${node.weight}%</text>
                        ${renderSvgTextLines(descriptionLines, node.x + 14, node.y + 51, 15, 'fill="#374151" font-family="Arial, sans-serif" font-size="10"')}
                    `;
                };
                const bandLabels = [
                    {
                        top: 0,
                        bottom: 130,
                        title: 'Profil Lulusan',
                        description: ''
                    },
                    {
                        top: 130,
                        bottom: 310,
                        title: 'CPL',
                        description: 'Kemampuan lulusan yang mencakup sikap, pengetahuan, dan keterampilan sesuai KKNI dan SN-Dikti'
                    },
                    {
                        top: 310,
                        bottom: 510,
                        title: 'CPMK',
                        description: 'Penjabaran CPL yang dibebankan pada mata kuliah tertentu'
                    },
                    {
                        top: 510,
                        bottom: chartHeight,
                        title: 'SubCPMK',
                        description: 'Penjabaran CPMK yang dapat diukur sebagai kemampuan akhir di setiap tahap pembelajaran'
                    }
                ];
                const renderBandLabel = band => {
                    const centerY = band.top + ((band.bottom - band.top) / 2);
                    const descriptionLines = wrapSvgText(band.description, 36, 5);
                    const descriptionHeight = band.description ? descriptionLines.length * 17 : 0;
                    const titleY = centerY - (descriptionHeight / 2);
                    return `
                        <text x="30" y="${titleY}" fill="#111827" font-family="Arial, sans-serif" font-size="15" font-weight="700">${escapeHtml(band.title)}</text>
                        ${band.description ? renderSvgTextLines(descriptionLines, 30, titleY + 27, 17, 'fill="#4b5563" font-family="Arial, sans-serif" font-size="11"') : ''}
                    `;
                };

                return `
                    <div class="rps-competency-flowchart overflow-x-auto rounded-xl border border-gray-200 bg-white p-3">
                        <svg viewBox="0 0 ${chartWidth} ${chartHeight}" width="100%" role="img" aria-label="Bagan alir kompetensi berbentuk pohon dari Profil Lulusan ke CPL, CPMK, dan SubCPMK" style="display:block;width:100%;max-width:100%;height:auto;background:#ffffff;">
                            <defs>
                                <marker id="tree-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#111827"></path>
                                </marker>
                            </defs>
                            <rect x="0" y="0" width="${labelWidth}" height="${chartHeight}" fill="#f9fafb"></rect>
                            <line x1="${labelWidth}" y1="0" x2="${labelWidth}" y2="${chartHeight}" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="7 7"></line>
                            <line x1="0" y1="130" x2="${chartWidth}" y2="130" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="7 7"></line>
                            <line x1="0" y1="310" x2="${chartWidth}" y2="310" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="7 7"></line>
                            <line x1="0" y1="510" x2="${chartWidth}" y2="510" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="7 7"></line>
                            ${bandLabels.map(renderBandLabel).join('')}
                            <g>${arrows}</g>
                            <rect x="${profile.x}" y="${profile.y}" width="${profile.width}" height="${profile.height}" fill="#ffffff" stroke="#111827" stroke-width="2"></rect>
                            <text x="${profile.x + (profile.width / 2)}" y="${profile.y + (profile.height / 2) + 7}" text-anchor="middle" fill="#111827" font-family="Arial, sans-serif" font-size="20" font-weight="600">Profil Lulusan</text>
                            ${cplNodes.map(renderNode).join('')}
                            ${cpmkNodes.map(renderNode).join('')}
                            ${subcpmkNodes.map(renderNode).join('')}
                        </svg>
                    </div>`;
            };

            const renderLearningProcessMap = () => {
                const meetings = weeklyRows.flatMap((row, rowIndex) => {
                    const weekSelections = getWeeklyWeekSelections(row);
                    const weeks = weekSelections.length > 0 ? weekSelections : [String(rowIndex + 1)];
                    return weeks.map(week => ({ row: row, week: week }));
                }).sort((a, b) => {
                    return WEEKLY_WEEK_OPTIONS.indexOf(a.week) - WEEKLY_WEEK_OPTIONS.indexOf(b.week);
                });

                if (meetings.length === 0) {
                    return `<div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">Peta proses akan terbentuk setelah matriks pembelajaran mingguan diisi.</div>`;
                }

                return `
                    <div class="overflow-x-auto rounded-xl border border-gray-200">
                        <table class="w-full min-w-[900px] text-left text-xs">
                            <thead class="bg-blue-900 text-white">
                                <tr>
                                    <th class="w-24 p-3 text-center">Minggu</th>
                                    <th class="w-72 p-3">Fokus Pembelajaran (SubCPMK)</th>
                                    <th class="p-3">Metode Pembelajaran</th>
                                    <th class="p-3">Bentuk Asesmen</th>
                                </tr>
                            </thead>
                            <tbody>
                            ${meetings.map(meeting => {
                                const row = meeting.row;
                                const subcpmk = subcpmks.find(sub => sub.id === row.subcpmkId);
                                const assessments = getWeeklyAssessmentComponents(row);
                                const methods = [
                                    row.metodePembelajaranDaring ? `Daring: ${row.metodePembelajaranDaring}` : '',
                                    row.metodePembelajaranLuring ? `Luring: ${row.metodePembelajaranLuring}` : ''
                                ].filter(Boolean);
                                return `
                                    <tr class="border-b border-gray-200 align-top last:border-b-0 hover:bg-gray-50">
                                        <td class="p-3 text-center font-bold text-blue-900">${escapeHtml(meeting.week)}</td>
                                        <td class="p-3">
                                            <div class="font-bold text-gray-800">${subcpmk ? escapeHtml(subcpmk.code) : '-'}</div>
                                            <p class="mt-1 leading-relaxed text-gray-600">${subcpmk ? escapeHtml(subcpmk.desc || 'Deskripsi belum tersedia') : 'Belum dipetakan'}</p>
                                        </td>
                                        <td class="p-3">
                                            ${methods.length > 0 ? `<div class="space-y-1">${methods.map(method => `<div>${escapeHtml(method)}</div>`).join('')}</div>` : '<span class="text-gray-400">Belum direncanakan</span>'}
                                        </td>
                                        <td class="p-3">
                                            ${assessments.length > 0
                                                ? `<div class="space-y-1">${assessments.map(component => `<div><span class="font-semibold text-purple-900">${escapeHtml(component.name || component.jenis || 'Asesmen')}</span><span class="text-gray-500"> · ${escapeHtml(component.technique === 'non_tes' ? 'Non-Tes' : 'Tes')}${(parseFloat(component.weight) || 0) > 0 ? ` · ${parseFloat(component.weight)}%` : ''}</span></div>`).join('')}</div>`
                                                : '<span class="text-gray-400">Belum direncanakan</span>'}
                                        </td>
                                    </tr>`;
                            }).join('')}
                            </tbody>
                        </table>
                    </div>`;
            };

            let html = `
                <div class="rps-workspace">
                <div class="rps-page-header flex flex-wrap justify-between items-center gap-3 mb-4">
                    <div>
                        <h3 class="text-lg font-bold text-gray-800"><i class="fa-solid fa-file-lines mr-2 text-blue-800"></i>RPS (Rencana Pembelajaran Semester)</h3>
                        <p class="text-xs text-gray-500">Bagian CPL, CPMK, SUBCPMK, dan asesmen mengikuti data yang sudah ditetapkan di modul sebelumnya.</p>
                    </div>
                    ${isPjmkForClass(state.selectedClassKey) ? `<button onclick="openRpsImportModal('${state.selectedClassKey}')" class="rounded bg-indigo-700 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-800"><i class="fa-solid fa-file-import mr-1"></i>Impor RPS Sebelumnya</button>` : ''}
                </div>

                <div class="rps-class-selector mb-4 flex flex-wrap justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div class="flex items-center space-x-2">
                        <label class="text-sm font-bold text-blue-900">Pilih Kelas Perkuliahan:</label>
                        <select onchange="state.selectedClassKey = this.value; saveState(); renderApp();" class="border font-medium rounded px-3 py-1.5 text-sm bg-white shadow-sm">
                            ${classKeys.map(k => {
                                const c = state.classData[k];
                                const m = state.mkList.find(x => x.id === c.mkId) || { code: 'N/A', name: 'Mata Kuliah Tidak Dikenal' };
                                return `<option value="${k}" ${k === state.selectedClassKey ? 'selected' : ''}>[${m.code}] ${m.name} - Smt ${c.semester} - Kelas ${c.kelas}</option>`;
                            }).join('')}
                        </select>
                    </div>
                    <div class="text-xs text-blue-800">
                        <span class="font-bold">Mata Kuliah:</span> ${mk.name} (${mk.code}) | <span class="font-bold">Semester:</span> ${cls.semester}
                    </div>
                </div>

                <div class="space-y-6">
                    <section class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <h4 class="font-bold text-base text-gray-800 mb-3">1. Identitas Mata Kuliah</h4>
                        <div class="rounded-lg border border-gray-200 bg-gray-50/40 p-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div><div class="text-xs font-semibold text-gray-500">Universitas (Data Master)</div><div class="mt-1 rounded border bg-gray-100 px-3 py-2 text-sm">${escapeHtml(rps.identitas.universitas || '-')}</div></div>
                                <div><div class="text-xs font-semibold text-gray-500">Fakultas (Data Master)</div><div class="mt-1 rounded border bg-gray-100 px-3 py-2 text-sm">${escapeHtml(rps.identitas.fakultas || '-')}</div></div>
                                <div><div class="text-xs font-semibold text-gray-500">Program Studi (Data Master)</div><div class="mt-1 rounded border bg-gray-100 px-3 py-2 text-sm">${escapeHtml(rps.identitas.programStudi || '-')}</div></div>
                                <div><div class="text-xs font-semibold text-gray-500">Mata Kuliah (read-only)</div><div class="mt-1 px-3 py-2 rounded border bg-gray-50">${rps.identitas.mataKuliah || '-'}</div></div>
                                <div><div class="text-xs font-semibold text-gray-500">Kode MK (read-only)</div><div class="mt-1 px-3 py-2 rounded border bg-gray-50">${rps.identitas.kodeMK || '-'}</div></div>
                                <div><div class="text-xs font-semibold text-gray-500">Semester (read-only)</div><div class="mt-1 px-3 py-2 rounded border bg-gray-50">${rps.identitas.semester || '-'}</div></div>
                                <div><div class="text-xs font-semibold text-gray-500">Rumpun MK</div><input type="text" value="${rps.identitas.rumpunMK || ''}" onchange="updateRpsIdentitasField('${state.selectedClassKey}', 'rumpunMK', this.value);" class="mt-1 px-3 py-2 rounded border w-full text-sm"></div>
                                <div><div class="text-xs font-semibold text-gray-500">Jenis MK (read-only)</div><div class="mt-1 px-3 py-2 rounded border bg-gray-50">${rps.identitas.jenisMK || '-'}</div></div>
                                <div><div class="text-xs font-semibold text-gray-500">Moda</div><input type="text" value="${rps.identitas.moda || ''}" onchange="updateRpsIdentitasField('${state.selectedClassKey}', 'moda', this.value);" class="mt-1 px-3 py-2 rounded border w-full text-sm"></div>
                                <div><div class="text-xs font-semibold text-gray-500">SKS (read-only)</div><div class="mt-1 px-3 py-2 rounded border bg-gray-50">SKS Teori ${rps.identitas.sksT || 0} | SKS Praktik ${rps.identitas.sksP || 0} | Total SKS ${rps.identitas.totalSKS || 0}</div></div>
                                <div><div class="text-xs font-semibold text-gray-500">Dosen Pengampu (Setup Perkuliahan)</div><div class="mt-1 rounded border bg-gray-100 px-3 py-2 text-sm">${escapeHtml(rps.identitas.dosenPengampu || 'Belum ditentukan')}</div></div>
                                <div><div class="text-xs font-semibold text-gray-500">Tanggal Penyusunan</div><input type="date" value="${rps.identitas.tanggalPenyusunan || ''}" onchange="updateRpsIdentitasField('${state.selectedClassKey}', 'tanggalPenyusunan', this.value);" class="mt-1 px-3 py-2 rounded border w-full text-sm"></div>
                                <div><div class="text-xs font-semibold text-gray-500">Tanggal Revisi</div><input type="date" value="${rps.identitas.tanggalRevisi || ''}" onchange="updateRpsIdentitasField('${state.selectedClassKey}', 'tanggalRevisi', this.value);" class="mt-1 px-3 py-2 rounded border w-full text-sm"></div>
                                <div class="md:col-span-2"><div class="text-xs font-semibold text-gray-500">MK Prasyarat</div>
                                    <select onchange="updateRpsIdentitasField('${state.selectedClassKey}', 'mkPrasyarat', this.value);" class="mt-1 px-3 py-2 rounded border w-full text-sm bg-white">
                                        <option value="">Tidak ada</option>
                                        ${prerequisiteMkOptions.map(m => `<option value="${m.code}" ${rps.identitas.mkPrasyarat === m.code ? 'selected' : ''}>${m.code} - ${m.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="md:col-span-2"><div class="text-xs font-semibold text-gray-500">Menjadi Prasyarat</div>
                                    <select onchange="updateRpsIdentitasField('${state.selectedClassKey}', 'menjadiPrasyarat', this.value);" class="mt-1 px-3 py-2 rounded border w-full text-sm bg-white">
                                        <option value="">Tidak ada</option>
                                        ${prerequisiteMkOptions.map(m => `<option value="${m.code}" ${rps.identitas.menjadiPrasyarat === m.code ? 'selected' : ''}>${m.code} - ${m.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="md:col-span-2"><div class="text-xs font-semibold text-gray-500">Integrasi antar MK</div><textarea onchange="updateRpsIdentitasField('${state.selectedClassKey}', 'integrasiAntarMK', this.value);" class="mt-1 px-3 py-2 rounded border w-full text-sm h-20">${rps.identitas.integrasiAntarMK || ''}</textarea></div>
                                <div class="md:col-span-2"><div class="text-xs font-semibold text-gray-500">Deskripsi Mata Kuliah</div><textarea onchange="updateRpsIdentitasField('${state.selectedClassKey}', 'deskripsiMK', this.value);" class="mt-1 px-3 py-2 rounded border w-full text-sm h-20">${rps.identitas.deskripsiMK || ''}</textarea></div>
                                <div><div class="text-xs font-semibold text-gray-500">Tautan Kelas Daring</div><input type="url" value="${rps.identitas.tautanKelasDaring || ''}" onchange="updateRpsIdentitasField('${state.selectedClassKey}', 'tautanKelasDaring', this.value);" class="mt-1 px-3 py-2 rounded border w-full text-sm"></div>
                                <div><div class="text-xs font-semibold text-gray-500">Bahasa Pengantar</div><input type="text" value="${rps.identitas.bahasaPengantar || ''}" onchange="updateRpsIdentitasField('${state.selectedClassKey}', 'bahasaPengantar', this.value);" class="mt-1 px-3 py-2 rounded border w-full text-sm"></div>
                            </div>
                        </div>
                        <div class="mt-4">
                            <h5 class="font-semibold text-sm text-gray-700 mb-2">Pengesahan RPS</h5>
                            <div class="overflow-hidden rounded-xl border border-gray-300">
                                <table class="w-full table-fixed border-collapse text-sm">
                                    <tbody>
                                        <tr class="bg-blue-900 text-white">
                                            <th class="border-r border-blue-700 p-3 text-center font-bold">Dosen Pengembang RPS</th>
                                            <th class="border-r border-blue-700 p-3 text-center font-bold">Koordinator Rumpun MK</th>
                                            <th class="p-3 text-center font-bold">Ketua Program Studi</th>
                                        </tr>
                                        <tr>
                                            <td class="border-b border-r border-gray-300 p-3">
                                                <label class="flex items-center gap-2"><span class="w-12 shrink-0 font-semibold text-gray-700">Nama</span><input type="text" value="${escapeHtml(rps.identitas.pengesahan.dosenPengembangNama || '')}" disabled title="Otomatis dari Dosen PJMK pada Setup Perkuliahan" class="w-full border-b border-gray-300 bg-gray-50 px-2 py-1"></label>
                                            </td>
                                            <td class="border-b border-r border-gray-300 p-3">
                                                <label class="flex items-center gap-2"><span class="w-12 shrink-0 font-semibold text-gray-700">Nama</span><input type="text" value="${escapeHtml(rps.identitas.pengesahan.koordinatorRumpunMKNama || '')}" onchange="updateRpsPengesahanField('${state.selectedClassKey}', 'koordinatorRumpunMKNama', this.value)" class="w-full border-b border-gray-400 px-2 py-1 outline-none focus:border-blue-700"></label>
                                            </td>
                                            <td class="border-b border-gray-300 p-3">
                                                <label class="flex items-center gap-2"><span class="w-12 shrink-0 font-semibold text-gray-700">Nama</span><input type="text" value="${escapeHtml(rps.identitas.pengesahan.ketuaProgramStudiNama || '')}" disabled title="Otomatis dari Master Data akun Kaprodi" class="w-full border-b border-gray-300 bg-gray-50 px-2 py-1"></label>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="border-r border-gray-300 p-3">
                                                <label class="flex items-center gap-2"><span class="w-20 shrink-0 font-semibold text-gray-700">No. NUPTK</span><input type="text" value="${escapeHtml(rps.identitas.pengesahan.dosenPengembangNUPTK || '')}" disabled title="Otomatis dari Dosen PJMK pada Setup Perkuliahan" class="w-full border-b border-gray-300 bg-gray-50 px-2 py-1"></label>
                                            </td>
                                            <td class="border-r border-gray-300 p-3">
                                                <label class="flex items-center gap-2"><span class="w-20 shrink-0 font-semibold text-gray-700">No. NUPTK</span><input type="text" value="${escapeHtml(rps.identitas.pengesahan.koordinatorRumpunMKNUPTK || '')}" onchange="updateRpsPengesahanField('${state.selectedClassKey}', 'koordinatorRumpunMKNUPTK', this.value)" class="w-full border-b border-gray-400 px-2 py-1 outline-none focus:border-blue-700"></label>
                                            </td>
                                            <td class="p-3">
                                                <label class="flex items-center gap-2"><span class="w-20 shrink-0 font-semibold text-gray-700">No. NUPTK</span><input type="text" value="${escapeHtml(rps.identitas.pengesahan.ketuaProgramStudiNUPTK || '')}" disabled title="Otomatis dari Master Data akun Kaprodi" class="w-full border-b border-gray-300 bg-gray-50 px-2 py-1"></label>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    <section class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <h4 class="font-bold text-base text-gray-800 mb-3">2. Capaian Pembelajaran dan Bahan Kajian</h4>

                        <div class="mb-4">
                            <h5 class="font-bold text-sm text-gray-800 mb-2">a. CPL yang dibebankan ke MK</h5>
                            <div class="overflow-x-auto">
                                <table class="w-full text-xs text-left border border-gray-200 rounded-lg">
                                    <thead class="bg-gray-100 text-gray-700">
                                        <tr>
                                            <th class="p-2 w-28">Kode CPL</th>
                                            <th class="p-2">Deskripsi Capaian Pembelajaran</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${cpls.length === 0 ? `<tr><td colspan="2" class="p-3 text-center text-gray-500">Belum ada CPL.</td></tr>` : cpls.map(cpl => `<tr class="border-b hover:bg-gray-50"><td class="p-2 font-semibold">${cpl.code}</td><td class="p-2">${cpl.desc || '-'}</td></tr>`).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h5 class="font-bold text-sm text-gray-800 mb-2">b. CPMK</h5>
                            <div class="overflow-x-auto">
                                <table class="w-full text-xs text-left border border-gray-200 rounded-lg">
                                    <thead class="bg-gray-100 text-gray-700">
                                        <tr>
                                            <th class="p-2 w-28">Kode CPMK</th>
                                            <th class="p-2">Deskripsi CPMK</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${cpmks.length === 0 ? `<tr><td colspan="2" class="p-3 text-center text-gray-500">Belum ada CPMK.</td></tr>` : cpmks.map(cpmk => `<tr class="border-b hover:bg-gray-50"><td class="p-2 font-semibold">${cpmk.code}</td><td class="p-2">${cpmk.desc || '-'}</td></tr>`).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        ${renderRpsSubcpmkEntrySection()}

                        <div class="mb-4">
                            <div class="flex justify-between items-center mb-2">
                                <h5 class="font-bold text-sm text-gray-800">d. Bahan kajian</h5>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="w-full text-xs text-left border border-gray-200 rounded-lg">
                                    <thead class="bg-gray-100 text-gray-700">
                                        <tr>
                                            <th class="p-2 w-12 text-center">No</th>
                                            <th class="p-2">Uraian Bahan Kajian</th>
                                            <th class="p-2 w-20 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${(rps.bahanKajianItems && rps.bahanKajianItems.length > 0) 
                                            ? rps.bahanKajianItems.map((item, idx) => `
                                                <tr class="border-b hover:bg-gray-50">
                                                    <td class="p-2 text-center">${idx + 1}</td>
                                                    <td class="p-2"><input type="text" value="${item.isi || ''}" onchange="updateRpsBahanKajian('${state.selectedClassKey}', ${idx}, this.value);" class="w-full px-2 py-1 border rounded text-xs"></td>
                                                    <td class="p-2 text-center"><button onclick="deleteRpsBahanKajian('${state.selectedClassKey}', ${idx});" class="text-red-600 hover:text-red-800" title="Hapus"><i class="fa-solid fa-trash"></i></button></td>
                                                </tr>
                                            `).join('')
                                            : `<tr><td colspan="3" class="p-3 text-center text-gray-500">Belum ada bahan kajian. Klik tombol Tambah untuk menambahkan.</td></tr>`}
                                    </tbody>
                                </table>
                            </div>
                            <div class="mt-2 flex justify-end">
                                <button onclick="addRpsBahanKajian('${state.selectedClassKey}');" class="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">+ Tambah</button>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h5 class="font-bold text-sm text-gray-800 mb-2">e. Daftar pustaka</h5>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="overflow-x-auto">
                                    <div class="flex justify-between items-center mb-2">
                                            <div class="text-xs font-semibold text-gray-600">Utama</div>
                                    </div>
                                    <table class="w-full text-xs text-left border border-gray-200 rounded-lg">
                                        <tbody>
                                            ${(rps.daftarPustakaItems && rps.daftarPustakaItems.filter(item => (item.jenis || 'utama') === 'utama').length > 0)
                                                ? rps.daftarPustakaItems.filter(item => (item.jenis || 'utama') === 'utama').map((item, idx) => {
                                                    const originalIdx = rps.daftarPustakaItems.indexOf(item);
                                                    return `
                                                        <tr class="border-b hover:bg-gray-50">
                                                            <td class="p-2 w-12 text-center">${idx + 1}</td>
                                                            <td class="p-2"><input type="text" value="${item.isi || ''}" onchange="updateRpsDaftarPustaka('${state.selectedClassKey}', ${originalIdx}, this.value);" class="w-full px-2 py-1 border rounded text-xs"></td>
                                                            <td class="p-2 w-20 text-center"><button onclick="deleteRpsDaftarPustaka('${state.selectedClassKey}', ${originalIdx});" class="text-red-600 hover:text-red-800" title="Hapus"><i class="fa-solid fa-trash"></i></button></td>
                                                        </tr>
                                                    `;
                                                }).join('')
                                                : `<tr><td colspan="3" class="p-3 text-center text-gray-500 text-xs">Belum ada daftar pustaka utama.</td></tr>`}
                                        </tbody>
                                    </table>
                                    <div class="mt-2 flex justify-end">
                                        <button onclick="addRpsDaftarPustaka('${state.selectedClassKey}', 'utama');" class="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">+ Tambah</button>
                                    </div>
                                </div>
                                <div class="overflow-x-auto">
                                    <div class="flex justify-between items-center mb-2">
                                        <div class="text-xs font-semibold text-gray-600">Pendukung</div>
                                    </div>
                                    <table class="w-full text-xs text-left border border-gray-200 rounded-lg">
                                        <tbody>
                                            ${(rps.daftarPustakaItems && rps.daftarPustakaItems.filter(item => (item.jenis || 'utama') === 'pendukung').length > 0)
                                                ? rps.daftarPustakaItems.filter(item => (item.jenis || 'utama') === 'pendukung').map((item, idx) => {
                                                    const originalIdx = rps.daftarPustakaItems.indexOf(item);
                                                    return `
                                                        <tr class="border-b hover:bg-gray-50">
                                                            <td class="p-2 w-12 text-center">${idx + 1}</td>
                                                            <td class="p-2"><input type="text" value="${item.isi || ''}" onchange="updateRpsDaftarPustaka('${state.selectedClassKey}', ${originalIdx}, this.value);" class="w-full px-2 py-1 border rounded text-xs"></td>
                                                            <td class="p-2 w-20 text-center"><button onclick="deleteRpsDaftarPustaka('${state.selectedClassKey}', ${originalIdx});" class="text-red-600 hover:text-red-800" title="Hapus"><i class="fa-solid fa-trash"></i></button></td>
                                                        </tr>
                                                    `;
                                                }).join('')
                                                : `<tr><td colspan="3" class="p-3 text-center text-gray-500 text-xs">Belum ada daftar pustaka pendukung.</td></tr>`}
                                        </tbody>
                                    </table>
                                    <div class="mt-2 flex justify-end">
                                        <button onclick="addRpsDaftarPustaka('${state.selectedClassKey}', 'pendukung');" class="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">+ Tambah</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        ${renderRpsSubcpmkMatrixSection()}
                    </section>

                    <section class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div class="flex justify-between items-center mb-3">
                                <div>
                                    <h4 class="font-bold text-base text-gray-800">3. Matriks Pembelajaran Mingguan</h4>
                                    <p class="text-xs text-gray-500">Baris dibuat manual sesuai pertemuan dan dipetakan ke satu SubCPMK.</p>
                                </div>
                            </div>
                        <div class="overflow-x-auto weekly-matrix-scroll">
                            <table class="w-full text-xs border border-gray-200 rounded-lg table-compact" style="table-layout: auto; min-width: 2100px;">
                                <thead class="bg-blue-900 text-white">
                                    <tr>
                                        <th class="p-2 w-20 text-center">Minggu ke</th>
                                        <th class="p-2 w-56">SubCPMK</th>
                                        <th class="p-2 min-w-[220px]">Indikator Penilaian</th>
                                        <th class="p-2 w-[360px] min-w-[360px]">Teknik & Kriteria Penilaian</th>
                                        <th class="p-2 min-w-[180px]">Metode Pembelajaran Daring</th>
                                        <th class="p-2 min-w-[180px]">Metode Pembelajaran Luring</th>
                                        <th class="p-2 w-[300px] min-w-[300px] max-w-[300px]">Materi Pembelajaran</th>
                                        <th class="p-2 w-28 text-center">Bobot Penilaian</th>
                                        <th class="p-2 w-20 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>`;
            if (weeklyRows.length === 0) {
                html += `<tr><td colspan="9" class="p-4 text-center text-gray-500">Belum ada pertemuan. Klik Tambah Pertemuan untuk menambahkan baris.</td></tr>`;
            } else {
                weeklyRows.forEach((row, idx) => {
                    const weeklyStatus = getRpsWeeklySubcpmkStatus(state.selectedClassKey, row, idx);
                    const rowWarningClass = weeklyStatus.isOver ? 'border-red-300 bg-red-50' : '';
                    const examSelections = getWeeklyWeekSelections(row);
                    const examType = isWeeklyExamRow(row) ? examSelections[0] : '';
                    if (examType) {
                        const examWeek = getWeeklyExamWeekNumber(weeklyRows, idx);
                        html += `
                            <tr class="border-b bg-blue-50">
                                <td colspan="9" class="p-3">
                                    <div class="flex items-center gap-4">
                                        <div class="w-44">${renderWeeklyWeekPicker(state.selectedClassKey, row, idx, isWeeklyLocked)}</div>
                                        <div class="flex-1 text-center font-bold text-blue-900">
                                            Minggu ${examWeek} - ${examType === 'UTS' ? 'Ujian Tengah Semester' : 'Ujian Akhir Semester'}
                                        </div>
                                        ${!isWeeklyLocked ? `<button onclick="deleteRpsWeeklyRow('${state.selectedClassKey}', ${idx})" class="text-red-600 hover:text-red-800" title="Hapus"><i class="fa-solid fa-trash"></i></button>` : '<i class="fa-solid fa-lock text-gray-400"></i>'}
                                    </div>
                                </td>
                            </tr>`;
                        return;
                    }
                    const selectedSubcpmkId = row.subcpmkId || (getRpsWeeklySubcpmkIds(row)[0] || '');
                    const selectedSubcpmk = selectedSubcpmkId ? subcpmks.find(sub => sub.id === selectedSubcpmkId) : null;
                    const selectedSubcpmkDesc = selectedSubcpmk ? (selectedSubcpmk.desc || '') : '';
                    const selectedValidation = (weeklyStatus.validations || []).find(item => item.subcpmkId === selectedSubcpmkId) || null;
                    const remainingWeight = selectedValidation ? Math.max((selectedValidation.targetTotal || 0) - (selectedValidation.usedTotal || 0), 0) : 0;
                    const testComponents = getWeeklyAssessmentComponents(row, 'tes');
                    const nonTestComponents = getWeeklyAssessmentComponents(row, 'non_tes');
                    const assessmentWeight = getWeeklyAssessmentWeight(row);
                    const bahanKajianOptions = (rps.bahanKajianItems || []).filter(item => item && item.id);
                    const daftarPustakaOptions = getSortedDaftarPustakaOptions(rps.daftarPustakaItems || []);
                    const selectedBahanKajianIds = getWeeklySelectionIds(row, 'bahanKajianIds', 'bahanKajianId');
                    const selectedDaftarPustakaIds = getWeeklySelectionIds(row, 'daftarPustakaIds', 'daftarPustakaId');
                    const selectedBahanKajianText = selectedBahanKajianIds.map(id => {
                        const item = bahanKajianOptions.find(option => option.id === id);
                        if (!item) return '';
                        const itemIndex = bahanKajianOptions.indexOf(item);
                        return `BK ${itemIndex + 1}${item.isi ? ' - ' + item.isi : ''}`;
                    }).filter(Boolean).join('\n');
                    const selectedDaftarPustakaText = daftarPustakaOptions
                        .filter(item => selectedDaftarPustakaIds.indexOf(item.id) >= 0)
                        .map(item => item.isi || '')
                        .filter(Boolean)
                        .join('\n');
                    const daftarPustakaUtamaOptions = daftarPustakaOptions.filter(item => (item.jenis || 'utama') === 'utama');
                    const daftarPustakaPendukungOptions = daftarPustakaOptions.filter(item => (item.jenis || 'utama') === 'pendukung');
                    html += `
                        <tr class="border-b hover:bg-gray-50 align-top ${rowWarningClass}">
                            <td class="p-2">
                                ${renderWeeklyWeekPicker(state.selectedClassKey, row, idx, isWeeklyLocked)}
                            </td>
                            <td class="p-2 align-top">
                                <select id="weekly-subcpmk-select-${idx}" ${isWeeklyLocked ? 'disabled' : ''} onchange="updateRpsWeeklyField('${state.selectedClassKey}', ${idx}, 'subcpmkId', this.value)" class="w-full border rounded px-2 py-1 bg-white">
                                    <option value="">- Pilih SubCPMK -</option>
                                    ${subcpmks.map(sub => `<option value="${sub.id}" ${selectedSubcpmkId === sub.id ? 'selected' : ''}>${sub.code}</option>`).join('')}
                                </select>
                                <textarea rows="1" data-auto-resize="weekly" readonly class="mt-1 w-full border rounded px-2 py-1 leading-5 resize-none overflow-hidden min-h-[2.5rem] bg-gray-50 text-gray-600">${selectedSubcpmkDesc || ''}</textarea>
                            </td>
                            <td class="p-2 align-top"><textarea rows="1" data-auto-resize="weekly" ${isWeeklyLocked ? 'readonly' : ''} oninput="autoResizeTextarea(this)" onchange="updateRpsWeeklyField('${state.selectedClassKey}', ${idx}, 'indikatorPenilaian', this.value)" class="w-full border rounded px-2 py-1 leading-5 resize-none overflow-hidden min-h-[2.5rem]">${row.indikatorPenilaian || ''}</textarea></td>
                            <td class="p-2 align-top w-[360px] min-w-[360px]">
                                <div class="space-y-3">
                                    <div>
                                        <div class="flex items-center justify-between gap-2 mb-1">
                                            <span class="text-[10px] font-bold uppercase text-gray-500">Teknik Tes</span>
                                            ${!isWeeklyLocked ? `<button type="button" onclick="openWeeklyComponentModal('${state.selectedClassKey}', ${idx}, 'tes')" class="text-[10px] text-blue-700 hover:text-blue-900 font-semibold"><i class="fa-solid fa-plus mr-1"></i>Tambah Komponen</button>` : ''}
                                        </div>
                                        <div class="space-y-1">
                                            ${testComponents.length > 0 ? testComponents.map(component => `<div class="rounded border border-blue-100 bg-blue-50 px-2 py-1 text-[10px]"><div class="flex items-start justify-between gap-2"><div><span class="font-semibold">${escapeHtml(component.name)}</span><span class="text-gray-500"> · ${escapeHtml(component.jenis)} · ${component.weight}%</span></div>${!isWeeklyLocked ? `<button type="button" onclick="openWeeklyComponentModal('${state.selectedClassKey}', ${idx}, 'tes', '${component.id}')" class="text-blue-700 hover:text-blue-900"><i class="fa-solid fa-pen"></i></button>` : ''}</div></div>`).join('') : `<div class="text-[10px] text-gray-400">Belum ada komponen tes.</div>`}
                                        </div>
                                    </div>
                                    <div>
                                        <div class="flex items-center justify-between gap-2 mb-1">
                                            <span class="text-[10px] font-bold uppercase text-gray-500">Teknik Non-Tes</span>
                                            ${!isWeeklyLocked ? `<button type="button" onclick="openWeeklyComponentModal('${state.selectedClassKey}', ${idx}, 'non_tes')" class="text-[10px] text-blue-700 hover:text-blue-900 font-semibold"><i class="fa-solid fa-plus mr-1"></i>Tambah Komponen</button>` : ''}
                                        </div>
                                        <div class="space-y-1">
                                            ${nonTestComponents.length > 0 ? nonTestComponents.map(component => `<div class="rounded border border-indigo-100 bg-indigo-50 px-2 py-1 text-[10px]"><div class="flex items-start justify-between gap-2"><div><span class="font-semibold">${escapeHtml(component.name)}</span><span class="text-gray-500"> · ${escapeHtml(component.jenis)} · ${component.weight}%</span></div>${!isWeeklyLocked ? `<button type="button" onclick="openWeeklyComponentModal('${state.selectedClassKey}', ${idx}, 'non_tes', '${component.id}')" class="text-blue-700 hover:text-blue-900"><i class="fa-solid fa-pen"></i></button>` : ''}</div></div>`).join('') : `<div class="text-[10px] text-gray-400">Belum ada komponen non-tes.</div>`}
                                        </div>
                                    </div>
                                    <div>
                                        <div class="text-[10px] font-bold uppercase text-gray-500 mb-1">Kriteria</div>
                                        <div class="space-y-1">
                                            ${getWeeklyAssessmentComponents(row).length > 0 ? getWeeklyAssessmentComponents(row).map(component => `<div class="rounded border border-amber-100 bg-amber-50 px-2 py-1 text-[10px]"><div class="flex items-start justify-between gap-2"><div><span class="font-semibold">${escapeHtml(component.name)}</span><span class="text-gray-500"> · ${escapeHtml(component.technique === 'non_tes' ? 'Non-Tes' : 'Tes')}</span></div>${!isWeeklyLocked ? `<button type="button" onclick="openWeeklyComponentModal('${state.selectedClassKey}', ${idx}, '${component.technique}', '${component.id}')" class="text-blue-700 hover:text-blue-900"><i class="fa-solid fa-pen"></i></button>` : ''}</div><div class="mt-0.5 text-amber-800">${escapeHtml(getWeeklyComponentCriterion(component))}</div></div>`).join('') : `<div class="text-[10px] text-gray-400">Belum ada kriteria.</div>`}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td class="p-2 align-top"><textarea rows="1" data-auto-resize="weekly" ${isWeeklyLocked ? 'readonly' : ''} oninput="autoResizeTextarea(this)" onchange="updateRpsWeeklyField('${state.selectedClassKey}', ${idx}, 'metodePembelajaranDaring', this.value)" class="w-full border rounded px-2 py-1 leading-5 resize-none overflow-hidden min-h-[2.5rem]">${row.metodePembelajaranDaring || ''}</textarea></td>
                            <td class="p-2 align-top"><textarea rows="1" data-auto-resize="weekly" ${isWeeklyLocked ? 'readonly' : ''} oninput="autoResizeTextarea(this)" onchange="updateRpsWeeklyField('${state.selectedClassKey}', ${idx}, 'metodePembelajaranLuring', this.value)" class="w-full border rounded px-2 py-1 leading-5 resize-none overflow-hidden min-h-[2.5rem]">${row.metodePembelajaranLuring || ''}</textarea></td>
                            <td class="p-2 align-top w-[300px] min-w-[300px] max-w-[300px]">
                                <div class="space-y-2 w-[280px]">
                                    <div>
                                        <div class="text-[10px] font-semibold text-gray-500 mb-1">Bahan Kajian</div>
                                        <details class="group">
                                            <summary class="list-none cursor-pointer w-full border rounded px-2 py-1 bg-white text-xs flex items-center justify-between">
                                                <span>${selectedBahanKajianIds.length > 0 ? `${selectedBahanKajianIds.length} dipilih` : '- Pilih Bahan Kajian -'}</span>
                                                <i class="fa-solid fa-chevron-down text-[10px] text-gray-400 group-open:rotate-180 transition-transform"></i>
                                            </summary>
                                            <div class="mt-1 border rounded bg-white max-h-40 overflow-y-auto p-2 space-y-1">
                                                ${bahanKajianOptions.length > 0 ? bahanKajianOptions.map((item, optionIdx) => `
                                                    <label class="flex items-start gap-2 text-xs text-gray-700">
                                                        <input type="checkbox" ${selectedBahanKajianIds.indexOf(item.id) >= 0 ? 'checked' : ''} ${isWeeklyLocked ? 'disabled' : ''} onchange="toggleRpsWeeklySelection('${state.selectedClassKey}', ${idx}, 'bahanKajianIds', 'bahanKajianId', '${item.id}')">
                                                        <span>BK ${optionIdx + 1}${item.isi ? ' - ' + item.isi : ''}</span>
                                                    </label>`).join('') : `<div class="text-xs text-gray-400">Belum ada bahan kajian.</div>`}
                                            </div>
                                        </details>
                                        <textarea rows="1" data-auto-resize="weekly" readonly class="mt-1 w-full border rounded px-2 py-1 leading-5 resize-none overflow-hidden min-h-[2.5rem] bg-gray-50 text-gray-600">${selectedBahanKajianText}</textarea>
                                    </div>
                                    <div>
                                        <div class="text-[10px] font-semibold text-gray-500 mb-1">Daftar Pustaka</div>
                                        <details class="group">
                                            <summary class="list-none cursor-pointer w-full border rounded px-2 py-1 bg-white text-xs flex items-center justify-between">
                                                <span>${selectedDaftarPustakaIds.length > 0 ? `${selectedDaftarPustakaIds.length} dipilih` : '- Pilih Daftar Pustaka -'}</span>
                                                <i class="fa-solid fa-chevron-down text-[10px] text-gray-400 group-open:rotate-180 transition-transform"></i>
                                            </summary>
                                            <div class="mt-1 border rounded bg-white max-h-40 overflow-y-auto p-2 space-y-1">
                                                ${daftarPustakaOptions.length > 0 ? `
                                                    ${daftarPustakaUtamaOptions.length > 0 ? `
                                                        <div class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Utama</div>
                                                        ${daftarPustakaUtamaOptions.map(item => `
                                                            <label class="flex items-start gap-2 text-xs text-gray-700">
                                                                <input type="checkbox" ${selectedDaftarPustakaIds.indexOf(item.id) >= 0 ? 'checked' : ''} ${isWeeklyLocked ? 'disabled' : ''} onchange="toggleRpsWeeklySelection('${state.selectedClassKey}', ${idx}, 'daftarPustakaIds', 'daftarPustakaId', '${item.id}')">
                                                                <span>${item.isi || ''}</span>
                                                            </label>`).join('')}
                                                    ` : ''}
                                                    ${daftarPustakaPendukungOptions.length > 0 ? `
                                                        <div class="text-[10px] font-semibold uppercase tracking-wide text-gray-400 ${daftarPustakaUtamaOptions.length > 0 ? 'mt-2' : ''}">Pendukung</div>
                                                        ${daftarPustakaPendukungOptions.map(item => `
                                                            <label class="flex items-start gap-2 text-xs text-gray-700">
                                                                <input type="checkbox" ${selectedDaftarPustakaIds.indexOf(item.id) >= 0 ? 'checked' : ''} ${isWeeklyLocked ? 'disabled' : ''} onchange="toggleRpsWeeklySelection('${state.selectedClassKey}', ${idx}, 'daftarPustakaIds', 'daftarPustakaId', '${item.id}')">
                                                                <span>${item.isi || ''}</span>
                                                            </label>`).join('')}
                                                    ` : ''}
                                                ` : `<div class="text-xs text-gray-400">Belum ada daftar pustaka.</div>`}
                                            </div>
                                        </details>
                                        <textarea rows="1" data-auto-resize="weekly" readonly class="mt-1 w-full border rounded px-2 py-1 leading-5 resize-none overflow-hidden min-h-[2.5rem] bg-gray-50 text-gray-600">${selectedDaftarPustakaText}</textarea>
                                    </div>
                                </div>
                            </td>
                            <td class="p-2">
                                <div class="rounded border px-2 py-2 bg-gray-50 ${weeklyStatus.isOver ? 'border-red-200 bg-red-50' : 'border-gray-200'}">
                                    <div class="text-center text-sm font-bold text-blue-900">${assessmentWeight}%</div>
                                    <div class="mt-2">
                                        <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${weeklyStatus.isOver ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-800'}">
                                            Sisa ${selectedSubcpmkId ? remainingWeight : 0}%
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td class="p-2 text-center">
                                ${!isWeeklyLocked ? `<button onclick="deleteRpsWeeklyRow('${state.selectedClassKey}', ${idx})" class="text-red-600 hover:text-red-800"><i class="fa-solid fa-trash"></i></button>` : '<i class="fa-solid fa-lock text-gray-400"></i>'}
                            </td>
                        </tr>`;
                });
            }
            html += `</tbody></table></div>
            <div class="mt-3 flex items-center justify-between gap-3 border-t pt-3">
                <div class="text-xs ${isWeeklyLocked ? 'text-emerald-700 font-semibold' : 'text-gray-500'}">
                    ${isWeeklyLocked
                        ? '<i class="fa-solid fa-lock mr-1"></i> Matriks mingguan telah difinalisasi dan menjadi sumber Bab 4.'
                        : (cls.weeklyDraftSaved
                            ? `<i class="fa-solid fa-floppy-disk mr-1"></i> Draft sudah tersimpan.${cls.weeklyDraftDirty ? ' Ada perubahan yang belum disimpan ke Bab 4.' : ' Bab 4 tersinkron.'}`
                            : 'Simpan draft untuk menampilkan komponen sementara pada Bab 4.')}
                </div>
                <div class="flex items-center gap-2">
                    ${isWeeklyLocked
                        ? `<button onclick="unfinalizeWeeklyMatrix('${state.selectedClassKey}')" class="text-xs text-red-600 underline">Buka Kunci</button>`
                        : `<button onclick="addRpsWeeklyRow('${state.selectedClassKey}')" class="bg-blue-700 hover:bg-blue-800 text-white text-xs px-3 py-2 rounded shadow font-semibold"><i class="fa-solid fa-plus mr-1"></i> Tambah Pertemuan</button>
                           <button onclick="saveWeeklyMatrixDraft('${state.selectedClassKey}')" class="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-2 rounded shadow font-semibold"><i class="fa-solid fa-floppy-disk mr-1"></i> Simpan Draft</button>
                           <button onclick="finalizeWeeklyMatrix('${state.selectedClassKey}')" class="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-3 py-2 rounded shadow font-semibold"><i class="fa-solid fa-check-double mr-1"></i> Finalisasi Matriks Mingguan</button>`}
                </div>
            </div>
                    </section>

                    <section class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <h4 class="font-bold text-base text-gray-800 mb-3">4. Rancangan Evaluasi / Asesmen</h4>
                        ${renderRpsKomponenMatrixSection()}
                    </section>

                    <section class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div class="mb-4">
                            <h4 class="font-bold text-base text-gray-800">5. Rubrik Penilaian</h4>
                            <p class="text-xs text-gray-500 mt-1">Setup rincian rubrik dibuat berdasarkan kriteria dan bentuk evaluasi yang telah ditetapkan pada Bab 3 dan Bab 4.</p>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4 text-[11px]">
                            ${Object.values(RUBRIC_SETUP_TYPES).map(type => `<div class="rounded-lg border bg-gray-50 px-2 py-2 text-center font-semibold text-gray-700">${type.label}</div>`).join('')}
                        </div>
                        ${!cls.weeklyDraftSaved && !isWeeklyLocked
                            ? `<div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500"><i class="fa-solid fa-list-check text-2xl mb-2 text-gray-400"></i><p>Simpan draft Bab 3 terlebih dahulu untuk membentuk setup rubrik.</p></div>`
                            : (komponenList.length === 0
                                ? `<div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">Belum ada kriteria/rubrik penilaian yang ditetapkan.</div>`
                                : `<div class="space-y-4">${komponenList.map((component, rubricIndex) => renderRubricSetupCard(currentClassKey, component, rubricIndex)).join('')}</div>`)}
                    </section>

                    <section class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div class="mb-5">
                            <h4 class="font-bold text-base text-gray-800">6. Lampiran</h4>
                            <p class="mt-1 text-xs text-gray-500">Visualisasi pendukung disusun otomatis dari data capaian dan rencana pembelajaran semester.</p>
                        </div>

                        <div class="space-y-6">
                            <div>
                                <div class="mb-3">
                                    <h5 class="font-bold text-sm text-gray-800">a. Bagan Alir Kompetensi</h5>
                                    <p class="mt-1 text-xs leading-relaxed text-gray-500">Bagan Alir Kompetensi adalah gambaran hubungan antar sub-CPMK yang telah dipetakan dalam satu semester untuk mencapai CPMK. Bagan ini merupakan hasil dari proses analisis pembelajaran.</p>
                                </div>
                                ${renderCompetencyFlowchart()}
                            </div>

                            <div class="border-t border-gray-200 pt-5">
                                <div class="mb-3">
                                    <h5 class="font-bold text-sm text-gray-800">b. Peta Proses Pembelajaran</h5>
                                    <p class="mt-1 text-xs leading-relaxed text-gray-500">Peta proses pembelajaran ini merupakan bentuk visualisasi atau gambaran singkat tentang bagaimana proses pembelajaran selama 1 semester terjadi di setiap pertemuannya, metode pembelajaran dan asesmen apa yang akan dilakukan untuk mencapai setiap SubCPMK.</p>
                                </div>
                                ${renderLearningProcessMap()}
                            </div>
                        </div>
                    </section>

                    <section class="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
                        <table class="w-full table-fixed border-collapse text-sm">
                            <tbody>
                                <tr>
                                    <td colspan="3" class="border-b border-gray-300 bg-gray-50 p-3">
                                        <div class="flex flex-wrap items-center justify-center gap-3 font-semibold text-gray-800">
                                            <span>RPS ini telah divalidasi pada tanggal:</span>
                                            <input type="date" value="${escapeHtml(rps.identitas.pengesahan.tanggalValidasi || '')}" onchange="updateRpsPengesahanField('${state.selectedClassKey}', 'tanggalValidasi', this.value)" class="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-normal">
                                        </div>
                                    </td>
                                </tr>
                                <tr class="bg-blue-900 text-white">
                                    <th class="border-r border-blue-700 p-3 text-center font-bold">Ketua Program Studi</th>
                                    <th class="border-r border-blue-700 p-3 text-center font-bold">Gugus Kendali Mutu Program Studi</th>
                                    <th class="p-3 text-center font-bold">Dosen PJMK</th>
                                </tr>
                                <tr>
                                    <td class="border-b border-r border-gray-300 p-3">
                                        <label class="flex items-center gap-2"><span class="w-12 shrink-0 font-semibold text-gray-700">Nama</span><input type="text" value="${escapeHtml(rps.identitas.pengesahan.ketuaProgramStudiNama || '')}" disabled title="Otomatis dari Master Data akun Kaprodi" class="w-full border-b border-gray-300 bg-gray-50 px-2 py-1"></label>
                                    </td>
                                    <td class="border-b border-r border-gray-300 p-3">
                                        <label class="flex items-center gap-2"><span class="w-12 shrink-0 font-semibold text-gray-700">Nama</span><input type="text" value="${escapeHtml(rps.identitas.pengesahan.gugusKendaliMutuNama || '')}" disabled title="Otomatis dari Master Data akun GKM" class="w-full border-b border-gray-300 bg-gray-50 px-2 py-1"></label>
                                    </td>
                                    <td class="border-b border-gray-300 p-3">
                                        <label class="flex items-center gap-2"><span class="w-12 shrink-0 font-semibold text-gray-700">Nama</span><input type="text" value="${escapeHtml(rps.identitas.pengesahan.dosenPJMKNama || '')}" disabled title="Otomatis dari Dosen PJMK pada Setup Perkuliahan" class="w-full border-b border-gray-300 bg-gray-50 px-2 py-1"></label>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="border-r border-gray-300 p-3">
                                        <label class="flex items-center gap-2"><span class="w-20 shrink-0 font-semibold text-gray-700">No. NUPTK</span><input type="text" value="${escapeHtml(rps.identitas.pengesahan.ketuaProgramStudiNUPTK || '')}" disabled title="Otomatis dari Master Data akun Kaprodi" class="w-full border-b border-gray-300 bg-gray-50 px-2 py-1"></label>
                                    </td>
                                    <td class="border-r border-gray-300 p-3">
                                        <label class="flex items-center gap-2"><span class="w-20 shrink-0 font-semibold text-gray-700">No. NUPTK</span><input type="text" value="${escapeHtml(rps.identitas.pengesahan.gugusKendaliMutuNUPTK || '')}" disabled title="Otomatis dari Master Data akun GKM" class="w-full border-b border-gray-300 bg-gray-50 px-2 py-1"></label>
                                    </td>
                                    <td class="p-3">
                                        <label class="flex items-center gap-2"><span class="w-20 shrink-0 font-semibold text-gray-700">No. NUPTK</span><input type="text" value="${escapeHtml(rps.identitas.pengesahan.dosenPJMKNUPTK || '')}" disabled title="Otomatis dari Dosen PJMK pada Setup Perkuliahan" class="w-full border-b border-gray-300 bg-gray-50 px-2 py-1"></label>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    <section class="rounded-xl border ${isRpsFinalized ? 'border-emerald-300 bg-emerald-50' : 'border-blue-200 bg-blue-50'} p-4 shadow-sm">
                        <div class="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h4 class="font-bold text-base ${isRpsFinalized ? 'text-emerald-900' : 'text-blue-950'}"><i class="fa-solid ${isRpsFinalized ? 'fa-lock' : 'fa-file-circle-check'} mr-2"></i>Finalisasi RPS</h4>
                                <p class="mt-1 text-xs ${isRpsFinalized ? 'text-emerald-700' : 'text-blue-800'}">${isRpsFinalized ? 'RPS telah difinalisasi. Seluruh bagian RPS dalam kondisi terkunci.' : 'Finalisasi RPS setelah semua bagian sudah valid.'}</p>
                            </div>
                            <div>
                                ${isRpsFinalized
                                    ? `<span class="inline-flex items-center rounded-full border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800"><i class="fa-solid fa-circle-check mr-1.5"></i>RPS DIFINALISASI</span>
                                       <button data-rps-lock-control onclick="exportRpsToPdf('${state.selectedClassKey}')" class="ml-2 inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-black"><i class="fa-solid fa-file-pdf mr-1.5"></i>Ekspor PDF RPS</button>
                                       <button data-rps-lock-control onclick="unfinalizeRPS('${state.selectedClassKey}')" class="ml-2 inline-flex items-center border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"><i class="fa-solid fa-lock-open mr-1.5"></i>Buka Kunci RPS</button>`
                                    : `<button data-rps-lock-control onclick="finalizeRPS('${state.selectedClassKey}')" class="inline-flex items-center bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-4 py-2 rounded-lg shadow font-bold"><i class="fa-solid fa-check-double mr-1.5"></i>Finalisasi RPS</button>`}
                            </div>
                        </div>
                    </section>`;
            html += `</div></div>`;

            const weeklyScrollLeft = (() => {
                const currentScroll = container.querySelector('.weekly-matrix-scroll');
                return currentScroll ? currentScroll.scrollLeft : 0;
            })();

            container.innerHTML = html;
            if (isRpsFinalized) {
                container.querySelectorAll('.rps-workspace input, .rps-workspace select, .rps-workspace textarea, .rps-workspace button').forEach(function (control) {
                    if (control.closest('.rps-class-selector') || control.hasAttribute('data-rps-lock-control')) return;
                    control.disabled = true;
                });
            }
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(function () {
                    container.querySelectorAll('textarea[data-auto-resize="weekly"]').forEach(function (textarea) {
                        autoResizeTextarea(textarea);
                    });
                    const nextScroll = container.querySelector('.weekly-matrix-scroll');
                    if (nextScroll) nextScroll.scrollLeft = weeklyScrollLeft;
                });
            } else {
                container.querySelectorAll('textarea[data-auto-resize="weekly"]').forEach(function (textarea) {
                    autoResizeTextarea(textarea);
                });
                const nextScroll = container.querySelector('.weekly-matrix-scroll');
                if (nextScroll) nextScroll.scrollLeft = weeklyScrollLeft;
            }
        }

