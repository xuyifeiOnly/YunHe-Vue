export const kpiData = {
  onlineUsers: 2847,
  totalUsers: 18632,
  todayLogins: 1536,
  loginSuccessRate: 98.6,
  uptime: '127 天 14 时 32 分',
  redisKeyCount: 12486,
}

export const loginTrendData = [
  { time: '00:00', value: 42 },
  { time: '01:00', value: 28 },
  { time: '02:00', value: 18 },
  { time: '03:00', value: 12 },
  { time: '04:00', value: 8 },
  { time: '05:00', value: 15 },
  { time: '06:00', value: 35 },
  { time: '07:00', value: 78 },
  { time: '08:00', value: 145 },
  { time: '09:00', value: 210 },
  { time: '10:00', value: 256 },
  { time: '11:00', value: 230 },
  { time: '12:00', value: 180 },
  { time: '13:00', value: 195 },
  { time: '14:00', value: 242 },
  { time: '15:00', value: 268 },
  { time: '16:00', value: 250 },
  { time: '17:00', value: 220 },
  { time: '18:00', value: 185 },
  { time: '19:00', value: 165 },
  { time: '20:00', value: 195 },
  { time: '21:00', value: 210 },
  { time: '22:00', value: 155 },
  { time: '23:00', value: 88 },
]

export const browserData = [
  { name: 'Chrome', value: 48.5, itemStyle: { color: '#00d4ff' } },
  { name: 'Edge', value: 28.3, itemStyle: { color: '#4facfe' } },
  { name: 'Firefox', value: 12.7, itemStyle: { color: '#ffc857' } },
  { name: 'WeChat', value: 10.5, itemStyle: { color: '#00ff95' } },
]

export const osData = [
  { name: 'Windows 10', value: 42.3, itemStyle: { color: '#00d4ff' } },
  { name: 'Windows 11', value: 30.8, itemStyle: { color: '#4facfe' } },
  { name: 'macOS', value: 18.5, itemStyle: { color: '#a78bfa' } },
  { name: 'Android', value: 8.4, itemStyle: { color: '#00ff95' } },
]

export const regionData = [
  { name: '广东', value: 2856 },
  { name: '北京', value: 2432 },
  { name: '河南', value: 1987 },
  { name: '四川', value: 1756 },
  { name: '辽宁', value: 1523 },
  { name: '浙江', value: 1435 },
  { name: '江苏', value: 1356 },
  { name: '上海', value: 1289 },
  { name: '山东', value: 1120 },
  { name: '湖北', value: 987 },
]

export const chinaMapScatterData = [
  { name: '广东', value: [113.28, 23.12, 2856] },
  { name: '北京', value: [116.46, 39.92, 2432] },
  { name: '河南', value: [113.65, 34.76, 1987] },
  { name: '四川', value: [104.06, 30.67, 1756] },
  { name: '辽宁', value: [123.38, 41.8, 1523] },
  { name: '浙江', value: [120.19, 30.26, 1435] },
  { name: '江苏', value: [118.78, 32.04, 1356] },
  { name: '上海', value: [121.48, 31.22, 1289] },
  { name: '山东', value: [117.0, 36.65, 1120] },
  { name: '湖北', value: [114.31, 30.52, 987] },
  { name: '湖南', value: [112.98, 28.19, 856] },
  { name: '福建', value: [119.3, 26.08, 743] },
  { name: '安徽', value: [117.27, 31.86, 689] },
  { name: '河北', value: [114.48, 38.03, 612] },
  { name: '陕西', value: [108.95, 34.27, 545] },
]

export const chinaFlyLines = [
  { from: '北京', to: '广东', coords: [[116.46, 39.92], [113.28, 23.12]] },
  { from: '北京', to: '四川', coords: [[116.46, 39.92], [104.06, 30.67]] },
  { from: '上海', to: '广东', coords: [[121.48, 31.22], [113.28, 23.12]] },
  { from: '广东', to: '浙江', coords: [[113.28, 23.12], [120.19, 30.26]] },
  { from: '北京', to: '上海', coords: [[116.46, 39.92], [121.48, 31.22]] },
  { from: '四川', to: '湖北', coords: [[104.06, 30.67], [114.31, 30.52]] },
  { from: '江苏', to: '广东', coords: [[118.78, 32.04], [113.28, 23.12]] },
  { from: '河南', to: '北京', coords: [[113.65, 34.76], [116.46, 39.92]] },
]

