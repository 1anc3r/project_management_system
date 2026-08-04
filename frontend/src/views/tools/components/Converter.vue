<template>
  <div class="app-container">
    <!-- 头部 -->
    <header class="app-header">
      <div class="app-header-inner">
        <h1>
          <el-icon>
            <Switch />
          </el-icon>
          数字大小写转换工具
        </h1>
      </div>
    </header>

    <!-- 双栏转换器 -->
    <div class="converter-grid">
      <!-- 左栏：数字 → 中文大写 -->
      <el-card class="card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon>
              <RefreshRight />
            </el-icon>
            <h3>数字 → 中文大写</h3>
          </div>
        </template>

        <div class="input-group">
          <label for="inputNumber">输入数字</label>
          <textarea id="inputNumber" v-model="numInput" placeholder="例如：12345.67" rows="2"
            @keydown.ctrl.enter="convertToChinese"></textarea>
        </div>

        <div class="action-group">
          <button class="action-btn action-btn-primary" @click="convertToChinese" :disabled="!numInput.trim()">
            <el-icon>
              <Switch />
            </el-icon><span>转换</span>
          </button>
          <button class="action-btn action-btn-secondary" @click="clearNumber">
            <el-icon>
              <Close />
            </el-icon><span>清空</span>
          </button>
        </div>

        <!-- 结果 -->
        <div class="result-group" :class="{ 'has-value': chineseResult }">
          <div class="result-text">
            <span v-if="chineseResult">{{ chineseResult }}</span>
            <span v-else class="placeholder">等待转换……</span>
          </div>
          <button class="copy-btn" @click="copyResult('chinese')" :class="{ copied: chineseCopied }"
            :disabled="!chineseResult">
            <span v-if="chineseCopied"
              style="display: inline-flex;align-items: center;justify-content: center;gap: 6px;"><el-icon>
                <Check />
              </el-icon><span>已复制</span></span>
            <span v-else style="display: inline-flex;align-items: center;justify-content: center;gap: 6px;"><el-icon>
                <DocumentCopy />
              </el-icon><span>复制</span></span>
          </button>
        </div>

        <!-- 错误 -->
        <div v-if="numError" class="error-msg"><el-icon>
            <WarnTriangleFilled />
          </el-icon><span>{{ numError }}</span></div>

        <!-- 示例 -->
        <div class="example-row">
          <span class="label">示例：</span>
          <button class="example-btn" @click="setNumExample('500000')">500,000</button>
          <button class="example-btn" @click="setNumExample('471698.11')">471,698.11</button>
          <button class="example-btn" @click="setNumExample('300000')">300,000</button>
          <button class="example-btn" @click="setNumExample('283018.87')">283,018.87</button>
        </div>
      </el-card>

      <!-- 右栏：中文大写 → 数字 -->
      <el-card class="card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon>
              <RefreshLeft />
            </el-icon>
            <h3>中文大写 → 数字</h3>
          </div>
        </template>

        <div class="input-group">
          <label for="inputChinese">输入中文大写</label>
          <textarea id="inputChinese" v-model="chineseInput" placeholder="例如：壹万贰仟叁佰肆拾伍元陆角柒分" rows="2"
            @keydown.ctrl.enter="convertToNumber"></textarea>
        </div>

        <div class="action-group">
          <button class="action-btn action-btn-primary" @click="convertToNumber" :disabled="!chineseInput.trim()">
            <el-icon>
              <Switch />
            </el-icon><span>转换</span>
          </button>
          <button class="action-btn action-btn-secondary" @click="clearChinese">
            <el-icon>
              <Close />
            </el-icon><span>清空</span>
          </button>
        </div>

        <!-- 结果 -->
        <div class="result-group"
          :class="{ 'has-value': numberResult !== null && numberResult !== undefined && numberResult !== '' }">
          <div class="result-text">
            <span v-if="numberResult !== null && numberResult !== undefined && numberResult !== ''">
              {{ numberResult }}
            </span>
            <span v-else class="placeholder">等待转换……</span>
          </div>
          <button class="copy-btn" @click="copyResult('number')" :class="{ copied: numberCopied }"
            :disabled="numberResult === null || numberResult === undefined || numberResult === ''">
            <span v-if="numberCopied"
              style="display: inline-flex;align-items: center;justify-content: center;gap: 6px;"><el-icon>
                <Check />
              </el-icon><span>已复制</span></span>
            <span v-else style="display: inline-flex;align-items: center;justify-content: center;gap: 6px;"><el-icon>
                <DocumentCopy />
              </el-icon><span>复制</span></span>
          </button>
        </div>

        <!-- 错误 -->
        <div v-if="chineseError" class="error-msg"><el-icon>
            <WarnTriangleFilled />
          </el-icon><span>{{ chineseError }}</span></div>

        <!-- 示例 -->
        <div class="example-row">
          <span class="label">示例：</span>
          <button class="example-btn" @click="setChineseExample('伍拾万元整')">伍拾万元整</button>
          <button class="example-btn" @click="setChineseExample('肆拾柒万壹仟陆佰玖拾捌元壹角壹分')">肆拾柒万壹仟陆佰玖拾捌元壹角壹分</button>
          <button class="example-btn" @click="setChineseExample('叁拾万元整')">叁拾万元整</button>
          <button class="example-btn" @click="setChineseExample('贰拾捌万叁仟零壹拾捌元捌角柒分')">贰拾捌万叁仟零壹拾捌元捌角柒分</button>
        </div>
      </el-card>
    </div>

    <!-- 页脚 -->
    <div class="app-footer">
      <span class="text-muted">
        <el-icon>
          <Opportunity color="orange"/>
        </el-icon><span>支持最多 15 位数 · 支持元角分 · 自动处理「零」和「整」</span>
      </span>
      <span class="text-muted status-line">
        <span class="status-dot" :class="statusClass"></span>
        <span>{{ statusText }}</span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

