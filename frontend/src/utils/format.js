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

  // 优先以正则方式从字符串中提取日期部分，彻底避开 new Date() 的时区偏移问题
  // 兼容格式："2024-03-20"、"2024-03-20 10:30:00"、"2024-03-20T00:00:00.000Z"
  if (typeof date === 'string') {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
      const [, year, month, day] = match
      return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
    }
  }

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

  // 优先以正则方式从字符串中提取，避免时区偏移
  // 兼容格式："2024-03-20 10:30:00"、"2024-03-20T10:30:00.000Z"
  if (typeof date === 'string') {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/)
    if (match) {
      const [, year, month, day, hour = '00', minute = '00'] = match
      return `${year}-${month}-${day} ${hour}:${minute}`
    }
  }

  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'

  return `${formatDate(date)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 格式化文件大小
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  if (bytes < 0) return '-'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 处理 HTML 内容中的图片 URL，添加认证 token
 * 用于富文本编辑器中插入的图片在展示时能够通过认证
 * @param {string} html - HTML 内容
 * @param {string} token - JWT token
 * @returns {string} 处理后的 HTML
 */
export const injectImageToken = (html, token) => {
  if (!html || !token) return html
  
  // 匹配 /uploads/ 开头的图片 src
  // 将 /uploads/filename 替换为 /uploads/filename?token=xxx
  // 避免重复添加 token
  return html.replace(
    /(src=["'])\/uploads\/([^"'?]+)(\?[^"']*)?(["'])/g,
    (match, prefix, filename, existingQuery, suffix) => {
      // 如果已经有 token 参数，先移除
      const cleanQuery = existingQuery 
        ? existingQuery.replace(/[?&]token=[^&]*/, '').replace(/^&/, '?')
        : ''
      const separator = cleanQuery && cleanQuery !== '?' ? '&' : '?'
      const newQuery = cleanQuery + separator + 'token=' + encodeURIComponent(token)
      return prefix + '/uploads/' + filename + newQuery + suffix
    }
  )
}



// 项目类型颜色映射
export const getProjectTypeColor = (type) => {
  const typeMap = {
    '收入合同': '#67C23A',
    '支出合同': '#F56C6C'
  }
  return typeMap[type] || '#909399' 
}

// 项目阶段颜色映射
export const getProjectStageColor = (type) => {
  const typeMap = {
    '意向': '#F57FAC',
    '签约': '#EBAA3C',
    '建设': '#409EFF',
    '运营': '#03A9F4',
    '交付': '#009688',
    '验收': '#8FC25C',
    '完结': '#909399'
  }
  return typeMap[type] || '#909399' 
}

// 获取项目类型标签类型
export const getProjectTypeTag = (type) => {
  const typeMap = {
    '收入合同': 'success',
    '支出合同': 'danger'
  }
  return typeMap[type] || 'info'
}

// 获取阶段标签类型
export const getProjectStageTag = (stage) => {
  const typeMap = {
    '意向': 'danger',
    '签约': 'warning',
    '建设': 'primary',
    '运营': 'primary',
    '交付': 'primary',
    '验收': 'success',
    '完结': 'info'
  }
  return typeMap[stage] || 'info'
}

// 合作方类型标签样式
export const getPartnerTypeTag = (type) => {
  const typeMap = {
    '甲方': 'success',
    '乙方': 'danger',
    '丙方': 'warning',
    '其他': 'primary'
  }
  return typeMap[type] || 'info'
}

// 资讯类型标签样式
export const getInfoTypeTag = (type) => {
  const typeMap = {
    '项目实施': 'primary',
    '拜访客户': 'warning',
    '会议活动': 'danger'
  }
  return typeMap[type] || 'info'
}

// 获取操作类型
export const getOperationTypeTag = (operation) => {
  const typeMap = {
    '新增': 'success',
    '编辑': 'primary',
    '删除': 'danger',
    '登录': 'info',
    '登出': 'info',
    '导出': 'warning',
    '导入': 'warning'
  }
  return typeMap[operation] || 'info'
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
