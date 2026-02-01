'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Eye } from 'lucide-react';

interface RoleDebugInfo {
  stored_role: string | null;
  user_id: string | null;
  token: string | null;
  timestamp: string;
  is_valid: boolean;
}

export default function RoleDebugPage() {
  const [debugInfo, setDebugInfo] = useState<RoleDebugInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // เก็บข้อมูลจาก localStorage
    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    const isValid = role && userId && token ? true : false;

    setDebugInfo({
      stored_role: role,
      user_id: userId,
      token: token ? `${token.substring(0, 20)}...` : null,
      timestamp: new Date().toLocaleString('th-TH'),
      is_valid: isValid,
    });
  }, []);

  const handleClearStorage = () => {
    localStorage.clear();
    setDebugInfo({
      stored_role: null,
      user_id: null,
      token: null,
      timestamp: new Date().toLocaleString('th-TH'),
      is_valid: false,
    });
    setError('localStorage cleared');
  };

  const handleFetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found in localStorage');
        return;
      }

      const response = await fetch('http://localhost:3001/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const profile = await response.json();
        setError(`Profile: ${JSON.stringify(profile, null, 2)}`);
      } else {
        const errorData = await response.json();
        setError(`Error: ${JSON.stringify(errorData, null, 2)}`);
      }
    } catch (err: any) {
      setError(`Fetch error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">🔍 Role Debug Tool</h1>

        {/* Status Card */}
        {debugInfo && (
          <div className={`rounded-lg p-6 mb-6 ${debugInfo.is_valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              {debugInfo.is_valid ? (
                <>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <h2 className="text-2xl font-bold text-green-700">✅ Storage Valid</h2>
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 text-red-600" />
                  <h2 className="text-2xl font-bold text-red-700">❌ Storage Invalid</h2>
                </>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded border">
                <span className="font-medium text-gray-700">Role:</span>
                <span className={`px-3 py-1 rounded-full font-bold ${
                  debugInfo.stored_role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                  debugInfo.stored_role === 'IT' ? 'bg-orange-100 text-orange-700' :
                  debugInfo.stored_role === 'USER' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {debugInfo.stored_role || 'NOT SET'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded border">
                <span className="font-medium text-gray-700">User ID:</span>
                <span className="font-mono text-gray-900">{debugInfo.user_id || 'NOT SET'}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded border">
                <span className="font-medium text-gray-700">Token:</span>
                <span className="font-mono text-gray-900 text-sm">{debugInfo.token || 'NOT SET'}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded border">
                <span className="font-medium text-gray-700">Last Updated:</span>
                <span className="font-mono text-gray-900 text-sm">{debugInfo.timestamp}</span>
              </div>
            </div>
          </div>
        )}

        {/* Role Reference */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Role Reference</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded border border-blue-200">
              <span className="px-3 py-1 bg-blue-600 text-white rounded font-bold">USER</span>
              <span className="text-gray-700">ผู้ใช้ปกติ - สร้างและติดตามงาน</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded border border-orange-200">
              <span className="px-3 py-1 bg-orange-600 text-white rounded font-bold">IT</span>
              <span className="text-gray-700">IT Support - รับและแก้ไขงาน</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded border border-red-200">
              <span className="px-3 py-1 bg-red-600 text-white rounded font-bold">ADMIN</span>
              <span className="text-gray-700">Admin - ดูแลและจัดการทั้งระบบ</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Actions</h2>
          <div className="space-y-3">
            <button
              onClick={handleFetchProfile}
              className="w-full flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Eye size={20} />
              <span>Fetch Profile from API</span>
            </button>
            <button
              onClick={handleClearStorage}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Clear localStorage
            </button>
          </div>
        </div>

        {/* Error/Response */}
        {error && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle size={24} className="text-blue-600" />
              Response
            </h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm text-gray-800">
              {error}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-bold text-blue-900 mb-3">📝 Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>กดปุ่ม "Fetch Profile from API" เพื่อตรวจสอบ role จริงในฐานข้อมูล</li>
            <li>เปรียบเทียบ stored role กับ profile role</li>
            <li>ถ้าต่างกัน ให้ logout และ login ใหม่</li>
            <li>หรือกดปุ่ม "Clear localStorage" เพื่อลบข้อมูลและ refresh page</li>
            <li>ถ้ายังไม่ถูกต้อง ให้ตรวจสอบ Network tab ใน DevTools</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