// =============================================================
//  1. 核心转换逻辑（独立、纯函数）
// =============================================================

// ---------- 常量 ----------
const CN_DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
const CN_UNITS_SMALL = ['', '拾', '佰', '仟'];
const CN_UNITS_BIG = ['', '万', '亿', '万亿'];
// 解析映射
const DIGIT_MAP = {
  '零': 0, '壹': 1, '贰': 2, '叁': 3, '肆': 4,
  '伍': 5, '陆': 6, '柒': 7, '捌': 8, '玖': 9
};
const UNIT_MAP = {
  '拾': 10, '佰': 100, '仟': 1000,
  '万': 10000, '亿': 100000000,
  '元': 1, '角': 0.1, '分': 0.01
};

// ---------- 工具函数 ----------
function isNumeric(str) {
  return /^-?\d+(\.\d+)?$/.test(str.trim());
}

function cleanNumberInput(str) {
  return str.trim().replace(/,/g, '');
}

function cleanChineseInput(str) {
  return str.replace(/\s/g, '').replace(/[，,、]/g, '').replace(/正/g, '整');
}

// ---------- 数字 → 中文大写 ----------
function numberToChinese(num) {
  if (num === undefined || num === null || isNaN(num)) {
    return { result: '', error: '请输入有效的数字' };
  }
  const numStr = String(num).trim();
  if (!isNumeric(numStr)) {
    return { result: '', error: '请输入有效的数字格式' };
  }
  let number = parseFloat(numStr);
  if (!isFinite(number)) {
    return { result: '', error: '数字超出有效范围' };
  }
  let negative = false;
  if (number < 0) {
    negative = true;
    number = Math.abs(number);
  }
  number = Math.round(number * 100) / 100;
  if (number > 9999999999999.99) {
    return { result: '', error: '数字过大（超过 9,999,999,999,999.99）' };
  }
  if (number === 0) {
    return { result: (negative ? '负' : '') + '零元整', error: '' };
  }
  const parts = String(number).split('.');
  const intPart = parts[0];
  const decPart = parts[1] ? parts[1].padEnd(2, '0').slice(0, 2) : '00';
  const intChinese = _convertInteger(intPart);
  const decChinese = _convertDecimal(decPart);
  let result = (negative ? '负' : '') + intChinese + '元' + decChinese;
  return { result, error: '' };
}

