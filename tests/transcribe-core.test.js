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
  assert.match(TC.statusMessage(401), /认证失败/)
  assert.match(TC.statusMessage(403), /认证失败/)
  assert.match(TC.statusMessage(404), /v1/)
  assert.match(TC.statusMessage(429), /频繁/)
  assert.match(TC.statusMessage(503), /服务端错误/)
  assert.equal(TC.statusMessage(200), '请求失败（HTTP 200）')
})