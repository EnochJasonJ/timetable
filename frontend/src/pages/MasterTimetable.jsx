import React, { useState, useEffect } from 'react';
import api from '../api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    Calendar, Users, DoorOpen, Layers, 
    Filter, Download, Printer, ChevronRight,
    Search, LayoutGrid, List, ChevronDown
} from 'lucide-react';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const MasterTimetable = () => {
    const [viewType, setViewType] = useState('section'); // section, faculty, room
    const [entries, setEntries] = useState([]);
    const [slots, setSlots] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [sections, setSections] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [rooms, setRooms] = useState([]);
    
    const [filterDept, setFilterDept] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterSection, setFilterSection] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [entRes, slotRes, deptRes, secRes, facRes, roomRes] = await Promise.all([
                    api.get('timetables/master/', { 
                        params: { 
                            department: filterDept, 
                            year: filterYear,
                            section: filterSection
                        } 
                    }),
                    api.get('timeslots/'),
                    api.get('departments/'),
                    api.get('sections/'),
                    api.get('faculty/'),
                    api.get('rooms/')
                ]);

                setEntries(entRes.data);
                
                // Process slots
                const uniqueSlotsMap = new Map();
                for (const slot of slotRes.data) {
                    if (!uniqueSlotsMap.has(slot.slot_number)) {
                        uniqueSlotsMap.set(slot.slot_number, slot);
                    }
                }
                setSlots(Array.from(uniqueSlotsMap.values()).sort((a,b) => a.slot_number - b.slot_number));
                
                setDepartments(deptRes.data);
                setSections(secRes.data);
                setFaculty(facRes.data);
                setRooms(roomRes.data);
            } catch (err) {
                console.error("Failed to fetch master data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filterDept, filterYear, filterSection]);

    const buildGrid = (relevantEntries) => {
        const grid = {};

        // Build slot index map for O(1) lookup
        const slotIndexMap = new Map();
        slots.forEach((s, idx) => slotIndexMap.set(s.slot_number, idx));

        relevantEntries.forEach(entry => {
            const day = entry.time_slot.day;
            const startSlotNum = entry.time_slot.slot_number;
            if (!grid[day]) grid[day] = {};

            // Always mark the starting slot
            grid[day][startSlotNum] = { ...entry, is_continuation: false };

            if (entry.duration_slots > 1) {
                const startIdx = slotIndexMap.get(startSlotNum);
                if (startIdx === undefined) return;

                // Walk forward marking only REGULAR continuation slots.
                // BREAK/LUNCH slots in between are intentionally left unmarked
                // so they render as normal break separators ("split the break" behaviour).
                let regularCount = 1;
                for (let i = startIdx + 1; i < slots.length && regularCount < entry.duration_slots; i++) {
                    const s = slots[i];
                    if (s.slot_type === 'REGULAR') {
                        grid[day][s.slot_number] = { ...entry, is_continuation: true };
                        regularCount++;
                    }
                    // BREAK/LUNCH left unmarked — renders as normal separator
                }
            }
        });
        return grid;
    };

    const renderGrid = (gridData, title, subtitle) => (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-10 last:mb-0">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase">{title}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{subtitle}</p>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse min-w-[1000px] table-fixed">
                    <thead>
                        <tr className="bg-white text-slate-400 border-b border-slate-100">
                            <th className="p-4 border-r border-slate-100 w-24 text-[9px] font-bold uppercase tracking-widest">Day</th>
                            {slots.map(s => (
                                <th key={s.id} className="p-4 border-r border-slate-100 last:border-0 font-bold">
                                    <div className="text-[8px] tracking-widest uppercase text-slate-400 mb-0.5">{s.label || `P${s.slot_number}`}</div>
                                    <div className="text-[11px] font-extrabold text-slate-700 tracking-tight">{s.start_time.slice(0,5)}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {DAYS.map(dayCode => (
                            <tr key={dayCode} className="bg-white">
                                <td className="p-4 border-r border-slate-100 font-bold text-slate-400 uppercase text-[9px] tracking-widest bg-slate-50/30">
                                    {dayCode}
                                </td>
                                {slots.map(s => {
                                    const cell = gridData[dayCode]?.[s.slot_number];

                                    // Lab continuation slot — render as a mini "cont." card
                                    if (cell?.is_continuation) {
                                        const isLab = cell.entry_type === 'LAB';
                                        return (
                                            <td key={s.id} className="p-1 border-r border-slate-100">
                                                <div className={`p-1.5 rounded border text-[8px] h-full flex flex-col items-center justify-center gap-0.5
                                                    ${isLab ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                                                    <span className="font-extrabold truncate">{cell.course_offering?.subject?.short_name || cell.subject_name}</span>
                                                    <span className="opacity-60">(cont.)</span>
                                                </div>
                                            </td>
                                        );
                                    }

                                    if (['BREAK', 'LUNCH'].includes(s.slot_type) && !cell) {
                                        return <td key={s.id} className="p-1 border-r border-slate-100 bg-slate-50/50"></td>;
                                    }

                                    if (!cell) return <td key={s.id} className="p-1 border-r border-slate-100"></td>;

                                    const isLab = cell.entry_type === 'LAB' || cell.course_offering?.subject?.subject_type === 'LAB';
                                    return (
                                        <td key={s.id} className="p-1 border-r border-slate-100">
                                            <div className={`p-2 rounded border text-[10px] h-full flex flex-col justify-center ${isLab ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-indigo-50 border-indigo-100 text-indigo-900'}`}>
                                                <span className="font-extrabold truncate">{cell.course_offering?.subject?.short_name || cell.subject_name}</span>
                                                <div className="flex items-center justify-between mt-1 opacity-60 font-bold text-[8px]">
                                                    <span>{viewType === 'section' ? (cell.faculty?.full_name || cell.faculty_name || 'TBA') : cell.timetable_section_label || cell.section_label}</span>
                                                    <span>{cell.room?.name || cell.room_name || 'H'}</span>
                                                </div>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );



    const handleDownloadCSV = () => {
        const csvRows = [];
        groupedData.forEach(group => {
            csvRows.push([group.title, group.subtitle]);
            csvRows.push(['Day', ...slots.map(s => s.label || `Period ${s.slot_number}`)]);
            DAYS.forEach(dayCode => {
                const row = [dayCode];
                slots.forEach(s => {
                    const cell = group.grid[dayCode]?.[s.slot_number];
                    if (!cell) {
                        row.push(['BREAK', 'LUNCH'].includes(s.slot_type) ? (s.label || s.slot_type) : '');
                    } else if (cell.is_continuation) {
                        row.push(`${cell.course_offering?.subject?.short_name || ''} (cont.)`);
                    } else {
                        const name = cell.course_offering?.subject?.short_name || cell.subject_name || '';
                        const code = cell.course_offering?.subject?.subject_code || cell.subject_code || '';
                        const fac  = cell.faculty?.full_name || cell.faculty_name || 'TBA';
                        const room = cell.room?.name || cell.room_name || '';
                        const label = viewType === 'section'
                            ? `${name} (${code}) | ${fac} | ${room}`
                            : `${name} (${code}) | ${cell.timetable_section_label || ''} | ${room}`;
                        row.push(label);
                    }
                });
                csvRows.push(row);
            });
            csvRows.push([]);
        });
        const csv = csvRows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
        triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `master_timetable_${viewType}.csv`);
    };

    const handleDownloadXLS = () => {
        // Build an HTML table workbook — Excel can open these directly
        const tableHTML = groupedData.map(group => `
            <h2>${group.title} — ${group.subtitle}</h2>
            <table border="1">
                <thead>
                    <tr><th>Day</th>${slots.map(s => `<th>${s.label || 'P' + s.slot_number}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${DAYS.map(dayCode => `
                        <tr>
                            <td><b>${dayCode}</b></td>
                            ${slots.map(s => {
                                const cell = group.grid[dayCode]?.[s.slot_number];
                                if (!cell) return `<td></td>`;
                                if (cell.is_continuation) return `<td>${cell.course_offering?.subject?.short_name || ''} (cont.)</td>`;
                                const name = cell.course_offering?.subject?.short_name || cell.subject_name || '';
                                const fac  = cell.faculty?.full_name || cell.faculty_name || '';
                                const room = cell.room?.name || cell.room_name || '';
                                return `<td>${name}\n${fac}\n${room}</td>`;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table><br/>
        `).join('');
        const xlsContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"/></head><body>${tableHTML}</body></html>`;
        triggerDownload(new Blob([xlsContent], { type: 'application/vnd.ms-excel' }), `master_timetable_${viewType}.xls`);
    };

    const buildPrintHTML = () => `
        <!DOCTYPE html><html><head><meta charset="utf-8"/>
        <title>Master Timetable</title>
        <style>
            *{box-sizing:border-box;margin:0;padding:0}
            body{font-family:system-ui,-apple-system,sans-serif;background:#fff;padding:20px}
            h1{font-size:18px;font-weight:800;margin-bottom:4px}
            .meta{font-size:11px;color:#64748b;margin-bottom:20px}
            h2{font-size:13px;font-weight:800;margin:22px 0 3px;text-transform:uppercase;letter-spacing:.05em}
            .subtitle{font-size:10px;color:#94a3b8;margin-bottom:6px}
            table{width:100%;border-collapse:collapse;font-size:10px;margin-bottom:28px}
            th,td{border:1px solid #e2e8f0;padding:5px 4px;text-align:center;vertical-align:middle}
            th{background:#f8fafc;font-weight:700;color:#475569}
            .lab{background:#ecfdf5;color:#065f46}
            .theory{background:#eef2ff;color:#3730a3}
            .brk{background:#f8fafc;color:#94a3b8;font-size:9px}
            .cont{background:#d1fae5;color:#059669;font-style:italic;font-size:9px}
            strong{display:block;font-weight:700}
            small{display:block;font-size:8px;color:#6b7280;margin-top:1px}
            @media print{body{padding:10px}}
        </style></head>
        <body>
        <h1>Master Timetable</h1>
        <p class="meta">View: ${viewType.charAt(0).toUpperCase() + viewType.slice(1)} &bull; Generated ${new Date().toLocaleDateString()}</p>
        ${groupedData.map(group => `
            <h2>${group.title}</h2>
            <p class="subtitle">${group.subtitle}</p>
            <table>
                <thead><tr>
                    <th style="width:52px">Day</th>
                    ${slots.map(s => `<th>${s.label || 'P' + s.slot_number}<br/><span style="font-size:8px;font-weight:400">${s.start_time.slice(0,5)}</span></th>`).join('')}
                </tr></thead>
                <tbody>
                    ${DAYS.map(dayCode => `
                        <tr>
                            <th>${dayCode}</th>
                            ${slots.map(s => {
                                const cell = group.grid[dayCode]?.[s.slot_number];
                                if (!cell) {
                                    const isBreak = ['BREAK','LUNCH'].includes(s.slot_type);
                                    return `<td class="${isBreak ? 'brk' : ''}">${isBreak ? (s.label || s.slot_type) : ''}</td>`;
                                }
                                if (cell.is_continuation) {
                                    return `<td class="cont">${cell.course_offering?.subject?.short_name || ''}<br/>(cont.)</td>`;
                                }
                                const isLab = cell.entry_type === 'LAB';
                                const name = cell.course_offering?.subject?.short_name || cell.subject_name || '';
                                const code = cell.course_offering?.subject?.subject_code || cell.subject_code || '';
                                const fac  = cell.faculty?.full_name || cell.faculty_name || '';
                                const room = cell.room?.name || cell.room_name || '';
                                const sec  = cell.timetable_section_label || cell.section_label || '';
                                return `<td class="${isLab ? 'lab' : 'theory'}">
                                    <strong>${name}</strong>
                                    <small>${code}</small>
                                    <small>${viewType === 'section' ? fac : sec}</small>
                                    <small style="color:#6366f1">${room}</small>
                                </td>`;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `).join('')}
        </body></html>
    `;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=1200,height=800');
        printWindow.document.write(buildPrintHTML());
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    };

    const handleDownloadPDF = () => {
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
        const pageW  = pdf.internal.pageSize.getWidth();
        const margin = 10;

        let isFirstGroup = true;

        groupedData.forEach(group => {
            if (!isFirstGroup) pdf.addPage();
            isFirstGroup = false;

            let y = margin;

            // Group title
            pdf.setFontSize(13);
            pdf.setFont('helvetica', 'bold');
            pdf.text(group.title, margin, y);
            y += 5;
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(148, 163, 184);
            pdf.text(group.subtitle, margin, y);
            pdf.setTextColor(0, 0, 0);
            y += 5;

            // Build head and body for autoTable
            const head = [['Day', ...slots.map(s => `${s.label || 'P' + s.slot_number}\n${s.start_time.slice(0, 5)}`)]];

            const body = DAYS.map(dayCode => [
                dayCode,
                ...slots.map(s => {
                    const cell = group.grid[dayCode]?.[s.slot_number];
                    if (!cell) {
                        if (['BREAK', 'LUNCH'].includes(s.slot_type)) return s.label || s.slot_type;
                        return '';
                    }
                    if (cell.is_continuation) {
                        return `${cell.course_offering?.subject?.short_name || ''}\n(cont.)`;
                    }
                    const name = cell.course_offering?.subject?.short_name || cell.subject_name || '';
                    const code = cell.course_offering?.subject?.subject_code || cell.subject_code || '';
                    const fac  = cell.faculty?.full_name || cell.faculty_name || '';
                    const room = cell.room?.name || cell.room_name || '';
                    const sec  = cell.timetable_section_label || cell.section_label || '';
                    return `${name}\n${code}\n${viewType === 'section' ? fac : sec}\n${room}`;
                })
            ]);

            autoTable(pdf, {
                head,
                body,
                startY: y,
                margin: { left: margin, right: margin },
                tableWidth: pageW - margin * 2,
                styles: {
                    fontSize: 6.5,
                    cellPadding: 2,
                    valign: 'middle',
                    halign: 'center',
                    overflow: 'linebreak',
                    lineColor: [226, 232, 240],
                    lineWidth: 0.2,
                },
                headStyles: {
                    fillColor: [248, 250, 252],
                    textColor: [71, 85, 105],
                    fontStyle: 'bold',
                    fontSize: 7,
                },
                columnStyles: {
                    0: {
                        fillColor: [248, 250, 252],
                        fontStyle: 'bold',
                        cellWidth: 14,
                        textColor: [71, 85, 105],
                    },
                },
                didParseCell(data) {
                    if (data.section !== 'body' || data.column.index === 0) return;
                    const dayCode = DAYS[data.row.index];
                    const s = slots[data.column.index - 1];
                    if (!s || !dayCode) return;
                    const cell = group.grid[dayCode]?.[s.slot_number];
                    if (!cell) {
                        if (['BREAK', 'LUNCH'].includes(s.slot_type)) {
                            data.cell.styles.fillColor = [241, 245, 249];
                            data.cell.styles.textColor = [148, 163, 184];
                        }
                        return;
                    }
                    if (cell.is_continuation || cell.entry_type === 'LAB') {
                        data.cell.styles.fillColor = [209, 250, 229]; // emerald-100
                        data.cell.styles.textColor = [6, 95, 70];     // emerald-800
                    } else {
                        data.cell.styles.fillColor = [224, 231, 255]; // indigo-100
                        data.cell.styles.textColor = [55, 48, 163];   // indigo-800
                    }
                },
            });
        });

        pdf.save(`master_timetable_${viewType}.pdf`);
    };


    const triggerDownload = (blob, filename) => {
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const getGroupedData = () => {
        if (viewType === 'section') {
            const activeSections = sections.filter(s => entries.some(e => e.timetable_section_id === s.id || e.section === s.id));
            return activeSections.map(s => ({
                id: s.id,
                title: s.label,
                subtitle: `${s.program_name} • Year ${s.year_of_study}`,
                grid: buildGrid(entries.filter(e => e.section === s.id))
            }));
        } else if (viewType === 'faculty') {
            const activeFaculty = faculty.filter(f => entries.some(e => e.faculty === f.id));
            return activeFaculty.map(f => ({
                id: f.id,
                title: `${f.first_name} ${f.last_name}`,
                subtitle: f.department_name || 'General Faculty',
                grid: buildGrid(entries.filter(e => e.faculty === f.id))
            }));
        } else {
            const activeRooms = rooms.filter(r => entries.some(e => e.room === r.id));
            return activeRooms.map(r => ({
                id: r.id,
                title: `Room ${r.number}`,
                subtitle: r.room_type || 'Classroom',
                grid: buildGrid(entries.filter(e => e.room === r.id))
            }));
        }
    };

    const groupedData = getGroupedData();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Master Timetable</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">Consolidated Institutional Schedule</p>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                    {[
                        { id: 'section', label: 'By Section', icon: Layers },
                        { id: 'faculty', label: 'By Faculty', icon: Users },
                        { id: 'room', label: 'By Room', icon: DoorOpen }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setViewType(t.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all
                                ${viewType === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}
                            `}
                        >
                            <t.icon size={14} /> {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <Filter size={14} className="text-slate-400" />
                    <select 
                        value={filterDept} 
                        onChange={e => { setFilterDept(e.target.value); setFilterSection(''); }}
                        className="bg-transparent text-xs font-bold text-slate-600 outline-none"
                    >
                        <option value="">All Departments</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <Calendar size={14} className="text-slate-400" />
                    <select 
                        value={filterYear} 
                        onChange={e => { setFilterYear(e.target.value); setFilterSection(''); }}
                        className="bg-transparent text-xs font-bold text-slate-600 outline-none"
                    >
                        <option value="">All Years</option>
                        {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <Layers size={14} className="text-slate-400" />
                    <select 
                        value={filterSection} 
                        onChange={e => setFilterSection(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-600 outline-none"
                    >
                        <option value="">All Sections</option>
                        {sections
                            .filter(s => (!filterDept || s.department === parseInt(filterDept)) && (!filterYear || s.year_of_study === parseInt(filterYear)))
                            .map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                </div>
                <div className="flex-1" />
                <div className="relative flex items-center gap-2">
                    {/* Download dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDownloadMenu(v => !v)}
                            className="flex items-center gap-1.5 p-2.5 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 hover:text-indigo-600 shadow-sm transition-all text-xs font-bold"
                            title="Download"
                        >
                            <Download size={15} />
                            <ChevronDown size={11} />
                        </button>
                        {showDownloadMenu && (
                            <div
                                className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden"
                                onMouseLeave={() => setShowDownloadMenu(false)}
                            >
                                {[
                                    { label: 'Download CSV', ext: 'csv', action: handleDownloadCSV },
                                    { label: 'Download Excel (.xls)', ext: 'xls', action: handleDownloadXLS },
                                    { label: 'Download PDF', ext: 'pdf', action: handleDownloadPDF },
                                ].map(opt => (
                                    <button
                                        key={opt.ext}
                                        onClick={() => { opt.action(); setShowDownloadMenu(false); }}
                                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center justify-between"
                                    >
                                        {opt.label}
                                        <span className="text-[9px] uppercase font-extrabold text-slate-300">.{opt.ext}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Print button */}
                    <button
                        onClick={handlePrint}
                        title="Print timetable"
                        className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 hover:text-indigo-600 shadow-sm transition-all"
                    >
                        <Printer size={15} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-inner">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aggregating matrix data...</p>
                </div>
            ) : groupedData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <Search size={48} className="text-slate-200 mb-4" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No active timetables found</p>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {groupedData.map(group => (
                        <React.Fragment key={group.id}>
                            {renderGrid(group.grid, group.title, group.subtitle)}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MasterTimetable;
