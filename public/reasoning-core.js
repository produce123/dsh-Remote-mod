/* DSH Remote 实时思考流核心 · 零依赖
 * 事件来源: DSH 以 assistant/chunk 下发实时思考增量(block-start / reasoning-delta /
 * block-end)，历史尾页可能把增量压成 reasoning-chunks；最终 assistant/message
 * 到达后由正式消息接管展示。
 * 浏览器全局 window.ReasoningCore 与 Node CommonJS module.exports 双形态。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory()
  else root.ReasoningCore = factory()
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'

  /** 同一思考流的稳定 key: turn:step:index。 */
  function reasoningStreamKey(data, index) {
    return `${data?.turn ?? '?'}:${data?.step ?? '?'}:${index ?? '?'}`
  }

  /**
   * 把事件增量并入 reasoning map(按 key 聚合文本)。
   * @param {Map} map  partialReasoning 实例
   * @param {object} event  DSH 下行事件
   * @returns {boolean} 是否发生了可渲染的变化
   */
  function applyReasoningStreamEvent(map, event) {
    const data = event?.data || {}
    let changed = false
    if (event?.type === 'assistant/chunk') {
      const chunk = data.chunk || {}
      const key = reasoningStreamKey(data, chunk.index)
      if (chunk.type === 'block-start' && chunk.blockType === 'reasoning') {
        map.set(key, { turn: data.turn, step: data.step, index: chunk.index, text: '' })
        changed = true
      } else if (chunk.type === 'reasoning-delta') {
        const item = map.get(key) || { turn: data.turn, step: data.step, index: chunk.index, text: '' }
        item.text += String(chunk.text || '')
        map.set(key, item)
        changed = true
      } else if (chunk.type === 'block-end' && chunk.block?.type === 'reasoning') {
        map.set(key, {
          turn: data.turn, step: data.step, index: chunk.index,
          text: String(chunk.block.text ?? chunk.block.content ?? '')
        })
        changed = true
      }
    } else if (event?.type === 'reasoning-chunks') {
      const key = reasoningStreamKey(data, data.index)
      const item = map.get(key) || { turn: data.turn, step: data.step, index: data.index, text: '' }
      item.text += Array.isArray(data.texts) ? data.texts.join('') : String(data.text || '')
      map.set(key, item)
      changed = true
    } else if (event?.type === 'assistant/message') {
      for (const [key, item] of map) {
        if (item.turn === data.turn && item.step === data.step) {
          map.delete(key)
          changed = true
        }
      }
    }
    return changed
  }

  return { reasoningStreamKey, applyReasoningStreamEvent }
})
