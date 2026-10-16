import React from 'react';
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageBack from '../components/PageBack';
import Breadcrumb from '../components/Breadcrumb';

// Single source of truth for the contact details — kept in sync with Footer.jsx.
const ADDRESS = '133 ถนนเทศบาล 3 ตำบลสะเตง อำเภอเมือง จังหวัดยะลา 95000';
const PHONE = '073 299 699 ต่อ 25202';
const PHONE_TEL = 'tel:073299699';
const EMAIL = 'ai-center@yru.ac.th';
const MAP_URL ='https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent('มหาวิทยาลัยราชภัฏยะลา');

const CARDS = [
  
  {
    key: 'phone',
    Icon: Phone,
    label: 'โทรศัพท์',
    value: PHONE,
    href: PHONE_TEL,
    cta: 'โทรออก',
  },
  {
    key: 'email',
    Icon: Mail,
    label: 'อีเมล',
    value: EMAIL,
    href: `mailto:${EMAIL}`,
    cta: 'ส่งอีเมล',
  },
  {
    key: 'address',
    Icon: MapPin,
    label: 'ที่อยู่',
    value: ADDRESS,
    href: MAP_URL,
    cta: 'เปิดใน Google Maps',
    external: true,
    wide: true,
  },
];

/**
 * Standalone "ติดต่อเรา" page (Features-style layout, no Hero).
 * Props: onBackHome, onNavigate(target, hash?), isAdmin
 */
const Contact = ({ onBackHome, onNavigate, isAdmin }) => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yrupink-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-yrupink-500/10 rounded-full blur-[100px] pointer-events-none" />

      <Navbar onNavigate={onNavigate} isAdmin={isAdmin} active="contact" />

      <main className="flex-grow px-6 z-10 w-full max-w-7xl mx-auto pt-8 pb-16">
        <div className="flex items-center justify-between gap-4 mb-8">
          <Breadcrumb
            items={[
              { label: 'หน้าแรก', onClick: onBackHome },
              { label: 'ติดต่อเรา' },
            ]}
          />
          <PageBack onClick={onBackHome} label="กลับหน้าแรก" className="shrink-0" />
        </div>

        {/* Heading */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            ติดต่อเรา
          </h1>
          <p className="text-gray-600 dark:text-yrugray-100/80 max-w-2xl mx-auto leading-relaxed">
            ศูนย์ปัญญาประดิษฐ์ มหาวิทยาลัยราชภัฏยะลา — ติดต่อสอบถามเรื่องหลักสูตรอบรม
            การใช้งานระบบ หรือขอความช่วยเหลือได้ตามช่องทางด้านล่าง
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-yrupink-600 to-yrupink-400 mx-auto rounded-full mt-4" />
        </div>

        {/* Contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {CARDS.map(({ key, Icon, label, value, href, cta, external, wide }) => (
            <a
              key={key}
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              className={`group glass-card rounded-2xl p-6 flex items-start gap-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5${
                wide ? ' sm:col-span-2' : ''
              }`}
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-yrupink-500/10 rounded-full blur-2xl group-hover:bg-yrupink-500/20 transition-all duration-500" />
              <div className="p-3 rounded-xl bg-gray-100 dark:bg-yrugray-800/50 ring-1 ring-black/5 dark:ring-white/5 shrink-0">
                <Icon className="w-6 h-6 text-yrupink-500 dark:text-yrupink-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-yrugray-400 mb-1">
                  {label}
                </p>
                <p className="text-base font-semibold text-gray-900 dark:text-white break-words">
                  {value}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-sm text-yrupink-600 dark:text-yrupink-400 group-hover:underline">
                  {cta}
                  <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* Map embed */}
        <div className="max-w-4xl mx-auto mt-10 rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-yrugray-800">
          <iframe
            title="แผนที่มหาวิทยาลัยราชภัฏยะลา"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.7853234799227!2d101.2896628!3d6.5487676!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31b37430f62893dd%3A0x1cb7c512b6083c5f!2z4Lih4Lir4Liy4Lin4Li04LiX4Lii4Liy4Lil4Lix4Lii4Lij4Liy4LiK4Lig4Lix4LiP4Lii4Liw4Lil4Liy!5e0!3m2!1sth!2sth!4v1792050399884!5m2!1sth!2sth"
            className="w-full h-72 md:h-96"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
