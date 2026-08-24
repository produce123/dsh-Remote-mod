'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const ReasoningCore = require('../public/reasoning-core.js')

function ev(type, data) {
  return { type, data: data || {} }
}

test('reasoning-core: assistant/chunk 增量按 turn:step:index 聚合', () => {
  const map = new Map()
  assert.equal(ReasoningCore.applyReasoningStreamEvent(map, ev('assistant/chunk', { turn: 1, step: 2, chunk: { index: 0, type: 'block-start', blockType: 'reasoning' } })), true)
  assert.equal(ReasoningCore.applyReasoningStreamEvent(map, ev('assistant/chunk', { turn: 1, step: 2, chunk: { index: 0, type: 'reasoning-delta', text: '你好' } })), true)
  assert.equal(ReasoningCore.applyReasoningStreamEvent(map, ev('assistant/chunk', { turn: 1, step: 2, chunk: { index: 0, type: 'reasoning-delta', text: '世界' } })), true)
  assert.equal(map.size, 1)
  assert.equal([...map.values()][0].text, '你好世界')
})

test('reasoning-core: block-end 用完整文本接管增量', () => {
  const map = new Map()
  ReasoningCore.applyReasoningStreamEvent(map, ev('assistant/chunk', { turn: 1, step: 1, chunk: { index: 0, type: 'reasoning-delta', text: '临时' } }))
  ReasoningCore.applyReasoningStreamEvent(map, ev('assistant/chunk', { turn: 1, step: 1, chunk: { index: 0, type: 'block-end', block: { type: 'reasoning', text: '完整思考' } } }))
  assert.equal([...map.values()][0].text, '完整思考')
})

test('reasoning-core: reasoning-chunks 数组拼接；assistant/message 清掉同 turn/step', () => {
  const map = new Map()
  ReasoningCore.applyReasoningStreamEvent(map, ev('reasoning-chunks', { turn: 3, step: 5, index: 0, texts: ['a', 'b'] }))
  ReasoningCore.applyReasoningStreamEvent(map, ev('reasoning-chunks', { turn: 3, step: 5, index: 0, text: 'c' }))
  assert.equal([...map.values()][0].text, 'abc')
  ReasoningCore.applyReasoningStreamEvent(map, ev('assistant/message', { turn: 3, step: 5 }))
  assert.equal(map.size, 0)
})

test('reasoning-core: 无关事件不变化；不同 turn 互不影响', () => {
  const map = new Map()
  assert.equal(ReasoningCore.applyReasoningStreamEvent(map, ev('user/message', { turn: 1 })), false)
  ReasoningCore.applyReasoningStreamEvent(map, ev('assistant/chunk', { turn: 1, step: 1, chunk: { index: 0, type: 'reasoning-delta', text: 'A' } }))
  ReasoningCore.applyReasoningStreamEvent(map, ev('assistant/chunk', { turn: 2, step: 1, chunk: { index: 0, type: 'reasoning-delta', text: 'B' } }))
  assert.equal(map.size, 2)
  ReasoningCore.applyReasoningStreamEvent(map, ev('assistant/message', { turn: 1, step: 1 }))
  assert.equal(map.size, 1)
  assert.equal([...map.values()][0].text, 'B')
})