function _convertInteger(str) {
  if (str === '0') return '零';
  str = str.replace(/^0+/, '') || '0';
  const len = str.length;
  if (len > 15) return '';
  const groups = [];
  let i = len;
  while (i > 0) {
    const start = Math.max(0, i - 4);
    groups.push(str.substring(start, i));
    i = start;
  }
  groups.reverse();
  const resultParts = [];
  const groupCount = groups.length;
  for (let g = 0; g < groupCount; g++) {
    const groupStr = groups[g];
    const groupVal = parseInt(groupStr, 10);
    if (groupVal === 0) continue;
    const groupChinese = _convertFourDigits(groupStr);
    const unit = CN_UNITS_BIG[groupCount - 1 - g] || '';
    resultParts.push(groupChinese + unit);
  }
  let full = resultParts.join('');
  full = full.replace(/零+/g, '零');
  full = full.replace(/^零/, '');
  if (!full) return '零';
  return full;
}

function _convertFourDigits(str) {
  const num = parseInt(str, 10);
  if (num === 0) return '';
  const len = str.length;
  let result = '';
  let zeroFlag = false;
  for (let i = 0; i < len; i++) {
    const digit = parseInt(str[i], 10);
    const pos = len - 1 - i;
    if (digit === 0) {
      zeroFlag = true;
    } else {
      if (zeroFlag) {
        result += '零';
        zeroFlag = false;
      }
      result += CN_DIGITS[digit] + CN_UNITS_SMALL[pos];
    }
  }
  return result;
}

function _convertDecimal(str) {
  const jiao = parseInt(str[0], 10);
  const fen = parseInt(str[1], 10);
  if (jiao === 0 && fen === 0) return '整';
  let parts = [];
  if (jiao > 0) parts.push(CN_DIGITS[jiao] + '角');
  if (fen > 0) parts.push(CN_DIGITS[fen] + '分');
  if (jiao === 0 && fen > 0) {
    return '零' + parts.join('');
  }
  return parts.join('');
}

// ---------- 中文大写 → 数字 ----------
function chineseToNumber(chinese) {
  const cleaned = cleanChineseInput(chinese);
  if (!cleaned) {
    return { result: null, error: '请输入中文大写金额' };
  }
  let s = cleaned.replace(/[整正]$/, '');
  let yuanIndex = s.indexOf('元');
  let intPart = '', decPart = '';
  if (yuanIndex === -1) {
    if (s.includes('角') || s.includes('分')) {
      intPart = '零';
      decPart = s;
    } else {
      intPart = s;
      decPart = '';
    }
  } else {
    intPart = s.substring(0, yuanIndex);
    decPart = s.substring(yuanIndex + 1);
  }
  if (!intPart) intPart = '零';
  const intValue = _parseIntegerPart(intPart);
  if (intValue === null) {
    return { result: null, error: '整数部分解析失败，请检查格式' };
  }
  const decValue = _parseDecimalPart(decPart);
  if (decValue === null) {
    return { result: null, error: '小数部分解析失败，请检查格式' };
  }
  const total = intValue + decValue;
  const formatted = total.toFixed(2);
  const num = parseFloat(formatted);
  return { result: num, error: '' };
}

function _parseIntegerPart(str) {
  if (!str || str === '零') return 0;
  str = str.replace(/[整正]$/, '');
  if (!str) return 0;
  const bigUnits = ['亿', '万'];
  let result = 0;
  let remaining = str;
  for (const unit of bigUnits) {
    const idx = remaining.indexOf(unit);
    if (idx !== -1) {
      const prefix = remaining.substring(0, idx);
      const suffix = remaining.substring(idx + 1);
      if (prefix) {
        const val = _parseSmallUnit(prefix);
        if (val === null) return null;
        const unitVal = (unit === '亿') ? 100000000 : 10000;
        result += val * unitVal;
      }
      remaining = suffix;
      break;
    }
  }
  if (remaining) {
    const val = _parseSmallUnit(remaining);
    if (val === null) return null;
    result += val;
  }
  return result;
}

