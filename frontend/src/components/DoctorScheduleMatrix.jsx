import React, { useState, useEffect, useCallback } from 'react';
import { 
    Calendar as CalendarIcon, 
    ChevronRight, 
    ChevronLeft, 
    Clock, 
    User, 
    Phone, 
    CheckCircle2, 
    AlertCircle, 
    Plus, 
    X, 
    RefreshCw, 
    Filter,
    Stethoscope,
    Sparkles,
    CalendarDays
} from 'lucide-react';

export default function DoctorScheduleMatrix({ onBookingSuccess }) {
    const [scheduleData, setScheduleData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentStartDate, setCurrentStartDate] = useState('');
    const [doctorFilter, setDoctorFilter] = useState('all');

    // Quick booking modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null); // { doctor, dateStr, dayNameAr, time }
    const [bookingForm, setBookingForm] = useState({
        patientName: '',
        phone: '',
        reason: 'كشف جديد'
    });
    const [submitting, setSubmitting] = useState(false);
    const [modalError, setModalError] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState(null);

    // Month & Year picker state
    const today = new Date();
    const [pickerMonth, setPickerMonth] = useState(today.getMonth() + 1);
    const [pickerYear, setPickerYear] = useState(today.getFullYear());

    const fetchSchedule = useCallback(async (startDate = '') => {
        try {
            setLoading(true);
            setError(null);
            const query = startDate ? `?startDate=${encodeURIComponent(startDate)}` : '';
            const res = await fetch(`/api/schedule/weekly${query}`);
            if (!res.ok) {
                throw new Error(`خطأ في تحميل الجدول (${res.status})`);
            }
            const data = await res.json();
            if (data.success && data.data) {
                setScheduleData(data.data);
                if (data.data.week?.startDate) {
                    setCurrentStartDate(data.data.week.startDate);
                    const [y, m] = data.data.week.startDate.split('-');
                    setPickerYear(parseInt(y, 10));
                    setPickerMonth(parseInt(m, 10));
                }
            } else {
                throw new Error(data.message || 'فشل جلب بيانات المواعيد');
            }
        } catch (err) {
            console.error('Error loading schedule matrix:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    const handleNavigate = (targetStartDate) => {
        if (!targetStartDate) return;
        fetchSchedule(targetStartDate);
    };

    const handleJumpToMonthYear = () => {
        // Build first day of chosen month & year
        const target = `${pickerYear}-${String(pickerMonth).padStart(2, '0')}-01`;
        fetchSchedule(target);
    };

    const handleOpenBooking = (doc, day, slotTime) => {
        setSelectedSlot({
            doctorId: doc.id,
            doctorName: doc.name,
            specialty: doc.specialty,
            price: doc.price,
            dateStr: day.dateStr,
            dayNameAr: day.dayNameAr,
            time: slotTime
        });
        setBookingForm({
            patientName: '',
            phone: '',
            reason: 'كشف جديد'
        });
        setModalError('');
        setBookingSuccess(null);
        setIsModalOpen(true);
    };

    const handleManualBookSubmit = async (e) => {
        e.preventDefault();
        setModalError('');
        setBookingSuccess(null);

        if (!bookingForm.patientName || bookingForm.patientName.trim().length < 3) {
            setModalError('يرجى إدخال اسم المريض الثلاثي بشكل صحيح');
            return;
        }

        const cleanPhone = bookingForm.phone.trim();
        if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
            setModalError('رقم المحمول المصري يجب أن يتكون من 11 رقماً ويبدأ بـ (010, 011, 012, 015)');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                doctor: selectedSlot.doctorName,
                date: selectedSlot.dateStr,
                time: selectedSlot.time,
                patientName: bookingForm.patientName.trim(),
                phone: cleanPhone,
                reason: bookingForm.reason || 'حجز مباشر من الاستقبال'
            };

            const res = await fetch('/api/appointments/manual-book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                setBookingSuccess(data.appointment || data);
                // Refresh matrix
                fetchSchedule(currentStartDate);
                if (onBookingSuccess) {
                    onBookingSuccess(data.appointment || data);
                }
            } else {
                setModalError(data.message || 'تعذر تأكيد الحجز');
            }
        } catch (err) {
            setModalError('حدث خطأ في الاتصال بالسيرفر: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Filter doctors
    const displayedDoctors = (scheduleData?.matrix || []).filter(doc => {
        if (doctorFilter === 'all') return true;
        return doc.id === doctorFilter;
    });

    // Compute weekly summary metrics
    const weeklyMetrics = React.useMemo(() => {
        if (!scheduleData?.matrix) return { total: 0, available: 0, booked: 0, waitlist: 0 };
        let total = 0;
        let available = 0;
        let booked = 0;
        let waitlist = 0;

        scheduleData.matrix.forEach(doc => {
            doc.schedule.forEach(day => {
                if (day.isWorkingDay && Array.isArray(day.slots)) {
                    day.slots.forEach(slot => {
                        total++;
                        if (slot.status === 'available') available++;
                        if (slot.status === 'booked') booked++;
                        if (slot.waitlistCount) waitlist += slot.waitlistCount;
                    });
                }
            });
        });

        return { total, available, booked, waitlist };
    }, [scheduleData]);

    return (
        <div className="doctor-schedule-matrix-container" style={{ direction: 'rtl' }}>
            {/* Top Toolbar: Week Navigator & Filters */}
            <div className="glass" style={{ padding: '16px 20px', marginBottom: '20px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                    {/* Left: Week Navigation Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                            onClick={() => handleNavigate(scheduleData?.week?.prevWeekStartDate)}
                            disabled={loading || !scheduleData?.week?.prevWeekStartDate}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                borderRadius: '10px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#0f172a',
                                fontWeight: '600',
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            title="الأسبوع السابق"
                        >
                            <ChevronRight size={16} />
                            الأسبوع السابق
                        </button>

                        <button
                            onClick={() => fetchSchedule('')}
                            disabled={loading}
                            style={{
                                padding: '8px 14px',
                                borderRadius: '10px',
                                border: '1px solid #0d9488',
                                background: 'rgba(13, 148, 136, 0.08)',
                                color: '#0d9488',
                                fontWeight: '700',
                                fontSize: '13px',
                                cursor: 'pointer'
                            }}
                        >
                            هذا الأسبوع
                        </button>

                        <button
                            onClick={() => handleNavigate(scheduleData?.week?.nextWeekStartDate)}
                            disabled={loading || !scheduleData?.week?.nextWeekStartDate}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                borderRadius: '10px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#0f172a',
                                fontWeight: '600',
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            title="الأسبوع القادم"
                        >
                            الأسبوع القادم
                            <ChevronLeft size={16} />
                        </button>
                    </div>

                    {/* Middle: Month & Year Picker */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <CalendarDays size={18} color="#0d9488" />
                        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>انتقال إلى:</span>
                        <select
                            value={pickerMonth}
                            onChange={(e) => setPickerMonth(parseInt(e.target.value, 10))}
                            style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                        >
                            {[
                                { m: 1, name: 'يناير' },
                                { m: 2, name: 'فبراير' },
                                { m: 3, name: 'مارس' },
                                { m: 4, name: 'أبريل' },
                                { m: 5, name: 'مايو' },
                                { m: 6, name: 'يونيو' },
                                { m: 7, name: 'يوليو' },
                                { m: 8, name: 'أغسطس' },
                                { m: 9, name: 'سبتمبر' },
                                { m: 10, name: 'أكتوبر' },
                                { m: 11, name: 'نوفمبر' },
                                { m: 12, name: 'ديسمبر' },
                            ].map(item => (
                                <option key={item.m} value={item.m}>{item.name}</option>
                            ))}
                        </select>

                        <select
                            value={pickerYear}
                            onChange={(e) => setPickerYear(parseInt(e.target.value, 10))}
                            style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                        >
                            <option value={2025}>2025</option>
                            <option value={2026}>2026</option>
                            <option value={2027}>2027</option>
                        </select>

                        <button
                            onClick={handleJumpToMonthYear}
                            disabled={loading}
                            style={{
                                padding: '5px 12px',
                                borderRadius: '8px',
                                background: '#0d9488',
                                color: '#fff',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            عرض
                        </button>
                    </div>

                    {/* Right: Doctor Filter & Refresh */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Filter size={16} color="#64748b" />
                            <select
                                value={doctorFilter}
                                onChange={(e) => setDoctorFilter(e.target.value)}
                                style={{
                                    padding: '7px 12px',
                                    borderRadius: '10px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    background: '#ffffff'
                                }}
                            >
                                <option value="all">كل أطباء العيادة</option>
                                {(scheduleData?.matrix || []).map(doc => (
                                    <option key={doc.id} value={doc.id}>{doc.name} - {doc.specialty}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => fetchSchedule(currentStartDate)}
                            disabled={loading}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                borderRadius: '10px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#0d9488',
                                fontWeight: '600',
                                fontSize: '13px',
                                cursor: 'pointer'
                            }}
                            title="تحديث البيانات"
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                            تحديث
                        </button>
                    </div>
                </div>

                {/* Date range headline & summary metrics */}
                {scheduleData?.week && (
                    <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CalendarIcon size={18} color="#0d9488" />
                            <span style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
                                الأسبوع: من {scheduleData.week.days[0]?.dayNameAr} ({scheduleData.week.days[0]?.dateStr}) إلى {scheduleData.week.days[6]?.dayNameAr} ({scheduleData.week.days[6]?.dateStr})
                            </span>
                        </div>

                        {/* Status Legend & Counts */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#10b981', display: 'inline-block' }}></span>
                                <span>متاح للحجز: <strong>{weeklyMetrics.available}</strong></span>
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#f43f5e', display: 'inline-block' }}></span>
                                <span>محجوز: <strong>{weeklyMetrics.booked}</strong></span>
                            </span>
                            {weeklyMetrics.waitlist > 0 && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#f59e0b', display: 'inline-block' }}></span>
                                    <span>قائمة الانتظار: <strong>{weeklyMetrics.waitlist}</strong></span>
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div style={{ padding: '16px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '12px', color: '#be123c', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Loading Indicator */}
            {loading && !scheduleData && (
                <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#0d9488' }} />
                    <p style={{ fontWeight: '600', fontSize: '15px' }}>جاري تحميل جدول المواعيد الأسبوعي...</p>
                </div>
            )}

            {/* Main Schedule Matrix Grid */}
            {scheduleData && (
                <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1050px', textAlign: 'right' }}>
                        {/* Days Header */}
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                                <th style={{ padding: '14px 18px', width: '240px', fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>
                                    الطبيب / التخصص
                                </th>
                                {scheduleData.week.days.map((day, idx) => (
                                    <th 
                                        key={day.dateStr}
                                        style={{ 
                                            padding: '12px 10px', 
                                            textAlign: 'center',
                                            borderRight: '1px solid #e2e8f0',
                                            background: day.isToday ? 'rgba(13, 148, 136, 0.08)' : 'transparent',
                                            borderTop: day.isToday ? '3px solid #0d9488' : 'none'
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                            <span style={{ fontWeight: '800', fontSize: '14px', color: day.isToday ? '#0d9488' : '#0f172a' }}>
                                                {day.dayNameAr}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#64748b', direction: 'ltr' }}>
                                                {day.dateStr}
                                            </span>
                                            {day.isToday && (
                                                <span style={{ 
                                                    marginTop: '3px',
                                                    fontSize: '10px', 
                                                    fontWeight: '700', 
                                                    background: '#0d9488', 
                                                    color: '#fff', 
                                                    padding: '2px 8px', 
                                                    borderRadius: '10px' 
                                                }}>
                                                    اليوم
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {/* Doctors & Slots Rows */}
                        <tbody>
                            {displayedDoctors.map((doc, docIdx) => (
                                <tr key={doc.id} style={{ borderBottom: '1px solid #e2e8f0', background: docIdx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                                    {/* Doctor Info Column */}
                                    <td style={{ padding: '16px 18px', verticalAlign: 'top', borderLeft: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Stethoscope size={18} color="#0d9488" />
                                                </div>
                                                <strong style={{ fontSize: '15px', color: '#0f172a' }}>{doc.name}</strong>
                                            </div>
                                            <span style={{ fontSize: '12px', color: '#0d9488', fontWeight: '600' }}>{doc.specialty}</span>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                                <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '6px' }}>
                                                    الكشف: {doc.price} ج.م
                                                </span>
                                                <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '6px' }}>
                                                    {doc.hoursAr}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Days Columns */}
                                    {doc.schedule.map(day => (
                                        <td 
                                            key={day.dateStr}
                                            style={{ 
                                                padding: '10px 8px', 
                                                verticalAlign: 'top', 
                                                borderRight: '1px solid #e2e8f0',
                                                background: !day.isWorkingDay ? '#f8fafc' : 'transparent',
                                                minWidth: '130px'
                                            }}
                                        >
                                            {!day.isWorkingDay ? (
                                                <div style={{ textAlign: 'center', padding: '14px 4px', color: '#94a3b8', fontSize: '11px', fontStyle: 'italic' }}>
                                                    عطلة الطبيب
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {day.slots.map(slot => {
                                                        const isBooked = slot.status === 'booked';
                                                        return (
                                                            <div 
                                                                key={slot.time}
                                                                style={{
                                                                    borderRadius: '8px',
                                                                    padding: '6px 8px',
                                                                    border: isBooked ? '1px solid #fecdd3' : '1px solid #a7f3d0',
                                                                    background: isBooked ? '#fff1f2' : '#f0fdf4',
                                                                    fontSize: '12px',
                                                                    transition: 'all 0.15s ease'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isBooked ? '4px' : '0' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', color: isBooked ? '#9f1239' : '#065f46' }}>
                                                                        <Clock size={12} />
                                                                        <span>{slot.time}</span>
                                                                    </div>
                                                                    
                                                                    {!isBooked ? (
                                                                        <button
                                                                            onClick={() => handleOpenBooking(doc, day, slot.time)}
                                                                            style={{
                                                                                padding: '2px 6px',
                                                                                fontSize: '10px',
                                                                                fontWeight: '700',
                                                                                background: '#10b981',
                                                                                color: '#ffffff',
                                                                                border: 'none',
                                                                                borderRadius: '5px',
                                                                                cursor: 'pointer',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '2px'
                                                                            }}
                                                                            title="حجز موعد مباشر"
                                                                        >
                                                                            <Plus size={10} />
                                                                            حجز
                                                                        </button>
                                                                    ) : (
                                                                        <span style={{ fontSize: '10px', color: '#be123c', fontWeight: '700', background: '#ffe4e6', padding: '1px 5px', borderRadius: '4px' }}>
                                                                            محجوز
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Booked Patient Details */}
                                                                {isBooked && (
                                                                    <div style={{ fontSize: '11px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '1px dashed #fecdd3', paddingTop: '4px' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', color: '#0f172a' }}>
                                                                            <User size={10} color="#64748b" />
                                                                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{slot.patientName}</span>
                                                                        </div>
                                                                        {slot.phone && (
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '10px' }}>
                                                                                <Phone size={10} />
                                                                                <span style={{ direction: 'ltr' }}>{slot.phone}</span>
                                                                            </div>
                                                                        )}
                                                                        {slot.bookingId && (
                                                                            <div style={{ fontSize: '10px', color: '#0d9488', fontWeight: '700', direction: 'ltr', textAlign: 'right' }}>
                                                                                #{slot.bookingId}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Waitlist Badge */}
                                                                {slot.waitlistCount > 0 && (
                                                                    <div style={{ marginTop: '4px', background: '#fef3c7', color: '#92400e', fontSize: '10px', fontWeight: '700', padding: '2px 4px', borderRadius: '4px', textAlign: 'center' }}>
                                                                        قائمة انتظار: {slot.waitlistCount}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Quick Booking Modal */}
            {isModalOpen && selectedSlot && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '16px'
                }}>
                    <div className="glass" style={{
                        background: '#ffffff',
                        borderRadius: '20px',
                        width: '100%',
                        maxWidth: '520px',
                        padding: '24px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                        direction: 'rtl'
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Sparkles size={20} color="#0d9488" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a', fontWeight: '800' }}>حجز موعد كشف مباشر</h3>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>تسجيل فوري بجدول المواعيد وملف العيادة</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                <X size={18} color="#64748b" />
                            </button>
                        </div>

                        {/* Success State */}
                        {bookingSuccess ? (
                            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                                    <CheckCircle2 size={32} color="#16a34a" />
                                </div>
                                <h4 style={{ fontSize: '18px', color: '#166534', fontWeight: '800', marginBottom: '6px' }}>تم تأكيد الحجز بنجاح!</h4>
                                <p style={{ fontSize: '14px', color: '#475569', marginBottom: '14px' }}>
                                    كود الحجز المرجعي للمريض: <strong style={{ color: '#0d9488', fontSize: '16px' }}>{bookingSuccess.bookingId}</strong>
                                </p>
                                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', fontSize: '13px', textAlign: 'right', marginBottom: '18px', border: '1px solid #e2e8f0' }}>
                                    <div><strong>المريض:</strong> {bookingSuccess.patientName}</div>
                                    <div><strong>الطبيب:</strong> {bookingSuccess.doctor}</div>
                                    <div><strong>الموعد:</strong> {bookingSuccess.date} - {bookingSuccess.time}</div>
                                    <div><strong>الهاتف:</strong> {bookingSuccess.phone}</div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        background: '#0d9488',
                                        color: '#ffffff',
                                        border: 'none',
                                        fontWeight: '700',
                                        fontSize: '14px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    إغلاق
                                </button>
                            </div>
                        ) : (
                            /* Booking Form */
                            <form onSubmit={handleManualBookSubmit}>
                                {/* Slot Details Banner */}
                                <div style={{ background: 'rgba(13, 148, 136, 0.08)', border: '1px solid rgba(13, 148, 136, 0.2)', padding: '12px 14px', borderRadius: '12px', marginBottom: '16px', fontSize: '13px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: '700', color: '#0f766e' }}>{selectedSlot.doctorName} ({selectedSlot.specialty})</span>
                                        <span style={{ fontWeight: '700', color: '#0d9488' }}>{selectedSlot.price} ج.م</span>
                                    </div>
                                    <div style={{ color: '#334155' }}>
                                        📅 {selectedSlot.dayNameAr} ({selectedSlot.dateStr}) | ⏰ الساعة {selectedSlot.time}
                                    </div>
                                </div>

                                {modalError && (
                                    <div style={{ padding: '10px 14px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '10px', color: '#be123c', fontSize: '13px', marginBottom: '14px' }}>
                                        {modalError}
                                    </div>
                                )}

                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                        اسم المريض الثلاثي <span style={{ color: '#e11d48' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="مثال: أسامة محمد الغزالي"
                                        value={bookingForm.patientName}
                                        onChange={(e) => setBookingForm({ ...bookingForm, patientName: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                        رقم الهاتف المحمول (11 رقم) <span style={{ color: '#e11d48' }}>*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="مثال: 01012345678"
                                        value={bookingForm.phone}
                                        onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', direction: 'ltr', textAlign: 'right' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                        سبب الكشف / ملاحظات
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="كشف جديد، متابعة، طارئ..."
                                        value={bookingForm.reason}
                                        onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            borderRadius: '12px',
                                            background: '#0d9488',
                                            color: '#ffffff',
                                            border: 'none',
                                            fontWeight: '700',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        {submitting ? 'جاري الحجز...' : 'تأكيد الحجز الفوري'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        style={{
                                            padding: '12px 18px',
                                            borderRadius: '12px',
                                            background: '#f1f5f9',
                                            color: '#475569',
                                            border: 'none',
                                            fontWeight: '600',
                                            fontSize: '14px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
