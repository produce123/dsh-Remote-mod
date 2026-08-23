/* DSH Remote prompt 转写核心纯逻辑: 密钥掩码 / 固定 System Prompt / 状态码错误文案
 * 浏览器全局 window.TranscribeCore + Node CommonJS 双形态(与 history-core.js 同模式),
 * app.js 与 tests/transcribe-core.test.js 共用。
 * SystemPrompt 面向豆包等通用助手, 要求把用户原始文字改写为分条分点、逻辑清晰、
 * 修正语句/错别字、删除无意义口语语气词、可直接使用的提示词。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory()
  else root.TranscribeCore = factory()
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'

  const TRANSCRIBE_SYSTEM_PROMPT = [
    '你是文本整理助手。请把用户发来的原始文字改写成一条可直接使用的提示词，要求：',
    '1. 分条分点：把内容按要点拆成编号列表，层次清晰；',
    '2. 逻辑清晰：按「目标—背景—要求—输出」的顺序整理，删除冗余重复；',
    '3. 修正语句与错别字：修正病句、错别字、标点与大小写问题；',
    '4. 删除无意义口语语气词：去掉「那个、就是说、嗯、啊、然后」等口头禅；',
    '5. 保留原意：不增删核心信息，不擅自补充额外要求；',
    '6. 直接输出改写结果，不解释、不客套。'
  ].join('\n')

  /* API 密钥掩码: 前4位 + **** + 后4位, 过短时只保留后4位 */
  function maskApiKey(key) {
    if (!key) return ''
    if (key.length <= 8) return '****' + String(key).slice(-4)
    return String(key).slice(0, 4) + '****' + String(key).slice(-4)
  }

  /* OpenAI 兼容接口 HTTP 状态码 → 用户可读失败原因(中文) */
  function statusMessage(status) {
    if (status === 401 || status === 403) return '认证失败：API 密钥无效或无权限（' + status + '）'
    if (status === 404) return '接口不存在：请检查 API 地址是否以 /v1 结尾（' + status + '）'
    if (status === 429) return '请求过于频繁或额度不足（' + status + '）'
    if (status >= 500) return '服务端错误（' + status + '）'
    return '请求失败（HTTP ' + status + '）'
  }

  return { TRANSCRIBE_SYSTEM_PROMPT, maskApiKey, statusMessage }
})