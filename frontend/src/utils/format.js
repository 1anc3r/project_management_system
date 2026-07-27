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
 * 处理 HTML 内容中的图片 URL，注入短期文件访问凭证（access_token）
 * 用于富文本编辑器中插入的图片在展示时能够通过认证。
 * 凭证为短期（30分钟）、绑定单个文件的作用域 Token，
 * 避免在 URL 中直接暴露登录 JWT（会进入 Nginx 日志、浏览器历史与 Referer）
 * @param {string} html - HTML 内容
 * @returns {Promise<string>} 处理后的 HTML
 */
export const injectImageTokens = async (html) => {
  if (!html) return html

  const regex = /(src=["'])\/uploads\/([^"'?]+)(\?[^"']*)?(["'])/g
  // 收集去重后的文件名
  const filenames = [...new Set([...html.matchAll(regex)].map(m => m[2]))]
  if (filenames.length === 0) return html

  // 延迟加载，避免与 api 模块产生循环依赖
  const { getAccessTokens } = await import('@/api/attachments')

  let tokenMap = {}
  try {
    const data = await getAccessTokens({ files: filenames })
    tokenMap = data?.tokens || {}
  } catch {
    // 凭证申请失败时返回原始 HTML，图片加载失败但不影响文本展示
    return html
  }

  return html.replace(regex, (match, prefix, filename, existingQuery, suffix) => {
    const token = tokenMap[`file:${filename}`]
    if (!token) return match
    // 先移除已有的 token / access_token 参数，避免重复
    const cleanQuery = existingQuery
      ? existingQuery.replace(/[?&](token|access_token)=[^&]*/g, '').replace(/^&/, '?')
      : ''
    const separator = cleanQuery && cleanQuery !== '?' ? '&' : '?'
    return `${prefix}/uploads/${filename}${cleanQuery}${separator}access_token=${encodeURIComponent(token)}${suffix}`
  })
}



// 项目类型颜色映射
export const getProjectTypeColor = (type) => {
  const typeMap = {
    '收入合同': '#67C23A',
    '支出合同': '#F56C6C',
    '框架合同': '#409EFF'
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
    '支出合同': 'danger',
    '框架合同': 'primary'
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
    '客户交流': 'warning',
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

// 商机阶段标签样式
export const getOpportunityStageTag = (stage) => {
  const typeMap = {
    '初步接触': 'success',
    '需求跟踪': 'primary',
    '方案编制': 'primary',
    '询价报价': 'warning',
    '招标投标': 'danger'
  }
  return typeMap[stage] || 'info'
}

// 意向等级标签样式
export const getOpportunityInterestTag = (interest) => {
  const typeMap = {
    '积极': 'danger',
    '一般': 'warning',
    '消极': 'primary',
    '未知': 'success'
  }
  return typeMap[interest] || 'info'
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
