import React, { useState, useMemo } from 'react';
import { Icon } from './Icon';

export const CalendarView = ({ plans, onBack }) => {
    const [date, setDate] = useState(new Date());
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const changeMonth = (amount) => {
        setDate(new Date(date.getFullYear(), date.getMonth() + amount, 1));
    };

    const calendarData = useMemo(() => {
        const month = date.getMonth();
        const year = date.getFullYear();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const dayMap = new Map();
        plans.forEach(plan => {
            plan.sections.forEach(section => {
                const sectionDate = new Date(plan.startDate);
                sectionDate.setDate(sectionDate.getDate() + section.day - 1);
                const key = sectionDate.toDateString();
                if (!dayMap.has(key)) {
                    dayMap.set(key, []);
                }
                dayMap.get(key).push({ title: section.title, planId: plan._id, sectionId: section._id });
            });
        });

        let days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push({ key: `empty-${i}`, isEmpty: true });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            const currentDay = new Date(year, month, i);
            const events = dayMap.get(currentDay.toDateString()) || [];
            days.push({ key: i, dayNumber: i, events, isToday: new Date().toDateString() === currentDay.toDateString() });
        }
        return days;
    }, [date, plans]);

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg flex items-center mb-6">
                <Icon path="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" className="w-5 h-5 mr-2" /> Back to Features
            </button>
            <div className="bg-black/50 backdrop-blur-sm p-6 rounded-lg border border-blue-800/30">
                <div className="flex justify-between items-center mb-4 px-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-700">&lt;</button>
                    <h2 className="text-2xl font-bold">{monthNames[date.getMonth()]} {date.getFullYear()}</h2>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-700">&gt;</button>
                </div>
                <div className="grid grid-cols-7 text-center font-bold">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="py-2">{day}</div>)}
                </div>
                <div className="grid grid-cols-7 border-t border-r border-gray-800">
                    {calendarData.map(day => (
                        day.isEmpty ?
                        <div key={day.key} className="h-32 border-b border-l border-gray-800"></div> :
                        <div key={day.key} className={`h-32 border-b border-l border-gray-800 p-2 text-left ${day.isToday ? 'bg-blue-900/30' : ''}`}>
                            <div className="font-semibold">{day.dayNumber}</div>
                            <div className="overflow-y-auto max-h-24 text-xs space-y-1 mt-1">
                                {day.events.map(event => (
                                    <div key={event.sectionId} className="bg-blue-800/70 p-1 rounded cursor-pointer hover:bg-blue-700">{event.title}</div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
