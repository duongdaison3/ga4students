"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Lỗi khi cập nhật vai trò!");
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.university?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Quản lý Sinh viên</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm sinh viên..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-[#4285F4] focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                <th className="p-4">Họ và Tên</th>
                <th className="p-4">Email</th>
                <th className="p-4">SĐT</th>
                <th className="p-4">Trường ĐH / CĐ</th>
                <th className="p-4">Ngày đăng ký</th>
                <th className="p-4">Vai trò</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Không tìm thấy sinh viên nào.</td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-900">{user.fullName}</td>
                    <td className="p-4 text-slate-600">{user.email}</td>
                    <td className="p-4 text-slate-600">{user.phone}</td>
                    <td className="p-4 text-slate-600">{user.university}</td>
                    <td className="p-4 text-slate-500 text-sm">
                      {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString("vi-VN") : "N/A"}
                    </td>
                    <td className="p-4">
                      <select 
                        value={user.role || 'student'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700 focus:outline-none focus:border-[#4285F4]"
                      >
                        <option value="student">Sinh viên</option>
                        <option value="speaker">Giảng viên</option>
                        <option value="admin">Quản trị viên</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