function _parseSmallUnit(str) {
  if (!str || str === '零') return 0;
  let result = 0;
  let current = 0;
  let hasDigit = false;
  const chars = str.split('');
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (ch in DIGIT_MAP) {
      current = DIGIT_MAP[ch];
      hasDigit = true;
      i++;
      if (i < chars.length) {
        const next = chars[i];
        if (next in UNIT_MAP && UNIT_MAP[next] >= 10) {
          result += current * UNIT_MAP[next];
          current = 0;
          hasDigit = false;
          i++;
          continue;
        }
      }
      if (i === chars.length || !(chars[i] in UNIT_MAP)) {
        result += current;
        current = 0;
        hasDigit = false;
        i++;
        continue;
      }
    } else if (ch in UNIT_MAP) {
      const unitVal = UNIT_MAP[ch];
      if (unitVal >= 10) {
        result += 1 * unitVal;
      } else {
        return null;
      }
      i++;
    } else {
      return null;
    }
  }
  if (hasDigit && current > 0) {
    result += current;
  }
  return result;
}

function _parseDecimalPart(str) {
  if (!str) return 0;
  str = str.replace(/[整正]$/, '');
  if (!str) return 0;
  let result = 0;
  let i = 0;
  const chars = str.split('');
  while (i < chars.length) {
    const ch = chars[i];
    if (ch in DIGIT_MAP) {
      const digit = DIGIT_MAP[ch];
      i++;
      if (i < chars.length) {
        const next = chars[i];
        if (next === '角') {
          result += digit * 0.1;
          i++;
          continue;
        } else if (next === '分') {
          result += digit * 0.01;
          i++;
          continue;
        } else {
          if (next === '零') continue;
          return null;
        }
      } else {
        return null;
      }
    } else if (ch === '角' || ch === '分' || ch === '零') {
      i++;
      continue;
    } else {
      return null;
    }
  }
  return result;
}

// =============================================================
//  2. Vue 组合式 API 状态与方法
// =============================================================

// ---------- 状态 ----------
const numInput = ref('');
const chineseResult = ref('');
const numError = ref('');
const chineseCopied = ref(false);

const chineseInput = ref('');
const numberResult = ref(null);
const chineseError = ref('');
const numberCopied = ref(false);

const statusText = ref('就绪');
const statusClass = ref('idle');

// ---------- 方法 ----------
function setStatus(type, text) {
  statusClass.value = type;
  statusText.value = text;
}

// 数字 → 大写
function convertToChinese() {
  const raw = numInput.value.trim();
  if (!raw) {
    numError.value = '请输入数字';
    chineseResult.value = '';
    setStatus('idle', '就绪');
    return;
  }
  const cleaned = cleanNumberInput(raw);
  if (!isNumeric(cleaned)) {
    numError.value = '请输入有效的数字（如 1234.56）';
    chineseResult.value = '';
    setStatus('error', '格式错误');
    return;
  }
  const num = parseFloat(cleaned);
  const { result, error } = numberToChinese(num);
  if (error) {
    numError.value = error;
    chineseResult.value = '';
    setStatus('error', '转换失败');
  } else {
    numError.value = '';
    chineseResult.value = result;
    chineseCopied.value = false;
    setStatus('success', '转换成功');
  }
}

function clearNumber() {
  numInput.value = '';
  chineseResult.value = '';
  numError.value = '';
  chineseCopied.value = false;
  setStatus('idle', '就绪');
}

function setNumExample(val) {
  numInput.value = val;
  convertToChinese();
}

