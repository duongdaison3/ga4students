"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Search, Trash2, Download, Edit, Key, X } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Edit User State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ fullName: "", email: "", phone: "", university: "" });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Password Reset State
  const [isResetting, setIsResetting] = useState<string | null>(null);

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

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      university: user.university || ""
    });
    setIsEditModalOpen(true);
  };

  const submitEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmittingEdit(true);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Chưa đăng nhập");
      const idToken = await currentUser.getIdToken();

      const res = await fetch(`/api/admin/users/${editingUser.id}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify(editForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi cập nhật");

      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...editForm } : u));
      alert("Cập nhật thông tin thành công!");
      setIsEditModalOpen(false);
    } catch (error: any) {
      alert(error.message || "Lỗi khi cập nhật");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleResetPassword = async (user: any) => {
    if (!confirm(`Bạn có chắc muốn gửi email đặt lại mật khẩu cho ${user.email}?`)) return;
    
    setIsResetting(user.id);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Chưa đăng nhập");
      const idToken = await currentUser.getIdToken();

      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi cấp lại mật khẩu");

      alert("Đã gửi email cấp lại mật khẩu thành công!");
    } catch (error: any) {
      alert(error.message || "Lỗi khi gửi email mật khẩu");
    } finally {
      setIsResetting(null);
    }
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
                <th className="p-4 whitespace-nowrap">Họ và Tên</th>
                <th className="p-4 whitespace-nowrap">Email</th>
                <th className="p-4 whitespace-nowrap">SĐT</th>
                <th className="p-4 min-w-[200px]">Trường ĐH / CĐ</th>
                <th className="p-4 whitespace-nowrap">Ngày đăng ký</th>
                <th className="p-4 whitespace-nowrap">Vai trò</th>
                <th className="p-4 text-center whitespace-nowrap">Hành động</th>
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
                    <td className="p-4 font-medium text-slate-900 whitespace-nowrap">{user.fullName}</td>
                    <td className="p-4 text-slate-600 whitespace-nowrap">{user.email}</td>
                    <td className="p-4 text-slate-600 whitespace-nowrap">{user.phone}</td>
                    <td className="p-4 text-slate-600">
                      <div className="max-w-[200px] sm:max-w-[250px] truncate" title={user.university}>
                        {user.university}
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 text-sm whitespace-nowrap">
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
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleResetPassword(user)}
                          disabled={isResetting === user.id}
                          className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Gửi lại Email đặt Mật khẩu"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa thông tin"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={isDeleting === user.id}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Xóa người dùng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">Sửa thông tin Người dùng</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={submitEditUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và Tên</label>
                <input required type="text" value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4285F4] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-red-500 text-xs">(Cẩn thận khi đổi)</span></label>
                <input required type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4285F4] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4285F4] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Trường ĐH / CĐ</label>
                <input type="text" value={editForm.university} onChange={e => setEditForm({...editForm, university: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4285F4] focus:outline-none" />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Hủy</button>
                <button type="submit" disabled={isSubmittingEdit} className="px-4 py-2 bg-[#4285F4] text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300">
                  {isSubmittingEdit ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
