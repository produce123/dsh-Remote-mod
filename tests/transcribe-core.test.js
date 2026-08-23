'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const TC = require('../public/transcribe-core.js')

test('maskApiKey: 前4位 + **** + 后4位', () => {
  assert.equal(TC.maskApiKey('0123456789'), '0123****6789')
  assert.equal(TC.maskApiKey('sk-abcdefghijklmnop'), 'sk-a****mnop')
  assert.equal(TC.maskApiKey(''), '')
  assert.equal(TC.maskApiKey('abcdefgh'), '****efgh')
})

test('TRANSCRIBE_SYSTEM_PROMPT: 覆盖全部改写要求', () => {
  const p = TC.TRANSCRIBE_SYSTEM_PROMPT
  for (const kw of ['分条分点', '逻辑清晰', '错别字', '口语语气词', '保留原意', '直接输出']) {
    assert.ok(p.includes(kw), '缺少关键词: ' + kw)
  }
})

test('statusMessage: 常见状态码映射', () => {
  assert.match(TC.statusMessage(400), /请求参数错误/)
  assert.match(TC.statusMessage(401), /认证失败/)
  assert.match(TC.statusMessage(403), /认证失败/)
  assert.match(TC.statusMessage(404), /v1/)
  assert.match(TC.statusMessage(429), /频繁/)
  assert.match(TC.statusMessage(503), /服务端错误/)
  assert.equal(TC.statusMessage(200), '请求失败（HTTP 200）')
})

test('parseSseData: 增量 delta / [DONE] / 错误 / 噪声行', () => {
  // 标准 OpenAI 兼容流式帧
  assert.deepEqual(
    TC.parseSseData('data: {"choices":[{"delta":{"content":"你好"}}]}'),
    { type: 'delta', text: '你好' }
  )
  // 带前缀空格/多余空白的 data: 行
  assert.deepEqual(
    TC.parseSseData('  data:  {"choices":[{"delta":{"content":"世界"}}]}  '),
    { type: 'delta', text: '世界' }
  )
  // 结束帧
  assert.deepEqual(TC.parseSseData('data: [DONE]'), { type: 'done' })
  // 错误帧(OpenAI error envelope)
  const err = TC.parseSseData('data: {"error":{"message":"Insufficient quota","code":429}}')
  assert.equal(err.type, 'error')
  assert.match(err.error, /Insufficient quota/)
  // 无 error.code 时回退到状态码文案
  assert.equal(TC.parseSseData('data: {"error":{"message":"boom"}}').type, 'error')
  // usage / finish_reason-only 等无内容帧 → skip, 不杀流
  assert.deepEqual(TC.parseSseData('data: {"choices":[{"finish_reason":"stop"}]}'), { type: 'skip' })
  assert.deepEqual(TC.parseSseData('data: {"usage":{"total_tokens":10}}'), { type: 'skip' })
  // 非 JSON / 注释 / 空行 → skip
  assert.deepEqual(TC.parseSseData(': keep-alive comment'), { type: 'skip' })
  assert.deepEqual(TC.parseSseData('data: not-json'), { type: 'skip' })
  assert.deepEqual(TC.parseSseData(''), { type: 'skip' })
})