// 大写 → 数字
function convertToNumber() {
  const raw = chineseInput.value.trim();
  if (!raw) {
    chineseError.value = '请输入中文大写金额';
    numberResult.value = null;
    setStatus('idle', '就绪');
    return;
  }
  const { result, error } = chineseToNumber(raw);
  if (error) {
    chineseError.value = error;
    numberResult.value = null;
    setStatus('error', '解析失败');
  } else {
    chineseError.value = '';
    numberResult.value = result;
    numberCopied.value = false;
    setStatus('success', '解析成功 ✓');
  }
}

function clearChinese() {
  chineseInput.value = '';
  numberResult.value = null;
  chineseError.value = '';
  numberCopied.value = false;
  setStatus('idle', '就绪');
}

function setChineseExample(val) {
  chineseInput.value = val;
  convertToNumber();
}

// 复制
function copyResult(type) {
  let text = '';
  if (type === 'chinese') {
    text = chineseResult.value;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      chineseCopied.value = true;
      setTimeout(() => { chineseCopied.value = false; }, 2000);
    }).catch(() => {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      chineseCopied.value = true;
      setTimeout(() => { chineseCopied.value = false; }, 2000);
    });
  } else {
    const val = numberResult.value;
    if (val === null || val === undefined || val === '') return;
    text = String(val);
    navigator.clipboard.writeText(text).then(() => {
      numberCopied.value = true;
      setTimeout(() => { numberCopied.value = false; }, 2000);
    }).catch(() => {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      numberCopied.value = true;
      setTimeout(() => { numberCopied.value = false; }, 2000);
    });
  }
}

// ---------- 自动转换（防抖） ----------
let numTimer = null;
let chnTimer = null;

watch(numInput, (val) => {
  clearTimeout(numTimer);
  numTimer = setTimeout(() => {
    if (val.trim()) {
      convertToChinese();
    } else {
      chineseResult.value = '';
      numError.value = '';
      setStatus('idle', '就绪');
    }
  }, 400);
});

watch(chineseInput, (val) => {
  clearTimeout(chnTimer);
  chnTimer = setTimeout(() => {
    if (val.trim()) {
      convertToNumber();
    } else {
      numberResult.value = null;
      chineseError.value = '';
      setStatus('idle', '就绪');
    }
  }, 400);
});

// 暴露方法（非必须）
</script>

<style scoped lang="scss">
.app-container {
  font-family: 'Segoe UI', 'PingFang SC', Roboto, 'Helvetica Neue', sans-serif;
  color: #2c3e50;
  max-width: 2000px;
  margin: 0 auto;
}

/* ========== 头部 ========== */

.app-header {
  background: linear-gradient(135deg, #1a3a5c, #2a5f8f);
  color: #fff;
  padding: 24px 28px;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(26, 58, 92, 0.25);
}

.app-header-inner {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  font-size: 26px;
  font-weight: 600;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-header h1 small {
  font-size: 16px;
  font-weight: 400;
  opacity: 0.8;
  margin-left: 12px;
}

/* ========== 双栏布局 ========== */
.converter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 6px;
}

@media (max-width: 680px) {
  .converter-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .app-container {
    padding: 24px 18px 30px;
  }

  .app-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;

    .badge {
      align-self: flex-start;
    }
  }
}

/* ========== 卡片（覆盖 el-card 样式） ========== */
.card {
  border: 1px solid #e9eef3;
  transition: border-color 0.2s, box-shadow 0.2s;

  :deep(.el-card__header) {
    padding: 18px 24px 0 24px;
    border-bottom: none;
  }

  :deep(.el-card__body) {
    padding: 16px 24px 24px;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;

    .arrow-icon {
      font-size: 20px;
      color: #2a5c8a;
    }

    h3 {
      font-size: 17px;
      font-weight: 600;
      color: #0a1a2b;
      letter-spacing: -0.2px;
      margin: 0;
    }
  }
}

