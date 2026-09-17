import React, { useState } from 'react';
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  CalendarCheck,
  LogOut,
  Bell,
  Search,
  Users,
  CheckCircle2,
  Menu,
  PlusCircle,
  ClipboardCheck
} from 'lucide-react';
import CreateActivity from './CreateActivity';
import ManageActivities from './ManageActivities';
import CreateAssessment from './CreateAssessment';

const AdminDashboard = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('ภาพรวมระบบ');

  const menuItems = [
    { name: 'ภาพรวมระบบ', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'สร้างกิจกรรม', icon: <PlusCircle className="w-5 h-5" /> },
    { name: 'จัดการหลักสูตร', icon: <BookOpen className="w-5 h-5" /> },
    { name: 'สร้างแบบฟอร์มประเมินและออกใบรับรอง', icon: <ClipboardCheck className="w-5 h-5" /> },
    { name: 'จัดการการจองห้อง', icon: <CalendarCheck className="w-5 h-5" /> },
  ];

  const stats = [
    { title: 'จำนวนการแชท AI', value: '12,450', increase: '+15%', icon: <Bot className="w-6 h-6 text-yrupink-400" /> },
    { title: 'หลักสูตรที่เปิดสอน', value: '24', increase: '+3', icon: <BookOpen className="w-6 h-6 text-yrupink-400" /> },
    { title: 'รออนุมัติจองห้อง', value: '8', increase: '-2%', icon: <CalendarCheck className="w-6 h-6 text-yrupink-400" /> },
    { title: 'ผู้ใช้งานทั้งหมด', value: '3,842', increase: '+124', icon: <Users className="w-6 h-6 text-yrupink-400" /> },
  ];

  return (
    <div className="min-h-screen bg-yrugray-950 flex font-sans text-white">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-yrugray-900 border-r border-yrugray-800 transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Branding */}
        <div className="h-20 flex items-center px-6 border-b border-yrugray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yrupink-400 to-yrupink-700 rounded-lg flex items-center justify-center font-bold text-white shadow-lg text-sm">
              AI
            </div>
            <div>
              <span className="font-bold text-lg tracking-wide text-white block">CENTER <span className="text-yrupink-400">YRU</span></span>
              <span className="text-xs text-yrupink-400 font-medium bg-yrupink-500/10 px-2 py-0.5 rounded-full inline-block mt-0.5">ADMIN</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow py-6 px-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setActiveMenu(item.name);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeMenu === item.name 
                ? 'bg-yrupink-600/10 text-yrupink-400 border border-yrupink-500/20 shadow-inner' 
                : 'text-yrugray-400 hover:text-yrugray-100 hover:bg-yrugray-800/50'
              }`}
            >
              {item.icon}
              <span className="font-medium text-sm">{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-yrugray-800">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-yrugray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-20 bg-yrugray-900/80 backdrop-blur-md border-b border-yrugray-800 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-yrugray-400 hover:text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white hidden sm:block">ภาพรวม / {activeMenu}</h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Search */}
            <div className="hidden md:flex items-center relative">
              <Search className="w-4 h-4 text-yrugray-500 absolute left-3" />
              <input 
                type="text" 
                placeholder="ค้นหา..." 
                className="bg-yrugray-800 border border-yrugray-700 text-sm rounded-full pl-9 pr-4 py-2 text-white focus:outline-none focus:border-yrupink-500 focus:ring-1 focus:ring-yrupink-500 w-64 transition-all"
              />
            </div>

            {/* Notifications */}
            <button className="relative text-yrugray-400 hover:text-white transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-yrupink-500 rounded-full border-2 border-yrugray-900"></span>
            </button>

            {/* Profile */}
            <div className="flex items-center gap-3 pl-6 border-l border-yrugray-800 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white group-hover:text-yrupink-400 transition-colors">สมชาย แอดมิน</p>
                <p className="text-xs text-yrugray-500">ผู้ดูแลระบบสูงสุด</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-yrugray-700 border-2 border-yrupink-500/50 flex items-center justify-center overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-yrugray-950 relative">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[300px] bg-yrupink-600/5 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto space-y-8 relative z-10">
            {activeMenu === 'สร้างกิจกรรม' ? (
              <CreateActivity />
            ) : activeMenu === 'จัดการหลักสูตร' ? (
              <ManageActivities onGoCreate={() => setActiveMenu('สร้างกิจกรรม')} />
            ) : activeMenu === 'สร้างแบบฟอร์มประเมินและออกใบรับรอง' ? (
              <CreateAssessment />
            ) : (
              <>
                {/* Quick Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="bg-yrugray-900 border border-yrugray-800 rounded-2xl p-6 shadow-sm hover:border-yrupink-500/30 transition-colors group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-yrugray-800 rounded-xl group-hover:bg-yrupink-500/10 transition-colors">
                          {stat.icon}
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${stat.increase.startsWith('+') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          {stat.increase}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-yrugray-400 text-sm font-medium mb-1">{stat.title}</h3>
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Main Data Container */}
                <div className="bg-yrugray-900 border border-yrugray-800 rounded-2xl shadow-xl overflow-hidden min-h-[500px] flex flex-col">
                  <div className="p-6 border-b border-yrugray-800 flex justify-between items-center bg-yrugray-900/50">
                    <h3 className="text-lg font-bold text-white">ข้อมูลและการเคลื่อนไหวล่าสุด</h3>
                    <button className="px-4 py-2 bg-yrupink-600 hover:bg-yrupink-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-yrupink-500/20 transition-colors">
                      ออกรายงาน
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-yrugray-800 m-8 rounded-xl bg-yrugray-900/30">
                    <div className="w-16 h-16 bg-yrugray-800 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-yrugray-500" />
                    </div>
                    <h4 className="text-xl font-bold text-yrugray-300 mb-2">พร้อมเชื่อมต่อข้อมูลจริง</h4>
                    <p className="text-yrugray-500 max-w-md">
                      พื้นที่ส่วนนี้ถูกตั้งค่าให้พร้อมเชื่อมต่อกับ API ของคุณแล้ว ข้อมูลตารางสำหรับ <b>"{activeMenu}"</b> จะแสดงที่นี่
                    </p>

                    {/* Mockup skeleton rows just for visuals */}
                    <div className="w-full max-w-2xl mt-12 space-y-3 opacity-30">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-yrugray-800 rounded-lg w-full flex items-center px-4 animate-pulse">
                          <div className="w-8 h-8 bg-yrugray-700 rounded-full mr-4"></div>
                          <div className="h-4 bg-yrugray-700 rounded w-1/4 mr-auto"></div>
                          <div className="h-4 bg-yrugray-700 rounded w-1/6 mr-4"></div>
                          <div className="h-6 bg-yrugray-700 rounded-full w-16"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
