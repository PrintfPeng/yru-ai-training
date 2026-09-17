import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full glass border-t border-gray-200 dark:border-yrugray-800/50 mt-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
        
        <div className="flex flex-col items-center md:items-start max-w-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-yrupink-400 to-yrupink-700 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">
              AI
            </div>
            <span className="font-bold text-xl tracking-wide text-gray-900 dark:text-white transition-colors duration-300">CENTER <span className="text-yrupink-400">YRU</span></span>
          </div>
          <p className="text-sm text-gray-600 dark:text-yrugray-100/70 text-center md:text-left transition-colors duration-300">
            ศูนย์กลางด้านการวิจัย การศึกษา และนวัตกรรมปัญญาประดิษฐ์ แห่งมหาวิทยาลัยราชภัฏยะลา
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm text-gray-700 dark:text-yrugray-100/80 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-yrupink-500 dark:text-yrupink-400" />
            <span>133 ถนนเทศบาล 3 ตำบลสะเตง อำเภอเมือง จังหวัดยะลา 95000</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-yrupink-500 dark:text-yrupink-400" />
            <span>+66 73 299 699</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-yrupink-500 dark:text-yrupink-400" />
            <span>aicenter@yru.ac.th</span>
          </div>
        </div>

      </div>
      
      <div className="w-full border-t border-gray-200 dark:border-yrugray-800/50 py-6 transition-colors duration-300">
        <p className="text-center text-xs text-gray-500 dark:text-yrugray-100/50 transition-colors duration-300">
          &copy; {new Date().getFullYear()} AI Center YRU, มหาวิทยาลัยราชภัฏยะลา. สงวนลิขสิทธิ์
        </p>
      </div>
    </footer>
  );
};

export default Footer;