export const systemResourceData = {
  cpu: 42.5,
  memory: 67.8,
  disk: 58.3,
  load: 2.4,
}

export const serverInfoData = {
  serverName: 'YunHe-Prod-01',
  os: 'CentOS 8.5',
  ip: '192.168.1.100',
  redisVersion: '7.2.4',
  redisMode: 'Cluster',
  redisClients: 48,
}

export const diskData = [
  { path: '/', total: '100G', used: '58G', usage: 58 },
  { path: '/dev/vda1', total: '200G', used: '142G', usage: 71 },
  { path: '/etc/hosts', total: '50G', used: '32G', usage: 64 },
]

export const redisCommandData = [
  { command: 'get', count: 48562, itemStyle: { color: '#00d4ff' } },
  { command: 'set', count: 32150, itemStyle: { color: '#4facfe' } },
  { command: 'ping', count: 18520, itemStyle: { color: '#a78bfa' } },
  { command: 'exists', count: 12480, itemStyle: { color: '#00ff95' } },
  { command: 'del', count: 8650, itemStyle: { color: '#ffc857' } },
]

export const onlineUserData = [
  { username: 'admin', location: '北京', os: 'Windows 11', browser: 'Chrome 120', loginTime: '2026-05-13 14:32:10', status: 'online' },
  { username: 'zhangsan', location: '广东·深圳', os: 'macOS 14.2', browser: 'Edge 120', loginTime: '2026-05-13 14:28:45', status: 'online' },
  { username: 'lisi', location: '上海', os: 'Windows 10', browser: 'Firefox 121', loginTime: '2026-05-13 14:25:30', status: 'online' },
  { username: 'wangwu', location: '四川·成都', os: 'Windows 11', browser: 'Chrome 119', loginTime: '2026-05-13 14:20:15', status: 'online' },
  { username: 'zhaoliu', location: '浙江·杭州', os: 'macOS 14.1', browser: 'Chrome 120', loginTime: '2026-05-13 14:15:50', status: 'online' },
  { username: 'sunqi', location: '河南·郑州', os: 'Windows 10', browser: 'Edge 119', loginTime: '2026-05-13 14:10:22', status: 'online' },
  { username: 'zhouba', location: '江苏·南京', os: 'Android 14', browser: 'WeChat', loginTime: '2026-05-13 14:05:18', status: 'online' },
  { username: 'wujiu', location: '湖北·武汉', os: 'Windows 11', browser: 'Chrome 120', loginTime: '2026-05-13 13:58:40', status: 'online' },
]

export const loginRecordData = [
  { username: 'admin', location: '北京', ip: '192.168.1.100', browser: 'Chrome 120', loginTime: '2026-05-13 14:32:10', status: 'success' },
  { username: 'zhangsan', location: '广东·深圳', ip: '192.168.1.101', browser: 'Edge 120', loginTime: '2026-05-13 14:28:45', status: 'success' },
  { username: 'lisi', location: '上海', ip: '192.168.1.102', browser: 'Firefox 121', loginTime: '2026-05-13 14:25:30', status: 'success' },
  { username: 'test01', location: '未知', ip: '10.0.0.55', browser: 'Chrome 118', loginTime: '2026-05-13 14:22:10', status: 'fail' },
  { username: 'wangwu', location: '四川·成都', ip: '192.168.1.103', browser: 'Chrome 119', loginTime: '2026-05-13 14:20:15', status: 'success' },
  { username: 'zhaoliu', location: '浙江·杭州', ip: '192.168.1.104', browser: 'Chrome 120', loginTime: '2026-05-13 14:15:50', status: 'success' },
  { username: 'test02', location: '未知', ip: '10.0.0.88', browser: 'Safari 17', loginTime: '2026-05-13 14:12:30', status: 'fail' },
  { username: 'sunqi', location: '河南·郑州', ip: '192.168.1.105', browser: 'Edge 119', loginTime: '2026-05-13 14:10:22', status: 'success' },
]
