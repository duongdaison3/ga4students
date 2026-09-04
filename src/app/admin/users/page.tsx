"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Search, Trash2, Download, Edit, Key, X, Mail } from "lucide-react";
import { useNotification } from "@/components/NotificationProvider";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Edit User State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ fullName: "", email: "", phone: "", university: "" });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Password Reset State
  const [isResetting, setIsResetting] = useState<string | null>(null);
  const { notify, confirm } = useNotification();

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
      notify("Lỗi khi cập nhật vai trò!", "error");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!await confirm("Bạn có chắc chắn muốn xóa người dùng này? Tài khoản và các dữ liệu đăng ký sự kiện liên quan sẽ bị xóa vĩnh viễn.")) {
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
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
      notify("Đã xóa người dùng thành công.", "success");
    } catch (error: any) {
      console.error("Error deleting user:", error);
      notify(error.message || "Đã xảy ra lỗi khi xóa người dùng.", "error");
    } finally {
      setIsDeleting(null);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => prev.includes(userId)
      ? prev.filter(id => id !== userId)
      : [...prev, userId]);
  };

  const toggleAllFilteredUsers = () => {
    const filteredIds = filteredUsers.map(user => user.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedUserIds.includes(id));
    setSelectedUserIds(prev => allSelected
      ? prev.filter(id => !filteredIds.includes(id))
      : [...new Set([...prev, ...filteredIds])]);
  };

  const getAdminToken = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Chưa đăng nhập");
    return currentUser.getIdToken();
  };

  const handleBulkResetPassword = async () => {
    const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
    if (selectedUsers.length === 0) return;
    if (!await confirm(`Gửi lại email đặt mật khẩu cho ${selectedUsers.length} user đã chọn? Email sẽ được gửi tuần tự để tránh vượt hạn mức Brevo.`)) return;

    setIsBulkProcessing(true);
    let successCount = 0;
    try {
      const idToken = await getAdminToken();
      for (let index = 0; index < selectedUsers.length; index += 10) {
        const batch = selectedUsers.slice(index, index + 10);
        const results = await Promise.all(batch.map(async user => {
          const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${idToken}` },
          });
          return response.ok;
        }));
        successCount += results.filter(Boolean).length;
      }
      notify(`Đã gửi ${successCount}/${selectedUsers.length} email đặt mật khẩu.`, successCount === selectedUsers.length ? "success" : "error");
      setSelectedUserIds([]);
    } catch (error: any) {
      notify(error.message || `Đã gửi ${successCount}/${selectedUsers.length} email.`, "error");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    if (!await confirm(`Xóa vĩnh viễn ${selectedUserIds.length} user đã chọn cùng dữ liệu liên quan?`)) return;

    setIsBulkProcessing(true);
    let successCount = 0;
    try {
      const idToken = await getAdminToken();
      for (const userId of selectedUserIds) {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${idToken}` },
        });
        if (response.ok) successCount += 1;
      }
      setUsers(prev => prev.filter(user => !selectedUserIds.includes(user.id)));
      setSelectedUserIds([]);
      notify(`Đã xóa ${successCount} user.`, successCount === selectedUserIds.length ? "success" : "error");
    } catch (error: any) {
      notify(error.message || `Đã xóa ${successCount}/${selectedUserIds.length} user.`, "error");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      notify("Không có dữ liệu để xuất.");
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
      notify("Cập nhật thông tin thành công!", "success");
      setIsEditModalOpen(false);
    } catch (error: any) {
      notify(error.message || "Lỗi khi cập nhật", "error");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleResetPassword = async (user: any) => {
    if (!await confirm(`Bạn có chắc muốn gửi email đặt lại mật khẩu cho ${user.email}?`)) return;
    
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

      notify("Đã gửi email cấp lại mật khẩu thành công!", "success");
    } catch (error: any) {
      notify(error.message || "Lỗi khi gửi email mật khẩu", "error");
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
      <div className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quản lý Người dùng</h2>
          <p className="mt-1 text-sm text-slate-500">{filteredUsers.length} người dùng được hiển thị</p>
        </div>
        
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4285F4] sm:w-auto"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="student">Sinh viên</option>
            <option value="speaker">Giảng viên</option>
            <option value="admin">Quản trị viên</option>
          </select>

          <div className="relative w-full sm:min-w-64 sm:flex-1 lg:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" 
              placeholder="Tìm kiếm..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#4285F4] focus:border-transparent"
            />
          </div>

          <button 
            onClick={handleExportCSV}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 font-medium text-green-700 transition-colors hover:bg-green-100 sm:w-auto"
          >
            <Download className="w-4 h-4" /> Xuất CSV
          </button>
        </div>
      </div>

      {selectedUserIds.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium">Đã chọn {selectedUserIds.length} user</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleBulkResetPassword}
              disabled={isBulkProcessing}
              className="flex items-center gap-2 rounded-lg bg-[#4285F4] px-3 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Mail className="h-4 w-4" />
              {isBulkProcessing ? "Đang xử lý..." : "Gửi lại email mật khẩu"}
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkProcessing}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" /> Xóa đã chọn
            </button>
            <button
              onClick={() => setSelectedUserIds([])}
              disabled={isBulkProcessing}
              className="rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-white disabled:opacity-50"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[980px] table-fixed border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600">
                <th className="w-12 p-3 text-center md:p-4">
                  <input
                    type="checkbox"
                    checked={filteredUsers.length > 0 && filteredUsers.every(user => selectedUserIds.includes(user.id))}
                    onChange={toggleAllFilteredUsers}
                    aria-label="Chọn tất cả user đang hiển thị"
                    className="h-4 w-4 accent-[#4285F4]"
                  />
                </th>
                <th className="w-[170px] whitespace-nowrap p-3 md:p-4">Họ và Tên</th>
                <th className="w-[240px] whitespace-nowrap p-3 md:p-4">Email</th>
                <th className="w-[125px] whitespace-nowrap p-3 md:p-4">SĐT</th>
                <th className="w-[220px] p-3 md:p-4">Trường ĐH / CĐ</th>
                <th className="w-[130px] whitespace-nowrap p-3 md:p-4">Ngày đăng ký</th>
                <th className="w-[150px] whitespace-nowrap p-3 md:p-4">Vai trò</th>
                <th className="sticky right-0 z-10 w-[130px] whitespace-nowrap border-l border-slate-200 bg-slate-50 p-3 text-center md:p-4">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">Không tìm thấy người dùng nào.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 text-center md:p-4">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        aria-label={`Chọn ${user.fullName || user.email}`}
                        className="h-4 w-4 accent-[#4285F4]"
                      />
                    </td>
                    <td className="max-w-0 truncate p-3 font-medium text-slate-900 md:p-4" title={user.fullName}>{user.fullName}</td>
                    <td className="max-w-0 truncate p-3 text-slate-600 md:p-4" title={user.email}>{user.email}</td>
                    <td className="max-w-0 truncate p-3 text-slate-600 md:p-4" title={user.phone}>{user.phone}</td>
                    <td className="max-w-0 p-3 text-slate-600 md:p-4">
                      <div className="truncate" title={user.university}>
                        {user.university}
                      </div>
                    </td>
                    <td className="whitespace-nowrap p-3 text-sm text-slate-500 md:p-4">
                      {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString("vi-VN") : "N/A"}
                    </td>
                    <td className="p-3 md:p-4">
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
                    <td className="sticky right-0 z-10 border-l border-slate-100 bg-white p-3 text-center md:p-4">
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
