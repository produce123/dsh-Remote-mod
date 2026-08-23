'use strict'

/**
 * 会话历史大会话路径测试: 用几万条事件按页灌入 HistoryCore.append
 * (app.js loadHistory 的真实数据通路, 每页 maxMessages=60),
 * 断言内存(visible)有上限、去重、有序、裁剪只从最旧一侧砍。
 */

const test = require('node:test')
const assert = require('node:assert/strict')
const { append, MAX_VISIBLE } = require('../public/history-core.js')

// 模拟 DSH 分页: 总 total 条事件, 每页 pageSize 条, 从尾部往前翻(beforeSeq)
function makePages(total, pageSize = 60) {
  const pages = []
  let end = total
  while (end > 0) {
    const start = Math.max(1, end - pageSize + 1)
    pages.push(Array.from({ length: end - start + 1 }, (_, i) => ({ event: { seq: start + i, type: 'message', data: {} } })))
    end = start - 1
  }
  return pages
}

test('大会话: 5 万条事件分 834 页灌入, visible 永远 ≤ 上限且有界', () => {
  const seqs = new Set()
  const visible = []
  const total = 50000
  let addedTotal = 0
  let pages = 0
  for (const page of makePages(total)) {
    pages++
    const r = append(seqs, visible, page, MAX_VISIBLE, () => true)
    addedTotal += r.added
  }
  assert.equal(pages, Math.ceil(total / 60))
  assert.equal(addedTotal, total)              // 每页都不丢合法事件
  assert.ok(visible.length <= MAX_VISIBLE)     // 内存有上限, 不会整段 5 万条驻留
  assert.equal(seqs.size, visible.length)      // seq 集合与可见列表一致(被裁掉的已移除)
  const seqArr = visible.map(e => e.seq)
  assert.deepEqual(seqArr, [...seqArr].sort((a, b) => a - b))           // 保持有序
  assert.equal(visible[0].seq, total - MAX_VISIBLE + 1)                 // 保留最新一段
  assert.equal(visible[visible.length - 1].seq, total)
  assert.ok(seqs.has(total) && !seqs.has(1))  // 最旧被裁, 最新保留
})

test('裁剪累计: 8000 条灌入 5000 上限, dropped 恰为 3000(供 app.js 收缩渲染游标)', () => {
  const seqs = new Set()
  const visible = []
  let dropped = 0
  for (const page of makePages(8000, 200)) dropped += append(seqs, visible, page, MAX_VISIBLE, () => true).dropped
  assert.equal(dropped, 3000)
  assert.equal(visible.length, MAX_VISIBLE)
})

test('keep 过滤与重复页(边界重叠): 内部事件不保留且去重不重复计数', () => {
  const seqs = new Set()
  const visible = []
  const page = [
    { event: { seq: 1, type: 'chunk', data: {} } },
    { event: { seq: 2, type: 'message', data: {} } },
    { event: { seq: 3, type: 'message', data: {} } }
  ]
  const keep = ev => ev.type !== 'chunk'
  const r1 = append(seqs, visible, page, MAX_VISIBLE, keep)
  assert.equal(r1.added, 2)
  assert.equal(r1.dropped, 0)
  const r2 = append(seqs, visible, page, MAX_VISIBLE, keep) // 同一页再灌一次(分页边界重叠)
  assert.equal(r2.added, 0)
  assert.equal(visible.length, 2)
  assert.equal(visible[0].seq, 2)
})

test('裸事件行与 null 防护', () => {
  const seqs = new Set()
  const visible = []
  const r = append(seqs, visible, [{ event: { seq: 9, type: 'message' } }, null, { seq: 10, type: 'message' }], MAX_VISIBLE)
  assert.equal(r.added, 2)
  assert.equal(visible.length, 2)
})