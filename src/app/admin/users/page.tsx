"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Search, Trash2, Download } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setIsLoading(true);
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

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Lỗi khi cập nhật vai trò!");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này? Tài khoản và các dữ liệu đăng ký sự kiện liên quan sẽ bị xóa vĩnh viễn.")) {
      return;
    }

    setIsDeleting(userId);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Chưa đăng nhập");
      
      const idToken = await currentUser.getIdToken();
      
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${idToken}`
        }
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Lỗi xóa người dùng");
      }
      
      setUsers(prev => prev.filter(u => u.id !== userId));
      alert("Đã xóa người dùng thành công.");
    } catch (error: any) {
      console.error("Error deleting user:", error);
      alert(error.message || "Đã xảy ra lỗi khi xóa người dùng.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      alert("Không có dữ liệu để xuất.");
      return;
    }

    const headers = ["Họ và Tên", "Email", "SĐT", "Trường", "Vai trò", "Ngày đăng ký"];
    const rows = filteredUsers.map(u => [
      `"${u.fullName || ''}"`,
      `"${u.email || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.university || ''}"`,
      `"${u.role || 'student'}"`,
      `"${u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString("vi-VN") : ''}"`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `danh_sach_nguoi_dung_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.university?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || (u.role || "student") === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Quản lý Người dùng</h2>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4285F4] w-full sm:w-auto"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="student">Sinh viên</option>
            <option value="speaker">Giảng viên</option>
            <option value="admin">Quản trị viên</option>
          </select>

          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#4285F4] focus:border-transparent"
            />
          </div>

          <button 
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors w-full sm:w-auto font-medium"
          >
            <Download className="w-4 h-4" /> Xuất CSV
          </button>
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
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Không tìm thấy người dùng nào.</td>
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
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={isDeleting === user.id}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Xóa người dùng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
