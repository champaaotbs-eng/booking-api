export const MODULE_NAME_MAP: Record<string, string> = {
    'dashboard': 'Bảng điều khiển',
    'admin': 'Quản trị viên',
    'company': 'Nhà xe',
    'bus': 'Xe',
    'seat_layout': 'Sơ đồ ghế',
    'route': 'Tuyến đường',
    'station': 'Điểm dừng tuyến',
    'trip': 'Chuyến xe',
    'booking': 'Đặt vé',
    'staff': 'Nhân viên',
    'revenue': 'Doanh thu',
    'permissions': 'Quyền hạn',
};

export function getModuleNameVi(moduleKey: string): string {
    return MODULE_NAME_MAP[moduleKey.toLowerCase()] || moduleKey;
}
