/* DSH Remote 会话历史核心纯逻辑: 追加/去重/排序/裁剪
 * 浏览器全局 window.HistoryCore + Node CommonJS 双形态(与 md.js 同模式),
 * app.js 与 tests/history.test.js 共用, 保证大会话路径在测试中可被真实驱动。
 * 裁剪语义: 只从最旧一侧砍掉超出 maxVisible 的部分, 并同步从其 seq 集合移除。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory()
  else root.HistoryCore = factory()
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'

  const MAX_VISIBLE = 5000

  /* 追加一页事件到 visible: 去重(seq) → keep 过滤 → 排序 → 裁剪最旧。
   * rows 形如 [{ event }] 或 [event]; keep(ev) 返回 false 的事件不保留。
   * 返回 { added, dropped }: added=新入可见数; dropped=本次裁掉的最旧条数
   * (app.js 用它同步渲染窗口游标 renderStart/renderEnd)。 */
  function append(seqs, visible, rows, maxVisible, keep) {
    maxVisible = maxVisible || MAX_VISIBLE
    let added = 0
    for (const row of rows) {
      const ev = row && row.event ? row.event : row
      if (!ev || ev.seq == null || seqs.has(ev.seq)) continue
      if (keep && !keep(ev)) continue
      seqs.add(ev.seq)
      visible.push({ seq: ev.seq, event: ev })
      added++
    }
    visible.sort(function (a, b) { return a.seq - b.seq })
    let dropped = 0
    if (visible.length > maxVisible) {
      dropped = visible.length - maxVisible
      for (let i = 0; i < dropped; i++) {
        const e = visible[i]
        if (e && e.seq != null) seqs.delete(e.seq)
      }
      visible.splice(0, dropped)
    }
    return { added, dropped }
  }

  return { append, MAX_VISIBLE }
})