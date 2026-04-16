/**
 * 格式化工具函数
 */

// 格式化金额（万元）
export const formatAmount = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return '-'
  return Number(value).toFixed(decimals)
}

// 格式化百分比
export const formatPercent = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return '-'
  return Number(value).toFixed(decimals) + '%'
}

// 格式化日期
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '-'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
}

// 格式化日期时间
export const formatDateTime = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  
  return `${formatDate(date)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 格式化文件大小
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 下载Blob文件
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
