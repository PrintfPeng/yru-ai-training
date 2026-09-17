import React from 'react';
import { Bot, BookOpen, CalendarCheck, ArrowRight } from 'lucide-react';

const Features = ({ onViewTraining }) => {
  const features = [
    {
      id: 1,
      title: "ผู้ช่วย AI (AI Agent)",
      description: "โต้ตอบกับผู้ช่วย AI อัจฉริยะของเรา เพื่อค้นหาคำตอบ แนะนำข้อมูลวิทยาเขต และช่วยเหลือทั้งนักศึกษาและบุคลากร",
      icon: <Bot className="w-10 h-10 text-yrupink-400" />,
      buttonText: "คุยกับผู้ช่วย AI",
      glowColor: "group-hover:shadow-yrupink-500/20",
      link: "https://sina-one.yru.ac.th/"
    },
    {
      id: 2,
      title: "หลักสูตรอบรม AI",
      description: "เข้าร่วมเวิร์กชอปและหลักสูตรที่ครอบคลุม เพื่อเรียนรู้แนวคิด AI การเขียนโปรแกรม และการประยุกต์ใช้งานจริง",
      icon: <BookOpen className="w-10 h-10 text-yrupink-400" />,
      buttonText: "ดูหลักสูตรทั้งหมด",
      glowColor: "group-hover:shadow-blue-500/20",
      onClick: onViewTraining
    },
    {
      id: 3,
      title: "จองห้องประชุม",
      description: "ตรวจสอบสถานะห้องว่างแบบเรียลไทม์ และจองห้องประชุมอัจฉริยะที่เพียบพร้อมด้วยเทคโนโลยีทันสมัยได้อย่างง่ายดาย",
      icon: <CalendarCheck className="w-10 h-10 text-yrupink-400" />,
      buttonText: "จองห้องทันที",
      glowColor: "group-hover:shadow-purple-500/20"
    }
  ];

  return (
    <section id="features" className="w-full py-16 pb-24 transition-colors duration-300">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white transition-colors duration-300">บริการหลักของเรา</h2>
        <div className="w-24 h-1 bg-gradient-to-r from-yrupink-600 to-yrupink-400 mx-auto rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {features.map((feature) => (
          <div key={feature.id} className="group glass-card rounded-2xl p-8 flex flex-col relative overflow-hidden h-full">
            {/* Background glow effect */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-yrupink-500/10 rounded-full blur-2xl group-hover:bg-yrupink-500/20 transition-all duration-500"></div>
            
            <div className="mb-6 p-4 rounded-xl bg-gray-100 dark:bg-yrugray-800/50 inline-block w-fit ring-1 ring-black/5 dark:ring-white/5 transition-colors duration-300">
              {feature.icon}
            </div>
            
            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-yrupink-600 dark:group-hover:text-yrupink-300 transition-colors duration-300">
              {feature.title}
            </h3>
            
            <p className="text-gray-600 dark:text-yrugray-100 mb-8 flex-grow leading-relaxed opacity-80 transition-colors duration-300">
              {feature.description}
            </p>
            
            {feature.link ? (
              <a href={feature.link} target="_blank" rel="noopener noreferrer" className="mt-auto w-full py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold text-gray-800 bg-gray-100 hover:text-white hover:bg-yrupink-600 border border-gray-200 dark:text-white dark:bg-yrugray-800 dark:hover:bg-yrupink-600 dark:border-yrugray-700 dark:hover:border-yrupink-500 transition-all duration-300">
                {feature.buttonText}
                <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <button
                onClick={feature.onClick}
                className="mt-auto w-full py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold text-gray-800 bg-gray-100 hover:text-white hover:bg-yrupink-600 border border-gray-200 dark:text-white dark:bg-yrugray-800 dark:hover:bg-yrupink-600 dark:border-yrugray-700 dark:hover:border-yrupink-500 transition-all duration-300"
              >
                {feature.buttonText}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