/* ========== 表单元素 ========== */
.input-group {
  margin-bottom: 14px;

  label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #3d4f66;
    margin-bottom: 5px;
  }

  textarea,
  input {
    width: 100%;
    padding: 12px 16px;
    font-size: 16px;
    font-family: 'SF Mono', 'Menlo', 'Monaco', 'Cascadia Code', monospace;
    border: 1.5px solid #dce3ec;
    border-radius: 12px;
    background: #ffffff;
    color: #0a1a2b;
    transition: border-color 0.2s, box-shadow 0.2s;
    resize: vertical;
    min-height: 64px;
    line-height: 1.5;
    outline: none;

    &:focus {
      border-color: #3a7bb5;
      box-shadow: 0 0 0 3px rgba(42, 92, 138, 0.10);
    }

    &::placeholder {
      color: #a5b8cc;
      font-weight: 400;
      font-size: 15px;
    }
  }

  textarea {
    min-height: 64px;
    font-family: 'Inter', -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  }
}

/* ========== 按钮组 ========== */
.action-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 22px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: #eef3f9;
  color: #1e3a5a;
  flex: 1 1 auto;
  min-width: 80px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }

  &-primary {
    background: #1a3f62;
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(26, 63, 98, 0.15);

    &:hover:not(:disabled) {
      background: #0f3250;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(26, 63, 98, 0.20);
    }

    &:active:not(:disabled) {
      transform: translateY(0px);
      box-shadow: 0 2px 6px rgba(26, 63, 98, 0.15);
    }
  }

  &-secondary {
    background: #eaf0f6;
    color: #2c4a6a;

    &:hover:not(:disabled) {
      background: #dee7f0;
    }
  }

  &-outline {
    background: transparent;
    border: 1.5px solid #cddae8;
    color: #2c4a6a;

    &:hover:not(:disabled) {
      background: #f2f6fc;
      border-color: #a5bccc;
    }
  }
}

/* ========== 结果区域 ========== */
.result-group {
  background: #ffffff;
  border-radius: 14px;
  border: 1.5px solid #e9eef3;
  padding: 14px 18px;
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  transition: border-color 0.2s;

  &.has-value {
    border-color: #b8cfe0;
    background: #f8fbfe;
  }

  .result-text {
    flex: 1;
    font-size: 16px;
    font-weight: 500;
    color: #0a1a2b;
    word-break: break-all;
    line-height: 1.6;
    min-width: 100px;
    font-family: 'Inter', -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;

    .placeholder {
      color: #a5b8cc;
      font-weight: 400;
    }
  }

  .copy-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex-shrink: 0;
    padding: 6px 14px;
    font-size: 13px;
    border-radius: 30px;
    background: #eaf0f6;
    border: none;
    color: #2c4a6a;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.15s;

    &:hover:not(:disabled) {
      background: #d6e2f0;
    }

    &.copied {
      background: #1e7b4c;
      color: #fff;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}

/* ========== 错误提示 ========== */
.error-msg {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: #c73b3b;
  background: #fef0f0;
  padding: 6px 14px;
  border-radius: 8px;
  margin-top: 8px;
  border: 1px solid #fad4d4;
}

/* ========== 示例按钮 ========== */
.example-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #e2e9f0;

  .label {
    font-size: 13px;
    color: #6b7a8f;
    font-weight: 500;
    margin-right: 4px;
    display: flex;
    align-items: center;
  }

  .example-btn {
    padding: 4px 14px;
    font-size: 13px;
    border-radius: 30px;
    border: 1px solid #dce3ec;
    background: #ffffff;
    color: #2c4a6a;
    cursor: pointer;
    transition: all 0.12s;
    font-weight: 450;

    &:hover {
      background: #eaf0f6;
      border-color: #b8cfe0;
    }
  }
}

/* ========== 页脚 ========== */
.app-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  border-top: 1px solid #eef3f8;
  padding-top: 20px;

  .text-muted {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 13px;
    color: #7a8ca0;
  }

  .status-line {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 4px;

    &.idle {
      background: #c5d2e0;
    }

    &.success {
      background: #1e7b4c;
    }

    &.error {
      background: #c73b3b;
    }
  }
}
</style>