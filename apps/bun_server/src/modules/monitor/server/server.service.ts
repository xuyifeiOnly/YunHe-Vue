import si from 'systeminformation'

export class ServerService {
  public async serverInfo() {
    const [cpuInfo, currentLoad, memInfo, osInfo, networkInterfaces, fsSize] =
      await Promise.all([
        si.cpu(),
        si.currentLoad(),
        si.mem(),
        si.osInfo(),
        si.networkInterfaces(),
        si.fsSize(),
      ])
    const gb = 1024 ** 3
    const networkList = Array.isArray(networkInterfaces)
      ? networkInterfaces
      : [networkInterfaces]
    const primaryInterface =
      networkList.find((net) => !net.internal) ?? networkList[0]
    const cpu = {
      cores: cpuInfo.cores,
      used: `${currentLoad.currentLoadUser.toFixed(2)}%`,
      system: `${currentLoad.currentLoadSystem.toFixed(2)}%`,
      free: `${(100 - currentLoad.currentLoadUser - currentLoad.currentLoadSystem).toFixed(2)}%`,
    }
    const memory = {
      total: `${(memInfo.total / gb).toFixed(2)}GB`,
      used: `${(memInfo.used / gb).toFixed(2)}GB`,
      free: `${(memInfo.free / gb).toFixed(2)}GB`,
      usage: `${((memInfo.used / memInfo.total) * 100).toFixed(2)}%`,
    }
    const server = {
      hostname: osInfo.hostname,
      platform: osInfo.platform,
      ip: primaryInterface?.ip4 ?? '',
      arch: osInfo.arch,
    }
    const disks = fsSize.map((partition) => ({
      fs: partition.fs,
      mount: partition.mount,
      type: partition.type,
      total: `${(partition.size / gb).toFixed(2)}GB`,
      used: `${(partition.used / gb).toFixed(2)}GB`,
      free: `${((partition.size - partition.used) / gb).toFixed(2)}GB`,
      usage: `${partition.use.toFixed(2)}%`,
    }))
    return { cpu, memory, server, disks }
  }
}
