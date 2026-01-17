import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api';

function Home() {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { name: 'User', role: '' };
  const canUpdateDisposition = user.role === 'operations' || user.role === 'super_admin';
  
  const [matrix, setMatrix] = useState({ meetings_this_month: 0, leads_this_month: 0, ipd_this_month: 0 });
  const [loadingMatrix, setLoadingMatrix] = useState(true);

  useEffect(() => {
    api.get('/opd/getMatrix')
      .then(res => {
        setMatrix(res.data?.data || { meetings_this_month: 0, leads_this_month: 0, ipd_this_month: 0 });
      })
      .catch(err => {
        console.error('Failed to fetch matrix data', err);
      })
      .finally(() => setLoadingMatrix(false));
  }, []);

  return (
    <div className="w-full bg-gray-50 flex flex-col font-sans">

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full">

        {/* Matrix Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Card 1: Leads This Month */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Leads This Month</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{loadingMatrix ? '-' : matrix.leads_this_month}</p>
              </div>
              <div className="text-4xl opacity-20">📋</div>
            </div>
          </div>

          {/* Card 2: IPDs This Month */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">IPDs This Month</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{loadingMatrix ? '-' : matrix.ipd_this_month}</p>
              </div>
              <div className="text-4xl opacity-20">🏥</div>
            </div>
          </div>

          {/* Card 3: Meetings This Month */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Meetings This Month</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{loadingMatrix ? '-' : matrix.meetings_this_month}</p>
              </div>
              <div className="text-4xl opacity-20">📞</div>
            </div>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Card 1: Book OPD */}
          <Link to="/book-opd" className="group relative bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Book OPD Appointment</h3>
              <div className="flex items-center text-blue-600 font-medium text-sm group-hover:underline">
                Start Booking
                <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </div>
            </div>
          </Link>

          {/* Card 2: Log Meeting */}
          <Link to="/log-meeting" className="group relative bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-purple-500/30 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4 shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">Log Doctor Meeting</h3>
              <div className="flex items-center text-purple-600 font-medium text-sm group-hover:underline">
                Log Now
                <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </div>
            </div>
          </Link>

          {/* Card 3: Update Patient Phone */}
          <Link to="/update-patient-phone" className="group relative bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-amber-500/30 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mb-4 shadow-sm group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">Update Patient Phone</h3>
              <div className="flex items-center text-amber-600 font-medium text-sm group-hover:underline">
                Update Phone
                <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </div>
            </div>
          </Link>

          {/* Card 4: Disposition Update (Conditional) */}
          {canUpdateDisposition && (
            <Link to="/update-disposition" className="group relative bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-green-500/30 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4 shadow-sm group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Update Disposition</h3>
                <div className="flex items-center text-green-600 font-medium text-sm group-hover:underline">
                  Update Disposition
                  <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </div>
              </div>
            </Link>
          )}

        </div>

      </main>

      {/* Footer moved to Layout to keep it at the bottom of the page */}
    </div>
  );
}

export default Home;